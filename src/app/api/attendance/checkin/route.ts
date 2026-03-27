import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/attendance/checkin
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked in today
        const existing = await prisma.attendance.findFirst({
            where: {
                userId,
                date: { gte: today },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Already checked in today', attendance: existing },
                { status: 409 }
            );
        }

        // Accept optional GPS location from request body
        let latitude, longitude, address;
        try {
            const body = await req.json();
            latitude = body.latitude;
            longitude = body.longitude;
            address = body.address;
        } catch {
            // No body sent — that's fine for non-GPS check-ins
        }

        const attendance = await prisma.attendance.create({
            data: {
                userId,
                date: new Date(),
                checkIn: new Date(),
                ...(latitude && longitude ? { latitude, longitude, address } : {}),
            },
        });

        return NextResponse.json({ attendance }, { status: 201 });
    } catch (error) {
        console.error('Check-in error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
