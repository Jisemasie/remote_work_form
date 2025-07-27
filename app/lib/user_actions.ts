'use server'

import { executeDataRequest } from '@/app/lib/db';
import {cryptPassword} from '@/app/lib/pwd_util';
import { SearchParams, InputParam, SelectList } from './definitions';    
import { CreateUpdateUser } from './definitions';

// Import the new functions
import { getOrganisationList, getEcoleList } from './user_actions';

// Export them for use in components
export { getOrganisationList, getEcoleList };

// Get a user profile list
export async function getUserProfileList(): Promise<SelectList[] | null>  {  
    try {  
        const result = await executeDataRequest(`
            SELECT profileid AS [key], profile_name AS [value]
            FROM profiles
            WHERE status = 'A'
            ORDER BY profile_name
        `, [], false);
        return result || null;     
    } catch (error) {   
        console.log(error);  
        return null;
    }  
}

// Get organisation list
export async function getOrganisationList(): Promise<SelectList[] | null> {  
    try {  
        const result = await executeDataRequest(`
            SELECT id_organisation AS [key], nom_organisation AS [value]
            FROM organisations
            WHERE status = 'A'
            ORDER BY nom_organisation
        `, [], false);
        return result || null;     
    } catch (error) {   
        console.log(error);  
        return null;
    }  
}

// Get ecole list by organisation
export async function getEcoleList(organisationId?: number): Promise<SelectList[] | null>  {  
    try {  
        let whereClause = "WHERE status = 'A'";
        if (organisationId) {
            whereClause += ` AND id_organisation = ${organisationId}`;
        }
        
        const result = await executeDataRequest(`
            SELECT id_ecole AS [key], nom_ecole AS [value]
            FROM ecoles
            ${whereClause}
            ORDER BY nom_ecole
        `, [], false);
        return result || null;     
    } catch (error) {   
        console.log(error);  
        return null;
    }  
}

// Get a user list
export async function getUserList(): Promise<SelectList[] | null>  {  
    try {
        const queryStr = `SELECT id_user as [key], fullname as [value]
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
        if (scope === 'user_or_name') queryCondition += ` AND (a.username LIKE '%${search_value}%' OR a.fullname LIKE '%${search_value}%')`;
        if (scope === 'username') queryCondition += ` AND a.username LIKE '%${search_value}'`;
        if (scope === 'name') queryCondition += ` AND a.fullname LIKE '%${search_value}%'`;
        if (scope === 'userid') queryCondition += ` AND a.id_user = ${search_value}`;
        if (scope === 'organisation') queryCondition += ` AND a.id_organisation = ${search_value}`;
        if (scope === 'all') queryCondition = 'WHERE 1 = 1';
        
        const queryStr = `
        SELECT 
            b.profile_name
            ,a.[id_user]
            ,a.[username]
            ,a.[status]
            ,CONVERT(VARCHAR(33), a.[create_dt], 126) [create_dt]
            ,a.[fullname]
            ,a.[profileid]
            ,a.[email]
            ,a.[phone]
            ,a.[locked]
            ,a.[expiry_date]
            ,dbo.fn_ConvertTimestampToBase64(a.[version]) AS [version]
            ,a.[created_by]
            ,a.[auth_type]
            ,a.[password]
            ,a.[user_must_change_pwd]
            ,a.[id_organisation]
            ,a.[id_ecole]
            ,a.[access_level]
            ,a.[use_mfa]
            ,a.registration_number
            ,a.position
            ,a.issupervisor
            ,isnull(c.fullname, '') superviseur
            ,o.nom_organisation
            ,e.nom_ecole
        FROM users a
        JOIN profiles b ON a.profileid = b.profileid
        LEFT JOIN users c ON a.superviseur = c.id_user
        LEFT JOIN organisations o ON a.id_organisation = o.id_organisation
        LEFT JOIN ecoles e ON a.id_ecole = e.id_ecole
        ${queryCondition}`;
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
        if (user.password !== '') {
            hash = await cryptPassword(String(user.password), 10);
        }
        user.password = hash;

        //delete not needed fields
        const excludedFields = ['profile_name', 'create_dt', 'nom_organisation', 'nom_ecole'];

        const inputParam: InputParam[] = [];
        Object.entries(user).forEach(([key, value]) => {
            if(!excludedFields.includes(key)){
                inputParam.push({
                    key: key, 
                    value: value
                });
            }
        });

        const result = await executeDataRequest("sp_CreateOrUpdateUser", inputParam, true);
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
            SELECT a.id_user, a.username, a.status, a.create_dt, a.fullname, a.update_dt,
                    a.profileid, c.profile_name, a.email, a.phone, a.locked, a.expiry_date, a.version, 
                    a.created_by, a.auth_type, a.password, a.registration_number,
                    a.position, a.issupervisor, b.fullname superviseur, 
                    a.id_organisation, o.nom_organisation, a.id_ecole, e.nom_ecole, a.access_level
            FROM users a
            JOIN profiles c ON c.profileid = a.profileid
            LEFT JOIN users b on a.superviseur = b.id_user
            LEFT JOIN organisations o ON a.id_organisation = o.id_organisation
            LEFT JOIN ecoles e ON a.id_ecole = e.id_ecole
            WHERE a.status = 'A' AND a.username = @userName
        `, params, false); // false = raw SQL

        if (Array.isArray(result) && result.length > 0) {
            // Convert Uint8Array (or Buffer) to base64 string
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