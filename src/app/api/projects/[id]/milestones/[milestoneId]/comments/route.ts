import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string; milestoneId: string } };

// GET — fetch all comments for a milestone
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const comments = await prisma.milestoneComment.findMany({
            where: { milestoneId: params.milestoneId },
            include: {
                user: { select: { id: true, name: true, avatar: true, designation: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json({ comments });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

// POST — add a comment
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { content } = await req.json();
        if (!content?.trim()) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });

        const comment = await prisma.milestoneComment.create({
            data: {
                milestoneId: params.milestoneId,
                userId: (session.user as any).id,
                content: content.trim(),
            },
            include: {
                user: { select: { id: true, name: true, avatar: true, designation: true } },
            },
        });

        return NextResponse.json({ comment }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }
}
