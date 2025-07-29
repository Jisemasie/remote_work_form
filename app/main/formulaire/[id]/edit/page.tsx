'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getSessionData } from '@/app/lib/session';
import { createOrUpdateFormulaire, getFormulaireDetails, getUserTasksForDate } from '@/app/lib/formulaire_actions';
import { Formulaire, Task } from '@/app/lib/definitions';
import { useToast } from '@/app/hook/useToast';
import { PlusIcon, TrashIcon, SaveIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

type EmployeeInfo = {
  name: string;
  registrationNumber: string;
  branch: string;
  position: string;
  date: string;
  supervisor: string;
};

type TaskData = {
  id_task: number;
  type_task: string;
  task_number: number;
  task_description: string;
  task_start_dt: string;
  task_end_dt: string;
  task_status: string;
  task_comment: string;
};

const FormulaireEdit: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo>({
    name: '',
    registrationNumber: '',
    branch: '',
    position: '',
    date: new Date().toISOString().split('T')[0],
    supervisor: '',
  });

  const [tasks, setTasks] = useState<TaskData[]>([
    { 
      id_task: 0,
      type_task: 'planned',
      task_number: 1,
      task_description: '',
      task_start_dt: new Date().toISOString().split('T')[0],
      task_end_dt: '',
      task_status: 'not_started',
      task_comment: ''
    },
  ]);

  const [employeeComment, setEmployeeComment] = useState<string>('');
  const [supervisorComment, setSupervisorComment] = useState<string>('');
  const [sessionData, setSessionData] = useState<any>(null);
  const [formulaireId, setFormulaireId] = useState<number>(0);
  const [formulaireStatus, setFormulaireStatus] = useState<string>('draft');

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

          if (action === 'update' && id !== '0') {
            setFormulaireId(parseInt(id as string));
            const details = await getFormulaireDetails(parseInt(id as string));
            
            if (details.formulaire) {
              setEmployeeComment(details.formulaire.employee_comment || '');
              setSupervisorComment(details.formulaire.supervisor_comment || '');
              setFormulaireStatus(details.formulaire.status);
              setEmployeeInfo(prev => ({
                ...prev,
                date: new Date(details.formulaire.create_dt).toISOString().split('T')[0]
              }));
            }
            
            if (details.tasks && details.tasks.length > 0) {
              const formattedTasks = details.tasks.map((task: any) => ({
                id_task: task.id_task,
                type_task: task.type_task,
                task_number: task.task_number,
                task_description: task.task_description,
                task_start_dt: task.task_start_dt ? new Date(task.task_start_dt).toISOString().split('T')[0] : '',
                task_end_dt: task.task_end_dt ? new Date(task.task_end_dt).toISOString().split('T')[0] : '',
                task_status: task.task_status,
                task_comment: task.task_comment || ''
              }));
              setTasks(formattedTasks);
            }
          } else {
            // Load user's tasks for today
            const userTasks = await getUserTasksForDate(
              parseInt(sessionData.id),
              new Date()
            );
            
            if (userTasks && userTasks.length > 0) {
              const formattedTasks = userTasks.map((task: any, index: number) => ({
                id_task: task.id_task || 0,
                type_task: task.type_task || 'planned',
                task_number: index + 1,
                task_description: task.task_description || '',
                task_start_dt: new Date().toISOString().split('T')[0],
                task_end_dt: '',
                task_status: 'not_started',
                task_comment: ''
              }));
              setTasks(formattedTasks);
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

  const handleEmployeeInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmployeeInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskChange = (index: number, field: keyof TaskData, value: string | number) => {
    const updatedTasks = tasks.map((task, i) => {
      if (i === index) {
        return { ...task, [field]: value };
      }
      return task;
    });
    setTasks(updatedTasks);
  };

  const addNewTask = () => {
    const newTask: TaskData = {
      id_task: 0,
      type_task: 'planned',
      task_number: tasks.length + 1,
      task_description: '',
      task_start_dt: new Date().toISOString().split('T')[0],
      task_end_dt: '',
      task_status: 'not_started',
      task_comment: ''
    };
    setTasks(prev => [...prev, newTask]);
  };

  const removeTask = (index: number) => {
    if (tasks.length <= 1) {
      error("Vous devez avoir au moins une tâche");
      return;
    }
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent, submitStatus: string = 'draft') => {
    e.preventDefault();
    setSaving(true);

    try {
      const formulaireData: Partial<Formulaire> = {
        id_formulaire: formulaireId || 0,
        id_user: parseInt(sessionData?.id || '0'),
        employee_comment: employeeComment,
        supervisor_comment: supervisorComment,
        status: submitStatus as any
      };

      const tasksData: Partial<Task>[] = tasks.map(task => ({
        id_task: task.id_task,
        type_task: task.type_task,
        task_number: task.task_number,
        task_description: task.task_description,
        task_start_dt: task.task_start_dt ? new Date(task.task_start_dt) : new Date(),
        task_end_dt: task.task_end_dt ? new Date(task.task_end_dt) : null,
        task_status: task.task_status,
        task_comment: task.task_comment
      }));

      const result = await createOrUpdateFormulaire(formulaireData, tasksData);

      if (result) {
        success(submitStatus === 'submitted' ? 'Formulaire soumis avec succès!' : 'Formulaire sauvegardé avec succès!');
        
        if (submitStatus === 'submitted') {
          router.push('/main/formulaire');
        } else {
          if (!formulaireId && result.id_formulaire) {
            setFormulaireId(result.id_formulaire);
            setFormulaireStatus('draft');
          }
        }
      } else {
        error('Erreur lors de la sauvegarde du formulaire');
      }
    } catch (err) {
      console.error('Error saving formulaire:', err);
      error('Erreur lors de la sauvegarde du formulaire');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/main/formulaire');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const canEdit = formulaireStatus === 'draft' || !sessionData?.issupervisor;
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
                  {action === 'update' ? 'Modifier le formulaire' : 'Nouveau formulaire'}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Formulaire de travail quotidien
                </p>
              </div>
            </div>
            {formulaireStatus && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                formulaireStatus === 'draft' ? 'bg-gray-100 text-gray-800' :
                formulaireStatus === 'submitted' ? 'bg-blue-100 text-blue-800' :
                formulaireStatus === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {formulaireStatus === 'draft' ? 'Brouillon' :
                 formulaireStatus === 'submitted' ? 'Soumis' :
                 formulaireStatus === 'approved' ? 'Approuvé' : 'Rejeté'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={(e) => handleSubmit(e, 'draft')}>

          {/* Employee Information Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Information sur l'employé(e)</h3>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-2xl font-bold text-gray-800">Tâches</h3>
              {canEdit && (
                <button
                  type="button"
                  onClick={addNewTask}
                  className="cursor-pointer px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Ajouter une tâche</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={`task-${index}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  
                  {canEdit && (
                    <div className="flex items-end justify-end space-x-2 mb-4">
                      <button
                        type="button"
                        onClick={() => removeTask(index)}
                        disabled={tasks.length <= 1}
                        className={`px-4 py-2 rounded-md text-white transition-colors cursor-pointer flex items-center gap-2 ${
                          tasks.length <= 1
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        <TrashIcon className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Task Type */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Type de tâche</label>
                      <select
                        value={task.type_task}
                        onChange={(e) => handleTaskChange(index, 'type_task', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={!canEdit}
                      >
                        <option value="planned">Planifiée</option>
                        <option value="unplanned">Non planifiée</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>

                    {/* Task Number */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Numéro de tâche</label>
                      <input
                        type="number"
                        value={task.task_number}
                        onChange={(e) => handleTaskChange(index, 'task_number', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={!canEdit}
                        min="1"
                      />
                    </div>

                    {/* Task Status */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">État</label>
                      <select
                        value={task.task_status}
                        onChange={(e) => handleTaskChange(index, 'task_status', e.target.value)}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Start Date */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Date début</label>
                      <input
                        type="date"
                        value={task.task_start_dt}
                        onChange={(e) => handleTaskChange(index, 'task_start_dt', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={!canEdit}
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Date fin</label>
                      <input
                        type="date"
                        value={task.task_end_dt}
                        onChange={(e) => handleTaskChange(index, 'task_end_dt', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={!canEdit}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Task Description */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Description de la tâche</label>
                      <textarea
                        value={task.task_description}
                        onChange={(e) => handleTaskChange(index, 'task_description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                        rows={3}
                        disabled={!canEdit}
                        placeholder="Décrivez la tâche en détail..."
                      />
                    </div>

                    {/* Task Comment */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Commentaires sur la tâche</label>
                      <textarea
                        value={task.task_comment}
                        onChange={(e) => handleTaskChange(index, 'task_comment', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                        rows={2}
                        disabled={!canEdit}
                        placeholder="Commentaires additionnels..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Commentaires</h3>
            
            {/* Employee Comment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Commentaires de l'employé</label>
              <textarea
                value={employeeComment}
                onChange={(e) => setEmployeeComment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                placeholder="Vos commentaires sur le travail effectué..."
                disabled={!canEdit}
              />
            </div>

            {/* Supervisor Comment */}
            {isSupervisor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commentaires du superviseur</label>
                <textarea
                  value={supervisorComment}
                  onChange={(e) => setSupervisorComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                  placeholder="Commentaires du superviseur..."
                />
              </div>
            )}
          </div>
          
          {/* Instructions Section */}
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
                    <li>Décrivez chaque tâche en détail</li>
                    <li>Indiquez le statut de chaque tâche</li>
                    <li>Ajoutez des commentaires si nécessaire</li>
                    <li>Sauvegardez régulièrement votre travail</li>
                    <li>Soumettez le formulaire une fois terminé pour révision</li>
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
                  {saving ? 'Soumission...' : 'Soumettre le formulaire'}
                </button>
              </>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default FormulaireEdit;