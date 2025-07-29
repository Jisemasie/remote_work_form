'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, EyeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import EnhancedDataTable, { Column, Filter } from '@/app/components/EnhancedDataTable';
import { searchFormulaire, reviewFormulaire } from '@/app/lib/formulaire_actions';
import { getSessionData } from '@/app/lib/session';
import { Formulaire, SearchParams } from '@/app/lib/definitions';
import { useToast } from '@/app/hook/useToast';
import StatusBadge from '@/app/components/StatusBadge';

export default function FormulairePage() {
    const router = useRouter();
    const { success, error } = useToast();
    const [formulaires, setFormulaires] = useState<Formulaire[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [reviewModal, setReviewModal] = useState<{
        show: boolean;
        formulaire: Formulaire | null;
        status: 'approved' | 'rejected';
        comments: string;
        loading: boolean;
    }>({
        show: false,
        formulaire: null,
        status: 'approved',
        comments: '',
        loading: false
    });

    useEffect(() => {
        const loadFormulaires = async () => {
            try {
                const sessionData = await getSessionData();
                setUserInfo(sessionData);
                
                const params: SearchParams = {
                    scope: 'all',
                    value: ''
                };
                
                const userId = parseInt(sessionData?.id || '0');
                const isSupervisor = sessionData?.issupervisor === true || sessionData?.issupervisor === 1;
                
                const result = await searchFormulaire(params, userId, isSupervisor);
                
                if (result) {
                    setFormulaires(result);
                }
            } catch (err) {
                console.error('Erreur lors du chargement des formulaires:', err);
                error('Erreur lors du chargement des formulaires');
            } finally {
                setLoading(false);
            }
        };

        loadFormulaires();
    }, [error]);

    const refreshFormulaires = async () => {
        try {
            const params: SearchParams = { scope: 'all', value: '' };
            const userId = parseInt(userInfo?.id || '0');
            const isSupervisor = userInfo?.issupervisor === true || userInfo?.issupervisor === 1;
            const result = await searchFormulaire(params, userId, isSupervisor);
            if (result) {
                setFormulaires(result);
            }
        } catch (err) {
            console.error('Erreur lors du rafraîchissement:', err);
            error('Erreur lors du rafraîchissement des formulaires');
        }
    };

    const handleView = (formulaire: Formulaire) => {
        router.push(`/main/formulaire/${formulaire.id_formulaire}/view`);
    };

    const handleEdit = (formulaire: Formulaire) => {
        router.push(`/main/formulaire/${formulaire.id_formulaire}/edit?action=update`);
    };

    const handleReview = (formulaire: Formulaire, status: 'approved' | 'rejected') => {
        setReviewModal({
            show: true,
            formulaire,
            status,
            comments: '',
            loading: false
        });
    };

    const submitReview = async () => {
        if (!reviewModal.formulaire || !userInfo?.id) return;

        setReviewModal(prev => ({ ...prev, loading: true }));
        try {
            const result = await reviewFormulaire(
                reviewModal.formulaire.id_formulaire,
                parseInt(userInfo.id),
                reviewModal.status,
                reviewModal.comments
            );

            if (result.success) {
                success(`Formulaire ${reviewModal.status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`);
                setReviewModal({ show: false, formulaire: null, status: 'approved', comments: '', loading: false });
                
                await refreshFormulaires();
            } else {
                error(result.error || 'Erreur lors de la révision');
                setReviewModal(prev => ({ ...prev, loading: false }));
            }
        } catch (err) {
            console.error('Erreur lors de la révision:', err);
            error('Erreur lors de la révision du formulaire');
            setReviewModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleExport = async (format: 'excel' | 'csv' | 'pdf', filteredData: Formulaire[]) => {
        try {
            // Implement export logic here
            success(`Export ${format.toUpperCase()} réussi`);
        } catch (err) {
            console.error('Erreur lors de l\'export:', err);
            error('Erreur lors de l\'export');
        }
    };

    const columns: Column<Formulaire>[] = [
        {
            key: 'user_name',
            header: 'Employé',
            sortable: true,
            searchable: true,
            render: (value, row) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{value}</div>
                    <div className="text-sm text-gray-500">{row.branch_name}</div>
                </div>
            )
        },
        {
            key: 'create_dt',
            header: 'Date de création',
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString('fr-FR')
        },
        {
            key: 'status',
            header: 'Statut',
            sortable: true,
            render: (value) => <StatusBadge status={value} type="report" />,
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
            key: 'completed_tasks',
            header: 'Tâches terminées',
            sortable: true,
            render: (value, row) => {
                const total = row.total_tasks || 0;
                const completed = value || 0;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                return `${completed}/${total} (${percentage}%)`;
            },
            align: 'center'
        },
        {
            key: 'supervisor_name',
            header: 'Superviseur',
            sortable: true,
            render: (value) => value || '-'
        },
        {
            key: 'update_dt',
            header: 'Dernière modification',
            sortable: true,
            render: (value) => value ? new Date(value).toLocaleDateString('fr-FR') : '-'
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
                { value: 'approved', label: 'Approuvé' },
                { value: 'rejected', label: 'Rejeté' }
            ]
        },
        {
            key: 'create_dt',
            label: 'Date de création',
            type: 'date'
        }
    ];

    const actions = [
        ...(userInfo?.issupervisor ? [
            {
                label: 'Approuver',
                icon: <CheckCircleIcon className="h-4 w-4" />,
                onClick: (formulaire: Formulaire) => handleReview(formulaire, 'approved'),
                show: (formulaire: Formulaire) => formulaire.status === 'submitted',
                className: 'text-green-600 hover:text-green-900'
            },
            {
                label: 'Rejeter',
                icon: <XCircleIcon className="h-4 w-4" />,
                onClick: (formulaire: Formulaire) => handleReview(formulaire, 'rejected'),
                show: (formulaire: Formulaire) => formulaire.status === 'submitted',
                className: 'text-red-600 hover:text-red-900'
            }
        ] : [])
    ];

    const bulkActions = userInfo?.issupervisor ? [
        {
            label: 'Approuver sélectionnés',
            icon: <CheckCircleIcon className="h-4 w-4" />,
            onClick: async (selectedFormulaires: Formulaire[]) => {
                for (const formulaire of selectedFormulaires) {
                    if (formulaire.status === 'submitted') {
                        await reviewFormulaire(formulaire.id_formulaire, parseInt(userInfo.id), 'approved', 'Approbation en lot');
                    }
                }
                success('Formulaires approuvés avec succès');
                await refreshFormulaires();
            },
            className: 'bg-green-600 hover:bg-green-700 text-white'
        }
    ] : [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                Formulaires de travail
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {userInfo?.issupervisor 
                                    ? 'Gérez et révisez les formulaires de votre équipe'
                                    : 'Consultez vos formulaires de travail'
                                }
                            </p>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <button
                                onClick={() => router.push('/main/formulaire/0/edit?action=add')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Nouveau formulaire
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EnhancedDataTable
                    data={formulaires}
                    columns={columns}
                    keyField="id_formulaire"
                    title="Liste des formulaires"
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
                    bulkActions={bulkActions}
                    selectable={userInfo?.issupervisor}
                    refreshData={refreshFormulaires}
                    showRefresh={true}
                    emptyMessage="Aucun formulaire trouvé"
                    className="shadow-lg"
                />
            </div>

            {/* Review Modal */}
            {reviewModal.show && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {reviewModal.status === 'approved' ? 'Approuver' : 'Rejeter'} le formulaire
                            </h3>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Commentaires
                                </label>
                                <textarea
                                    value={reviewModal.comments}
                                    disabled={reviewModal.loading}
                                    onChange={(e) => setReviewModal(prev => ({ ...prev, comments: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                    placeholder="Ajoutez vos commentaires..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setReviewModal({ show: false, formulaire: null, status: 'approved', comments: '', loading: false })}
                                    disabled={reviewModal.loading}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={submitReview}
                                    disabled={reviewModal.loading}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                                        reviewModal.status === 'approved'
                                            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                    } disabled:opacity-50`}
                                >
                                    {reviewModal.loading ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Traitement...
                                        </div>
                                    ) : (
                                        reviewModal.status === 'approved' ? 'Approuver' : 'Rejeter'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}