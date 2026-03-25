export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    phone?: string;
    skills?: string;
    avatar?: string;
    createdAt: string;
}

export interface AttendanceRecord {
    id: string;
    userId: string;
    date: string;
    checkIn: string;
    checkOut?: string;
    reportSubmitted: boolean;
    checkoutAttempts: number;
    user?: UserProfile;
}

export interface DailyReport {
    id: string;
    attendanceId: string;
    userId: string;
    tasks: string;
    blockers?: string;
    nextPlan?: string;
    submittedAt: string;
    managerComment?: string;
    signedOffBy?: string;
    user?: UserProfile;
    attendance?: AttendanceRecord;
}

export interface LeaveRequest {
    id: string;
    userId: string;
    type: 'FULL' | 'HALF' | 'CUSTOM';
    startDate: string;
    endDate: string;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy?: string;
    comment?: string;
    createdAt: string;
    user?: UserProfile;
}

export interface ProjectRecord {
    id: string;
    name: string;
    client: string;
    startDate: string;
    endDate?: string;
    description?: string;
    status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
    ownerId: string;
    owner?: UserProfile;
    members?: ProjectMemberRecord[];
    documents?: DocumentRecord[];
    _count?: { documents: number; members: number };
}

export interface ProjectMemberRecord {
    id: string;
    projectId: string;
    userId: string;
    role: string;
    user?: UserProfile;
}

export interface DocumentRecord {
    id: string;
    projectId: string;
    filename: string;
    storagePath: string;
    version: number;
    uploadedBy: string;
    tags?: string;
    mimeType?: string;
    size?: number;
    createdAt: string;
    uploader?: UserProfile;
}

export interface DashboardStats {
    totalEmployees: number;
    activeProjects: number;
    todayAttendance: number;
    pendingLeaves: number;
    missedReports: number;
    recentActivity: ActivityItem[];
}

export interface ActivityItem {
    id: string;
    type: 'checkin' | 'checkout' | 'report' | 'leave' | 'document';
    message: string;
    timestamp: string;
    userId: string;
    userName: string;
}
