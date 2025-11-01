'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';

// Import services and types
import { useAuth } from '@/components/providers/auth-provider';
import { useBusinessService, useFileService } from '@/components/providers/service-provider';
import { BusinessResponse } from '@/lib/services/business/types';
import { ServiceError } from '@/lib/types/shared/error.types';
import { useSupabase } from '@/components/providers/supabase-provider';

// Import Zustand store
import { useBusinessStore } from '@/app/dashboard/details/stores/BusinessStore';

// Import simplified components
import BusinessSelector from '@/app/dashboard/details/components/BusinessSelector';
import BusinessInfo from '@/app/dashboard/details/components/BusinessInfo';
import CustomerSettings from '@/app/dashboard/details/components/CustomerSettings';
import FileManager from '@/app/dashboard/details/components/FileManager';

export default function BusinessDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const businessService = useBusinessService();
  const fileService = useFileService();
  
  // Get Zustand store values and actions
  const { selectedBusinessId, setSelectedBusinessId } = useBusinessStore();
  
  // Main states
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessResponse | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states - centralized
  const [formData, setFormData] = useState({
    typeDetails: {}, // Will hold type-specific fields
    customerSettings: {
      ai_communication_style: '',
      greeting_message: '',
      special_instructions: ''
    }
  });
  
  // File state
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<any[]>([]);
  
  // Load businesses on component mount
  useEffect(() => {
    if (!user?.id) return;
    
    const loadBusinesses = async () => {
      try {
        setLoading(true);
        const data = await businessService.getBusinessProfile(user.id);
        
        if (data && data.length > 0) {
          setBusinesses(data);
          
          // Check if the stored business ID exists in the loaded businesses
          const businessExists = selectedBusinessId && 
            data.some(business => business.id === selectedBusinessId);
          
          // Use stored ID if it exists in the list, otherwise use the first business
          const businessIdToSelect = businessExists ? selectedBusinessId : data[0].id;

          await handleBusinessChange(businessIdToSelect);
        } else {
          setBusinesses([]);
          setSelectedBusiness(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading businesses:', error);
        if (error instanceof ServiceError) {
          toast.error(error.message);
        } else {
          toast.error('Failed to load businesses');
        }
        setLoading(false);
      }
    };
    
    loadBusinesses();
  }, [user?.id, businessService, selectedBusinessId]);

  const { supabase } = useSupabase();
  useEffect(() => {
    // Check auth state
    async function checkAuth() {
      const { data, error } = await supabase.auth.getSession();
      
      // Also check the user
      const { data: { user } } = await supabase.auth.getUser();
    }
    
    checkAuth();
  }, [supabase]);
  
  // Handle business selection
  const handleBusinessChange = async (businessId: string) => {
    if (!businessId) return;
    
    try {
      setLoading(true);
      
      // Store the selected business ID in Zustand store
      setSelectedBusinessId(businessId);
      
      // Fetch all business data in parallel for efficiency
      const [businessDetails, knowledgeBaseFiles] = await Promise.all([
        businessService.getBusinessDetails(businessId),
        fileService.getKnowledgeBaseFiles(businessId)
      ]);
      
      
      setSelectedBusiness(businessDetails);
      setKnowledgeBaseFiles(knowledgeBaseFiles);
      
      // Populate the form with business data
      const businessType = businessDetails.type;
      
      // Extract type-specific details
      let typeDetails = {};
      
      // Helper function to safely get the details object
      const getDetails = (detailsField: any) => {
        if (!detailsField) return null;
        return Array.isArray(detailsField) ? detailsField[0] : detailsField;
      };
      
      if (businessType === 'restaurant') {
        const details = getDetails(businessDetails.restaurant_details_v2);
        
        if (details) {
          typeDetails = {
            menu_items: details.menu_items || '',
            seating_capacity: details.seating_capacity || null,
            cuisine_type: details.cuisine_type || '',
            delivery_available: details.delivery_available === true,
            takeout_available: details.takeout_available === true,
            operating_hours: details.operating_hours || ''
          };
        }
      } else if (businessType === 'retail') {
        const details = getDetails(businessDetails.retail_details_v2);
        
        if (details) {
          typeDetails = {
            store_type: details.store_type || '',
            inventory_size: details.inventory_size || null,
            has_online_store: details.has_online_store === true,
            delivery_available: details.delivery_available === true,
            operating_hours: details.operating_hours || ''
          };
        }
      } else if (businessType === 'service') {
        const details = getDetails(businessDetails.service_details_v2);
        
        if (details) {
          typeDetails = {
            service_type: details.service_type || '',
            service_area: details.service_area || '',
            is_mobile_service: details.is_mobile_service === true,
            requires_booking: details.requires_booking === true,
            operating_hours: details.operating_hours || ''
          };
        }
      }
      
      // Extract customer interaction settings
      let detailsObj = null;
      if (businessType === 'restaurant') {
        detailsObj = getDetails(businessDetails.restaurant_details_v2);
      } else if (businessType === 'retail') {
        detailsObj = getDetails(businessDetails.retail_details_v2);
      } else if (businessType === 'service') {
        detailsObj = getDetails(businessDetails.service_details_v2);
      }
      
      const customerSettings = {
        ai_communication_style: detailsObj?.ai_communication_style || '',
        greeting_message: detailsObj?.greeting_message || '',
        special_instructions: detailsObj?.special_instructions || ''
      };
      
      // Set form data
      setFormData({
        typeDetails,
        customerSettings
      });
      
    } catch (error) {
      console.error('[BusinessDashboard] Error loading business details:', error);
      if (error instanceof ServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to load business details');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form updates - single method for all form changes
  const handleFormChange = (section: string, updates: any) => {
    setFormData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section as keyof typeof prevData],
        ...updates
      }
    }));
  };
  
  // In handleSave method of BusinessDashboard.tsx
  const handleSave = async () => {
    if (!selectedBusinessId || !selectedBusiness) {
      toast.error('No business selected');
      return;
    }
    
    try {
      setSaving(true);
      
      const { typeDetails, customerSettings } = formData;
      let saveSuccess = false;
      
      // Handle save based on active tab
      switch (activeTab) {
        case 'details':
          await handleDetailsTabSave(typeDetails);
          saveSuccess = true;
          break;

        case 'interaction':
          await handleInteractionTabSave(customerSettings);
          saveSuccess = true;
          break;

        case 'files':
          // Files are uploaded immediately, no save action needed
          toast.message('Files are uploaded immediately when selected');
          return;

        default:
          console.warn(`[BusinessDashboard] Unknown tab: ${activeTab}`);
          return;
      }
      
      if (saveSuccess) {
        // Wait for a brief moment to ensure backend has processed the changes
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Now refresh the data
        await handleBusinessChange(selectedBusinessId);
      }
    } catch (error) {
      console.error('[BusinessDashboard] Save operation failed:', error);
      // Error should be handled in individual handlers
    } finally {
      setSaving(false);
    }
  };
  
  // Helper function for details tab save
  const handleDetailsTabSave = async (typeDetails: any) => {
    const businessType = selectedBusiness!.type;
    
    try {
      // Get the appropriate type-specific service
      const typeSpecificService = await businessService.getTypeSpecificService(businessType);
      
      // Update type-specific details
      await typeSpecificService.updateDetails(selectedBusinessId, typeDetails);
      
      toast.success('Business details saved successfully');
    } catch (error) {
      console.error('[BusinessDashboard] Error saving business details:', error);
      if (error instanceof ServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save business details');
      }
      throw error; // re-throw to handle in parent
    }
  };
  
  // Helper function for interaction tab save
  const handleInteractionTabSave = async (customerSettings: any) => {
    
    try {
      // Update customer interaction settings
      await businessService.updateCustomerInteraction(
        selectedBusinessId, 
        customerSettings
      );
      
      toast.success('Customer interaction settings saved successfully');
    } catch (error) {
      console.error('[BusinessDashboard] Error saving customer interaction:', error);
      if (error instanceof ServiceError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save customer interaction settings');
      }
      throw error; // re-throw to handle in parent
    }
  };
  
  // File handling - improved implementation 
const handleFileUpload = async (file: File) => {
  if (!selectedBusinessId) {
    console.error('[BusinessDashboard] Cannot upload file: No business selected');
    toast.error('Please select a business first');
    return;
  }
  
  
  try {
    // Perform client-side validation before starting upload
    // Show a warning if file seems large (over 8MB as a visual indicator)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 8) {
      toast.error(`File size is ${fileSizeMB.toFixed(2)}MB. Maximum allowed is 10MB.`);
    }
    // Show toast for upload starting
    toast.message(`Uploading ${file.name}...`);
    
    // Call file service to upload
    const result = await fileService.uploadKnowledgeBaseFile(
      selectedBusinessId,
      file
    );
    
    
    // Add to local state with key details
    setKnowledgeBaseFiles(prev => {
      // Check if file already exists to avoid duplicates
      const exists = prev.some(existingFile => 
        existingFile.name === result.name && 
        existingFile.uploadDate === result.uploadDate
      );
      
      if (exists) {
        return prev;
      }
      
      return [...prev, result];
    });
    
    if (result.wasUpdated) {
      toast.success(`File ${file.name} updated successfully - previous version has been replaced`, {
        duration: 5000  // Longer duration for important update notifications
      });
    } else {
      toast.success(`File ${file.name} uploaded successfully`);
    }

  } catch (error) {
    console.error('[BusinessDashboard] Error uploading file:', error);
    
    if (error instanceof ServiceError) {
      console.error('[BusinessDashboard] Service error details:', {
        message: error.message,
        code: error.code,
        originalError: error.originalError
      });
      toast.error(error.message);
    } else {
      console.error('[BusinessDashboard] Unexpected error:', error);
      toast.error(`Failed to upload ${file.name}`);
    }
  }
};

// Helper function to refresh knowledge base files
const refreshKnowledgeBaseFiles = async () => {
  if (!selectedBusinessId) return;
  
  try {
    
    const files = await fileService.getKnowledgeBaseFiles(selectedBusinessId);
    
    setKnowledgeBaseFiles(files);
  } catch (error) {
    console.error('[BusinessDashboard] Error refreshing knowledge base files:', error);
    
    // Don't show toast here since this is a background refresh
    // that might be called frequently
  }
};

// Handle file removal
const handleFileRemove = async (fileName: string) => {
  if (!selectedBusinessId) {
    console.error('[BusinessDashboard] Cannot remove file: No business selected');
    toast.error('Please select a business first');
    return;
  }
  
  
  try {
    // Show a loading toast
    toast.message(`Removing ${fileName}...`);
    
    // Now pass both the fileName and businessId to the service
    await fileService.deleteFile(fileName, selectedBusinessId);
    
    // Update local state to remove the file
    setKnowledgeBaseFiles(prev => prev.filter(file => file.name !== fileName));
    
    toast.success(`File ${fileName} removed successfully`);
    
    // Refresh files list
    await refreshKnowledgeBaseFiles();
  } catch (error) {
    console.error(`[BusinessDashboard] Error removing file ${fileName}:`, error);
    
    if (error instanceof ServiceError) {
      toast.error(error.message);
    } else {
      toast.error(`Failed to remove ${fileName}`);
    }
  }
};

  
  // Loading state
  if (loading && businesses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
          <p className="text-sm text-gray-500">Loading business details...</p>
        </div>
      </div>
    );
  }
  
  // No businesses state
  if (businesses.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">No businesses found. Please add a business from the profile page first.</p>
        <Button 
          onClick={() => router.push('/dashboard/profile')}
          className="mt-4 bg-[#8B0000] hover:bg-[#6B0000]"
        >
          Go to Profile
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 sm:space-y-8 p-4 sm:p-6 max-w-full overflow-hidden">
      <Toaster position="top-right" />
      {/* Business Selector Header - Mobile Responsive */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
            <h1 className="text-lg sm:text-2xl font-semibold truncate min-w-0">
              Business Settings: <span className="block sm:inline truncate">{selectedBusiness?.name || 'Select a business'}</span>
            </h1>
            <div className="flex-shrink-0">
              <BusinessSelector
                businesses={businesses}
                selectedBusinessId={selectedBusinessId}
                onChange={handleBusinessChange}
              />
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Tabs Section - simplified */}
      {selectedBusiness && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 sm:space-y-6"
        >
          <TabsList className="w-full h-auto border-b border-gray-200 bg-transparent flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <TabsTrigger
              value="details"
              className="relative border-2 border-transparent bg-white data-[state=active]:border-[#8B0000] data-[state=active]:border-b-transparent data-[state=active]:text-[#8B0000] px-3 py-2 sm:px-6 sm:py-2 text-sm sm:text-base w-full sm:w-auto"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="interaction"
              className="relative border-2 border-transparent bg-white data-[state=active]:border-[#8B0000] data-[state=active]:border-b-transparent data-[state=active]:text-[#8B0000] px-3 py-2 sm:px-6 sm:py-2 text-sm sm:text-base w-full sm:w-auto"
            >
              Customer Interaction
            </TabsTrigger>
            <TabsTrigger 
              value="files" 
              className="relative border-2 border-transparent bg-white data-[state=active]:border-[#8B0000] data-[state=active]:border-b-transparent data-[state=active]:text-[#8B0000] px-6 py-2"
            >
              Files & Knowledge Base
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            <BusinessInfo
              businessId={selectedBusinessId}
              businessType={selectedBusiness.type}
              typeDetails={formData.typeDetails}
              onChange={(updates) => handleFormChange('typeDetails', updates)}
            />
          </TabsContent>
          
          <TabsContent value="interaction">
            <CustomerSettings
              settings={formData.customerSettings}
              onChange={(updates) => handleFormChange('customerSettings', updates)}
            />
          </TabsContent>
          
          <TabsContent value="files">
            <FileManager
              businessId={selectedBusinessId}
              knowledgeBaseFiles={knowledgeBaseFiles}
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
            />
          </TabsContent>
        </Tabs>
      )}
      
      {/* Global Save Button - Only show for Details and Customer Interaction tabs */}
      {activeTab !== 'files' && (
        <div className="flex justify-end mt-8">
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-[#8B0000] hover:bg-[#6B0000] text-white px-8 py-2"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}