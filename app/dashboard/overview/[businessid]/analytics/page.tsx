'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from '@/app/dashboard/overview/[businessid]/analytics/components/OverviewTab'
import { CallsTab } from '@/app/dashboard/overview/[businessid]/analytics/components/CallsTab'
import { BookingsTab } from '@/app/dashboard/overview/[businessid]/analytics/components/BookingTab'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ServiceError } from '@/lib/types/shared/error.types'
import { subMonths } from 'date-fns'

// Import directly instead of using hooks
import { businessService } from '@/lib/services/business/business.service'
import { advancedPerformanceService } from '@/lib/services/performance/advanced-performance.service' 

// Prepare analytics data to match the OverviewTab requirements
const prepareAnalyticsData = (metrics: any) => {
  return {
    id: metrics.businessId,
    name: metrics.businessName,
    type: metrics.businessType,
    metrics: {
      totalRevenue: metrics.totalCalls * 250, // Rough estimation
      averageOrderValue: 250, // Use a consistent value
      successfulBookings: Math.round(metrics.bookedPercentage * 2),
      customerSatisfaction: 4.5 // Consistent satisfaction rating
    },
    calls: [
      // Placeholder calls data - should be replaced with actual calls tracking
      { 
        id: 1, 
        phoneNumber: "+1 (555) 123-4567", 
        duration: "3m 45s", 
        type: "Inbound", 
        timestamp: new Date().toISOString() 
      }
    ],
    revenueData: [
      { name: 'Jan', revenue: 30000 },
      { name: 'Feb', revenue: 35000 },
      { name: 'Mar', revenue: 40000 },
      { name: 'Apr', revenue: 38000 },
      { name: 'May', revenue: 42000 },
      { name: 'Jun', revenue: 45000 },
    ],
    recentActivities: [
      { 
        id: 1, 
        action: "Performance Update", 
        details: `Total Calls: ${metrics.totalCalls}, Booked Rate: ${metrics.bookedPercentage}%`, 
        timestamp: "Just now" 
      }
    ]
  }
}

export default function BusinessAnalyticsPage() {
  const params = useParams();
  const businessId = params.businessid as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Fetch business and performance data
  useEffect(() => {
    const fetchBusinessAnalytics = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Use the direct service instances rather than hooks
        // Fetch business details
        const business = await businessService.getBusinessById(businessId);
        setBusinessName(business.name);

        // Define date range for last 3 months
        const dateRange = {
          startDate: subMonths(new Date(), 3),
          endDate: new Date()
        };

        // Fetch advanced performance metrics for detailed insights
        const performanceMetrics = await advancedPerformanceService.getDetailedBusinessPerformance(
          businessId, 
          { 
            startDate: dateRange.startDate, 
            endDate: dateRange.endDate 
          }
        );
        
        // Prepare analytics data
        const preparedData = prepareAnalyticsData(performanceMetrics);
        setAnalyticsData(preparedData);
      } catch (error) {
        console.error('Error fetching business analytics:', error);
        
        if (error instanceof ServiceError) {
          toast.error(error.message);
        } else {
          toast.error('Failed to load business analytics');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessAnalytics();
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">Unable to load business analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#8B0000]">{businessName} Analytics</h1>
          <p className="text-muted-foreground">{analyticsData.type} Business</p>
        </div>
        <Button className="bg-[#8B0000] hover:bg-[#6B0000]">Export Report</Button>
      </div>

      <Tabs 
        defaultValue="overview" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab data={analyticsData} />
        </TabsContent>

        <TabsContent value="calls">
          <CallsTab calls={analyticsData.calls} />
        </TabsContent>

        <TabsContent value="bookings">
          <BookingsTab businessId={businessId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}