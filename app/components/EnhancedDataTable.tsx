'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
    ChevronUpIcon, 
    ChevronDownIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    FunnelIcon,
    XMarkIcon,
    CheckIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

export interface Column<T> {
    key: keyof T;
    header: string;
    sortable?: boolean;
    searchable?: boolean;
    render?: (value: any, row: T, index: number) => React.ReactNode;
    width?: string;
    className?: string;
    align?: 'left' | 'center' | 'right';
}

export interface Filter {
    key: string;
    label: string;
    type: 'select' | 'date' | 'daterange' | 'text' | 'number';
    options?: Array<{ value: string; label: string }>;
    value?: any;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T;
    title?: string;
    searchable?: boolean;
    sortable?: boolean;
    pagination?: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
    onView?: (row: T) => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    onExport?: (format: 'excel' | 'csv' | 'pdf', filteredData: T[]) => void;
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    rowClassName?: (row: T, index: number) => string;
    onRowClick?: (row: T) => void;
    selectable?: boolean;
    onSelectionChange?: (selectedRows: T[]) => void;
    filters?: Filter[];
    onFilterChange?: (filters: Record<string, any>) => void;
    actions?: Array<{
        label: string;
        icon?: React.ReactNode;
        onClick: (row: T) => void;
        className?: string;
        show?: (row: T) => boolean;
    }>;
    bulkActions?: Array<{
        label: string;
        icon?: React.ReactNode;
        onClick: (selectedRows: T[]) => void;
        className?: string;
    }>;
    refreshData?: () => void;
    showRefresh?: boolean;
}

export default function EnhancedDataTable<T extends Record<string, any>>({
    data,
    columns,
    keyField,
    title,
    searchable = true,
    sortable = true,
    pagination = true,
    pageSize = 10,
    pageSizeOptions = [5, 10, 25, 50, 100],
    onView,
    onEdit,
    onDelete,
    onExport,
    loading = false,
    emptyMessage = "Aucune donnée disponible",
    className = "",
    rowClassName,
    onRowClick,
    selectable = false,
    onSelectionChange,
    filters = [],
    onFilterChange,
    actions = [],
    bulkActions = [],
    refreshData,
    showRefresh = false
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        key: keyof T;
        direction: 'asc' | 'desc';
    } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentPageSize, setCurrentPageSize] = useState(pageSize);
    const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});
    const [isExporting, setIsExporting] = useState(false);

    // Apply filters
    const filteredData = useMemo(() => {
        let result = data;

        // Apply search filter
        if (searchable && searchTerm) {
            result = result.filter(row => {
                return columns.some(column => {
                    if (column.searchable === false) return false;
                    
                    const value = row[column.key];
                    if (value == null) return false;
                    
                    return String(value).toLowerCase().includes(searchTerm.toLowerCase());
                });
            });
        }

        // Apply custom filters
        Object.entries(filterValues).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                const filter = filters.find(f => f.key === key);
                if (filter) {
                    switch (filter.type) {
                        case 'select':
                            if (value !== 'all') {
                                result = result.filter(row => row[key] === value);
                            }
                            break;
                        case 'text':
                            result = result.filter(row => 
                                String(row[key] || '').toLowerCase().includes(String(value).toLowerCase())
                            );
                            break;
                        case 'date':
                            result = result.filter(row => {
                                const rowDate = new Date(row[key]).toDateString();
                                const filterDate = new Date(value).toDateString();
                                return rowDate === filterDate;
                            });
                            break;
                        case 'daterange':
                            if (value.start && value.end) {
                                result = result.filter(row => {
                                    const rowDate = new Date(row[key]);
                                    return rowDate >= new Date(value.start) && rowDate <= new Date(value.end);
                                });
                            }
                            break;
                        case 'number':
                            result = result.filter(row => Number(row[key]) === Number(value));
                            break;
                    }
                }
            }
        });

        return result;
    }, [data, searchTerm, columns, searchable, filterValues, filters]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortable || !sortConfig) return filteredData;

        return [...filteredData].sort((a, b) => {
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

            if (aValue instanceof Date && bValue instanceof Date) {
                return sortConfig.direction === 'asc'
                    ? aValue.getTime() - bValue.getTime()
                    : bValue.getTime() - aValue.getTime();
            }

            return 0;
        });
    }, [filteredData, sortConfig, sortable]);

    // Paginate data
    const paginatedData = useMemo(() => {
        if (!pagination) return sortedData;

        const startIndex = (currentPage - 1) * currentPageSize;
        return sortedData.slice(startIndex, startIndex + currentPageSize);
    }, [sortedData, currentPage, currentPageSize, pagination]);

    const totalPages = Math.ceil(sortedData.length / currentPageSize);

    // Handle sorting
    const handleSort = useCallback((key: keyof T) => {
        if (!sortable) return;

        setSortConfig(current => {
            if (current?.key === key) {
                return current.direction === 'asc'
                    ? { key, direction: 'desc' }
                    : null;
            }
            return { key, direction: 'asc' };
        });
    }, [sortable]);

    // Handle selection
    const handleSelectRow = useCallback((row: T) => {
        if (!selectable) return;

        const rowKey = row[keyField];
        const newSelected = new Set(selectedRows);
        
        if (newSelected.has(rowKey)) {
            newSelected.delete(rowKey);
        } else {
            newSelected.add(rowKey);
        }
        
        setSelectedRows(newSelected);
        
        if (onSelectionChange) {
            const selectedData = data.filter(item => newSelected.has(item[keyField]));
            onSelectionChange(selectedData);
        }
    }, [selectable, selectedRows, keyField, data, onSelectionChange]);

    const handleSelectAll = useCallback(() => {
        if (!selectable) return;

        const allSelected = selectedRows.size === paginatedData.length && paginatedData.length > 0;
        const newSelected = new Set<any>();
        
        if (!allSelected) {
            paginatedData.forEach(row => newSelected.add(row[keyField]));
        }
        
        setSelectedRows(newSelected);
        
        if (onSelectionChange) {
            const selectedData = allSelected ? [] : paginatedData;
            onSelectionChange(selectedData);
        }
    }, [selectable, selectedRows.size, paginatedData, keyField, onSelectionChange]);

    // Handle filter changes
    const handleFilterChange = useCallback((key: string, value: any) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);
        setCurrentPage(1); // Reset to first page when filtering
        
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    }, [filterValues, onFilterChange]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilterValues({});
        setSearchTerm('');
        setCurrentPage(1);
        
        if (onFilterChange) {
            onFilterChange({});
        }
    }, [onFilterChange]);

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    }, [totalPages]);

    // Handle page size change
    const handlePageSizeChange = useCallback((size: number) => {
        setCurrentPageSize(size);
        setCurrentPage(1);
    }, []);

    // Handle export
    const handleExport = useCallback(async (format: 'excel' | 'csv' | 'pdf') => {
        if (!onExport) return;
        
        setIsExporting(true);
        try {
            await onExport(format, sortedData);
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setIsExporting(false);
        }
    }, [onExport, sortedData]);

    // Reset selection when data changes
    useEffect(() => {
        setSelectedRows(new Set());
    }, [data]);

    // Render filters
    const renderFilters = () => {
        if (!showFilters || filters.length === 0) return null;

        return (
            <div className="bg-gray-50 border-b border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filters.map((filter) => (
                        <div key={filter.key} className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">
                                {filter.label}
                            </label>
                            {filter.type === 'select' && (
                                <select
                                    value={filterValues[filter.key] || ''}
                                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                >
                                    <option value="">Tous</option>
                                    {filter.options?.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {filter.type === 'text' && (
                                <input
                                    type="text"
                                    value={filterValues[filter.key] || ''}
                                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder={`Filtrer par ${filter.label.toLowerCase()}`}
                                />
                            )}
                            {filter.type === 'date' && (
                                <input
                                    type="date"
                                    value={filterValues[filter.key] || ''}
                                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                            )}
                            {filter.type === 'number' && (
                                <input
                                    type="number"
                                    value={filterValues[filter.key] || ''}
                                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={clearFilters}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Effacer les filtres
                    </button>
                </div>
            </div>
        );
    };

    // Render table header
    const renderHeader = () => (
        <thead className="bg-gray-50">
            <tr>
                {selectable && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                            type="checkbox"
                            checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    </th>
                )}
                {columns.map((column) => (
                    <th
                        key={String(column.key)}
                        className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                            column.align === 'center' ? 'text-center' : 
                            column.align === 'right' ? 'text-right' : 'text-left'
                        } ${
                            column.sortable !== false && sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                        } ${column.className || ''}`}
                        style={column.width ? { width: column.width } : {}}
                        onClick={() => column.sortable !== false && handleSort(column.key)}
                    >
                        <div className="flex items-center space-x-1">
                            <span>{column.header}</span>
                            {column.sortable !== false && sortable && (
                                <div className="flex flex-col">
                                    <ChevronUpIcon
                                        className={`h-3 w-3 ${
                                            sortConfig?.key === column.key && sortConfig.direction === 'asc'
                                                ? 'text-blue-600'
                                                : 'text-gray-400'
                                        }`}
                                    />
                                    <ChevronDownIcon
                                        className={`h-3 w-3 -mt-1 ${
                                            sortConfig?.key === column.key && sortConfig.direction === 'desc'
                                                ? 'text-blue-600'
                                                : 'text-gray-400'
                                        }`}
                                    />
                                </div>
                            )}
                        </div>
                    </th>
                ))}
                {(onView || onEdit || onDelete || actions.length > 0) && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                    </th>
                )}
            </tr>
        </thead>
    );

    // Render table body
    const renderBody = () => (
        <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
                <tr
                    key={String(row[keyField])}
                    className={`hover:bg-gray-50 transition-colors ${
                        onRowClick ? 'cursor-pointer' : ''
                    } ${rowClassName ? rowClassName(row, index) : ''}`}
                    onClick={() => onRowClick?.(row)}
                >
                    {selectable && (
                        <td className="px-6 py-4 whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={selectedRows.has(row[keyField])}
                                onChange={() => handleSelectRow(row)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </td>
                    )}
                    {columns.map((column) => (
                        <td
                            key={String(column.key)}
                            className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                                column.align === 'center' ? 'text-center' : 
                                column.align === 'right' ? 'text-right' : 'text-left'
                            } ${column.className || ''}`}
                        >
                            {column.render
                                ? column.render(row[column.key], row, index)
                                : String(row[column.key] || '')
                            }
                        </td>
                    ))}
                    {(onView || onEdit || onDelete || actions.length > 0) && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                                {onView && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onView(row);
                                        }}
                                        className="text-blue-600 hover:text-blue-900 transition-colors"
                                        title="Voir"
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                    </button>
                                )}
                                {onEdit && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(row);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                        title="Modifier"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(row);
                                        }}
                                        className="text-red-600 hover:text-red-900 transition-colors"
                                        title="Supprimer"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                )}
                                {actions.map((action, actionIndex) => (
                                    action.show?.(row) !== false && (
                                        <button
                                            key={actionIndex}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                action.onClick(row);
                                            }}
                                            className={action.className || "text-gray-600 hover:text-gray-900 transition-colors"}
                                            title={action.label}
                                        >
                                            {action.icon}
                                        </button>
                                    )
                                ))}
                            </div>
                        </td>
                    )}
                </tr>
            ))}
        </tbody>
    );

    // Render pagination
    const renderPagination = () => {
        if (!pagination || totalPages <= 1) return null;

        const pageNumbers = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Précédent
                    </button>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Suivant
                    </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-700">
                            Affichage de{' '}
                            <span className="font-medium">
                                {(currentPage - 1) * currentPageSize + 1}
                            </span>{' '}
                            à{' '}
                            <span className="font-medium">
                                {Math.min(currentPage * currentPageSize, sortedData.length)}
                            </span>{' '}
                            sur{' '}
                            <span className="font-medium">{sortedData.length}</span>{' '}
                            résultats
                        </p>
                        <select
                            value={currentPageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            className="ml-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>
                                    {size} par page
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeftIcon className="h-5 w-5" />
                            </button>
                            {pageNumbers.map(number => (
                                <button
                                    key={number}
                                    onClick={() => handlePageChange(number)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                                        number === currentPage
                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {number}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRightIcon className="h-5 w-5" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className={`bg-white shadow-lg rounded-lg overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center">
                        {title && (
                            <h3 className="text-lg leading-6 font-semibold text-gray-900">
                                {title}
                            </h3>
                        )}
                        {selectedRows.size > 0 && (
                            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {selectedRows.size} sélectionné(s)
                            </span>
                        )}
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-wrap gap-2">
                        {searchable && (
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                />
                            </div>
                        )}
                        {filters.length > 0 && (
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md transition-colors ${
                                    showFilters 
                                        ? 'text-blue-700 bg-blue-50 border-blue-300' 
                                        : 'text-gray-700 bg-white hover:bg-gray-50'
                                }`}
                            >
                                <FunnelIcon className="h-4 w-4 mr-1" />
                                Filtres
                            </button>
                        )}
                        {showRefresh && refreshData && (
                            <button
                                onClick={refreshData}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Actualiser
                            </button>
                        )}
                        {selectedRows.size > 0 && bulkActions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    const selectedData = data.filter(item => selectedRows.has(item[keyField]));
                                    action.onClick(selectedData);
                                }}
                                className={action.className || "inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"}
                            >
                                {action.icon && <span className="mr-1">{action.icon}</span>}
                                {action.label}
                            </button>
                        ))}
                        {onExport && (
                            <div className="relative">
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleExport(e.target.value as 'excel' | 'csv' | 'pdf');
                                            e.target.value = '';
                                        }
                                    }}
                                    disabled={isExporting}
                                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md transition-colors disabled:opacity-50"
                                    defaultValue=""
                                >
                                    <option value="" disabled>
                                        {isExporting ? 'Export en cours...' : 'Exporter'}
                                    </option>
                                    <option value="excel">Excel</option>
                                    <option value="csv">CSV</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            {renderFilters()}

            {/* Table */}
            <div className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        {renderHeader()}
                        {renderBody()}
                    </table>
                </div>
            </div>

            {/* Empty state */}
            {paginatedData.length === 0 && (
                <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune donnée</h3>
                    <p className="mt-1 text-sm text-gray-500">{emptyMessage}</p>
                </div>
            )}

            {/* Pagination */}
            {renderPagination()}
        </div>
    );
}