'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineCalendarDays,
    HiOutlineCheck,
    HiOutlineXMark
} from 'react-icons/hi2';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AttendancePage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;

    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [todayAttendance, setTodayAttendance] = useState<any>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Short Leave Quota State
    const [usedShortLeaveHours, setUsedShortLeaveHours] = useState(0);
    const [showShortLeaveModal, setShowShortLeaveModal] = useState(false);
    const [shortLeaveForm, setShortLeaveForm] = useState({ date: '', hours: 1, reason: '' });
    const [submittingLeave, setSubmittingLeave] = useState(false);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        const startingDayOfWeek = firstDay.getDay();
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const daysInMonth = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    const currentMonthRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth.getMonth() && recordDate.getFullYear() === currentMonth.getFullYear();
    });

    let totalMonthlyOvertime = 0;
    currentMonthRecords.forEach(record => {
        if (!record.isLeave && record.checkOut) {
            const durationHrs = Math.round((new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / 3600000 * 10) / 10;
            if (durationHrs > 8.0) {
                totalMonthlyOvertime += (durationHrs - 8.0);
            }
        }
    });
    totalMonthlyOvertime = Math.round(totalMonthlyOvertime * 10) / 10;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [historyRes, todayRes, shortLeavesRes] = await Promise.all([
                fetch('/api/attendance/history'),
                fetch('/api/attendance/today'),
                fetch('/api/attendance/short-leaves')
            ]);
            if (historyRes.ok) {
                const data = await historyRes.json();

                let mergedList = [...(data.records || [])];
                const allLeaves = data.leaves || [];

                allLeaves.forEach((leave: any) => {
                    const start = new Date(leave.startDate);
                    const end = new Date(leave.endDate);
                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        const existing = mergedList.find((r: any) => new Date(r.date).toISOString().split('T')[0] === dateStr);
                        if (!existing) {
                            mergedList.push({
                                id: `leave-${leave.id}-${dateStr}`,
                                date: d.toISOString(),
                                isLeave: true,
                                leaveType: leave.type,
                                leaveReason: leave.reason
                            });
                        } else {
                            existing.leaveInfo = leave;
                        }
                    }
                });

                mergedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setRecords(mergedList);
            }
            if (todayRes.ok) {
                const data = await todayRes.json();
                setTodayAttendance(data.attendance);
            }
            if (shortLeavesRes.ok) {
                const data = await shortLeavesRes.json();
                setUsedShortLeaveHours(data.usedHours || 0);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLocation = async (): Promise<{ latitude: number, longitude: number, address: string } | null> => {
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
            return null; // Denied or failed
        }
    };

    const handleCheckIn = async () => {
        const location = await fetchLocation();
        if (!location) {
            toast.error('Location access is required to check in. Please enable GPS and try again.');
            return;
        }
        toast.success('Location acquired 📍');

        const res = await fetch('/api/attendance/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(location),
        });
        const data = await res.json();
        if (res.ok) {
            toast.success('Successfully Checked In 🚀');
            fetchData();
        } else toast.error(data.error);
    };

    const handleCheckOut = async () => {
        const location = await fetchLocation();
        if (!location) {
            toast.error('Location access is required to check out. Please enable GPS and try again.');
            return;
        }
        toast.success('Location acquired 📍');

        const res = await fetch('/api/attendance/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(location),
        });
        const data = await res.json();
        if (res.ok) {
            toast.success('Successfully Checked Out 🌙');
            fetchData();
        } else toast.error(data.error);
    };

    const handleShortLeaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingLeave(true);
        try {
            const res = await fetch('/api/attendance/short-leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: shortLeaveForm.date,
                    hoursRequested: Number(shortLeaveForm.hours),
                    reason: shortLeaveForm.reason
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Short leave requested successfully 🎉');
                setShowShortLeaveModal(false);
                setShortLeaveForm({ date: '', hours: 1, reason: '' });
                fetchData();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Failed to submit request');
        } finally {
            setSubmittingLeave(false);
        }
    };

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
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-[1600px]">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-4 sm:p-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em' }}>
                            Time & Attendance
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Log your daily presence and track monthly hours.</p>
                    </div>
                </div>

                {/* ── Quota & Today's Status ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* Short Leave Quota Card */}
                    <div className="glass-card p-6 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none blur-2xl" />

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Short Leave Limit</h2>
                            <button
                                onClick={() => setShowShortLeaveModal(true)}
                                className="text-[10px] font-bold text-amber-700 bg-amber-100/50 border border-amber-200 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition-colors uppercase tracking-wider shadow-sm"
                            >
                                Request Early Out
                            </button>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-2xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    {usedShortLeaveHours}
                                </span>
                                <span className="text-sm font-bold text-slate-400 mb-1.5">/ 11 hrs</span>
                            </div>

                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${usedShortLeaveHours > 9 ? 'bg-gradient-to-r from-rose-400 to-rose-500 shadow-glow-rose' : usedShortLeaveHours > 7 ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-glow-amber' : 'bg-gradient-to-r from-indigo-400 to-indigo-500 shadow-glow-indigo'}`}
                                    style={{ width: `${Math.min(100, (usedShortLeaveHours / 11) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Today's Action Card */}
                    <div className="glass-card p-6 md:col-span-2 flex flex-col justify-center relative overflow-hidden border-2 border-indigo-50 hover:border-indigo-100 transition-colors">
                        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />

                        <div className="flex items-center justify-between mb-5 relative z-10">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                Today's Action
                            </h2>
                            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{formatDate(new Date())}</span>
                        </div>

                        <div className="relative z-10 flex flex-wrap gap-4 items-center">
                            {role === 'ADMIN' ? (
                                <div className="px-6 py-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 font-bold text-center">
                                    Attendance tracking is for employees. Admins don't need to check in.
                                </div>
                            ) : todayAttendance ? (
                                <>
                                    <div className="flex items-center gap-3 px-3 sm:px-5 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                            <HiOutlineClock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Checked In</p>
                                            <p className="text-base font-bold text-slate-900">{formatTime(todayAttendance.checkIn)}</p>
                                        </div>
                                    </div>

                                    {todayAttendance.checkOut ? (
                                        <div className="flex items-center gap-3 px-3 sm:px-5 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                                <HiOutlineClock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Checked Out</p>
                                                <p className="text-base font-bold text-slate-900">{formatTime(todayAttendance.checkOut)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleCheckOut}
                                            disabled={!todayAttendance.reportSubmitted}
                                            className={`px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-sm ${todayAttendance.reportSubmitted
                                                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-glow-rose'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                }`}
                                        >
                                            <span className="text-xs sm:text-sm">
                                                {todayAttendance.reportSubmitted ? 'Check Out Now' : '🔒 Submit Report First'}
                                            </span>
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button onClick={handleCheckIn} className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-3 shadow-glow-indigo transition-all transform hover:scale-[1.02]">
                                    <HiOutlineCheckCircle className="w-6 h-6" />
                                    Check In for Today
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Monthly Calendar View ── */}
                <div className="glass-card overflow-hidden border-2 border-white/60">
                    <div className="p-6 border-b border-slate-100/80 flex flex-wrap justify-between items-center gap-4 bg-white/40">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                <div className="w-2 h-6 rounded-full bg-sky-500" />
                                Calendar View
                            </h2>
                            {totalMonthlyOvertime > 0 && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 shadow-sm border border-amber-200">
                                    Total OT: {totalMonthlyOvertime}h
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                            <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="font-bold text-slate-800 w-32 text-center text-sm">{monthName}</span>
                            <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="p-3 sm:p-6 bg-slate-50/30 overflow-x-auto">
                        <div className="min-w-[640px] sm:min-w-[800px]">
                            <div className="grid grid-cols-7 gap-3 mb-3">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-3">
                                {daysInMonth.map((day, idx) => {
                                    if (!day) return <div key={`empty-${idx}`} className="bg-transparent rounded-2xl min-h-[120px]" />;

                                    const dateObj = new Date(day);
                                    dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
                                    const dateStr = dateObj.toISOString().split('T')[0];

                                    const todayObj = new Date();
                                    todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
                                    const isToday = dateStr === todayObj.toISOString().split('T')[0];

                                    const recordMatch = records.find(r => r.date.startsWith(dateStr));

                                    let cardStyle = "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md";
                                    let content = null;

                                    if (recordMatch) {
                                        if (recordMatch.isLeave) {
                                            cardStyle = "bg-sky-50/80 border-sky-200";
                                            content = (
                                                <div className="text-[10px] text-sky-800 font-bold px-2 py-1.5 bg-sky-100 rounded-lg border border-sky-200 flex items-center gap-1.5 mt-2 shadow-sm">
                                                    🏖️ {recordMatch.leaveType}
                                                </div>
                                            );
                                        } else {
                                            const durationHrs = recordMatch.checkOut
                                                ? Math.round((new Date(recordMatch.checkOut).getTime() - new Date(recordMatch.checkIn).getTime()) / 3600000 * 10) / 10
                                                : null;

                                            const isOvertime = durationHrs && durationHrs > 8.0;
                                            const overtimeHrs = isOvertime ? Math.round((durationHrs! - 8.0) * 10) / 10 : 0;

                                            if (isOvertime) cardStyle = "bg-orange-50/80 border-orange-200";
                                            else if (durationHrs) cardStyle = "bg-emerald-50/60 border-emerald-200";
                                            else cardStyle = "bg-white border-slate-200 shadow-sm";

                                            content = (
                                                <div className="mt-2 space-y-2 flex flex-col justify-end h-full w-full">
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <div className="flex justify-between items-center text-[10px] bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                                                            <span className="text-slate-400 font-bold uppercase">In</span>
                                                            <span className="font-extrabold text-slate-700">{formatTime(recordMatch.checkIn)}</span>
                                                        </div>
                                                        {recordMatch.checkOut && (
                                                            <div className="flex justify-between items-center text-[10px] bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                                                                <span className="text-slate-400 font-bold uppercase">Out</span>
                                                                <span className="font-extrabold text-slate-700">{formatTime(recordMatch.checkOut)}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {durationHrs && (
                                                        <div className="flex flex-wrap gap-1 mt-auto">
                                                            <div className="flex-1 min-w-0 text-[10px] font-bold px-1.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-center border border-emerald-200 truncate">
                                                                {durationHrs}h Total
                                                            </div>
                                                            {isOvertime && (
                                                                <div className="text-[10px] font-bold px-1.5 py-1 rounded-md bg-amber-100 text-amber-800 text-center border border-amber-200 truncate">
                                                                    +{overtimeHrs}h OT
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                    }

                                    return (
                                        <div key={dateStr} className={`rounded-2xl border p-3 min-h-[140px] flex flex-col transition-all relative ${cardStyle} ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
                                            <div className={`text-sm font-extrabold w-8 h-8 flex items-center justify-center rounded-xl shadow-sm ${isToday ? 'bg-indigo-500 text-white' : 'text-slate-700 bg-white border border-slate-100'}`}>
                                                {day.getDate()}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-end mt-2">
                                                {content}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── List History ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            <div className="w-2 h-6 rounded-full bg-emerald-500" />
                            Detailed History
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100/80">
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Date</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Check In</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Check Out</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Report</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Duration</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Overtime</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {records.map((record) => {
                                    if (record.isLeave) {
                                        return (
                                            <tr key={record.id} className="bg-sky-50/40 hover:bg-sky-50/80 transition-colors">
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatDate(record.date)}</td>
                                                <td colSpan={5} className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-sky-700 font-bold bg-sky-100 w-fit px-3 py-1.5 rounded-lg border border-sky-200">
                                                        <span>🏖️ On Leave : {record.leaveType}</span>
                                                        <span className="text-sky-600/60 mx-1">•</span>
                                                        <span className="font-medium">{record.leaveReason}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    const durationHrs = record.checkOut
                                        ? Math.round((new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / 3600000 * 10) / 10
                                        : null;

                                    const isOvertime = durationHrs && durationHrs > 8.0;
                                    const rowClass = isOvertime ? "bg-amber-50/30 hover:bg-amber-50/60" : "hover:bg-slate-50/50";

                                    return (
                                        <tr key={record.id} className={`${rowClass} transition-colors`}>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-900">{formatDate(record.date)}</div>
                                                {record.leaveInfo && (
                                                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-widest bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md">
                                                        {record.leaveInfo.type}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatTime(record.checkIn)}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600">{record.checkOut ? formatTime(record.checkOut) : '—'}</td>
                                            <td className="px-6 py-4">
                                                {record.reportSubmitted ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">
                                                        <HiOutlineCheckCircle className="w-4 h-4" /> Submitted
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700">
                                                        <HiOutlineClock className="w-4 h-4" /> Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-bold ${isOvertime ? 'text-amber-700' : 'text-slate-700'}`}>
                                                    {durationHrs ? `${durationHrs}h` : '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isOvertime ? (
                                                    <span className="inline-flex px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold">
                                                        +{Math.round((durationHrs! - 8.0) * 10) / 10}h
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {records.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                                <HiOutlineCalendarDays className="w-6 h-6 text-slate-300" />
                                            </div>
                                            No attendance records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </motion.div>

            {/* ── Short Leave / Check-out Modal ── */}
            <AnimatePresence>
                {showShortLeaveModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-xl text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Early Checkout</h3>
                                <button onClick={() => setShowShortLeaveModal(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl transition-colors border border-gray-200 shadow-sm">
                                    <HiOutlineXMark className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleShortLeaveSubmit} className="p-6 space-y-5">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Date (Today or Tomorrow only)</label>
                                        <input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            max={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                                            value={shortLeaveForm.date}
                                            onChange={e => setShortLeaveForm({ ...shortLeaveForm, date: e.target.value })}
                                            className="input-field shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-sm font-bold text-slate-700">Hours Requested</label>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{11 - usedShortLeaveHours}h remain</span>
                                        </div>
                                        <input
                                            type="number"
                                            min="0.5"
                                            max={11 - usedShortLeaveHours}
                                            step="0.5"
                                            required
                                            value={shortLeaveForm.hours}
                                            onChange={e => setShortLeaveForm({ ...shortLeaveForm, hours: Number(e.target.value) })}
                                            className="input-field shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Reason</label>
                                        <textarea
                                            required
                                            rows={3}
                                            value={shortLeaveForm.reason}
                                            onChange={e => setShortLeaveForm({ ...shortLeaveForm, reason: e.target.value })}
                                            className="input-field shadow-sm resize-none"
                                            placeholder="Explain why you need early checkout (e.g. Doctor's appointment)"
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/50 -mx-6 -mb-6 px-6 py-4 rounded-b-3xl">
                                    <button type="button" onClick={() => setShowShortLeaveModal(false)} className="btn-secondary flex-1">Cancel</button>
                                    <button type="submit" disabled={submittingLeave} className="btn-primary flex-1 shadow-glow-indigo">
                                        {submittingLeave ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
