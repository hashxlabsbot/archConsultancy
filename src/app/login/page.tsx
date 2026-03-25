'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineBuildingOffice2, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gray-50">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-soft" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-700/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-success-500/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md px-4"
            >
                <div className="glass-card p-8">
                    {/* Logo & Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center mb-8"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-lg shadow-primary-500/25">
                            <HiOutlineBuildingOffice2 className="w-8 h-8 text-slate-900" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">Arch Consultancy</h1>
                        <p className="text-slate-500 text-sm">Employee & Project Management Portal</p>
                    </motion.div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="input-label">Email Address</label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="you@archconsultancy.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="input-label">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input-field pr-12"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Sign In'
                            )}
                        </motion.button>
                    </form>

                    {/* Demo credentials */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6 p-4 bg-white/50 rounded-xl border border-gray-200/50"
                    >
                        <p className="text-xs text-slate-500 font-medium mb-2">Demo Credentials</p>
                        <div className="space-y-1.5 text-xs">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, email: 'admin@archconsultancy.com', password: 'admin123' })}
                                className="block w-full text-left text-slate-500 hover:text-primary-400 transition-colors"
                            >
                                <span className="text-purple-400">Admin:</span> admin@archconsultancy.com
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, email: 'manager@archconsultancy.com', password: 'manager123' })}
                                className="block w-full text-left text-slate-500 hover:text-primary-400 transition-colors"
                            >
                                <span className="text-blue-400">Manager:</span> manager@archconsultancy.com
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, email: 'priya@archconsultancy.com', password: 'employee123' })}
                                className="block w-full text-left text-slate-500 hover:text-primary-400 transition-colors"
                            >
                                <span className="text-emerald-400">Employee:</span> priya@archconsultancy.com
                            </button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
