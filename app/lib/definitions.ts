export type LoginResultEnum = 'SUCCESS' | 'FAILURE' ; 

export type LoginData = {
    id: number | null; 
    username: string | null; 
    status: string | null; 
    create_dt: string | null; 
    fullname: string | null;
    id_user_profile: number | null;
    profile_name: string | null;
    email: string | null; 
    phone: string | null; 
    locked: number | null; 
    expiry_date: string | null; 
    version: string | null; 
    update_dt: string | null;
    created_by: number,
    password: string | null;
    auth_type: string;
    registration_number: string | null;
    position: string | null;
    superviseur: number | null;
    issupervisor: number;
    branch: number;
    access_level: string | null;
    user_must_change_pwd: number;
    last_login_date: string | null;
    last_login_result: string | null;
    failed_login_count: number | null;
    use_mfa: number | null;
};

export interface CreateUpdateUser{
    id: number;
    username: string;
    status: string;
    create_dt: Date;
    fullname: string;
    id_user_profile: number;
    email: string;
    phone: string;
    locked: number;
    expiry_date: Date | null;
    version: string;
    update_dt: Date | null;
    created_by: number;
    auth_type: string;
    password: string | null;
    user_must_change_pwd: number;
    last_login_date: Date | null;
    last_login_result: string | null;
    failed_login_count: number | null;
    use_mfa: number | null;
    branch: number;
    access_level: string | null;
    registration_number: string | null;
    position: string | null;
    superviseur: number | null;
    issupervisor: number;
}

export interface User extends CreateUpdateUser {
    profile_name: string;
    branch_name: string;
    superviseur_name: string | null;
}

export interface UserProfile {
    id: number;
    profile_name: string;
    created_by: number;
    create_dt: Date;
    status: string;
    rowversion: string;
}

export interface Branch {
    code: number;
    nom: string;
    code_departement: number;
}

export interface Department {
    code: number;
    nom: string;
}

export interface Formulaire {
    id_formulaire: number;
    id_user: number;
    employee_comment: string | null;
    supervisor_comment: string | null;
    create_dt: Date;
    update_dt: Date | null;
    status: string;
    user_name?: string;
    supervisor_name?: string;
}

export interface Task {
    id_task: number;
    type_task: string;
    task_number: number;
    task_description: string;
    task_start_dt: Date;
    task_end_dt: Date | null;
    task_status: string;
    task_comment: string | null;
    id_formulaire: number;
    formulaire_status?: string;
}

export interface LoginResult {
    status: string | null; 
    token: string | null; 
    message: string | null; 
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
        branch: number;
        branchName?: string;
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

// Filter Types
export interface TaskFilter {
    status?: string[];
    type_task?: string[];
    user_id?: number;
    date_range?: {
        start: Date;
        end: Date;
    };
}

export interface FormulaireFilter {
    status?: string[];
    user_id?: number;
    supervisor_id?: number;
    date_range?: {
        start: Date;
        end: Date;
    };
}

// Dashboard Statistics
export interface DashboardStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalFormulaires: number;
    pendingReviews: number;
    teamMembers?: number;
    completionRate?: number;
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