import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const project = await prisma.project.findUnique({
            where: { id: params.id },
            include: {
                owner: { select: { id: true, name: true, email: true, role: true } },
                projectManager: { select: { id: true, name: true, email: true, role: true, designation: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true, designation: true } },
                    },
                },
                documents: {
                    include: {
                        uploader: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({ project });
    } catch (error) {
        console.error('Project detail error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/projects/[id]
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const updateData: any = {};

        if (data.name) updateData.name = data.name;
        if (data.client) updateData.client = data.client;
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);
        if (data.description !== undefined) updateData.description = data.description;
        if (data.location !== undefined) updateData.location = data.location;
        if (data.latitude !== undefined) updateData.latitude = data.latitude !== null ? parseFloat(data.latitude) : null;
        if (data.longitude !== undefined) updateData.longitude = data.longitude !== null ? parseFloat(data.longitude) : null;
        if (data.contactName !== undefined) updateData.contactName = data.contactName;
        if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone;
        if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
        if (data.status) updateData.status = data.status;
        if (data.projectManagerId !== undefined) updateData.projectManagerId = data.projectManagerId || null;

        const project = await prisma.project.update({
            where: { id: params.id },
            data: updateData,
            include: {
                owner: { select: { id: true, name: true, email: true } },
                projectManager: { select: { id: true, name: true, email: true, designation: true } },
            },
        });

        return NextResponse.json({ project });
    } catch (error) {
        console.error('Project update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
