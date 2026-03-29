'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    HiOutlineMegaphone,
    HiOutlineExclamationTriangle,
    HiOutlineInformationCircle,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiXMark,
} from 'react-icons/hi2';

const PRIORITY_CONFIG: Record<string, { border: string; badge: string; iconColor: string; stripe: string; icon: any }> = {
    URGENT: {
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-700',
        iconColor: 'text-rose-500',
        stripe: 'from-rose-500 to-red-500',
        icon: HiOutlineExclamationTriangle,
    },
    NORMAL: {
        border: 'border-indigo-200',
        badge: 'bg-indigo-100 text-indigo-700',
        iconColor: 'text-indigo-500',
        stripe: 'from-indigo-500 to-violet-500',
        icon: HiOutlineMegaphone,
    },
    INFO: {
        border: 'border-sky-200',
        badge: 'bg-sky-100 text-sky-700',
        iconColor: 'text-sky-500',
        stripe: 'from-sky-500 to-blue-500',
        icon: HiOutlineInformationCircle,
    },
};

function NoticePopup({ notices, onDismiss }: { notices: any[]; onDismiss: () => void }) {
    const [index, setIndex] = useState(0);
    const notice = notices[index];
    const cfg = PRIORITY_CONFIG[notice?.priority] || PRIORITY_CONFIG.NORMAL;
    const Icon = cfg.icon;
    const total = notices.length;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 24 }}
                transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                className={`bg-white rounded-2xl shadow-2xl w-full max-w-md border ${cfg.border} overflow-hidden`}
            >
                {/* Priority stripe */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.stripe}`} />

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Notice from Management
                            </p>
                            {total > 1 && (
                                <p className="text-[10px] text-slate-400">{index + 1} of {total} unread</p>
                            )}
                        </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {notice.priority === 'URGENT' ? 'URGENT' : notice.priority === 'INFO' ? 'INFO' : 'NOTICE'}
                    </span>
                </div>

                {/* Content */}
                <div className="px-5 pb-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {notice.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {notice.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-3">
                        — {notice.postedBy?.name}{notice.postedBy?.designation ? `, ${notice.postedBy.designation}` : ''}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 flex items-center gap-2">
                    {/* Prev/Next if multiple notices */}
                    {total > 1 && (
                        <div className="flex items-center gap-1 mr-auto">
                            <button
                                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                                disabled={index === 0}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                            >
                                <HiOutlineChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex gap-1">
                                {notices.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setIndex(i)}
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-indigo-500 w-3' : 'bg-slate-300'}`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                                disabled={index === total - 1}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                            >
                                <HiOutlineChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <Link
                        href="/notice-board"
                        onClick={onDismiss}
                        className="text-sm text-indigo-600 font-medium hover:text-indigo-700 hover:underline ml-auto"
                    >
                        View Board
                    </Link>
                    <button
                        onClick={onDismiss}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                        <HiXMark className="w-4 h-4" />
                        Got it
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadNotices, setUnreadNotices] = useState<any[]>([]);
    const [showNoticePopup, setShowNoticePopup] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status, router]);

    // Fetch unread notices once session is ready (non-admin only)
    useEffect(() => {
        const role = (session?.user as any)?.role;
        if (status === 'authenticated' && role !== 'ADMIN') {
            fetchUnreadNotices();
        }
    }, [status, session]);

    const fetchUnreadNotices = async () => {
        try {
            const res = await fetch('/api/notices?unread=true');
            if (res.ok) {
                const data = await res.json();
                if (data.notices?.length > 0) {
                    setUnreadNotices(data.notices);
                    setShowNoticePopup(true);
                }
            }
        } catch { }
    };

    const handleDismissPopup = async () => {
        setShowNoticePopup(false);
        // Mark all shown notices as read
        await Promise.all(
            unreadNotices.map((n) =>
                fetch(`/api/notices/${n.id}`, { method: 'PATCH' }).catch(() => { })
            )
        );
        setUnreadNotices([]);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f6fa' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 21H21M3 21V8L12 3L21 8V21M9 21V15H15V21M9 12H10M14 12H15M9 9H10M14 9H15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-base font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Arch Consultancy</p>
                        <p className="text-sm text-slate-400 mt-0.5">Loading your workspace...</p>
                    </div>
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-2 h-2 rounded-full bg-indigo-400"
                                style={{ animation: `pulseSoft 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                        ))}
                    </div>
                </div>
                <style>{`
                    @keyframes pulseSoft {
                        0%, 100% { opacity: 0.3; transform: scale(0.8); }
                        50% { opacity: 1; transform: scale(1); }
                    }
                `}</style>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen relative bg-surface-base">
            {/* Global Architecture Background — desktop only */}
            <div className="fixed inset-0 z-0 pointer-events-none mix-blend-multiply hidden md:block">
                <div className="absolute inset-0 arch-blueprint-grid opacity-30" />
                <div className="arch-line-h w-full top-1/3 opacity-50" />
                <div className="arch-line-h w-full top-2/3 opacity-30" style={{ animationDelay: '2s' }} />
                <div className="arch-line-v h-full left-1/3 opacity-50" style={{ animationDelay: '1.5s' }} />
                <div className="arch-line-v h-full right-1/4 opacity-40" style={{ animationDelay: '3s' }} />
                <div className="absolute bottom-20 left-10 w-64 h-64 border border-indigo-200/40 rounded-full arch-geometry-float opacity-20" style={{ animationDelay: '5s' }} />
                <div className="absolute top-40 right-10 w-40 h-40 border border-sky-200/40 arch-geometry-float opacity-20" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10">
                <Sidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
                <div className="md:pl-64 transition-all duration-300 min-h-screen flex flex-col">
                    <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                    <motion.main
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="p-3 sm:p-4 md:p-6 flex-1"
                    >
                        {children}
                    </motion.main>
                </div>
            </div>

            {/* Unread Notice Popup */}
            <AnimatePresence>
                {showNoticePopup && unreadNotices.length > 0 && (
                    <NoticePopup notices={unreadNotices} onDismiss={handleDismissPopup} />
                )}
            </AnimatePresence>
        </div>
    );
}
