import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { DollarSign, Users, TrendingUp, TrendingDown, Clock, Activity, Award, ThumbsUp } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts'
import { motion } from 'framer-motion'

// Import services
import { useAuth } from '@/components/providers/auth-provider'
import { performanceService, BusinessPerformanceMetrics } from '@/lib/services/performance/performance.service'
import { advancedPerformanceService, DetailedPerformanceMetrics } from '@/lib/services/performance/advanced-performance.service'
import { ServiceError } from '@/lib/types/shared/error.types'
import { toast } from 'sonner'

interface MetricCardProps {
  title: string;
  value: number | string;
  change: string;
  icon: React.ElementType;
  prefix?: string;
  description?: string;
}

interface OverviewTabProps {
  data: {
    id: string;
    name: string;
    type: string;
    metrics: {
      totalRevenue: number;
      averageOrderValue: number;
      successfulBookings: number;
      customerSatisfaction: number;
    };
    calls: Array<{
      id: number;
      phoneNumber: string;
      duration: string;
      type: string;
      timestamp: string;
    }>;
    revenueData: Array<{
      name: string;
      revenue: number;
    }>;
    recentActivities: Array<{
      id: number;
      action: string;
      details: string;
      timestamp: string;
    }>;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, prefix = '', description }) => {
  const isPositive = parseFloat(change) > 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Card className="overflow-hidden relative">
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-br from-red-800/20 to-red-800/5 pointer-events-none" />
        
        {/* Top accent line with shimmer effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800/50 via-red-800 to-red-800/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>

        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-50 to-red-100 
                              group-hover:from-red-100 group-hover:to-red-200 transition-colors duration-300">
                  <Icon className="h-5 w-5 text-[#8B0000]" />
                </div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
              </div>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-bold bg-gradient-to-br from-[#8B0000] to-red-700 bg-clip-text text-transparent">
                  {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
                </h3>
                <motion.div 
                  className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {change}
                </motion.div>
              </div>
              {description && (
                <p className="text-xs text-gray-500">{description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: any;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-[#8B0000] font-semibold">
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ data }) => {
  const [loading, setLoading] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState<DetailedPerformanceMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<Array<{name: string, revenue: number}>>([]);
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: number
    action: string
    details: string
    timestamp: string
  }>>([]);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);

        // Fetch detailed performance metrics
        const metrics = await advancedPerformanceService.getDetailedBusinessPerformance(
          data.id, 
          { 
            startDate: new Date(new Date().getFullYear(), 0, 1), 
            endDate: new Date() 
          }
        );

        setPerformanceMetrics(metrics);

        // Mock revenue data - in a real scenario, this would come from a revenue service
        const mockRevenueData = [
          { name: 'Jan', revenue: 30000 },
          { name: 'Feb', revenue: 35000 },
          { name: 'Mar', revenue: 40000 },
          { name: 'Apr', revenue: 38000 },
          { name: 'May', revenue: 42000 },
          { name: 'Jun', revenue: 45000 },
        ];
        setRevenueData(mockRevenueData);

        // Mock recent activities - would ideally come from a dedicated service
        const mockActivities = [
          { id: 1, action: "New booking", details: "Table for 4 at 7:30 PM", timestamp: "2 hours ago" },
          { id: 2, action: "Customer feedback", details: "5-star rating received", timestamp: "4 hours ago" },
          { id: 3, action: "Menu update", details: "Added new seasonal items", timestamp: "Yesterday" },
        ];
        setRecentActivities(mockActivities);

      } catch (error) {
        console.error('Error fetching performance data:', error);
        
        if (error instanceof ServiceError) {
          toast.error(error.message);
        } else {
          toast.error('Failed to load performance metrics');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [data.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!performanceMetrics) {
    return (
      <div className="text-center py-8 text-gray-500">
        No performance data available
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Calls"
          value={performanceMetrics.totalCalls}
          change="+20.1%"
          icon={Users}
          description="Total number of calls"
        />
        <MetricCard
          title="Avg. Response Time"
          value={performanceMetrics.averageResponseTime.toFixed(1)}
          change="+4.75%"
          icon={Clock}
          prefix=""
          description="Average response time in minutes"
        />
        <MetricCard
          title="Booked Rate"
          value={performanceMetrics.bookedPercentage}
          change="+12.3%"
          icon={Award}
          prefix=""
          description="Percentage of booked appointments"
        />
        <MetricCard
          title="Success Rate"
          value={performanceMetrics.successPercentage}
          change="+0.3"
          icon={ThumbsUp}
          prefix=""
          description="Percentage of successful appointments"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <motion.div 
          className="col-span-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden">
            <div className="absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-br from-red-800/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800/50 via-red-800 to-red-800/50" />
            
            <CardHeader>
              <CardTitle className="text-lg font-semibold bg-gradient-to-br from-[#8B0000] to-red-700 bg-clip-text text-transparent">
                Revenue Overview
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B0000" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8B0000" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8B0000"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          className="col-span-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden h-full">
            <div className="absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-br from-red-800/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800/50 via-red-800 to-red-800/50" />
            
            <CardHeader>
              <CardTitle className="text-lg font-semibold bg-gradient-to-br from-[#8B0000] to-red-700 bg-clip-text text-transparent">
                Recent Activities
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-4 p-3 rounded-lg hover:bg-red-50/50 transition-colors duration-200"
                  >
                    <div className="p-2 rounded-full bg-gradient-to-br from-red-50 to-red-100">
                      <Clock className="h-4 w-4 text-[#8B0000]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500 truncate">{activity.details}</p>
                    </div>
                    <div className="text-sm text-gray-500 whitespace-nowrap">{activity.timestamp}</div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default OverviewTab;