'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import DataTable, { Column, Filter } from '@/app/components/DataTable';
import { searchTasks, deleteTask, updateTaskStatus } from '@/app/lib/task_actions';
import { exportTasksToExcel, exportToCSV, exportToPDF } from '@/app/lib/export_utils';
import { getSessionData } from '@/app/lib/session';
import { Task, SearchParams } from '@/app/lib/definitions';
import { useToast } from '@/app/hook/useToast';

export default function TasksPage() {
    const router = useRouter();
    const { success, error } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<any>(null);

    useEffect(() => {
        const loadTasks = async () => {
            try {
                const sessionData = await getSessionData();
                setUserInfo(sessionData);
                
                const searchParams: SearchParams = {
                    scope: 'all',
                    value: ''
                };
                
                const userId = sessionData?.issupervisor ? undefined : parseInt(sessionData?.id || '0');
                const result = await searchTasks(searchParams, userId);
                
                if (result) {
                    setTasks(result);
                }
            } catch (err) {
                console.error('Erreur lors du chargement des tâches:', err);
                error('Erreur lors du chargement des tâches');
            } finally {
                setLoading(false);
            }
        };

        loadTasks();
    }, [error]);

    const handleView = (task: Task) => {
        router.push(`/main/tasks/${task.id}/view`);
    };

    const handleEdit = (task: Task) => {
        router.push(`/main/tasks/${task.id}/edit`);
    };

    const handleDelete = async (task: Task) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            return;
        }

        try {
            const result = await deleteTask(task.id, parseInt(userInfo?.id || '0'));
            if (result.success) {
                success('Tâche supprimée avec succès');
                // Reload tasks
                const searchParams: SearchParams = { scope: 'all', value: '' };
                const userId = userInfo?.issupervisor ? undefined : parseInt(userInfo?.id || '0');
                const updatedTasks = await searchTasks(searchParams, userId);
                if (updatedTasks) {
                    setTasks(updatedTasks);
                }
            } else {
                error(result.error || 'Erreur lors de la suppression');
            }
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            error('Erreur lors de la suppression de la tâche');
        }
    };

    const handleStatusChange = async (task: Task, newStatus: string) => {
        try {
            const result = await updateTaskStatus(task.id, newStatus, parseInt(userInfo?.id || '0'));
            if (result.success) {
                success('Statut mis à jour avec succès');
                // Reload tasks
                const searchParams: SearchParams = { scope: 'all', value: '' };
                const userId = userInfo?.issupervisor ? undefined : parseInt(userInfo?.id || '0');
                const updatedTasks = await searchTasks(searchParams, userId);
                if (updatedTasks) {
                    setTasks(updatedTasks);
                }
            } else {
                error(result.error || 'Erreur lors de la mise à jour');
            }
        } catch (err) {
            console.error('Erreur lors de la mise à jour:', err);
            error('Erreur lors de la mise à jour du statut');
        }
    };

    const handleExport = async (format: 'excel' | 'csv' | 'pdf', filteredData: Task[]) => {
        try {
            if (format === 'excel') {
                const buffer = await exportTasksToExcel(
                    parseInt(userInfo?.id || '0'),
                    { format: 'excel' },
                    userInfo?.issupervisor
                );
                if (buffer) {
                    const blob = new Blob([buffer], { 
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `taches_${new Date().toISOString().split('T')[0]}.xlsx`;
                    a.click();
                    URL.revokeObjectURL(url);
                    success('Export Excel réussi');
                }
            } else if (format === 'csv') {
                const csvContent = await exportToCSV(filteredData, 'tasks');
                if (csvContent) {
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `taches_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    success('Export CSV réussi');
                }
            } else if (format === 'pdf') {
                const columns = [
                    { header: 'Nom', dataKey: 'task_name' },
                    { header: 'Employé', dataKey: 'employee_name' },
                    { header: 'Statut', dataKey: 'status' },
                    { header: 'Priorité', dataKey: 'priority' },
                    { header: 'Date d\'échéance', dataKey: 'due_date' }
                ];
                const buffer = await exportToPDF(filteredData, 'Liste des Tâches', columns);
                if (buffer) {
                    const blob = new Blob([buffer], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `taches_${new Date().toISOString().split('T')[0]}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                    success('Export PDF réussi');
                }
            }
        } catch (err) {
            console.error('Erreur lors de l\'export:', err);
            error('Erreur lors de l\'export');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'not_started': { label: 'Non commencée', color: 'bg-gray-100 text-gray-800' },
            'in_progress': { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
            'completed': { label: 'Terminée', color: 'bg-green-100 text-green-800' },
            'on_hold': { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
            'cancelled': { label: 'Annulée', color: 'bg-red-100 text-red-800' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const priorityConfig = {
            'low': { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
            'medium': { label: 'Moyenne', color: 'bg-blue-100 text-blue-800' },
            'high': { label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
            'urgent': { label: 'Urgente', color: 'bg-red-100 text-red-800' }
        };

        const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const columns: Column<Task>[] = [
        {
            key: 'task_name',
            header: 'Nom de la tâche',
            sortable: true,
            searchable: true,
            render: (value, row) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{value}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{row.description}</div>
                </div>
            )
        },
        {
            key: 'employee_name',
            header: 'Employé',
            sortable: true,
            searchable: true,
            render: (value) => (
                <div className="text-sm text-gray-900">{value}</div>
            )
        },
        {
            key: 'status',
            header: 'Statut',
            sortable: true,
            render: (value) => getStatusBadge(value),
            align: 'center'
        },
        {
            key: 'priority',
            header: 'Priorité',
            sortable: true,
            render: (value) => getPriorityBadge(value),
            align: 'center'
        },
        {
            key: 'task_type',
            header: 'Type',
            sortable: true,
            render: (value) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    value === 'planned' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                }`}>
                    {value === 'planned' ? 'Planifiée' : 'Non planifiée'}
                </span>
            ),
            align: 'center'
        },
        {
            key: 'due_date',
            header: 'Date d\'échéance',
            sortable: true,
            render: (value, row) => {
                if (!value) return <span className="text-gray-400">-</span>;
                
                const dueDate = new Date(value);
                const isOverdue = row.is_overdue;
                const daysRemaining = row.days_remaining;
                
                return (
                    <div>
                        <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                            {dueDate.toLocaleDateString('fr-FR')}
                        </div>
                        {daysRemaining !== undefined && (
                            <div className={`text-xs ${
                                isOverdue ? 'text-red-500' : 
                                daysRemaining <= 2 ? 'text-orange-500' : 'text-gray-500'
                            }`}>
                                {isOverdue ? 'En retard' : `${daysRemaining} jour(s) restant(s)`}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'created_at',
            header: 'Créée le',
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString('fr-FR')
        }
    ];

    const filters: Filter[] = [
        {
            key: 'status',
            label: 'Statut',
            type: 'select',
            options: [
                { value: 'not_started', label: 'Non commencée' },
                { value: 'in_progress', label: 'En cours' },
                { value: 'completed', label: 'Terminée' },
                { value: 'on_hold', label: 'En attente' },
                { value: 'cancelled', label: 'Annulée' }
            ]
        },
        {
            key: 'priority',
            label: 'Priorité',
            type: 'select',
            options: [
                { value: 'low', label: 'Faible' },
                { value: 'medium', label: 'Moyenne' },
                { value: 'high', label: 'Élevée' },
                { value: 'urgent', label: 'Urgente' }
            ]
        },
        {
            key: 'task_type',
            label: 'Type',
            type: 'select',
            options: [
                { value: 'planned', label: 'Planifiée' },
                { value: 'unplanned', label: 'Non planifiée' }
            ]
        },
        {
            key: 'due_date',
            label: 'Date d\'échéance',
            type: 'date'
        }
    ];

    const actions = [
        {
            label: 'Marquer comme terminée',
            onClick: (task: Task) => handleStatusChange(task, 'completed'),
            show: (task: Task) => task.status !== 'completed',
            className: 'text-green-600 hover:text-green-900'
        },
        {
            label: 'Marquer en cours',
            onClick: (task: Task) => handleStatusChange(task, 'in_progress'),
            show: (task: Task) => task.status === 'not_started',
            className: 'text-blue-600 hover:text-blue-900'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                Gestion des tâches
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gérez et suivez vos tâches quotidiennes
                            </p>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <button
                                onClick={() => router.push('/main/tasks/create')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Nouvelle tâche
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <DataTable
                    data={tasks}
                    columns={columns}
                    keyField="id"
                    loading={loading}
                    searchable={true}
                    sortable={true}
                    pagination={true}
                    pageSize={20}
                    pageSizeOptions={[10, 20, 50, 100]}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onExport={handleExport}
                    filters={filters}
                    actions={actions}
                    emptyMessage="Aucune tâche trouvée"
                    className="shadow-lg"
                    rowClassName={(task) => task.is_overdue ? 'bg-red-50' : ''}
                />
            </div>
        </div>
    );
}