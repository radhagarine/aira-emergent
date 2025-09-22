import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from 'date-fns'
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Clock, Loader2 } from 'lucide-react'

// Import appointment service
import { useAppointmentService } from '@/components/providers/service-provider'
import { AppointmentResponse } from '@/lib/services/appointment/types'
import { ServiceError } from '@/lib/types/shared/error.types'
import { toast } from 'sonner'

interface BookingsTabProps {
  businessId: string;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({ businessId }) => {
  const appointmentService = useAppointmentService();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Set loading state
        setLoading(true);

        // Fetch appointments using the appointment service
        const fetchedAppointments = await appointmentService.getAppointments(
          businessId, 
          { 
            start: new Date(new Date().getFullYear(), 0, 1), // Start of current year
            end: new Date() // Current date
          }
        );

        setAppointments(fetchedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        
        if (error instanceof ServiceError) {
          toast.error(error.message);
        } else {
          toast.error('Failed to load appointments');
        }
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchAppointments();
    }
  }, [businessId, appointmentService]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed':
        return (
          <Badge 
            variant="outline" 
            className="bg-green-50 text-green-800 border-green-200 px-3 py-1 font-medium"
          >
            Confirmed
          </Badge>
        )
      case 'pending':
        return (
          <Badge 
            variant="outline" 
            className="bg-yellow-50 text-yellow-800 border-yellow-200 px-3 py-1 font-medium"
          >
            Pending
          </Badge>
        )
      case 'completed':
        return (
          <Badge 
            variant="outline" 
            className="bg-blue-50 text-blue-800 border-blue-200 px-3 py-1 font-medium"
          >
            Completed
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge 
            variant="outline" 
            className="bg-red-50 text-red-800 border-red-200 px-3 py-1 font-medium"
          >
            Cancelled
          </Badge>
        )
      default:
        return (
          <Badge 
            variant="outline" 
            className="bg-gray-50 text-gray-800 border-gray-200 px-3 py-1 font-medium"
          >
            {status}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <Card className="border-2 border-red-800/10 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-red-800 to-red-900 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-semibold">Booking List</CardTitle>
          </div>
          <div className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
            {appointments.length} Bookings
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Description</TableHead>
                <TableHead className="font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    Date & Time
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    Party Size
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow 
                  key={appointment.id}
                  className="hover:bg-red-50/50 transition-colors duration-200"
                >
                  <TableCell className="font-medium">
                    {appointment.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {format(new Date(appointment.start_time), 'PP')}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(appointment.start_time), 'p')} - {format(new Date(appointment.end_time), 'p')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-red-100 text-red-800 px-2 py-1 rounded-md font-medium">
                        {appointment.party_size}
                      </div>
                      <span className="text-gray-500">guests</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    No appointments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}