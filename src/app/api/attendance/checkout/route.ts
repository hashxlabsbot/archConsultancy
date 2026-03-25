import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/attendance/checkout — CORE BUSINESS RULE: 403 if no report submitted
export async function POST(req: NextRequest) {
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
        });

        if (!attendance) {
            return NextResponse.json({ error: 'No check-in found for today' }, { status: 404 });
        }

        if (attendance.checkOut) {
            return NextResponse.json({ error: 'Already checked out today' }, { status: 409 });
        }

        // 🔒 CORE RULE: Cannot checkout without submitting daily report
        if (!attendance.reportSubmitted) {
            // Increment failed checkout attempts
            await prisma.attendance.update({
                where: { id: attendance.id },
                data: { checkoutAttempts: { increment: 1 } },
            });

            return NextResponse.json(
                {
                    error: 'Submit your daily report first!',
                    message: 'You must submit your daily status report before checking out.',
                    checkoutAttempts: attendance.checkoutAttempts + 1,
                },
                { status: 403 }
            );
        }

        // Proceed with checkout
        const updated = await prisma.attendance.update({
            where: { id: attendance.id },
            data: { checkOut: new Date() },
        });

        return NextResponse.json({ attendance: updated });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
