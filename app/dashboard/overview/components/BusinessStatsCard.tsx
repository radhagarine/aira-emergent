import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Phone, BarChart, XCircle, CheckCircle, Building2 } from 'lucide-react';
import { BusinessResponse } from '@/lib/services/business/types';
import { BusinessPerformanceMetrics } from '@/lib/services/performance/performance.service';

// Combine BusinessResponse with performance metrics
type BusinessStatsType = BusinessResponse & BusinessPerformanceMetrics;

interface BusinessStatsCardProps {
  business: BusinessStatsType;
  onViewDetails?: (businessId: string) => void;
}

const BusinessStatsCard: React.FC<BusinessStatsCardProps> = ({ 
  business, 
  onViewDetails 
}) => {
  const router = useRouter();
  
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Simple navigation without service dependencies
  const handleViewDetails = () => {
    console.log('In businessstats card business id =', business.id);
    try {
      if (onViewDetails) {
        onViewDetails(business.id);
      } else {
        // Direct navigation as fallback using the router directly
        router.push(`/dashboard/overview/${business.id}/analytics`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Ensure we can always navigate, even if services aren't available
      window.location.href = `/dashboard/overview/${business.id}/analytics`;
    }
  };

  return (
    <Card className="group relative overflow-hidden bg-card/95 backdrop-blur border-border/50 hover:border-red-800/20 dark:hover:border-red-400/20 transition-all duration-300 hover:shadow-lg rounded-lg">
      {/* Top gradient decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800 via-red-600 to-red-800" />

      <CardContent className="p-4 relative">
        {/* Header - More compact */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shadow-sm overflow-hidden border border-red-200/50 dark:border-red-800/50">
              {business.profile_image ? (
                <img
                  src={business.profile_image}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="h-5 w-5 text-red-800 dark:text-red-400" />
              )}
            </div>
            {/* Online status indicator */}
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-background shadow-sm">
              <div className="w-full h-full rounded-full bg-green-500 animate-pulse"></div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate group-hover:text-red-800 dark:group-hover:text-red-400 transition-colors duration-300">
              {business.name}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200/50 dark:border-red-800/50">
              {business.type}
            </span>
          </div>
        </div>

        {/* Statistics Grid - Horizontal layout for better width usage */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {/* Total Calls */}
          <div className="bg-background/50 border border-border/50 rounded p-2 hover:shadow-sm transition-all">
            <div className="flex items-center gap-1 mb-1">
              <Phone className="h-3 w-3 text-slate-600 dark:text-slate-400" />
              <span className="text-xs text-muted-foreground">Calls</span>
            </div>
            <p className="text-sm font-bold text-foreground">{business.totalCalls}</p>
          </div>

          {/* Booked Percentage */}
          <div className="bg-background/50 border border-border/50 rounded p-2 hover:shadow-sm transition-all">
            <div className="flex items-center gap-1 mb-1">
              <BarChart className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="text-xs text-muted-foreground">Booked</span>
            </div>
            <p className={`text-sm font-bold ${getPercentageColor(business.bookedPercentage)}`}>
              {business.bookedPercentage}%
            </p>
          </div>

          {/* Success Rate */}
          <div className="bg-background/50 border border-border/50 rounded p-2 hover:shadow-sm transition-all">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="text-xs text-muted-foreground">Success</span>
            </div>
            <p className={`text-sm font-bold ${getPercentageColor(business.successPercentage)}`}>
              {business.successPercentage}%
            </p>
          </div>

          {/* Failure Rate */}
          <div className="bg-background/50 border border-border/50 rounded p-2 hover:shadow-sm transition-all">
            <div className="flex items-center gap-1 mb-1">
              <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
              <span className="text-xs text-muted-foreground">Failure</span>
            </div>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {business.failurePercentage}%
            </p>
          </div>
        </div>

        {/* View Details Button - More compact */}
        <button
          onClick={handleViewDetails}
          className="w-full bg-red-800 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 text-white font-medium py-2 px-3 rounded transition-all duration-300 hover:shadow-md group/btn text-sm"
        >
          <span className="flex items-center justify-center gap-1">
            View Details
            <svg className="w-3 h-3 transform group-hover/btn:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </CardContent>
    </Card>
  );
};

export default BusinessStatsCard;