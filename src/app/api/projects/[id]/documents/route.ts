import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/projects/[id]/documents — Upload document
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

        // Check project exists
        const project = await prisma.project.findUnique({ where: { id: params.id } });
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Check for existing document with same filename for versioning
        const existingDoc = await prisma.document.findFirst({
            where: { projectId: params.id, filename: file.name },
            orderBy: { version: 'desc' },
        });

        const version = existingDoc ? existingDoc.version + 1 : 1;

        // Save file to local storage
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', params.id);
        await mkdir(uploadDir, { recursive: true });

        const filename = `v${version}_${file.name}`;
        const filePath = path.join(uploadDir, filename);
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        const storagePath = `/uploads/${params.id}/${filename}`;

        const document = await prisma.document.create({
            data: {
                projectId: params.id,
                filename: file.name,
                storagePath,
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
    } catch (error) {
        console.error('Document upload error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
