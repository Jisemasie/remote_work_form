'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getSessionData } from '@/app/lib/session';
import { createOrUpdateDailyReport, getEmployeeTasksForReport } from '@/app/lib/task_actions';
import { DailyReport, ReportTask, Task } from '@/app/lib/definitions';
import { useToast } from '@/app/hook/useToast';
import { PlusIcon, TrashIcon, SaveIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

// Define types for our data structures
type EmployeeInfo = {
  name: string;
  registrationNumber: string;
  branch: string;
  position: string;
  date: string;
  supervisor: string;
};

type TaskData = {
  id: number;
  name: string;
  description: string;
  startDate: string;
  status: string;
  dueDate: string;
  gaps: string | number;
  comments: string;
  type_task?: string;
  completion_percentage: number;
  employee_notes: string;
  supervisor_feedback?: string;
};

const DailyTaskReport: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize state with TypeScript types
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo>({
    name: '',
    registrationNumber: '',
    branch: '',
    position: '',
    date: new Date().toISOString().split('T')[0],
    supervisor: '',
  });

  const [plannedTasks, setPlannedTasks] = useState<TaskData[]>([
    { 
      id: 1, 
      name: 'Tâche 1', 
      description: '', 
      startDate: new Date().toISOString().split('T')[0], 
      status: 'not_started', 
      dueDate: '', 
      gaps: '', 
      comments: '',
      type_task: 'planned',
      completion_percentage: 0,
      employee_notes: ''
    },
  ]);

  const [supervisorComments, setSupervisorComments] = useState<string>('');
  const [sessionData, setSessionData] = useState<any>(null);
  const [reportId, setReportId] = useState<number>(0);
  const [reportStatus, setReportStatus] = useState<string>('draft');

  const action = searchParams.get('action') || 'add';
  const { id } = params;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sessionData = await getSessionData();
        setSessionData(sessionData);
        
        if (sessionData) {
          setEmployeeInfo(prev => ({
            ...prev,
            name: sessionData.fullName || sessionData.name || '',
            registrationNumber: sessionData.registration_number || '',
            position: sessionData.position || '',
            supervisor: sessionData.superviseur || '',
            branch: sessionData.branch || '',
          }));

          // If editing existing report, load data
          if (action === 'update' && id !== '0') {
            setReportId(parseInt(id as string));
            // Load existing report data here
            // const reportData = await getReportById(parseInt(id as string));
            // if (reportData) {
            //   // Populate form with existing data
            // }
          } else {
            // Load employee's tasks for today's report
            const tasks = await getEmployeeTasksForReport(
              parseInt(sessionData.id),
              new Date()
            );
            
            if (tasks && tasks.length > 0) {
              const formattedTasks = tasks.map((task: Task, index: number) => ({
                id: task.id,
                name: task.task_name,
                description: task.description,
                startDate: task.start_date ? new Date(task.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                status: task.status,
                dueDate: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
                gaps: task.gaps || '',
                comments: task.employee_comments || '',
                type_task: task.task_type || 'planned',
                completion_percentage: 0,
                employee_notes: ''
              }));
              setPlannedTasks(formattedTasks);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [action, id, error]);

  // Event handler with proper typing
  const handleEmployeeInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmployeeInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePlannedTaskChange = (id: number, field: keyof TaskData, value: string | number) => {
    const updatedTasks = plannedTasks.map(task => {
      if (task.id === id) {
        const updatedTask = { ...task, [field]: value };
        
        // Automatically calculate gaps if status or due date changes
        if ((field === 'status' || field === 'dueDate') && updatedTask.dueDate) {
          updatedTask.gaps = calculateGaps(updatedTask.status, updatedTask.dueDate);
        }
        
        return updatedTask;
      }
      return task;
    });
    
    setPlannedTasks(updatedTasks);
  };

  const addNewPlannedTask = () => {
    const newId = plannedTasks.length > 0 ? Math.max(...plannedTasks.map(t => t.id)) + 1 : 1;
    setPlannedTasks(prev => [
      ...prev,
      { 
        id: newId,
        name: `Tâche ${newId}`, 
        description: '', 
        startDate: new Date().toISOString().split('T')[0], 
        status: 'not_started', 
        dueDate: '', 
        gaps: '', 
        comments: '',
        type_task: 'planned',
        completion_percentage: 0,
        employee_notes: ''
      }
    ]);
  };

  const removePlannedTask = (id: number) => {
    if (plannedTasks.length <= 1) {
      error("Vous devez avoir au moins une tâche");
      return;
    }
    setPlannedTasks(prev => prev.filter(task => task.id !== id));
  };

  const calculateGaps = (status: string, dueDate: string): string | number => {
    if (status === 'completed') return '';
    if (!dueDate) return '';
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 'En retard';
  };

  const handleSubmit = async (e: React.FormEvent, submitStatus: string = 'draft') => {
    e.preventDefault();
    setSaving(true);

    try {
      // Prepare report data
      const reportData: Partial<DailyReport> = {
        id: reportId || 0,
        employee_id: parseInt(sessionData?.id || '0'),
        report_date: new Date(employeeInfo.date),
        branch: employeeInfo.branch,
        department: sessionData?.department || '',
        supervisor_id: sessionData?.superviseur_id || null,
        status: submitStatus as any,
        supervisor_overall_comments: supervisorComments
      };

      // Prepare tasks data
      const tasksData: Partial<ReportTask>[] = plannedTasks.map(task => ({
        task_id: task.id,
        completion_percentage: task.completion_percentage,
        employee_notes: task.employee_notes,
        actual_start_date: task.startDate ? new Date(task.startDate) : null,
        actual_end_date: task.status === 'completed' && task.dueDate ? new Date(task.dueDate) : null
      }));

      const result = await createOrUpdateDailyReport(reportData, tasksData);

      if (result) {
        success(submitStatus === 'submitted' ? 'Rapport soumis avec succès!' : 'Rapport sauvegardé avec succès!');
        
        if (submitStatus === 'submitted') {
          router.push('/main/reports');
        } else {
          // Update report ID if it was a new report
          if (!reportId && result.id) {
            setReportId(result.id);
            setReportStatus('draft');
          }
        }
      } else {
        error('Erreur lors de la sauvegarde du rapport');
      }
    } catch (err) {
      console.error('Error saving report:', err);
      error('Erreur lors de la sauvegarde du rapport');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/main/reports');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const canEdit = reportStatus === 'draft' || !sessionData?.issupervisor;
  const isSupervisor = sessionData?.issupervisor === true || sessionData?.issupervisor === 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Retour
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {action === 'update' ? 'Modifier le rapport' : 'Nouveau rapport quotidien'}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Rapport de travail quotidien
                </p>
              </div>
            </div>
            {reportStatus && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                reportStatus === 'draft' ? 'bg-gray-100 text-gray-800' :
                reportStatus === 'submitted' ? 'bg-blue-100 text-blue-800' :
                reportStatus === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {reportStatus === 'draft' ? 'Brouillon' :
                 reportStatus === 'submitted' ? 'Soumis' :
                 reportStatus === 'approved' ? 'Approuvé' : 'Rejeté'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={(e) => handleSubmit(e, 'draft')}>

          {/* Employee Information Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Information sur l&apos;employé(e)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Nom Employé(e):</label>
                <input
                  type="text"
                  name="name"
                  value={employeeInfo.name}
                  onChange={handleEmployeeInfoChange}
                  className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  disabled
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Numero matricule:</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={employeeInfo.registrationNumber}
                  onChange={handleEmployeeInfoChange}
                  className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  disabled
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Branche:</label>
                <input
                  type="text"
                  name="branch"
                  value={employeeInfo.branch}
                  onChange={handleEmployeeInfoChange}
                  className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  disabled
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Position:</label>
                <input
                  type="text"
                  name="position"
                  value={employeeInfo.position}
                  onChange={handleEmployeeInfoChange}
                  className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  disabled
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Superviseur:</label>
                <input
                  type="text"
                  name="supervisor"
                  value={employeeInfo.supervisor || ''}
                  onChange={handleEmployeeInfoChange}
                  className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  disabled
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Date:</label>
                <input
                  type="date"
                  name="date"
                  value={employeeInfo.date}
                  onChange={handleEmployeeInfoChange}
                  className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
          
          {/* Tasks Section */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Tâches</h3>
              {canEdit && (
                <button
                  type="button"
                  onClick={addNewPlannedTask}
                  className="cursor-pointer px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Ajouter une tâche</span>
                </button>
              )}
            </div>

            {/* Task Cards Container */}
            <div className="space-y-4">
              {plannedTasks.map(task => (
                <div key={`task-${task.id}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  
                  {/* Actions */}
                  {canEdit && (
                    <div className="flex items-end justify-end space-x-2 mb-4">
                      <button
                        type="button"
                        onClick={() => removePlannedTask(task.id)}
                        disabled={plannedTasks.length <= 1}
                        className={`px-4 py-2 rounded-md text-white transition-colors cursor-pointer flex items-center gap-2 ${
                          plannedTasks.length <= 1
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        <TrashIcon className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  )}

                  {/* First Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Task Name */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Nom de la tâche</label>
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => handlePlannedTaskChange(task.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={!canEdit}
                      />
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Date début</label>
                      <input
                        type="date"
                        value={task.startDate}
                        onChange={(e) => handlePlannedTaskChange(task.id, 'startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={!canEdit}
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">État</label>
                      <select
                        value={task.status}
                        onChange={(e) => handlePlannedTaskChange(task.id, 'status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={!canEdit}
                      >
                        <option value="not_started">Non commencée</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminée</option>
                        <option value="on_hold">En attente</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    </div>
                  </div>

                  {/* Second Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Due Date */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Date d&apos;échéance</label>
                      <input
                        type="date"
                        value={task.dueDate}
                        onChange={(e) => handlePlannedTaskChange(task.id, 'dueDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={!canEdit}
                      />
                    </div>

                    {/* Completion Percentage */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Pourcentage de completion</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={task.completion_percentage}
                        onChange={(e) => handlePlannedTaskChange(task.id, 'completion_percentage', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={!canEdit}
                      />
                    </div>

                    {/* Gaps */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Écart (jours)</label>
                      <div className={`p-2 rounded-md ${task.gaps === 'En retard' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
                        {task.gaps || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Description and Comments (Full width) */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Description */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={task.description}
                        onChange={(e) => handlePlannedTaskChange(task.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                        rows={2}
                        disabled={!canEdit}
                      />
                    </div>

                    {/* Employee Notes */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Notes de l&apos;employé</label>
                      <textarea
                        value={task.employee_notes}
                        onChange={(e) => handlePlannedTaskChange(task.id, 'employee_notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                        rows={2}
                        disabled={!canEdit}
                      />
                    </div>

                    {/* Supervisor Feedback */}
                    {isSupervisor && (
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Feedback du superviseur</label>
                        <textarea
                          value={task.supervisor_feedback || ''}
                          onChange={(e) => handlePlannedTaskChange(task.id, 'supervisor_feedback', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                          rows={2}
                          placeholder="Feedback pour cette tâche..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Supervisor Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Commentaires généraux du superviseur</h3>
            <textarea
              value={supervisorComments}
              onChange={(e) => setSupervisorComments(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
              placeholder="Commentaires généraux sur le rapport..."
              disabled={!isSupervisor}
            />
          </div>
          
          {/* Notes Section */}
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm mb-8 border-l-4 border-blue-400">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Instructions</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Remplissez les informations sur vos tâches quotidiennes</li>
                    <li>Indiquez le pourcentage de completion pour chaque tâche</li>
                    <li>Ajoutez des notes détaillées sur votre travail</li>
                    <li>Sauvegardez régulièrement votre travail</li>
                    <li>Soumettez le rapport une fois terminé pour révision</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
                
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Annuler
            </button>
            
            {canEdit && (
              <>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <SaveIcon className="h-4 w-4" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'submitted')}
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Soumission...' : 'Soumettre le rapport'}
                </button>
              </>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default DailyTaskReport;