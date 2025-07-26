// app/dashboard/users/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FaFileExport } from "react-icons/fa";
import { TiUserAddOutline } from "react-icons/ti";
import { searchUser, unlockUserAccount } from '@/app/lib/user_actions';
import { SearchParams, User } from '@/app/lib/definitions';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import EnhancedDataTable, { Column, Filter } from '@/app/components/EnhancedDataTable';
import { checkSession } from '@/app/lib/utils';
import StatusBadge from '@/app/components/StatusBadge';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { useToast } from '@/app/hook/useToast';
import { getSessionData } from '@/app/lib/session';
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';

export default function UsersPage() {

  const router = useRouter();
  const pathname = usePathname();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { success, error } = useToast();
  const [unlockDialog, setUnlockDialog] = useState<{
    show: boolean;
    user: User | null;
    loading: boolean;
  }>({
    show: false,
    user: null,
    loading: false
  });

  //check session
  useEffect(() => {

    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${pathname}`;
      checkSession(`/login?callbackUrl=${fullUrl}`);
    }

  }, [pathname]);

  useEffect(() => {

    const loadUsers = async () => {
      try {
        const sessionData = await getSessionData();
        setCurrentUser(sessionData);
        
        const i_params: SearchParams = {
          scope: "all",
          value: ""
        };
        const result = await searchUser(i_params);
        if (result != null && result?.length > 0) {
          setUsers(result);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        error('Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [router, error]);

  const refreshUsers = async () => {
    try {
      const i_params: SearchParams = {
        scope: "all",
        value: ""
      };
      const result = await searchUser(i_params);
      if (result != null && result?.length > 0) {
        setUsers(result);
      }
    } catch (err) {
      console.error('Erreur lors du rafraîchissement:', err);
      error('Erreur lors du rafraîchissement des utilisateurs');
    }
  };
  const handleAddUser = () => {
    router.push(`/main/users/0/edit?action=add`);
  };

  const handleView = (user: User) => {
    router.push(`/main/users/${user.id}/view`);
  };

  const handleEdit = (user: User) => {
    router.push(`/main/users/${user.id}/edit?action=update`);
  };

  const handleUnlockUser = (user: User) => {
    setUnlockDialog({
      show: true,
      user,
      loading: false
    });
  };

  const confirmUnlock = async () => {
    if (!unlockDialog.user || !currentUser?.id) return;

    setUnlockDialog(prev => ({ ...prev, loading: true }));

    try {
      await unlockUserAccount(unlockDialog.user.username, parseInt(currentUser.id));
      success('Compte déverrouillé avec succès');
      await refreshUsers();
      setUnlockDialog({ show: false, user: null, loading: false });
    } catch (err) {
      console.error('Erreur lors du déverrouillage:', err);
      error('Erreur lors du déverrouillage du compte');
      setUnlockDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleExport = async (format: 'excel' | 'csv' | 'pdf', filteredData: User[]) => {
    try {
      // Implement export functionality here
      success(`Export ${format.toUpperCase()} en cours...`);
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      error('Erreur lors de l\'export');
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement des utilisateurs..." />
      </div>
    );
  }

  const columns: Column<User>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      width: '80px'
    },
    {
      key: 'username',
      header: 'Identifiant',
      sortable: true,
      searchable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.registration_number}</div>
        </div>
      )
    },
    {
      key: 'fullname',
      header: 'Nom complet',
      sortable: true,
      searchable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.position}</div>
        </div>
      )
    },
    {
      key: 'user_group',
      header: 'Groupe',
      sortable: true,
      searchable: true
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      searchable: true,
      render: (value) => (
        <div className="text-sm text-gray-900">{value || '-'}</div>
      )
    },
    {
      key: 'phone',
      header: 'Téléphone',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-900">{value || '-'}</div>
      )
    },
    {
      key: 'branch',
      header: 'Branche',
      sortable: true,
      searchable: true
    },
    {
      key: 'status',
      header: 'Statut',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col space-y-1">
          <StatusBadge status={value} type="user" />
          {row.locked === 1 && (
            <StatusBadge status="locked" type="user" />
          )}
        </div>
      ),
      align: 'center'
    },
    {
      key: 'issupervisor',
      header: 'Superviseur',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value === 1 ? 'Oui' : 'Non'}
        </span>
      ),
      align: 'center'
    },
    {
      key: 'create_dt',
      header: 'Créé le',
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
        { value: 'A', label: 'Actif' },
        { value: 'I', label: 'Inactif' }
      ]
    },
    {
      key: 'user_group',
      label: 'Groupe',
      type: 'text'
    },
    {
      key: 'branch',
      label: 'Branche',
      type: 'text'
    },
    {
      key: 'issupervisor',
      label: 'Superviseur',
      type: 'select',
      options: [
        { value: '1', label: 'Oui' },
        { value: '0', label: 'Non' }
      ]
    }
  ];

  const actions = [
    {
      label: 'Déverrouiller',
      icon: <LockOpenIcon className="h-4 w-4" />,
      onClick: (user: User) => handleUnlockUser(user),
      show: (user: User) => user.locked === 1,
      className: 'text-orange-600 hover:text-orange-900'
    }
  ];

  const bulkActions = [
    {
      label: 'Activer sélectionnés',
      onClick: async (selectedUsers: User[]) => {
        // Implement bulk activation
        success('Utilisateurs activés avec succès');
        await refreshUsers();
      },
      className: 'bg-green-600 hover:bg-green-700 text-white'
    },
    {
      label: 'Désactiver sélectionnés',
      onClick: async (selectedUsers: User[]) => {
        // Implement bulk deactivation
        success('Utilisateurs désactivés avec succès');
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
                onClick={handleAddUser}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <TiUserAddOutline className="h-4 w-4 mr-2" />
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
          keyField="id"
          title="Liste des utilisateurs"
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
          selectable={true}
          refreshData={refreshUsers}
          showRefresh={true}
          emptyMessage="Aucun utilisateur trouvé"
          className="shadow-lg"
          rowClassName={(user) => user.locked === 1 ? 'bg-orange-50' : ''}
        />
      </div>

      {/* Unlock Confirmation Dialog */}
      <ConfirmDialog
        isOpen={unlockDialog.show}
        onClose={() => setUnlockDialog({ show: false, user: null, loading: false })}
        onConfirm={confirmUnlock}
        title="Déverrouiller le compte"
        message={`Êtes-vous sûr de vouloir déverrouiller le compte de "${unlockDialog.user?.fullname}" ?`}
        confirmText="Déverrouiller"
        cancelText="Annuler"
        type="warning"
        loading={unlockDialog.loading}
      />
    </div>
  );
}

      </div>
    </main>
  );
}