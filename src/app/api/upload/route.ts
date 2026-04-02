import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';

// POST /api/upload — Upload a file to Vercel Blob, return public URL
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        console.log('[Upload] formData received');
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || 'uploads';

        if (!file) {
            console.error('[Upload] No file provided');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log('[Upload] file name:', file.name, 'size:', file.size, 'type:', file.type);
        console.log('[Upload] folder:', folder);

        // 50MB limit for architectural drawings
        if (file.size > 50 * 1024 * 1024) {
            console.error('[Upload] File too large');
            return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
        }

        const userId = (session.user as any).id;
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const blobPath = `${folder}/${userId}/${timestamp}_${safeName}`;

        console.log('[Upload] blobPath:', blobPath);

        const blob = await put(blobPath, file, {
            access: 'private',
            contentType: file.type,
        });

        console.log('[Upload] success, url:', blob.url);
        return NextResponse.json({ url: blob.url }, { status: 201 });
    } catch (error: any) {
        console.error('[Upload] error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
