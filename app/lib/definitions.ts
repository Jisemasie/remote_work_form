export type LoginResultEnum = 'SUCCESS' | 'FAILURE' ; 

export type LoginData = {
    id : number | null; 
    username : string | null; 
    status : string | null; 
    create_dt : string | null; 
    fullname : string | null;
    profile_name : string | null; 
    email : string | null; 
    phone : string | null; 
    locked : number | null; 
    expiry_date : string | null; 
    version : string | null; 
    update_dt : string | null;
    created_by : number,
    password : string | null;
    auth_type: string;
    registration_number: string | null;
    position: string | null;
    superviseur: string | null;
    issupervisor: number;
    branch: string;
};

export interface CreateUpdateUser{
    id_user_profile: number;
    fullname: string;
    status: string;
    password: string | null;
    auth_type: string | null;
    username: string;
    email: string;
    phone: string;
    locked: number;
    version: string;
    created_by: number;
    id: number;
    use_mfa: number | null;
    create_dt: Date;  
    expiry_date: Date | null;
    user_must_change_pwd: number;
    branch: string;
    access_level: string;
    registration_number: string | null;
    position: string | null;
    superviseur: string | null;
    issupervisor: number;
}

export interface User extends CreateUpdateUser {
    update_dt: Date | null;
    user_must_change_pwd: number;
    failed_login_count: number | null;
    user_group: string
}

export interface UserProfile {
    id: number;
    profile_name: string | null;
    created_by: number;
    status: string | null;
    date_modification: Date;
}

export interface LoginResult {
    status: string | null; 
    token: string | null; 
    message: string | null; 
    user_school: number | null; 
    users: User[] | null; 
    profiles: UserProfile[] | null; 
    data: LoginData | null; 
};

export type DbErrorResult = {
    message: string;
    data: null;
};

export type InputParam = {
    key: string,
    value: string | number | boolean | Date | null
};

export type QueryResult = {
    message: string,
    data: object | null
};

export interface SearchParams {
    scope: string;
    value: string;
};

export interface SelectList {
    key: number | string;
    value: string;
};

export interface CreateUpdateResult {
    version: string;
    id: number;
};

// Enhanced Task Management Types
export interface Task {
    id: number;
    employee_id: number;
    task_name: string;
    description: string;
    start_date: Date;
    due_date: Date | null;
    status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    task_type: 'planned' | 'unplanned';
    gaps: number | null;
    employee_comments: string | null;
    supervisor_comments: string | null;
    supervisor_feedback: string | null;
    created_by: number;
    created_at: Date;
    updated_at: Date | null;
    version: string;
    employee_name?: string;
    supervisor_name?: string;
    is_overdue?: boolean;
    days_remaining?: number;
}

export interface DailyReport {
    id: number;
    employee_id: number;
    report_date: Date;
    branch: string;
    department: string;
    supervisor_id: number | null;
    status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
    supervisor_overall_comments: string | null;
    supervisor_rating: number | null;
    created_at: Date;
    updated_at: Date | null;
    version: string;
    employee_name?: string;
    supervisor_name?: string;
    total_tasks?: number;
    avg_completion?: number;
}

export interface ReportTask {
    id: number;
    report_id: number;
    task_id: number;
    actual_start_date: Date | null;
    actual_end_date: Date | null;
    completion_percentage: number;
    employee_notes: string | null;
    supervisor_feedback: string | null;
    created_at: Date;
    updated_at: Date | null;
    task_name?: string;
    task_description?: string;
}

// Form Management Types
export interface FormTemplate {
    id: number;
    name: string;
    description: string;
    form_type: 'daily_report' | 'task_request' | 'leave_request' | 'expense_report';
    is_active: boolean;
    created_by: number;
    created_at: Date;
    updated_at: Date | null;
    version: string;
}

export interface FormSubmission {
    id: number;
    template_id: number;
    employee_id: number;
    submission_data: any; // JSON data
    status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
    submitted_at: Date | null;
    reviewed_by: number | null;
    reviewed_at: Date | null;
    reviewer_comments: string | null;
    created_at: Date;
    updated_at: Date | null;
    version: string;
}

// Notification Types
export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    is_read: boolean;
    related_entity_type: string | null;
    related_entity_id: number | null;
    created_at: Date;
    expires_at: Date | null;
}

// Dashboard Types
export interface DashboardStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    totalReports: number;
    pendingReviews: number;
    teamMembers?: number;
    averageRating?: number;
    completionRate?: number;
    onTimeDelivery?: number;
}

// Export Types
export interface ExportOptions {
    format: 'pdf' | 'excel' | 'csv';
    dateRange?: {
        start: Date;
        end: Date;
    };
    filters?: Record<string, any>;
}

// Audit Trail Types
export interface AuditLog {
    id: number;
    user_id: number;
    action: string;
    entity_type: string;
    entity_id: number;
    old_values: any | null;
    new_values: any | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
}

// Permission Types
export interface Permission {
    id: number;
    name: string;
    description: string;
    resource: string;
    action: string;
}

export interface RolePermission {
    role_id: number;
    permission_id: number;
    granted_at: Date;
    granted_by: number;
}

// Advanced Search Types
export interface AdvancedSearchParams {
    query?: string;
    filters: Record<string, any>;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page: number;
    limit: number;
}

export interface SearchResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// File Upload Types
export interface FileUpload {
    id: number;
    original_name: string;
    stored_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by: number;
    related_entity_type: string | null;
    related_entity_id: number | null;
    created_at: Date;
}

// Enhanced Authentication Types
export interface AuthSession {
    user: {
        id: string;
        name?: string;
        email?: string;
        fullName?: string;
        username?: string;
        profileName?: string;
        profileId?: number;
        branch: string;
        position?: string;
        issupervisor?: boolean;
        superviseur?: string;
        registration_number?: string;
        accessLevel?: string;
    };
    expires: string;
}

// Activity Log Types
export interface ActivityLog {
    id: number;
    user_id: number;
    action: string;
    description: string;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
    user_name?: string;
}

// Statistics Types
export interface UserStatistics {
    user_id: number;
    user_name: string;
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    overdue_tasks: number;
    completion_rate: number;
    average_rating: number;
    total_reports: number;
    on_time_delivery: number;
}

// Filter Types
export interface TaskFilter {
    status?: string[];
    priority?: string[];
    task_type?: string[];
    employee_id?: number;
    supervisor_id?: number;
    date_range?: {
        start: Date;
        end: Date;
    };
    overdue_only?: boolean;
}

export interface ReportFilter {
    status?: string[];
    employee_id?: number;
    supervisor_id?: number;
    branch?: string;
    department?: string;
    date_range?: {
        start: Date;
        end: Date;
    };
    rating_range?: {
        min: number;
        max: number;
    };
}