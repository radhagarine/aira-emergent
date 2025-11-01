// DayView.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users } from 'lucide-react';
import { AppointmentStatus, Appointment, StatusConfig } from '@/app/dashboard/calendar/type';
import { getUtilizationColor } from './calendar-utils';
import { UtilizationHeader } from './UtilizationHeader';
import { convertUTCToLocal } from '@/lib/utils/timezone';

interface DayViewProps {
  appointments: Appointment[];
  currentDate: Date;
  getStatusConfig: (status: AppointmentStatus) => StatusConfig;
  formatTime: (dateString: string) => string;
  totalCapacity?: number;
  selectedTimezone: string;
}

export const DayView: React.FC<DayViewProps> = ({
  appointments,
  currentDate,
  getStatusConfig,
  formatTime,
  totalCapacity = 50, // Default capacity if not provided
  selectedTimezone
}) => {
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

  // Calculate capacity utilization
  const dayAppointments = getDayAppointments(currentDate);
  const totalBookedCapacity = dayAppointments.reduce((sum, apt) => sum + (apt.party_size || 0), 0);
  const utilizationPercentage = (totalBookedCapacity / totalCapacity) * 100;

  return (
    <div className="relative">
      {/* Capacity Utilization Header */}
      <UtilizationHeader
        title="Daily Capacity Utilization"
        bookedCapacity={totalBookedCapacity}
        totalCapacity={totalCapacity}
        utilizationPercentage={utilizationPercentage}
      />

      <div className="grid grid-cols-[80px_1fr] min-h-[600px] rounded-xl overflow-hidden">
        {/* Time Labels */}
        <div className="bg-gray-50/50 border-r border-gray-100">
          {Array.from({ length: 24 }, (_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: i * 0.05, 
                type: "spring", 
                stiffness: 100 
              }}
              className="h-20 px-2 py-1 flex items-center justify-center text-xs text-gray-600 font-medium border-b border-gray-200"
            >
              <span className="bg-primary/5 px-2 py-1 rounded-md text-primary/80">
                {`${i.toString().padStart(2, '0')}:00`}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Appointments Grid */}
        <div className="relative bg-white">
          {/* Background Grid */}
          <div className="absolute inset-0">
            {Array.from({ length: 24 }, (_, i) => (
              <div
                key={i}
                className="h-20 border-b border-gray-100/50"
              />
            ))}
          </div>

          {/* Appointments Rendering */}
          {dayAppointments.map((appointment) => {
            // Convert UTC times to selected timezone for positioning
            const start = convertUTCToLocal(appointment.start_time, selectedTimezone);
            const end = convertUTCToLocal(appointment.end_time, selectedTimezone);
            const startMinutes = start.getHours() * 60 + start.getMinutes();
            const duration = (end.getTime() - start.getTime()) / (1000 * 60);
            const statusConfig = getStatusConfig(appointment.status);

            return (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20 
                }}
                className={`absolute left-2 right-2 p-2 rounded-lg border shadow-sm transition-all duration-300 
                  ${statusConfig.color} hover:shadow-md`}
                style={{
                  top: `${(startMinutes / (24 * 60)) * 100}%`,
                  height: `${(duration / (24 * 60)) * 100}%`,
                  minHeight: '40px'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {statusConfig.icon}
                    <span className={`text-sm font-medium ${statusConfig.text}`}>
                      {appointment.description || 'Appointment'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {appointment.party_size}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs opacity-70">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};