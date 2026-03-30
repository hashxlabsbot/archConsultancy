import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { get } from '@vercel/blob';

/**
 * GET /api/blob?url=...
 * Securely proxies a private Vercel Blob to the frontend.
 * Only authenticated users can access this route.
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const blobUrl = searchParams.get('url');

        if (!blobUrl) {
            return new NextResponse('Missing blob URL', { status: 400 });
        }

        // Fetch the private blob using the SDK (which uses BLOB_READ_WRITE_TOKEN)
        const result = await get(blobUrl, { access: 'private' });

        if (!result) {
            return new NextResponse('Blob not found', { status: 404 });
        }

        // Forward the blob stream with correct headers
        return new NextResponse(result.stream, {
            headers: {
                'Content-Type': result.blob.contentType || 'application/octet-stream',
                'Cache-Control': 'private, max-age=3600',
            },
        });
    } catch (error) {
        console.error('[BlobProxy] error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
