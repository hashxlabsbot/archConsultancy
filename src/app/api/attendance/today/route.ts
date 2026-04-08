import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/attendance/today
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const nowIST = Date.now() + IST_OFFSET_MS;
        const today = new Date(nowIST - (nowIST % (24 * 60 * 60 * 1000)) - IST_OFFSET_MS);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        const attendance = await prisma.attendance.findFirst({
            where: {
                userId,
                date: { gte: today, lt: tomorrow },
            },
            include: {
                reports: true,
            },
        });

        return NextResponse.json({ attendance });
    } catch (error) {
        console.error('Today attendance error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
