// src/lib/services/service.factory.ts
import { RepositoryFactory, getRepositoryFactory } from '@/lib/database/repository.factory';
import { BusinessService } from './business/business.service';
import { AppointmentService } from './appointment/appointment.service';
import { FileService } from './file/file.service';
import { BusinessNumbersService } from './numbers/business-numbers.service';
import { IBusinessService } from './business/types';
import { IAppointmentService } from './appointment/types';
import { IFileService } from './file/types';
import { IBusinessNumbersService } from './numbers/types';

/**
 * Service factory that provides instances of all application services
 * This follows the factory pattern to centralize creation of services
 * and handle dependencies between them
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private businessService: IBusinessService | null = null;
  private appointmentService: IAppointmentService | null = null;
  private fileService: IFileService | null = null;
  private businessNumbersService: IBusinessNumbersService | null = null;
  private repositoryFactory: RepositoryFactory;

  private constructor(repoFactory?: RepositoryFactory) {
    this.repositoryFactory = repoFactory || getRepositoryFactory();
  }

  /**
   * Get the singleton instance of the service factory
   */
  public static getInstance(repoFactory?: RepositoryFactory): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory(repoFactory);
    }
    return ServiceFactory.instance;
  }

  /**
   * Get the business service
   */
  public getBusinessService(): IBusinessService {
    if (!this.businessService) {
      this.businessService = new BusinessService(this.repositoryFactory);
    }
    return this.businessService;
  }

  /**
   * Get the appointment service
   */
  public getAppointmentService(): IAppointmentService {
    if (!this.appointmentService) {
      this.appointmentService = new AppointmentService(this.repositoryFactory);
    }
    return this.appointmentService;
  }

  /**
   * Get the file service
   */
  public getFileService(): IFileService {
    if (!this.fileService) {
      this.fileService = new FileService(this.repositoryFactory);
    }
    return this.fileService;
  }

  /**
   * Get the business numbers service
   */
  public getBusinessNumbersService(): IBusinessNumbersService {
    if (!this.businessNumbersService) {
      this.businessNumbersService = new BusinessNumbersService(this.repositoryFactory);
    }
    return this.businessNumbersService;
  }

  /**
   * Reset all services (mostly used for testing)
   */
  public reset(): void {
    this.businessService = null;
    this.appointmentService = null;
    this.fileService = null;
    this.businessNumbersService = null;
  }

  /**
   * Get the repository factory
   */
  public getRepositoryFactory(): RepositoryFactory {
    return this.repositoryFactory;
  }
}

// Convenience function to get service factory instance
export const getServiceFactory = (repoFactory?: RepositoryFactory): ServiceFactory => {
  return ServiceFactory.getInstance(repoFactory);
};

// Convenience functions to get specific services
export const getBusinessService = (): IBusinessService => {
  return getServiceFactory().getBusinessService();
};

export const getAppointmentService = (): IAppointmentService => {
  return getServiceFactory().getAppointmentService();
};

export const getFileService = (): IFileService => {
  return getServiceFactory().getFileService();
};

export const getBusinessNumbersService = (): IBusinessNumbersService => {
  return getServiceFactory().getBusinessNumbersService();
};