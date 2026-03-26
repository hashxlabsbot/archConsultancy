import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/attendance/history
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
        const limit = parseInt(searchParams.get('limit') || '30');
        const targetUserId = searchParams.get('userId');

        // Managers/Admins can view any user's history
        const queryUserId = (role === 'MANAGER' || role === 'ADMIN') && targetUserId
            ? targetUserId
            : userId;

        const [records, total, leaves] = await Promise.all([
            prisma.attendance.findMany({
                where: { userId: queryUserId },
                include: { reports: true, user: { select: { id: true, name: true, email: true, role: true } } },
                orderBy: { date: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.attendance.count({ where: { userId: queryUserId } }),
            prisma.leave.findMany({
                where: { userId: queryUserId, status: 'APPROVED' },
                orderBy: { startDate: 'desc' },
            })
        ]);

        return NextResponse.json({
            records,
            leaves,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Attendance history error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
