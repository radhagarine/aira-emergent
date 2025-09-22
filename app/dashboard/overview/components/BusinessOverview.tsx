// BusinessOverview.tsx
'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DateRange } from "react-day-picker"
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
  const [date, setDate] = useState<DateRange | undefined>({
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
            startDate: date?.from,
            endDate: date?.to
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
  }, [user?.id, date, businessService]);

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
    <div className="space-y-8">
      {/* Date Range Selector - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full sm:w-[300px] justify-start text-left font-normal ${
                !date && "text-muted-foreground"
              }`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Overall Performance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="p-3 sm:p-4 bg-secondary/50 dark:bg-secondary/30 rounded-lg border border-border">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Calls</p>
              <p className="text-xl sm:text-2xl font-semibold text-foreground">{overallStats.totalCalls}</p>
            </div>
            <div className="p-3 sm:p-4 bg-secondary/50 dark:bg-secondary/30 rounded-lg border border-border">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Average Booking Rate</p>
              <p className="text-xl sm:text-2xl font-semibold text-green-600 dark:text-green-400">{overallStats.avgBooked}%</p>
            </div>
            <div className="p-3 sm:p-4 bg-secondary/50 dark:bg-secondary/30 rounded-lg border border-border sm:col-span-2 md:col-span-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Average Success Rate</p>
              <p className="text-xl sm:text-2xl font-semibold text-green-600 dark:text-green-400">{overallStats.avgSuccess}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Performance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Business Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
  );
}