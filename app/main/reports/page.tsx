'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusIcon, EyeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import DataTable, { Column, Filter } from '@/app/components/DataTable';
import { searchDailyReports, reviewDailyReport } from '@/app/lib/task_actions';
import { exportReportsToExcel, exportToCSV, exportToPDF } from '@/app/lib/export_utils';
import { getSessionData } from '@/app/lib/session';
import { DailyReport, SearchParams } from '@/app/lib/definitions';
import { useToast } from '@/app/hook/useToast';

export default function ReportsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { success, error } = useToast();
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [reviewModal, setReviewModal] = useState<{
        show: boolean;
        report: DailyReport | null;
        status: 'approved' | 'rejected';
        comments: string;
        rating: number;
    }>({
        show: false,
        report: null,
        status: 'approved',
        comments: '',
        rating: 5
    });

    useEffect(() => {
        const loadReports = async () => {
            try {
                const sessionData = await getSessionData();
                setUserInfo(sessionData);
                
                const params: SearchParams = {
                    scope: 'all',
                    value: ''
                };
                
                // Apply URL filters
                const statusFilter = searchParams.get('status');
                if (statusFilter) {
                    params.scope = 'status';
                    params.value = statusFilter;
                }
                
                const userId = parseInt(sessionData?.id || '0');
                const isSupervisor = sessionData?.issupervisor === true || sessionData?.issupervisor === 1;
                
                const result = await searchDailyReports(params, userId, isSupervisor);
                
                if (result) {
                    setReports(result);
                }
            } catch (err) {
                console.error('Erreur lors du chargement des rapports:', err);
                error('Erreur lors du chargement des rapports');
            } finally {
                setLoading(false);
            }
        };

        loadReports();
    }, [error, searchParams]);

    const handleView = (report: DailyReport) => {
        router.push(`/main/reports/${report.id}/view`);
    };

    const handleEdit = (report: DailyReport) => {
        router.push(`/main/reports/${report.id}/edit`);
    };

    const handleReview = (report: DailyReport, status: 'approved' | 'rejected') => {
        setReviewModal({
            show: true,
            report,
            status,
            comments: '',
            rating: 5
        });
    };

    const submitReview = async () => {
        if (!reviewModal.report || !userInfo?.id) return;

        try {
            const result = await reviewDailyReport(
                reviewModal.report.id,
                parseInt(userInfo.id),
                reviewModal.status,
                reviewModal.comments,
                reviewModal.rating
            );

            if (result.success) {
                success(`Rapport ${reviewModal.status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`);
                setReviewModal({ show: false, report: null, status: 'approved', comments: '', rating: 5 });
                
                // Reload reports
                const params: SearchParams = { scope: 'all', value: '' };
                const userId = parseInt(userInfo.id);
                const isSupervisor = userInfo?.issupervisor === true || userInfo?.issupervisor === 1;
                const updatedReports = await searchDailyReports(params, userId, isSupervisor);
                if (updatedReports) {
                    setReports(updatedReports);
                }
            } else {
                error(result.error || 'Erreur lors de la révision');
            }
        } catch (err) {
            console.error('Erreur lors de la révision:', err);
            error('Erreur lors de la révision du rapport');
        }
    };

    const handleExport = async (format: 'excel' | 'csv' | 'pdf', filteredData: DailyReport[]) => {
        try {
            if (format === 'excel') {
                const buffer = await exportReportsToExcel(
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
                    a.download = `rapports_${new Date().toISOString().split('T')[0]}.xlsx`;
                    a.click();
                    URL.revokeObjectURL(url);
                    success('Export Excel réussi');
                }
            } else if (format === 'csv') {
                const csvContent = await exportToCSV(filteredData, 'reports');
                if (csvContent) {
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `rapports_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    success('Export CSV réussi');
                }
            } else if (format === 'pdf') {
                const columns = [
                    { header: 'Employé', dataKey: 'employee_name' },
                    { header: 'Date', dataKey: 'report_date' },
                    { header: 'Statut', dataKey: 'status' },
                    { header: 'Branche', dataKey: 'branch' },
                    { header: 'Note', dataKey: 'supervisor_rating' }
                ];
                const buffer = await exportToPDF(filteredData, 'Liste des Rapports', columns);
                if (buffer) {
                    const blob = new Blob([buffer], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `rapports_${new Date().toISOString().split('T')[0]}.pdf`;
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
            'draft': { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
            'submitted': { label: 'Soumis', color: 'bg-blue-100 text-blue-800' },
            'reviewed': { label: 'En révision', color: 'bg-yellow-100 text-yellow-800' },
            'approved': { label: 'Approuvé', color: 'bg-green-100 text-green-800' },
            'rejected': { label: 'Rejeté', color: 'bg-red-100 text-red-800' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const getRatingStars = (rating: number | null) => {
        if (!rating) return <span className="text-gray-400">-</span>;
        
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
                <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
            </div>
        );
    };

    const columns: Column<DailyReport>[] = [
        {
            key: 'employee_name',
            header: 'Employé',
            sortable: true,
            searchable: true,
            render: (value, row) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{value}</div>
                    <div className="text-sm text-gray-500">{row.branch}</div>
                </div>
            )
        },
        {
            key: 'report_date',
            header: 'Date du rapport',
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString('fr-FR')
        },
        {
            key: 'status',
            header: 'Statut',
            sortable: true,
            render: (value) => getStatusBadge(value),
            align: 'center'
        },
        {
            key: 'total_tasks',
            header: 'Nb. tâches',
            sortable: true,
            render: (value) => value || 0,
            align: 'center'
        },
        {
            key: 'avg_completion',
            header: 'Completion moy.',
            sortable: true,
            render: (value) => value ? `${Math.round(value)}%` : '-',
            align: 'center'
        },
        {
            key: 'supervisor_rating',
            header: 'Note superviseur',
            sortable: true,
            render: (value) => getRatingStars(value),
            align: 'center'
        },
        {
            key: 'created_at',
            header: 'Créé le',
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
                { value: 'draft', label: 'Brouillon' },
                { value: 'submitted', label: 'Soumis' },
                { value: 'reviewed', label: 'En révision' },
                { value: 'approved', label: 'Approuvé' },
                { value: 'rejected', label: 'Rejeté' }
            ]
        },
        {
            key: 'branch',
            label: 'Branche',
            type: 'text'
        },
        {
            key: 'report_date',
            label: 'Date du rapport',
            type: 'date'
        }
    ];

    const actions = [
        ...(userInfo?.issupervisor ? [
            {
                label: 'Approuver',
                icon: <CheckCircleIcon className="h-4 w-4" />,
                onClick: (report: DailyReport) => handleReview(report, 'approved'),
                show: (report: DailyReport) => report.status === 'submitted',
                className: 'text-green-600 hover:text-green-900'
            },
            {
                label: 'Rejeter',
                icon: <XCircleIcon className="h-4 w-4" />,
                onClick: (report: DailyReport) => handleReview(report, 'rejected'),
                show: (report: DailyReport) => report.status === 'submitted',
                className: 'text-red-600 hover:text-red-900'
            }
        ] : [])
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                Rapports quotidiens
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {userInfo?.issupervisor 
                                    ? 'Gérez et révisez les rapports de votre équipe'
                                    : 'Consultez vos rapports quotidiens'
                                }
                            </p>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <button
                                onClick={() => router.push('/main/formulaire/0/edit?action=add')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Nouveau rapport
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <DataTable
                    data={reports}
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
                    onExport={handleExport}
                    filters={filters}
                    actions={actions}
                    emptyMessage="Aucun rapport trouvé"
                    className="shadow-lg"
                />
            </div>

            {/* Review Modal */}
            {reviewModal.show && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {reviewModal.status === 'approved' ? 'Approuver' : 'Rejeter'} le rapport
                            </h3>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Note (1-5 étoiles)
                                </label>
                                <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setReviewModal(prev => ({ ...prev, rating: star }))}
                                            className={`h-6 w-6 ${
                                                star <= reviewModal.rating ? 'text-yellow-400' : 'text-gray-300'
                                            } hover:text-yellow-400 transition-colors`}
                                        >
                                            <svg fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Commentaires
                                </label>
                                <textarea
                                    value={reviewModal.comments}
                                    onChange={(e) => setReviewModal(prev => ({ ...prev, comments: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ajoutez vos commentaires..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setReviewModal({ show: false, report: null, status: 'approved', comments: '', rating: 5 })}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={submitReview}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                                        reviewModal.status === 'approved'
                                            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                    }`}
                                >
                                    {reviewModal.status === 'approved' ? 'Approuver' : 'Rejeter'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}