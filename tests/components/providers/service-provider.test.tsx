// Set React environment to development for testing
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    // Override useState to ensure it's from the development build
    useState: actual.useState,
  };
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React, { ReactNode } from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the service provider components and context
import { 
  ServiceProvider
} from '@/components/providers/service-provider';

// Mock useSupabase hook
vi.mock('@/components/providers/supabase-provider', () => ({
  useSupabase: () => ({
    supabase: { /* mock Supabase client */ }
  })
}));

// Mock service classes
vi.mock('@/lib/services/business/business.service', () => ({
  BusinessService: vi.fn().mockImplementation(() => ({
    getBusinessProfile: vi.fn().mockResolvedValue(['test-business']),
    getBusinessById: vi.fn(),
    getBusinessDetails: vi.fn(),
    createBusiness: vi.fn(),
    updateBusiness: vi.fn(),
    uploadProfileImage: vi.fn(),
    deleteBusiness: vi.fn(),
    updateCustomerInteraction: vi.fn(),
    getTypeSpecificService: vi.fn()
  }))
}));

vi.mock('@/lib/services/appointment/appointment.service', () => ({
  AppointmentService: vi.fn().mockImplementation(() => ({
    getAppointments: vi.fn().mockResolvedValue(['test-appointment']),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    deleteAppointment: vi.fn(),
    getAppointmentById: vi.fn(),
    getAppointmentsByStatus: vi.fn(),
    getBusinessCapacity: vi.fn(),
    getUtilizationSummary: vi.fn(),
    isTimeSlotAvailable: vi.fn(),
    getCalendarData: vi.fn(),
    _setTestMode: vi.fn(),
    _testOnlySetCacheAge: vi.fn(),
    _testOnlyClearCache: vi.fn(),
    _testOnlyGetCacheSize: vi.fn()
  }))
}));

vi.mock('@/lib/services/file/file.service', () => ({
  FileService: vi.fn().mockImplementation(() => ({
    getBusinessFiles: vi.fn().mockResolvedValue(['test-file']),
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
    getFilesByType: vi.fn(),
    uploadKnowledgeBaseFile: vi.fn(),
    getKnowledgeBaseFiles: vi.fn(),
    uploadConfigFile: vi.fn()
  }))
}));

// Mock repository factory
vi.mock('@/lib/database/repository.factory', () => ({
  RepositoryFactory: {
    getInstance: vi.fn().mockReturnValue({
      getBusinessRepository: vi.fn(),
      getAppointmentsRepository: vi.fn(),
      getFileStorageRepository: vi.fn(),
      getRestaurantDetailsRepository: vi.fn(),
      getRetailDetailsRepository: vi.fn(),
      getServiceDetailsRepository: vi.fn(),
      reset: vi.fn()
    }),
    createWithClient: vi.fn().mockImplementation(() => ({
      getBusinessRepository: vi.fn(),
      getAppointmentsRepository: vi.fn(),
      getFileStorageRepository: vi.fn(),
      getRestaurantDetailsRepository: vi.fn(),
      getRetailDetailsRepository: vi.fn(),
      getServiceDetailsRepository: vi.fn(),
      reset: vi.fn()
    }))
  },
  getRepositoryFactory: vi.fn().mockReturnValue({
    getBusinessRepository: vi.fn(),
    getAppointmentsRepository: vi.fn(),
    getFileStorageRepository: vi.fn(),
    getRestaurantDetailsRepository: vi.fn(),
    getRetailDetailsRepository: vi.fn(),
    getServiceDetailsRepository: vi.fn(),
    reset: vi.fn()
  })
}));

// Import actual service classes to verify constructors are called
import { BusinessService } from '@/lib/services/business/business.service';
import { AppointmentService } from '@/lib/services/appointment/appointment.service';
import { FileService } from '@/lib/services/file/file.service';

describe('ServiceProvider Component', () => {
  // Clean up after each test
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('creates service instances correctly', () => {
    // Create a test wrapper component
    function TestWrapper({ children }: { children: ReactNode }) {
      return <ServiceProvider>{children}</ServiceProvider>;
    }

    // Render the wrapper with a child component
    const { container } = render(
      <TestWrapper>
        <div data-testid="test-child">Test Child</div>
      </TestWrapper>
    );

    // Verify the service class constructors were called
    expect(BusinessService).toHaveBeenCalled();
    expect(AppointmentService).toHaveBeenCalled();
    expect(FileService).toHaveBeenCalled();
    
    // Verify the container rendered successfully
    expect(container).toBeTruthy();
  });

  it('uses service overrides when provided', () => {
    // Create mock service overrides
    const mockBusinessService = {
      getBusinessProfile: vi.fn().mockResolvedValue(['overridden-business']),
      getBusinessById: vi.fn(),
      getBusinessDetails: vi.fn(),
      createBusiness: vi.fn(),
      updateBusiness: vi.fn(),
      uploadProfileImage: vi.fn(),
      deleteBusiness: vi.fn(),
      updateCustomerInteraction: vi.fn(),
      getTypeSpecificService: vi.fn()
    };

    const mockAppointmentService = {
      getAppointments: vi.fn().mockResolvedValue(['overridden-appointment']),
      createAppointment: vi.fn(),
      updateAppointment: vi.fn(),
      deleteAppointment: vi.fn(),
      getAppointmentById: vi.fn(),
      getAppointmentsByStatus: vi.fn(),
      getBusinessCapacity: vi.fn(),
      getUtilizationSummary: vi.fn(),
      isTimeSlotAvailable: vi.fn(),
      getCalendarData: vi.fn(),
      _setTestMode: vi.fn(),
      _testOnlySetCacheAge: vi.fn(),
      _testOnlyClearCache: vi.fn(),
      _testOnlyGetCacheSize: vi.fn()
    };

    const mockFileService = {
      getBusinessFiles: vi.fn().mockResolvedValue(['overridden-file']),
      uploadFile: vi.fn(),
      deleteFile: vi.fn(),
      getFilesByType: vi.fn(),
      uploadKnowledgeBaseFile: vi.fn(),
      getKnowledgeBaseFiles: vi.fn(),
      uploadConfigFile: vi.fn()
    };

    // Render with service overrides
    const { container } = render(
      <ServiceProvider
        businessServiceOverride={mockBusinessService}
        appointmentServiceOverride={mockAppointmentService}
        fileServiceOverride={mockFileService}
      >
        <div data-testid="child-component">Test Child</div>
      </ServiceProvider>
    );

    // Verify the container renders
    expect(container).toBeTruthy();
    
    // Verify service constructors were not called when using overrides
    expect(BusinessService).not.toHaveBeenCalled();
    expect(AppointmentService).not.toHaveBeenCalled();
    expect(FileService).not.toHaveBeenCalled();
  });
});