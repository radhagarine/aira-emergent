// utils/calendar-utils.ts
import { AppointmentStatus } from '@/app/dashboard/calendar/type';

export interface UtilizationColorStyles {
  background: string;
  border: string;
  text: string;
  hover: string;
  progress: string;
}

export const getUtilizationColor = (percentage: number): UtilizationColorStyles => {
  // No utilization
  if (percentage === 0) {
    return {
      background: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-600',
      hover: 'hover:bg-gray-100',
      progress: 'bg-gray-300'
    };
  }
  // Very low utilization (1-20%)
  if (percentage <= 20) {
    return {
      background: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-100',
      progress: 'bg-blue-400'
    };
  }
  // Low utilization (21-40%)
  if (percentage <= 40) {
    return {
      background: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-700',
      hover: 'hover:bg-cyan-100',
      progress: 'bg-cyan-400'
    };
  }
  // Medium utilization (41-60%)
  if (percentage <= 60) {
    return {
      background: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      hover: 'hover:bg-emerald-100',
      progress: 'bg-emerald-400'
    };
  }
  // High utilization (61-80%)
  if (percentage <= 80) {
    return {
      background: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      hover: 'hover:bg-amber-100',
      progress: 'bg-amber-400'
    };
  }
  // Very high utilization (81-90%)
  if (percentage <= 90) {
    return {
      background: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      hover: 'hover:bg-orange-100',
      progress: 'bg-orange-400'
    };
  }
  // Critical utilization (91-100%)
  return {
    background: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    hover: 'hover:bg-red-100',
    progress: 'bg-red-400'
  };
};

// Helper function to get status-based colors
export const getStatusColor = (status: AppointmentStatus) => {
  const colors = {
    pending: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      hover: 'hover:bg-amber-100'
    },
    confirmed: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      hover: 'hover:bg-emerald-100'
    },
    cancelled: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      hover: 'hover:bg-red-100'
    },
    completed: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-100'
    },
    no_show: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      hover: 'hover:bg-gray-100'
    }
  };
  return colors[status];
};