import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        // Fetch all non-admin employees with their salary structures
        const users = await prisma.user.findMany({
            where: { role: { not: 'ADMIN' } },
            include: { salaryStructure: true },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Admin Salary Structure GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
