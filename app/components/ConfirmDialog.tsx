'use client';

import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    type = 'danger',
    loading = false
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const typeConfig = {
        danger: {
            iconColor: 'text-red-600',
            buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        },
        warning: {
            iconColor: 'text-yellow-600',
            buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        },
        info: {
            iconColor: 'text-blue-600',
            buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        }
    };

    const config = typeConfig[type];

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10`}>
                                <ExclamationTriangleIcon className={`h-6 w-6 ${config.iconColor}`} />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {title}
                                </h3>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                    
                    <div className="mb-6">
                        <p className="text-sm text-gray-500">
                            {message}
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 ${config.buttonColor}`}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Traitement...
                                </div>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}