'use server'

import { executeDataRequest, executeInsertUpdateRequest } from './db';
import { InputParam, Notification } from './definitions';
import { revalidatePath } from 'next/cache';

// Create notification
export async function createNotification(
    userId: number,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    relatedEntityType?: string,
    relatedEntityId?: number,
    expiresAt?: Date
) {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'title', value: title },
            { key: 'message', value: message },
            { key: 'type', value: type },
            { key: 'related_entity_type', value: relatedEntityType },
            { key: 'related_entity_id', value: relatedEntityId },
            { key: 'expires_at', value: expiresAt }
        ];

        await executeInsertUpdateRequest('sp_CreateNotification', params, true);
        revalidatePath('/main');
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la création de la notification:', error);
        return { success: false };
    }
}

// Get user notifications
export async function getUserNotifications(userId: number, includeRead = false) {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'include_read', value: includeRead }
        ];

        const result = await executeDataRequest('sp_GetUserNotifications', params, true);
        return result || [];
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return [];
    }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: number, userId: number) {
    try {
        const params: InputParam[] = [
            { key: 'notification_id', value: notificationId },
            { key: 'user_id', value: userId }
        ];

        await executeInsertUpdateRequest('sp_MarkNotificationAsRead', params, true);
        revalidatePath('/main');
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors du marquage de la notification:', error);
        return { success: false };
    }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: number) {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId }
        ];

        await executeInsertUpdateRequest('sp_MarkAllNotificationsAsRead', params, true);
        revalidatePath('/main');
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors du marquage de toutes les notifications:', error);
        return { success: false };
    }
}

// Delete notification
export async function deleteNotification(notificationId: number, userId: number) {
    try {
        const params: InputParam[] = [
            { key: 'notification_id', value: notificationId },
            { key: 'user_id', value: userId }
        ];

        await executeInsertUpdateRequest('sp_DeleteNotification', params, true);
        revalidatePath('/main');
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la suppression de la notification:', error);
        return { success: false };
    }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: number) {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId }
        ];

        const result = await executeDataRequest('sp_GetUnreadNotificationCount', params, true);
        return result && result.length > 0 ? result[0].count : 0;
    } catch (error) {
        console.error('Erreur lors du comptage des notifications non lues:', error);
        return 0;
    }
}

// Send notification to supervisors when report is submitted
export async function notifySupervisorsReportSubmitted(reportId: number, employeeName: string) {
    try {
        const params: InputParam[] = [
            { key: 'report_id', value: reportId },
            { key: 'employee_name', value: employeeName }
        ];

        await executeInsertUpdateRequest('sp_NotifySupervisorsReportSubmitted', params, true);
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la notification aux superviseurs:', error);
        return { success: false };
    }
}

// Send notification to employee when report is reviewed
export async function notifyEmployeeReportReviewed(
    employeeId: number,
    reportId: number,
    status: 'approved' | 'rejected',
    supervisorName: string
) {
    try {
        const params: InputParam[] = [
            { key: 'employee_id', value: employeeId },
            { key: 'report_id', value: reportId },
            { key: 'status', value: status },
            { key: 'supervisor_name', value: supervisorName }
        ];

        await executeInsertUpdateRequest('sp_NotifyEmployeeReportReviewed', params, true);
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la notification à l\'employé:', error);
        return { success: false };
    }
}

// Send notification for overdue tasks
export async function notifyOverdueTasks() {
    try {
        await executeInsertUpdateRequest('sp_NotifyOverdueTasks', [], true);
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la notification des tâches en retard:', error);
        return { success: false };
    }
}

// Send notification for upcoming deadlines
export async function notifyUpcomingDeadlines(daysBefore = 2) {
    try {
        const params: InputParam[] = [
            { key: 'days_before', value: daysBefore }
        ];

        await executeInsertUpdateRequest('sp_NotifyUpcomingDeadlines', params, true);
        
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la notification des échéances:', error);
        return { success: false };
    }
}