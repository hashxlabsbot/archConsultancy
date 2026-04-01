import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/dashboard — Role-aware dashboard data
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const role = (session.user as any).role;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Common stats
        const [totalEmployees, runningProjects, completedProjects, todayAttendance, pendingLeaves] = await Promise.all([
            prisma.user.count(),
            prisma.project.count({ where: { status: { in: ['ACTIVE', 'RUNNING'] } } }),
            prisma.project.count({ where: { status: 'COMPLETED' } }),
            prisma.attendance.count({ where: { date: { gte: today } } }),
            prisma.leave.count({ where: { status: 'PENDING' } }),
        ]);

        // Today's approved leaves (employees on leave today)
        const todayOnLeave = await prisma.leave.findMany({
            where: {
                status: 'APPROVED',
                startDate: { lte: today },
                endDate: { gte: today },
            },
            include: {
                user: { select: { id: true, name: true, role: true, designation: true } },
            },
        });

        // Role-specific data
        let myAttendance = null;
        let myLeaveBalance = null;

        if (role !== 'ADMIN' && role !== 'SENIOR') {
            myAttendance = await prisma.attendance.findFirst({
                where: { userId, date: { gte: today } },
                include: { reports: true },
            });

            const [usedLeaves, currentUser] = await Promise.all([
                prisma.leave.count({
                    where: {
                        userId,
                        status: 'APPROVED',
                        startDate: { gte: new Date(today.getFullYear(), 0, 1) },
                    },
                }),
                prisma.user.findUnique({ where: { id: userId } }) as any,
            ]);
            const adjustment = (currentUser as any)?.leaveAdjustment ?? 0;
            const totalUsed = usedLeaves + adjustment;
            myLeaveBalance = { total: 19, used: totalUsed, remaining: Math.max(0, 19 - totalUsed) };
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
            todayOnLeave: todayOnLeave.map((l) => ({
                id: l.id,
                userId: l.userId,
                name: l.user.name,
                role: l.user.role,
                designation: (l.user as any).designation,
                type: l.type,
                startDate: l.startDate,
                endDate: l.endDate,
            })),
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
