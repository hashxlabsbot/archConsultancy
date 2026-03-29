'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiOutlineMapPin, HiOutlinePhoto, HiOutlineTrash, HiOutlineCheck, HiOutlineArrowUpTray } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function NewSiteVisitPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);

    const [formData, setFormData] = useState({
        projectId: '',
        notes: '',
        latitude: null as number | null,
        longitude: null as number | null,
        address: '',
    });

    useEffect(() => { fetchProjects(); }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
                if (data.projects?.length > 0) {
                    setFormData(prev => ({ ...prev, projectId: data.projects[0].id }));
                }
            }
        } catch { }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
        const id = toast.loading('Acquiring location...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                toast.success('Location locked!', { id });
            },
            () => toast.error('Unable to get location', { id })
        );
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        if (files.length + photoFiles.length > 4) {
            toast.error('Maximum 4 photos per visit');
            return;
        }
        const oversized = files.find(f => f.size > 10 * 1024 * 1024);
        if (oversized) { toast.error('Each photo must be under 10MB'); return; }

        setPhotoFiles(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreviews(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
        // reset input so same file can be re-selected
        e.target.value = '';
    };

    const removePhoto = (index: number) => {
        setPhotoFiles(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadPhotos = async (): Promise<string[]> => {
        if (!photoFiles.length) return [];
        setUploadingPhotos(true);
        try {
            const urls = await Promise.all(
                photoFiles.map(async (file) => {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('folder', 'site-visits');
                    const res = await fetch('/api/upload', { method: 'POST', body: fd });
                    if (!res.ok) throw new Error('Photo upload failed');
                    const data = await res.json();
                    return data.url as string;
                })
            );
            return urls;
        } finally {
            setUploadingPhotos(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const photoUrls = await uploadPhotos();
            const res = await fetch('/api/site-visits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, photoUrls }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Site visit logged successfully!');
                router.push('/site-visits');
            } else {
                toast.error(data.error || 'Failed to log site visit');
            }
        } catch {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 sm:p-6">
                <div className="mb-6 border-b border-gray-100 pb-4">
                    <h1 className="text-xl font-bold text-slate-900">Log Site Visit</h1>
                    <p className="text-sm text-slate-500">Record a new site visit with GPS check-in and photos.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Project */}
                    <div>
                        <label className="input-label">Select Project</label>
                        <select className="input-field" value={formData.projectId} onChange={e => setFormData({ ...formData, projectId: e.target.value })} required>
                            <option value="" disabled>Choose a project...</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Location */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <label className="input-label mb-0 flex items-center gap-2">
                                <HiOutlineMapPin className="text-indigo-500 w-5 h-5" />
                                Location Check-in
                            </label>
                            {formData.latitude ? (
                                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                    <HiOutlineCheck className="w-3 h-3" /> Locked
                                </span>
                            ) : (
                                <button type="button" onClick={handleGetLocation} className="text-xs bg-white border border-gray-200 shadow-sm text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg transition">
                                    Get Current Location
                                </button>
                            )}
                        </div>
                        {formData.latitude && formData.longitude && (
                            <div className="text-xs text-slate-500 bg-white/50 px-3 py-2 rounded-lg border border-gray-100 mb-2">
                                <span className="font-medium text-slate-700">GPS:</span> {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                            </div>
                        )}
                        <input type="text" className="input-field text-sm" placeholder="Specific area / floor / landmark (optional)" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="input-label">Field Notes</label>
                        <textarea className="input-field min-h-[120px] resize-y" placeholder="Describe progress, issues, meetings held on site..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} required />
                    </div>

                    {/* Photos */}
                    <div>
                        <label className="input-label">Site Photos ({photoFiles.length}/4)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                            {photoPreviews.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                                        <HiOutlineTrash className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {photoFiles.length < 4 && (
                                <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-colors cursor-pointer text-slate-400 hover:text-indigo-500">
                                    <HiOutlinePhoto className="w-6 h-6 mb-1" />
                                    <span className="text-xs font-medium">Add Photo</span>
                                    <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                                </label>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">Max 4 photos · 10MB each · Uploaded to cloud storage</p>
                    </div>

                    {/* Submit */}
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading || uploadingPhotos} className="btn-primary min-w-[140px] flex items-center justify-center gap-2">
                            {(loading || uploadingPhotos) ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {uploadingPhotos ? 'Uploading...' : 'Saving...'}</>
                            ) : (
                                <><HiOutlineArrowUpTray className="w-4 h-4" />Submit Log</>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
