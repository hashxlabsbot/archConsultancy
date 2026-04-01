import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { projectId, date, latitude, longitude, address, purpose, notes, photoUrls } = body;

        if (!projectId || !notes) {
            return NextResponse.json({ error: 'Project and Notes are required' }, { status: 400 });
        }

        const visit = await prisma.siteVisit.create({
            data: {
                userId: (session.user as any).id,
                projectId,
                date: new Date(date || Date.now()),
                latitude,
                longitude,
                address,
                purpose: purpose || 'Site Visit',
                notes,
                photoUrls: photoUrls ? JSON.stringify(photoUrls) : null,
            },
        });

        // Notify Admins
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (project) {
            const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
            if (admins.length > 0) {
                const notifications = admins.map((admin: any) => ({
                    userId: admin.id,
                    title: 'New Site Visit Logged',
                    message: `${session.user.name} logged a ${purpose || 'site'} visit for project "${project.name}".`,
                    link: '/site-visits',
                }));
                await prisma.notification.createMany({ data: notifications });
            }
        }

        return NextResponse.json({ success: true, visit });
    } catch (error: any) {
        console.error('Site visit error:', error);
        return NextResponse.json({ error: 'Failed to save site visit' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session.user as any).role;
        const userId = (session.user as any).id;

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (projectId) where.projectId = projectId;
        if (role !== 'ADMIN' && role !== 'SENIOR') where.userId = userId;

        const [visits, total] = await Promise.all([
            prisma.siteVisit.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true, role: true } },
                    project: { select: { id: true, name: true } },
                },
                orderBy: { date: 'desc' },
                skip,
                take: limit,
            }),
            prisma.siteVisit.count({ where }),
        ]);

        return NextResponse.json({
            visits,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Fetch site visits error:', error);
        return NextResponse.json({ error: 'Failed to fetch site visits' }, { status: 500 });
    }
}
