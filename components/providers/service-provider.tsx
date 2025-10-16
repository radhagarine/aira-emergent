'use client';

// src/components/providers/service-provider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database/database.types';

// Import service interfaces
import { IBusinessService, ITypeSpecificBusinessService } from '@/lib/services/business/types';
import { IAppointmentService } from '@/lib/services/appointment/types';
import { IFileService } from '@/lib/services/file/types';
import { IBusinessNumbersService } from '@/lib/services/numbers/types';

import { 
  IRestaurantService,
  IRetailService, 
  IServiceBusinessService
} from '@/lib/services/business/types';

// Import service implementations
import { BusinessService } from '@/lib/services/business/business.service';
import { AppointmentService } from '@/lib/services/appointment/appointment.service';
import { FileService } from '@/lib/services/file/file.service';
import { BusinessNumbersService } from '@/lib/services/numbers/business-numbers.service';
import { RestaurantService } from '@/lib/services/business/restaurant.service';
import { RetailService } from '@/lib/services/business/retail.service';
import { ServiceBusinessService } from '@/lib/services/business/service-business.service';

// Import repository factory
import { RepositoryFactory } from '@/lib/database/repository.factory';

// Enhanced service context type with all services (merged from ServiceContextType and EnhancedServiceContextType)
interface ServiceContextType {
  businessService: IBusinessService;
  appointmentService: IAppointmentService;
  fileService: IFileService;
  businessNumbersService: IBusinessNumbersService;
  restaurantService: IRestaurantService;
  retailService: IRetailService;
  serviceBusinessService: IServiceBusinessService;
  reloadServices: () => void;
}

// Create the context with a default empty value
const ServiceContext = createContext<ServiceContextType | null>(null);

// Define provider props to allow for dependency injection (merged with EnhancedServiceProviderProps)
interface ServiceProviderProps {
  children: ReactNode;
  businessServiceOverride?: IBusinessService;
  appointmentServiceOverride?: IAppointmentService;
  fileServiceOverride?: IFileService;
  businessNumbersServiceOverride?: IBusinessNumbersService;
  restaurantServiceOverride?: IRestaurantService;
  retailServiceOverride?: IRetailService;
  serviceBusinessServiceOverride?: IServiceBusinessService;
  repositoryFactoryOverride?: RepositoryFactory;
  supabaseClientOverride?: SupabaseClient<Database>;
}

/**
 * ServiceProvider component that makes all application services available
 * via React Context. This is now the ONLY service provider (merged with EnhancedServiceProvider).
 */
export const ServiceProvider: React.FC<ServiceProviderProps> = ({
  children,
  businessServiceOverride,
  appointmentServiceOverride,
  fileServiceOverride,
  businessNumbersServiceOverride,
  restaurantServiceOverride,
  retailServiceOverride,
  serviceBusinessServiceOverride,
  repositoryFactoryOverride,
  supabaseClientOverride
}) => {
  // Use ref to ensure we keep the same factory instance across renders
  const factoryRef = React.useRef<RepositoryFactory | null>(null);

  // Initialize factory only once
  if (!factoryRef.current) {
    factoryRef.current = repositoryFactoryOverride || RepositoryFactory.getInstance();
    console.log('[ServiceProvider] RepositoryFactory initialized');
  }

  const repositoryFactory = factoryRef.current;

  // Use refs to ensure we keep the same service instances across renders
  const servicesRef = React.useRef<ServiceContextType | null>(null);

  // Initialize services only once
  if (!servicesRef.current) {
    console.log('[ServiceProvider] Initializing all services');
    servicesRef.current = {
      businessService: businessServiceOverride || new BusinessService(repositoryFactory),
      appointmentService: appointmentServiceOverride || new AppointmentService(repositoryFactory),
      fileService: fileServiceOverride || new FileService(repositoryFactory),
      businessNumbersService: businessNumbersServiceOverride || new BusinessNumbersService(repositoryFactory),
      restaurantService: restaurantServiceOverride || new RestaurantService(repositoryFactory),
      retailService: retailServiceOverride || new RetailService(repositoryFactory),
      serviceBusinessService: serviceBusinessServiceOverride || new ServiceBusinessService(repositoryFactory),
      reloadServices: () => {
        // Reset repository factory cache
        repositoryFactory.reset();
        // Force recreation of services on next access
        servicesRef.current = null;
      }
    };
  }

  const services = servicesRef.current;

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

/**
 * Hook to access all services from the ServiceProvider
 */
export const useServices = (): ServiceContextType => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};

/**
 * Hook to access the business service
 */
export const useBusinessService = (): IBusinessService => {
  const services = useServices();
  return services.businessService;
};

/**
 * Hook to access the appointment service
 */
export const useAppointmentService = (): IAppointmentService => {
  const services = useServices();
  return services.appointmentService;
};

/**
 * Hook to access the file service
 */
export const useFileService = (): IFileService => {
  const services = useServices();
  return services.fileService;
};

/**
 * Hook to access the business numbers service
 */
export const useBusinessNumbersService = (): IBusinessNumbersService => {
  const services = useServices();
  return services.businessNumbersService;
};

/**
 * EnhancedServiceProvider is now an ALIAS for ServiceProvider (to maintain backwards compatibility)
 * All services are now included in the base ServiceProvider
 */
export const EnhancedServiceProvider = ServiceProvider;

/**
 * useEnhancedServices is now an ALIAS for useServices (to maintain backwards compatibility)
 */
export const useEnhancedServices = useServices;

/**
 * Hook to access the restaurant service
 */
export const useRestaurantService = (): IRestaurantService => {
  const services = useServices();
  return services.restaurantService;
};

/**
 * Hook to access the retail service
 */
export const useRetailService = (): IRetailService => {
  const services = useServices();
  return services.retailService;
};

/**
 * Hook to access the service business service
 */
export const useServiceBusinessService = (): IServiceBusinessService => {
  const services = useServices();
  return services.serviceBusinessService;
};

/**
 * Hook to get the appropriate type-specific service based on business type
 */
export const useTypeSpecificService = (businessType: string): ITypeSpecificBusinessService<any> => {
  const { restaurantService, retailService, serviceBusinessService } = useServices();

  switch (businessType) {
    case 'restaurant':
      return restaurantService;
    case 'retail':
      return retailService;
    case 'service':
      return serviceBusinessService;
    default:
      throw new Error(`Unsupported business type: ${businessType}`);
  }
};