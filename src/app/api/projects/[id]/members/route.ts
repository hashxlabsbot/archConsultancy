import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id]/members/eligible
// Get users who are not yet members of this project
// We can just return all users for simplicity and filter on the frontend,
// but handling it here is cleaner.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const projectId = params.id;
        
        // Find users who are NOT in the project
        const eligibleUsers = await prisma.user.findMany({
            where: {
                projectMembers: {
                    none: {
                        projectId
                    }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                skills: true,
            }
        });

        return NextResponse.json({ users: eligibleUsers });
    } catch (error) {
        console.error('Fetch eligible members error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/projects/[id]/members
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const projectId = params.id;
        const { userId, role } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Verify project exists and user is ADMIN/MANAGER or Owner
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const userRole = (session.user as any).role;
        const _userId = (session.user as any).id;
        if (userRole !== 'ADMIN' && userRole !== 'SENIOR' && project.ownerId !== _userId) {
             return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Create member
        const member = await prisma.projectMember.create({
            data: {
                projectId,
                userId,
                role: role || 'MEMBER'
            },
            include: {
                user: { select: { id: true, name: true, email: true, role: true, avatar: true } }
            }
        });

        return NextResponse.json({ member }, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
             return NextResponse.json({ error: 'User is already a member of this project' }, { status: 409 });
        }
        console.error('Add project member error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
