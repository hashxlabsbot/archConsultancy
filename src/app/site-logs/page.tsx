'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineWrenchScrewdriver,
    HiOutlineCamera,
    HiOutlineUserGroup,
    HiOutlinePlus,
    HiOutlineXMark,
    HiOutlineDocumentText,
    HiOutlineCalendarDays,
    HiOutlineMapPin,
    HiOutlinePhoto,
    HiOutlineArrowPath,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function SiteLogsPage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;

    const [logs, setLogs] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [selectedProject, setSelectedProject] = useState('');
    const [labourCount, setLabourCount] = useState(0);
    const [mistriCount, setMistriCount] = useState(0);
    const [notes, setNotes] = useState('');
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

    // Filter state for admin
    const [filterDate, setFilterDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchLogs();
    }, [filterDate]);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams();
            if (filterDate) params.set('date', filterDate);
            const res = await fetch(`/api/site-logs?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setProjects(data.projects || []);
                if (data.projects?.length > 0 && !selectedProject) {
                    setSelectedProject(data.projects[0].id);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`);
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setMediaPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeMedia = (index: number) => {
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) {
            toast.error('Please select a project');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/site-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: selectedProject,
                    labourCount,
                    mistriCount,
                    notes,
                    mediaUrls: mediaPreviews,
                }),
            });

            if (res.ok) {
                toast.success('Site log submitted successfully! 🏗️');
                setShowForm(false);
                setLabourCount(0);
                setMistriCount(0);
                setNotes('');
                setMediaPreviews([]);
                fetchLogs();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to submit');
            }
        } catch {
            toast.error('Failed to submit log');
        } finally {
            setSubmitting(false);
        }
    };

    const isAdmin = role === 'ADMIN' || role === 'MANAGER';
    const canSubmit = role === 'SITE_ENGINEER';

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-[1600px]">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-4 sm:p-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em' }}>
                            {isAdmin ? 'Site Engineer Logs' : 'Daily Site Log'}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {isAdmin ? 'Monitor site engineer activities, labour counts, and site media.' : 'Log daily activities, upload site photos, and track on-site manpower.'}
                        </p>
                    </div>
                    {canSubmit && (
                        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 shadow-glow-indigo text-sm">
                            <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5" /> New Entry
                        </button>
                    )}
                </div>

                {/* Admin: Date Filter */}
                {isAdmin && (
                    <div className="glass-card p-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <HiOutlineCalendarDays className="w-5 h-5 text-slate-400" />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="input-field shadow-sm max-w-[200px]"
                            />
                        </div>
                        <button
                            onClick={() => { setFilterDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]); }}
                            className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            Today
                        </button>
                    </div>
                )}

                {/* Today's Summary Cards */}
                {logs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-5 flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Labour</p>
                                <p className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    {logs.reduce((sum, l) => sum + (l.labourCount || 0), 0)}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center">
                                <HiOutlineUserGroup className="w-5 h-5 text-orange-600" />
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} className="glass-card p-5 flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Mistri</p>
                                <p className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    {logs.reduce((sum, l) => sum + (l.mistriCount || 0), 0)}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                                <HiOutlineWrenchScrewdriver className="w-5 h-5 text-blue-600" />
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-5 flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Site Entries</p>
                                <p className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    {logs.length}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <HiOutlineDocumentText className="w-5 h-5 text-emerald-600" />
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Logs List */}
                {logs.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <HiOutlineWrenchScrewdriver className="w-8 h-8 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No Site Logs</h3>
                        <p className="text-slate-500 text-sm mb-4">{isAdmin ? 'No site logs for this date.' : 'Log your first site activity for today.'}</p>
                        {!isAdmin && canSubmit && (
                            <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
                                <HiOutlinePlus className="w-4 h-4" /> Log Now
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {logs.map((log, idx) => {
                            let media: string[] = [];
                            try { media = log.mediaUrls ? JSON.parse(log.mediaUrls) : []; } catch { }

                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="glass-card overflow-hidden"
                                >
                                    {/* Log Header */}
                                    <div className="p-5 border-b border-slate-100/80 flex flex-wrap items-center justify-between gap-3 bg-white/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
                                                <HiOutlineWrenchScrewdriver className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                    {log.project?.name}
                                                </h3>
                                                {isAdmin && (
                                                    <p className="text-xs text-slate-500">by {log.user?.name}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                                            {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>

                                    {/* Labour Info */}
                                    <div className="p-5">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                            <div className="p-3 bg-orange-50 rounded-xl text-center border border-orange-100">
                                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Labourers</p>
                                                <p className="text-2xl font-extrabold text-orange-700" style={{ fontFamily: 'Manrope, sans-serif' }}>{log.labourCount}</p>
                                            </div>
                                            <div className="p-3 bg-blue-50 rounded-xl text-center border border-blue-100">
                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Mistri</p>
                                                <p className="text-2xl font-extrabold text-blue-700" style={{ fontFamily: 'Manrope, sans-serif' }}>{log.mistriCount}</p>
                                            </div>
                                            <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-100 sm:col-span-2">
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Workforce</p>
                                                <p className="text-2xl font-extrabold text-emerald-700" style={{ fontFamily: 'Manrope, sans-serif' }}>{log.labourCount + log.mistriCount}</p>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {log.notes && (
                                            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.notes}</p>
                                            </div>
                                        )}

                                        {/* Site Media */}
                                        {media.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                    <HiOutlinePhoto className="w-3.5 h-3.5" /> Site Photos ({media.length})
                                                </p>
                                                <div className="flex gap-3 overflow-x-auto pb-2">
                                                    {media.map((url, i) => (
                                                        <div key={i} onClick={() => setPreviewMedia({ url, type: url.includes('video') || url.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'image' })} className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm hover:border-indigo-400 transition-colors cursor-pointer group">
                                                            {url.includes('video') || url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                                                <>
                                                                    <video src={url} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                                                                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform">
                                                                            <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-slate-800 ml-1" />
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <img src={url} alt={`Site photo ${i + 1}`} className="w-full h-full object-cover" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Update button for site engineer */}
                                        {canSubmit && (
                                            <div className="mt-4 pt-3 border-t border-slate-100">
                                                <button
                                                    onClick={() => {
                                                        setSelectedProject(log.projectId);
                                                        setLabourCount(log.labourCount);
                                                        setMistriCount(log.mistriCount);
                                                        setNotes(log.notes || '');
                                                        setMediaPreviews([]);
                                                        setShowForm(true);
                                                    }}
                                                    className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                                                >
                                                    <HiOutlineArrowPath className="w-3.5 h-3.5" /> Update Entry
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* Submit Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-white sticky top-0 z-10">
                                <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    📋 Daily Site Log
                                </h3>
                                <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl transition-colors border border-gray-200 shadow-sm">
                                    <HiOutlineXMark className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Project Selector */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Project</label>
                                    <select
                                        className="input-field shadow-sm"
                                        value={selectedProject}
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                        required
                                    >
                                        <option value="">Select a project</option>
                                        {projects.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name} — {p.client}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Labour & Mistri Count */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                            <HiOutlineUserGroup className="w-4 h-4 text-orange-500" /> Labourers
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => setLabourCount(Math.max(0, labourCount - 1))}
                                                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg transition-colors">
                                                −
                                            </button>
                                            <input type="number" min="0" value={labourCount} onChange={(e) => setLabourCount(parseInt(e.target.value) || 0)}
                                                className="input-field shadow-sm text-center text-xl font-bold flex-1" />
                                            <button type="button" onClick={() => setLabourCount(labourCount + 1)}
                                                className="w-10 h-10 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-600 flex items-center justify-center font-bold text-lg transition-colors">
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                            <HiOutlineWrenchScrewdriver className="w-4 h-4 text-blue-500" /> Mistri
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => setMistriCount(Math.max(0, mistriCount - 1))}
                                                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg transition-colors">
                                                −
                                            </button>
                                            <input type="number" min="0" value={mistriCount} onChange={(e) => setMistriCount(parseInt(e.target.value) || 0)}
                                                className="input-field shadow-sm text-center text-xl font-bold flex-1" />
                                            <button type="button" onClick={() => setMistriCount(mistriCount + 1)}
                                                className="w-10 h-10 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center font-bold text-lg transition-colors">
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Notes (optional)</label>
                                    <textarea
                                        className="input-field shadow-sm min-h-[80px] resize-none"
                                        placeholder="Any observations, issues, or progress notes..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                {/* Media Upload */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <HiOutlineCamera className="w-4 h-4 text-indigo-500" /> Site Photos / Videos
                                    </label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                                    >
                                        <HiOutlineCamera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">Tap to capture or upload photos</p>
                                        <p className="text-xs text-slate-400 mt-1">Max 5MB per file • JPG, PNG, MP4</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,video/*"
                                        multiple
                                        capture="environment"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />

                                    {/* Previews */}
                                    {mediaPreviews.length > 0 && (
                                        <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
                                            {mediaPreviews.map((url, i) => (
                                                <div key={i} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm group">
                                                    <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMedia(i)}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <HiOutlineXMark className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Submit */}
                                <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/50 -mx-6 -mb-6 px-6 py-4 rounded-b-3xl">
                                    <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6">Cancel</button>
                                    <button type="submit" disabled={submitting} className="btn-primary px-8 shadow-glow-indigo flex items-center gap-2">
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Log'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Media Preview Lightbox */}
            <AnimatePresence>
                {previewMedia && (
                    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setPreviewMedia(null)}>
                        <button
                            className="absolute top-6 right-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreviewMedia(null);
                            }}
                        >
                            <HiOutlineXMark className="w-6 h-6" />
                        </button>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {previewMedia.type === 'video' ? (
                                <video src={previewMedia.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
                            ) : (
                                <img src={previewMedia.url} alt="Site media preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
