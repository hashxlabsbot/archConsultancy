import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { head } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const blobUrl = searchParams.get('url');

        if (!blobUrl) {
            return new NextResponse('Missing URL', { status: 400 });
        }

        // Security check: Only allow blob.vercel-storage.com URLs
        if (!blobUrl.includes('vercel-storage.com')) {
            return new NextResponse('Invalid blob URL', { status: 403 });
        }

        const response = await fetch(blobUrl, {
            headers: {
                Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
        });
        if (!response.ok) {
            return new NextResponse('Failed to fetch blob', { status: response.status });
        }

        const blob = await response.blob();
        const headers = new Headers();

        // Pass through some key headers
        const contentType = response.headers.get('content-type');
        const contentDisposition = response.headers.get('content-disposition');

        if (contentType) headers.set('Content-Type', contentType);
        if (contentDisposition) headers.set('Content-Disposition', contentDisposition);

        // Disable caching for security
        headers.set('Cache-Control', 'no-store, must-revalidate');

        return new NextResponse(blob, {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error('[Blob Proxy Error]:', error);
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
    }
}
