'use server'

import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { executeDataRequest } from './db';
import { InputParam, ExportOptions } from './definitions';

// Export tasks to Excel
export async function exportTasksToExcel(
    userId: number,
    options: ExportOptions,
    isSupervisor = false
): Promise<Buffer | null> {
    try {
        // Get data based on filters
        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'is_supervisor', value: isSupervisor },
            { key: 'start_date', value: options.dateRange?.start },
            { key: 'end_date', value: options.dateRange?.end }
        ];

        const tasks = await executeDataRequest('sp_GetTasksForExport', params, true);
        
        if (!tasks || tasks.length === 0) {
            return null;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tâches');

        // Add headers
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nom de la tâche', key: 'task_name', width: 30 },
            { header: 'Description', key: 'description', width: 40 },
            { header: 'Employé', key: 'employee_name', width: 25 },
            { header: 'Date de début', key: 'start_date', width: 15 },
            { header: 'Date d\'échéance', key: 'due_date', width: 15 },
            { header: 'Statut', key: 'status', width: 15 },
            { header: 'Priorité', key: 'priority', width: 12 },
            { header: 'Type', key: 'task_type', width: 12 },
            { header: 'Commentaires employé', key: 'employee_comments', width: 30 },
            { header: 'Commentaires superviseur', key: 'supervisor_comments', width: 30 }
        ];

        // Style headers
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Add data
        tasks.forEach((task: any) => {
            worksheet.addRow({
                id: task.id,
                task_name: task.task_name,
                description: task.description,
                employee_name: task.employee_name,
                start_date: task.start_date ? new Date(task.start_date).toLocaleDateString('fr-FR') : '',
                due_date: task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : '',
                status: getStatusLabel(task.status),
                priority: getPriorityLabel(task.priority),
                task_type: task.task_type === 'planned' ? 'Planifiée' : 'Non planifiée',
                employee_comments: task.employee_comments || '',
                supervisor_comments: task.supervisor_comments || ''
            });
        });

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            if (column.eachCell) {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, (cell) => {
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                });
                column.width = maxLength < 10 ? 10 : maxLength;
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    } catch (error) {
        console.error('Erreur lors de l\'export Excel:', error);
        return null;
    }
}

// Export reports to Excel
export async function exportReportsToExcel(
    userId: number,
    options: ExportOptions,
    isSupervisor = false
): Promise<Buffer | null> {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'is_supervisor', value: isSupervisor },
            { key: 'start_date', value: options.dateRange?.start },
            { key: 'end_date', value: options.dateRange?.end }
        ];

        const reports = await executeDataRequest('sp_GetReportsForExport', params, true);
        
        if (!reports || reports.length === 0) {
            return null;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Rapports');

        // Add headers
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Employé', key: 'employee_name', width: 25 },
            { header: 'Date du rapport', key: 'report_date', width: 15 },
            { header: 'Branche', key: 'branch', width: 20 },
            { header: 'Département', key: 'department', width: 20 },
            { header: 'Statut', key: 'status', width: 15 },
            { header: 'Note superviseur', key: 'supervisor_rating', width: 15 },
            { header: 'Commentaires superviseur', key: 'supervisor_overall_comments', width: 40 },
            { header: 'Nombre de tâches', key: 'total_tasks', width: 15 },
            { header: 'Completion moyenne', key: 'avg_completion', width: 18 }
        ];

        // Style headers
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Add data
        reports.forEach((report: any) => {
            worksheet.addRow({
                id: report.id,
                employee_name: report.employee_name,
                report_date: new Date(report.report_date).toLocaleDateString('fr-FR'),
                branch: report.branch,
                department: report.department,
                status: getReportStatusLabel(report.status),
                supervisor_rating: report.supervisor_rating || '',
                supervisor_overall_comments: report.supervisor_overall_comments || '',
                total_tasks: report.total_tasks || 0,
                avg_completion: report.avg_completion ? `${Math.round(report.avg_completion)}%` : ''
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    } catch (error) {
        console.error('Erreur lors de l\'export Excel des rapports:', error);
        return null;
    }
}

// Export to CSV
export async function exportToCSV(data: any[], filename: string): Promise<string> {
    try {
        if (!data || data.length === 0) {
            return '';
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes in CSV
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value || '';
                }).join(',')
            )
        ].join('\n');

        return csvContent;
    } catch (error) {
        console.error('Erreur lors de l\'export CSV:', error);
        return '';
    }
}

// Export to PDF
export async function exportToPDF(
    data: any[],
    title: string,
    columns: { header: string; dataKey: string }[]
): Promise<Buffer | null> {
    try {
        if (!data || data.length === 0) {
            return null;
        }

        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text(title, 14, 22);
        
        // Add date
        doc.setFontSize(10);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

        // Prepare table data
        const tableData = data.map(row => 
            columns.map(col => {
                const value = row[col.dataKey];
                if (value instanceof Date) {
                    return value.toLocaleDateString('fr-FR');
                }
                return value || '';
            })
        );

        // Add table
        (doc as any).autoTable({
            head: [columns.map(col => col.header)],
            body: tableData,
            startY: 35,
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [224, 224, 224],
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [248, 248, 248]
            }
        });

        return Buffer.from(doc.output('arraybuffer'));
    } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
        return null;
    }
}

// Helper functions
function getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
        'not_started': 'Non commencée',
        'in_progress': 'En cours',
        'completed': 'Terminée',
        'on_hold': 'En attente',
        'cancelled': 'Annulée'
    };
    return statusLabels[status] || status;
}

function getPriorityLabel(priority: string): string {
    const priorityLabels: Record<string, string> = {
        'low': 'Faible',
        'medium': 'Moyenne',
        'high': 'Élevée',
        'urgent': 'Urgente'
    };
    return priorityLabels[priority] || priority;
}

function getReportStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
        'draft': 'Brouillon',
        'submitted': 'Soumis',
        'under_review': 'En révision',
        'approved': 'Approuvé',
        'rejected': 'Rejeté'
    };
    return statusLabels[status] || status;
}