import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const milestones = await prisma.milestone.findMany({
            where: { projectId: params.id },
            orderBy: { sequence: 'asc' },
            include: {
                assignee: { select: { id: true, name: true, avatar: true } },
                reviewer: { select: { id: true, name: true, avatar: true } },
            }
        });

        return NextResponse.json({ milestones });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { title, description, status, dueDate, assigneeId, reviewerId } = body;

        if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

        // Get max sequence
        const existing = await prisma.milestone.findMany({
            where: { projectId: params.id },
            orderBy: { sequence: 'desc' },
            take: 1
        });
        const sequence = existing.length > 0 ? existing[0].sequence + 1 : 0;

        const milestone = await prisma.milestone.create({
            data: {
                projectId: params.id,
                title,
                description,
                status: status || 'TODO',
                sequence,
                dueDate: dueDate ? new Date(dueDate) : null,
                assigneeId: assigneeId || null,
                reviewerId: reviewerId || null,
            },
            include: {
                assignee: { select: { id: true, name: true, avatar: true } },
                reviewer: { select: { id: true, name: true, avatar: true } },
            }
        });

        return NextResponse.json({ success: true, milestone });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
    }
}
