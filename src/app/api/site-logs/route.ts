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
        const supervisorId = searchParams.get('supervisorId');

        const where: any = {};

        // Site supervisors only see their own logs
        if (role === 'SITE_SUPERVISOR') {
            where.userId = userId;
        } else if (supervisorId) {
            // Admin/Engineers can filter by a specific supervisor
            where.userId = supervisorId;
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

        const [logs, total, supervisors, totals] = await Promise.all([
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
            // Fetch all site supervisors for the filter dropdown (if admin/senior/engineer)
            role !== 'SITE_SUPERVISOR'
                ? prisma.user.findMany({
                    where: { role: 'SITE_SUPERVISOR' },
                    select: { id: true, name: true }
                })
                : Promise.resolve([]),
            // Aggregate totals across ALL matching logs (not just current page)
            prisma.dailySiteLog.aggregate({
                where,
                _sum: { masonCount: true, coolieCount: true, helperCount: true, otherCount: true },
            }),
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
            supervisors,
            totals: totals._sum,
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
        const body = await req.json();
        const { projectId, masonCount, coolieCount, helperCount, otherCount, notes, audioUrl, mediaUrls } = body;

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        const clamp = (v: any) => Math.max(0, Math.min(9999, Number(v) || 0));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

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
            log = await prisma.dailySiteLog.update({
                where: { id: existing.id },
                data: {
                    masonCount: clamp(masonCount),
                    coolieCount: clamp(coolieCount),
                    helperCount: clamp(helperCount),
                    otherCount: clamp(otherCount),
                    notes: notes || existing.notes,
                    audioUrl: audioUrl || existing.audioUrl,
                    mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : existing.mediaUrls,
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
                    masonCount: clamp(masonCount),
                    coolieCount: clamp(coolieCount),
                    helperCount: clamp(helperCount),
                    otherCount: clamp(otherCount),
                    notes: notes || '',
                    audioUrl: audioUrl || null,
                    mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : '[]',
                },
                include: {
                    project: { select: { id: true, name: true } },
                },
            });
        }

        // Mark attendance logic for SITE_SUPERVISOR
        const role = (session.user as any).role;
        if (role === 'SITE_SUPERVISOR') {
            const existingAttendance = await prisma.attendance.findFirst({
                where: {
                    userId,
                    date: { gte: today, lt: tomorrow }
                }
            });

            if (!existingAttendance) {
                // First report of the day: Check-In
                await prisma.attendance.create({
                    data: {
                        userId,
                        date: today,
                        checkIn: new Date(),
                        reportSubmitted: true,
                        address: 'Marked via Site Log'
                    }
                });
            } else {
                // Subsequent reports: Update Check-Out
                await prisma.attendance.update({
                    where: { id: existingAttendance.id },
                    data: {
                        checkOut: new Date(),
                        reportSubmitted: true
                    }
                });
            }
        } else {
            // Regular behavior for other roles: just mark reportSubmitted for today only
            await prisma.attendance.updateMany({
                where: {
                    userId,
                    date: { gte: today, lt: tomorrow },
                },
                data: { reportSubmitted: true },
            });
        }

        return NextResponse.json({ log }, { status: existing ? 200 : 201 });
    } catch (error) {
        console.error('Site log create error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
