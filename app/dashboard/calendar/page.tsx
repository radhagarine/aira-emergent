'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useBusinessService } from '@/components/providers/service-provider';
import { Card } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import BusinessCalendarManager from './BusinessCalendarManager';
import { BusinessResponse } from '@/lib/services/business/types';
import { ServiceError } from '@/lib/types/shared/error.types';
import { toast } from 'sonner';

function CalendarPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const businessService = useBusinessService();
  
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const businessId = searchParams.get('business');

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch businesses using the business service
        const businessData = await businessService.getBusinessProfile(user.id);
        
        setBusinesses(businessData || []);
        
        if (businessData && businessData.length > 0) {
          // Use the specified business ID or default to the first one
          const targetBusinessId = businessId || businessData[0].id;
          const targetBusiness = businessData.find(business => business.id === targetBusinessId) || businessData[0];
          
          setSelectedBusiness(targetBusiness);
          setError(null);
          
          // Set URL parameter if not already set
          if (!businessId && targetBusiness.id) {
            router.push(`/dashboard/calendar?business=${targetBusiness.id}`);
          }
        } else {
          // No businesses found
          setBusinesses([]);
          setSelectedBusiness(null);
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching businesses:', error);
        
        if (error instanceof ServiceError) {
          setError(error.message);
        } else {
          setError('Failed to load business profiles');
        }
        
        setSelectedBusiness(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [businessId, user?.id, businessService, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-900">{error}</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please try again or contact support if the problem persists.
          </p>
        </div>
      </Card>
    );
  }

  if (!selectedBusiness) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">No Business Profile Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please create a business profile to start managing appointments.
          </p>
        </div>
      </Card>
    );
  }

  return <BusinessCalendarManager businessId={selectedBusiness.id} />;
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    }>
      <CalendarPageContent />
    </Suspense>
  );
}