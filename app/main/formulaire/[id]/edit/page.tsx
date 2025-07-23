'use client'

import React, { useState } from 'react';
import { getSessionData } from '@/app/lib/session';

// Define types for our data structures
type EmployeeInfo = {
  name: string;
  registrationNumber: string;
  branch: string;
  position: string;
  date: string;
  supervisor: string;
};

type Task = {
  id: number;
  name: string;
  description: string;
  startDate: string;
  status: string;
  dueDate: string;
  gaps: string | number;
  comments: string;
  type_task?: string;
};

const DailyTaskReport: React.FC = () => {
  // Initialize state with TypeScript types
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo>({
    name: '',
    registrationNumber: '',
    branch: '',
    position: '',
    date: new Date().toISOString().split('T')[0],
    supervisor: '',
  });

  const [plannedTasks, setPlannedTasks] = useState<Task[]>([
    { 
      id: 1, 
      name: 'Task 1', 
      description: '', 
      startDate: new Date().toISOString().split('T')[0], 
      status: '', 
      dueDate: '', 
      gaps: '', 
      comments: '',
      type_task: 'Planned' // Default type for planned tasks
    },
  ]);

  const [supervisorComments, setSupervisorComments] = useState<string>('');
  const [sessionData, setSessionData] = useState<unknown>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const sessionData = await getSessionData();
      console.log("Session Data: ", sessionData);
      if (sessionData) {
        setSessionData(sessionData);
      }
      // Assuming sessionData contains employee info, we can set it here
      if (sessionData && typeof sessionData === 'object') {
        setEmployeeInfo(prev => ({
          ...prev,
          name: (sessionData.fullName ?? sessionData.name ?? ''),
          registrationNumber: (sessionData.registration_number ?? ''),
          position: (sessionData.position ?? ''),
          supervisor: (sessionData.superviseur ?? ''),
          branch: (sessionData.branch ?? ''),
        }));
      }
      // Fetch form Data
      // if (sessionData && typeof sessionData === 'object') {
      //   // Fetch form data using the employee ID or other relevant info
      //   const formData = await fetchFormData(sessionData.id);
      //   if (formData) {
      //     setPlannedTasks(formData.plannedTasks);
      //     setSupervisorComments(formData.supervisorComments);
      //   }
      // }

    };
    fetchData();
  }, []);

  // Event handler with proper typing
  const handleEmployeeInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmployeeInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePlannedTaskChange = (id: number, field: keyof Task, value: string) => {
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
        name: `Tache ${newId}`, 
        description: '', 
        startDate: new Date().toISOString().split('T')[0], 
        status: '', 
        dueDate: '', 
        gaps: '', 
        comments: '' ,
        type_task: 'Planned' // Default type for new planned tasks
      }
    ]);
  };

  const removePlannedTask = (id: number) => {
    if (plannedTasks.length <= 1) {
      alert("You must have at least one planned task");
      return;
    }
    setPlannedTasks(prev => prev.filter(task => task.id !== id));
  };

  const calculateGaps = (status: string, dueDate: string): string | number => {
    if (status === 'Completed') return '';
    if (!dueDate) return '';
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 'Overdue';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to an API
    console.log({
      employeeInfo,
      plannedTasks,
      supervisorComments
    });
    alert('Report submitted successfully!');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-8 pb-2 border-b-2 border-blue-500">
        Daily Task Report
      </h2>
      
      <form onSubmit={handleSubmit}>

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
                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Branche:</label>
              <input
                type="text"
                name="Branche"
                value={employeeInfo.branch}
                onChange={handleEmployeeInfoChange}
                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Position:</label>
              <input
                type="text"
                name="Position"
                value={employeeInfo.position}
                onChange={handleEmployeeInfoChange}
                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
              />
            </div>
          </div>
        </div>
        
        {/* Tasks Section */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-2xl font-bold text-gray-800">Taches plannifiées</h3>
            <button
              type="button"
              onClick={addNewPlannedTask}
              className="cursor-pointer px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Ajouter</span>
            </button>
          </div>

          {/* Task Cards Container */}
          <div className="space-y-4">
            {plannedTasks.map(task => (
              <div key={`planned-${task.id}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                
                {/* Actions */}
                <div className="flex items-end justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => removePlannedTask(task.id)}
                    disabled={plannedTasks.length <= 1}
                    className={`px-4 py-2 rounded-md text-white transition-colors cursor-pointer ${
                      plannedTasks.length <= 1
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Remove
                  </button>
                </div>

                {/* First Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Task Number */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Numero Tache</label>
                    <input
                      type="text"
                      value={task.name}
                      onChange={(e) => handlePlannedTaskChange(task.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      readOnly
                    />
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Date debut</label>
                    <input
                      type="date"
                      value={task.startDate}
                      onChange={(e) => handlePlannedTaskChange(task.id, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Etat</label>
                    <select
                      value={task.status}
                      onChange={(e) => handlePlannedTaskChange(task.id, 'status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Status</option>
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Due Date */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                      type="date"
                      value={task.dueDate}
                      onChange={(e) => handlePlannedTaskChange(task.id, 'dueDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Task Type */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Task Type</label>
                    <select
                      value={task.type_task}
                      onChange={(e) => handlePlannedTaskChange(task.id, 'type_task', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Planned">Planned</option>
                      <option value="Unplanned">Unplanned</option>
                    </select>
                  </div>



                  {/* Gaps */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Gaps</label>
                    <div className={`p-2 rounded-md ${task.gaps === 'Overdue' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
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
                    />
                  </div>

                  {/* Comments */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Commentaires</label>
                    <textarea
                      value={task.comments}
                      onChange={(e) => handlePlannedTaskChange(task.id, 'comments', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Supervisor Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Commentaire du Superviseur</h3>
          <textarea
            value={supervisorComments}
            // disabled={}
            onChange={(e) => setSupervisorComments(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
            placeholder="Saisir votre commentaire ici..."
          />
        </div>
        
        {/* Notes Section */}
        <div className="bg-gray-100 p-6 rounded-lg shadow-sm mb-8 italic text-gray-700 border-l-4 border-gray-400">
          <p className="mb-2">*La première section est à remplir par l’employé. En début de journée il marque 
            les tâches ainsi que leur description, à la fin de la journée 
            il donne le statut de chaque tâche et marque les délais si celle-ci n’est pas achevée à la fin de la 
            journée et des commentaires s’il y a besoin.  </p>
          <p>* Le Superviseur marque les commentaires et marque sa satisfaction ou non de celles-ci et 
            donne de directive pour le jour suivant.</p>
        </div>
              
        <button 
          type="submit"
          className="w-full md:w-auto mx-auto block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-medium"
        >
          Soumettre le rapport
        </button>

      </form>
    </div>
  );
};

export default DailyTaskReport;