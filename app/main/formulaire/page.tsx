// app/main/requisition/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaFileExport } from "react-icons/fa";
import { MdAssignmentAdd } from "react-icons/md";
import { SearchParams } from '@/app/lib/definitions';
import Spinner from '@/app/ui/spinner';
import GenericTable from '@/app/ui/table';
import { Pagination } from '@/app/ui/pagination';
import { RequisitionSchema } from '@/app/schemas/formulaire';
import { z } from 'zod';

type Requisition = z.infer<typeof RequisitionSchema>;

export default function UsersPage() {

  const router = useRouter();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(false);


  useEffect(() => {

    const loadRequisitions = async () => {
      try {
        const i_params: SearchParams = {
          scope: "all",
          value: ""
        };
        const result = await searchRequisition(i_params);
        if (result != null && result?.length > 0) {
          setRequisitions(result);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRequisitions();
  }, [router]);

  const handleAddRequisition = () => {
    router.push(`/main/formulaire/0/edit?action=add`);
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
              onClick={handleAddRequisition}
              className="cursor-pointer bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm"
            >
              <MdAssignmentAdd size={16} />
              <span>Ajouter</span>
            </button>
          </div>

          <Pagination
            data={requisitions}
            initialItemsPerPage={20}
            initialPage={1}
            itemsPerPageOptions={[10, 20, 50, 100]}
            render={(paginatedUsers) => (
              <GenericTable<Requisition>
                data={paginatedUsers}
                editUrl="/main/partners/{id}/edit?action=update"
                onDelete={(id) => console.log('Delete', id)}
                keyField="id"
                columns={[
                  { key: 'id', header: 'ID', sortable: true },
                  { key: 'branch', header: 'Branche', sortable: true },
                  { key: 'request_no', header: 'Numero', sortable: true },
                  { key: 'requested_by', header: 'Demandeur', sortable: true },
                  { key: 'request_dt', header: 'Date demande', sortable: true },
                  { key: 'status', header: 'Etat', sortable: true }
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