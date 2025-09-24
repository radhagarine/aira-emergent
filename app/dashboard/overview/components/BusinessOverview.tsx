// BusinessOverview.tsx
'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DateRangeCalendar } from "@/components/ui/date-range-calendar"
import { format, startOfMonth, endOfMonth } from "date-fns"
import BusinessStatsCard from './BusinessStatsCard'
import { Loader2 } from 'lucide-react'

// Import services and types
import { useAuth } from '@/components/providers/auth-provider'
import { useBusinessService } from '@/components/providers/service-provider'
import { 
  BusinessResponse 
} from '@/lib/services/business/types'
import { 
  performanceService, 
  BusinessPerformanceMetrics 
} from '@/lib/services/performance/performance.service'
import { ServiceError } from '@/lib/types/shared/error.types'
import { toast } from 'sonner'
import { User } from '@supabase/supabase-js'

// Safe wrapper for service hook access
const useSafeBusinessService = () => {
  try {
    return useBusinessService();
  } catch (error) {
    console.error("Error accessing business service:", error);
    return null;
  }
};

const calculateOverallStats = (businesses: BusinessPerformanceMetrics[]) => {
  if (!businesses.length) {
    return {
      totalCalls: 0,
      avgBooked: '0',
      avgSuccess: '0'
    };
  }

  const totalCalls = businesses.reduce((sum, business) => sum + business.totalCalls, 0);
  const avgBooked = businesses.reduce((sum, business) => sum + business.bookedPercentage, 0) / businesses.length;
  const avgSuccess = businesses.reduce((sum, business) => sum + business.successPercentage, 0) / businesses.length;
  
  return {
    totalCalls,
    avgBooked: avgBooked.toFixed(1),
    avgSuccess: avgSuccess.toFixed(1)
  };
};

export default function OverviewPage() {
  const router = useRouter();
  
  // Attempt to access auth context with proper typing
  let user: User | null = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    console.error("Auth context error:", error);
  }
  
  // Attempt to access business service
  const businessService = useSafeBusinessService();
  
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<(BusinessResponse & BusinessPerformanceMetrics)[]>([]);
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });


  useEffect(() => {
    const fetchBusinessPerformance = async () => {
      if (!user?.id || !businessService) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch business profiles
        const businessProfiles = await businessService.getBusinessProfile(user.id);
        
        // Fetch performance metrics for each business
        const performanceMetrics = await performanceService.getUserBusinessesPerformanceMetrics(
          user.id,
          {
            startDate: dateRange?.from,
            endDate: dateRange?.to
          }
        );
        
        // Merge business profiles with performance metrics
        const mergedBusinesses = businessProfiles.map(business => ({
          ...business,
          ...performanceMetrics.find(metric => metric.businessId === business.id) || {
            totalCalls: 0,
            bookedPercentage: 0,
            successPercentage: 0,
            failurePercentage: 0,
            businessId: business.id,
            businessName: business.name
          }
        }));

        setBusinesses(mergedBusinesses);
      } catch (error) {
        console.error('Error fetching business performance:', error);
        
        if (error instanceof ServiceError) {
          toast.error(error.message);
        } else {
          toast.error('Failed to load business performance');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessPerformance();
  }, [user?.id, dateRange, businessService]);

  const handleViewBusinessDetails = (businessId: string) => {
    // Directly navigate to the business details page using the router
    console.log('Navigating to business analytics page:', businessId);
    try {
      router.push(`/dashboard/overview/${businessId}/analytics`);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to direct URL navigation if router fails
      window.location.href = `/dashboard/overview/${businessId}/analytics`;
    }
  };

  const overallStats = calculateOverallStats(businesses);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground">No Business Profiles Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please create a business profile to view performance metrics.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-screen overflow-hidden p-4 space-y-4">
      {/* Header with Date Range Picker */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Overview</h1>
          <p className="text-sm text-muted-foreground">Performance metrics and insights</p>
        </div>
        <DateRangeCalendar
          value={dateRange}
          onChange={setDateRange}
          className="flex-shrink-0"
        />
      </div>

      {/* Content Grid - Optimized for viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-140px)]">

        {/* Left Column - Overall Performance */}
        <div className="lg:col-span-3 space-y-4">
          {/* Overall Performance Metrics */}
          <Card className="bg-card/95 backdrop-blur border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-800/10 dark:bg-red-400/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-800 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <CardTitle className="text-lg font-bold text-foreground">Overall Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4">
                {/* Total Calls */}
                <div className="bg-background/50 border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <svg className="w-3 h-3 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Total Calls</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{overallStats.totalCalls.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">All communications</p>
                </div>

                {/* Average Booking Rate */}
                <div className="bg-background/50 border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Booking Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{overallStats.avgBooked}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Conversion rate</p>
                </div>

                {/* Average Success Rate */}
                <div className="bg-background/50 border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Success Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{overallStats.avgSuccess}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Success average</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Performance */}
          <Card className="bg-card/95 backdrop-blur border-border/50 shadow-lg flex-1 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-800/10 dark:bg-red-400/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-800 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <CardTitle className="text-lg font-bold text-foreground">Business Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 overflow-auto max-h-[400px]">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {businesses.map((business) => (
                  <BusinessStatsCard
                    key={business.id}
                    business={business}
                    onViewDetails={handleViewBusinessDetails}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}