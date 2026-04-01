import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/blob?url=...
 * Securely proxies a private Vercel Blob to the frontend with Range support
 * (required for audio/video seeking in the browser).
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

        const { searchParams } = new URL(request.url);
        const blobUrl = searchParams.get('url');
        if (!blobUrl) return new NextResponse('Missing url', { status: 400 });

        // SSRF guard — only allow Vercel Blob Storage URLs
        let parsed: URL;
        try { parsed = new URL(blobUrl); } catch {
            return new NextResponse('Invalid url', { status: 400 });
        }
        if (!parsed.hostname.endsWith('.blob.vercel-storage.com')) {
            return new NextResponse('Invalid blob URL', { status: 400 });
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token) return new NextResponse('Storage not configured', { status: 500 });

        // Forward Range header so audio/video seeking works in browsers
        const fetchHeaders: Record<string, string> = {
            Authorization: `Bearer ${token}`,
        };
        const rangeHeader = request.headers.get('range');
        if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

        const blobRes = await fetch(blobUrl, { headers: fetchHeaders });

        // 206 Partial Content is a valid success status for range requests
        if (!blobRes.ok && blobRes.status !== 206) {
            return new NextResponse('Blob not found', { status: 404 });
        }

        const responseHeaders: Record<string, string> = {
            'Content-Type': blobRes.headers.get('content-type') || 'application/octet-stream',
            'Cache-Control': 'private, max-age=3600',
            'Accept-Ranges': 'bytes',
        };

        // Forward range response headers so the browser can seek
        const contentRange = blobRes.headers.get('content-range');
        if (contentRange) responseHeaders['Content-Range'] = contentRange;
        const contentLength = blobRes.headers.get('content-length');
        if (contentLength) responseHeaders['Content-Length'] = contentLength;

        return new NextResponse(blobRes.body, {
            status: blobRes.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('[BlobProxy]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
