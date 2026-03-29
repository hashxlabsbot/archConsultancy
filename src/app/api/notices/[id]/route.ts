import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH — mark a single notice as read for the current user
export async function PATCH(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = (session.user as any).id;
        await prisma.noticeRead.upsert({
            where: { noticeId_userId: { noticeId: params.id, userId } },
            update: {},
            create: { noticeId: params.id, userId },
        });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Notices PATCH]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE — admin removes a notice
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const role = (session.user as any).role;
        if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        await prisma.notice.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Notices DELETE]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
