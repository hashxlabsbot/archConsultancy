import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        const where: any = {};
        if (month) where.month = month;
        if (year) where.year = parseInt(year);

        const slips = await prisma.salarySlip.findMany({
            where,
            include: { user: { select: { name: true, email: true } } },
            orderBy: [{ year: 'desc' }, { createdAt: 'desc' }]
        });

        return NextResponse.json({ slips });
    } catch (error) {
        console.error('Salary Slips GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
