import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/reports/[id] — Manager comment/sign-off
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== 'MANAGER' && role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { managerComment } = await req.json();
        const managerId = (session.user as any).id;

        const report = await prisma.report.update({
            where: { id: params.id },
            data: {
                managerComment,
                signedOffBy: managerId,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                attendance: { select: { date: true } },
            },
        });

        // Notify the employee that their report received a comment
        await prisma.notification.create({
            data: {
                userId: report.user.id,
                title: 'Report Feedback Received',
                message: `Your daily report has been reviewed. Feedback: "${managerComment}"`,
                link: '/reports',
            },
        });

        return NextResponse.json({ report });
    } catch (error) {
        console.error('Report comment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
