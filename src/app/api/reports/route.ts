import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/reports — Submit daily report → unlocks checkout
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const userName = session.user.name || 'An Employee';
        const { tasks, blockers, nextPlan, projectId, imageUrl } = await req.json();

        if (!tasks || tasks.trim().length === 0) {
            return NextResponse.json({ error: 'Tasks field is required' }, { status: 400 });
        }

        // Find today's attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findFirst({
            where: { userId, date: { gte: today } },
        });

        if (!attendance) {
            return NextResponse.json(
                { error: 'You must check in before submitting a report' },
                { status: 400 }
            );
        }

        // Create report
        const report = await prisma.report.create({
            data: {
                attendanceId: attendance.id,
                userId,
                tasks,
                blockers: blockers || null,
                nextPlan: nextPlan || null,
                projectId: projectId || null,
                imageUrl: imageUrl || null,
            },
        });

        // Notify Admins if assigned to a project
        if (projectId) {
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (project) {
                const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
                if (admins.length > 0) {
                    await Promise.all(admins.map((admin: any) =>
                        prisma.notification.create({
                            data: {
                                userId: admin.id,
                                title: 'New Project Report',
                                message: `${userName} submitted a daily report for project "${project.name}".`,
                                link: '/reports',
                            }
                        })
                    ));
                }
            }
        }

        // 🔓 Set reportSubmitted flag → unlocks checkout
        await prisma.attendance.update({
            where: { id: attendance.id },
            data: { reportSubmitted: true },
        });

        return NextResponse.json({ report }, { status: 201 });
    } catch (error) {
        console.error('Report submit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/reports — List reports
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const role = (session.user as any).role;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where = (role !== 'ADMIN' && role !== 'SENIOR') ? { userId } : {};

        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true, role: true } },
                    attendance: true,
                    project: true
                },
                orderBy: { submittedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.report.count({ where }),
        ]);

        return NextResponse.json({
            reports,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Reports list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
