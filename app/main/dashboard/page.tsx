'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChartBarIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    UserGroupIcon,
    DocumentTextIcon,
    TrendingUpIcon,
    CalendarDaysIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { getDashboardStats } from '@/app/lib/formulaire_actions';
import { getSessionData } from '@/app/lib/session';
import { DashboardStats } from '@/app/lib/definitions';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface StatCard {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    onClick?: () => void;
}

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const sessionData = await getSessionData();
                setUserInfo(sessionData);

                if (sessionData?.id) {
                    const isSupervisor = sessionData.issupervisor === true || sessionData.issupervisor === 1;
                    const dashboardStats = await getDashboardStats(parseInt(sessionData.id), isSupervisor);
                    setStats(dashboardStats);
                }
            } catch (error) {
                console.error('Erreur lors du chargement du dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const refreshDashboard = async () => {
        setRefreshing(true);
        try {
            if (userInfo?.id) {
                const isSupervisor = userInfo.issupervisor === true || userInfo.issupervisor === 1;
                const dashboardStats = await getDashboardStats(parseInt(userInfo.id), isSupervisor);
                setStats(dashboardStats);
            }
        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const getStatCards = (): StatCard[] => {
        if (!stats) return [];

        const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

        return [
            {
                title: 'Total des tâches',
                value: stats.totalTasks,
                icon: <ChartBarIcon className="h-8 w-8" />,
                color: 'bg-blue-500',
                trend: {
                    value: 12,
                    isPositive: true
                },
                onClick: () => router.push('/main/tasks')
            },
            {
                title: 'Tâches terminées',
                value: stats.completedTasks,
                icon: <CheckCircleIcon className="h-8 w-8" />,
                color: 'bg-green-500',
                trend: {
                    value: 8,
                    isPositive: true
                }
            },
            {
                title: 'Tâches en cours',
                value: stats.pendingTasks,
                icon: <ClockIcon className="h-8 w-8" />,
                color: 'bg-yellow-500',
                trend: {
                    value: 3,
                    isPositive: false
                }
            },
            {
                title: 'Formulaires soumis',
                value: stats.totalFormulaires,
                icon: <DocumentTextIcon className="h-8 w-8" />,
                color: 'bg-purple-500',
                trend: {
                    value: 5,
                    isPositive: true
                },
                onClick: () => router.push('/main/formulaire')
            },
            {
                title: 'En attente de révision',
                value: stats.pendingReviews,
                icon: <CalendarDaysIcon className="h-8 w-8" />,
                color: 'bg-orange-500',
                onClick: () => router.push('/main/formulaire?status=submitted')
            },
            {
                title: 'Taux de completion',
                value: `${completionRate.toFixed(1)}%`,
                icon: <TrendingUpIcon className="h-8 w-8" />,
                color: 'bg-indigo-500',
                trend: {
                    value: completionRate,
                    isPositive: completionRate > 70
                }
            },
            ...(userInfo?.issupervisor ? [{
                title: 'Membres de l\'équipe',
                value: stats.teamMembers || 0,
                icon: <UserGroupIcon className="h-8 w-8" />,
                color: 'bg-teal-500',
                onClick: () => router.push('/main/users')
            }] : [])
        ];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" text="Chargement du tableau de bord..." />
            </div>
        );
    }

    const statCards = getStatCards();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                Tableau de bord
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Bienvenue, {userInfo?.fullName || userInfo?.name}
                                {userInfo?.issupervisor && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Superviseur
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <button
                                onClick={refreshDashboard}
                                disabled={refreshing}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                            >
                                {refreshing ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                ) : (
                                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                )}
                                Actualiser
                            </button>
                            <button
                                onClick={() => router.push('/main/formulaire')}
                                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Voir les formulaires
                            </button>
                            <button
                                onClick={() => router.push('/main/formulaire/0/edit?action=add')}
                                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Nouveau formulaire
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {statCards.map((card, index) => (
                        <div
                            key={index}
                            className={`bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-all duration-300 ${card.onClick ? 'cursor-pointer hover:scale-105' : ''
                                }`}
                            onClick={card.onClick}
                        >
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 p-3 rounded-md ${card.color} text-white`}>
                                        {card.icon}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 truncate">
                                                    {card.title}
                                                </p>
                                                <p className="text-2xl font-semibold text-gray-900">
                                                    {card.value}
                                                </p>
                                            </div>
                                            {card.trend && (
                                                <div className={`flex items-center text-sm ${card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    <TrendingUpIcon
                                                        className={`h-4 w-4 mr-1 ${!card.trend.isPositive ? 'transform rotate-180' : ''
                                                            }`}
                                                    />
                                                    {card.trend.value}%
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Actions rapides</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <button
                                onClick={() => router.push('/main/formulaire/0/edit?action=add')}
                                className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <PlusIcon className="h-8 w-8 text-blue-600 mr-3" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-900">Nouveau formulaire</p>
                                    <p className="text-sm text-gray-500">Créer un formulaire de travail</p>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push('/main/formulaire')}
                                className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <DocumentTextIcon className="h-8 w-8 text-green-600 mr-3" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-900">Mes formulaires</p>
                                    <p className="text-sm text-gray-500">Gérer mes formulaires</p>
                                </div>
                            </button>

                            {userInfo?.issupervisor && (
                                <button
                                    onClick={() => router.push('/main/formulaire?status=submitted')}
                                    className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <ClockIcon className="h-8 w-8 text-orange-600 mr-3" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-900">Révisions en attente</p>
                                        <p className="text-sm text-gray-500">Formulaires à réviser</p>
                                    </div>
                                </button>
                            )}

                            {userInfo?.issupervisor && (
                                <button
                                    onClick={() => router.push('/main/users')}
                                    className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <UserGroupIcon className="h-8 w-8 text-purple-600 mr-3" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-900">Gestion des utilisateurs</p>
                                        <p className="text-sm text-gray-500">Gérer les comptes utilisateurs</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Activité récente</h2>
                    </div>
                    <div className="p-6">
                        <div className="flow-root">
                            <ul className="-mb-8">
                                <li>
                                    <div className="relative pb-8">
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                        <div className="relative flex space-x-3">
                                            <div>
                                                <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                                    <CheckCircleIcon className="h-5 w-5 text-white" />
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Formulaire <span className="font-medium text-gray-900">Rapport quotidien</span> soumis
                                                    </p>
                                                </div>
                                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                    <time>Il y a 2h</time>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li>
                                    <div className="relative pb-8">
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                        <div className="relative flex space-x-3">
                                            <div>
                                                <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                                    <DocumentTextIcon className="h-5 w-5 text-white" />
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Nouveau formulaire créé
                                                    </p>
                                                </div>
                                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                    <time>Il y a 4h</time>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li>
                                    <div className="relative">
                                        <div className="relative flex space-x-3">
                                            <div>
                                                <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
                                                    <ClockIcon className="h-5 w-5 text-white" />
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Nouvelle tâche assignée: <span className="font-medium text-gray-900">Analyse des données</span>
                                                    </p>
                                                </div>
                                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                    <time>Il y a 1j</time>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}