// WeekView.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users } from 'lucide-react';
import { AppointmentStatus, Appointment, StatusConfig } from '@/app/dashboard/calendar/type';
import { getUtilizationColor, getStatusColor } from './calendar-utils';
import { UtilizationHeader } from './UtilizationHeader';
import { convertUTCToLocal } from '@/lib/utils/timezone';

interface WeekViewProps {
  appointments: Appointment[];
  currentDate: Date;
  getStatusConfig: (status: AppointmentStatus) => StatusConfig;
  formatTime: (dateString: string) => string;
  totalCapacity?: number;
  selectedTimezone: string;
}

export const WeekView: React.FC<WeekViewProps> = ({
  appointments,
  currentDate,
  getStatusConfig,
  formatTime,
  totalCapacity = 50,
  selectedTimezone
}) => {
  const getWeekDays = () => {
    const days = [];
    const week = new Date(currentDate);
    week.setDate(week.getDate() - week.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(week);
      day.setDate(week.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getDayAppointments = (date: Date) => {
    return appointments.filter(apt => {
      // Convert UTC appointment time to selected timezone for comparison
      const aptDate = convertUTCToLocal(apt.start_time, selectedTimezone);
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate()
      );
    });
  };

  const weekDays = getWeekDays();
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  // Calculate weekly totals
  const weeklyBookings = weekDays.map(day => {
    const dayAppointments = getDayAppointments(day);
    return dayAppointments.reduce((sum, apt) => sum + (apt.party_size || 0), 0);
  });
  const totalWeekBookedCapacity = weeklyBookings.reduce((a, b) => a + b, 0);
  const weeklyTotalCapacity = totalCapacity * 7;
  const weekUtilizationPercentage = (totalWeekBookedCapacity / weeklyTotalCapacity) * 100;
  const colorStyles = getUtilizationColor(weekUtilizationPercentage);

  return (
    <div className="space-y-4">
      {/* Weekly Capacity Utilization Header */}
      <UtilizationHeader
        title="Weekly Capacity Utilization"
        bookedCapacity={totalWeekBookedCapacity}
        totalCapacity={weeklyTotalCapacity}
        utilizationPercentage={weekUtilizationPercentage}
      />

      {/* Week View Grid */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] min-h-[600px] rounded-xl overflow-hidden border">
        {/* Time Labels */}
        <div className="bg-gray-50/50 border-r border-gray-100">
          <div className="h-12 border-b border-gray-200" />
          {timeSlots.map((hour) => (
            <motion.div
              key={hour}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: hour * 0.05, 
                type: "spring", 
                stiffness: 100 
              }}
              className="h-20 px-2 py-1 flex items-center justify-center text-xs text-gray-600 font-medium border-b border-gray-100"
            >
              <span className="bg-primary/5 px-2 py-1 rounded-md text-primary/80">
                {`${hour.toString().padStart(2, '0')}:00`}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Days */}
        {weekDays.map((day, dayIndex) => {
          const dayAppointments = getDayAppointments(day);
          const dayBookedCapacity = dayAppointments.reduce((sum, apt) => sum + (apt.party_size || 0), 0);
          const dayUtilizationPercentage = (dayBookedCapacity / totalCapacity) * 100;
          const dayColorStyles = getUtilizationColor(dayUtilizationPercentage);

          return (
            <div key={day.toISOString()} className="relative border-r border-gray-100">
              {/* Day Header */}
              <div 
                className={`
                  h-12 p-2 border-b relative
                  ${dayColorStyles.background}
                  ${dayColorStyles.border}
                  transition-colors duration-200
                `}
              >
                <div className="text-sm font-medium text-gray-700">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-xs ${dayColorStyles.text} flex items-center mt-1`}>
                  <Users className="h-3 w-3 mr-1" />
                  {dayBookedCapacity} / {totalCapacity}
                </div>
                <div 
                  className={`absolute bottom-0 left-0 h-0.5 ${dayColorStyles.progress} transition-all duration-300`}
                  style={{ width: `${Math.min(dayUtilizationPercentage, 100)}%` }}
                />
              </div>

              {/* Time Grid */}
              <div className="relative">
                {/* Time slots background */}
                {timeSlots.map((hour) => (
                  <div
                    key={hour}
                    className="h-20 border-b border-gray-100/50"
                  />
                ))}

                {/* Appointments */}
                {dayAppointments.map((appointment) => {
                  // Convert UTC times to selected timezone for positioning
                  const start = convertUTCToLocal(appointment.start_time, selectedTimezone);
                  const end = convertUTCToLocal(appointment.end_time, selectedTimezone);
                  const startMinutes = start.getHours() * 60 + start.getMinutes();
                  const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                  const statusColor = getStatusColor(appointment.status);

                  return (
                    <div
                      key={appointment.id}
                      className={`
                        absolute left-1 right-1 rounded-lg border p-1
                        ${statusColor.bg} ${statusColor.border}
                        hover:shadow-md transition-shadow duration-200
                        cursor-pointer z-10
                      `}
                      style={{
                        top: `${(startMinutes / (24 * 60)) * 100}%`,
                        height: `${(duration / (24 * 60)) * 100}%`,
                        minHeight: '20px'
                      }}
                    >
                      <div className={`text-xs font-medium ${statusColor.text} truncate`}>
                        {appointment.description || 'Appointment'}
                      </div>
                      <div className={`text-xs ${statusColor.text} opacity-75 flex items-center gap-1`}>
                        <Clock className="h-3 w-3" />
                        {formatTime(appointment.start_time)}
                        <Users className="h-3 w-3 ml-1" />
                        {appointment.party_size}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};