// src/components/providers/service-provider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider';
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

// Define the service context type
interface ServiceContextType {
  businessService: IBusinessService;
  appointmentService: IAppointmentService;
  fileService: IFileService;
  businessNumbersService: IBusinessNumbersService;
  reloadServices: () => void;
}

// Create the context with a default empty value
const ServiceContext = createContext<ServiceContextType | null>(null);

// Define provider props to allow for dependency injection
interface ServiceProviderProps {
  children: ReactNode;
  businessServiceOverride?: IBusinessService;
  appointmentServiceOverride?: IAppointmentService;
  fileServiceOverride?: IFileService;
  businessNumbersServiceOverride?: IBusinessNumbersService;
  repositoryFactoryOverride?: RepositoryFactory;
  supabaseClientOverride?: SupabaseClient<Database>;
}

/**
 * ServiceProvider component that makes all application services available
 * via React Context.
 */
export const ServiceProvider: React.FC<ServiceProviderProps> = ({
  children,
  businessServiceOverride,
  appointmentServiceOverride,
  fileServiceOverride,
  businessNumbersServiceOverride,
  repositoryFactoryOverride,
  supabaseClientOverride
}) => {
  
  // Get Supabase client from provider if not overridden
  const supabaseContext = useSupabase();
  const supabaseClient = supabaseClientOverride || supabaseContext.supabase;

  // Memoize repository factory to prevent infinite re-creation
  const repositoryFactory = React.useMemo(() => {
    console.log('[ServiceProvider] Creating repository factory with client');
    const factory = repositoryFactoryOverride ||
      (supabaseClient ? RepositoryFactory.createWithClient(supabaseClient) : RepositoryFactory.getInstance());
    console.log('[ServiceProvider] Repository factory created successfully');
    return factory;
  }, [supabaseClient, repositoryFactoryOverride]);

  // Initialize or use provided service instances
  const services = React.useMemo(() => {
    // Create services with repository factory
    const business = businessServiceOverride || new BusinessService(repositoryFactory);
    const appointment = appointmentServiceOverride || new AppointmentService(repositoryFactory);
    const file = fileServiceOverride || new FileService(repositoryFactory);
    const businessNumbers = businessNumbersServiceOverride || new BusinessNumbersService(repositoryFactory);

    return {
      businessService: business,
      appointmentService: appointment,
      fileService: file,
      businessNumbersService: businessNumbers,
      reloadServices: () => {
        // Reset repository factory cache
        repositoryFactory.reset();
      }
    };
  }, [
    repositoryFactory,
    businessServiceOverride,
    appointmentServiceOverride,
    fileServiceOverride,
    businessNumbersServiceOverride
  ]);
  
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
 * Enhanced service context type with type-specific services
 */
interface EnhancedServiceContextType extends ServiceContextType {
  restaurantService: IRestaurantService;
  retailService: IRetailService;
  serviceBusinessService: IServiceBusinessService;
}

/**
 * Enhanced ServiceProvider props with type-specific service overrides
 */
interface EnhancedServiceProviderProps extends ServiceProviderProps {
  restaurantServiceOverride?: IRestaurantService;
  retailServiceOverride?: IRetailService;
  serviceBusinessServiceOverride?: IServiceBusinessService;
}


const EnhancedServiceContext = createContext<EnhancedServiceContextType | null>(null);
/**
 * Create a new enhanced ServiceProvider component
 */
export const EnhancedServiceProvider: React.FC<EnhancedServiceProviderProps> = ({
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
  // Get Supabase client from provider if not overridden
  const supabaseContext = useSupabase();
  const supabaseClient = supabaseClientOverride || supabaseContext.supabase;

  // Memoize repository factory to prevent infinite re-creation
  const repositoryFactory = React.useMemo(() => {
    return repositoryFactoryOverride ||
      (supabaseClient ? RepositoryFactory.createWithClient(supabaseClient) : RepositoryFactory.getInstance());
  }, [supabaseClient, repositoryFactoryOverride]);

  // Initialize or use provided service instances
  const services = React.useMemo(() => {
    return {
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
      }
    };
  }, [
    repositoryFactory,
    businessServiceOverride,
    appointmentServiceOverride,
    fileServiceOverride,
    businessNumbersServiceOverride,
    restaurantServiceOverride,
    retailServiceOverride,
    serviceBusinessServiceOverride
  ]);
  
  return (
    <EnhancedServiceContext.Provider value={services}>
      {children}
    </EnhancedServiceContext.Provider>
  );
};

// Updated hooks to use the enhanced context
export const useEnhancedServices = (): EnhancedServiceContextType => {
  const context = useContext(EnhancedServiceContext);
  if (!context) {
    throw new Error('useEnhancedServices must be used within an EnhancedServiceProvider');
  }
  return context;
};

/**
 * Hook to access the restaurant service
 */
export const useRestaurantService = (): IRestaurantService => {
  const services = useEnhancedServices();
  return services.restaurantService;
};

/**
 * Hook to access the retail service
 */
export const useRetailService = (): IRetailService => {
  const services = useEnhancedServices();
  return services.retailService;
};

/**
 * Hook to access the service business service
 */
export const useServiceBusinessService = (): IServiceBusinessService => {
  const services = useEnhancedServices();
  return services.serviceBusinessService;
};

/**
 * Hook to get the appropriate type-specific service based on business type
 */
export const useTypeSpecificService = (businessType: string): ITypeSpecificBusinessService<any> => {
  const { restaurantService, retailService, serviceBusinessService } = useEnhancedServices();
  
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