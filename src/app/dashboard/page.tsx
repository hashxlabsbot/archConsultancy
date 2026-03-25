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
    HiOutlineXCircle,
    HiOutlineDocumentText,
    HiOutlineArrowTrendingUp,
} from 'react-icons/hi2';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { formatTime, formatDate, getRoleBadgeColor } from '@/lib/utils';

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

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const role = (session?.user as any)?.role || 'EMPLOYEE';

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await fetch('/api/dashboard');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            const res = await fetch('/api/attendance/checkin', { method: 'POST' });
            const json = await res.json();
            if (res.ok) {
                toast.success('Checked in successfully!');
                fetchDashboard();
            } else {
                toast.error(json.error);
            }
        } catch (error) {
            toast.error('Check-in failed');
        }
    };

    const handleCheckOut = async () => {
        try {
            const res = await fetch('/api/attendance/checkout', { method: 'POST' });
            const json = await res.json();
            if (res.ok) {
                toast.success('Checked out successfully!');
                fetchDashboard();
            } else {
                toast.error(json.error || 'Checkout failed');
            }
        } catch (error) {
            toast.error('Checkout failed');
        }
    };

    const statCards = [
        {
            label: 'Total Employees',
            value: data?.stats.totalEmployees || 0,
            icon: HiOutlineUsers,
            color: 'from-blue-500 to-blue-600',
            shadow: 'shadow-blue-500/20',
        },
        {
            label: 'Active Projects',
            value: data?.stats.activeProjects || 0,
            icon: HiOutlineFolderOpen,
            color: 'from-emerald-500 to-emerald-600',
            shadow: 'shadow-emerald-500/20',
        },
        {
            label: "Today's Attendance",
            value: data?.stats.todayAttendance || 0,
            icon: HiOutlineClock,
            color: 'from-purple-500 to-purple-600',
            shadow: 'shadow-purple-500/20',
        },
        {
            label: 'Pending Leaves',
            value: data?.stats.pendingLeaves || 0,
            icon: HiOutlineCalendarDays,
            color: 'from-amber-500 to-amber-600',
            shadow: 'shadow-amber-500/20',
        },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                {/* Welcome header */}
                <motion.div variants={item}>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Welcome back, <span className="gradient-text">{session?.user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-slate-500 mt-1">{formatDate(new Date())} • {role} Dashboard</p>
                </motion.div>

                {/* Stat Cards */}
                <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat) => (
                        <div key={stat.label} className="glass-card-hover p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">{stat.label}</p>
                                    <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} ${stat.shadow} shadow-lg flex items-center justify-center`}>
                                    <stat.icon className="w-6 h-6 text-slate-900" />
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Employee-specific: Attendance + Report Cards */}
                {role === 'EMPLOYEE' && (
                    <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Attendance Card */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <HiOutlineClock className="w-5 h-5 text-primary-400" />
                                Today&apos;s Attendance
                            </h3>
                            {data?.myAttendance ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Check-in</span>
                                        <span className="text-success-400 font-medium">{formatTime(data.myAttendance.checkIn)}</span>
                                    </div>
                                    {data.myAttendance.checkOut ? (
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Check-out</span>
                                            <span className="text-success-400 font-medium">{formatTime(data.myAttendance.checkOut)}</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleCheckOut}
                                            className={`w-full ${data.myAttendance.reportSubmitted ? 'btn-danger' : 'btn-secondary opacity-60 cursor-not-allowed'}`}
                                            disabled={!data.myAttendance.reportSubmitted}
                                        >
                                            {data.myAttendance.reportSubmitted ? 'Check Out' : '🔒 Submit Report to Check Out'}
                                        </button>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Report</span>
                                        {data.myAttendance.reportSubmitted ? (
                                            <span className="flex items-center gap-1 text-success-400 text-sm">
                                                <HiOutlineCheckCircle className="w-4 h-4" /> Submitted
                                            </span>
                                        ) : (
                                            <Link href="/reports/new" className="flex items-center gap-1 text-warning-400 text-sm hover:text-warning-300">
                                                <HiOutlineExclamationTriangle className="w-4 h-4" /> Pending — Submit now
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-slate-500 mb-4">You haven&apos;t checked in yet today</p>
                                    <button onClick={handleCheckIn} className="btn-primary">
                                        <HiOutlineClock className="w-4 h-4 inline mr-2" />
                                        Check In Now
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Leave Balance */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <HiOutlineCalendarDays className="w-5 h-5 text-primary-400" />
                                Leave Balance
                            </h3>
                            {data?.myLeaveBalance && (
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Total Leaves</span>
                                        <span className="text-slate-900 font-medium">{data.myLeaveBalance.total}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Used</span>
                                        <span className="text-warning-400 font-medium">{data.myLeaveBalance.used}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Remaining</span>
                                        <span className="text-success-400 font-medium">{data.myLeaveBalance.remaining}</span>
                                    </div>
                                    <div className="w-full bg-white rounded-full h-2.5 mt-2">
                                        <div
                                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-500"
                                            style={{ width: `${(data.myLeaveBalance.used / data.myLeaveBalance.total) * 100}%` }}
                                        />
                                    </div>
                                    <Link href="/leaves" className="btn-secondary w-full text-center block text-sm">
                                        Apply for Leave
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Manager/Admin: Team Attendance + Recent Reports */}
                {(role === 'MANAGER' || role === 'ADMIN') && (
                    <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Team Attendance Today */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <HiOutlineUsers className="w-5 h-5 text-primary-400" />
                                Team Attendance Today
                            </h3>
                            {data?.teamAttendance && data.teamAttendance.length > 0 ? (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {data.teamAttendance.map((att: any) => (
                                        <div key={att.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${att.reportSubmitted ? 'bg-success-500' : 'bg-warning-500'}`} />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{att.user?.name}</p>
                                                    <p className="text-xs text-slate-500">In: {formatTime(att.checkIn)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {att.checkOut ? (
                                                    <span className="text-xs text-success-400">Out: {formatTime(att.checkOut)}</span>
                                                ) : att.reportSubmitted ? (
                                                    <span className="badge bg-success-500/20 text-success-300 border-success-500/30">Report ✓</span>
                                                ) : (
                                                    <span className="badge bg-warning-500/20 text-warning-300 border-warning-500/30">No report</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-center py-4">No check-ins yet today</p>
                            )}
                        </div>

                        {/* Recent Reports */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <HiOutlineDocumentText className="w-5 h-5 text-primary-400" />
                                    Recent Reports
                                </h3>
                                <Link href="/reports" className="text-sm text-primary-400 hover:text-primary-300">View all</Link>
                            </div>
                            {data?.recentReports && data.recentReports.length > 0 ? (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {data.recentReports.map((report: any) => (
                                        <div key={report.id} className="p-3 bg-white/50 rounded-xl">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium text-slate-900">{report.user?.name}</p>
                                                <span className="text-xs text-slate-500">{formatDate(report.submittedAt)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2">{report.tasks}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-center py-4">No reports yet</p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Missed Reports Warning */}
                {data?.stats.missedReports && data.stats.missedReports > 0 && (role === 'MANAGER' || role === 'ADMIN') && (
                    <motion.div variants={item} className="bg-danger-500/10 border border-danger-500/30 rounded-2xl p-5 flex items-center gap-4">
                        <HiOutlineExclamationTriangle className="w-8 h-8 text-danger-400 flex-shrink-0" />
                        <div>
                            <p className="text-danger-300 font-medium">Compliance Alert</p>
                            <p className="text-sm text-slate-500">{data.stats.missedReports} missed reports in the last 7 days</p>
                        </div>
                    </motion.div>
                )}

                {/* Quick Actions */}
                <motion.div variants={item}>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {role !== 'ADMIN' && (
                            <>
                                <Link href="/reports/new" className="glass-card-hover p-4 text-center">
                                    <HiOutlineDocumentText className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                                    <span className="text-sm text-slate-600">Submit Report</span>
                                </Link>
                                <Link href="/attendance" className="glass-card-hover p-4 text-center">
                                    <HiOutlineArrowTrendingUp className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                                    <span className="text-sm text-slate-600">Attendance Log</span>
                                </Link>
                            </>
                        )}
                        {role === 'ADMIN' && (
                            <>
                                <Link href="/admin" className="glass-card-hover p-4 text-center">
                                    <HiOutlineUsers className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                                    <span className="text-sm text-slate-600">Manage Users</span>
                                </Link>
                                <Link href="/admin" className="glass-card-hover p-4 text-center">
                                    <HiOutlineDocumentText className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                                    <span className="text-sm text-slate-600">Global Reports</span>
                                </Link>
                            </>
                        )}
                        <Link href="/leaves" className="glass-card-hover p-4 text-center">
                            <HiOutlineCalendarDays className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                            <span className="text-sm text-slate-600">{role === 'ADMIN' ? 'Leave Approvals' : 'Apply Leave'}</span>
                        </Link>
                        <Link href="/projects" className="glass-card-hover p-4 text-center">
                            <HiOutlineFolderOpen className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                            <span className="text-sm text-slate-600">View Projects</span>
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
}
