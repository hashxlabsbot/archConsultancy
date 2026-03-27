'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineHome,
    HiOutlineClock,
    HiOutlineDocumentText,
    HiOutlineCalendarDays,
    HiOutlineUsers,
    HiOutlineFolderOpen,
    HiOutlineCog6Tooth,
    HiOutlineChevronLeft,
    HiOutlineMapPin,
    HiOutlineCurrencyRupee,
    HiOutlineBanknotes,
    HiOutlineUserCircle,
    HiOutlineArrowRightOnRectangle,
    HiOutlineXMark,
    HiOutlineWrenchScrewdriver,
    HiOutlineTrophy,
} from 'react-icons/hi2';
import { useState } from 'react';

const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'SITE_ENGINEER'] },
    { path: '/admin-attendance', label: 'Attendance & Reports', icon: HiOutlineClock, roles: ['ADMIN'] },
    { path: '/attendance', label: 'Attendance', icon: HiOutlineClock, roles: ['MANAGER', 'EMPLOYEE', 'SITE_ENGINEER'] },
    { path: '/site-logs', label: 'Daily Site Log', icon: HiOutlineWrenchScrewdriver, roles: ['ADMIN', 'SITE_ENGINEER', 'EMPLOYEE'] },
    { path: '/site-visits', label: 'Site Visits', icon: HiOutlineMapPin, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/reports', label: 'Daily Reports', icon: HiOutlineDocumentText, roles: ['MANAGER', 'EMPLOYEE'] },
    { path: '/leaves', label: 'Leaves', icon: HiOutlineCalendarDays, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'SITE_ENGINEER'] },
    { path: '/admin/salary', label: 'Salary Setup', icon: HiOutlineCurrencyRupee, roles: ['ADMIN'] },
    { path: '/salary', label: 'My Salary', icon: HiOutlineBanknotes, roles: ['MANAGER', 'EMPLOYEE'] },
    { path: '/employees', label: 'Employees', icon: HiOutlineUsers, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'SITE_ENGINEER'] },
    { path: '/profile', label: 'My Profile', icon: HiOutlineUserCircle, roles: ['MANAGER', 'EMPLOYEE'] },
    { path: '/projects', label: 'Projects', icon: HiOutlineFolderOpen, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/employee-of-month', label: 'Employee of Month', icon: HiOutlineTrophy, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'SITE_ENGINEER'] },
    { path: '/admin', label: 'Settings', icon: HiOutlineCog6Tooth, roles: ['ADMIN'] },
];

interface SidebarProps {
    isMobileOpen: boolean;
    setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(false);
    const userRole = (session?.user as any)?.role || 'EMPLOYEE';
    const userName = session?.user?.name || 'User';
    const initials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    const filteredMenu = menuItems.filter((item) => item.roles.includes(userRole));

    const roleColors: Record<string, string> = {
        ADMIN: 'bg-violet-100 text-violet-700',
        MANAGER: 'bg-sky-100 text-sky-700',
        EMPLOYEE: 'bg-emerald-100 text-emerald-700',
        SITE_ENGINEER: 'bg-orange-100 text-orange-700',
    };

    const handleNavClick = () => {
        // Close mobile menu on navigation
        if (isMobileOpen) setIsMobileOpen(false);
    };

    const sidebarContent = (
        <>
            {/* Sidebar Architectural Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-multiply overflow-hidden">
                <div className="absolute inset-0 bg-[url('/blueprint-bg.png')] bg-cover bg-bottom opacity-50 grayscale" />
                <div className="absolute inset-0 arch-blueprint-grid" />
            </div>

            {/* Logo */}
            <div className={`relative z-10 flex items-center gap-3 px-4 py-5 border-b border-slate-100/80 backdrop-blur-sm bg-white/50 ${collapsed ? 'justify-center' : ''}`}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center relative"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 21H21M3 21V8L12 3L21 8V21M9 21V15H15V21M9 12H10M14 12H15M9 9H10M14 9H15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                {!collapsed && (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Arch Consultancy</p>
                        <p className="text-xs text-slate-400">Management Portal</p>
                    </motion.div>
                )}
                {/* Mobile close button */}
                <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-auto">
                    <HiOutlineXMark className="w-5 h-5" />
                </button>
            </div>

            {/* Nav */}
            <nav className="relative z-10 px-3 py-4 space-y-0.5 flex-1 overflow-y-auto">
                {!collapsed && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 pb-2">Main Menu</p>}
                {filteredMenu.map((item, index) => {
                    const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                    return (
                        <motion.div
                            key={item.path}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04 }}
                        >
                            <Link href={item.path} onClick={handleNavClick}>
                                <div
                                    className={isActive ? 'sidebar-item-active' : 'sidebar-item'}
                                    title={collapsed ? item.label : ''}
                                >
                                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    {!collapsed && <span>{item.label}</span>}
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            {/* User footer */}
            {!collapsed && (
                <div className="relative z-10 p-3 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>{userName}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${roleColors[userRole] || 'bg-slate-100 text-slate-600'}`}>
                                {userRole}
                            </span>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sign out"
                        >
                            <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Collapse toggle — desktop only */}
            <motion.button
                onClick={() => setCollapsed(!collapsed)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex absolute -right-3.5 top-[72px] w-7 h-7 bg-white border border-slate-200 rounded-full items-center justify-center transition-colors hover:border-indigo-300 hover:bg-indigo-50 z-10"
                style={{ boxShadow: '0 2px 8px rgba(99,102,241,0.12)' }}
            >
                <HiOutlineChevronLeft className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </motion.button>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`hidden md:flex fixed left-0 top-0 h-screen bg-white z-40 flex-col transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`}
                style={{ boxShadow: '4px 0 24px rgba(99, 102, 241, 0.06)' }}
            >
                {sidebarContent}
            </motion.aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
                        />
                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            className="fixed left-0 top-0 h-screen w-72 bg-white z-50 flex flex-col md:hidden"
                            style={{ boxShadow: '4px 0 24px rgba(99, 102, 241, 0.15)' }}
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
