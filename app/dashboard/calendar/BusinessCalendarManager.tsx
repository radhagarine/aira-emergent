'use client'
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useBusinessService } from '@/components/providers/service-provider';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import AppointmentsCalendar from './AppointmentsCalendar';
import { Loader2 } from 'lucide-react';
import { ServiceError } from '@/lib/types/shared/error.types';
import { toast } from 'sonner';
import { BusinessResponse } from '@/lib/services/business/types';

interface BusinessCalendarManagerProps {
  businessId: string;
}

const BusinessCalendarManager: React.FC<BusinessCalendarManagerProps> = ({ businessId }) => {
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([]);
  const [totalCapacity, setTotalCapacity] = useState<number | undefined>(undefined);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(businessId);
  const [businessTimezone, setBusinessTimezone] = useState<string>('America/New_York');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  // Use the business service from service layer
  const businessService = useBusinessService();

  // Fetch user's businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Use business service to fetch all businesses for the user
        const businessData = await businessService.getBusinessProfile(user.id);
        setBusinesses(businessData || []);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        if (error instanceof ServiceError) {
          toast.error(error.message);
        } else {
          toast.error('Failed to load businesses');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [user?.id, businessService]);

  // Update selected business when businessId prop changes
  useEffect(() => {
    setSelectedBusinessId(businessId);
  }, [businessId]);

  // Fetch business capacity and timezone
  useEffect(() => {
    const fetchBusinessCapacity = async () => {
      if (!selectedBusinessId) return;

      try {
        // Get detailed business information including type-specific details
        const businessDetails = await businessService.getBusinessDetails(selectedBusinessId);

        // Extract business timezone
        setBusinessTimezone(businessDetails.timezone || 'America/New_York');

        // Check business type and extract capacity
        if (businessDetails.type === 'restaurant') {
          // Get restaurant details from the response
          const restaurantDetails = Array.isArray(businessDetails.restaurant_details_v2)
            ? businessDetails.restaurant_details_v2[0]
            : businessDetails.restaurant_details_v2;

          if (restaurantDetails && restaurantDetails.seating_capacity) {
            setTotalCapacity(restaurantDetails.seating_capacity);
          }
        } else if (businessDetails.type === 'retail') {
          // For retail, we could use inventory_size or another metric
          // This depends on your business logic
          const retailDetails = Array.isArray(businessDetails.retail_details_v2)
            ? businessDetails.retail_details_v2[0]
            : businessDetails.retail_details_v2;

          if (retailDetails && retailDetails.inventory_size) {
            // Convert inventory size to capacity based on business rules
            // This is just an example formula
            const calculatedCapacity = Math.max(10, Math.min(200, Math.floor(retailDetails.inventory_size / 10)));
            setTotalCapacity(calculatedCapacity);
          } else {
            setTotalCapacity(50); // Default capacity for retail
          }
        } else if (businessDetails.type === 'service') {
          // For service, set a standard capacity if not defined elsewhere
          setTotalCapacity(50); // Default capacity for service business
        }
      } catch (error) {
        console.error('Error fetching business capacity:', error);
        if (error instanceof ServiceError) {
          toast.error(error.message);
        } else {
          toast.error('Failed to load business details');
        }
        // Use default capacity if there's an error
        setTotalCapacity(50);
      }
    };

    fetchBusinessCapacity();
  }, [selectedBusinessId, businessService]);

  const handleBusinessChange = (value: string) => {
    setSelectedBusinessId(value);
    // Update the URL to reflect the selected business
    router.push(`/dashboard/calendar?business=${value}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-sm text-gray-500">Loading business profiles...</p>
        </div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">No Business Profiles Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please create a business profile to start managing appointments.
          </p>
        </div>
      </Card>
    );
  }

  // Find the selected business
  const selectedBusiness = businesses.find(business => business.id === selectedBusinessId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Business Calendar for: {selectedBusiness?.name || 'Select a business'}
        </h1>
        <Select
          value={selectedBusinessId}
          onValueChange={handleBusinessChange}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a business" />
          </SelectTrigger>
          <SelectContent>
            {businesses.map((business) => (
              <SelectItem key={business.id} value={business.id}>
                <div className="flex flex-col">
                  <span>{business.name}</span>
                  <span className="text-sm text-gray-500">{business.type}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AppointmentsCalendar
        businessId={selectedBusinessId}
        businessTimezone={businessTimezone}
        totalCapacity={totalCapacity}
       />
    </div>
  );
};

export default BusinessCalendarManager;