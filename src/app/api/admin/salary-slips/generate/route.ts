import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/admin/salary-slips/generate
// Body: { month: "March", year: 2026 }
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const { month, year } = await req.json();
        if (!month || !year) {
            return NextResponse.json({ error: 'Month and year are required.' }, { status: 400 });
        }

        // Find all non-admin employees that have a salary structure configured
        const users = await prisma.user.findMany({
            where: { salaryStructure: { isNot: null }, role: { not: 'ADMIN' } },
            include: { salaryStructure: true }
        });

        if (users.length === 0) {
            return NextResponse.json({ error: 'No employees have salary structures configured.' }, { status: 404 });
        }

        // Compute month bounds
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

        const generated = [];
        const skipped = [];

        for (const user of users) {
            const s = user.salaryStructure!;

            // Check if slip already exists
            const existing = await prisma.salarySlip.findFirst({
                where: { userId: user.id, month, year }
            });

            if (existing) {
                skipped.push(user.name);
                continue;
            }

            // Count attendance days that month
            const attendanceRecords = await prisma.attendance.findMany({
                where: {
                    userId: user.id,
                    date: { gte: monthStart, lte: monthEnd },
                    checkOut: { not: null }
                }
            });
            const workedDays = attendanceRecords.length;

            // Count approved leaves that month
            const approvedLeaves = await prisma.leave.count({
                where: {
                    userId: user.id,
                    status: 'APPROVED',
                    startDate: { gte: monthStart, lte: monthEnd }
                }
            });

            const totalDaysInMonth = monthEnd.getDate();
            const allowedLeaves = 19; // Company policy: 19 leaves per year
            const balanceLeaves = Math.max(0, allowedLeaves - approvedLeaves);
            const excessLeaves = Math.max(0, approvedLeaves - allowedLeaves);

            // Compute financial components
            const basic = s.basicSalary;
            const hra = parseFloat(((s.hraRate / 100) * basic).toFixed(2));
            const da = parseFloat(((s.daRate / 100) * basic).toFixed(2));
            const medical = s.medicalAllowance;
            const mobile = s.mobileAllowance;
            const travel = s.travelAllowance;
            const seniority = s.seniorityAllowance;

            // Leave allowance: 50% of basic / eligible leave days
            const leaveAllowance = parseFloat((basic * 0.5 / totalDaysInMonth * balanceLeaves).toFixed(2));

            // Annual incentive (given in full if this slip's month matches the employee's configured payout month)
            const annualIncentive = s.annualIncentiveMonth === month
                ? parseFloat(((s.annualIncentiveRate / 100) * basic).toFixed(2))
                : 0;

            // No advance deductions by default
            const advanceDeduction = 0;

            const gross = parseFloat(
                (basic + hra + da + medical + mobile + travel + seniority + leaveAllowance + annualIncentive - advanceDeduction).toFixed(2)
            );

            const slip = await prisma.salarySlip.create({
                data: {
                    userId: user.id,
                    month,
                    year,
                    allowedLeaves,
                    balanceLeaves,
                    excessLeaves,
                    basicSalary: basic,
                    houseRentAllowance: hra,
                    dearnessAllowance: da,
                    medicalAllowance: medical,
                    mobileAllowance: mobile,
                    travelAllowance: travel,
                    seniorityAllowance: seniority,
                    leaveAllowance,
                    annualIncentive,
                    advanceDeduction,
                    grossSalary: gross,
                    status: 'GENERATED'
                }
            });

            generated.push({ name: user.name, gross });
        }

        return NextResponse.json({
            message: `Generated ${generated.length} slips. Skipped ${skipped.length} (already exist).`,
            generated,
            skipped
        });
    } catch (error) {
        console.error('Generate salary slips error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
