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

        const role = (session.user as any).role;
        if (role === 'SITE_SUPERVISOR') {
            return NextResponse.json({ error: 'Site Supervisors must mark attendance via Site Logs' }, { status: 403 });
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

        // Check for approved short leave for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const shortLeave = await prisma.shortLeaveRequest.findFirst({
            where: {
                userId,
                date: { gte: todayStart, lte: todayEnd },
                status: 'APPROVED'
            }
        });

        const requiredHours = shortLeave ? Math.max(0, 8 - shortLeave.hoursRequested) : 8;
        const REQUIRED_MS = requiredHours * 60 * 60 * 1000;

        const timeElapsed = Date.now() - new Date(attendance.checkIn).getTime();
        if (timeElapsed < REQUIRED_MS) {
            const hoursRemaining = Math.max(0, requiredHours - (timeElapsed / (1000 * 60 * 60))).toFixed(1);
            return NextResponse.json(
                { error: `You must complete ${requiredHours} working hours to check out${shortLeave ? ` (Adjusted down by ${shortLeave.hoursRequested}h for Short Leave)` : ''}. (${hoursRemaining}h remaining)` },
                { status: 403 }
            );
        }

        // 🔒 CORE RULE: Cannot checkout without submitting daily report (skip for Site Engineers)
        const userRole = (session.user as any).role;
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

        // GPS location is required for check-out
        let latitude: number, longitude: number, address: string | undefined;
        try {
            const body = await req.json();
            latitude = body.latitude;
            longitude = body.longitude;
            address = body.address;
        } catch {
            return NextResponse.json({ error: 'Location is required to check out' }, { status: 400 });
        }

        if (latitude == null || longitude == null) {
            return NextResponse.json({ error: 'Location is required to check out' }, { status: 400 });
        }

        // Proceed with checkout
        const updated = await prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                checkOut: new Date(),
                checkOutLatitude: latitude,
                checkOutLongitude: longitude,
                checkOutAddress: address,
            },
        });

        return NextResponse.json({ attendance: updated });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
