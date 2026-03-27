import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/site-logs/[id] — Update a site log
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const role = (session.user as any).role;
        const { labourCount, mistriCount, notes, mediaUrls } = await req.json();

        const existing = await prisma.dailySiteLog.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Log not found' }, { status: 404 });
        }

        // Only the owner or admin can update
        if (existing.userId !== userId && role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updateData: any = {};
        if (labourCount !== undefined) updateData.labourCount = labourCount;
        if (mistriCount !== undefined) updateData.mistriCount = mistriCount;
        if (notes !== undefined) updateData.notes = notes;

        // Merge new media with existing
        if (mediaUrls && Array.isArray(mediaUrls) && mediaUrls.length > 0) {
            let existingMedia: string[] = [];
            try {
                existingMedia = existing.mediaUrls ? JSON.parse(existing.mediaUrls) : [];
            } catch { }
            updateData.mediaUrls = JSON.stringify([...existingMedia, ...mediaUrls]);
        }

        const log = await prisma.dailySiteLog.update({
            where: { id: params.id },
            data: updateData,
            include: {
                user: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ log });
    } catch (error) {
        console.error('Site log update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/site-logs/[id] — Delete a site log
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const role = (session.user as any).role;

        const existing = await prisma.dailySiteLog.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Log not found' }, { status: 404 });
        }

        if (existing.userId !== userId && role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.dailySiteLog.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Site log delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
