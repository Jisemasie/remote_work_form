interface Activity {
    id: number;
    school: string;
    action: string;
    date: string;
  }
  
  interface RecentActivityProps {
    activities: Activity[];
  }
  
  export function RecentActivity({ activities }: RecentActivityProps) {
    return (
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start">
            <div className="flex-shrink-0 h-2 w-2 mt-2 bg-blue-500 rounded-full"></div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800">{activity.action}</p>
              <p className="text-xs text-gray-500">
                {activity.school} • {new Date(activity.date).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        ))}
        <a href="#" className="block text-sm text-center text-blue-600 hover:text-blue-800 mt-4">
          Voir toute l&apos;activité
        </a>
      </div>
    );
  }