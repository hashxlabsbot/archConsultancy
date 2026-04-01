'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
    HiOutlineHome,
    HiHome,
    HiOutlineClock,
    HiClock,
    HiOutlineFolderOpen,
    HiFolderOpen,
    HiOutlineMegaphone,
    HiMegaphone,
    HiOutlineWrenchScrewdriver,
    HiWrenchScrewdriver,
} from 'react-icons/hi2';

export default function BottomNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const rawRole = (session?.user as any)?.role;
    const role = rawRole ? String(rawRole).trim().toUpperCase() : 'JUNIOR';

    const attendancePath = role === 'ADMIN' ? '/admin-attendance' : '/attendance';

    const tabs = [
        {
            label: 'Home',
            href: '/dashboard',
            icon: HiOutlineHome,
            activeIcon: HiHome,
            match: (p: string) => p === '/dashboard',
        },
        {
            label: 'Attendance',
            href: attendancePath,
            icon: HiOutlineClock,
            activeIcon: HiClock,
            match: (p: string) => p === '/attendance' || p === '/admin-attendance',
        },
        {
            label: 'Projects',
            href: '/projects',
            icon: HiOutlineFolderOpen,
            activeIcon: HiFolderOpen,
            match: (p: string) => p.startsWith('/projects'),
            hidden: role === 'SITE_SUPERVISOR' || role === 'NON_TECHNICAL',
        },
        {
            label: 'Notice',
            href: '/notice-board',
            icon: HiOutlineMegaphone,
            activeIcon: HiMegaphone,
            match: (p: string) => p === '/notice-board',
        },
        {
            label: 'Site Logs',
            href: '/site-logs',
            icon: HiOutlineWrenchScrewdriver,
            activeIcon: HiWrenchScrewdriver,
            match: (p: string) => p === '/site-logs',
        },
    ];

    const visibleTabs = tabs.filter(t => !t.hidden);

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100"
            style={{ boxShadow: '0 -4px 24px rgba(99,102,241,0.08)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-stretch">
                {visibleTabs.map((tab) => {
                    const isActive = tab.match(pathname);
                    const Icon = isActive ? tab.activeIcon : tab.icon;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-600"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
