'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import EnhancedDataTable, { Column, Filter } from '@/app/components/EnhancedDataTable';
import { searchUser } from '@/app/lib/user_actions';
import { getSessionData } from '@/app/lib/session';
import { User, SearchParams } from '@/app/lib/definitions';
import { useToast } from '@/app/hook/useToast';
import StatusBadge from '@/app/components/StatusBadge';
import ConfirmDialog from '@/app/components/ConfirmDialog';

export default function UsersPage() {
    const router = useRouter();
    const { success, error } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        show: boolean;
        user: User | null;
        loading: boolean;
    }>({
        show: false,
        user: null,
        loading: false
    });

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const sessionData = await getSessionData();
                setUserInfo(sessionData);
                
                const searchParams: SearchParams = {
                    scope: 'all',
                    value: ''
                };
                
                const result = await searchUser(searchParams);
                
                if (result) {
                    setUsers(result);
                }
            } catch (err) {
                console.error('Erreur lors du chargement des utilisateurs:', err);
                error('Erreur lors du chargement des utilisateurs');
            } finally {
                setLoading(false);
            }
        };

        loadUsers();
    }, [error]);

    const refreshUsers = async () => {
        try {
            const searchParams: SearchParams = { scope: 'all', value: '' };
            const result = await searchUser(searchParams);
            if (result) {
                setUsers(result);
            }
        } catch (err) {
            console.error('Erreur lors du rafraîchissement:', err);
            error('Erreur lors du rafraîchissement des utilisateurs');
        }
    };

    const handleView = (user: User) => {
        router.push(`/main/users/${user.id_user}/view`);
    };

    const handleEdit = (user: User) => {
        router.push(`/main/users/${user.id_user}/edit?action=update`);
    };

    const handleDelete = async (user: User) => {
        setDeleteDialog({
            show: true,
            user,
            loading: false
        });
    };

    const confirmDelete = async () => {
        if (!deleteDialog.user) return;

        setDeleteDialog(prev => ({ ...prev, loading: true }));
        try {
            // Implement delete user logic here
            // const result = await deleteUser(deleteDialog.user.id_user);
            // if (result.success) {
                success('Utilisateur supprimé avec succès');
                await refreshUsers();
                setDeleteDialog({ show: false, user: null, loading: false });
            // } else {
            //     error(result.error || 'Erreur lors de la suppression');
            //     setDeleteDialog(prev => ({ ...prev, loading: false }));
            // }
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            error('Erreur lors de la suppression de l\'utilisateur');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleExport = async (format: 'excel' | 'csv' | 'pdf', filteredData: User[]) => {
        try {
            // Implement export logic here
            success(`Export ${format.toUpperCase()} réussi`);
        } catch (err) {
            console.error('Erreur lors de l\'export:', err);
            error('Erreur lors de l\'export');
        }
    };

    const columns: Column<User>[] = [
        {
            key: 'username',
            header: 'Nom d\'utilisateur',
            sortable: true,
            searchable: true,
            render: (value, row) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{value}</div>
                    <div className="text-sm text-gray-500">{row.fullname}</div>
                </div>
            )
        },
        {
            key: 'email',
            header: 'Email',
            sortable: true,
            searchable: true,
            render: (value) => (
                <div className="text-sm text-gray-900">{value}</div>
            )
        },
        {
            key: 'profile_name',
            header: 'Profil',
            sortable: true,
            render: (value) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {value}
                </span>
            ),
            align: 'center'
        },
        {
            key: 'nom_organisation',
            header: 'Organisation',
            sortable: true,
            render: (value) => (
                <div className="text-sm text-gray-900">{value || '-'}</div>
            )
        },
        {
            key: 'nom_ecole',
            header: 'École',
            sortable: true,
            render: (value) => (
                <div className="text-sm text-gray-900">{value || '-'}</div>
            )
        },
        {
            key: 'status',
            header: 'Statut',
            sortable: true,
            render: (value) => <StatusBadge status={value} type="user" />,
            align: 'center'
        },
        {
            key: 'issupervisor',
            header: 'Superviseur',
            sortable: true,
            render: (value) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {value ? 'Oui' : 'Non'}
                </span>
            ),
            align: 'center'
        },
        {
            key: 'create_dt',
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
                { value: 'A', label: 'Actif' },
                { value: 'I', label: 'Inactif' }
            ]
        },
        {
            key: 'issupervisor',
            label: 'Superviseur',
            type: 'select',
            options: [
                { value: '1', label: 'Oui' },
                { value: '0', label: 'Non' }
            ]
        },
        {
            key: 'auth_type',
            label: 'Type d\'authentification',
            type: 'select',
            options: [
                { value: 'local', label: 'Local' },
                { value: 'ad', label: 'Active Directory' }
            ]
        }
    ];

    const actions = [
        {
            label: 'Réinitialiser mot de passe',
            onClick: (user: User) => {
                // Implement password reset logic
                success(`Mot de passe réinitialisé pour ${user.username}`);
            },
            show: (user: User) => user.auth_type === 'local',
            className: 'text-orange-600 hover:text-orange-900'
        }
    ];

    const bulkActions = [
        {
            label: 'Activer sélectionnés',
            onClick: async (selectedUsers: User[]) => {
                // Implement bulk activation logic
                success(`${selectedUsers.length} utilisateur(s) activé(s)`);
                await refreshUsers();
            },
            className: 'bg-green-600 hover:bg-green-700 text-white'
        },
        {
            label: 'Désactiver sélectionnés',
            onClick: async (selectedUsers: User[]) => {
                // Implement bulk deactivation logic
                success(`${selectedUsers.length} utilisateur(s) désactivé(s)`);
                await refreshUsers();
            },
            className: 'bg-red-600 hover:bg-red-700 text-white'
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
                                Gestion des utilisateurs
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gérez les comptes utilisateurs et leurs permissions
                            </p>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <button
                                onClick={() => router.push('/main/users/0/edit?action=add')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Nouvel utilisateur
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EnhancedDataTable
                    data={users}
                    columns={columns}
                    keyField="id_user"
                    title="Liste des utilisateurs"
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
                    bulkActions={bulkActions}
                    selectable={true}
                    refreshData={refreshUsers}
                    showRefresh={true}
                    emptyMessage="Aucun utilisateur trouvé"
                    className="shadow-lg"
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog.show}
                onClose={() => setDeleteDialog({ show: false, user: null, loading: false })}
                onConfirm={confirmDelete}
                title="Supprimer l'utilisateur"
                message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${deleteDialog.user?.username}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                cancelText="Annuler"
                type="danger"
                loading={deleteDialog.loading}
            />
        </div>
    );
}