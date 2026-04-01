import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        const structure = await prisma.salaryStructure.findUnique({
            where: { userId }
        });

        const slips = await prisma.salarySlip.findMany({
            where: { userId },
            orderBy: [{ year: 'desc' }, { createdAt: 'desc' }]
        });

        return NextResponse.json({ structure, slips });
    } catch (error) {
        console.error('Salary GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
