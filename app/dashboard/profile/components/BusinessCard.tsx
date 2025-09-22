import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2, MapPin, Phone, Mail, Calendar,
  Edit, Trash2
} from 'lucide-react';

import { BusinessResponse } from '@/lib/services/business/types';

interface BusinessCardProps {
  business: BusinessResponse;
  onEdit: (business: BusinessResponse) => void;
  onDelete: (businessId: string) => void;
  onViewCalendar: (businessId: string) => void;
}



const BusinessCard: React.FC<BusinessCardProps> = ({ 
  business, 
  onEdit, 
  onDelete, 
  onViewCalendar 
}) => {
  // Create separate handler functions to prevent event bubbling
  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(business);
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(business.id);
  };

  const handleCalendarView = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onViewCalendar(business.id);
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Top gradient decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800 via-red-600 to-red-800" />
      
      <CardContent className="p-4 sm:p-6 relative">
        {/* Background pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
          <Building2 className="w-full h-full" />
        </div>

        {/* Header with image and name - responsive layout */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-4 mb-6 space-y-4 sm:space-y-0">
          {/* Profile image - centered on mobile */}
          <div className="flex justify-center sm:justify-start">
            {business.profile_image ? (
              <div className="relative group-hover:scale-105 transition-transform duration-300">
                <img
                  src={business.profile_image}
                  alt={business.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shadow-md"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-black/0 to-black/20" />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 border border-border">
                <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-red-800 dark:text-red-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-red-800 dark:group-hover:text-red-400 transition-colors duration-300">
              {business.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 sm:mb-2">{business.type}</p>

            {/* Action buttons with improved mobile layout */}
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-y-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCalendarView}
                className="bg-background hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-800 dark:hover:text-red-400 transition-colors duration-300 w-full sm:w-auto"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="bg-background hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-800 dark:hover:text-red-400 transition-colors duration-300 flex-1 sm:min-w-[40px] sm:flex-none flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 sm:mr-0 mr-1" />
                  <span className="sm:sr-only">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="bg-background hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-800 dark:hover:text-red-400 transition-colors duration-300 flex-1 sm:min-w-[40px] sm:flex-none flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4 sm:mr-0 mr-1" />
                  <span className="sm:sr-only">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact details with hover effects - mobile optimized */}
        <div className="space-y-2 sm:space-y-3 text-sm">
          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300">
            <MapPin className="h-4 w-4 text-red-800 dark:text-red-400 flex-shrink-0" />
            <p className="text-muted-foreground truncate text-xs sm:text-sm">{business.address || 'No address provided'}</p>
          </div>

          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300">
            <Phone className="h-4 w-4 text-red-800 dark:text-red-400 flex-shrink-0" />
            <p className="text-muted-foreground text-xs sm:text-sm">{business.phone || 'No phone provided'}</p>
          </div>

          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300">
            <Mail className="h-4 w-4 text-red-800 dark:text-red-400 flex-shrink-0" />
            <p className="text-muted-foreground truncate text-xs sm:text-sm">{business.email || 'No email provided'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessCard;