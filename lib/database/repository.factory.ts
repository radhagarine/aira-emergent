// lib/database/repository.factory.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from './client';
import { BusinessRepository } from './repositories/business.repository';
import { BusinessFilesRepository } from './repositories/businessfiles.repository';
import { FileStorageRepository } from './repositories/file-storage.repository';
import { RestaurantDetailsRepository } from './repositories/restaurant-details.repository';
import { RetailDetailsRepository } from './repositories/retail-details.repository';
import { ServiceDetailsRepository } from './repositories/service-details.repository';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { BusinessNumbersRepository } from './repositories/business-numbers.repository';
import { WalletRepository } from './repositories/wallet.repository';
import { TransactionRepository } from './repositories/transaction.repository';

import { IBusinessRepository } from './interfaces/business.interface';
import { IBusinessFilesRepository } from './interfaces/businessfiles.interface';
import { IFileStorageRepository } from './interfaces/file-storage.interface';
import { IRestaurantDetailsRepository } from './interfaces/restaurant-details.interface';
import { IRetailDetailsRepository } from './interfaces/retail-details.interface';
import { IServiceDetailsRepository } from './interfaces/service-details.interface';
import { IAppointmentsRepository } from './interfaces/appointments.interface';
import { IBusinessNumbersRepository } from './interfaces/business-numbers.interface';
import { IWalletRepository } from './interfaces/wallet.interface';
import { ITransactionRepository } from './interfaces/transaction.interface';
import { getSupabaseInstance } from '@/components/providers/supabase-provider';

export class RepositoryFactory {
  private static instance: RepositoryFactory;
  private businessRepository: IBusinessRepository | null = null;
  private businessFilesRepository: IBusinessFilesRepository | null = null;
  private fileStorageRepository: IFileStorageRepository | null = null;
  private restaurantDetailsRepository: IRestaurantDetailsRepository | null = null;
  private retailDetailsRepository: IRetailDetailsRepository | null = null;
  private serviceDetailsRepository: IServiceDetailsRepository | null = null;
  private appointmentsRepository: IAppointmentsRepository | null = null;
  private businessNumbersRepository: IBusinessNumbersRepository | null = null;
  private walletRepository: IWalletRepository | null = null;
  private transactionRepository: ITransactionRepository | null = null;

  private constructor(private readonly supabaseClient: SupabaseClient) {}

  public static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      // Create the client only when needed
      const client = createSupabaseClient();
      RepositoryFactory.instance = new RepositoryFactory(client);
    }
    return RepositoryFactory.instance;
  }

  /* public static createInstance(supabaseClient: SupabaseClient): RepositoryFactory {
    return new RepositoryFactory(supabaseClient);
  } */

  public static createWithClient(client: SupabaseClient): RepositoryFactory {
    return new RepositoryFactory(client);
  }

  public getBusinessRepository(): IBusinessRepository {
    if (!this.businessRepository) {
      this.businessRepository = new BusinessRepository(this.supabaseClient, this);
    }
    return this.businessRepository;
  }

  public getBusinessFilesRepository(): IBusinessFilesRepository {
    if (!this.businessFilesRepository) {
      this.businessFilesRepository = new BusinessFilesRepository(this.supabaseClient, this);
    }
    return this.businessFilesRepository;
  }

  public getFileStorageRepository(): IFileStorageRepository {
    if (!this.fileStorageRepository) {
      this.fileStorageRepository = new FileStorageRepository(this.supabaseClient, this);
    }
    return this.fileStorageRepository;
  }

  public getRestaurantDetailsRepository(): IRestaurantDetailsRepository {
    if (!this.restaurantDetailsRepository) {
      this.restaurantDetailsRepository = new RestaurantDetailsRepository(this.supabaseClient, this);
    }
    return this.restaurantDetailsRepository;
  }

  public getRetailDetailsRepository(): IRetailDetailsRepository {
    if (!this.retailDetailsRepository) {
      this.retailDetailsRepository = new RetailDetailsRepository(this.supabaseClient, this);
    }
    return this.retailDetailsRepository;
  }

  public getServiceDetailsRepository(): IServiceDetailsRepository {
    if (!this.serviceDetailsRepository) {
      this.serviceDetailsRepository = new ServiceDetailsRepository(this.supabaseClient, this);
    }
    return this.serviceDetailsRepository;
  }

  public getAppointmentsRepository(): IAppointmentsRepository {
    if (!this.appointmentsRepository) {
      this.appointmentsRepository = new AppointmentsRepository(this.supabaseClient, this);
    }
    return this.appointmentsRepository;
  }

  public getBusinessNumbersRepository(): IBusinessNumbersRepository {
    if (!this.businessNumbersRepository) {
      this.businessNumbersRepository = new BusinessNumbersRepository(this.supabaseClient, this);
    }
    return this.businessNumbersRepository;
  }

  public getWalletRepository(): IWalletRepository {
    if (!this.walletRepository) {
      this.walletRepository = new WalletRepository(this.supabaseClient);
    }
    return this.walletRepository;
  }

  public getTransactionRepository(): ITransactionRepository {
    if (!this.transactionRepository) {
      this.transactionRepository = new TransactionRepository(this.supabaseClient);
    }
    return this.transactionRepository;
  }

  public getClient(): SupabaseClient {
    return this.supabaseClient;
  }

  // Used primarily for testing
  public reset(): void {
    this.businessRepository = null;
    this.businessFilesRepository = null;
    this.fileStorageRepository = null;
    this.restaurantDetailsRepository = null;
    this.retailDetailsRepository = null;
    this.serviceDetailsRepository = null;
    this.appointmentsRepository = null;
    this.businessNumbersRepository = null;
    this.walletRepository = null;
    this.transactionRepository = null;
  }
}

// Convenience functions
export const getRepositoryFactory = (): RepositoryFactory => {
  return RepositoryFactory.getInstance();
};

export const getBusinessRepository = (): IBusinessRepository => {
  return getRepositoryFactory().getBusinessRepository();
};

export const getBusinessFilesRepository = (): IBusinessFilesRepository => {
  return getRepositoryFactory().getBusinessFilesRepository();
};

export const getFileStorageRepository = (): IFileStorageRepository => {
  return getRepositoryFactory().getFileStorageRepository();
};

export const getRestaurantDetailsRepository = (): IRestaurantDetailsRepository => {
  return getRepositoryFactory().getRestaurantDetailsRepository();
};

export const getRetailDetailsRepository = (): IRetailDetailsRepository => {
  return getRepositoryFactory().getRetailDetailsRepository();
};

export const getServiceDetailsRepository = (): IServiceDetailsRepository => {
  return getRepositoryFactory().getServiceDetailsRepository();
};

export const getAppointmentsRepository = (): IAppointmentsRepository => {
  return getRepositoryFactory().getAppointmentsRepository();
};

export const getBusinessNumbersRepository = (): IBusinessNumbersRepository => {
  return getRepositoryFactory().getBusinessNumbersRepository();
};

export const getWalletRepository = (): IWalletRepository => {
  return getRepositoryFactory().getWalletRepository();
};

export const getTransactionRepository = (): ITransactionRepository => {
  return getRepositoryFactory().getTransactionRepository();
};