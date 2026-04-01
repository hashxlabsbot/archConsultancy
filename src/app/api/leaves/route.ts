import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/leaves — Apply for leave
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = (session.user as any).role;
        if (userRole === 'ADMIN') {
            return NextResponse.json({ error: 'Admin users cannot apply for leaves' }, { status: 403 });
        }

        const userId = (session.user as any).id;
        const { type, startDate, endDate, reason } = await req.json();

        if (!startDate || !endDate || !reason) {
            return NextResponse.json({ error: 'Start date, end date, and reason are required' }, { status: 400 });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            return NextResponse.json({ error: 'End date cannot be before start date' }, { status: 400 });
        }

        // Check for overlapping APPROVED or PENDING leaves
        const conflict = await prisma.leave.findFirst({
            where: {
                userId,
                status: { in: ['APPROVED', 'PENDING'] },
                startDate: { lte: end },
                endDate: { gte: start },
            },
        });

        if (conflict) {
            return NextResponse.json({
                error: `You already have a ${conflict.status.toLowerCase()} leave request overlapping these dates (${new Date(conflict.startDate).toLocaleDateString('en-IN')} – ${new Date(conflict.endDate).toLocaleDateString('en-IN')})`,
            }, { status: 409 });
        }

        const leave = await prisma.leave.create({
            data: {
                userId,
                type: type || 'FULL',
                startDate: start,
                endDate: end,
                reason,
            },
            include: { user: { select: { name: true } } },
        });

        // Notify all admins about the leave request
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
        await prisma.notification.createMany({
            data: admins.map((admin) => ({
                userId: admin.id,
                title: 'New Leave Request',
                message: `${leave.user.name} has applied for ${leave.type.toLowerCase()} leave from ${new Date(startDate).toLocaleDateString('en-IN')} to ${new Date(endDate).toLocaleDateString('en-IN')}.`,
                link: '/leaves',
            })),
        });

        return NextResponse.json({ leave }, { status: 201 });
    } catch (error) {
        console.error('Leave apply error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/leaves — List leaves
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const role = (session.user as any).role;
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const where: any = {};
        if (role !== 'ADMIN' && role !== 'SENIOR') where.userId = userId;
        if (status) where.status = status;

        const leaves = await prisma.leave.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
                approver: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate balance (company policy: 19 leaves per year)
        const [approvedCount, currentUser] = await Promise.all([
            prisma.leave.count({
                where: {
                    userId,
                    status: 'APPROVED',
                    startDate: { gte: new Date(new Date().getFullYear(), 0, 1) },
                },
            }),
            (prisma.user.findUnique({ where: { id: userId } }) as any),
        ]);

        const adjustment = currentUser?.leaveAdjustment ?? 0;
        const used = approvedCount + adjustment;

        return NextResponse.json({
            leaves,
            balance: { total: 19, used, remaining: Math.max(0, 19 - used) },
        });
    } catch (error) {
        console.error('Leaves list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
