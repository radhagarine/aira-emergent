// components/ui/UtilizationHeader.tsx
import React from 'react';
import { Users } from 'lucide-react';

interface UtilizationHeaderProps {
  title: string;
  bookedCapacity: number;
  totalCapacity: number;
  utilizationPercentage: number;
}

const getUtilizationStyle = (percentage: number) => {
  if (percentage >= 90) return 'from-red-500 to-orange-500';
  if (percentage >= 70) return 'from-orange-500 to-yellow-500';
  if (percentage >= 50) return 'from-yellow-500 to-green-500';
  if (percentage >= 30) return 'from-green-500 to-emerald-500';
  if (percentage >= 10) return 'from-emerald-500 to-blue-500';
  return 'from-blue-500 to-indigo-500';
};

export const UtilizationHeader: React.FC<UtilizationHeaderProps> = ({
  title,
  bookedCapacity,
  totalCapacity,
  utilizationPercentage
}) => {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-sm">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
      <div className="absolute inset-y-0 -left-4 -right-4 bg-gradient-to-r opacity-10" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-lg bg-white/90 shadow-sm flex items-center justify-center">
                <Users className="h-6 w-6 text-gray-700" />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-white" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">Current Capacity Status</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {utilizationPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Utilization</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-gray-600 font-medium">
            {bookedCapacity} / {totalCapacity} people
          </span>
          <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${
              utilizationPercentage >= 80 ? 'bg-red-500' :
              utilizationPercentage >= 60 ? 'bg-yellow-500' :
              'bg-green-500'
            }`} />
            <span className="text-gray-500">
              {utilizationPercentage >= 80 ? 'High' :
               utilizationPercentage >= 60 ? 'Medium' :
               'Low'} Load
            </span>
          </div>
        </div>

        <div className="relative h-3 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getUtilizationStyle(utilizationPercentage)} transition-all duration-500`}
            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
          >
            <div className="absolute inset-0 opacity-30">
              <div className="animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};