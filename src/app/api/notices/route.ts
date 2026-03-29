import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppToMany } from '@/lib/whatsapp';

// GET — all roles fetch notices; non-admins get unread flag per notice
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = (session.user as any).id;
        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get('unread') === 'true';

        // IDs this user has already read
        const readRecords = await prisma.noticeRead.findMany({
            where: { userId },
            select: { noticeId: true },
        });
        const readIds = new Set(readRecords.map((r) => r.noticeId));

        const notices = await prisma.notice.findMany({
            orderBy: { createdAt: 'desc' },
            include: { postedBy: { select: { id: true, name: true, designation: true } } },
        });

        const withRead = notices.map((n) => ({ ...n, isRead: readIds.has(n.id) }));
        const result = unreadOnly ? withRead.filter((n) => !n.isRead) : withRead;

        return NextResponse.json({ notices: result });
    } catch (err: any) {
        console.error('[Notices GET]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST — admin posts a notice, notifies all via portal + WhatsApp
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const role = (session.user as any).role;
        if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const adminId = (session.user as any).id;
        const { title, message, priority = 'NORMAL', sendWhatsApp = true } = await req.json();

        if (!title?.trim() || !message?.trim()) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        // Create the notice
        const notice = await prisma.notice.create({
            data: { title, message, priority, postedById: adminId },
            include: { postedBy: { select: { id: true, name: true, designation: true } } },
        });

        // Fetch all non-admin employees
        const employees = await prisma.user.findMany({
            where: { role: { not: 'ADMIN' } },
            select: { id: true, name: true, phone: true },
        });

        // Portal notifications for everyone
        await prisma.notification.createMany({
            data: employees.map((emp) => ({
                userId: emp.id,
                title: `📢 Notice: ${title}`,
                message,
                link: '/notice-board',
            })),
        });

        // WhatsApp delivery
        let whatsappResult = { sent: 0, failed: 0, skipped: true };
        if (sendWhatsApp) {
            const phones = employees.map((e) => e.phone).filter(Boolean) as string[];
            const adminUser = await prisma.user.findUnique({
                where: { id: adminId },
                select: { name: true },
            });
            const waMessage = `*Arch Consultancy — ${priority === 'URGENT' ? '🚨 URGENT ' : ''}Notice*\n\n*${title}*\n\n${message}\n\n_Posted by ${adminUser?.name}_`;
            whatsappResult = await sendWhatsAppToMany(phones, waMessage);

            // Mark notice as whatsapp sent if at least one went through
            if (whatsappResult.sent > 0) {
                await prisma.notice.update({ where: { id: notice.id }, data: { whatsappSent: true } });
            }
        }

        return NextResponse.json({
            notice,
            notified: employees.length,
            whatsapp: whatsappResult,
        });
    } catch (err: any) {
        console.error('[Notices POST]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
