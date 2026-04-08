import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// PATCH /api/users/[id] — Update user details or password (Admin only)
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const isAuthorized = session?.user?.role === 'ADMIN' || session?.user?.email === 'poojakadyan101992@gmail.com';
        if (!session?.user || !isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = params.id;
        const body = await req.json();
        const { name, email, role, password, phone, skills, designation, fathersName, joiningDate, panCard, aadharNo } = body;

        // Ensure user exists
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (phone !== undefined) updateData.phone = phone;
        if (skills !== undefined) updateData.skills = skills;
        if (designation !== undefined) updateData.designation = designation;
        if (fathersName !== undefined) updateData.fathersName = fathersName;
        if (joiningDate !== undefined) updateData.joiningDate = joiningDate ? new Date(joiningDate) : null;
        if (panCard !== undefined) updateData.panCard = panCard;
        if (aadharNo !== undefined) updateData.aadharNo = aadharNo;

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 12);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, phone: true, skills: true, designation: true, fathersName: true, joiningDate: true, panCard: true, aadharNo: true }
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/users/[id] — Delete a user (Admin only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = params.id;

        if (id === session.user.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        // Check if user exists before deleting
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
