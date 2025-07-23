interface CardProps {
    title: string;
    value: string | number;
    icon: string;
    trend: string;
  }
  
  export function Card({ title, value, icon, trend }: CardProps) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-2 text-gray-800">{value}</p>
            <p className="text-xs mt-1 text-green-600">{trend}</p>
          </div>
          <div className="text-3xl">{icon}</div>
        </div>
      </div>
    );
  }