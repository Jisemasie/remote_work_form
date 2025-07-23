// app/dashboard/users/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FaFileExport } from "react-icons/fa";
import { TiUserAddOutline } from "react-icons/ti";
import { searchUser } from '@/app/lib/user_actions';
import { SearchParams, User } from '@/app/lib/definitions';
import Spinner from '@/app/ui/spinner';
import GenericTable from '@/app/ui/table';
import { checkSession } from '@/app/lib/utils';
import { Pagination } from '@/app/ui/pagination';

export default function UsersPage() {

  const router = useRouter();
  const pathname = usePathname();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [router]);

  const handleAddUser = () => {
    router.push(`/main/users/0/edit?action=add`);
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-1">
      <div className="container mx-auto px-1 py-1">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-end gap-2 mb-4">
            <button className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm">
              <FaFileExport size={14} />
              <span>Exporter</span>
            </button>
            <button 
              onClick={handleAddUser}
              className="cursor-pointer bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm"
            >
              <TiUserAddOutline size={16} />
              <span>Ajouter</span>
            </button>
          </div>


          <Pagination
            data={users}
            initialItemsPerPage={20}
            initialPage={1}
            itemsPerPageOptions={[10, 20, 50, 100]}
            render={(paginatedUsers) => (
              <GenericTable<User>
                data={paginatedUsers}
                editUrl="/main/users/{id}/edit?action=update"
                onDelete={(id) => console.log('Delete', id)}
                keyField="id"
                columns={[
                  { key: 'id', header: 'ID', sortable: true },
                  { key: 'username', header: 'Identifiant', sortable: true },
                  { key: 'fullname', header: 'Nom', sortable: true },
                  { key: 'user_group', header: 'Groupe', sortable: true },
                  { key: 'phone', header: 'Téléphone', sortable: true },
                  { key: 'branch', header: 'Branche', sortable: true },
                  { 
                    key: 'status', 
                    header: 'Etat',
                    render: (value) => (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {value == 'A' ? 'Actif' : 'Inactif'}
                      </span>
                    )
                  }
                ]}
              />
            )}
            textDisplay={(start, end, total) => `Affichage ${start} à ${end} sur ${total}`}
            previousText="Précédent"
            nextText="Suivant"
            itemsPerPageLabel="Utilisateurs par page:"
          />

        </div>
      </div>
    </main>
  );
}