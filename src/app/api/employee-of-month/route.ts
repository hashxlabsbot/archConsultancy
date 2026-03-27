import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — fetch current month winner + full history
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const records = await prisma.employeeOfTheMonth.findMany({
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            include: {
                user: { select: { id: true, name: true, designation: true, role: true } },
                grantedBy: { select: { id: true, name: true } },
            },
        });

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const current = records.find((r) => r.month === currentMonth && r.year === currentYear) || null;
        const history = records.filter((r) => !(r.month === currentMonth && r.year === currentYear));

        return NextResponse.json({ current, history });
    } catch (err: any) {
        console.error('[EOM GET error]', err);
        return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    }
}

// POST — admin assigns employee of the month
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const role = (session.user as any).role;
        if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const adminId = (session.user as any).id;
        if (!adminId) return NextResponse.json({ error: 'Admin ID missing from session' }, { status: 400 });

        const body = await req.json();
        const { userId, month, year, reason } = body;

        if (!userId || !month || !year) {
            return NextResponse.json({ error: 'userId, month, and year are required' }, { status: 400 });
        }

        const record = await prisma.employeeOfTheMonth.upsert({
            where: { month_year: { month: Number(month), year: Number(year) } },
            update: { userId, reason: reason || null, grantedById: adminId },
            create: { userId, month: Number(month), year: Number(year), reason: reason || null, grantedById: adminId },
            include: {
                user: { select: { id: true, name: true, designation: true, role: true } },
                grantedBy: { select: { id: true, name: true } },
            },
        });

        await prisma.notification.create({
            data: {
                userId,
                title: 'Employee of the Month',
                message: `Congratulations! You have been awarded Employee of the Month for ${new Date(Number(year), Number(month) - 1).toLocaleString('en-IN', { month: 'long' })} ${year}.`,
                link: '/employee-of-month',
            },
        });

        return NextResponse.json({ record });
    } catch (err: any) {
        console.error('[EOM POST error]', err);
        return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    }
}
