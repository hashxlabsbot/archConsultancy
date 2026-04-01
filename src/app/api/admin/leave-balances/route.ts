import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/leave-balances — All employees with leave balance info
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const role = (session.user as any).role;
        if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1);

        const users = await prisma.user.findMany({
            where: { role: { not: 'ADMIN' } },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                designation: true,
                leaveAdjustment: true,
                leaves: {
                    where: {
                        status: 'APPROVED',
                        startDate: { gte: yearStart },
                    },
                    select: { id: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        const TOTAL_LEAVES = 19;

        const employees = users.map((u) => {
            const approvedCount = u.leaves.length;
            const used = approvedCount + u.leaveAdjustment;
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                designation: u.designation,
                leaveAdjustment: u.leaveAdjustment,
                approvedLeaves: approvedCount,
                total: TOTAL_LEAVES,
                used,
                remaining: Math.max(0, TOTAL_LEAVES - used),
            };
        });

        return NextResponse.json({ employees });
    } catch (error) {
        console.error('Leave balances error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/leave-balances — Update leaveAdjustment for a user
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const role = (session.user as any).role;
        if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { userId, leaveAdjustment } = await req.json();
        if (!userId || leaveAdjustment === undefined) {
            return NextResponse.json({ error: 'userId and leaveAdjustment are required' }, { status: 400 });
        }

        const adjustment = parseInt(leaveAdjustment);
        if (isNaN(adjustment) || adjustment < 0) {
            return NextResponse.json({ error: 'leaveAdjustment must be a non-negative integer' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { leaveAdjustment: adjustment },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Leave adjustment update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
