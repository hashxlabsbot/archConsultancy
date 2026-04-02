import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/leaves/[id] — Approve/reject leave
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== 'SENIOR' && role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { action, comment } = await req.json();
        if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const existingLeave = await prisma.leave.findUnique({ where: { id: params.id } });
        if (!existingLeave) {
            return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
        }
        if (existingLeave.status !== 'PENDING') {
            return NextResponse.json({ error: `Leave already ${existingLeave.status.toLowerCase()}` }, { status: 409 });
        }

        const leave = await prisma.leave.update({
            where: { id: params.id },
            data: {
                status: action,
                approvedBy: (session.user as any).id,
                comment: comment || null,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        const isApproved = action === 'APPROVED';
        const startStr = new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const endStr = new Date(leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const dateRange = startStr === endStr ? startStr : `${startStr} – ${endStr}`;

        if (isApproved) {
            // Notify ALL employees (except the one on leave) about who will be absent
            const allEmployees = await prisma.user.findMany({
                where: { id: { not: leave.user.id } },
                select: { id: true },
            });
            await prisma.notification.createMany({
                data: allEmployees.map((emp) => ({
                    userId: emp.id,
                    title: `${leave.user.name} is on Leave`,
                    message: `${leave.user.name} has approved ${leave.type.toLowerCase()} leave on ${dateRange}.`,
                    link: '/dashboard',
                })),
            });
        }

        // Notify the employee about their leave decision
        await prisma.notification.create({
            data: {
                userId: leave.user.id,
                title: isApproved ? 'Leave Approved' : 'Leave Rejected',
                message: isApproved
                    ? `Your leave request for ${dateRange} has been approved.${comment ? ` Note: ${comment}` : ''}`
                    : `Your leave request for ${dateRange} has been rejected.${comment ? ` Reason: ${comment}` : ''}`,
                link: '/leaves',
            },
        });

        return NextResponse.json({ leave });
    } catch (error) {
        console.error('Leave approval error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
