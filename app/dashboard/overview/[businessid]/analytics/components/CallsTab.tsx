import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PhoneIncoming, PhoneOutgoing, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

// Mock service - In a real implementation, you'd create a CallService
import { ServiceError } from '@/lib/types/shared/error.types'
import { toast } from 'sonner'

interface Call {
  id: number
  phoneNumber: string
  duration: string
  type: string
  timestamp: string
}

export interface CallsTabProps {
  calls: Array<{
    id: number;
    phoneNumber: string;
    duration: string;
    type: string;
    timestamp: string;
  }>;
}

export const CallsTab: React.FC<CallsTabProps> = ({ calls }) => {
  const [callsState, setCalls] = useState<Call[]>([]) // State to hold calls

  useEffect(() => {
    const fetchData = async () => {
      const fetchedCalls = await fetchCalls(calls)
      setCalls(fetchedCalls)
    }

    fetchData()
  }, [calls])

  // Placeholder for service-based call fetching
  const fetchCalls = async (calls: Array<{
    id: number;
    phoneNumber: string;
    duration: string;
    type: string;
    timestamp: string;
  }>): Promise<Call[]> => {
    // In a real implementation, this would use a CallService or 
    // existing performance/communication service
    try {
      // Simulate API call - replace with actual service method
      console.log(`Fetching calls for business ${calls}`);
      
      // Mock data generation
      return [
        { 
          id: 1, 
          phoneNumber: "+1 (555) 123-4567", 
          duration: "3m 45s", 
          type: "Inbound", 
          timestamp: new Date().toISOString() 
        },
        { 
          id: 2, 
          phoneNumber: "+1 (555) 987-6543", 
          duration: "2m 30s", 
          type: "Outbound", 
          timestamp: new Date().toISOString() 
        }
      ];
    } catch (error) {
      console.error('Error fetching calls:', error);
      
      if (error instanceof ServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to load call logs');
      }
      
      return [];
    }
  };

  /* // Mock calls - in a real implementation, this would be fetched dynamically
  const calls: Call[] = React.useMemo(() => {
    try {
      // In a real scenario, you'd use a useEffect and useState
      return fetchCalls(businessId);
    } catch (error) {
      console.error('Error getting calls:', error);
      return [];
    }
  }, [businessId]); */

  // Calculate some basic stats
  const totalCalls = calls.length
  const inboundCalls = calls.filter(call => call.type === 'Inbound').length
  const outboundCalls = calls.filter(call => call.type === 'Outbound').length

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-red-800 to-red-900 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-100">Total Calls</p>
                  <p className="text-3xl font-bold mt-2">{totalCalls}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-full">
                  <Phone className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-100">Inbound Calls</p>
                  <p className="text-3xl font-bold mt-2">{inboundCalls}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-full">
                  <PhoneIncoming className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Outbound Calls</p>
                  <p className="text-3xl font-bold mt-2">{outboundCalls}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-full">
                  <PhoneOutgoing className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Call Log Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="border-2 border-red-800/10 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-red-800/5 via-red-800/10 to-red-800/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-red-800">Call Log</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm">
                  <span className="flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700">
                    <PhoneIncoming className="h-4 w-4 mr-1" /> Inbound
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                    <PhoneOutgoing className="h-4 w-4 mr-1" /> Outbound
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold">Phone Number</TableHead>
                  <TableHead className="font-semibold">Duration</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call, index) => (
                  <motion.tr
                    key={call.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="group"
                  >
                    <TableCell className="font-medium">{call.phoneNumber}</TableCell>
                    <TableCell>{call.duration}</TableCell>
                    <TableCell>
                      {call.type === 'Inbound' ? (
                        <span className="flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 w-fit">
                          <PhoneIncoming className="h-4 w-4 mr-1" /> Inbound
                        </span>
                      ) : (
                        <span className="flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 w-fit">
                          <PhoneOutgoing className="h-4 w-4 mr-1" /> Outbound
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {format(new Date(call.timestamp), 'PPp')}
                    </TableCell>
                  </motion.tr>
                ))}
                {calls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      No call logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default CallsTab