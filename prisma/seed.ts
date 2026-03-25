import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create Admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@archconsultancy.com' },
        update: {},
        create: {
            name: 'Ar. Surrender Singh Chaudhary',
            email: 'admin@archconsultancy.com',
            passwordHash: adminPassword,
            role: 'ADMIN',
            phone: '+91-9876543210',
            skills: 'Architecture, Project Management, Urban Design',
        },
    });

    // Create Manager user
    const managerPassword = await bcrypt.hash('manager123', 12);
    const manager = await prisma.user.upsert({
        where: { email: 'manager@archconsultancy.com' },
        update: {},
        create: {
            name: 'Rajesh Kumar',
            email: 'manager@archconsultancy.com',
            passwordHash: managerPassword,
            role: 'MANAGER',
            phone: '+91-9876543211',
            skills: 'Structural Engineering, BIM, AutoCAD',
        },
    });

    // Create Employee users
    const employeePassword = await bcrypt.hash('employee123', 12);
    const employee1 = await prisma.user.upsert({
        where: { email: 'priya@archconsultancy.com' },
        update: {},
        create: {
            name: 'Priya Sharma',
            email: 'priya@archconsultancy.com',
            passwordHash: employeePassword,
            role: 'EMPLOYEE',
            phone: '+91-9876543212',
            skills: 'Interior Design, 3D Rendering, SketchUp',
        },
    });

    const employee2 = await prisma.user.upsert({
        where: { email: 'amit@archconsultancy.com' },
        update: {},
        create: {
            name: 'Amit Patel',
            email: 'amit@archconsultancy.com',
            passwordHash: employeePassword,
            role: 'EMPLOYEE',
            phone: '+91-9876543213',
            skills: 'AutoCAD, Revit, Construction Documentation',
        },
    });

    // Create sample projects
    const project1 = await prisma.project.upsert({
        where: { id: 'project-1' },
        update: {},
        create: {
            id: 'project-1',
            name: 'Green Valley Residences',
            client: 'Sunrise Developers',
            startDate: new Date('2025-01-15'),
            endDate: new Date('2025-12-31'),
            description: 'Luxury residential complex with 120 units featuring sustainable design elements, rooftop gardens, and smart home integration.',
            location: '123 Pine St, Seattle, WA 98101',
            latitude: 47.6114,
            longitude: -122.3338,
            contactName: 'Alice Johnson',
            contactPhone: '+1-555-0100',
            contactEmail: 'alice@sunrisedev.com',
            status: 'ACTIVE',
            ownerId: manager.id,
        },
    });

    const project2 = await prisma.project.upsert({
        where: { id: 'project-2' },
        update: {},
        create: {
            id: 'project-2',
            name: 'Tech Park Phase II',
            client: 'UrbanTech Corp',
            startDate: new Date('2025-03-01'),
            endDate: new Date('2026-06-30'),
            description: 'Commercial office complex with co-working spaces, conference facilities, and green certification.',
            location: '456 Tech Blvd, Austin, TX 78701',
            latitude: 30.2672,
            longitude: -97.7431,
            contactName: 'Bob Smith',
            contactPhone: '+1-555-0200',
            contactEmail: 'bob.smith@urbantech.com',
            status: 'ACTIVE',
            ownerId: admin.id,
        },
    });

    // Add project members (individual creates for SQLite compatibility)
    const memberData = [
        { projectId: project1.id, userId: employee1.id, role: 'MEMBER' },
        { projectId: project1.id, userId: employee2.id, role: 'MEMBER' },
        { projectId: project2.id, userId: employee1.id, role: 'LEAD' },
        { projectId: project2.id, userId: manager.id, role: 'LEAD' },
    ];

    for (const member of memberData) {
        await prisma.projectMember.upsert({
            where: {
                projectId_userId: {
                    projectId: member.projectId,
                    userId: member.userId,
                },
            },
            update: {},
            create: member,
        });
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Default Accounts:');
    console.log('  Admin:    admin@archconsultancy.com / admin123');
    console.log('  Manager:  manager@archconsultancy.com / manager123');
    console.log('  Employee: priya@archconsultancy.com / employee123');
    console.log('  Employee: amit@archconsultancy.com / employee123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
