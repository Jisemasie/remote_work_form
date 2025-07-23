import Link from 'next/link';
import { MdEdit, MdDelete } from 'react-icons/md';
import { useState } from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  width?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
}

interface GenericTableProps<T> {
  data: T[];
  columns: Column<T>[];
  editUrl?: string;
  onDelete?: (id: string | number) => void;
  keyField: keyof T;
  stickyHeader?: boolean;
  height?: string;
  className?: string;
  confirmDelete?: boolean;
}

const GenericTable = <T,>({
  data,
  columns,
  editUrl,
  onDelete,
  keyField,
  stickyHeader = true,
  height = 'calc(100vh - 200px)',
  className = '',
  confirmDelete = true,
}: GenericTableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{ 
    key: keyof T; 
    direction: 'asc' | 'desc' 
  } | null>(null);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);

  const showActionsColumn = editUrl || onDelete;

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data];
  if (sortConfig !== null) {
    sortedData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }
      
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortConfig.direction === 'asc' 
          ? (aValue === bValue ? 0 : aValue ? 1 : -1)
          : (aValue === bValue ? 0 : aValue ? -1 : 1);
      }
      
      return 0;
    });
  }

  const handleDeleteClick = (id: string | number) => {
    if (confirmDelete) {
      setDeleteConfirmId(id);
    } else if (onDelete) {
      onDelete(id);
    }
  };

  const confirmDeleteAction = (id: string | number) => {
    if (onDelete) {
      onDelete(id);
    }
    setDeleteConfirmId(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <div 
      className={`relative overflow-auto rounded-lg border border-gray-200 ${className}`} 
      style={{ height }}
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead className={stickyHeader ? 'sticky top-0 bg-gray-50' : 'bg-gray-50'}>
          <tr>
            {showActionsColumn && (
              <th className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 ${stickyHeader ? 'sticky top-0' : ''}`}>
                Actions
              </th>
            )}
            
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 ${stickyHeader ? 'sticky top-0' : ''}`}
                style={column.width ? { width: column.width } : {}}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className={`flex items-center ${column.sortable ? 'cursor-pointer hover:text-gray-700' : ''}`}>
                  {column.header}
                  {column.sortable && (
                    <span className="ml-1">
                      {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      ) : '↕'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sortedData.map((row) => (
            <tr key={row[keyField] as string} className="hover:bg-gray-50">
              {showActionsColumn && (
                <td className="px-3 py-2 whitespace-nowrap flex space-x-2">
                  {editUrl && (
                    <Link
                      href={editUrl.replace('{id}', row[keyField] as string)}
                      className="text-black-500 hover:text-blue-700 inline-block"
                      title="Edit"
                    >
                      <MdEdit />
                    </Link>
                  )}
                  {onDelete && (
                    deleteConfirmId === row[keyField] ? (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => confirmDeleteAction(row[keyField] as string | number)}
                          className="text-red-500 hover:text-red-700"
                          title="Confirm Delete"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={cancelDelete}
                          className="text-gray-500 hover:text-gray-700"
                          title="Cancel"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(row[keyField] as string | number)}
                        className="text-stone-500 hover:text-blue-700 inline-block cursor-pointer"
                        title="Delete"
                      >
                        <MdDelete />
                      </button>
                    )
                  )}
                </td>
              )}
              
              {columns.map((column) => (
                <td key={`${row[keyField] as string}-${column.key as string}`} className="px-3 py-2 whitespace-nowrap text-sm">
                  {column.render 
                    ? column.render(row[column.key], row) 
                    : row[column.key] as React.ReactNode
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GenericTable;