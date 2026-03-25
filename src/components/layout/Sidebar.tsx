'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
    HiOutlineHome,
    HiOutlineClock,
    HiOutlineDocumentText,
    HiOutlineCalendarDays,
    HiOutlineUsers,
    HiOutlineFolderOpen,
    HiOutlineCog6Tooth,
    HiOutlineBuildingOffice2,
    HiOutlineChevronLeft,
    HiOutlineMapPin,
} from 'react-icons/hi2';
import { useState } from 'react';

const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/admin-attendance', label: 'Attendance & Reports', icon: HiOutlineClock, roles: ['ADMIN'] },
    { path: '/attendance', label: 'Attendance', icon: HiOutlineClock, roles: ['MANAGER', 'EMPLOYEE'] },
    { path: '/site-visits', label: 'Site Visits', icon: HiOutlineMapPin, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/reports', label: 'Daily Reports', icon: HiOutlineDocumentText, roles: ['MANAGER', 'EMPLOYEE'] },
    { path: '/leaves', label: 'Leaves', icon: HiOutlineCalendarDays, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/employees', label: 'Employees', icon: HiOutlineUsers, roles: ['ADMIN', 'MANAGER'] },
    { path: '/projects', label: 'Projects', icon: HiOutlineFolderOpen, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { path: '/admin', label: 'Settings', icon: HiOutlineCog6Tooth, roles: ['ADMIN'] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(false);
    const userRole = (session?.user as any)?.role || 'EMPLOYEE';

    const filteredMenu = menuItems.filter((item) => item.roles.includes(userRole));

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`fixed left-0 top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-gray-200/50 z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-200/50">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <HiOutlineBuildingOffice2 className="w-5 h-5 text-slate-900" />
                </div>
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="overflow-hidden"
                    >
                        <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap">Arch Consultancy</h1>
                        <p className="text-xs text-slate-500 whitespace-nowrap">Management Portal</p>
                    </motion.div>
                )}
            </div>

            {/* Navigation */}
            <nav className="px-3 py-4 space-y-1 flex-1">
                {filteredMenu.map((item) => {
                    const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                    return (
                        <Link key={item.path} href={item.path}>
                            <div className={isActive ? 'sidebar-item-active' : 'sidebar-item'} title={collapsed ? item.label : ''}>
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-dark-700 transition-colors"
            >
                <HiOutlineChevronLeft className={`w-3 h-3 text-slate-500 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
        </motion.aside>
    );
}
