// MonthView.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { AppointmentStatus, Appointment, StatusConfig } from '@/app/dashboard/calendar/type';
import { getUtilizationColor } from './calendar-utils';
import { UtilizationHeader } from './UtilizationHeader';

interface MonthViewProps {
  appointments: Appointment[];
  currentDate: Date;
  getStatusConfig: (status: AppointmentStatus) => StatusConfig;
  formatTime: (dateString: string) => string;
  totalCapacity?: number;
}

export const MonthView: React.FC<MonthViewProps> = ({
  appointments,
  currentDate,
  getStatusConfig,
  totalCapacity = 50
}) => {
  const getMonthDays = () => {
    const days = [];
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDay = month.getDay();
    
    // Previous month days
    for (let i = 0; i < startDay; i++) {
      const day = new Date(month);
      day.setDate(day.getDate() - (startDay - i));
      days.push(day);
    }
    
    // Current month days
    while (month.getMonth() === currentDate.getMonth()) {
      days.push(new Date(month));
      month.setDate(month.getDate() + 1);
    }
    
    // Next month days to complete grid
    const remainingDays = 42 - days.length;
    for (let i = 0; i < remainingDays; i++) {
      days.push(new Date(month));
      month.setDate(month.getDate() + 1);
    }
    
    return days;
  };

  const getDayAppointments = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate()
      );
    });
  };

  // Calculate month capacity utilization
  const monthDays = getMonthDays();
  const monthAppointments = monthDays.map(day => getDayAppointments(day));
  const monthBookedCapacity = monthAppointments.map(dayAppts => 
    dayAppts.reduce((sum, apt) => sum + (apt.party_size || 0), 0)
  );
  const totalMonthBookedCapacity = monthBookedCapacity.reduce((sum, dayCapacity) => sum + dayCapacity, 0);
  const monthlyTotalCapacity = totalCapacity * getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthUtilizationPercentage = (totalMonthBookedCapacity / monthlyTotalCapacity) * 100;

  return (
    <div className="space-y-4">
      <UtilizationHeader
        title="Monthly Capacity Utilization"
        bookedCapacity={totalMonthBookedCapacity}
        totalCapacity={monthlyTotalCapacity}
        utilizationPercentage={monthUtilizationPercentage}
      />

      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden bg-gray-200">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <motion.div 
            key={day} 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="bg-gray-50/30 p-2 text-center border-b border-gray-200"
          >
            <span className="text-sm font-medium text-primary/80">{day}</span>
          </motion.div>
        ))}

        {/* Calendar Days */}
        {monthDays.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const dayAppointments = getDayAppointments(day);
          
          const dayBookedCapacity = dayAppointments.reduce((sum, apt) => sum + (apt.party_size || 0), 0);
          const dayUtilizationPercentage = (dayBookedCapacity / totalCapacity) * 100;
          const colorStyles = getUtilizationColor(dayUtilizationPercentage);

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: index * 0.02,
                type: "spring", 
                stiffness: 100 
              }}
              className={`
                min-h-[120px] p-2 
                ${!isCurrentMonth ? 'opacity-50' : ''}
                ${colorStyles.background}
                ${colorStyles.border}
                border
                ${colorStyles.hover}
                transition-all duration-200
              `}
            >
              <div className="flex justify-between items-start">
                <span
                  className={`
                    inline-flex items-center justify-center
                    h-6 w-6 rounded-full text-sm
                    ${isToday ? 'bg-red-600 text-white' : colorStyles.text}
                  `}
                >
                  {day.getDate()}
                </span>
                {isCurrentMonth && (
                  <div className={`text-xs ${colorStyles.text} flex items-center`}>
                    <Users className="h-3 w-3 mr-1" />
                    {dayBookedCapacity} / {totalCapacity}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorStyles.progress} transition-all duration-300`}
                  style={{ width: `${Math.min(dayUtilizationPercentage, 100)}%` }}
                />
              </div>

              {/* Appointments */}
              <div className="mt-2 space-y-1">
                {dayAppointments.slice(0, 3).map((appointment) => {
                  const statusConfig = getStatusConfig(appointment.status);
                  return (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`
                        text-xs p-1 rounded truncate 
                        ${statusConfig.color} 
                        hover:shadow-sm transition-all duration-200
                        cursor-pointer
                      `}
                    >
                      {appointment.description || 'Appointment'}
                    </motion.div>
                  );
                })}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500 pl-1">
                    +{dayAppointments.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Helper function to get the number of days in a month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}