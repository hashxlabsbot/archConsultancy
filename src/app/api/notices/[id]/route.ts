import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
