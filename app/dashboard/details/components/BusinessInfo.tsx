import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { BusinessType } from '@/lib/types/database/business.types';

interface BusinessInfoProps {
  businessId: string;
  businessType: BusinessType;
  typeDetails: any;
  onChange: (updates: any) => void;
}

const BusinessInfo: React.FC<BusinessInfoProps> = ({
  businessId,
  businessType,
  typeDetails,
  onChange
}) => {

  // Handler for type-specific detail changes
  const handleTypeDetailsChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };
  
  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {/* Type-Specific Details Card */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            {businessType === 'restaurant' ? 'Restaurant Details' :
             businessType === 'retail' ? 'Retail Details' :
             businessType === 'service' ? 'Service Details' :
             'Business Details'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* Render fields based on business type */}
          {businessType === 'restaurant' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="menuItems">Menu Items</Label>
                <Textarea
                  id="menuItems"
                  value={typeDetails.menu_items || ''}
                  onChange={(e) => handleTypeDetailsChange('menu_items', e.target.value)}
                  placeholder="Enter menu items"
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cuisineType">Cuisine Type</Label>
                <Input
                  id="cuisineType"
                  value={typeDetails.cuisine_type || ''}
                  onChange={(e) => handleTypeDetailsChange('cuisine_type', e.target.value)}
                  placeholder="Enter cuisine type"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seatingCapacity">Seating Capacity</Label>
                <Input
                  id="seatingCapacity"
                  type="number"
                  value={typeDetails.seating_capacity || ''}
                  onChange={(e) => handleTypeDetailsChange('seating_capacity', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Enter seating capacity"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deliveryAvailable"
                    checked={typeDetails.delivery_available || false}
                    onCheckedChange={(checked) => handleTypeDetailsChange('delivery_available', checked)}
                  />
                  <Label htmlFor="deliveryAvailable">Delivery Available</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="takeoutAvailable"
                    checked={typeDetails.takeout_available || false}
                    onCheckedChange={(checked) => handleTypeDetailsChange('takeout_available', checked)}
                  />
                  <Label htmlFor="takeoutAvailable">Takeout Available</Label>
                </div>
              </div>
            </>
          )}
          
          {businessType === 'retail' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="storeType">Store Type</Label>
                <Input
                  id="storeType"
                  value={typeDetails.store_type || ''}
                  onChange={(e) => handleTypeDetailsChange('store_type', e.target.value)}
                  placeholder="Enter store type"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="inventorySize">Inventory Size</Label>
                <Input
                  id="inventorySize"
                  type="number"
                  value={typeDetails.inventory_size || ''}
                  onChange={(e) => handleTypeDetailsChange('inventory_size', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Enter inventory size"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasOnlineStore"
                    checked={typeDetails.has_online_store || false}
                    onCheckedChange={(checked) => handleTypeDetailsChange('has_online_store', checked)}
                  />
                  <Label htmlFor="hasOnlineStore">Has Online Store</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="retailDeliveryAvailable"
                    checked={typeDetails.delivery_available || false}
                    onCheckedChange={(checked) => handleTypeDetailsChange('delivery_available', checked)}
                  />
                  <Label htmlFor="retailDeliveryAvailable">Delivery Available</Label>
                </div>
              </div>
            </>
          )}
          
          {businessType === 'service' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Input
                  id="serviceType"
                  value={typeDetails.service_type || ''}
                  onChange={(e) => handleTypeDetailsChange('service_type', e.target.value)}
                  placeholder="Enter service type"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="serviceArea">Service Area</Label>
                <Input
                  id="serviceArea"
                  value={typeDetails.service_area || ''}
                  onChange={(e) => handleTypeDetailsChange('service_area', e.target.value)}
                  placeholder="Enter service area"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isMobileService"
                    checked={typeDetails.is_mobile_service || false}
                    onCheckedChange={(checked) => handleTypeDetailsChange('is_mobile_service', checked)}
                  />
                  <Label htmlFor="isMobileService">Mobile Service</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiresBooking"
                    checked={typeDetails.requires_booking || false}
                    onCheckedChange={(checked) => handleTypeDetailsChange('requires_booking', checked)}
                  />
                  <Label htmlFor="requiresBooking">Requires Booking</Label>
                </div>
              </div>
            </>
          )}
          
          {/* Operating Hours - Common for all business types */}
          <div className="space-y-2 pt-4">
            <Label htmlFor="operatingHours">Operating Hours</Label>
            <Textarea
              id="operatingHours"
              value={typeDetails.operating_hours || ''}
              onChange={(e) => handleTypeDetailsChange('operating_hours', e.target.value)}
              placeholder="Enter operating hours"
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessInfo;