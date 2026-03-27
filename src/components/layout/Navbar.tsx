'use client';

import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    HiOutlineBell,
    HiOutlineArrowRightOnRectangle,
    HiOutlineExclamationTriangle,
    HiOutlineKey,
    HiXMark,
    HiBars3,
    HiOutlineClock,
    HiOutlineDocumentText,
    HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { getInitials, getRoleBadgeColor } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NavbarProps {
    onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const { data: session } = useSession();
    const [canLogout, setCanLogout] = useState(true);
    const [attendanceState, setAttendanceState] = useState({ checkedIn: false, reportSubmitted: false, checkedOut: false });

    // Notifications state
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    // Password Modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    const user = session?.user;
    const role = (user as any)?.role || 'EMPLOYEE';

    // Check if user has submitted today's report (for checkout guard and quick actions)
    useEffect(() => {
        if (user && role !== 'ADMIN') {
            checkTodayStatus();
        }
    }, [user]);

    const checkTodayStatus = async () => {
        try {
            const res = await fetch('/api/attendance/today');
            if (res.ok) {
                const data = await res.json();
                const att = data.attendance;
                if (!att) {
                    setAttendanceState({ checkedIn: false, reportSubmitted: false, checkedOut: false });
                    setCanLogout(true);
                } else {
                    setAttendanceState({
                        checkedIn: !!att.checkIn,
                        reportSubmitted: !!att.reportSubmitted,
                        checkedOut: !!att.checkOut
                    });
                    if (att.checkIn && !att.reportSubmitted && !att.checkOut && role === 'EMPLOYEE') {
                        setCanLogout(false);
                    } else {
                        setCanLogout(true);
                    }
                }
            }
        } catch (error) {
            // silently fail
        }
    };

    useEffect(() => {
        if (role === 'ADMIN') fetchNotifications();
    }, [role]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (e) { }
    };

    const markAsRead = async (id?: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            fetchNotifications();
            if (id) setShowNotifications(false); // Close dropdown if clicking a specific link
        } catch (e) { }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        setPasswordLoading(true);
        try {
            const res = await fetch('/api/users/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Password updated successfully');
                setShowPasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                toast.error(data.error || 'Failed to update password');
            }
        } catch (e) {
            toast.error('Something went wrong');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!canLogout && role === 'EMPLOYEE') {
            toast.error('Please submit your daily report before logging out!', {
                icon: '🔒',
                duration: 5000,
            });
            return;
        }
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <>
            <motion.header
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl px-3 sm:px-6 py-3 border-b border-indigo-100/40 relative overflow-hidden"
                style={{ boxShadow: '0 4px 24px rgba(99,102,241,0.06)' }}
            >
                {/* Navbar ambient blueprint overlay */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-10 mix-blend-multiply arch-blueprint-grid hidden md:block"
                    style={{ maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)' }} />

                <div className="flex items-center justify-between relative z-10 gap-2">
                    {/* Left: hamburger + greeting */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {/* Mobile hamburger */}
                        <button onClick={onMenuClick} className="md:hidden p-2 -ml-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex-shrink-0">
                            <HiBars3 className="w-6 h-6" />
                        </button>
                        <div className="min-w-0">
                            <p className="text-sm sm:text-base font-bold text-slate-900 truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                {(() => {
                                    const h = new Date().getHours();
                                    if (h < 12) return '☀️ Good morning';
                                    if (h < 17) return '🌤️ Good afternoon';
                                    return '🌙 Good evening';
                                })()}, <span className="text-indigo-600">{user?.name?.split(' ')[0]}</span>
                            </p>
                            <p className="text-[10px] sm:text-xs text-slate-400 truncate">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {/* Attendance Quick Actions */}
                        {role !== 'ADMIN' && (
                            <div className="hidden sm:flex items-center">
                                {!attendanceState.checkedIn ? (
                                    <Link href="/attendance" className="btn-primary py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors">
                                        <HiOutlineClock className="w-4 h-4" /> Check In
                                    </Link>
                                ) : !attendanceState.reportSubmitted ? (
                                    <Link href={role === 'SITE_ENGINEER' ? '/site-logs' : '/reports'} className="btn-primary py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors">
                                        <HiOutlineDocumentText className="w-4 h-4" /> Submit Report
                                    </Link>
                                ) : !attendanceState.checkedOut ? (
                                    <Link href="/attendance" className="btn-primary py-1.5 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors">
                                        <HiOutlineClock className="w-4 h-4" /> Check Out
                                    </Link>
                                ) : (
                                    <span className="py-1.5 px-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                                        <HiOutlineCheckCircle className="w-4 h-4" /> Shift Completed
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Report warning */}
                        {!canLogout && role === 'EMPLOYEE' && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium whitespace-nowrap"
                            >
                                <HiOutlineExclamationTriangle className="w-3.5 h-3.5" />
                                <span>Report required</span>
                            </motion.div>
                        )}

                        {/* Notifications */}
                        {role === 'ADMIN' && (
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                >
                                    <HiOutlineBell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full">
                                            <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
                                        </span>
                                    )}
                                </motion.button>

                                {/* Dropdown */}
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl overflow-hidden z-50"
                                        style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
                                    >
                                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/60">
                                            <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={() => markAsRead()} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                                            {notifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    className={`p-3 rounded-xl transition ${notif.isRead ? 'opacity-60 hover:bg-slate-50' : 'bg-indigo-50/60 hover:bg-indigo-50'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <p className={`text-sm ${notif.isRead ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{notif.title}</p>
                                                        {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />}
                                                    </div>
                                                    <p className="text-xs text-slate-500">{notif.message}</p>
                                                    {notif.link && (
                                                        <a href={notif.link} onClick={() => markAsRead(notif.id)} className="text-xs text-indigo-600 mt-1.5 inline-block font-medium">
                                                            View Details →
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                            {notifications.length === 0 && (
                                                <p className="p-4 text-center text-sm text-slate-400">All caught up! 🎉</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Change Password */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowPasswordModal(true)}
                            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Change Password"
                        >
                            <HiOutlineKey className="w-5 h-5" />
                        </motion.button>

                        {/* User info + avatar */}
                        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-100">
                            <div className="text-right hidden lg:block">
                                <p className="text-sm font-semibold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{user?.name}</p>
                                <p className="text-xs text-slate-400">{role}</p>
                            </div>
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white text-xs sm:text-sm font-bold cursor-pointer flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}>
                                {user?.name ? getInitials(user.name) : '?'}
                            </div>
                        </div>

                        {/* Logout */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className={`p-2.5 rounded-xl transition-all ${!canLogout && role === 'EMPLOYEE'
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                                }`}
                            title={!canLogout && role === 'EMPLOYEE' ? 'Submit daily report to log out' : 'Log out'}
                        >
                            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                        </motion.button>
                    </div>
                </div>
            </motion.header>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
                        style={{ boxShadow: '0 24px 48px rgba(99,102,241,0.15), 0 8px 16px rgba(0,0,0,0.08)' }}
                    >
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                <HiOutlineKey className="w-5 h-5 text-indigo-500" />
                                Change Password
                            </h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <HiXMark className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                            <div>
                                <label className="input-label">Current Password</label>
                                <input type="password" className="input-field" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
                            </div>
                            <div>
                                <label className="input-label">New Password</label>
                                <input type="password" className="input-field" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={6} />
                            </div>
                            <div>
                                <label className="input-label">Confirm New Password</label>
                                <input type="password" className="input-field" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required minLength={6} />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={passwordLoading} className="btn-primary flex items-center gap-2">
                                    {passwordLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </>
    );
}

