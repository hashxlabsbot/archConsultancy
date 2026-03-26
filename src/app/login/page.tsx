'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeSlash, HiOutlineLockClosed, HiOutlineEnvelope } from 'react-icons/hi2';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success('Welcome back!');
                router.push('/dashboard');
                router.refresh();
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative bg-surface-base overflow-hidden">
            {/* Ambient Architecture Background */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-white">
                <div className="absolute inset-0 bg-[url('/blueprint-bg.png')] bg-cover bg-center opacity-40 mix-blend-multiply filter grayscale pointer-events-none" />
                <div className="absolute inset-0 arch-blueprint-grid-lg opacity-50" />
                <div className="arch-line-h w-full top-[15%]" />
                <div className="arch-line-h w-full top-[65%]" style={{ animationDelay: '1s' }} />
                <div className="arch-line-v h-full left-[20%]" />
                <div className="arch-line-v h-full left-[80%]" style={{ animationDelay: '2s' }} />

                {/* Floating Architectural Geometry */}
                <div className="absolute top-[10%] right-[10%] w-40 h-40 border border-indigo-200 rounded-full opacity-40 arch-geometry-float" />
                <div className="absolute bottom-[10%] left-[5%] w-64 h-64 border border-sky-100 opacity-40 arch-geometry-float" style={{ animationDelay: '4s', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-[420px] px-4"
            >
                <div className="glass-card shadow-card-hover rounded-3xl overflow-hidden p-[2px]">
                    {/* Inner glowing container border trick */}
                    <div className="bg-white rounded-[22px] p-8 h-full relative z-10">
                        {/* Logo & Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="text-center mb-8"
                        >
                            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #38bdf8)', boxShadow: '0 8px 24px rgba(99,102,241,0.25)' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 21H21M3 21V8L12 3L21 8V21M9 21V15H15V21M9 12H10M14 12H15M9 9H10M14 9H15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h1 className="text-[26px] font-extrabold text-slate-900 mb-1.5" style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.03em' }}>
                                Arch <span className="text-primary-600">Portal</span>
                            </h1>
                            <p className="text-slate-500 text-sm font-medium">Log in to your workspace</p>
                        </motion.div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5" style={{ fontFamily: 'Manrope, sans-serif' }}>Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <HiOutlineEnvelope className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        className="pl-11 input-field"
                                        placeholder="you@archconsultancy.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5" style={{ fontFamily: 'Manrope, sans-serif' }}>Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <HiOutlineLockClosed className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="pl-11 pr-12 input-field"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPassword ? <HiOutlineEyeSlash className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-300 relative overflow-hidden group"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)', fontFamily: 'Manrope, sans-serif' }}
                                >
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        'Sign In to Dashboard'
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Demo credentials outside card for cleaner look */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="mt-6 text-center"
                >
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Demo Access</p>
                    <div className="flex justify-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, email: 'admin@archconsultancy.com', password: 'admin123' })}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                        >
                            Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, email: 'manager@archconsultancy.com', password: 'manager123' })}
                            className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition-colors"
                        >
                            Manager
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, email: 'priya@archconsultancy.com', password: 'employee123' })}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                        >
                            Employee
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
