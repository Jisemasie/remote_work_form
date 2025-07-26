+'use server'

+import ExcelJS from 'exceljs';
+import jsPDF from 'jspdf';
+import 'jspdf-autotable';
+import { executeDataRequest } from './db';
+import { InputParam, ExportOptions } from './definitions';

+// Enhanced export with better formatting and styling
+export async function exportTasksToExcelEnhanced(
+    userId: number,
+    options: ExportOptions,
+    isSupervisor = false
+): Promise<Buffer | null> {
+    try {
+        const params: InputParam[] = [
+            { key: 'user_id', value: userId },
+            { key: 'is_supervisor', value: isSupervisor },
+            { key: 'start_date', value: options.dateRange?.start },
+            { key: 'end_date', value: options.dateRange?.end }
+        ];

+        const tasks = await executeDataRequest('sp_GetTasksForExport', params, true);
+        
+        if (!tasks || tasks.length === 0) {
+            return null;
+        }

+        const workbook = new ExcelJS.Workbook();
+        const worksheet = workbook.addWorksheet('Tâches', {
+            properties: { tabColor: { argb: 'FF0066CC' } }
+        });

+        // Add company header
+        worksheet.mergeCells('A1:K1');
+        const titleCell = worksheet.getCell('A1');
+        titleCell.value = 'RAPPORT DES TÂCHES - FINCA RD CONGO';
+        titleCell.font = { size: 16, bold: true, color: { argb: 'FF0066CC' } };
+        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
+        titleCell.fill = {
+            type: 'pattern',
+            pattern: 'solid',
+            fgColor: { argb: 'FFF0F8FF' }
+        };

+        // Add generation date
+        worksheet.mergeCells('A2:K2');
+        const dateCell = worksheet.getCell('A2');
+        dateCell.value = `Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
+        dateCell.font = { size: 10, italic: true };
+        dateCell.alignment = { horizontal: 'center' };

+        // Add empty row
+        worksheet.addRow([]);

+        // Define columns with enhanced formatting
+        worksheet.columns = [
+            { header: 'ID', key: 'id', width: 8 },
+            { header: 'Nom de la tâche', key: 'task_name', width: 35 },
+            { header: 'Description', key: 'description', width: 45 },
+            { header: 'Employé', key: 'employee_name', width: 25 },
+            { header: 'Date de début', key: 'start_date', width: 15 },
+            { header: 'Date d\'échéance', key: 'due_date', width: 15 },
+            { header: 'Statut', key: 'status', width: 15 },
+            { header: 'Priorité', key: 'priority', width: 12 },
+            { header: 'Type', key: 'task_type', width: 15 },
+            { header: 'Écart (jours)', key: 'gaps', width: 12 },
+            { header: 'Commentaires', key: 'employee_comments', width: 40 }
+        ];

+        // Style headers (row 4)
+        const headerRow = worksheet.getRow(4);
+        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
+        headerRow.fill = {
+            type: 'pattern',
+            pattern: 'solid',
+            fgColor: { argb: 'FF0066CC' }
+        };
+        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
+        headerRow.height = 25;

+        // Add borders to headers
+        headerRow.eachCell((cell) => {
+            cell.border = {
+                top: { style: 'thin' },
+                left: { style: 'thin' },
+                bottom: { style: 'thin' },
+                right: { style: 'thin' }
+            };
+        });

+        // Add data with conditional formatting
+        let rowIndex = 5;
+        tasks.forEach((task: any) => {
+            const row = worksheet.addRow({
+                id: task.id,
+                task_name: task.task_name,
+                description: task.description,
+                employee_name: task.employee_name,
+                start_date: task.start_date ? new Date(task.start_date).toLocaleDateString('fr-FR') : '',
+                due_date: task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : '',
+                status: getStatusLabel(task.status),
+                priority: getPriorityLabel(task.priority),
+                task_type: task.task_type === 'planned' ? 'Planifiée' : 'Non planifiée',
+                gaps: task.gaps || '',
+                employee_comments: task.employee_comments || ''
+            });

+            // Apply conditional formatting based on status and priority
+            const statusCell = row.getCell('status');
+            const priorityCell = row.getCell('priority');
+            
+            // Status colors
+            switch (task.status) {
+                case 'completed':
+                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
+                    statusCell.font = { color: { argb: 'FF155724' } };
+                    break;
+                case 'in_progress':
+                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCE5FF' } };
+                    statusCell.font = { color: { argb: 'FF004085' } };
+                    break;
+                case 'on_hold':
+                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
+                    statusCell.font = { color: { argb: 'FF856404' } };
+                    break;
+                case 'cancelled':
+                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
+                    statusCell.font = { color: { argb: 'FF721C24' } };
+                    break;
+            }

+            // Priority colors
+            switch (task.priority) {
+                case 'urgent':
+                    priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
+                    priorityCell.font = { color: { argb: 'FF721C24' }, bold: true };
+                    break;
+                case 'high':
+                    priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEAA7' } };
+                    priorityCell.font = { color: { argb: 'FF856404' } };
+                    break;
+            }

+            // Add borders to all cells
+            row.eachCell((cell) => {
+                cell.border = {
+                    top: { style: 'thin' },
+                    left: { style: 'thin' },
+                    bottom: { style: 'thin' },
+                    right: { style: 'thin' }
+                };
+            });

+            // Alternate row colors
+            if (rowIndex % 2 === 0) {
+                row.eachCell((cell) => {
+                    if (!cell.fill || !cell.fill.fgColor) {
+                        cell.fill = {
+                            type: 'pattern',
+                            pattern: 'solid',
+                            fgColor: { argb: 'FFF8F9FA' }
+                        };
+                    }
+                });
+            }

+            rowIndex++;
+        });

+        // Add summary row
+        const summaryRowIndex = rowIndex + 1;
+        worksheet.mergeCells(`A${summaryRowIndex}:C${summaryRowIndex}`);
+        const summaryCell = worksheet.getCell(`A${summaryRowIndex}`);
+        summaryCell.value = `Total des tâches: ${tasks.length}`;
+        summaryCell.font = { bold: true, size: 12 };
+        summaryCell.fill = {
+            type: 'pattern',
+            pattern: 'solid',
+            fgColor: { argb: 'FFE9ECEF' }
+        };

+        // Auto-fit columns
+        worksheet.columns.forEach(column => {
+            if (column.eachCell) {
+                let maxLength = 0;
+                column.eachCell({ includeEmpty: true }, (cell) => {
+                    const columnLength = cell.value ? cell.value.toString().length : 10;
+                    if (columnLength > maxLength) {
+                        maxLength = columnLength;
+                    }
+                });
+                column.width = Math.min(maxLength < 10 ? 10 : maxLength, 50);
+            }
+        });

+        const buffer = await workbook.xlsx.writeBuffer();
+        return Buffer.from(buffer);
+    } catch (error) {
+        console.error('Erreur lors de l\'export Excel:', error);
+        return null;
+    }
+}

+// Enhanced PDF export with better styling
+export async function exportToPDFEnhanced(
+    data: any[],
+    title: string,
+    columns: { header: string; dataKey: string }[]
+): Promise<Buffer | null> {
+    try {
+        if (!data || data.length === 0) {
+            return null;
+        }

+        const doc = new jsPDF();
+        
+        // Add company logo area (placeholder)
+        doc.setFillColor(0, 102, 204);
+        doc.rect(14, 10, 182, 25, 'F');
+        
+        // Add company name
+        doc.setTextColor(255, 255, 255);
+        doc.setFontSize(18);
+        doc.setFont('helvetica', 'bold');
+        doc.text('FINCA RD CONGO SARL', 105, 20, { align: 'center' });
+        
+        doc.setFontSize(12);
+        doc.setFont('helvetica', 'normal');
+        doc.text('Système de Gestion des Tâches', 105, 28, { align: 'center' });
+        
+        // Reset text color
+        doc.setTextColor(0, 0, 0);
+        
+        // Add title
+        doc.setFontSize(16);
+        doc.setFont('helvetica', 'bold');
+        doc.text(title, 14, 45);
+        
+        // Add generation info
+        doc.setFontSize(10);
+        doc.setFont('helvetica', 'normal');
+        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 52);
+        doc.text(`Nombre d'enregistrements: ${data.length}`, 14, 58);

+        // Prepare table data
+        const tableData = data.map(row => 
+            columns.map(col => {
+                const value = row[col.dataKey];
+                if (value instanceof Date) {
+                    return value.toLocaleDateString('fr-FR');
+                }
+                return value || '';
+            })
+        );

+        // Add table with enhanced styling
+        (doc as any).autoTable({
+            head: [columns.map(col => col.header)],
+            body: tableData,
+            startY: 65,
+            styles: {
+                fontSize: 8,
+                cellPadding: 3,
+                overflow: 'linebreak',
+                halign: 'left'
+            },
+            headStyles: {
+                fillColor: [0, 102, 204],
+                textColor: [255, 255, 255],
+                fontStyle: 'bold',
+                fontSize: 9
+            },
+            alternateRowStyles: {
+                fillColor: [248, 249, 250]
+            },
+            columnStyles: {
+                0: { cellWidth: 15 }, // ID column
+                1: { cellWidth: 40 }, // Name column
+                2: { cellWidth: 25 }, // Status column
+            },
+            margin: { top: 65, left: 14, right: 14 },
+            didDrawPage: function (data: any) {
+                // Add page numbers
+                const pageCount = doc.getNumberOfPages();
+                const pageSize = doc.internal.pageSize;
+                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
+                
+                doc.setFontSize(8);
+                doc.text(`Page ${data.pageNumber} sur ${pageCount}`, 
+                    pageSize.width - 30, pageHeight - 10);
+                
+                // Add footer
+                doc.text('FINCA RD CONGO SARL - Confidentiel', 14, pageHeight - 10);
+            }
+        });

+        return Buffer.from(doc.output('arraybuffer'));
+    } catch (error) {
+        console.error('Erreur lors de l\'export PDF:', error);
+        return null;
+    }
+}

+// Enhanced CSV export with proper encoding
+export async function exportToCSVEnhanced(data: any[], filename: string): Promise<string> {
+    try {
+        if (!data || data.length === 0) {
+            return '';
+        }

+        const headers = Object.keys(data[0]);
+        
+        // Add BOM for proper UTF-8 encoding in Excel
+        let csvContent = '\uFEFF';
+        
+        // Add header with company info
+        csvContent += `"FINCA RD CONGO SARL - ${filename}"\n`;
+        csvContent += `"Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}"\n`;
+        csvContent += `"Nombre d'enregistrements: ${data.length}"\n`;
+        csvContent += '\n';
+        
+        // Add column headers
+        csvContent += headers.map(header => `"${header}"`).join(',') + '\n';
+        
+        // Add data rows
+        csvContent += data.map(row => 
+            headers.map(header => {
+                const value = row[header];
+                if (value === null || value === undefined) {
+                    return '""';
+                }
+                // Escape quotes and wrap in quotes
+                const stringValue = String(value).replace(/"/g, '""');
+                return `"${stringValue}"`;
+            }).join(',')
+        ).join('\n');

+        return csvContent;
+    } catch (error) {
+        console.error('Erreur lors de l\'export CSV:', error);
+        return '';
+    }
+}

+// Helper functions
+function getStatusLabel(status: string): string {
+    const statusLabels: Record<string, string> = {
+        'not_started': 'Non commencée',
+        'in_progress': 'En cours',
+        'completed': 'Terminée',
+        'on_hold': 'En attente',
+        'cancelled': 'Annulée'
+    };
+    return statusLabels[status] || status;
+}

+function getPriorityLabel(priority: string): string {
+    const priorityLabels: Record<string, string> = {
+        'low': 'Faible',
+        'medium': 'Moyenne',
+        'high': 'Élevée',
+        'urgent': 'Urgente'
+    };
+    return priorityLabels[priority] || priority;
+}