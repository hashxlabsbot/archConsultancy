import { NextRequest, NextResponse } from 'next/server';
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findFirst({
            where: {
                userId,
                date: { gte: today },
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
