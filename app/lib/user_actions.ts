'use server'

import { executeDataRequest, executeInsertUpdateRequest } from '@/app/lib/db';
import { cryptPassword } from '@/app/lib/pwd_util';
import { SearchParams, InputParam, SelectList } from './definitions';
import { CreateUpdateUser } from './definitions';

// Get user profile list
export async function getUserProfileList(): Promise<SelectList[] | null> {
    try {
        const result = await executeDataRequest(`
            SELECT id AS [key], profile_name AS [value]
            FROM user_profiles
            WHERE status = 'A'
            ORDER BY profile_name
        `, [], false);
        return result || null;
    } catch (error) {
        console.log(error);
        return null;
    }
}

// Get branch list
export async function getBranchList(): Promise<SelectList[] | null> {
    try {
        const result = await executeDataRequest(`
            SELECT code AS [key], nom AS [value]
            FROM branch
            ORDER BY nom
        `, [], false);
        return result || null;
    } catch (error) {
        console.log(error);
        return null;
    }
}

// Get department list
export async function getDepartmentList(): Promise<SelectList[] | null> {
    try {
        const result = await executeDataRequest(`
            SELECT code AS [key], nom AS [value]
            FROM departments
            ORDER BY nom
        `, [], false);
        return result || null;
    } catch (error) {
        console.log(error);
        return null;
    }
}

// Get supervisors list
export async function getSupervisorsList(): Promise<SelectList[] | null> {
    try {
        const result = await executeDataRequest(`
            SELECT id AS [key], fullname AS [value]
            FROM users
            WHERE issupervisor = 1 AND status = 'A'
            ORDER BY fullname
        `, [], false);
        return result || null;
    } catch (error) {
        console.log(error);
        return null;
    }
}

// Get a user list
export async function getUserList(): Promise<SelectList[] | null> {
    try {
        const queryStr = `SELECT id as [key], fullname as [value]
            FROM users
            WHERE status = 'A'
            ORDER BY fullname ASC`;
        const result = await executeDataRequest(queryStr, [], false);
        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
}

// Search for users
export async function searchUser(i_params: SearchParams) {
    try {
        const { scope, value: search_value } = i_params;
        let queryCondition = 'WHERE 1 = 1';

        if (search_value === '*') queryCondition = 'WHERE 1 = 1';
        if (scope === 'user_or_name') queryCondition += ` AND (u.username LIKE '%${search_value}%' OR u.fullname LIKE '%${search_value}%')`;
        if (scope === 'username') queryCondition += ` AND u.username LIKE '%${search_value}'`;
        if (scope === 'name') queryCondition += ` AND u.fullname LIKE '%${search_value}%'`;
        if (scope === 'userid') queryCondition += ` AND u.id = ${search_value}`;
        if (scope === 'branch') queryCondition += ` AND u.branch = ${search_value}`;
        if (scope === 'all') queryCondition = 'WHERE 1 = 1';

        const queryStr = `
        SELECT 
            u.id,
            u.username,
            u.status,
            u.create_dt,
            u.fullname,
            u.id_user_profile,
            u.email,
            u.phone,
            u.locked,
            u.expiry_date,
            u.version,
            u.update_dt,
            u.created_by,
            u.auth_type,
            u.password,
            u.user_must_change_pwd,
            u.last_login_date,
            u.last_login_result,
            u.failed_login_count,
            u.use_mfa,
            u.branch,
            u.access_level,
            u.registration_number,
            u.position,
            u.superviseur,
            u.issupervisor,
            up.profile_name,
            b.nom as branch_name,
            s.fullname as superviseur_name
        FROM users u
        LEFT JOIN user_profiles up ON u.id_user_profile = up.id
        LEFT JOIN branch b ON u.branch = b.code
        LEFT JOIN users s ON u.superviseur = s.id
        ${queryCondition}
        ORDER BY u.fullname`;
        
        const result = await executeDataRequest(queryStr, [], false);
        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
}

// Create or update a user
export async function createorUpdateUser(user: CreateUpdateUser) {
    try {
        let hash = '';
        if (user.password !== '' && user.password !== null) {
            hash = await cryptPassword(String(user.password), 10);
        }
        user.password = hash;

        const excludedFields = ['profile_name', 'branch_name', 'superviseur_name'];

        const inputParam: InputParam[] = [];
        Object.entries(user).forEach(([key, value]) => {
            if (!excludedFields.includes(key)) {
                inputParam.push({
                    key: key,
                    value: value
                });
            }
        });

        const result = await executeInsertUpdateRequest("sp_CreateOrUpdateUser", inputParam, true);
        return result;

    } catch (error) {
        console.log(error);
        return null;
    }
}

// Get user login details
export async function getUserLoginDetails(userName: string) {
    try {
        const params = [{ key: 'userName', value: userName }];
        const result = await executeDataRequest(`
            SELECT 
                u.id, 
                u.username, 
                u.status, 
                u.create_dt, 
                u.fullname, 
                u.update_dt,
                u.id_user_profile, 
                up.profile_name, 
                u.email, 
                u.phone, 
                u.locked, 
                u.expiry_date, 
                u.version, 
                u.created_by, 
                u.auth_type, 
                u.password, 
                u.registration_number,
                u.position, 
                u.issupervisor, 
                s.fullname as superviseur, 
                u.branch, 
                b.nom as branch_name,
                u.access_level,
                u.user_must_change_pwd,
                u.last_login_date,
                u.last_login_result,
                u.failed_login_count,
                u.use_mfa
            FROM users u
            LEFT JOIN user_profiles up ON up.id = u.id_user_profile
            LEFT JOIN users s ON u.superviseur = s.id
            LEFT JOIN branch b ON u.branch = b.code
            WHERE u.status = 'A' AND u.username = @userName
        `, params, false);

        if (Array.isArray(result) && result.length > 0) {
            if (result[0].version instanceof Uint8Array || Buffer.isBuffer(result[0].version)) {
                result[0].version = Buffer.from(result[0].version).toString('base64');
            }
            return result[0];
        }

        return null;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return null;
    }
}

// Delete user
export async function deleteUser(userId: number, deletedBy: number) {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'deleted_by', value: deletedBy }
        ];

        await executeInsertUpdateRequest('sp_DeleteUser', params, true);
        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { success: false, error: 'Erreur lors de la suppression' };
    }
}

// Lock/Unlock user account
export async function toggleUserLock(userId: number, locked: boolean, modifiedBy: number) {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'locked', value: locked ? 1 : 0 },
            { key: 'modified_by', value: modifiedBy }
        ];

        await executeInsertUpdateRequest('sp_ToggleUserLock', params, true);
        return { success: true };
    } catch (error) {
        console.error('Error toggling user lock:', error);
        return { success: false, error: 'Erreur lors de la modification' };
    }
}

// Reset user password
export async function resetUserPassword(userId: number, newPassword: string, resetBy: number) {
    try {
        const hashedPassword = await cryptPassword(newPassword, 10);
        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'new_password', value: hashedPassword },
            { key: 'reset_by', value: resetBy }
        ];

        await executeInsertUpdateRequest('sp_ResetUserPassword', params, true);
        return { success: true };
    } catch (error) {
        console.error('Error resetting password:', error);
        return { success: false, error: 'Erreur lors de la réinitialisation' };
    }
}