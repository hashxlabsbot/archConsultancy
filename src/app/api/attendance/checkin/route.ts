import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
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

        const role = (session.user as any).role;
        if (role === 'SITE_SUPERVISOR') {
            return NextResponse.json({ error: 'Site Supervisors must mark attendance via Site Logs' }, { status: 403 });
        }

        const userId = (session.user as any).id;
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const nowIST = Date.now() + IST_OFFSET_MS;
        const today = new Date(nowIST - (nowIST % (24 * 60 * 60 * 1000)) - IST_OFFSET_MS);

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

        // GPS location is required for check-in
        let latitude: number, longitude: number, address: string | undefined;
        try {
            const body = await req.json();
            latitude = body.latitude;
            longitude = body.longitude;
            address = body.address;
        } catch {
            return NextResponse.json({ error: 'Location is required to check in' }, { status: 400 });
        }

        if (latitude == null || longitude == null) {
            return NextResponse.json({ error: 'Location is required to check in' }, { status: 400 });
        }

        const attendance = await prisma.attendance.create({
            data: {
                userId,
                date: new Date(),
                checkIn: new Date(),
                latitude,
                longitude,
                address,
            },
        });

        return NextResponse.json({ attendance }, { status: 201 });
    } catch (error) {
        console.error('Check-in error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
