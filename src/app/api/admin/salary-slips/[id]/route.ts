import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/admin/salary-slips/[id] — Toggle slip status between GENERATED and PAID
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const slip = await prisma.salarySlip.findUnique({ where: { id: params.id } });
        if (!slip) {
            return NextResponse.json({ error: 'Slip not found' }, { status: 404 });
        }

        const newStatus = slip.status === 'PAID' ? 'GENERATED' : 'PAID';

        const updated = await prisma.salarySlip.update({
            where: { id: params.id },
            data: { status: newStatus },
            include: { user: { select: { name: true, email: true } } },
        });

        return NextResponse.json({ slip: updated });
    } catch (error) {
        console.error('Salary slip PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
