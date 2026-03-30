import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/site-logs — List daily site logs
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const role = (session.user as any).role;
        const { searchParams } = new URL(req.url);
        const dateFilter = searchParams.get('date');
        const projectId = searchParams.get('projectId');

        const where: any = {};

        // Site supervisors only see their own logs
        if (role === 'SITE_SUPERVISOR') {
            where.userId = userId;
        }

        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            filterDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(filterDate);
            nextDay.setDate(nextDay.getDate() + 1);
            where.date = { gte: filterDate, lt: nextDay };
        }

        if (projectId) {
            where.projectId = projectId;
        }

        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '25')));
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.dailySiteLog.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true, role: true } },
                    project: { select: { id: true, name: true, client: true } },
                },
                orderBy: { date: 'desc' },
                skip,
                take: limit,
            }),
            prisma.dailySiteLog.count({ where }),
        ]);

        // Also fetch projects for the dropdown
        let projects;
        if (role === 'SITE_SUPERVISOR') {
            // Get projects where the site supervisor is a member
            const memberships = await prisma.projectMember.findMany({
                where: { userId },
                include: { project: { select: { id: true, name: true, client: true, status: true } } },
            });
            projects = memberships.map(m => m.project);
            // Also get projects they own (edge case)
            const ownedProjects = await prisma.project.findMany({
                where: { ownerId: userId },
                select: { id: true, name: true, client: true, status: true },
            });
            const allProjectIds = new Set(projects.map(p => p.id));
            ownedProjects.forEach(p => {
                if (!allProjectIds.has(p.id)) projects.push(p);
            });
            // If no assigned projects, return all active projects
            if (projects.length === 0) {
                projects = await prisma.project.findMany({
                    where: { status: 'ACTIVE' },
                    select: { id: true, name: true, client: true, status: true },
                });
            }
        } else {
            projects = await prisma.project.findMany({
                where: { status: 'ACTIVE' },
                select: { id: true, name: true, client: true, status: true },
            });
        }

        return NextResponse.json({
            logs,
            projects,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Site logs fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/site-logs — Create or update a daily site log
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { projectId, masonCount, coolieCount, helperCount, notes, mediaUrls } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Project is required' }, { status: 400 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if a log already exists for this user + project + today → update it
        const existing = await prisma.dailySiteLog.findUnique({
            where: {
                userId_projectId_date: {
                    userId,
                    projectId,
                    date: today,
                },
            },
        });

        let log;
        if (existing) {
            // Merge media: add new media to existing
            let mergedMedia: string[] = [];
            try {
                mergedMedia = existing.mediaUrls ? JSON.parse(existing.mediaUrls) : [];
            } catch { }
            if (mediaUrls && Array.isArray(mediaUrls)) {
                mergedMedia = [...mergedMedia, ...mediaUrls];
            }

            log = await prisma.dailySiteLog.update({
                where: { id: existing.id },
                data: {
                    masonCount: masonCount ?? existing.masonCount,
                    coolieCount: coolieCount ?? existing.coolieCount,
                    helperCount: helperCount ?? existing.helperCount,
                    notes: notes ?? existing.notes,
                    mediaUrls: JSON.stringify(mergedMedia),
                },
                include: {
                    project: { select: { id: true, name: true } },
                },
            });
        } else {
            log = await prisma.dailySiteLog.create({
                data: {
                    userId,
                    projectId,
                    date: today,
                    masonCount: masonCount || 0,
                    coolieCount: coolieCount || 0,
                    helperCount: helperCount || 0,
                    notes: notes || '',
                    mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : '[]',
                },
                include: {
                    project: { select: { id: true, name: true } },
                },
            });
        }

        // Mark attendance as reportSubmitted = true for the user today
        await prisma.attendance.updateMany({
            where: {
                userId,
                date: { gte: today },
            },
            data: { reportSubmitted: true },
        });

        return NextResponse.json({ log }, { status: existing ? 200 : 201 });
    } catch (error) {
        console.error('Site log create error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
