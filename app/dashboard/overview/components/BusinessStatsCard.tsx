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
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Top gradient decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800 via-red-600 to-red-800" />
      
      <CardContent className="p-3 sm:p-4 relative">
        {/* Header with image and name - mobile responsive */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-3 mb-4 space-y-2 sm:space-y-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center shadow-sm overflow-hidden border border-border mx-auto sm:mx-0">
            {business.profile_image ? (
              <img
                src={business.profile_image}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-red-800 dark:text-red-400" />
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-foreground truncate group-hover:text-red-800 dark:group-hover:text-red-400 transition-colors duration-300">
              {business.name}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{business.type}</p>
          </div>
        </div>

        {/* Statistics Grid - mobile responsive */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md">
          {/* Total Calls */}
          <div className="p-1.5 sm:p-2 bg-secondary/50 dark:bg-secondary/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300 border border-border">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="text-xs">Calls</span>
            </div>
            <p className="text-sm sm:text-lg font-semibold text-foreground mt-0.5">{business.totalCalls}</p>
          </div>

          {/* Booked Percentage */}
          <div className="p-1.5 sm:p-2 bg-secondary/50 dark:bg-secondary/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300 border border-border">
            <div className="flex items-center gap-1 text-muted-foreground">
              <BarChart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="text-xs">Booked</span>
            </div>
            <p className={`text-sm sm:text-lg font-semibold ${getPercentageColor(business.bookedPercentage)} mt-0.5`}>
              {business.bookedPercentage}%
            </p>
          </div>

          {/* Success Rate */}
          <div className="p-1.5 sm:p-2 bg-secondary/50 dark:bg-secondary/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300 border border-border">
            <div className="flex items-center gap-1 text-muted-foreground">
              <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="text-xs">Success</span>
            </div>
            <p className={`text-sm sm:text-lg font-semibold ${getPercentageColor(business.successPercentage)} mt-0.5`}>
              {business.successPercentage}%
            </p>
          </div>

          {/* Failure Rate */}
          <div className="p-1.5 sm:p-2 bg-secondary/50 dark:bg-secondary/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300 border border-border">
            <div className="flex items-center gap-1 text-muted-foreground">
              <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="text-xs">Failure</span>
            </div>
            <p className={`text-sm sm:text-lg font-semibold ${getPercentageColor(100 - business.failurePercentage)} mt-0.5`}>
              {business.failurePercentage}%
            </p>
          </div>
        </div>

        {/* View Details Button - mobile responsive */}
        <div className="mt-3 sm:mt-4 text-center">
          <button
            onClick={handleViewDetails}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-red-800 dark:text-red-400 hover:text-white bg-red-50 dark:bg-red-900/20 hover:bg-red-800 dark:hover:bg-red-600 rounded-lg transition-colors duration-300 inline-block border border-red-200 dark:border-red-700 w-full sm:w-auto"
          >
            View Details
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessStatsCard;