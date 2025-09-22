// src/lib/services/index.ts
// Re-export all service interfaces, implementations, and types

// Business Service
export * from './business/types';
export * from './business/business.service';

// Appointment Service
export * from './appointment/types';
export * from './appointment/appointment.service';

// File Service
export * from './file/types';
export * from './file/file.service';

export * from './business/base-type-specific.service';

// Add additional services as they are implemented
// export * from './user/types';
// export * from './user/user.service';
// etc.

// Export singleton instances
import { BusinessService, businessService } from './business/business.service';
import { FileService } from './file/file.service';
import { AppointmentService } from './appointment/appointment.service';
import { getRepositoryFactory } from '@/lib/database/repository.factory';

export { RestaurantService, restaurantService } from './business/restaurant.service';
export { RetailService, retailService } from './business/retail.service';
export { ServiceBusinessService, serviceBusinessService } from './business/service-business.service';

// Export factory
export { BusinessServiceFactory, businessServiceFactory } from './business/business-service.factory';


// Create singleton appointment service
const appointmentService = new AppointmentService();

// Export service singletons
export const services = {
  BusinessService,
  AppointmentService,
  FileService
};

// Function to create fresh service instances (useful for testing)
export function createServices(repositoryFactoryOverride?: any) {
  const repoFactory = repositoryFactoryOverride || getRepositoryFactory();
  return {
    businessService: new BusinessService(repoFactory),
    appointmentService: new AppointmentService(repoFactory),
    fileService: new FileService(repoFactory)
  };
}