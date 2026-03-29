import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Clearing ALL existing data...\n');

    // Delete in dependency order (children first)
    await prisma.notice.deleteMany();
    await prisma.employeeOfTheMonth.deleteMany();
    await prisma.salarySlip.deleteMany();
    await prisma.salaryStructure.deleteMany();
    await prisma.shortLeaveRequest.deleteMany();
    await prisma.milestone.deleteMany();
    await prisma.siteVisit.deleteMany();
    await prisma.document.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.report.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.leave.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.dailySiteLog.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Database cleared.\n');
    console.log('🌱 Seeding fresh demo data...\n');

    // ─── USERS ────────────────────────────────────────────────
    const adminPassword = await bcrypt.hash('admin123', 12);
    const managerPassword = await bcrypt.hash('manager123', 12);
    const employeePassword = await bcrypt.hash('employee123', 12);

    const admin = await prisma.user.create({
        data: {
            name: 'Ar. Surender Singh Chaudhary',
            email: 'admin@archconsultancy.com',
            passwordHash: adminPassword,
            role: 'ADMIN',
            phone: '+91-9876543210',
            skills: 'Architecture, Project Management, Urban Design',
            designation: 'Principal Architect & Director',
            fathersName: 'Sh. Harpal Singh Chaudhary',
            joiningDate: new Date('2015-04-01'),
            panCard: 'ABCPS1234K',
            aadharNo: '1234-5678-9012',
        },
    });

    const manager = await prisma.user.create({
        data: {
            name: 'Rajesh Kumar',
            email: 'manager@archconsultancy.com',
            passwordHash: managerPassword,
            role: 'MANAGER',
            phone: '+91-9876543211',
            skills: 'Structural Engineering, BIM, AutoCAD',
            designation: 'Senior Project Manager',
            fathersName: 'Sh. Ramesh Kumar',
            joiningDate: new Date('2019-08-15'),
            panCard: 'BXYPK5678L',
            aadharNo: '2345-6789-0123',
        },
    });

    const employee1 = await prisma.user.create({
        data: {
            name: 'Priya Sharma',
            email: 'priya@archconsultancy.com',
            passwordHash: employeePassword,
            role: 'EMPLOYEE',
            phone: '+91-9876543212',
            skills: 'Interior Design, 3D Rendering, SketchUp',
            designation: 'Junior Architect',
            fathersName: 'Sh. Vikram Sharma',
            joiningDate: new Date('2023-01-10'),
            panCard: 'CXYPS9012M',
            aadharNo: '3456-7890-1234',
        },
    });

    const employee2 = await prisma.user.create({
        data: {
            name: 'Amit Patel',
            email: 'amit@archconsultancy.com',
            passwordHash: employeePassword,
            role: 'EMPLOYEE',
            phone: '+91-9876543213',
            skills: 'AutoCAD, Revit, Construction Documentation',
            designation: 'Draftsman',
            fathersName: 'Sh. Suresh Patel',
            joiningDate: new Date('2022-06-01'),
            panCard: 'DXYPA3456N',
            aadharNo: '4567-8901-2345',
        },
    });

    console.log('  ✓ 4 users created (Admin, Manager, 2 Employees)');

    // ─── PROJECTS ─────────────────────────────────────────────
    const project1 = await prisma.project.create({
        data: {
            name: 'Green Valley Residences',
            client: 'Sunrise Developers Pvt. Ltd.',
            startDate: new Date('2025-06-01'),
            endDate: new Date('2026-12-31'),
            description: 'Luxury residential complex with 120 units featuring sustainable design, rooftop gardens, rainwater harvesting, and smart home integration. GRIHA-5 Star rated.',
            location: 'Sector 62, Mohali, Punjab',
            latitude: 30.7046,
            longitude: 76.7179,
            contactName: 'Mr. Harjinder Singh',
            contactPhone: '+91-98765-00100',
            contactEmail: 'harjinder@sunrisedev.in',
            status: 'ACTIVE',
            ownerId: admin.id,
        },
    });

    const project2 = await prisma.project.create({
        data: {
            name: 'Heritage Mall Renovation',
            client: 'Heritage Group',
            startDate: new Date('2026-01-15'),
            endDate: new Date('2026-09-30'),
            description: 'Complete interior renovation and façade restoration of a heritage commercial building in Chandigarh Sector 17. Includes structural audit and MEP upgrades.',
            location: 'Sector 17, Chandigarh',
            latitude: 30.7418,
            longitude: 76.7874,
            contactName: 'Mrs. Neeta Kapoor',
            contactPhone: '+91-98765-00200',
            contactEmail: 'neeta@heritagegroup.co.in',
            status: 'ACTIVE',
            ownerId: manager.id,
        },
    });

    console.log('  ✓ 2 projects created');

    // ─── PROJECT MEMBERS ──────────────────────────────────────
    await prisma.projectMember.createMany({
        data: [
            { projectId: project1.id, userId: manager.id, role: 'LEAD' },
            { projectId: project1.id, userId: employee1.id, role: 'MEMBER' },
            { projectId: project1.id, userId: employee2.id, role: 'MEMBER' },
            { projectId: project2.id, userId: admin.id, role: 'LEAD' },
            { projectId: project2.id, userId: employee1.id, role: 'MEMBER' },
        ],
    });

    console.log('  ✓ Project members assigned');

    // ─── MILESTONES ───────────────────────────────────────────
    await prisma.milestone.createMany({
        data: [
            { projectId: project1.id, title: 'Site Survey & Soil Testing', status: 'DONE', sequence: 1, dueDate: new Date('2025-07-15'), assigneeId: employee2.id },
            { projectId: project1.id, title: 'Concept Design Approval', status: 'DONE', sequence: 2, dueDate: new Date('2025-09-01'), assigneeId: employee1.id },
            { projectId: project1.id, title: 'Structural Drawings', status: 'IN_PROGRESS', sequence: 3, dueDate: new Date('2026-04-30'), assigneeId: employee2.id },
            { projectId: project1.id, title: 'MEP Design Integration', status: 'TODO', sequence: 4, dueDate: new Date('2026-07-15'), assigneeId: employee1.id },
            { projectId: project2.id, title: 'Heritage Structural Audit', status: 'DONE', sequence: 1, dueDate: new Date('2026-02-15'), assigneeId: manager.id },
            { projectId: project2.id, title: 'Interior Layout Finalization', status: 'IN_PROGRESS', sequence: 2, dueDate: new Date('2026-05-01'), assigneeId: employee1.id },
            { projectId: project2.id, title: 'Façade Restoration Plan', status: 'TODO', sequence: 3, dueDate: new Date('2026-07-01') },
        ],
    });

    console.log('  ✓ Project milestones created');

    // ─── SALARY STRUCTURES ────────────────────────────────────
    await prisma.salaryStructure.createMany({
        data: [
            {
                userId: manager.id,
                basicSalary: 45000,
                hraRate: 50,
                daRate: 10,
                medicalAllowance: 2000,
                mobileAllowance: 1000,
                travelAllowance: 3000,
                seniorityAllowance: 2500,
                annualIncentiveRate: 8,
                annualIncentiveMonth: 'March',
            },
            {
                userId: employee1.id,
                basicSalary: 28000,
                hraRate: 50,
                daRate: 10,
                medicalAllowance: 1500,
                mobileAllowance: 500,
                travelAllowance: 2000,
                seniorityAllowance: 0,
                annualIncentiveRate: 5,
                annualIncentiveMonth: 'March',
            },
            {
                userId: employee2.id,
                basicSalary: 25000,
                hraRate: 50,
                daRate: 10,
                medicalAllowance: 1500,
                mobileAllowance: 500,
                travelAllowance: 1500,
                seniorityAllowance: 500,
                annualIncentiveRate: 5,
                annualIncentiveMonth: 'March',
            },
        ],
    });

    console.log('  ✓ Salary structures configured');

    // ─── DONE ─────────────────────────────────────────────────
    console.log('\n🎉 Database is demo-ready!\n');
    console.log('┌──────────────────────────────────────────────────┐');
    console.log('│  Demo Accounts                                   │');
    console.log('├──────────────────────────────────────────────────┤');
    console.log('│  👑 Admin:    admin@archconsultancy.com / admin123    │');
    console.log('│  👔 Manager:  manager@archconsultancy.com / manager123│');
    console.log('│  👷 Employee: priya@archconsultancy.com / employee123 │');
    console.log('│  👷 Employee: amit@archconsultancy.com / employee123  │');
    console.log('└──────────────────────────────────────────────────┘');
    console.log('\n📌 Demo-ready features:');
    console.log('   • Check In / Check Out / Daily Reports');
    console.log('   • Apply for Leave (Full/Half/Short)');
    console.log('   • Projects with Milestones (Kanban Board)');
    console.log('   • Site Visits with geo-tagging');
    console.log('   • Salary Structures pre-configured');
    console.log('   • Generate & View Salary Slips');
    console.log('   • Role-based access (Admin/Manager/Employee)');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
