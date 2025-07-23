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
    value: string
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
    key: number;
    value: string;
};

export interface CreateUpdateResult {
    version: string;
    id: number;
};
