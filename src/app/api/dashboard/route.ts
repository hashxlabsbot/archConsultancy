import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/dashboard — Role-aware dashboard data
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const role = (session.user as any).role;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Common stats
        const [totalEmployees, runningProjects, completedProjects, todayAttendance, pendingLeaves] = await Promise.all([
            prisma.user.count(),
            prisma.project.count({ where: { status: { in: ['ACTIVE', 'RUNNING'] } } }),
            prisma.project.count({ where: { status: 'COMPLETED' } }),
            prisma.attendance.count({ where: { date: { gte: today } } }),
            prisma.leave.count({ where: { status: 'PENDING' } }),
        ]);

        // Role-specific data
        let myAttendance = null;
        let myLeaveBalance = null;

        if (role !== 'ADMIN' && role !== 'SENIOR') {
            myAttendance = await prisma.attendance.findFirst({
                where: { userId, date: { gte: today } },
                include: { reports: true },
            });

            const usedLeaves = await prisma.leave.count({
                where: {
                    userId,
                    status: 'APPROVED',
                    startDate: { gte: new Date(today.getFullYear(), 0, 1) },
                },
            });
            myLeaveBalance = { total: 19, used: usedLeaves, remaining: 19 - usedLeaves };
        }

        // Recent reports (for managers)
        let recentReports: any[] = [];
        let teamAttendance: any[] = [];

        if (role === 'SENIOR' || role === 'ADMIN') {
            recentReports = await prisma.report.findMany({
                take: 10,
                orderBy: { submittedAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            });

            teamAttendance = await prisma.attendance.findMany({
                where: { date: { gte: today } },
                include: {
                    user: { select: { id: true, name: true, email: true, role: true } },
                    reports: true,
                },
            });
        }

        // Missed reports count (employees who checked in but didn't submit report from past 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        const missedReports = await prisma.attendance.count({
            where: {
                date: { gte: weekAgo, lt: today },
                reportSubmitted: false,
            },
        });

        return NextResponse.json({
            stats: { totalEmployees, runningProjects, completedProjects, todayAttendance, pendingLeaves, missedReports },
            myAttendance,
            myLeaveBalance,
            recentReports,
            teamAttendance,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
