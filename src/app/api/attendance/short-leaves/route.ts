import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const requests = await prisma.shortLeaveRequest.findMany({
            where: {
                userId,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            orderBy: { date: 'desc' }
        });

        // Calculate hours used/pending this month
        let usedHours = 0;
        requests.forEach((req: any) => {
            if (req.status === 'APPROVED' || req.status === 'PENDING') {
                usedHours += req.hoursRequested;
            }
        });

        return NextResponse.json({ requests, usedHours, quota: 11 });

    } catch (error) {
        console.error('Short Leaves GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();
        const { date, hoursRequested, reason } = body;

        if (!date || !hoursRequested || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (hoursRequested <= 0 || hoursRequested > 11) {
            return NextResponse.json({ error: 'Invalid hours requested (must be between 0.1 and 11)' }, { status: 400 });
        }

        // Validate monthly quota
        const requestDate = new Date(date);

        // Ensure requestDate is Today or Tomorrow only
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const reqStr = requestDate.toISOString().split('T')[0];

        if (reqStr !== todayStr && reqStr !== tomorrowStr) {
            return NextResponse.json({ error: 'You can only request short leave for today or tomorrow.' }, { status: 400 });
        }

        // Ensure requestDate is not on an existing leave day
        const requestDayStart = new Date(reqStr + "T00:00:00.000Z");
        const requestDayEnd = new Date(reqStr + "T23:59:59.999Z");

        const overlappingLeave = await prisma.leave.findFirst({
            where: {
                userId,
                status: { in: ['APPROVED', 'PENDING'] },
                startDate: { lte: requestDayEnd },
                endDate: { gte: requestDayStart }
            }
        });

        if (overlappingLeave) {
            return NextResponse.json({ error: `Cannot request short leave on a scheduled leave date (${overlappingLeave.type} leave).` }, { status: 400 });
        }

        const startOfMonth = new Date(requestDate.getFullYear(), requestDate.getMonth(), 1);
        const endOfMonth = new Date(requestDate.getFullYear(), requestDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const existingRequests = await prisma.shortLeaveRequest.findMany({
            where: {
                userId,
                date: { gte: startOfMonth, lte: endOfMonth },
                status: { in: ['APPROVED', 'PENDING'] }
            }
        });

        const totalUsed = existingRequests.reduce((sum: number, r: any) => sum + r.hoursRequested, 0);

        if (totalUsed + hoursRequested > 11) {
            return NextResponse.json(
                { error: `Quota exceeded! You have ${11 - totalUsed} hours remaining this month.` },
                { status: 400 }
            );
        }

        const newRequest = await prisma.shortLeaveRequest.create({
            data: {
                userId,
                date: requestDate,
                hoursRequested,
                reason,
                status: 'PENDING'
            },
            include: { user: { select: { name: true } } },
        });

        // Notify all admins about the short leave request
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
        await prisma.notification.createMany({
            data: admins.map((admin) => ({
                userId: admin.id,
                title: 'Short Leave Request',
                message: `${newRequest.user.name} has requested ${hoursRequested}h short leave on ${new Date(date).toLocaleDateString('en-IN')}. Reason: ${reason}`,
                link: '/admin-attendance',
            })),
        });

        return NextResponse.json({ request: newRequest });

    } catch (error) {
        console.error('Short Leaves POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
