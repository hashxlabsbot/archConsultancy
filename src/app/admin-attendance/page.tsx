'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineDocumentText, HiXMark, HiOutlineMapPin } from 'react-icons/hi2';
import { getInitials, formatDate, formatTime } from '@/lib/utils';

export default function AdminAttendancePage() {
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [attendancePeriod, setAttendancePeriod] = useState<'daily' | 'monthly' | 'all' | 'custom'>('daily');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
    const [loadingAttendance, setLoadingAttendance] = useState(true);
    const [shortLeaves, setShortLeaves] = useState<any[]>([]);

    // Report Modal State
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    useEffect(() => {
        fetchAdminAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attendancePeriod, customDate]);

    const fetchAdminAttendance = async () => {
        setLoadingAttendance(true);
        try {
            const url = `/api/admin/attendance?period=${attendancePeriod}` + (attendancePeriod === 'custom' ? `&date=${customDate}` : '');
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setAttendanceRecords(data.records);
            }

            const slRes = await fetch('/api/admin/short-leaves');
            if (slRes.ok) {
                const slData = await slRes.json();
                setShortLeaves(slData.requests);
            }
        } catch (err) { } finally { setLoadingAttendance(false); }
    };

    const handleShortLeaveAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await fetch(`/api/admin/short-leaves/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchAdminAttendance();
            } else {
                alert('Failed to update request');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openReportModal = (report: any) => {
        setSelectedReport(report);
        setIsReportModalOpen(true);
    };

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Attendance & Reports</h1>
                    <p className="text-slate-500 mt-1">Review organization-wide check-ins, hours worked, and daily status reports</p>
                </div>

                {/* Pending Early Checkouts */}
                {shortLeaves.length > 0 && (
                    <div className="glass-card overflow-hidden">
                        <div className="p-5 border-b border-warning-200/50 bg-warning-50/50">
                            <h2 className="text-lg font-semibold text-warning-900">Early Checkout Requests</h2>
                        </div>
                        <div className="overflow-x-auto min-h-[50px]">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-white">
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Employee</th>
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Requested Date</th>
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Hours</th>
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Reason</th>
                                        <th className="text-center text-sm text-slate-500 px-5 py-3 font-medium">Status / Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shortLeaves.map(sl => (
                                        <tr key={sl.id} className="border-t border-slate-100 bg-white hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-bold border border-slate-200 shadow-sm">
                                                        {getInitials(sl.user?.name || '?')}
                                                    </div>
                                                    <span className="text-sm text-slate-700 font-medium">{sl.user?.name || 'Unknown User'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-sm font-medium text-slate-900">{formatDate(sl.date)}</td>
                                            <td className="px-5 py-3 text-sm text-slate-600 font-bold">{sl.hoursRequested}h</td>
                                            <td className="px-5 py-3 text-sm text-slate-600 max-w-xs truncate" title={sl.reason}>{sl.reason}</td>
                                            <td className="px-5 py-3 text-center">
                                                {sl.status === 'PENDING' ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => handleShortLeaveAction(sl.id, 'APPROVED')} className="text-xs px-3 py-1 bg-success-50 text-success-600 font-bold rounded hover:bg-success-100 border border-success-200 transition-colors">Approve</button>
                                                        <button onClick={() => handleShortLeaveAction(sl.id, 'REJECTED')} className="text-xs px-3 py-1 bg-danger-50 text-danger-600 font-bold rounded hover:bg-danger-100 border border-danger-200 transition-colors">Reject</button>
                                                    </div>
                                                ) : (
                                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${sl.status === 'APPROVED' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'}`}>
                                                        {sl.status} {sl.approvedBy && ` (by ${sl.approvedBy.name})`}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="glass-card overflow-hidden">
                    <div className="p-5 border-b border-gray-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50">
                        <h2 className="text-lg font-semibold text-slate-900">Organization Attendance</h2>
                        <div className="flex gap-4 items-center w-full sm:w-auto">
                            {attendancePeriod === 'custom' && (
                                <input
                                    type="date"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    className="input-field max-w-[150px] py-2 text-sm"
                                />
                            )}
                            <select
                                value={attendancePeriod}
                                onChange={(e) => setAttendancePeriod(e.target.value as any)}
                                className="input-field max-w-[200px] py-2 text-sm"
                            >
                                <option value="daily">Today</option>
                                <option value="monthly">This Month</option>
                                <option value="all">All Time</option>
                                <option value="custom">Custom Date (Calendar)</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto min-h-[400px]">
                        {loadingAttendance ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-200">
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Date</th>
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Employee</th>
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Check In</th>
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Check Out</th>
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Location (In/Out)</th>
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Duration</th>
                                        <th className="text-center text-sm text-slate-500 px-5 py-3 font-medium">Daily Report</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {attendanceRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-slate-500 bg-slate-50/50">
                                                No attendance records found for this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendanceRecords.map((record) => (
                                            <tr key={record.id} className="border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3 text-sm text-slate-900 font-medium">{formatDate(record.date)}</td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-bold border border-slate-200 shadow-sm">
                                                            {getInitials(record.user?.name || '?')}
                                                        </div>
                                                        <span className="text-sm text-slate-700 font-medium">{record.user?.name || 'Unknown User'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-sm text-slate-600">{formatTime(record.checkIn)}</td>
                                                <td className="px-5 py-3 text-sm text-slate-600">{record.checkOut ? formatTime(record.checkOut) : '—'}</td>
                                                <td className="px-5 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        {record.latitude && record.longitude ? (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-fit"
                                                                title={record.address || 'Check-in Location'}
                                                            >
                                                                <HiOutlineMapPin className="w-3 h-3" /> In: {record.address ? (record.address.length > 20 ? record.address.substring(0, 20) + '...' : record.address) : 'Pinned'}
                                                            </a>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 font-medium italic">No In-GPS</span>
                                                        )}
                                                        {record.checkOutLatitude && record.checkOutLongitude ? (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${record.checkOutLatitude},${record.checkOutLongitude}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit"
                                                                title={record.checkOutAddress || 'Check-out Location'}
                                                            >
                                                                <HiOutlineMapPin className="w-3 h-3" /> Out: {record.checkOutAddress ? (record.checkOutAddress.length > 20 ? record.checkOutAddress.substring(0, 20) + '...' : record.checkOutAddress) : 'Pinned'}
                                                            </a>
                                                        ) : record.checkOut ? (
                                                            <span className="text-[10px] text-slate-400 font-medium italic">No Out-GPS</span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-sm text-slate-600">{record.duration}</td>
                                                <td className="px-5 py-3 text-center">
                                                    {record.reports && record.reports.length > 0 ? (
                                                        <button
                                                            onClick={() => openReportModal(record.reports[0])}
                                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors text-xs font-semibold hover:shadow-sm"
                                                        >
                                                            <HiOutlineDocumentText className="w-4 h-4" />
                                                            View Report
                                                        </button>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Read-Only Report View Modal */}
            <AnimatePresence>
                {isReportModalOpen && selectedReport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Daily Status Report</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Submitted at {formatTime(selectedReport.submittedAt)}</p>
                                </div>
                                <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
                                    <HiXMark className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                                {/* Project Tag */}
                                {selectedReport.project && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full border border-primary-100">
                                        <HiOutlineDocumentText className="w-4 h-4" />
                                        Project: {selectedReport.project.name}
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Today's Tasks</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                                        {selectedReport.tasks}
                                    </div>
                                </div>

                                {selectedReport.blockers && (
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Blockers / Issues</h4>
                                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 text-sm text-slate-700 whitespace-pre-wrap">
                                            {selectedReport.blockers}
                                        </div>
                                    </div>
                                )}

                                {selectedReport.nextPlan && (
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Plan for Tomorrow</h4>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                                            {selectedReport.nextPlan}
                                        </div>
                                    </div>
                                )}

                                {/* Image Attachment */}
                                {selectedReport.imageUrl && (
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Attached Image</h4>
                                        <div className="rounded-xl overflow-hidden border border-slate-200">
                                            <img src={`/api/blob?url=${encodeURIComponent(selectedReport.imageUrl)}`} alt="Report Attachment" className="w-full h-auto object-cover max-h-[400px]" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end">
                                <button onClick={() => setIsReportModalOpen(false)} className="btn-secondary">Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
