'use client';

import React from 'react';

interface StatusBadgeProps {
    status: string;
    type?: 'task' | 'report' | 'user' | 'priority';
    className?: string;
}

export default function StatusBadge({ status, type = 'task', className = '' }: StatusBadgeProps) {
    const getStatusConfig = () => {
        switch (type) {
            case 'task':
                return {
                    'not_started': { label: 'Non commencée', color: 'bg-gray-100 text-gray-800' },
                    'in_progress': { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
                    'completed': { label: 'Terminée', color: 'bg-green-100 text-green-800' },
                    'on_hold': { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
                    'cancelled': { label: 'Annulée', color: 'bg-red-100 text-red-800' }
                };
            case 'report':
                return {
                    'draft': { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
                    'submitted': { label: 'Soumis', color: 'bg-blue-100 text-blue-800' },
                    'under_review': { label: 'En révision', color: 'bg-yellow-100 text-yellow-800' },
                    'approved': { label: 'Approuvé', color: 'bg-green-100 text-green-800' },
                    'rejected': { label: 'Rejeté', color: 'bg-red-100 text-red-800' }
                };
            case 'user':
                return {
                    'A': { label: 'Actif', color: 'bg-green-100 text-green-800' },
                    'I': { label: 'Inactif', color: 'bg-red-100 text-red-800' },
                    'locked': { label: 'Verrouillé', color: 'bg-orange-100 text-orange-800' },
                    'pending': { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' }
                };
            case 'priority':
                return {
                    'low': { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
                    'medium': { label: 'Moyenne', color: 'bg-blue-100 text-blue-800' },
                    'high': { label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
                    'urgent': { label: 'Urgente', color: 'bg-red-100 text-red-800' }
                };
            default:
                return {};
        }
    };

    const statusConfig = getStatusConfig();
    const config = statusConfig[status as keyof typeof statusConfig] || { 
        label: status, 
        color: 'bg-gray-100 text-gray-800' 
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className}`}>
            {config.label}
        </span>
    );
}