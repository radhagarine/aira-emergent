import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from 'lucide-react';
import { BusinessResponse } from '@/lib/services/business/types';

interface BusinessSelectorProps {
  businesses: BusinessResponse[];
  selectedBusinessId: string;
  onChange: (businessId: string) => void;
}

const BusinessSelector: React.FC<BusinessSelectorProps> = ({
  businesses,
  selectedBusinessId,
  onChange
}) => {
  return (
    <Select 
      value={selectedBusinessId} 
      onValueChange={onChange}
    >
      <SelectTrigger className="w-full sm:w-[250px]">
        <SelectValue placeholder="Select business" />
      </SelectTrigger>
      <SelectContent>
        {businesses.map((business) => (
          <SelectItem 
            key={business.id} 
            value={business.id}
          >
            <div className="flex items-center min-w-0">
              <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{business.name}</span>
              <span className="ml-2 text-xs text-gray-500 flex-shrink-0">({business.type})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default BusinessSelector;