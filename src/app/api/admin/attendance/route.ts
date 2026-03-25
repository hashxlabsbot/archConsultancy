import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/attendance — Fetch all attendance records with user and report details
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || 'all'; // daily, monthly, all, custom
        const customDate = searchParams.get('date');

        const where: any = {};

        const now = new Date();
        if (period === 'daily') {
            // Start and end of today
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            where.date = { gte: startOfDay, lte: endOfDay };
        } else if (period === 'monthly') {
            // Start and end of current month
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            where.date = { gte: startOfMonth, lte: endOfMonth };
        } else if (period === 'custom' && customDate) {
            const parsedDate = new Date(customDate);
            const startOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
            const endOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59, 999);
            where.date = { gte: startOfDay, lte: endOfDay };
        }

        const records = await prisma.attendance.findMany({
            where,
            include: {
                user: {
                    select: { name: true, email: true, role: true }
                },
                reports: {
                    include: { project: true }
                }
            },
            orderBy: [
                { date: 'desc' },
                { checkIn: 'desc' }
            ],
        });

        // Calculate hours and duration for ease of UI
        const enrichedRecords = records.map((record: any) => {
            const duration = record.checkOut
                ? `${Math.round((new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / 3600000 * 10) / 10}h`
                : '—';

            return {
                ...record,
                duration
            };
        });

        return NextResponse.json({ records: enrichedRecords });
    } catch (error) {
        console.error('Admin attendance fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
