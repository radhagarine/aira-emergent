// src/lib/services/performance/performance.service.ts
import { 
    getRepositoryFactory, 
    RepositoryFactory 
  } from '@/lib/database/repository.factory';
  import { 
    BusinessResponse 
  } from '@/lib/services/business/types';
  import { 
    DatabaseError, 
    ServiceError 
  } from '@/lib/types/shared/error.types';
  import { 
    AppointmentStatus 
  } from '@/lib/types/database/business.types';
  
  // Performance metrics interface
  export interface BusinessPerformanceMetrics {
    businessId: string;
    businessName: string;
    totalCalls: number;
    bookedPercentage: number;
    successPercentage: number;
    failurePercentage: number;
  }
  
  export interface PerformanceQueryOptions {
    startDate?: Date;
    endDate?: Date;
  }
  
  export class PerformanceService {
    private repositoryFactory: RepositoryFactory;
    private appointmentsRepository;
    private businessRepository;
  
    constructor(repoFactoryOverride?: RepositoryFactory) {
      this.repositoryFactory = repoFactoryOverride || getRepositoryFactory();
      this.appointmentsRepository = this.repositoryFactory.getAppointmentsRepository();
      this.businessRepository = this.repositoryFactory.getBusinessRepository();
    }
  
    /**
     * Get performance metrics for a specific business
     * @param businessId Business identifier
     * @param options Query options like date range
     */
    async getBusinessPerformanceMetrics(
      businessId: string, 
      options?: PerformanceQueryOptions
    ): Promise<BusinessPerformanceMetrics> {
      try {
        // Validate business exists
        const business = await this.businessRepository.getBusinessById(businessId);
        if (!business) {
          throw ServiceError.create(
            `Business with ID ${businessId} not found`,
            'NOT_FOUND',
            'No business found with the given ID'
          );
        }
  
        // Fetch appointments within the specified date range
        const dateRange = options ? {
          start: options.startDate || new Date(new Date().getFullYear(), 0, 1),
          end: options.endDate || new Date()
        } : undefined;
  
        const appointments = await this.appointmentsRepository.getByBusinessId(
          businessId, 
          dateRange
        );
  
        // Calculate metrics
        const totalAppointments = appointments.length;
        const confirmedAppointments = appointments.filter(
          apt => apt.status === 'confirmed'
        ).length;
        const completedAppointments = appointments.filter(
          apt => apt.status === 'completed'
        ).length;
        const cancelledAppointments = appointments.filter(
          apt => apt.status === 'cancelled'
        ).length;
  
        return {
          businessId: business.id,
          businessName: business.name,
          totalCalls: totalAppointments,
          bookedPercentage: totalAppointments > 0 
            ? Math.round((confirmedAppointments / totalAppointments) * 100) 
            : 0,
          successPercentage: totalAppointments > 0 
            ? Math.round((completedAppointments / totalAppointments) * 100) 
            : 0,
          failurePercentage: totalAppointments > 0 
            ? Math.round((cancelledAppointments / totalAppointments) * 100) 
            : 0
        };
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw ServiceError.fromRepositoryError(error);
        }
        if (error instanceof ServiceError) {
          throw error;
        }
        throw ServiceError.create(
          'Failed to retrieve business performance metrics',
          'PERFORMANCE_METRICS_ERROR',
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  
    /**
     * Get overall performance metrics for all businesses of a user
     * @param userId User identifier
     * @param options Query options like date range
     */
    async getUserBusinessesPerformanceMetrics(
      userId: string,
      options?: PerformanceQueryOptions
    ): Promise<BusinessPerformanceMetrics[]> {
      try {
        // Get user's businesses
        const businesses = await this.businessRepository.getBusinessesWithDetails(userId);
  
        // Fetch performance metrics for each business
        const performanceMetrics = await Promise.all(
          businesses.map(async (business) => {
            try {
              return await this.getBusinessPerformanceMetrics(
                business.id, 
                options
              );
            } catch (error) {
              // Log individual business metric fetch error, but continue processing
              console.error(
                `Failed to fetch metrics for business ${business.id}:`, 
                error
              );
              // Return a default metrics object
              return {
                businessId: business.id,
                businessName: business.name,
                totalCalls: 0,
                bookedPercentage: 0,
                successPercentage: 0,
                failurePercentage: 0
              };
            }
          })
        );
  
        return performanceMetrics;
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw ServiceError.fromRepositoryError(error);
        }
        if (error instanceof ServiceError) {
          throw error;
        }
        throw ServiceError.create(
          'Failed to retrieve user businesses performance metrics',
          'USER_PERFORMANCE_METRICS_ERROR',
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }
  
  // Export a singleton instance
  export const performanceService = new PerformanceService();