import { Card } from '@/app/ui/card'; 
import { BarChart } from '@/app/ui/BarChart'; 
import { RecentActivity } from '@/app/ui/RecentActivity'; 



export default async function Dashboard() {
  //const stats = await getDashboardStats();
  const mockStats = {
    totalStudents: 1987,
    schoolsCount: 42,
    activeTeachers: 156,
    newStudentsThisMonth: 87,
    attendanceRate: 94.5,
    recentActivities: [
      { id: 1, school: "École Primaire A", action: "Nouvelle inscription", date: "2024-05-15" },
      { id: 2, school: "Lycée B", action: "Mise à jour des notes", date: "2024-05-14" },
      { id: 3, school: "Collège C", action: "Paiement reçu", date: "2024-05-13" },
    ],
    enrollmentData: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      values: [120, 190, 130, 170, 150],
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 overflow-y-auto">
    
    </div>
  );
}