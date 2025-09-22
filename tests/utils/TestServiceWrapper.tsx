// tests/utils/TestServiceWrapper.tsx
import React, { ReactNode } from 'react';
import { vi } from 'vitest';
import { ServiceProvider } from '@/components/providers/service-provider';
import { SupabaseProvider } from '@/components/providers/supabase-provider';
import { IBusinessService } from '@/lib/services/business/types';
import { IAppointmentService } from '@/lib/services/appointment/types';
import { IFileService } from '@/lib/services/file/types';

// Mock the hooks that ServiceProvider uses internally
vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: vi.fn().mockReturnValue({
    supabase: {},
    user: null
  }),
  SupabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

interface TestServiceWrapperProps {
  children: ReactNode;
  businessServiceProps?: Partial<IBusinessService>;
  appointmentServiceProps?: Partial<IAppointmentService>;
  fileServiceProps?: Partial<IFileService>;
}

/**
 * A wrapper component for tests that provides mock implementations of all services
 * You can override specific methods by passing props for each service
 */
export const TestServiceWrapper: React.FC<TestServiceWrapperProps> = ({
  children,
  businessServiceProps = {},
  appointmentServiceProps = {},
  fileServiceProps = {}
}) => {
  // Create mock services with vi.fn() for all methods
  const mockBusinessService: Partial<IBusinessService> = {
    getBusinessProfile: vi.fn(),
    getBusinessDetails: vi.fn(),
    createBusiness: vi.fn(),
    updateBusiness: vi.fn(),
    updateCustomerInteraction: vi.fn(),
    uploadProfileImage: vi.fn(),
    ...businessServiceProps
  };

  const mockAppointmentService: Partial<IAppointmentService> = {
    getAppointments: vi.fn(),
    getCalendarData: vi.fn(),
    getAppointmentById: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    deleteAppointment: vi.fn(),
    getAppointmentsByStatus: vi.fn(),
    isTimeSlotAvailable: vi.fn(),
    getBusinessCapacity: vi.fn(),
    getUtilizationSummary: vi.fn(),
    _setTestMode: vi.fn(),
    _testOnlySetCacheAge: vi.fn(),
    _testOnlyClearCache: vi.fn(),
    _testOnlyGetCacheSize: vi.fn(),
    ...appointmentServiceProps
  };

  const mockFileService: Partial<IFileService> = {
    uploadFile: vi.fn(),
    getBusinessFiles: vi.fn(),
    getFilesByType: vi.fn(),
    deleteFile: vi.fn(),
    uploadKnowledgeBaseFile: vi.fn(),
    uploadConfigFile: vi.fn(),
    getKnowledgeBaseFiles: vi.fn(),
    ...fileServiceProps
  };

  return (
    <SupabaseProvider>
      <ServiceProvider
        businessServiceOverride={mockBusinessService as IBusinessService}
        appointmentServiceOverride={mockAppointmentService as IAppointmentService}
        fileServiceOverride={mockFileService as IFileService}
      >
        {children}
      </ServiceProvider>
    </SupabaseProvider>
  );
};

/**
 * Helper function to create mock service implementations
 * Used when you need to reference the mocks directly in your tests
 */
export const createMockServices = () => {
  const mockBusinessService = {
    getBusinessProfile: vi.fn(),
    getBusinessDetails: vi.fn(),
    createBusiness: vi.fn(),
    updateBusiness: vi.fn(),
    updateCustomerInteraction: vi.fn(),
    uploadProfileImage: vi.fn()
  };

  const mockAppointmentService = {
    getAppointments: vi.fn(),
    getCalendarData: vi.fn(),
    getAppointmentById: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    deleteAppointment: vi.fn(),
    getAppointmentsByStatus: vi.fn(),
    isTimeSlotAvailable: vi.fn(),
    getBusinessCapacity: vi.fn(),
    getUtilizationSummary: vi.fn(),
    _setTestMode: vi.fn(),
    _testOnlySetCacheAge: vi.fn(),
    _testOnlyClearCache: vi.fn(),
    _testOnlyGetCacheSize: vi.fn()
  };

  const mockFileService = {
    uploadFile: vi.fn(),
    getBusinessFiles: vi.fn(),
    getFilesByType: vi.fn(),
    deleteFile: vi.fn(),
    uploadKnowledgeBaseFile: vi.fn(),
    uploadConfigFile: vi.fn(),
    getKnowledgeBaseFiles: vi.fn()
  };

  return {
    mockBusinessService,
    mockAppointmentService,
    mockFileService
  };
};