'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AttendancePage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [todayAttendance, setTodayAttendance] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [historyRes, todayRes] = await Promise.all([
                fetch('/api/attendance/history'),
                fetch('/api/attendance/today'),
            ]);
            if (historyRes.ok) {
                const data = await historyRes.json();
                setRecords(data.records);
            }
            if (todayRes.ok) {
                const data = await todayRes.json();
                setTodayAttendance(data.attendance);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        const res = await fetch('/api/attendance/checkin', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            toast.success('Checked in!');
            fetchData();
        } else toast.error(data.error);
    };

    const handleCheckOut = async () => {
        const res = await fetch('/api/attendance/checkout', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            toast.success('Checked out!');
            fetchData();
        } else toast.error(data.error);
    };

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
                        <p className="text-slate-500 mt-1">Track your daily check-in and check-out</p>
                    </div>
                </div>

                {/* Today's Status */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Today — {formatDate(new Date())}</h2>
                    {todayAttendance ? (
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2 px-4 py-2 bg-success-500/10 rounded-xl border border-success-500/30">
                                <HiOutlineClock className="w-4 h-4 text-success-400" />
                                <span className="text-sm text-success-300">In: {formatTime(todayAttendance.checkIn)}</span>
                            </div>
                            {todayAttendance.checkOut ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/30">
                                    <HiOutlineClock className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm text-blue-300">Out: {formatTime(todayAttendance.checkOut)}</span>
                                </div>
                            ) : (
                                <button onClick={handleCheckOut} disabled={!todayAttendance.reportSubmitted}
                                    className={todayAttendance.reportSubmitted ? 'btn-danger text-sm' : 'btn-secondary text-sm opacity-60 cursor-not-allowed'}>
                                    {todayAttendance.reportSubmitted ? 'Check Out' : '🔒 Submit Report First'}
                                </button>
                            )}
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${todayAttendance.reportSubmitted ? 'bg-success-500/10 border-success-500/30' : 'bg-warning-500/10 border-warning-500/30'}`}>
                                {todayAttendance.reportSubmitted ? (
                                    <><HiOutlineCheckCircle className="w-4 h-4 text-success-400" /><span className="text-sm text-success-300">Report Submitted</span></>
                                ) : (
                                    <><HiOutlineXCircle className="w-4 h-4 text-warning-400" /><span className="text-sm text-warning-300">Report Pending</span></>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button onClick={handleCheckIn} className="btn-primary">
                            <HiOutlineClock className="w-4 h-4 inline mr-2" /> Check In
                        </button>
                    )}
                </div>

                {/* History */}
                <div className="glass-card overflow-hidden">
                    <div className="p-5 border-b border-gray-200/50">
                        <h2 className="text-lg font-semibold text-slate-900">Attendance History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/50">
                                    <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Date</th>
                                    <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Check In</th>
                                    <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Check Out</th>
                                    <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Report</th>
                                    <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record) => {
                                    const duration = record.checkOut
                                        ? `${Math.round((new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / 3600000 * 10) / 10}h`
                                        : '—';
                                    return (
                                        <tr key={record.id} className="border-t border-gray-200/50 hover:bg-white/30 transition-colors">
                                            <td className="px-5 py-3 text-sm text-slate-900">{formatDate(record.date)}</td>
                                            <td className="px-5 py-3 text-sm text-slate-600">{formatTime(record.checkIn)}</td>
                                            <td className="px-5 py-3 text-sm text-slate-600">{record.checkOut ? formatTime(record.checkOut) : '—'}</td>
                                            <td className="px-5 py-3">
                                                {record.reportSubmitted ? (
                                                    <span className="badge bg-success-500/20 text-success-300 border-success-500/30">Submitted</span>
                                                ) : (
                                                    <span className="badge bg-warning-500/20 text-warning-300 border-warning-500/30">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-slate-600">{duration}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {records.length === 0 && !loading && (
                            <p className="text-center text-slate-500 py-8">No attendance records yet</p>
                        )}
                    </div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
