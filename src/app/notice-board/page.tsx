'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast from 'react-hot-toast';
import {
    HiOutlineMegaphone,
    HiOutlinePlusCircle,
    HiOutlineTrash,
    HiOutlineBell,
    HiOutlineDevicePhoneMobile,
    HiOutlineExclamationTriangle,
    HiOutlineInformationCircle,
    HiOutlineCheckCircle,
    HiXMark,
} from 'react-icons/hi2';

const PRIORITY_CONFIG = {
    URGENT: {
        label: 'Urgent',
        icon: HiOutlineExclamationTriangle,
        bg: 'from-rose-50 to-red-50',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-700',
        dot: 'bg-rose-500',
        iconColor: 'text-rose-500',
        headerBg: 'from-rose-500 to-red-500',
    },
    NORMAL: {
        label: 'General',
        icon: HiOutlineMegaphone,
        bg: 'from-indigo-50 to-violet-50',
        border: 'border-indigo-200',
        badge: 'bg-indigo-100 text-indigo-700',
        dot: 'bg-indigo-500',
        iconColor: 'text-indigo-500',
        headerBg: 'from-indigo-500 to-violet-500',
    },
    INFO: {
        label: 'Info',
        icon: HiOutlineInformationCircle,
        bg: 'from-sky-50 to-blue-50',
        border: 'border-sky-200',
        badge: 'bg-sky-100 text-sky-700',
        dot: 'bg-sky-500',
        iconColor: 'text-sky-500',
        headerBg: 'from-sky-500 to-blue-500',
    },
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

interface Notice {
    id: string;
    title: string;
    message: string;
    priority: 'URGENT' | 'NORMAL' | 'INFO';
    whatsappSent: boolean;
    createdAt: string;
    postedBy: { id: string; name: string; designation: string | null };
}

export default function NoticeBoardPage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role || 'EMPLOYEE';
    const isAdmin = role === 'ADMIN';

    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: '',
        message: '',
        priority: 'NORMAL',
        sendWhatsApp: true,
    });

    useEffect(() => { fetchNotices(); }, []);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notices');
            if (res.ok) {
                const data = await res.json();
                setNotices(data.notices);
            }
        } catch { toast.error('Failed to load notices'); }
        finally { setLoading(false); }
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim()) {
            toast.error('Title and message are required');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/notices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                const wa = data.whatsapp;
                if (wa?.skipped) {
                    toast.success(`Notice posted! ${data.notified} portal notifications sent. (WhatsApp not configured)`);
                } else {
                    toast.success(`Notice posted! ${data.notified} portal + ${wa?.sent ?? 0} WhatsApp messages sent.`);
                }
                setIsModalOpen(false);
                setForm({ title: '', message: '', priority: 'NORMAL', sendWhatsApp: true });
                fetchNotices();
            } else {
                toast.error(data.error || 'Failed to post notice');
            }
        } catch { toast.error('Something went wrong'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this notice?')) return;
        try {
            const res = await fetch(`/api/notices/${id}`, { method: 'DELETE' });
            if (res.ok) { toast.success('Notice deleted'); fetchNotices(); }
            else toast.error('Failed to delete');
        } catch { toast.error('Something went wrong'); }
    };

    return (
        <DashboardLayout>
            <motion.div
                className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            Notice Board
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">Official announcements from management</p>
                    </div>
                    {isAdmin && (
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
                        >
                            <HiOutlinePlusCircle className="w-5 h-5" />
                            Post Notice
                        </motion.button>
                    )}
                </motion.div>

                {/* Notices List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : notices.length === 0 ? (
                    <motion.div variants={itemVariants} className="text-center py-20">
                        <HiOutlineMegaphone className="w-14 h-14 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No notices posted yet</p>
                        {isAdmin && <p className="text-slate-400 text-sm mt-1">Click "Post Notice" to send an announcement</p>}
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {notices.map((notice) => {
                            const cfg = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.NORMAL;
                            const Icon = cfg.icon;
                            return (
                                <motion.div
                                    key={notice.id}
                                    variants={itemVariants}
                                    className={`rounded-2xl border bg-gradient-to-br ${cfg.bg} ${cfg.border} overflow-hidden`}
                                >
                                    {/* Priority stripe */}
                                    <div className={`h-1 w-full bg-gradient-to-r ${cfg.headerBg}`} />

                                    <div className="p-4 sm:p-5">
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm`}>
                                                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${cfg.iconColor}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                                                        <h3 className="font-bold text-slate-900 text-base leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                            {notice.title}
                                                        </h3>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${cfg.badge}`}>
                                                            {cfg.label}
                                                        </span>
                                                    </div>
                                                    {/* Delete always visible on mobile (no hover) */}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDelete(notice.id)}
                                                            className="flex-shrink-0 p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                            title="Delete notice"
                                                        >
                                                            <HiOutlineTrash className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{notice.message}</p>

                                                {/* Footer */}
                                                <div className="flex items-center gap-3 mt-3 flex-wrap">
                                                    <span className="text-xs text-slate-500">
                                                        By <span className="font-medium text-slate-700">{notice.postedBy.name}</span>
                                                        {notice.postedBy.designation && ` · ${notice.postedBy.designation}`}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{timeAgo(notice.createdAt)}</span>
                                                    <div className="flex items-center gap-2 ml-auto">
                                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                            <HiOutlineBell className="w-3 h-3" /> Portal
                                                        </span>
                                                        {notice.whatsappSent && (
                                                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                                                                <HiOutlineDevicePhoneMobile className="w-3 h-3" /> WhatsApp ✓
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* Post Notice Modal */}
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
                            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                            <HiOutlineMegaphone className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                Post a Notice
                                            </h3>
                                            <p className="text-xs text-slate-400">Sends portal notifications + WhatsApp to all employees</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                        <HiXMark className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handlePost} className="p-5 space-y-4">
                                    {/* Priority */}
                                    <div>
                                        <label className="input-label">Priority</label>
                                        <div className="grid grid-cols-3 gap-2 mt-1">
                                            {(['NORMAL', 'INFO', 'URGENT'] as const).map((p) => {
                                                const cfg = PRIORITY_CONFIG[p];
                                                return (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setForm({ ...form, priority: p })}
                                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${form.priority === p
                                                            ? `${cfg.badge} ${cfg.border} border-2 scale-[1.02]`
                                                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <cfg.icon className={`w-3.5 h-3.5 ${form.priority === p ? cfg.iconColor : ''}`} />
                                                        {cfg.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="input-label">Title *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. Office closed on 14th April"
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="input-label">Message *</label>
                                        <textarea
                                            className="input-field resize-none"
                                            rows={5}
                                            placeholder="Write your announcement here..."
                                            value={form.message}
                                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {/* WhatsApp toggle */}
                                    <div
                                        onClick={() => setForm({ ...form, sendWhatsApp: !form.sendWhatsApp })}
                                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${form.sendWhatsApp ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
                                    >
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${form.sendWhatsApp ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <HiOutlineDevicePhoneMobile className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-semibold ${form.sendWhatsApp ? 'text-emerald-800' : 'text-slate-600'}`}>
                                                Send via WhatsApp
                                            </p>
                                            <p className="text-xs text-slate-400">Delivers to all employee phone numbers</p>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full transition-colors relative ${form.sendWhatsApp ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.sendWhatsApp ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </div>
                                    </div>

                                    {/* Delivery summary */}
                                    <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-xl">
                                        <HiOutlineCheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-indigo-700">
                                            This notice will be posted publicly on the Notice Board and all employees will receive a portal notification.
                                            {form.sendWhatsApp && ' WhatsApp messages will also be sent to all registered phone numbers.'}
                                        </p>
                                    </div>

                                    <div className="flex gap-3 pt-1">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60"
                                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                        >
                                            {submitting
                                                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                                                : <><HiOutlineMegaphone className="w-4 h-4" /> Post & Notify</>
                                            }
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
