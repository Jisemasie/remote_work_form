'use server'

import { executeDataRequest, executeInsertUpdateRequest, executeBatchRequest } from './db';
import { InputParam, Task, DailyReport, ReportTask, SearchParams } from './definitions';
import { revalidatePath } from 'next/cache';

// Task Management Functions

export async function searchTasks(params: SearchParams, userId?: number) {
    try {
        const { scope, value } = params;
        let queryCondition = 'WHERE 1 = 1';
        
        if (userId) {
            queryCondition += ` AND t.employee_id = ${userId}`;
        }
        
        if (value !== '*' && value !== '') {
            switch (scope) {
                case 'task_name':
                    queryCondition += ` AND t.task_name LIKE '%${value}%'`;
                    break;
                case 'status':
                    queryCondition += ` AND t.status = '${value}'`;
                    break;
                case 'priority':
                    queryCondition += ` AND t.priority = '${value}'`;
                    break;
                case 'date_range':
                    // Expecting value in format 'YYYY-MM-DD,YYYY-MM-DD'
                    const dates = value.split(',');
                    if (dates.length === 2) {
                        queryCondition += ` AND t.start_date BETWEEN '${dates[0]}' AND '${dates[1]}'`;
                    }
                    break;
                case 'overdue':
                    queryCondition += ` AND t.due_date < GETDATE() AND t.status != 'completed'`;
                    break;
                default:
                    queryCondition += ` AND (t.task_name LIKE '%${value}%' OR t.description LIKE '%${value}%')`;
            }
        }
        
        const queryStr = `
            SELECT 
                t.id,
                t.employee_id,
                t.task_name,
                t.description,
                t.start_date,
                t.due_date,
                t.status,
                t.priority,
                t.task_type,
                t.gaps,
                t.employee_comments,
                t.supervisor_comments,
                t.supervisor_feedback,
                t.created_by,
                t.created_at,
                t.updated_at,
                dbo.fn_ConvertTimestampToBase64(t.version) AS version,
                u.fullname as employee_name,
                s.fullname as supervisor_name,
                CASE 
                    WHEN t.due_date < GETDATE() AND t.status != 'completed' THEN 1
                    ELSE 0
                END as is_overdue,
                CASE 
                    WHEN t.due_date IS NOT NULL THEN DATEDIFF(day, GETDATE(), t.due_date)
                    ELSE NULL
                END as days_remaining
            FROM tasks t
            LEFT JOIN users u ON t.employee_id = u.id
            LEFT JOIN users s ON t.created_by = s.id
            ${queryCondition}
            ORDER BY 
                CASE t.priority 
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                END,
                t.due_date ASC,
                t.created_at DESC
        `;
        
        const result = await executeDataRequest(queryStr, [], false);
        return result;
    } catch (error) {
        console.error('Erreur lors de la recherche des tâches:', error);
        return null;
    }
}

export async function createOrUpdateTask(task: Partial<Task>) {
    try {
        const params: InputParam[] = [
            { key: 'id', value: task.id || 0 },
            { key: 'employee_id', value: task.employee_id },
            { key: 'task_name', value: task.task_name },
            { key: 'description', value: task.description },
            { key: 'start_date', value: task.start_date },
            { key: 'due_date', value: task.due_date },
            { key: 'status', value: task.status || 'not_started' },
            { key: 'priority', value: task.priority || 'medium' },
            { key: 'task_type', value: task.task_type || 'planned' },
            { key: 'employee_comments', value: task.employee_comments },
            { key: 'supervisor_comments', value: task.supervisor_comments },
            { key: 'supervisor_feedback', value: task.supervisor_feedback },
            { key: 'created_by', value: task.created_by }
        ];

        const result = await executeInsertUpdateRequest('sp_CreateOrUpdateTask', params, true);
        
        if (result && result.length > 0) {
            revalidatePath('/main/tasks');
            revalidatePath('/main/dashboard');
            return result[0];
        }
        
        return null;
    } catch (error) {
        console.error('Erreur lors de la création/mise à jour de la tâche:', error);
        return null;
    }
}

export async function deleteTask(taskId: number, userId: number) {
    try {
        const params: InputParam[] = [
            { key: 'task_id', value: taskId },
            { key: 'deleted_by', value: userId }
        ];

        await executeInsertUpdateRequest('sp_DeleteTask', params, true);
        revalidatePath('/main/tasks');
        revalidatePath('/main/dashboard');
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la suppression de la tâche:', error);
        return { success: false, error: 'Erreur lors de la suppression' };
    }
}

export async function updateTaskStatus(taskId: number, status: string, userId: number, comments?: string) {
    try {
        const params: InputParam[] = [
            { key: 'task_id', value: taskId },
            { key: 'status', value: status },
            { key: 'updated_by', value: userId },
            { key: 'comments', value: comments }
        ];

        await executeInsertUpdateRequest('sp_UpdateTaskStatus', params, true);
        revalidatePath('/main/tasks');
        revalidatePath('/main/dashboard');
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        return { success: false, error: 'Erreur lors de la mise à jour' };
    }
}

// Daily Report Functions

export async function searchDailyReports(params: SearchParams, userId?: number, isSupervisor = false) {
    try {
        const { scope, value } = params;
        let queryCondition = 'WHERE 1 = 1';
        
        if (!isSupervisor && userId) {
            queryCondition += ` AND dr.employee_id = ${userId}`;
        } else if (isSupervisor && userId) {
            queryCondition += ` AND dr.supervisor_id = ${userId}`;
        }
        
        if (value !== '*' && value !== '') {
            switch (scope) {
                case 'status':
                    queryCondition += ` AND dr.status = '${value}'`;
                    break;
                case 'date':
                    queryCondition += ` AND CAST(dr.report_date AS DATE) = '${value}'`;
                    break;
                case 'employee':
                    queryCondition += ` AND u.fullname LIKE '%${value}%'`;
                    break;
                case 'branch':
                    queryCondition += ` AND dr.branch LIKE '%${value}%'`;
                    break;
                default:
                    queryCondition += ` AND (u.fullname LIKE '%${value}%' OR dr.branch LIKE '%${value}%')`;
            }
        }
        
        const queryStr = `
            SELECT 
                dr.id,
                dr.employee_id,
                dr.report_date,
                dr.branch,
                dr.department,
                dr.supervisor_id,
                dr.status,
                dr.supervisor_overall_comments,
                dr.supervisor_rating,
                dr.created_at,
                dr.updated_at,
                dbo.fn_ConvertTimestampToBase64(dr.version) AS version,
                u.fullname as employee_name,
                u.registration_number,
                u.position,
                s.fullname as supervisor_name,
                COUNT(rt.id) as total_tasks,
                AVG(rt.completion_percentage) as avg_completion
            FROM daily_reports dr
            LEFT JOIN users u ON dr.employee_id = u.id
            LEFT JOIN users s ON dr.supervisor_id = s.id
            LEFT JOIN report_tasks rt ON dr.id = rt.report_id
            ${queryCondition}
            GROUP BY 
                dr.id, dr.employee_id, dr.report_date, dr.branch, dr.department,
                dr.supervisor_id, dr.status, dr.supervisor_overall_comments,
                dr.supervisor_rating, dr.created_at, dr.updated_at, dr.version,
                u.fullname, u.registration_number, u.position, s.fullname
            ORDER BY dr.report_date DESC, dr.created_at DESC
        `;
        
        const result = await executeDataRequest(queryStr, [], false);
        return result;
    } catch (error) {
        console.error('Erreur lors de la recherche des rapports:', error);
        return null;
    }
}

export async function createOrUpdateDailyReport(report: Partial<DailyReport>, tasks: Partial<ReportTask>[]) {
    try {
        // Use transaction for consistency
        const operations = [];
        
        // Create/Update report
        const reportParams: InputParam[] = [
            { key: 'id', value: report.id || 0 },
            { key: 'employee_id', value: report.employee_id },
            { key: 'report_date', value: report.report_date },
            { key: 'branch', value: report.branch },
            { key: 'department', value: report.department },
            { key: 'supervisor_id', value: report.supervisor_id },
            { key: 'status', value: report.status || 'draft' },
            { key: 'supervisor_overall_comments', value: report.supervisor_overall_comments },
            { key: 'supervisor_rating', value: report.supervisor_rating }
        ];
        
        operations.push({
            sql: 'sp_CreateOrUpdateDailyReport',
            params: reportParams,
            isProcedure: true
        });
        
        // Add tasks if provided
        if (tasks && tasks.length > 0) {
            for (const task of tasks) {
                const taskParams: InputParam[] = [
                    { key: 'id', value: task.id || 0 },
                    { key: 'report_id', value: report.id || 0 }, // Will be updated after report creation
                    { key: 'task_id', value: task.task_id },
                    { key: 'actual_start_date', value: task.actual_start_date },
                    { key: 'actual_end_date', value: task.actual_end_date },
                    { key: 'completion_percentage', value: task.completion_percentage || 0 },
                    { key: 'employee_notes', value: task.employee_notes },
                    { key: 'supervisor_feedback', value: task.supervisor_feedback }
                ];
                
                operations.push({
                    sql: 'sp_CreateOrUpdateReportTask',
                    params: taskParams,
                    isProcedure: true
                });
            }
        }
        
        const results = await executeBatchRequest(operations, true);
        
        if (results && results.length > 0) {
            revalidatePath('/main/reports');
            revalidatePath('/main/dashboard');
            return results[0];
        }
        
        return null;
    } catch (error) {
        console.error('Erreur lors de la création/mise à jour du rapport:', error);
        return null;
    }
}

export async function submitDailyReport(reportId: number, userId: number) {
    try {
        const params: InputParam[] = [
            { key: 'report_id', value: reportId },
            { key: 'submitted_by', value: userId }
        ];

        await executeInsertUpdateRequest('sp_SubmitDailyReport', params, true);
        revalidatePath('/main/reports');
        revalidatePath('/main/dashboard');
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la soumission du rapport:', error);
        return { success: false, error: 'Erreur lors de la soumission' };
    }
}

export async function reviewDailyReport(
    reportId: number, 
    supervisorId: number, 
    status: 'approved' | 'rejected',
    comments: string,
    rating?: number
) {
    try {
        const params: InputParam[] = [
            { key: 'report_id', value: reportId },
            { key: 'supervisor_id', value: supervisorId },
            { key: 'status', value: status },
            { key: 'comments', value: comments },
            { key: 'rating', value: rating }
        ];

        await executeInsertUpdateRequest('sp_ReviewDailyReport', params, true);
        revalidatePath('/main/reports');
        revalidatePath('/main/dashboard');
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la révision du rapport:', error);
        return { success: false, error: 'Erreur lors de la révision' };
    }
}

// Dashboard Statistics

export async function getDashboardStats(userId: number, isSupervisor = false) {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'is_supervisor', value: isSupervisor }
        ];

        const result = await executeDataRequest('sp_GetDashboardStats', params, true);
        return result && result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return null;
    }
}

// Get tasks for a specific report
export async function getReportTasks(reportId: number) {
    try {
        const params: InputParam[] = [
            { key: 'report_id', value: reportId }
        ];

        const result = await executeDataRequest('sp_GetReportTasks', params, true);
        return result || [];
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches du rapport:', error);
        return [];
    }
}

// Get employee tasks for report creation
export async function getEmployeeTasksForReport(employeeId: number, reportDate: Date) {
    try {
        const params: InputParam[] = [
            { key: 'employee_id', value: employeeId },
            { key: 'report_date', value: reportDate }
        ];

        const result = await executeDataRequest('sp_GetEmployeeTasksForReport', params, true);
        return result || [];
    } catch (error) {
        console.error('Erreur lors de la récupération des tâches de l\'employé:', error);
        return [];
    }
}