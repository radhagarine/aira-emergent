// src/lib/services/performance/advanced-performance.service.ts
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
    AppointmentStatus,
    BusinessType
  } from '@/lib/types/database/business.types';
  
  // Enhanced performance metrics interfaces
  export interface DetailedPerformanceMetrics {
    businessId: string;
    businessName: string;
    businessType: BusinessType;
    
    // Core metrics
    totalCalls: number;
    bookedPercentage: number;
    successPercentage: number;
    failurePercentage: number;
    
    // Advanced metrics
    averageResponseTime: number; // in minutes
    peakHours: string[];
    slowestHours: string[];
    
    // Trend analysis
    weekOverWeekChange: {
      calls: number;
      bookedRate: number;
      successRate: number;
    };
  }
  
  export interface PerformanceQueryOptions {
    startDate?: Date;
    endDate?: Date;
    businessTypes?: BusinessType[];
    groupBy?: 'day' | 'week' | 'month';
  }
  
  export class AdvancedPerformanceService {
    private repositoryFactory: RepositoryFactory;
    private appointmentsRepository;
    private businessRepository;
  
    constructor(repoFactoryOverride?: RepositoryFactory) {
      this.repositoryFactory = repoFactoryOverride || getRepositoryFactory();
      this.appointmentsRepository = this.repositoryFactory.getAppointmentsRepository();
      this.businessRepository = this.repositoryFactory.getBusinessRepository();
    }
  
    /**
     * Get detailed performance metrics for a specific business
     * @param businessId Business identifier
     * @param options Advanced query options
     */
    async getDetailedBusinessPerformance(
      businessId: string, 
      options?: PerformanceQueryOptions
    ): Promise<DetailedPerformanceMetrics> {
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
  
        // Advanced metrics calculation
        const totalAppointments = appointments.length;
        const confirmedAppointments = appointments.filter(
          apt => apt.status === 'confirmed'
        );
        const completedAppointments = appointments.filter(
          apt => apt.status === 'completed'
        );
        const cancelledAppointments = appointments.filter(
          apt => apt.status === 'cancelled'
        );
  
        // Calculate response times
        const responseTimes = appointments.map(apt => {
          const created = new Date(apt.created_at || Date.now()).getTime();
          const updated = new Date(apt.updated_at || Date.now()).getTime();
          return (updated - created) / (1000 * 60); // Convert to minutes
        });
  
        // Analyze appointment hours
        const appointmentHours = appointments.map(apt => 
          new Date(apt.start_time).getHours()
        );
        
        // Group hours and find peak/slowest
        const hourFrequency = appointmentHours.reduce((acc, hour) => {
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);
  
        const sortedHours = Object.entries(hourFrequency)
          .sort((a, b) => b[1] - a[1])
          .map(([hour]) => `${hour}:00`);
  
        return {
          businessId: business.id,
          businessName: business.name,
          businessType: business.type,
          
          // Core metrics
          totalCalls: totalAppointments,
          bookedPercentage: totalAppointments > 0 
            ? Math.round((confirmedAppointments.length / totalAppointments) * 100) 
            : 0,
          successPercentage: totalAppointments > 0 
            ? Math.round((completedAppointments.length / totalAppointments) * 100) 
            : 0,
          failurePercentage: totalAppointments > 0 
            ? Math.round((cancelledAppointments.length / totalAppointments) * 100) 
            : 0,
          
          // Advanced metrics
          averageResponseTime: responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0,
          peakHours: sortedHours.slice(0, 3),
          slowestHours: sortedHours.slice(-3).reverse(),
          
          // Trend analysis (simplified - would require more complex historical data)
          weekOverWeekChange: {
            calls: 0,
            bookedRate: 0,
            successRate: 0
          }
        };
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw ServiceError.fromRepositoryError(error);
        }
        if (error instanceof ServiceError) {
          throw error;
        }
        throw ServiceError.create(
          'Failed to retrieve detailed business performance metrics',
          'DETAILED_PERFORMANCE_METRICS_ERROR',
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  
    /**
     * Get aggregated performance metrics for all businesses of a user
     * @param userId User identifier
     * @param options Advanced query options
     */
    async getAggregatedBusinessesPerformance(
      userId: string,
      options?: PerformanceQueryOptions
    ): Promise<DetailedPerformanceMetrics[]> {
      try {
        // Get user's businesses, optionally filtered by type
        const businesses = await this.businessRepository.getBusinessesWithDetails(
          userId
        );
  
        // Fetch performance metrics for each business
        const performanceMetrics = await Promise.all(
          businesses.map(async (business) => {
            try {
              return await this.getDetailedBusinessPerformance(
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
                businessType: business.type,
                totalCalls: 0,
                bookedPercentage: 0,
                successPercentage: 0,
                failurePercentage: 0,
                averageResponseTime: 0,
                peakHours: [],
                slowestHours: [],
                weekOverWeekChange: {
                  calls: 0,
                  bookedRate: 0,
                  successRate: 0
                }
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
          'Failed to retrieve aggregated businesses performance metrics',
          'AGGREGATED_PERFORMANCE_METRICS_ERROR',
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }
  
  // Export a singleton instance
  export const advancedPerformanceService = new AdvancedPerformanceService();