'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast from 'react-hot-toast';
import { getInitials } from '@/lib/utils';
import {
    HiOutlineTrophy,
    HiOutlineStar,
    HiOutlineUserCircle,
    HiOutlinePlusCircle,
    HiOutlineTrash,
    HiXMark,
    HiOutlineCalendarDays,
    HiOutlineChatBubbleLeftRight,
} from 'react-icons/hi2';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

interface EOMRecord {
    id: string;
    month: number;
    year: number;
    reason: string | null;
    createdAt: string;
    user: { id: string; name: string; designation: string | null; role: string };
    grantedBy: { id: string; name: string };
}

export default function EmployeeOfTheMonthPage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role || 'JUNIOR';
    const isAdmin = role === 'ADMIN';

    const [current, setCurrent] = useState<EOMRecord | null>(null);
    const [history, setHistory] = useState<EOMRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        userId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        reason: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/employee-of-month');
            if (res.ok) {
                const data = await res.json();
                setCurrent(data.current);
                setHistory(data.history);
            }
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const openModal = async () => {
        setIsModalOpen(true);
        if (users.length === 0) {
            try {
                const res = await fetch('/api/users');
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users.filter((u: any) => u.role !== 'ADMIN'));
                }
            } catch { }
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.userId) { toast.error('Please select an employee'); return; }
        setSubmitting(true);
        try {
            const res = await fetch('/api/employee-of-month', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch {
                toast.error(`Server error ${res.status}: ${res.statusText}`);
                return;
            }

            if (res.ok) {
                toast.success('Employee of the Month assigned!');
                setIsModalOpen(false);
                fetchData();
            } else {
                toast.error(data.error || `Error ${res.status}`);
            }
        } catch (err: any) {
            toast.error(err?.message || 'Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this award record?')) return;
        try {
            const res = await fetch(`/api/employee-of-month/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Record removed');
                fetchData();
            } else {
                toast.error('Failed to remove');
            }
        } catch {
            toast.error('Something went wrong');
        }
    };

    const roleLabel: Record<string, string> = {
        ADMIN: 'Principal Architect', SENIOR: 'Senior', JUNIOR: 'Junior',
        TRAINEE: 'Trainee', INTERN: 'Intern', SITE_SUPERVISOR: 'Site Supervisor',
        SITE_ENGINEER: 'Site Engineer', NON_TECHNICAL: 'Non Technical',
    };

    return (
        <DashboardLayout>
            <motion.div
                className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            Employee of the Month
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">Recognizing outstanding team members</p>
                    </div>
                    {isAdmin && (
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={openModal}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
                        >
                            <HiOutlinePlusCircle className="w-5 h-5" />
                            Assign Award
                        </motion.button>
                    )}
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Current Month Winner */}
                        <motion.div variants={itemVariants}>
                            {current ? (
                                <div
                                    className="relative overflow-hidden rounded-2xl p-6 md:p-8"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #0ea5e9 100%)',
                                        boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
                                    }}
                                >
                                    {/* Background decorations */}
                                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff, transparent)', transform: 'translate(30%, -30%)' }} />
                                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff, transparent)', transform: 'translate(-30%, 30%)' }} />

                                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                                        {/* Trophy icon */}
                                        <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                            <HiOutlineTrophy className="w-10 h-10 text-yellow-300" />
                                        </div>

                                        <div className="flex-1 text-center md:text-left">
                                            <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-1">
                                                {MONTH_NAMES[current.month - 1]} {current.year}
                                            </p>
                                            <h2 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                {current.user.name}
                                            </h2>
                                            <p className="text-white/80 text-sm mb-4">
                                                {current.user.designation || roleLabel[current.user.role] || current.user.role}
                                            </p>

                                            {current.reason && (
                                                <div className="inline-flex items-start gap-2 bg-white/15 backdrop-blur rounded-xl px-4 py-3 text-white/90 text-sm max-w-lg text-left">
                                                    <HiOutlineChatBubbleLeftRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span>{current.reason}</span>
                                                </div>
                                            )}

                                            <p className="text-white/50 text-xs mt-4">
                                                Awarded by {current.grantedBy.name}
                                            </p>
                                        </div>

                                        {/* Avatar initials */}
                                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                            {getInitials(current.user.name)}
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDelete(current.id)}
                                            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white/70 hover:text-white transition-colors"
                                            title="Remove award"
                                        >
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                                    <HiOutlineTrophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No winner selected for this month yet</p>
                                    {isAdmin && (
                                        <p className="text-slate-400 text-sm mt-1">Click &quot;Assign Award&quot; to recognize a team member</p>
                                    )}
                                </div>
                            )}
                        </motion.div>

                        {/* History */}
                        <motion.div variants={itemVariants}>
                            <h2 className="text-lg font-bold text-slate-800 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                Hall of Fame
                            </h2>
                            {history.length === 0 ? (
                                <p className="text-slate-400 text-sm">No past records yet.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {history.map((record) => (
                                        <motion.div
                                            key={record.id}
                                            variants={itemVariants}
                                            className="glass-card p-4 rounded-2xl relative"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                                    {getInitials(record.user.name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900 text-sm truncate">{record.user.name}</p>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {record.user.designation || roleLabel[record.user.role] || record.user.role}
                                                    </p>
                                                </div>
                                                {isAdmin ? (
                                                    <button
                                                        onClick={() => handleDelete(record.id)}
                                                        className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex-shrink-0"
                                                        title="Remove"
                                                    >
                                                        <HiOutlineTrash className="w-3.5 h-3.5" />
                                                    </button>
                                                ) : (
                                                    <HiOutlineStar className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium mb-2">
                                                <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                                                {MONTH_NAMES[record.month - 1]} {record.year}
                                            </div>

                                            {record.reason && (
                                                <p className="text-xs text-slate-500 line-clamp-2">{record.reason}</p>
                                            )}

                                            <p className="text-xs text-slate-400 mt-2">By {record.grantedBy.name}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </motion.div>

            {/* Assign Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                        >
                            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                            <HiOutlineTrophy className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                            Assign Award
                                        </h3>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                        <HiXMark className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleAssign} className="space-y-4">
                                    {/* Employee */}
                                    <div>
                                        <label className="input-label">Employee *</label>
                                        <select
                                            className="input-field"
                                            value={formData.userId}
                                            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select employee...</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} — {u.designation || roleLabel[u.role] || u.role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Month & Year */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="input-label">Month *</label>
                                            <select
                                                className="input-field"
                                                value={formData.month}
                                                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                                            >
                                                {MONTH_NAMES.map((m, i) => (
                                                    <option key={m} value={i + 1}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="input-label">Year *</label>
                                            <select
                                                className="input-field"
                                                value={formData.year}
                                                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                                            >
                                                {[2023, 2024, 2025, 2026, 2027].map((y) => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div>
                                        <label className="input-label">Reason / Citation</label>
                                        <textarea
                                            className="input-field resize-none"
                                            rows={3}
                                            placeholder="Why are they being recognized? (optional)"
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-1">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                            {submitting ? (
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <HiOutlineTrophy className="w-4 h-4" />
                                            )}
                                            {submitting ? 'Saving...' : 'Assign Award'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
