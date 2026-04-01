import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

// POST /api/projects/[id]/documents — Upload document to Vercel Blob
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const tags = formData.get('tags') as string || '';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 });
        }

        const project = await prisma.project.findUnique({ where: { id: params.id } });
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Versioning: find highest existing version for same filename
        const existingDoc = await prisma.document.findFirst({
            where: { projectId: params.id, filename: file.name },
            orderBy: { version: 'desc' },
        });
        const version = existingDoc ? existingDoc.version + 1 : 1;

        // Upload to Vercel Blob
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const blobPath = `projects/${params.id}/v${version}_${safeName}`;
        const blob = await put(blobPath, file, {
            access: 'public',
            contentType: file.type,
        });

        const document = await prisma.document.create({
            data: {
                projectId: params.id,
                filename: file.name,
                storagePath: blob.url,
                version,
                uploadedBy: (session.user as any).id,
                tags: tags || null,
                mimeType: file.type,
                size: file.size,
            },
            include: {
                uploader: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ document }, { status: 201 });
    } catch (error: any) {
        console.error('Document upload error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// GET /api/projects/[id]/documents
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const documents = await prisma.document.findMany({
            where: { projectId: params.id },
            include: {
                uploader: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ documents });
    } catch (error) {
        console.error('Documents list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
