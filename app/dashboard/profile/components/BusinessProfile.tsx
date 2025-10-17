'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BusinessCard from './BusinessCard';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  Building2, MapPin, Phone, Mail, ImageIcon,
  Factory, Loader2, Plus, X
} from 'lucide-react';

// Import hooks from the service layer
import { useAuth } from '@/components/providers/auth-provider';
import { useBusinessService } from '@/components/providers/service-provider';
import { ServiceError } from '@/lib/types/shared/error.types';
import { BusinessResponse, BusinessCreateData } from '@/lib/services/business/types';
import { BusinessType } from '@/lib/types/database/business.types';

interface FormData {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  type: BusinessType;
  profileImage: string | File | null;
}

const BusinessProfiles = () => {
  const { user } = useAuth();
  const businessService = useBusinessService();
  const router = useRouter();
  
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialFormState: FormData = {
    businessName: '',
    address: '',
    phone: '',
    email: '',
    type: 'restaurant',
    profileImage: null
  };

  const [formData, setFormData] = useState<FormData>(initialFormState);

  // Fetch businesses using the service layer
  useEffect(() => {
    if (user?.id) {
      fetchBusinesses();
    } else {
      // Clear businesses when user is not available
      setBusinesses([]);
      setLoading(false);
    }
  }, [user]);

  const fetchBusinesses = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await businessService.getBusinessProfile(user.id);
      setBusinesses(data);
    } catch (error) {
      console.error('[BusinessProfile] Error fetching businesses:', error);
      
      if (error instanceof ServiceError) {
        console.error(`[BusinessProfile] Service error: ${error.message}, Code: ${error.code}`);
        setError(error.message);
        toast.error(error.message);
      } else {
        console.error('[BusinessProfile] Unexpected error:', error instanceof Error ? error.message : String(error));
        setError("Failed to fetch businesses");
        toast.error("Failed to fetch businesses");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle edit business
  const handleEdit = (business: BusinessResponse) => {
    setSelectedBusiness(business);
    setFormData({
      businessName: business.name,
      address: business.address || '',
      phone: business.phone || '',
      email: business.email || '',
      type: business.type || 'restaurant',
      profileImage: business.profile_image
    });
    setIsEditing(true);
  };

  // Handle delete business
  const handleDelete = async (businessId: string) => {
    if (!confirm('Are you sure you want to delete this business?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await businessService.deleteBusiness(businessId);
      
      toast.success("Business deleted successfully");
      
      // Update local state by filtering out the deleted business
      setBusinesses(prevBusinesses => prevBusinesses.filter(b => b.id !== businessId));
    } catch (error) {
      console.error(`[BusinessProfile] Error deleting business ${businessId}:`, error);
      
      if (error instanceof ServiceError) {
        setError(error.message);
        toast.error(error.message);
      } else {
        setError("Failed to delete business");
        toast.error("Failed to delete business");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("You must be logged in to save a business profile");
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      // Prepare business data
      const businessData: BusinessCreateData = {
        user_id: user.id,
        name: formData.businessName,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        type: formData.type || 'restaurant',
        profile_image: formData.profileImage
      };

      if (isEditing && selectedBusiness) {
        // Update existing business
        const updateData = { 
          name: businessData.name,
          address: businessData.address,
          phone: businessData.phone,
          email: businessData.email,
          type: businessData.type,
          profile_image: businessData.profile_image,
          details: {} // Add empty details object to satisfy TypeSpecificUpdateData
        };
        
        const updatedBusiness = await businessService.updateBusiness(
          selectedBusiness.id, 
          updateData
        );
        
        toast.success("Business updated successfully");
        
        // Update businesses list with the updated business
        setBusinesses(prevBusinesses =>
          prevBusinesses.map(b => b.id === updatedBusiness.id ? updatedBusiness : b)
        );
      } else {
        // Create new business
        const newBusiness = await businessService.createBusiness(businessData);
        
        toast.success("Business created successfully");
        
        // Add the new business to the list
        setBusinesses(prevBusinesses => [...prevBusinesses, newBusiness]);
      }

      // Reset form after successful operation
      resetForm();
    } catch (error) {
      console.error('[BusinessProfile] Error in form submission:', error);
      
      if (error instanceof ServiceError) {
        console.error(`[BusinessProfile] Service error details - Code: ${error.code}, Message: ${error.message}`);
        setError(error.message);
        toast.error(error.message);
      } else {
        console.error('[BusinessProfile] Unexpected error details:', error instanceof Error ? error.message : String(error));
        setError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedBusiness(null);
    setIsEditing(false);
    setError(null);
  };

  const handleViewCalendar = (businessId: string) => {
    router.push(`/dashboard/calendar?business=${businessId}`);
  };

  // Handle profile image upload
  const handleImageUpload = async (file: File) => {
    try {
      // Use FileReader for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profileImage: file // Store the file object directly
        }));
      };
      
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('[BusinessProfile] Error processing image:', error);
      toast.error("Failed to process image");
    }
  };

  if (loading && !businesses.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error message if any */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Business List */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Your Businesses</CardTitle>
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-[#8B0000] hover:bg-[#6B0000]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Business
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {businesses.length > 0 ? (
              businesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  onEdit={() => handleEdit(business)}
                  onDelete={handleDelete}
                  onViewCalendar={handleViewCalendar}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No businesses found. Click "Add Business" to create one.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {selectedBusiness ? 'Edit Business' : 'Add New Business'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="flex items-center text-sm font-medium">
                    <Building2 className="h-4 w-4 text-[#8B0000] mr-2" />
                    Business Name *
                  </Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Enter your business name"
                    required
                    className="h-12 w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center text-sm font-medium">
                    <MapPin className="h-4 w-4 text-[#8B0000] mr-2" />
                    Business Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your business address"
                    className="h-12 w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center text-sm font-medium">
                    <Phone className="h-4 w-4 text-[#8B0000] mr-2" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                    type="tel"
                    className="h-12 w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center text-sm font-medium">
                    <Mail className="h-4 w-4 text-[#8B0000] mr-2" />
                    Email ID for Calendar
                  </Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email address"
                    type="email"
                    className="h-12 w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="flex items-center text-sm font-medium">
                    <Factory className="h-4 w-4 text-[#8B0000] mr-2" />
                    Business Type
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as BusinessType })}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Profile Image Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center text-sm font-medium">
                    <ImageIcon className="h-4 w-4 text-[#8B0000] mr-2" />
                    Profile Picture
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center space-y-4">
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {formData.profileImage ? (
                        typeof formData.profileImage === 'string' ? (
                          <img
                            src={formData.profileImage}
                            alt="Business Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={URL.createObjectURL(formData.profileImage as File)}
                            alt="Business Profile"
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <ImageIcon className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                    <input
                      type="file"
                      id="profileImage"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById('profileImage')?.click()}
                    >
                      Upload Image
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#8B0000] hover:bg-[#6B0000]"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Business'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BusinessProfiles;