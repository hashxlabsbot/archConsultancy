import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const body = await req.json();

        // Parse numbers and ensure defaults for empty or undefined fields
        const dataToSave = {
            basicSalary: Number(body.basicSalary) || 0,
            hraRate: Number(body.hraRate) || 50,
            daRate: Number(body.daRate) || 10,
            medicalAllowance: Number(body.medicalAllowance) || 0,
            mobileAllowance: Number(body.mobileAllowance) || 0,
            travelAllowance: Number(body.travelAllowance) || 0,
            seniorityAllowance: Number(body.seniorityAllowance) || 0,
            annualIncentiveRate: Number(body.annualIncentiveRate) || 5,
            annualIncentiveMonth: body.annualIncentiveMonth || 'January',
        };

        const updated = await prisma.salaryStructure.upsert({
            where: { userId: params.userId },
            update: dataToSave,
            create: {
                userId: params.userId,
                ...dataToSave
            }
        });

        return NextResponse.json({ structure: updated });
    } catch (error) {
        console.error('Admin Salary Structure POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
