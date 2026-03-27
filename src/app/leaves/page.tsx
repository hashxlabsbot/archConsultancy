'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineCalendarDays,
    HiOutlinePlus,
    HiOutlineCheck,
    HiOutlineXMark,
    HiOutlineDocumentText,
    HiOutlineClock,
    HiOutlineArchiveBoxXMark,
} from 'react-icons/hi2';
import { formatDate, getStatusBadgeColor } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LeavesPage() {
    const { data: session } = useSession();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [shortLeaves, setShortLeaves] = useState<any[]>([]);
    const [balance, setBalance] = useState({ total: 19, used: 0, remaining: 19 });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ type: 'FULL', startDate: '', endDate: '', reason: '', hoursRequested: '' });
    const role = (session?.user as any)?.role;

    useEffect(() => { if (role) fetchLeaves(); }, [role]);

    const fetchLeaves = async () => {
        try {
            const res = await fetch('/api/leaves');
            if (res.ok) {
                const data = await res.json();
                setLeaves(data.leaves);
                if (data.balance) setBalance(data.balance);
            }

            const slEndpoint = (role === 'EMPLOYEE' || role === 'SITE_ENGINEER') ? '/api/attendance/short-leaves' : '/api/admin/short-leaves';
            const slRes = await fetch(slEndpoint);
            if (slRes.ok) {
                const slData = await slRes.json();
                setShortLeaves(slData.requests || slData.history || []);
            }
        } catch (err) { } finally { setLoading(false); }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let res;
            if (form.type === 'SHORT') {
                res = await fetch('/api/attendance/short-leaves', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: form.startDate,
                        hoursRequested: parseInt(form.hoursRequested),
                        reason: form.reason
                    }),
                });
            } else {
                res = await fetch('/api/leaves', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: form.type, startDate: form.startDate, endDate: form.endDate, reason: form.reason }),
                });
            }

            if (res.ok) {
                toast.success('Leave applied successfully 🎉');
                setShowForm(false);
                setForm({ type: 'FULL', startDate: '', endDate: '', reason: '', hoursRequested: '' });
                fetchLeaves();
            } else {
                const data = await res.json();
                toast.error(data.error);
            }
        } catch (err) { toast.error('Failed to apply'); }
    };

    const handleAction = async (id: string, action: string, isShortLeave = false) => {
        try {
            const url = isShortLeave ? `/api/admin/short-leaves/${id}` : `/api/leaves/${id}`;
            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isShortLeave ? { status: action } : { action }),
            });
            if (res.ok) {
                toast.success(`Leave ${action.toLowerCase()}`);
                fetchLeaves();
            }
        } catch (err) { toast.error('Action failed'); }
    };

    const statCards = [
        { label: 'Total Annual Leaves', value: balance.total, icon: HiOutlineCalendarDays, iconClass: 'icon-sq-indigo' },
        { label: 'Leaves Used', value: balance.used, icon: HiOutlineArchiveBoxXMark, iconClass: 'icon-sq-amber' },
        { label: 'Remaining Balance', value: balance.remaining, icon: HiOutlineDocumentText, iconClass: 'icon-sq-emerald' },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-[1600px]">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-4 sm:p-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em' }}>
                            Leave Management
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">{role === 'ADMIN' ? 'Review and manage employee leave requests.' : 'Track balances and submit time-off requests.'}</p>
                    </div>
                    {role !== 'ADMIN' && (
                        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 shadow-glow-indigo text-sm">
                            <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5" /> Apply for Leave
                        </button>
                    )}
                </div>

                {/* ── Balance Cards (hidden for Admin) ── */}
                {role !== 'ADMIN' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {statCards.map((stat, idx) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1, duration: 0.4 }}
                                className="glass-card p-6 flex items-start justify-between"
                            >
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{stat.label}</p>
                                    <p className="text-2xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`${stat.iconClass} w-12 h-12 shadow-sm`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* ── Leave Requests Table ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            <div className="w-2 h-6 rounded-full bg-indigo-500" />
                            Leave History
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100/80">
                                    {(role !== 'EMPLOYEE' && role !== 'SITE_ENGINEER') && <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Employee</th>}
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Type</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Duration</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Reason</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
                                    {(role === 'MANAGER' || role === 'ADMIN') && <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {leaves.map((leave) => (
                                    <tr key={leave.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        {(role !== 'EMPLOYEE' && role !== 'SITE_ENGINEER') && (
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-900">{leave.user?.name}</span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
                                                {typeof leave.type === 'string' ? leave.type.replace(/_/g, ' ') : leave.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700">{formatDate(leave.startDate)}</span>
                                                {leave.endDate && leave.startDate !== leave.endDate && (
                                                    <span className="text-xs text-slate-400">to {formatDate(leave.endDate)}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600 max-w-xs truncate" title={leave.reason}>{leave.reason}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`badge ${getStatusBadgeColor(leave.status)}`}>{leave.status}</span>
                                        </td>
                                        {(role === 'MANAGER' || role === 'ADMIN') && (
                                            <td className="px-6 py-4">
                                                {leave.status === 'PENDING' && (
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleAction(leave.id, 'APPROVED')} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors" title="Approve">
                                                            <HiOutlineCheck className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleAction(leave.id, 'REJECTED')} className="p-1.5 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors" title="Reject">
                                                            <HiOutlineXMark className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {leaves.length === 0 && (
                                    <tr>
                                        <td colSpan={(role !== 'EMPLOYEE' && role !== 'SITE_ENGINEER') ? 6 : 5} className="px-6 py-12 text-center text-slate-400">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                                <HiOutlineCalendarDays className="w-6 h-6 text-slate-300" />
                                            </div>
                                            No leave requests found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* ── Short Leave / Early Checkout Table ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
                    <div className="p-5 border-b border-amber-100 flex items-center justify-between bg-amber-50/30">
                        <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            <div className="w-2 h-6 rounded-full bg-amber-400" />
                            Short Leaves & Early Checkouts
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-amber-50/20 border-b border-amber-100/50">
                                    {(role !== 'EMPLOYEE' && role !== 'SITE_ENGINEER') && <th className="text-xs font-bold text-amber-800/60 uppercase tracking-wider px-6 py-4">Employee</th>}
                                    <th className="text-xs font-bold text-amber-800/60 uppercase tracking-wider px-6 py-4">Date</th>
                                    <th className="text-xs font-bold text-amber-800/60 uppercase tracking-wider px-6 py-4">Duration</th>
                                    <th className="text-xs font-bold text-amber-800/60 uppercase tracking-wider px-6 py-4">Reason</th>
                                    <th className="text-xs font-bold text-amber-800/60 uppercase tracking-wider px-6 py-4">Status</th>
                                    {(role === 'MANAGER' || role === 'ADMIN') && <th className="text-xs font-bold text-amber-800/60 uppercase tracking-wider px-6 py-4">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100/30">
                                {shortLeaves.map((sl) => (
                                    <tr key={sl.id} className="hover:bg-amber-50/50 transition-colors group">
                                        {(role !== 'EMPLOYEE' && role !== 'SITE_ENGINEER') && (
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-900">{sl.user?.name}</span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{formatDate(sl.date)}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700">
                                                <HiOutlineClock className="w-3.5 h-3.5" /> {sl.hoursRequested}h
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={sl.reason}>{sl.reason}</td>
                                        <td className="px-6 py-4"><span className={`badge ${getStatusBadgeColor(sl.status)}`}>{sl.status}</span></td>
                                        {(role === 'MANAGER' || role === 'ADMIN') && (
                                            <td className="px-6 py-4">
                                                {sl.status === 'PENDING' && (
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleAction(sl.id, 'APPROVED', true)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors" title="Approve">
                                                            <HiOutlineCheck className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleAction(sl.id, 'REJECTED', true)} className="p-1.5 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors" title="Reject">
                                                            <HiOutlineXMark className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {shortLeaves.length === 0 && (
                                    <tr>
                                        <td colSpan={(role !== 'EMPLOYEE' && role !== 'SITE_ENGINEER') ? 6 : 5} className="px-6 py-12 text-center text-amber-800/40">
                                            No short leave requests found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </motion.div>

            {/* ── Apply Leave Modal ── */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Request Time Off</h3>
                                <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl transition-colors border border-gray-200 shadow-sm">
                                    <HiOutlineXMark className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleApply} className="p-6 space-y-5">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Leave Type</label>
                                        <select className="input-field shadow-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                            <option value="FULL">Full Day</option>
                                            <option value="FIRST_HALF">First Half Day</option>
                                            <option value="SECOND_HALF">Second Half Day</option>
                                            <option value="CUSTOM">Custom Range</option>
                                            <option value="SHORT">Short Leave / Early Checkout (&lt; 1 Day)</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {form.type === 'SHORT' ? (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Date</label>
                                                    <input type="date" className="input-field shadow-sm" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required min={new Date().toISOString().split('T')[0]} max={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Hours Requested</label>
                                                    <input type="number" min="1" max="11" className="input-field shadow-sm" value={form.hoursRequested} onChange={(e) => setForm({ ...form, hoursRequested: e.target.value })} required placeholder="e.g. 2" />
                                                </div>
                                            </>
                                        ) : form.type === 'CUSTOM' ? (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Start Date</label>
                                                    <input type="date" className="input-field shadow-sm" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">End Date</label>
                                                    <input type="date" className="input-field shadow-sm" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Date</label>
                                                <input type="date" className="input-field shadow-sm" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: e.target.value })} required />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Reason / Comments</label>
                                        <textarea className="input-field shadow-sm min-h-[100px] resize-none" placeholder="Provide a brief reason for your request..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/50 -mx-6 -mb-6 px-6 py-4 rounded-b-3xl">
                                    <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6">Cancel</button>
                                    <button type="submit" className="btn-primary px-8 shadow-glow-indigo">Submit Request</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
