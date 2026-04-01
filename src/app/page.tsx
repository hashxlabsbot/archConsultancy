import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
    const session = await getServerSession(authOptions);

    if (session) {
        const role = ((session.user as any)?.role || '').trim().toUpperCase();
        // Site supervisors land directly on their daily site logs
        if (role === 'SITE_SUPERVISOR') {
            redirect('/site-logs');
        }
        redirect('/dashboard');
    } else {
        redirect('/login');
    }
}
