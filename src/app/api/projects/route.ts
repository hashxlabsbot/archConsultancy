import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects — List all projects
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const where: any = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { client: { contains: search } },
            ];
        }

        const projects = await prisma.project.findMany({
            where,
            include: {
                owner: { select: { id: true, name: true, email: true, role: true } },
                _count: { select: { documents: true, members: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ projects });
    } catch (error) {
        console.error('Projects list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/projects — Create project
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== 'ADMIN' && role !== 'SENIOR') {
            return NextResponse.json({ error: 'Only senior staff and admins can create projects' }, { status: 403 });
        }

        const {
            name,
            client,
            startDate,
            endDate,
            description,
            location,
            latitude,
            longitude,
            contactName,
            contactPhone,
            contactEmail,
            projectManagerId,
            status = 'RUNNING'
        } = await req.json();

        if (!name || !client || !startDate) {
            return NextResponse.json({ error: 'Name, client, and start date are required' }, { status: 400 });
        }

        const creatorId = (session.user as any).id;

        const project = await prisma.project.create({
            data: {
                name,
                client,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                description: description || null,
                location: location || null,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                contactName: contactName || null,
                contactPhone: contactPhone || null,
                contactEmail: contactEmail || null,
                status,
                ownerId: creatorId,
                projectManagerId: projectManagerId || null,
            },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                projectManager: { select: { id: true, name: true, email: true } },
            },
        });

        // Auto-add Principal Architect (Surender Singh) to every new project
        const principalArchitect = await prisma.user.findFirst({
            where: { designation: 'Principal Architect' },
            select: { id: true },
        });
        const membersToAdd: string[] = [];
        if (principalArchitect) membersToAdd.push(principalArchitect.id);
        // Also add the chosen PM if different from creator
        if (projectManagerId && projectManagerId !== creatorId && projectManagerId !== principalArchitect?.id) {
            membersToAdd.push(projectManagerId);
        }
        if (membersToAdd.length > 0) {
            await prisma.projectMember.createMany({
                data: membersToAdd.map(userId => ({ projectId: project.id, userId, role: 'MEMBER' })),
                skipDuplicates: true,
            });
        }

        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error('Project create error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
