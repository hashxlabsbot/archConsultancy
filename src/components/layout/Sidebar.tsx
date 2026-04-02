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
    HiOutlineMegaphone,
} from 'react-icons/hi2';
import { useState } from 'react';

const REGULAR_ROLES = ['SENIOR', 'JUNIOR', 'TRAINEE', 'INTERN', 'SITE_ENGINEER', 'NON_TECHNICAL'];

const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome, roles: ['ADMIN', ...REGULAR_ROLES] },
    { path: '/admin-attendance', label: 'Attendance & Reports', icon: HiOutlineClock, roles: ['ADMIN'] },
    { path: '/attendance', label: 'Attendance', icon: HiOutlineClock, roles: [...REGULAR_ROLES] },
    // SITE_SUPERVISOR only sees this one item
    { path: '/site-logs', label: 'Daily Site Log', icon: HiOutlineWrenchScrewdriver, roles: ['ADMIN', 'SITE_SUPERVISOR', ...REGULAR_ROLES] },
    { path: '/site-visits', label: 'Project Site Visits', icon: HiOutlineMapPin, roles: ['ADMIN', 'SENIOR', 'JUNIOR', 'TRAINEE', 'INTERN', 'SITE_ENGINEER'] },
    { path: '/reports', label: 'Daily Reports', icon: HiOutlineDocumentText, roles: ['ADMIN', 'SENIOR', 'JUNIOR', 'TRAINEE', 'INTERN', 'SITE_ENGINEER'] },
    { path: '/leaves', label: 'Leaves', icon: HiOutlineCalendarDays, roles: ['ADMIN', ...REGULAR_ROLES] },
    { path: '/admin/salary', label: 'Salary Setup', icon: HiOutlineCurrencyRupee, roles: ['ADMIN'] },
    { path: '/admin/leave-balances', label: 'Leave Balances', icon: HiOutlineCalendarDays, roles: ['ADMIN'] },
    { path: '/salary', label: 'My Salary', icon: HiOutlineBanknotes, roles: ['ADMIN', 'SENIOR', 'JUNIOR', 'TRAINEE', 'INTERN', 'SITE_ENGINEER'] },
    { path: '/employees', label: 'Employees', icon: HiOutlineUsers, roles: ['ADMIN', ...REGULAR_ROLES] },
    { path: '/profile', label: 'My Profile', icon: HiOutlineUserCircle, roles: ['ADMIN', 'SENIOR', 'JUNIOR', 'TRAINEE', 'INTERN', 'SITE_ENGINEER'] },
    { path: '/projects', label: 'Projects', icon: HiOutlineFolderOpen, roles: ['ADMIN', 'SENIOR', 'JUNIOR', 'TRAINEE', 'INTERN', 'SITE_ENGINEER'] },
    { path: '/notice-board', label: 'Notice Board', icon: HiOutlineMegaphone, roles: ['ADMIN', ...REGULAR_ROLES] },
    { path: '/employee-of-month', label: 'Employee of Month', icon: HiOutlineTrophy, roles: ['ADMIN', ...REGULAR_ROLES] },
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
    // Normalize role: trim whitespace, uppercase — guards against DB inconsistencies
    const rawRole = (session?.user as any)?.role;
    const userRole = rawRole ? String(rawRole).trim().toUpperCase() : 'JUNIOR';
    const userName = session?.user?.name || 'User';
    const userAvatar = (session?.user as any)?.avatar;
    const initials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    // If role doesn't match any item (unknown/custom role), fall back to JUNIOR items so menu is never blank
    let filteredMenu = menuItems.filter((item) => item.roles.includes(userRole));
    if (filteredMenu.length === 0) {
        filteredMenu = menuItems.filter((item) => item.roles.includes('JUNIOR'));
    }

    const roleColors: Record<string, string> = {
        ADMIN: 'bg-violet-100 text-violet-700',
        SENIOR: 'bg-sky-100 text-sky-700',
        JUNIOR: 'bg-emerald-100 text-emerald-700',
        TRAINEE: 'bg-teal-100 text-teal-700',
        INTERN: 'bg-cyan-100 text-cyan-700',
        SITE_SUPERVISOR: 'bg-orange-100 text-orange-700',
        SITE_ENGINEER: 'bg-amber-100 text-amber-700',
        NON_TECHNICAL: 'bg-gray-100 text-gray-600',
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
                <div className={`flex flex-col items-start gap-1 ${collapsed ? 'items-center' : ''} flex-1`}>
                    <div className={`flex-shrink-0 ${collapsed ? 'w-10 h-10' : 'w-52 h-20'} flex items-center justify-start relative`}>
                        <img src="/logo.png" alt="Arch Consultancy" className="h-full object-contain" />
                    </div>
                    {!collapsed && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[13px] font-bold text-slate-500 uppercase tracking-[0.25em] pl-1"
                        >
                            Management Portal
                        </motion.p>
                    )}
                </div>
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
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {userAvatar ? (
                                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
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
