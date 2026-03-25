'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiOutlineMapPin, HiOutlinePhoto, HiOutlinePlus, HiOutlineTrash, HiOutlineCheck } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function NewSiteVisitPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        projectId: '',
        notes: '',
        latitude: null as number | null,
        longitude: null as number | null,
        address: '',
        photoUrls: [] as string[],
    });

    useEffect(() => {
        fetchProjects();
    }, []);

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
        } catch (e) { }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        const toastId = toast.loading('Acquiring coordinate lock...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }));
                toast.success('Location locked!', { id: toastId });
            },
            (error) => {
                toast.error('Unable to retrieve your location', { id: toastId });
            }
        );
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (files.length + formData.photoUrls.length > 4) {
            toast.error('Maximum 4 photos allowed per visit');
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    photoUrls: [...prev.photoUrls, reader.result as string]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        setFormData(prev => ({
            ...prev,
            photoUrls: prev.photoUrls.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/site-visits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Site visit logged successfully!');
                router.push('/site-visits');
            } else {
                toast.error(data.error || 'Failed to log site visit');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
            >
                <div className="mb-6 border-b border-gray-100 pb-4">
                    <h1 className="text-xl font-bold text-slate-900">Log Site Visit</h1>
                    <p className="text-sm text-slate-500">Record a new site visit with GPS check-in and photos.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Project Selection */}
                    <div>
                        <label className="input-label">Select Project</label>
                        <select
                            className="input-field cursor-pointer"
                            value={formData.projectId}
                            onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                            required
                        >
                            <option value="" disabled>Choose a project...</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Geolocation Lock */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <label className="input-label mb-0 flex items-center gap-2">
                                <HiOutlineMapPin className="text-primary-500 w-5 h-5" />
                                Location Check-in
                            </label>
                            {formData.latitude ? (
                                <span className="bg-success-100 text-success-700 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                    <HiOutlineCheck /> Locked
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    className="text-xs bg-white border border-gray-200 shadow-sm text-slate-700 hover:text-primary-600 px-3 py-1.5 rounded-lg transition"
                                >
                                    Get Current Location
                                </button>
                            )}
                        </div>

                        {formData.latitude && formData.longitude && (
                            <div className="text-xs text-slate-500 bg-white/50 px-3 py-2 rounded-lg border border-gray-100">
                                <span className="font-medium text-slate-700">GPS Coordinates:</span> {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                            </div>
                        )}

                        <div className="mt-3">
                            <input
                                type="text"
                                className="input-field text-sm"
                                placeholder="Specific Area / Address / Floor (Optional)"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Field Notes */}
                    <div>
                        <label className="input-label">Field Notes</label>
                        <textarea
                            className="input-field min-h-[120px] resize-y"
                            placeholder="Describe the progress, issues spotted, or meetings held on site..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            required
                        />
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className="input-label flex items-center justify-between">
                            <span>Site Photos ({formData.photoUrls.length}/4)</span>
                        </label>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                            {formData.photoUrls.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(i)}
                                        className="absolute top-2 right-2 w-7 h-7 bg-white/90 text-danger-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110 shadow-sm"
                                    >
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {formData.photoUrls.length < 4 && (
                                <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-primary-300 transition-colors cursor-pointer text-slate-400 hover:text-primary-500 group">
                                    <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <HiOutlinePhoto className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-medium">Add Photo</span>
                                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button type="button" onClick={() => router.back()} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary min-w-[120px] flex justify-center">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Submit Log'
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
