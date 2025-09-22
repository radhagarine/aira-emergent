import React, { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { BusinessType } from '@/lib/types/database/business.types';

interface BusinessTypeFilterProps {
  selectedTypes: BusinessType[];
  onTypesChange: (types: BusinessType[]) => void;
}

export function BusinessTypeFilter({ 
  selectedTypes, 
  onTypesChange 
}: BusinessTypeFilterProps) {
  // Handle selection of a business type
  const handleTypeSelect = (type: BusinessType) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    onTypesChange(newTypes);
  };

  // Available business types
  const businessTypes: BusinessType[] = ['restaurant', 'retail', 'service'];

  return (
    <div className="flex items-center space-x-2">
      <Select 
        value={selectedTypes.length > 0 ? selectedTypes[0] : undefined}
        onValueChange={(value: BusinessType) => handleTypeSelect(value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Business Types">
            {selectedTypes.length > 0 
              ? selectedTypes.join(', ') 
              : "All Business Types"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {businessTypes.map(type => (
            <SelectItem 
              key={type} 
              value={type}
              className={`
                flex items-center justify-between 
                ${selectedTypes.includes(type) ? 'bg-gray-100' : ''}
              `}
            >
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              {selectedTypes.includes(type) && (
                <X className="h-4 w-4 text-gray-500" />
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Optional: Clear all button */}
      {selectedTypes.length > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onTypesChange([])}
          className="text-gray-500 hover:text-gray-700"
        >
          Clear
        </Button>
      )}
    </div>
  );
}