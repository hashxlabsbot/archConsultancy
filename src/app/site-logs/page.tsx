'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SpeechTextarea from '@/components/SpeechTextarea';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineWrenchScrewdriver,
    HiOutlineCamera,
    HiOutlineUserGroup,
    HiOutlinePlus,
    HiOutlineXMark,
    HiOutlineDocumentText,
    HiOutlineCalendarDays,
    HiOutlinePhoto,

    HiOutlineArrowPath,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineMicrophone,
    HiOutlineMapPin,
    HiOutlineCheckCircle,
    HiOutlineClock,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { formatTime } from '@/lib/utils';

export default function SiteLogsPage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;

    const [logs, setLogs] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const [aggregateTotals, setAggregateTotals] = useState({ masonCount: 0, coolieCount: 0, helperCount: 0, otherCount: 0 });

    // Form state
    const [selectedProject, setSelectedProject] = useState('');
    const [masonCount, setMasonCount] = useState(0);
    const [coolieCount, setCoolieCount] = useState(0);
    const [helperCount, setHelperCount] = useState(0);
    const [otherCount, setOtherCount] = useState(0);
    const [notes, setNotes] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [initialAudioUrl, setInitialAudioUrl] = useState<string | null>(null);
    const [isSTTBusy, setIsSTTBusy] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    // Filter state — empty filterDate means "all dates" (no date restriction)
    const [filterDate, setFilterDate] = useState('');
    const [filterProjectId, setFilterProjectId] = useState('');
    const [filterSupervisorId, setFilterSupervisorId] = useState('');
    const [allSupervisors, setAllSupervisors] = useState<any[]>([]);
    const [todayAttendance, setTodayAttendance] = useState<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const isFirstLoad = useRef(true);

    useEffect(() => {
        setPage(1);
    }, [filterDate, filterProjectId, filterSupervisorId]);

    useEffect(() => {
        const initial = isFirstLoad.current;
        isFirstLoad.current = false;
        fetchLogs(page, initial);
    }, [filterDate, filterProjectId, filterSupervisorId, page]);

    const fetchLogs = async (p: number, isInitial = false) => {
        if (isInitial) setLoading(true);
        else setIsFetching(true);
        try {
            const params = new URLSearchParams();
            if (filterDate) params.set('date', filterDate);
            if (filterProjectId) params.set('projectId', filterProjectId);
            if (filterSupervisorId) params.set('supervisorId', filterSupervisorId);
            params.set('page', String(p));
            params.set('limit', '25');
            const res = await fetch(`/api/site-logs?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setProjects(data.projects || []);
                setAllSupervisors(data.supervisors || []);
                if (data.pagination) setPagination(data.pagination);
                if (data.totals) setAggregateTotals({
                    masonCount: data.totals.masonCount ?? 0,
                    coolieCount: data.totals.coolieCount ?? 0,
                    helperCount: data.totals.helperCount ?? 0,
                    otherCount: data.totals.otherCount ?? 0,
                });
                if (data.projects?.length > 0 && !selectedProject) {
                    setSelectedProject(data.projects[0].id);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setIsFetching(false);
        }

        // Parallel fetch for attendance
        fetchTodayAttendance();
    };

    const fetchTodayAttendance = async () => {
        try {
            const res = await fetch('/api/attendance/today');
            if (res.ok) {
                const data = await res.json();
                setTodayAttendance(data.attendance || null);
            }
        } catch (e) { }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 10MB)`);
                return;
            }
            setMediaFiles(prev => [...prev, file]);
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
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setSelectedProject(projects.length > 0 ? projects[0].id : '');
        setMasonCount(0);
        setCoolieCount(0);
        setHelperCount(0);
        setOtherCount(0);
        setNotes('');
        setInitialAudioUrl(null);
        setAudioBlob(null);
        setIsSTTBusy(false);
        setMediaFiles([]);
        setMediaPreviews([]);
    };

    const uploadMedia = async (): Promise<string[]> => {
        if (!mediaFiles.length) return [];
        return Promise.all(
            mediaFiles.map(async (file) => {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('folder', 'site-logs');
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                if (!res.ok) throw new Error('Media upload failed');
                const data = await res.json();
                return data.url as string;
            })
        );
    };

    const uploadAudio = async (): Promise<string | null> => {
        if (!audioBlob) return null;
        const fd = new FormData();
        fd.append('file', audioBlob);
        fd.append('folder', 'site-logs/audio');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Audio upload failed');
        const data = await res.json();
        return data.url as string;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) {
            toast.error('Please select a project');
            return;
        }

        setSubmitting(true);
        setUploadingMedia(true);

        try {
            // Capture location if not already captured
            let currentLoc = location;
            if (!currentLoc) {
                toast.loading('Capturing live location...', { id: 'geo' });
                currentLoc = await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            const { latitude, longitude } = pos.coords;
                            let addr = 'Location Captured';
                            try {
                                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                if (geoRes.ok) {
                                    const geoData = await geoRes.json();
                                    addr = geoData.display_name || addr;
                                }
                            } catch (e) { }
                            toast.success('Location verified', { id: 'geo' });
                            resolve({ lat: latitude, lng: longitude, address: addr });
                        },
                        (err) => {
                            toast.error('Failed to capture location. Please ensure GPS is on.', { id: 'geo' });
                            resolve(null);
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                    );
                });
            }

            const [mediaUrls, audioUrlResult] = await Promise.all([
                uploadMedia(),
                uploadAudio()
            ]);
            setUploadingMedia(false);

            // Create (or upsert today's) log via POST
            const res = await fetch('/api/site-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: selectedProject,
                    masonCount,
                    coolieCount,
                    helperCount,
                    otherCount,
                    notes,
                    audioUrl: audioUrlResult,
                    mediaUrls,
                    latitude: currentLoc?.lat,
                    longitude: currentLoc?.lng,
                    address: currentLoc?.address,
                }),
            });

            if (res.ok) {
                toast.success('Site log submitted successfully!');
                setShowForm(false);
                resetForm();
                fetchLogs(page);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to submit');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Failed to submit log');
        } finally {
            setSubmitting(false);
            setUploadingMedia(false);
        }
    };

    const isAdmin = role === 'ADMIN' || role === 'SENIOR';
    const isSiteSupervisor = role === 'SITE_SUPERVISOR';
    const canSubmit = role === 'SITE_SUPERVISOR';

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const totalManpower = aggregateTotals.masonCount + aggregateTotals.coolieCount + aggregateTotals.helperCount + aggregateTotals.otherCount;

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-[1600px]">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-card p-4 sm:p-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em' }}>
                            {isAdmin ? 'Site Supervisor Logs' : 'Daily Site Log'}
                            {isFetching && <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {isAdmin
                                ? 'Viewing logs from ALL supervisors/engineers. Use the supervisor filter to narrow down.'
                                : 'Showing your own submitted logs only.'}
                        </p>
                    </div>
                    {canSubmit && (
                        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 shadow-glow-indigo text-sm">
                            <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5" /> New Entry
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="glass-card p-4 flex flex-wrap items-center gap-3">
                    {/* Date filter */}
                    <div className="flex items-center gap-2">
                        <HiOutlineCalendarDays className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="input-field shadow-sm max-w-[160px] text-xs font-bold"
                        />
                    </div>

                    {/* Today quick-filter */}
                    <button
                        onClick={() => setFilterDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0])}
                        className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${filterDate === new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
                            ? 'bg-orange-500 text-white'
                            : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            }`}
                    >
                        Today
                    </button>

                    {/* Project filter */}
                    <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                        <select
                            value={filterProjectId}
                            onChange={(e) => setFilterProjectId(e.target.value)}
                            className="input-field shadow-sm text-xs font-bold"
                        >
                            <option value="">All Projects</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Supervisor filter (admin/senior only) */}
                    {!isSiteSupervisor && (
                        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                            <select
                                value={filterSupervisorId}
                                onChange={(e) => setFilterSupervisorId(e.target.value)}
                                className="input-field shadow-sm text-xs font-bold"
                            >
                                <option value="">All Supervisors</option>
                                {allSupervisors.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Clear all filters */}
                    {(filterDate || filterProjectId || filterSupervisorId) && (
                        <button
                            onClick={() => { setFilterDate(''); setFilterProjectId(''); setFilterSupervisorId(''); }}
                            className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}

                    {/* Entry count */}
                    <span className="ml-auto text-xs text-slate-400 font-medium whitespace-nowrap">
                        {pagination.total} {pagination.total === 1 ? 'entry' : 'entries'}
                    </span>
                </div>

                {/* Summary Cards — totals across ALL matching logs, not just current page */}
                {pagination.total > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-5 flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mason</p>
                                <p className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    {aggregateTotals.masonCount}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center">
                                <HiOutlineUserGroup className="w-5 h-5 text-orange-600" />
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} className="glass-card p-5 flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Coolie</p>
                                <p className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    {aggregateTotals.coolieCount}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-pink-100 flex items-center justify-center">
                                <HiOutlineUserGroup className="w-5 h-5 text-pink-600" />
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 }} className="glass-card p-5 flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Helper</p>
                                <p className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    {aggregateTotals.helperCount}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                                <HiOutlineWrenchScrewdriver className="w-5 h-5 text-blue-600" />
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-5 flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Other</p>
                                <p className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    {aggregateTotals.otherCount}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center">
                                <HiOutlineUserGroup className="w-5 h-5 text-violet-600" />
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-5 flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Workers</p>
                                <p className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    {totalManpower}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <HiOutlineDocumentText className="w-5 h-5 text-emerald-600" />
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Attendance Status for Supervisor */}
                {isSiteSupervisor && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card mb-8 p-6 border-2 border-indigo-100 flex items-center justify-between bg-indigo-50/30 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${todayAttendance ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {todayAttendance ? <HiOutlineCheckCircle className="w-8 h-8" /> : <HiOutlineClock className="w-8 h-8" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    Daily Attendance Status
                                </h3>
                                {!todayAttendance ? (
                                    <p className="text-sm text-slate-500">Submit your first site log today to automatically verify your check-in.</p>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-4 mt-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In</span>
                                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{formatTime(todayAttendance.checkIn)}</span>
                                        </div>
                                        {todayAttendance.checkOut && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Out</span>
                                                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{formatTime(todayAttendance.checkOut)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 italic bg-white px-2 py-0.5 rounded-full border border-slate-100">
                                            <HiOutlineCheckCircle className="w-3 h-3 text-emerald-500" />
                                            Marked automatically via site logs
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Logs List */}
                {logs.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <HiOutlineWrenchScrewdriver className="w-8 h-8 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No Site Logs Found</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            {filterDate
                                ? `No entries for ${new Date(filterDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                                : isAdmin
                                    ? 'No site logs have been submitted yet.'
                                    : 'You have not submitted any site logs yet.'}
                        </p>
                        {canSubmit && (
                            <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary inline-flex items-center gap-2">
                                <HiOutlinePlus className="w-4 h-4" /> {isSiteSupervisor ? 'Log Today\'s Site' : 'New Entry'}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Group logs by date */}
                        {(() => {
                            // Build date groups
                            const groups: { label: string; dateKey: string; items: typeof logs }[] = [];
                            logs.forEach(log => {
                                const d = new Date(log.date);
                                const dateKey = d.toISOString().split('T')[0];
                                const todayKey = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
                                const yesterdayKey = new Date(Date.now() - new Date().getTimezoneOffset() * 60000 - 86400000).toISOString().split('T')[0];
                                const label = dateKey === todayKey
                                    ? 'Today'
                                    : dateKey === yesterdayKey
                                        ? 'Yesterday'
                                        : d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                                const existing = groups.find(g => g.dateKey === dateKey);
                                if (existing) existing.items.push(log);
                                else groups.push({ label, dateKey, items: [log] });
                            });

                            return groups.map((group, gIdx) => (
                                <div key={group.dateKey}>
                                    {/* Date group header — only shown when no date filter */}
                                    {!filterDate && (
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-extrabold text-slate-700" style={{ fontFamily: 'Manrope, sans-serif' }}>{group.label}</span>
                                                <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                                    {group.items.length} {group.items.length === 1 ? 'entry' : 'entries'}
                                                </span>
                                            </div>
                                            <div className="flex-1 h-px bg-slate-200" />
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {group.items.map((log, idx) => {
                                            let media: string[] = [];
                                            try { media = log.mediaUrls ? JSON.parse(log.mediaUrls) : []; } catch { }

                                            return (
                                                <motion.div
                                                    key={log.id}
                                                    initial={{ opacity: 0, y: 12 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: (gIdx * 0.05) + (idx * 0.04) }}
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
                                                                    {log.project?.client && <span className="font-normal text-slate-400 ml-1">· {log.project.client}</span>}
                                                                </h3>
                                                                {isAdmin && (
                                                                    <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                                                                        {log.user?.name}
                                                                        <span className="text-slate-400 font-normal">· {log.user?.role?.replace('_', ' ')}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {filterDate && (
                                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                                                                {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Manpower Info */}
                                                    <div className="p-5">
                                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                                                            <div className="p-3 bg-orange-50 rounded-xl text-center border border-orange-100">
                                                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Mason</p>
                                                                <p className="text-2xl font-extrabold text-orange-700" style={{ fontFamily: 'Manrope, sans-serif' }}>{log.masonCount || 0}</p>
                                                            </div>
                                                            <div className="p-3 bg-pink-50 rounded-xl text-center border border-pink-100">
                                                                <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest mb-1">Coolie</p>
                                                                <p className="text-2xl font-extrabold text-pink-700" style={{ fontFamily: 'Manrope, sans-serif' }}>{log.coolieCount || 0}</p>
                                                            </div>
                                                            <div className="p-3 bg-blue-50 rounded-xl text-center border border-blue-100">
                                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Helper</p>
                                                                <p className="text-2xl font-extrabold text-blue-700" style={{ fontFamily: 'Manrope, sans-serif' }}>{log.helperCount || 0}</p>
                                                            </div>
                                                            <div className="p-3 bg-violet-50 rounded-xl text-center border border-violet-100">
                                                                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-1">Other</p>
                                                                <p className="text-2xl font-extrabold text-violet-700" style={{ fontFamily: 'Manrope, sans-serif' }}>{log.otherCount || 0}</p>
                                                            </div>
                                                            <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-100">
                                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total</p>
                                                                <p className="text-2xl font-extrabold text-emerald-700" style={{ fontFamily: 'Manrope, sans-serif' }}>{(log.masonCount || 0) + (log.coolieCount || 0) + (log.helperCount || 0) + (log.otherCount || 0)}</p>
                                                            </div>
                                                        </div>

                                                        {/* Notes & Audio */}
                                                        {(log.notes || log.audioUrl) && (
                                                            <div className="mb-4 lg:flex gap-4">
                                                                {log.notes && (
                                                                    <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3 lg:mb-0">
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                                                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.notes}</p>
                                                                    </div>
                                                                )}
                                                                {log.audioUrl && (
                                                                    <div className="lg:w-1/3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                                            <HiOutlineMicrophone className="w-3 h-3" /> Audio Instruction
                                                                        </p>
                                                                        <audio controls src={log.audioUrl} className="w-full h-8" />
                                                                    </div>
                                                                )}
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

                                                        {/* Location */}
                                                        {log.address && (
                                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2">
                                                                <HiOutlineMapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Location</p>
                                                                    <a
                                                                        href={`https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-[11px] text-indigo-600 hover:underline line-clamp-1"
                                                                    >
                                                                        {log.address}
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between glass-card p-4">
                        <p className="text-sm text-slate-500">
                            Page {page} of {pagination.totalPages} · {pagination.total} total
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <HiOutlineChevronLeft className="w-4 h-4 text-slate-600" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <HiOutlineChevronRight className="w-4 h-4 text-slate-600" />
                            </button>
                        </div>
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
                                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl transition-colors border border-gray-200 shadow-sm">
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

                                {/* Manpower Count */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Manpower</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {/* Mason */}
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                                                <HiOutlineWrenchScrewdriver className="w-3.5 h-3.5 text-orange-500" /> Mason
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <button type="button" onClick={() => setMasonCount(Math.max(0, masonCount - 1))}
                                                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition-colors flex-shrink-0">−</button>
                                                <input type="number" min="0" value={masonCount} onChange={(e) => setMasonCount(parseInt(e.target.value) || 0)}
                                                    className="input-field shadow-sm text-center font-bold flex-1 px-1" />
                                                <button type="button" onClick={() => setMasonCount(masonCount + 1)}
                                                    className="w-8 h-8 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-600 flex items-center justify-center font-bold transition-colors flex-shrink-0">+</button>
                                            </div>
                                        </div>
                                        {/* Coolie */}
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                                                <HiOutlineUserGroup className="w-3.5 h-3.5 text-pink-500" /> Coolie
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <button type="button" onClick={() => setCoolieCount(Math.max(0, coolieCount - 1))}
                                                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition-colors flex-shrink-0">−</button>
                                                <input type="number" min="0" value={coolieCount} onChange={(e) => setCoolieCount(parseInt(e.target.value) || 0)}
                                                    className="input-field shadow-sm text-center font-bold flex-1 px-1" />
                                                <button type="button" onClick={() => setCoolieCount(coolieCount + 1)}
                                                    className="w-8 h-8 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-600 flex items-center justify-center font-bold transition-colors flex-shrink-0">+</button>
                                            </div>
                                        </div>
                                        {/* Helper */}
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                                                <HiOutlineUserGroup className="w-3.5 h-3.5 text-blue-500" /> Helper
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <button type="button" onClick={() => setHelperCount(Math.max(0, helperCount - 1))}
                                                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition-colors flex-shrink-0">−</button>
                                                <input type="number" min="0" value={helperCount} onChange={(e) => setHelperCount(parseInt(e.target.value) || 0)}
                                                    className="input-field shadow-sm text-center font-bold flex-1 px-1" />
                                                <button type="button" onClick={() => setHelperCount(helperCount + 1)}
                                                    className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center font-bold transition-colors flex-shrink-0">+</button>
                                            </div>
                                        </div>
                                        {/* Other */}
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                                                <HiOutlineUserGroup className="w-3.5 h-3.5 text-violet-500" /> Other
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <button type="button" onClick={() => setOtherCount(Math.max(0, otherCount - 1))}
                                                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition-colors flex-shrink-0">−</button>
                                                <input type="number" min="0" value={otherCount} onChange={(e) => setOtherCount(parseInt(e.target.value) || 0)}
                                                    className="input-field shadow-sm text-center font-bold flex-1 px-1" />
                                                <button type="button" onClick={() => setOtherCount(otherCount + 1)}
                                                    className="w-8 h-8 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-600 flex items-center justify-center font-bold transition-colors flex-shrink-0">+</button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Total */}
                                    <div className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Workforce</span>
                                        <span className="text-xl font-extrabold text-emerald-700" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                            {masonCount + coolieCount + helperCount + otherCount}
                                        </span>
                                    </div>
                                </div>

                                {/* Notes & Audio Recording */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Observations / Voice Instructions</label>
                                    <SpeechTextarea
                                        className="input-field shadow-sm min-h-[100px]"
                                        placeholder="Speak or type site observations..."
                                        value={notes}
                                        onChange={setNotes}
                                        onAudioChange={setAudioBlob}
                                        onBusyChange={setIsSTTBusy}
                                        initialAudioUrl={initialAudioUrl || undefined}
                                    />
                                </div>

                                {/* Media Upload */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <HiOutlineCamera className="w-4 h-4 text-indigo-500" /> Site Photos / Videos
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/30 transition-all"
                                        >
                                            <HiOutlineCamera className="w-4 h-4" /> Take Photo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => galleryInputRef.current?.click()}
                                            className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all"
                                        >
                                            <HiOutlinePhoto className="w-4 h-4" /> From Gallery
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-2">Max 10MB per file • JPG, PNG, MP4</p>
                                    {/* Camera input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,video/*"
                                        capture="environment"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    {/* Gallery input */}
                                    <input
                                        ref={galleryInputRef}
                                        type="file"
                                        accept="image/*,video/*"
                                        multiple
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
                                    <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary px-6">Cancel</button>
                                    <button type="submit" disabled={submitting || uploadingMedia || isSTTBusy} className="btn-primary px-8 shadow-glow-indigo flex items-center gap-2">
                                        {(submitting || uploadingMedia) ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                {uploadingMedia ? 'Uploading...' : 'Submitting...'}
                                            </>
                                        ) : isSTTBusy ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                                Busy...
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
                            {previewMedia?.type === 'video' ? (
                                <video src={previewMedia?.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
                            ) : (
                                <img src={previewMedia?.url} alt="Site media preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
