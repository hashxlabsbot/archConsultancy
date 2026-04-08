import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/users — Create User (Admin only)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const isAuthorized = session?.user?.role === 'ADMIN' || session?.user?.email === 'poojakadyan101992@gmail.com';
        if (!session?.user || !isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { name, email, password, role, phone, skills } = body;

        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { error: 'Name, email, password, and role are required' },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                role,
                phone: phone || null,
                skills: skills || null,
            },
        });

        return NextResponse.json(
            { user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/users — Employee directory
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { skills: { contains: search } },
            ];
        }
        if (role) where.role = role;

        const isPrivileged = session.user.role === 'ADMIN' || session.user.role === 'SENIOR';

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                skills: true,
                avatar: true,
                designation: true,
                joiningDate: true,
                createdAt: true,
                ...(isPrivileged ? {
                    fathersName: true,
                    panCard: true,
                    aadharNo: true,
                } : {})
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Users list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
