'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
  X,
  AlertCircle,
  Loader2,
  Grid,
  List,
  Columns
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppointmentResponse, DateRange } from '@/lib/services/appointment/types';
import { useAppointmentService } from '@/components/providers/service-provider';
import { ServiceError } from '@/lib/types/shared/error.types';
import { toast } from 'sonner';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { Appointment, AppointmentStatus, CalendarView, StatusConfig } from '@/app/dashboard/calendar/type';

interface AppointmentsCalendarProps {
  businessId: string;
  totalCapacity?: number;
}

const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({ 
  businessId,
  totalCapacity = 50
 }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [view, setView] = useState<CalendarView>('month');
  const [loading, setLoading] = useState(true);
  
  // Get the appointment service from the service layer
  const appointmentService = useAppointmentService();

  const getDateRange = (): DateRange => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    switch (view) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        end.setDate(end.getDate() - end.getDay() + 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
    }
    return { start, end };
  };

  useEffect(() => {
    const fetchAppointments = async (): Promise<void> => {
      if (!businessId) return;
      
      setLoading(true);
      const dateRange = getDateRange();
      
      try {
        console.log('Fetching appointments:', {
          businessId,
          dateRange: { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() }
        });
  
        // Use the appointment service instead of direct Supabase calls
        const appointmentsData = await appointmentService.getAppointments(
          businessId,
          dateRange
        );

        console.log('Successfully fetched appointments:', {
          count: appointmentsData?.length || 0
        });
        
        // Convert AppointmentResponse[] to our local Appointment[] type
        const formattedAppointments: Appointment[] = appointmentsData.map(apt => ({
          id: apt.id,
          user_id: apt.user_id,
          start_time: apt.start_time,
          end_time: apt.end_time,
          status: apt.status as AppointmentStatus,
          description: apt.description || null,
          party_size: apt.party_size || 1,
          created_at: apt.created_at,
          updated_at: apt.updated_at
        }));
        
        setAppointments(formattedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        
        if (error instanceof ServiceError) {
          toast.error(error.message);
        } else {
          toast.error('Failed to load appointments');
        }
        
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAppointments();
  }, [currentDate, view, businessId, appointmentService]);

  const getStatusConfig = (status: AppointmentStatus): StatusConfig => {
    const configs: Record<AppointmentStatus, StatusConfig> = {
      pending: {
        color: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
        icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
        text: 'text-amber-700'
      },
      confirmed: {
        color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
        icon: <Check className="h-4 w-4 text-emerald-500" />,
        text: 'text-emerald-700'
      },
      cancelled: {
        color: 'bg-red-50 hover:bg-red-100 border-red-200',
        icon: <X className="h-4 w-4 text-red-500" />,
        text: 'text-red-700'
      },
      completed: {
        color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
        icon: <Check className="h-4 w-4 text-blue-500" />,
        text: 'text-blue-700'
      },
      no_show: {
        color: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
        icon: <X className="h-4 w-4 text-gray-500" />,
        text: 'text-gray-700'
      }
    };
    return configs[status];
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const navigate = (direction: 'prev' | 'next'): void => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      switch (view) {
        case 'day':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'month':
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
          break;
      }
      return newDate;
    });
  };

  const formatDateRange = (): string => {
    switch (view) {
      case 'day':
        return currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });
      case 'week': {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${
          end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }`;
      }
      case 'month':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      default:
        return '';
    }
  };

  const renderView = () => {
    const commonProps = {
      appointments,
      currentDate,
      getStatusConfig,
      formatTime,
      totalCapacity
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="text-sm text-gray-500">Loading appointments...</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'day':
        return <DayView {...commonProps} />;
      case 'week':
        return <WeekView {...commonProps} />;
      case 'month':
        return <MonthView {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Calendar Header */}
      <div className="bg-gradient-to-br from-[#8B0000] to-[#5C0000] text-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white"
              onClick={() => navigate('prev')}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-white/80" />
              <span className="text-lg font-semibold tracking-wide">
                {formatDateRange()}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white"
              onClick={() => navigate('next')}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Select 
              value={view} 
              onValueChange={(value: CalendarView) => setView(value)}
            >
              <SelectTrigger className="bg-white/20 border-none text-white hover:bg-white/30 w-40">
                <SelectValue placeholder="Select view">
                  <div className="flex items-center gap-2">
                    {view === 'day' && <List className="h-4 w-4" />}
                    {view === 'week' && <Columns className="h-4 w-4" />}
                    {view === 'month' && <Grid className="h-4 w-4" />}
                    <span className="capitalize">{view} View</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white text-[#8B0000]">
                <SelectItem value="day" className="hover:bg-red-50">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" /> Day View
                  </div>
                </SelectItem>
                <SelectItem value="week" className="hover:bg-red-50">
                  <div className="flex items-center gap-2">
                    <Columns className="h-4 w-4" /> Week View
                  </div>
                </SelectItem>
                <SelectItem value="month" className="hover:bg-red-50">
                  <div className="flex items-center gap-2">
                    <Grid className="h-4 w-4" /> Month View
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Calendar Content with Animated Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 border-[#8B0000]/10 shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-0">
              {renderView()}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AppointmentsCalendar;