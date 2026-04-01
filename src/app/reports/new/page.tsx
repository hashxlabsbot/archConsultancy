'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SpeechTextarea from '@/components/SpeechTextarea';
import { motion } from 'framer-motion';
import { HiOutlineDocumentText, HiOutlinePaperAirplane, HiOutlineCamera, HiOutlinePhoto, HiOutlineXMark } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function NewReportPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [form, setForm] = useState({ tasks: '', blockers: '', nextPlan: '', projectId: '', imageUrl: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

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
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Image is too large. Please select a file under 10MB.');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
        // Reset so same file can be re-selected
        e.target.value = '';
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.tasks.trim()) {
            toast.error('Please describe tasks completed today');
            return;
        }
        setLoading(true);

        try {
            let imageUrl = '';
            if (imageFile) {
                const fd = new FormData();
                fd.append('file', imageFile);
                fd.append('folder', 'reports');
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
                if (!uploadRes.ok) throw new Error('Image upload failed');
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.url;
            }
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, imageUrl }),
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
                                {imagePreview ? (
                                    <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                                        >
                                            <HiOutlineXMark className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => cameraInputRef.current?.click()}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all"
                                        >
                                            <HiOutlineCamera className="w-4 h-4" /> Camera
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => galleryInputRef.current?.click()}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all"
                                        >
                                            <HiOutlinePhoto className="w-4 h-4" /> Gallery
                                        </button>
                                    </div>
                                )}
                                {/* Camera input */}
                                <input
                                    ref={cameraInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                {/* Gallery input */}
                                <input
                                    ref={galleryInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Tasks Completed Today <span className="text-danger-400">*</span></label>
                            <SpeechTextarea
                                className="input-field min-h-[120px]"
                                placeholder="• Completed floor plan for Building A&#10;• Reviewed structural calculations&#10;• Updated BIM model with HVAC changes"
                                value={form.tasks}
                                onChange={(val) => setForm({ ...form, tasks: val })}
                                required
                            />
                        </div>

                        <div>
                            <label className="input-label">Blockers / Challenges</label>
                            <SpeechTextarea
                                className="input-field min-h-[80px]"
                                placeholder="• Waiting for client approval on elevation design&#10;• Need access to site survey data"
                                value={form.blockers}
                                onChange={(val) => setForm({ ...form, blockers: val })}
                            />
                        </div>

                        <div>
                            <label className="input-label">Plan for Tomorrow</label>
                            <SpeechTextarea
                                className="input-field min-h-[80px]"
                                placeholder="• Start detailed drawings for Phase 2&#10;• Team review meeting at 10 AM"
                                value={form.nextPlan}
                                onChange={(val) => setForm({ ...form, nextPlan: val })}
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
