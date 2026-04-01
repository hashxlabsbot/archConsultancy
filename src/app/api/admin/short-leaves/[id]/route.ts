import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const adminId = session.user.id;
        const body = await req.json();
        const { status } = body; // 'APPROVED' or 'REJECTED'

        if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const shortLeave = await prisma.shortLeaveRequest.findUnique({
            where: { id: params.id }
        });

        if (!shortLeave) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const updatedRequest = await prisma.shortLeaveRequest.update({
            where: { id: params.id },
            data: {
                status,
                approvedById: adminId
            },
            include: { user: { select: { id: true, name: true } } },
        });

        // Notify the employee of the decision
        await prisma.notification.create({
            data: {
                userId: shortLeave.userId,
                title: status === 'APPROVED' ? 'Short Leave Approved' : 'Short Leave Rejected',
                message: status === 'APPROVED'
                    ? `Your short leave request of ${shortLeave.hoursRequested}h has been approved.`
                    : `Your short leave request of ${shortLeave.hoursRequested}h has been rejected.`,
                link: '/attendance',
            },
        });

        return NextResponse.json({ request: updatedRequest });
    } catch (error) {
        console.error('Admin Short Leave update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
