'use server'

import { executeDataRequest } from '@/app/lib/db';
import {cryptPassword} from '@/app/lib/pwd_util';
import { SearchParams, InputParam, SelectList } from './definitions';    
import { CreateUpdateUser } from './definitions';

// Get a user profile list
export async function getUserProfileList(): Promise<SelectList[] | null>  {  
    try {  
        const result = await executeDataRequest(`
            SELECT id AS [key], profile_name AS [value]
            FROM user_profiles
            ORDER BY profile_name
        `, [], false);
        return result || null;     
    } catch (error) {   
        console.log(error);  
        return null;
    }  
}

// Get  branch list
export async function getBranchList(): Promise<SelectList[] | null> {  
    try {  
        const result = await executeDataRequest(`
            SELECT [nom] AS [key], [nom] AS [value]
            FROM [dbo].[branch]
            ORDER BY [nom]
        `, [], false);
        return result || null;     
    } catch (error) {   
        console.log(error);  
        return null;
    }  
}

// Get  department list
export async function getDepartmentList(): Promise<SelectList[] | null>  {  
    try {  
        const result = await executeDataRequest(`
            SELECT [nom] AS [key], [nom] AS [value]
            FROM [dbo].[departements]
            ORDER BY [nom]
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
        const queryStr = `SELECT id as [key], fullname as [value]
            FROM users
            ORDER BY fullname ASC`;
        const result = await executeDataRequest(queryStr, [], false);
        console.log('User search result: ', result);
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
        if (scope === 'userid') queryCondition += ` AND a.id = ${search_value}`;
        if (scope === 'branch') queryCondition += ` AND a.branch = ${search_value}`;
        if (scope === 'all') queryCondition = 'WHERE 1 = 1';
        
        const queryStr = `
        SELECT 
            b.profile_name AS user_group
            ,a.[id]
            ,a.[username]
            ,a.[status]
            ,CONVERT(VARCHAR(33), a.[create_dt], 126) [create_dt]
            ,a.[fullname]
            ,a.[id_user_profile]
            ,a.[email]
            ,a.[phone]
            ,a.[locked]
            ,a.[expiry_date]
            ,dbo.fn_ConvertTimestampToBase64(a.[version]) AS [version]
            ,a.[created_by]
            ,a.[auth_type]
            ,a.[password]
            ,a.[user_must_change_pwd]
            ,a.[branch]
            ,a.[access_level]
            ,a.[use_mfa]
            ,a.registration_number
            ,a.position
            ,a.issupervisor
            ,isnull(c.fullname, '') superviseur
        FROM users a
        JOIN user_profiles b ON a.id_user_profile = b.id
        LEFT JOIN users c ON a.superviseur = c.id
        ${queryCondition}`;
        const result = await executeDataRequest(queryStr, [], false);
        //console.log('User search result: ', result);
        return result;
    } catch (error) {    
        console.log(error);  
        return null;
    }  
}

// Create or update a user
export async function createorUpdateUser(user: CreateUpdateUser) {  
    console.log("Calling createorUpdateUser: ", user)
    try { 

        let hash = '';
        if (user.password !== '') {
            hash = await cryptPassword(String(user.password), 10);
        }
        user.password = hash;

        //delete not needed fields
        const excludedFields = ['user_group', 'create_dt', 'branch_name'];

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
        console.log("create result: ", result);
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
            SELECT a.id, a.username, a.status, a.create_dt, a.fullname, a.update_dt,
                    c.profile_name, a.email, a.phone, a.locked, a.expiry_date, a.version, 
                    a.created_by, a.auth_type, a.password, a.registration_number,
                    a.position, a.issupervisor, b.fullname superviseur, a.branch
            FROM users a
            JOIN user_profiles c ON c.id = a.id_user_profile
            join users b on a.superviseur = b.id
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


