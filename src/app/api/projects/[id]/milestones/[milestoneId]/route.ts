import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string, milestoneId: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { title, description, status, sequence, dueDate, assigneeId, reviewerId } = body;

        const data: any = {};
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;
        if (status !== undefined) data.status = status;
        if (sequence !== undefined) data.sequence = sequence;
        if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
        if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
        if (reviewerId !== undefined) data.reviewerId = reviewerId || null;

        const milestone = await prisma.milestone.update({
            where: { id: params.milestoneId },
            data,
            include: {
                assignee: { select: { id: true, name: true, avatar: true } },
                reviewer: { select: { id: true, name: true, avatar: true } },
            }
        });

        return NextResponse.json({ success: true, milestone });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, milestoneId: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await prisma.milestone.delete({ where: { id: params.milestoneId } });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
    }
}
