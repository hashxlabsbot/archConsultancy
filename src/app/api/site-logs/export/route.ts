import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/site-logs/export
// Query: month (YYYY-MM) | startDate + endDate, projectId, supervisorId
// Returns JSON with full report data for PDF rendering
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session.user as any).role;
        const userId = (session.user as any).id;
        const isSiteSupervisor = role === 'SITE_SUPERVISOR';

        const { searchParams } = new URL(req.url);
        const month = searchParams.get('month');       // YYYY-MM
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const projectId = searchParams.get('projectId');
        const supervisorId = searchParams.get('supervisorId');

        const where: any = {};

        if (isSiteSupervisor) {
            where.userId = userId;
        } else if (supervisorId) {
            where.userId = supervisorId;
        }

        if (projectId) {
            where.projectId = projectId;
        }

        if (month) {
            const [year, mon] = month.split('-').map(Number);
            where.date = { gte: new Date(year, mon - 1, 1), lt: new Date(year, mon, 1) };
        } else if (startDate && endDate) {
            const from = new Date(startDate); from.setHours(0, 0, 0, 0);
            const to = new Date(endDate); to.setHours(23, 59, 59, 999);
            where.date = { gte: from, lte: to };
        } else if (startDate) {
            const from = new Date(startDate); from.setHours(0, 0, 0, 0);
            where.date = { gte: from };
        }

        const logs = await prisma.dailySiteLog.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, designation: true } },
                project: { select: { id: true, name: true, client: true } },
            },
            orderBy: [{ projectId: 'asc' }, { userId: 'asc' }, { date: 'asc' }],
        });

        // Resolve project & supervisor display names for the report header
        let projectName: string | null = null;
        let supervisorName: string | null = null;

        if (projectId) {
            const p = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true, client: true } });
            if (p) projectName = `${p.name}${p.client ? ` (${p.client})` : ''}`;
        }
        if (supervisorId) {
            const u = await prisma.user.findUnique({ where: { id: supervisorId }, select: { name: true } });
            if (u) supervisorName = u.name;
        }

        // Build period label
        let periodLabel: string;
        if (month) {
            const [y, m] = month.split('-').map(Number);
            periodLabel = new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        } else if (startDate && endDate) {
            const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            periodLabel = `${fmt(startDate)} – ${fmt(endDate)}`;
        } else {
            periodLabel = 'All Dates';
        }

        return NextResponse.json({ logs, periodLabel, projectName, supervisorName });
    } catch (error) {
        console.error('Labour export error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
