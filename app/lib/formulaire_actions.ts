'use server'

import { executeDataRequest, executeInsertUpdateRequest } from '@/app/lib/db';
import { SearchParams, InputParam, Formulaire, Task } from './definitions';
import { revalidatePath } from 'next/cache';

// Search formulaires
export async function searchFormulaire(i_params: SearchParams, userId?: number, isSupervisor = false) {
    try {
        const { scope, value: search_value } = i_params;
        let queryCondition = 'WHERE 1 = 1';

        // Filter by user role
        if (!isSupervisor && userId) {
            queryCondition += ` AND f.id_user = ${userId}`;
        }

        if (search_value !== '*' && search_value !== '') {
            switch (scope) {
                case 'formulaire_id':
                    queryCondition += ` AND f.id_formulaire = ${search_value}`;
                    break;
                case 'status':
                    queryCondition += ` AND f.status = '${search_value}'`;
                    break;
                case 'user':
                    queryCondition += ` AND u.fullname LIKE '%${search_value}%'`;
                    break;
                case 'date':
                    queryCondition += ` AND CAST(f.create_dt AS DATE) = '${search_value}'`;
                    break;
                default:
                    queryCondition += ` AND (u.fullname LIKE '%${search_value}%' OR f.status LIKE '%${search_value}%')`;
            }
        }

        const queryStr = `
        SELECT 
            f.id_formulaire,
            f.id_user,
            f.employee_comment,
            f.supervisor_comment,
            f.create_dt,
            f.update_dt,
            f.status,
            u.fullname as user_name,
            u.registration_number,
            u.position,
            b.nom as branch_name,
            s.fullname as supervisor_name,
            COUNT(t.id_task) as total_tasks,
            SUM(CASE WHEN t.task_status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
        FROM formulaire f
        LEFT JOIN users u ON f.id_user = u.id
        LEFT JOIN branch b ON u.branch = b.code
        LEFT JOIN users s ON u.superviseur = s.id
        LEFT JOIN tasks t ON f.id_formulaire = t.id_formulaire
        ${queryCondition}
        GROUP BY f.id_formulaire, f.id_user, f.employee_comment, f.supervisor_comment, 
                 f.create_dt, f.update_dt, f.status, u.fullname, u.registration_number, 
                 u.position, b.nom, s.fullname
        ORDER BY f.create_dt DESC`;

        const result = await executeDataRequest(queryStr, [], false);
        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
}

// Create or update formulaire
export async function createOrUpdateFormulaire(formulaire: Partial<Formulaire>, tasks: Partial<Task>[]) {
    try {
        const formulaireParams: InputParam[] = [
            { key: 'id_formulaire', value: formulaire.id_formulaire || 0 },
            { key: 'id_user', value: formulaire.id_user },
            { key: 'employee_comment', value: formulaire.employee_comment },
            { key: 'supervisor_comment', value: formulaire.supervisor_comment },
            { key: 'status', value: formulaire.status || 'draft' }
        ];

        const result = await executeInsertUpdateRequest('sp_CreateOrUpdateFormulaire', formulaireParams, true);
        
        if (result && result.length > 0) {
            const formulaireId = result[0].id_formulaire || formulaire.id_formulaire;
            
            // Save tasks if provided
            if (tasks && tasks.length > 0) {
                for (const task of tasks) {
                    const taskParams: InputParam[] = [
                        { key: 'id_task', value: task.id_task || 0 },
                        { key: 'type_task', value: task.type_task },
                        { key: 'task_number', value: task.task_number },
                        { key: 'task_description', value: task.task_description },
                        { key: 'task_start_dt', value: task.task_start_dt },
                        { key: 'task_end_dt', value: task.task_end_dt },
                        { key: 'task_status', value: task.task_status || 'not_started' },
                        { key: 'task_comment', value: task.task_comment },
                        { key: 'id_formulaire', value: formulaireId }
                    ];
                    
                    await executeInsertUpdateRequest('sp_CreateOrUpdateTask', taskParams, true);
                }
            }
            
            revalidatePath('/main/formulaire');
            revalidatePath('/main/dashboard');
            return result[0];
        }
        
        return null;
    } catch (error) {
        console.log(error);
        return null;
    }
}

// Submit formulaire for review
export async function submitFormulaire(formulaireId: number, userId: number) {
    try {
        const params: InputParam[] = [
            { key: 'formulaire_id', value: formulaireId },
            { key: 'submitted_by', value: userId }
        ];

        await executeInsertUpdateRequest('sp_SubmitFormulaire', params, true);
        revalidatePath('/main/formulaire');
        revalidatePath('/main/dashboard');
        
        return { success: true };
    } catch (error) {
        console.error('Error submitting formulaire:', error);
        return { success: false, error: 'Erreur lors de la soumission' };
    }
}

// Review formulaire (supervisor only)
export async function reviewFormulaire(
    formulaireId: number,
    supervisorId: number,
    status: 'approved' | 'rejected',
    comments: string
) {
    try {
        const params: InputParam[] = [
            { key: 'formulaire_id', value: formulaireId },
            { key: 'supervisor_id', value: supervisorId },
            { key: 'status', value: status },
            { key: 'supervisor_comment', value: comments }
        ];

        await executeInsertUpdateRequest('sp_ReviewFormulaire', params, true);
        revalidatePath('/main/formulaire');
        revalidatePath('/main/dashboard');
        
        return { success: true };
    } catch (error) {
        console.error('Error reviewing formulaire:', error);
        return { success: false, error: 'Erreur lors de la révision' };
    }
}

// Get formulaire details with tasks
export async function getFormulaireDetails(formulaireId: number) {
    try {
        const formulaireParams: InputParam[] = [
            { key: 'formulaire_id', value: formulaireId }
        ];

        const formulaire = await executeDataRequest('sp_GetFormulaireDetails', formulaireParams, true);
        const tasks = await executeDataRequest('sp_GetFormulaireTasks', formulaireParams, true);
        
        return {
            formulaire: formulaire && formulaire.length > 0 ? formulaire[0] : null,
            tasks: tasks || []
        };
    } catch (error) {
        console.error('Error getting formulaire details:', error);
        return { formulaire: null, tasks: [] };
    }
}

// Delete formulaire
export async function deleteFormulaire(formulaireId: number, userId: number) {
    try {
        const params: InputParam[] = [
            { key: 'formulaire_id', value: formulaireId },
            { key: 'deleted_by', value: userId }
        ];

        await executeInsertUpdateRequest('sp_DeleteFormulaire', params, true);
        revalidatePath('/main/formulaire');
        revalidatePath('/main/dashboard');
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting formulaire:', error);
        return { success: false, error: 'Erreur lors de la suppression' };
    }
}

// Get dashboard statistics
export async function getDashboardStats(userId: number, isSupervisor = false) {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'is_supervisor', value: isSupervisor }
        ];

        const result = await executeDataRequest('sp_GetDashboardStats', params, true);
        return result && result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return null;
    }
}

// Get user's tasks for a specific date
export async function getUserTasksForDate(userId: number, date: Date) {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'task_date', value: date }
        ];

        const result = await executeDataRequest('sp_GetUserTasksForDate', params, true);
        return result || [];
    } catch (error) {
        console.error('Error getting user tasks:', error);
        return [];
    }
}