import { NextRequest, NextResponse } from 'next/server';
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
        if (role !== 'MANAGER' && role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { action, comment } = await req.json();
        if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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

        return NextResponse.json({ leave });
    } catch (error) {
        console.error('Leave approval error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
