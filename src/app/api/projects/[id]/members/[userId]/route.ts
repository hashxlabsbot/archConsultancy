import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/projects/[id]/members/[userId]
export async function DELETE(req: NextRequest, { params }: { params: { id: string, userId: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const projectId = params.id;
        const memberUserId = params.userId;

        // Verify project exists and user is ADMIN/MANAGER or Owner
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const sessionRole = (session.user as any).role;
        const sessionUserId = (session.user as any).id;
        if (sessionRole !== 'ADMIN' && sessionRole !== 'MANAGER' && project.ownerId !== sessionUserId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Project Owner cannot be removed from project members
        if (project.ownerId === memberUserId) {
            return NextResponse.json({ error: 'Cannot remove project owner from team' }, { status: 403 });
        }

        // Find member
        const member = await prisma.projectMember.findFirst({
            where: {
                projectId,
                userId: memberUserId
            }
        });

        if (!member) {
            return NextResponse.json({ error: 'Member not found in this project' }, { status: 404 });
        }

        // Delete member
        await prisma.projectMember.delete({
            where: { id: member.id }
        });

        return NextResponse.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Remove project member error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
