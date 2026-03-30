'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
    HiOutlineUsers,
    HiOutlineFolderOpen,
    HiOutlineClock,
    HiOutlineCalendarDays,
    HiOutlineExclamationTriangle,
    HiOutlineCheckCircle,
    HiOutlineDocumentText,
    HiOutlineArrowTrendingUp,
    HiOutlineMapPin,
    HiOutlineBanknotes,
    HiOutlineArrowUpRight,
    HiOutlineWrenchScrewdriver,
    HiOutlineTrophy,
    HiOutlineMegaphone,
    HiOutlineInformationCircle,
} from 'react-icons/hi2';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { formatTime, formatDate } from '@/lib/utils';

interface DashboardData {
    stats: {
        totalEmployees: number;
        activeProjects: number;
        todayAttendance: number;
        pendingLeaves: number;
        missedReports: number;
    };
    myAttendance: any;
    myLeaveBalance: any;
    recentReports: any[];
    teamAttendance: any[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// Donut ring SVG component
function DonutRing({ used, total, size = 88 }: { used: number; total: number; size?: number }) {
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const percent = total > 0 ? Math.min(used / total, 1) : 0;
    const offset = circumference * (1 - percent);
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e0e7ff" strokeWidth="10" />
            <circle
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke="url(#donutGrad)" strokeWidth="10"
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <defs>
                <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentEOM, setCurrentEOM] = useState<any>(null);
    const [recentNotices, setRecentNotices] = useState<any[]>([]);
    const role = (session?.user as any)?.role || 'JUNIOR';
    const firstName = session?.user?.name?.split(' ')[0] || 'there';

    useEffect(() => {
        fetchDashboard();
        fetchEOM();
        fetchNotices();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await fetch('/api/dashboard');
            if (res.ok) setData(await res.json());
        } catch (e) { } finally { setLoading(false); }
    };

    const fetchEOM = async () => {
        try {
            const res = await fetch('/api/employee-of-month');
            if (res.ok) {
                const d = await res.json();
                setCurrentEOM(d.current);
            }
        } catch { }
    };

    const fetchNotices = async () => {
        try {
            const res = await fetch('/api/notices');
            if (res.ok) {
                const d = await res.json();
                setRecentNotices((d.notices || []).slice(0, 4));
            }
        } catch { }
    };

    const fetchLocation = async (): Promise<{ latitude: number; longitude: number; address: string } | null> => {
        if (!('geolocation' in navigator)) return null;
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
            });
            const { latitude, longitude } = position.coords;
            let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    address = geoData.display_name || address;
                }
            } catch { }
            return { latitude, longitude, address };
        } catch {
            return null;
        }
    };

    const handleCheckIn = async () => {
        const location = await fetchLocation();
        if (!location) {
            toast.error('Location access is required to check in. Please enable GPS and try again.');
            return;
        }
        try {
            const res = await fetch('/api/attendance/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(location),
            });
            const json = await res.json();
            if (res.ok) { toast.success('Checked in! Have a great day 🎉'); fetchDashboard(); }
            else toast.error(json.error);
        } catch { toast.error('Check-in failed'); }
    };

    const handleCheckOut = async () => {
        const location = await fetchLocation();
        if (!location) {
            toast.error('Location access is required to check out. Please enable GPS and try again.');
            return;
        }
        try {
            const res = await fetch('/api/attendance/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(location),
            });
            const json = await res.json();
            if (res.ok) { toast.success('Checked out. See you tomorrow! 👋'); fetchDashboard(); }
            else toast.error(json.error || 'Checkout failed');
        } catch { toast.error('Checkout failed'); }
    };

    const statCards = [
        ...(role !== 'SITE_SUPERVISOR' ? [{
            label: 'Total Employees',
            value: data?.stats.totalEmployees ?? '—',
            icon: HiOutlineUsers,
            iconClass: 'icon-sq-indigo',
            accent: '#6366f1',
            bg: 'from-indigo-50 to-indigo-100/50',
        }] : []),
        {
            label: 'Active Projects',
            value: data?.stats.activeProjects ?? '—',
            icon: HiOutlineFolderOpen,
            iconClass: 'icon-sq-sky',
            accent: '#0ea5e9',
            bg: 'from-sky-50 to-sky-100/50',
        },
        ...(role !== 'SITE_SUPERVISOR' ? [{
            label: "Today's Attendance",
            value: data?.stats.todayAttendance ?? '—',
            icon: HiOutlineClock,
            iconClass: 'icon-sq-emerald',
            accent: '#10b981',
            bg: 'from-emerald-50 to-emerald-100/50',
        }] : []),
        {
            label: 'Pending Leaves',
            value: data?.stats.pendingLeaves ?? '—',
            icon: HiOutlineCalendarDays,
            iconClass: 'icon-sq-amber',
            accent: '#f59e0b',
            bg: 'from-amber-50 to-amber-100/50',
        },
    ];

    const quickActions = role === 'SITE_SUPERVISOR'
        ? [
            { href: '/attendance', label: 'Attendance', icon: HiOutlineClock, iconClass: 'icon-sq-sky' },
            { href: '/site-logs', label: 'Daily Site Log', icon: HiOutlineWrenchScrewdriver, iconClass: 'icon-sq-orange' },
            { href: '/leaves', label: 'Apply Leave', icon: HiOutlineCalendarDays, iconClass: 'icon-sq-emerald' },
        ]
        : role !== 'ADMIN'
            ? [
                { href: '/reports/new', label: 'Submit Report', icon: HiOutlineDocumentText, iconClass: 'icon-sq-indigo' },
                { href: '/attendance', label: 'Attendance', icon: HiOutlineClock, iconClass: 'icon-sq-sky' },
                { href: '/leaves', label: 'Apply Leave', icon: HiOutlineCalendarDays, iconClass: 'icon-sq-emerald' },
                { href: '/site-visits', label: 'Site Visits', icon: HiOutlineMapPin, iconClass: 'icon-sq-violet' },
                { href: '/projects', label: 'Projects', icon: HiOutlineFolderOpen, iconClass: 'icon-sq-amber' },
                { href: '/salary', label: 'My Salary', icon: HiOutlineBanknotes, iconClass: 'icon-sq-rose' },
            ]
            : [
                { href: '/admin', label: 'Manage Users', icon: HiOutlineUsers, iconClass: 'icon-sq-indigo' },
                { href: '/admin-attendance', label: 'Attendance', icon: HiOutlineClock, iconClass: 'icon-sq-sky' },
                { href: '/leaves', label: 'Leave Approvals', icon: HiOutlineCalendarDays, iconClass: 'icon-sq-emerald' },
                { href: '/projects', label: 'Projects', icon: HiOutlineFolderOpen, iconClass: 'icon-sq-amber' },
                { href: '/admin/salary', label: 'Salary Setup', icon: HiOutlineBanknotes, iconClass: 'icon-sq-violet' },
                { href: '/site-logs', label: 'Site Logs', icon: HiOutlineWrenchScrewdriver, iconClass: 'icon-sq-orange' },
            ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-[1600px]">

                {/* ── ARCHITECTURAL HERO BANNER ── */}
                <motion.div variants={itemVariants} className="hero-banner p-5 sm:p-8 md:p-10 flex flex-col justify-center gap-4 sm:gap-6 relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-glow-indigo border border-indigo-500/30 min-h-[200px] sm:min-h-[280px]">
                    <div className="absolute inset-0 bg-slate-900 z-0" />
                    <div className="absolute inset-0 bg-[url('/building-hero.png')] bg-cover bg-[center_30%] opacity-50 mix-blend-overlay z-0 transition-transform duration-[20s] ease-linear hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/95 via-indigo-900/70 to-transparent z-0" />

                    <div className="relative z-10 w-full max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-white/90 text-[10px] font-bold uppercase tracking-widest mb-4 backdrop-blur-md border border-white/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {formatDate(new Date())}
                        </div>
                        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 sm:mb-3 tracking-tight drop-shadow-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            Welcome back, {firstName}.
                        </h1>
                        <p className="text-indigo-100/90 text-sm sm:text-base max-w-lg font-medium leading-relaxed drop-shadow-md">
                            Overview of today's architectural projects, active site visits, and team availability across all managed properties.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-7">
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                                <HiOutlineUsers className="w-4 h-4 text-indigo-300" />
                                {role} Role
                            </span>
                            {data?.stats && (
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/30 backdrop-blur-md border border-emerald-400/40 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                                    <HiOutlineCheckCircle className="w-4 h-4 text-emerald-300" />
                                    {data.stats.todayAttendance} Team Members Active
                                </span>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── STAT CARDS ── */}
                <motion.div variants={itemVariants} className={`grid grid-cols-1 sm:grid-cols-2 ${statCards.length > 2 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
                    {statCards.map((stat, idx) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.07, duration: 0.4 }}
                            className="stat-card"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{stat.label}</p>
                                    <p className="text-2xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em' }}>{stat.value}</p>
                                </div>
                                <div className={stat.iconClass}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1.5">
                                <HiOutlineArrowUpRight className="w-3.5 h-3.5" style={{ color: stat.accent }} />
                                <span className="text-xs font-medium" style={{ color: stat.accent }}>This month</span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ── EMPLOYEE/SITE_ENGINEER CARDS: attendance + leave ── */}
                {(role !== 'ADMIN' && role !== 'SITE_SUPERVISOR') && (
                    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Today's Attendance */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    Today's Attendance
                                </h3>
                                <div className="icon-sq-sky w-9 h-9 rounded-xl">
                                    <HiOutlineClock className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            {data?.myAttendance ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                        <span className="text-sm text-emerald-700 font-medium">Check-in</span>
                                        <span className="text-sm font-bold text-emerald-600">{formatTime(data.myAttendance.checkIn)}</span>
                                    </div>
                                    {data.myAttendance.checkOut ? (
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <span className="text-sm text-slate-600 font-medium">Check-out</span>
                                            <span className="text-sm font-bold text-slate-700">{formatTime(data.myAttendance.checkOut)}</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleCheckOut}
                                            disabled={!data.myAttendance.reportSubmitted}
                                            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${data.myAttendance.reportSubmitted
                                                ? 'btn-danger'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                        >
                                            {data.myAttendance.reportSubmitted ? 'Check Out Now' : '🔒 Submit Report First'}
                                        </button>
                                    )}
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <span className="text-sm text-slate-500">Daily Report</span>
                                        {data.myAttendance.reportSubmitted ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
                                                <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Submitted
                                            </span>
                                        ) : (
                                            <Link href="/reports/new" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full hover:bg-amber-200 transition-colors">
                                                <HiOutlineExclamationTriangle className="w-3.5 h-3.5" /> Pending
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                                        <HiOutlineClock className="w-7 h-7 text-indigo-500" />
                                    </div>
                                    <p className="text-slate-500 text-sm mb-4">You haven't checked in yet today</p>
                                    <button onClick={handleCheckIn} className="btn-primary px-8">
                                        Check In Now
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Leave Balance */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    Leave Balance
                                </h3>
                                <div className="icon-sq-violet w-9 h-9 rounded-xl">
                                    <HiOutlineCalendarDays className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            {data?.myLeaveBalance ? (
                                <div className="flex items-center gap-6">
                                    <div className="relative flex-shrink-0">
                                        <DonutRing used={data.myLeaveBalance.used} total={data.myLeaveBalance.total} size={96} />
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                {data.myLeaveBalance.remaining}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-medium">left</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-slate-500">Total Annual</span>
                                                <span className="font-bold text-slate-900">{data.myLeaveBalance.total}</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-amber-50 rounded-xl flex justify-between">
                                            <span className="text-xs text-amber-700 font-medium">Used</span>
                                            <span className="text-xs font-bold text-amber-700">{data.myLeaveBalance.used}</span>
                                        </div>
                                        <div className="p-3 bg-emerald-50 rounded-xl flex justify-between">
                                            <span className="text-xs text-emerald-700 font-medium">Remaining</span>
                                            <span className="text-xs font-bold text-emerald-700">{data.myLeaveBalance.remaining}</span>
                                        </div>
                                        <Link href="/leaves" className="btn-secondary text-sm text-center block w-full py-2">
                                            Apply for Leave
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">Leave data unavailable</p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── SITE_ENGINEER: just attendance card ── */}
                {role === 'SITE_SUPERVISOR' && (
                    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    Today's Attendance
                                </h3>
                                <div className="icon-sq-sky w-9 h-9 rounded-xl">
                                    <HiOutlineClock className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            {data?.myAttendance ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                        <span className="text-sm text-emerald-700 font-medium">Check-in</span>
                                        <span className="text-sm font-bold text-emerald-600">{formatTime(data.myAttendance.checkIn)}</span>
                                    </div>
                                    {data.myAttendance.latitude && (
                                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                                            <HiOutlineMapPin className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs text-blue-700 font-medium">
                                                {data.myAttendance.address || `${data.myAttendance.latitude.toFixed(4)}, ${data.myAttendance.longitude.toFixed(4)}`}
                                            </span>
                                        </div>
                                    )}
                                    {data.myAttendance.checkOut ? (
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <span className="text-sm text-slate-600 font-medium">Check-out</span>
                                            <span className="text-sm font-bold text-slate-700">{formatTime(data.myAttendance.checkOut)}</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleCheckOut}
                                            disabled={!data.myAttendance.reportSubmitted}
                                            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${data.myAttendance.reportSubmitted
                                                ? 'btn-danger'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                        >
                                            {data.myAttendance.reportSubmitted ? 'Check Out Now' : '🔒 Submit Site Log First'}
                                        </button>
                                    )}
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <span className="text-sm text-slate-500">Daily Site Log</span>
                                        {data.myAttendance.reportSubmitted ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
                                                <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Submitted
                                            </span>
                                        ) : (
                                            <Link href="/site-logs" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full hover:bg-amber-200 transition-colors">
                                                <HiOutlineExclamationTriangle className="w-3.5 h-3.5" /> Pending
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                                        <HiOutlineClock className="w-7 h-7 text-indigo-500" />
                                    </div>
                                    <p className="text-slate-500 text-sm mb-4">You haven't checked in yet today</p>
                                    <button onClick={handleCheckIn} className="btn-primary px-8">
                                        Check In Now
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Leave Balance for SITE_ENGINEER */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    Leave Balance
                                </h3>
                                <div className="icon-sq-violet w-9 h-9 rounded-xl">
                                    <HiOutlineCalendarDays className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            {data?.myLeaveBalance ? (
                                <div className="flex items-center gap-6">
                                    <div className="relative flex-shrink-0">
                                        <DonutRing used={data.myLeaveBalance.used} total={data.myLeaveBalance.total} size={96} />
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                {data.myLeaveBalance.remaining}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-medium">left</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-slate-500">Total Annual</span>
                                                <span className="font-bold text-slate-900">{data.myLeaveBalance.total}</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-amber-50 rounded-xl flex justify-between">
                                            <span className="text-xs text-amber-700 font-medium">Used</span>
                                            <span className="text-xs font-bold text-amber-700">{data.myLeaveBalance.used}</span>
                                        </div>
                                        <div className="p-3 bg-emerald-50 rounded-xl flex justify-between">
                                            <span className="text-xs text-emerald-700 font-medium">Remaining</span>
                                            <span className="text-xs font-bold text-emerald-700">{data.myLeaveBalance.remaining}</span>
                                        </div>
                                        <Link href="/leaves" className="btn-secondary text-sm text-center block w-full py-2">
                                            Apply for Leave
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">Leave data unavailable</p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── ADMIN/MANAGER: Team Attendance + Reports ── */}
                {(role === 'SENIOR' || role === 'ADMIN') && (
                    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Team Attendance */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Team Attendance Today</h3>
                                <div className="icon-sq-emerald w-9 h-9 rounded-xl">
                                    <HiOutlineUsers className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            {data?.teamAttendance && data.teamAttendance.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {data.teamAttendance.map((att: any) => (
                                        <div key={att.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${att.reportSubmitted ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                                    style={{ boxShadow: att.reportSubmitted ? '0 0 0 3px rgba(52,211,153,0.2)' : '0 0 0 3px rgba(251,191,36,0.2)' }} />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{att.user?.name}</p>
                                                    <p className="text-xs text-slate-400">In: {formatTime(att.checkIn)}</p>
                                                </div>
                                            </div>
                                            <div>
                                                {att.checkOut ? (
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">Out: {formatTime(att.checkOut)}</span>
                                                ) : att.reportSubmitted ? (
                                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">Report ✓</span>
                                                ) : (
                                                    <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">No report</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                                        <HiOutlineUsers className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 text-sm">No check-ins yet today</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Reports */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Recent Reports</h3>
                                <Link href="/reports" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                    View all <HiOutlineArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>
                            {data?.recentReports && data.recentReports.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {data.recentReports.map((report: any) => (
                                        <div key={report.id} className="p-3.5 hover:bg-slate-50 rounded-xl transition-colors">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <p className="text-sm font-semibold text-slate-900">{report.user?.name}</p>
                                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{formatDate(report.submittedAt)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{report.tasks}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                                        <HiOutlineDocumentText className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 text-sm">No reports yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── Employee of the Month Banner ── */}
                {currentEOM && (
                    <motion.div variants={itemVariants}>
                        <Link href="/employee-of-month" className="block group">
                            <div
                                className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-5 cursor-pointer transition-transform hover:scale-[1.01]"
                                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #0ea5e9 100%)', boxShadow: '0 6px 24px rgba(99,102,241,0.30)' }}
                            >
                                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #fff, transparent)', transform: 'translate(20%, -20%)' }} />
                                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                    <HiOutlineTrophy className="w-7 h-7 text-yellow-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Employee of the Month</p>
                                    <p className="text-white text-lg font-bold truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>{currentEOM.user.name}</p>
                                    {currentEOM.reason && (
                                        <p className="text-white/70 text-xs truncate">{currentEOM.reason}</p>
                                    )}
                                </div>
                                <HiOutlineArrowUpRight className="w-5 h-5 text-white/60 flex-shrink-0 group-hover:text-white transition-colors" />
                            </div>
                        </Link>
                    </motion.div>
                )}

                {/* ── Compliance Alert ── */}
                {data?.stats.missedReports && data.stats.missedReports > 0 && (role === 'SENIOR' || role === 'ADMIN') && (
                    <motion.div variants={itemVariants} className="flex items-center gap-4 p-5 bg-rose-50 border border-rose-200 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <HiOutlineExclamationTriangle className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-rose-800" style={{ fontFamily: 'Manrope, sans-serif' }}>Compliance Alert</p>
                            <p className="text-sm text-rose-600">{data.stats.missedReports} missed reports in the last 7 days</p>
                        </div>
                    </motion.div>
                )}

                {/* ── NOTICE BOARD ── */}
                <motion.div variants={itemVariants}>
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="icon-sq-indigo w-9 h-9 rounded-xl">
                                    <HiOutlineMegaphone className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    Notice Board
                                </h3>
                            </div>
                            <Link href="/notice-board" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                View all <HiOutlineArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>

                        {recentNotices.length > 0 ? (
                            <div className="space-y-2">
                                {recentNotices.map((notice) => {
                                    const isUrgent = notice.priority === 'URGENT';
                                    const isInfo = notice.priority === 'INFO';
                                    const borderColor = isUrgent ? 'border-rose-200 bg-rose-50' : isInfo ? 'border-sky-200 bg-sky-50' : 'border-indigo-100 bg-indigo-50/50';
                                    const badgeColor = isUrgent ? 'bg-rose-100 text-rose-700' : isInfo ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700';
                                    const stripeColor = isUrgent ? 'bg-rose-500' : isInfo ? 'bg-sky-500' : 'bg-indigo-500';
                                    const NoticeIcon = isUrgent ? HiOutlineExclamationTriangle : isInfo ? HiOutlineInformationCircle : HiOutlineMegaphone;
                                    const iconColor = isUrgent ? 'text-rose-500' : isInfo ? 'text-sky-500' : 'text-indigo-500';

                                    return (
                                        <Link key={notice.id} href="/notice-board">
                                            <div className={`flex items-start gap-3 p-3 rounded-xl border ${borderColor} hover:shadow-sm transition-all cursor-pointer`}>
                                                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${stripeColor}`} />
                                                <NoticeIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconColor}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <p className="text-sm font-semibold text-slate-900 truncate">{notice.title}</p>
                                                        {isUrgent && (
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badgeColor}`}>URGENT</span>
                                                        )}
                                                        {!notice.isRead && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">{notice.message}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-2">
                                    <HiOutlineMegaphone className="w-6 h-6 text-indigo-300" />
                                </div>
                                <p className="text-slate-400 text-sm">No notices yet</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ── QUICK ACTIONS ── */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {quickActions.map((action) => (
                            <Link key={action.href} href={action.href}>
                                <motion.div
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="glass-card p-4 text-center cursor-pointer transition-all"
                                    style={{ boxShadow: '0 1px 3px rgba(99,102,241,0.06), 0 4px 12px rgba(99,102,241,0.04)' }}
                                >
                                    <div className={`${action.iconClass} w-11 h-11 mx-auto mb-2.5`}>
                                        <action.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600 leading-tight">{action.label}</span>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </motion.div>

            </motion.div>
        </DashboardLayout>
    );
}
