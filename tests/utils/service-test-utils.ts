// src/tests/utils/service-test-utils.ts
import { vi } from 'vitest';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import React, { ReactElement } from 'react';
// Import the component as a value
import { ServiceProvider } from '@/components/providers/service-provider';
import { IBusinessService } from '@/lib/services/business/types';
import { IAppointmentService } from '@/lib/services/appointment/types';
import { IFileService } from '@/lib/services/file/types';
import { ServiceError } from '@/lib/types/shared/error.types';

// Define types for mocked services
export type MockBusinessService = Partial<Record<keyof IBusinessService, ReturnType<typeof vi.fn>>>;
export type MockAppointmentService = Partial<Record<keyof IAppointmentService, ReturnType<typeof vi.fn>>>;
export type MockFileService = Partial<Record<keyof IFileService, ReturnType<typeof vi.fn>>>;

export interface MockServices {
  businessService?: MockBusinessService;
  appointmentService?: MockAppointmentService;
  fileService?: MockFileService;
}

/**
 * Creates mock service implementations for testing
 */
export function createMockServices(): MockServices {
  return {
    businessService: {
      getBusinessProfile: vi.fn(),
      getBusinessDetails: vi.fn(),
      createBusiness: vi.fn(),
      updateBusiness: vi.fn(),
      updateCustomerInteraction: vi.fn(),
      uploadProfileImage: vi.fn()
    },
    appointmentService: {
      getAppointments: vi.fn(),
      getAppointmentById: vi.fn(),
      createAppointment: vi.fn(),
      updateAppointment: vi.fn(),
      deleteAppointment: vi.fn(),
      getBusinessCapacity: vi.fn(),
      isTimeSlotAvailable: vi.fn(),
      getCalendarData: vi.fn(),
      getAppointmentsByStatus: vi.fn(),
      getUtilizationSummary: vi.fn(),
      // Add test-only methods to make TS happy
      _setTestMode: vi.fn(),
      _testOnlySetCacheAge: vi.fn(),
      _testOnlyClearCache: vi.fn(),
      _testOnlyGetCacheSize: vi.fn()
    },
    fileService: {
      uploadFile: vi.fn(),
      getBusinessFiles: vi.fn(),
      getFilesByType: vi.fn(),
      deleteFile: vi.fn(),
      uploadKnowledgeBaseFile: vi.fn(),
      uploadConfigFile: vi.fn(),
      getKnowledgeBaseFiles: vi.fn()
    }
  };
}

// Options for rendering with mocked services
export interface RenderWithServicesOptions extends RenderOptions {
  services?: MockServices;
}

// Add services to render result type
export interface RenderWithServicesResult extends RenderResult {
  services: MockServices;
}

/**
 * Custom render function that wraps components with ServiceProvider
 * and provides mocked services
 */
export function renderWithServices(
  ui: ReactElement,
  options: RenderWithServicesOptions = {}
): RenderWithServicesResult {
  const { services = createMockServices(), ...renderOptions } = options;
  
  // Create the wrapper component
  // Define a simple wrapper component using standard function syntax
  function TestWrapper({ children }: { children: React.ReactNode }) {
    // Pass in the children as the third argument to createElement
    return React.createElement(
      ServiceProvider,
      {
        businessServiceOverride: services.businessService as unknown as IBusinessService,
        appointmentServiceOverride: services.appointmentService as unknown as IAppointmentService,
        fileServiceOverride: services.fileService as unknown as IFileService,
        children: children, // Explicitly include children in the props
      },
      children  // This is redundant with the above, but keeps both patterns for compatibility
    );
  };
  
  // Render with the wrapper
  const renderResult = render(ui, { wrapper: TestWrapper, ...renderOptions });
  
  // Return the render result with services added
  return {
    ...renderResult,
    services
  };
}

/**
 * Function to create a service error for testing error handling
 */
export function createServiceError(
  message = 'An error occurred',
  code = 'ERROR',
  details?: string
): ServiceError {
  return new ServiceError(message, code, details);
}

/**
 * Mock data generators for common entity types
 */
export const mockData = {
  /**
   * Create mock business with optional overrides
   */
  createBusiness: (overrides: Record<string, any> = {}) => ({
    id: 'business-123',
    name: 'Test Business',
    type: 'restaurant',
    user_id: 'user-123',
    ...overrides
  }),
  
  /**
   * Create mock appointment with optional overrides
   */
  createAppointment: (overrides: Record<string, any> = {}) => ({
    id: 'appointment-123',
    business_id: 'business-123',
    user_id: 'user-123',
    start_time: '2025-03-14T10:00:00Z',
    end_time: '2025-03-14T11:00:00Z',
    description: 'Test Appointment',
    party_size: 2,
    status: 'confirmed',
    created_at: '2025-03-13T10:00:00Z',
    updated_at: '2025-03-13T10:00:00Z',
    ...overrides
  }),
  
  /**
   * Create mock file with optional overrides
   */
  createFile: (overrides: Record<string, any> = {}) => ({
    name: 'test-file.pdf',
    size: 1024 * 200,
    type: 'application/pdf',
    uploadDate: '2025-03-14T10:00:00Z',
    ...overrides
  })
};

/**
 * Helper for working with vitest fake timers in async tests
 */
export async function advanceTimersByTimeAsync(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms);
  // Allow any promises in the microtask queue to resolve
  await Promise.resolve();
}