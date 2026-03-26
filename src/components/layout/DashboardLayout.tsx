'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { motion } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

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
                        <div className="absolute -inset-2 rounded-3xl animate-pulse-glow opacity-0" />
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
        </div>
    );
}
