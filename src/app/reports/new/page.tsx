'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { HiOutlineDocumentText, HiOutlinePaperAirplane } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function NewReportPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [form, setForm] = useState({ tasks: '', blockers: '', nextPlan: '', projectId: '', imageUrl: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch (error) {
            console.error('Failed to load projects');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Keep it under ~2MB to avoid huge payload crashes for this demo
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image is too large. Please select a file under 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm({ ...form, imageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.tasks.trim()) {
            toast.error('Please describe tasks completed today');
            return;
        }
        setLoading(true);

        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Report submitted! You can now check out.', { duration: 5000 });
                router.push('/dashboard');
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Submission failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                            <HiOutlineDocumentText className="w-5 h-5 text-slate-900" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Daily Status Report</h1>
                            <p className="text-slate-500 text-sm">Submit your end-of-day report to unlock checkout</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="input-label">Related Project (Optional)</label>
                                <select
                                    className="input-field"
                                    value={form.projectId}
                                    onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                                >
                                    <option value="">-- No Specific Project --</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="input-label">Attach Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
                                />
                                {form.imageUrl && (
                                    <p className="text-xs text-success-500 mt-2 font-medium">✓ Image attached successfully</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Tasks Completed Today <span className="text-danger-400">*</span></label>
                            <textarea
                                className="input-field min-h-[120px] resize-y"
                                placeholder="• Completed floor plan for Building A&#10;• Reviewed structural calculations&#10;• Updated BIM model with HVAC changes"
                                value={form.tasks}
                                onChange={(e) => setForm({ ...form, tasks: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="input-label">Blockers / Challenges</label>
                            <textarea
                                className="input-field min-h-[80px] resize-y"
                                placeholder="• Waiting for client approval on elevation design&#10;• Need access to site survey data"
                                value={form.blockers}
                                onChange={(e) => setForm({ ...form, blockers: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="input-label">Plan for Tomorrow</label>
                            <textarea
                                className="input-field min-h-[80px] resize-y"
                                placeholder="• Start detailed drawings for Phase 2&#10;• Team review meeting at 10 AM"
                                value={form.nextPlan}
                                onChange={(e) => setForm({ ...form, nextPlan: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex items-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <HiOutlinePaperAirplane className="w-4 h-4" />
                                )}
                                Submit Report
                            </button>
                            <button type="button" onClick={() => router.back()} className="btn-secondary">
                                Cancel
                            </button>
                        </div>

                        <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl p-4 mt-4">
                            <p className="text-xs text-primary-300">
                                💡 Submitting this report will unlock your check-out for today. Reports are visible to your manager for review and sign-off.
                            </p>
                        </div>
                    </form>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
