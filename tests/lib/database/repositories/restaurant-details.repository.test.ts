import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { SupabaseMock } from '@/tests/utils/mocks/supabase-mock';
import { RestaurantDetailsRepository } from '@/lib/database/repositories/restaurant-details.repository'
import { faker } from '@faker-js/faker';
import { createMockRepositoryFactory } from '@/tests/utils/mocks/repositoryMocks';
import { SupabaseClient } from '@supabase/supabase-js';
import { RestaurantDetailsV2Row } from '@/lib/types/database/business.types';
import { DatabaseError } from '@/lib/types/shared/error.types';

describe('RestaurantDetailsRepository', () => {
    let supabaseMock: SupabaseMock;
    let repository: RestaurantDetailsRepository;
    let mockFactory: ReturnType<typeof createMockRepositoryFactory>;
    let existsMock: ReturnType<typeof vi.fn>;
    let getBusinessByIdMock: ReturnType<typeof vi.fn>;

    // Create reusable test data
    const createTestDetails = (override: Partial<RestaurantDetailsV2Row> = {}): RestaurantDetailsV2Row => ({
        id: faker.string.uuid(),
        business_id: faker.string.uuid(),
        menu_items: 'Test Menu',
        seating_capacity: 100,
        cuisine_type: 'Italian',
        operating_hours: null,
        delivery_available: true,
        takeout_available: true,
        agent_instructions: null,
        ai_communication_style: null,
        greeting_message: null,
        special_instructions: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...override
    });

    beforeEach(() => {
        // Reset mocks before each test
        supabaseMock = new SupabaseMock();
        
        // Create individual mocks
        existsMock = vi.fn();
        getBusinessByIdMock = vi.fn();

        // Setup default mock implementations
        existsMock.mockResolvedValue(true);
        getBusinessByIdMock.mockResolvedValue({
            id: faker.string.uuid(),
            type: 'restaurant'
        });

        // Create mock repository factory
        mockFactory = createMockRepositoryFactory(supabaseMock as unknown as SupabaseClient);
        
        // Create mock business repository with vi.fn() mocks
        mockFactory.getBusinessRepository = vi.fn().mockReturnValue({
            exists: existsMock,
            getBusinessById: getBusinessByIdMock
        });

        // Create repository with mocked dependencies
        repository = new RestaurantDetailsRepository(
            supabaseMock as unknown as SupabaseClient,
            mockFactory
        );
    });

    afterEach(() => {
        // Clear all mocks after each test
        vi.clearAllMocks();
        
        // Reset Supabase mock
        supabaseMock.resetMocks();

        vi.clearAllMocks();
    });

    afterAll(() => {
        // Final cleanup to release any remaining resources
        vi.restoreAllMocks();
    });

    describe('getByBusinessId', () => {
        it('should retrieve details for a business', async () => {
            const businessId = faker.string.uuid();
            const mockDetails = createTestDetails({ business_id: businessId });

            // Reset and set specific mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
                { data: mockDetails, error: null }
            );

            const result = await repository.getByBusinessId(businessId);
            expect(result).toEqual(mockDetails);
            
            // Verify mock calls
            expect(existsMock).toHaveBeenCalledWith(businessId);
            expect(getBusinessByIdMock).toHaveBeenCalledWith(businessId);
        });

        it('should return null when no details exist', async () => {
            const businessId = faker.string.uuid();

            // Reset and set specific mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
                { 
                    data: null, 
                    error: { 
                        message: 'Not found', 
                        code: 'PGRST116' 
                    } 
                }
            );

            const result = await repository.getByBusinessId(businessId);
            expect(result).toBeNull();
        });

        it('should throw error for non-existent business', async () => {
            const businessId = faker.string.uuid();
            
            // Set mock to return false for business existence
            existsMock.mockResolvedValue(false);

            await expect(repository.getByBusinessId(businessId))
                .rejects.toThrow(DatabaseError);
        });

        it('should throw error for wrong business type', async () => {
            const businessId = faker.string.uuid();
            
            // Set mocks to simulate wrong business type
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            await expect(repository.getByBusinessId(businessId))
                .rejects.toThrow(DatabaseError);
        });
    });

    describe('create', () => {
        it('should create new restaurant details', async () => {
            const businessId = faker.string.uuid();
            const newDetails = createTestDetails({ business_id: businessId });

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'insert'],
                { data: newDetails, error: null }
            );

            const result = await repository.create({
                business_id: businessId,
                menu_items: newDetails.menu_items,
                seating_capacity: newDetails.seating_capacity,
                cuisine_type: newDetails.cuisine_type,
                delivery_available: newDetails.delivery_available,
                takeout_available: newDetails.takeout_available
            });

            expect(result).toEqual(newDetails);
        });

        it('should throw error for non-existent business', async () => {
            const businessId = faker.string.uuid();

            // Set mock to return false for business existence
            existsMock.mockResolvedValue(false);

            await expect(repository.create({
                business_id: businessId,
                menu_items: 'Test Menu'
            })).rejects.toThrow(DatabaseError);
        });

        it('should throw error for wrong business type', async () => {
            const businessId = faker.string.uuid();

            // Set mocks to simulate wrong business type
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            await expect(repository.create({
                business_id: businessId,
                menu_items: 'Test Menu'
            })).rejects.toThrow(DatabaseError);
        });

        it('should handle database insert errors', async () => {
            const businessId = faker.string.uuid();

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'insert'],
                { 
                    data: null, 
                    error: { 
                        message: 'Insert failed', 
                        code: 'INSERT_ERROR' 
                    } 
                }
            );

            await expect(repository.create({
                business_id: businessId,
                menu_items: 'Test Menu'
            })).rejects.toThrow(DatabaseError);
        });
    });

    describe('update', () => {
        it('should update existing restaurant details', async () => {
            const detailsId = faker.string.uuid();
            const businessId = faker.string.uuid();
            const existingDetails = createTestDetails({ 
                id: detailsId, 
                business_id: businessId 
            });
            const updatedDetails = {
                ...existingDetails,
                menu_items: 'Updated Menu',
                seating_capacity: 150
            };

            // Mock getting existing details
            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            // Mock update operation
            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'update'],
                { data: updatedDetails, error: null }
            );

            const result = await repository.update(detailsId, {
                menu_items: 'Updated Menu',
                seating_capacity: 150
            });

            expect(result).toEqual(updatedDetails);
        });

        it('should throw error when updating non-existent details', async () => {
            const detailsId = faker.string.uuid();

            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: null, error: { code: 'PGRST116' } }
            );

            await expect(repository.update(detailsId, {
                menu_items: 'Updated Menu'
            })).rejects.toThrow(DatabaseError);
        });

        it('should throw error for invalid business type', async () => {
            const detailsId = faker.string.uuid();
            const businessId = faker.string.uuid();
            const existingDetails = createTestDetails({ 
                id: detailsId, 
                business_id: businessId 
            });

            // Mock getting existing details
            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Mock business with wrong type
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            await expect(repository.update(detailsId, {
                menu_items: 'Updated Menu'
            })).rejects.toThrow(DatabaseError);
        });

        it('should handle database update errors', async () => {
            const detailsId = faker.string.uuid();
            const businessId = faker.string.uuid();
            const existingDetails = createTestDetails({ 
                id: detailsId, 
                business_id: businessId 
            });

            // Mock getting existing details
            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            // Mock update operation error
            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'update'],
                { 
                    data: null, 
                    error: { 
                        message: 'Update failed', 
                        code: 'UPDATE_ERROR' 
                    } 
                }
            );

            await expect(repository.update(detailsId, {
                menu_items: 'Updated Menu'
            })).rejects.toThrow(DatabaseError);
        });
    });

    describe('delete', () => {
        it('should delete existing restaurant details', async () => {
            const detailsId = faker.string.uuid();
            const businessId = faker.string.uuid();
            const existingDetails = createTestDetails({ 
                id: detailsId, 
                business_id: businessId 
            });

            // Mock getting existing details
            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            // Mock delete operation
            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'delete', `eq:id:${detailsId}`],
                { data: null, error: null }
            );

            await repository.delete(detailsId);

            // Verify mock calls
            expect(existsMock).toHaveBeenCalledWith(businessId);
            expect(getBusinessByIdMock).toHaveBeenCalledWith(businessId);
        });

        it('should throw error when deleting non-existent details', async () => {
            const detailsId = faker.string.uuid();

            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: null, error: { code: 'PGRST116' } }
            );

            await expect(repository.delete(detailsId))
                .rejects.toThrow(DatabaseError);
        });

        it('should throw error for invalid business type', async () => {
            const detailsId = faker.string.uuid();
            const businessId = faker.string.uuid();
            const existingDetails = createTestDetails({ 
                id: detailsId, 
                business_id: businessId 
            });

            // Mock getting existing details
            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            await expect(repository.delete(detailsId))
                .rejects.toThrow(DatabaseError);
        });

        it('should handle database delete errors', async () => {
            const detailsId = faker.string.uuid();
            const businessId = faker.string.uuid();
            const existingDetails = createTestDetails({ 
                id: detailsId, 
                business_id: businessId 
            });

            // Mock getting existing details
            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            // Mock delete operation error
            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'delete', `eq:id:${detailsId}`],
                { 
                    data: null, 
                    error: { 
                        message: 'Delete failed', 
                        code: 'DELETE_ERROR' 
                    } 
                }
            );

            await expect(repository.delete(detailsId))
                .rejects.toThrow(DatabaseError);
        });
    });

    // Memory Management Test
    describe('Resource Management', () => {
        it('should not leak memory between operations', async () => {
            const businessId = faker.string.uuid();
            const mockDetails = createTestDetails({ business_id: businessId });

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
                { data: mockDetails, error: null }
            );

            // Perform multiple operations
            const initialMemoryUsage = process.memoryUsage().heapUsed;
            
            for (let i = 0; i < 10; i++) {
                await repository.getByBusinessId(businessId);
            }

            const finalMemoryUsage = process.memoryUsage().heapUsed;
            
            // Allow for some memory fluctuation, but ensure it doesn't grow significantly
            expect(finalMemoryUsage).toBeLessThan(initialMemoryUsage + 5_000_000); // 5MB tolerance
        });

        it('should handle concurrent operations', async () => {
            const businessId = faker.string.uuid();
            const mockDetails = createTestDetails({ business_id: businessId });

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
                { data: mockDetails, error: null }
            );

            // Simulate concurrent operations
            const concurrentOperations = Array(5).fill(null).map(() => 
                repository.getByBusinessId(businessId)
            );

            const results = await Promise.all(concurrentOperations);

            // Verify all operations return the same result
            results.forEach(result => {
                expect(result).toEqual(mockDetails);
            });
        });
    });

    describe('Comprehensive Error Scenarios', () => {
        it('should handle unexpected error formats gracefully', async () => {
            const businessId = faker.string.uuid();
        
            // Reset and set mock implementations for validation to pass
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });
        
            // Simulate an error with an unexpected structure
            supabaseMock.mockResponse(
                ['restaurant_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
                { 
                    data: null, 
                    error: 'Unexpected error format' 
                }
            );
        
            try {
                await repository.getByBusinessId(businessId);
                // Should not reach here
                expect(true).toBe(false);
            } catch (error) {
                // Just check if it's a DatabaseError without checking the specific message
                expect(error).toBeInstanceOf(DatabaseError);
            }
        });
    });
});