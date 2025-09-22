import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { SupabaseMock } from '@/tests/utils/mocks/supabase-mock';
import { RetailDetailsRepository } from '@/lib/database/repositories/retail-details.repository'
import { faker } from '@faker-js/faker';
import { createMockRepositoryFactory } from '@/tests/utils/mocks/repositoryMocks';
import { SupabaseClient } from '@supabase/supabase-js';
import { RetailDetailsV2Insert, RetailDetailsV2Row } from '@/lib/types/database/business.types';
import { DatabaseError } from '@/lib/types/shared/error.types';

describe('RetailDetailsRepository', () => {
    let supabaseMock: SupabaseMock;
    let repository: RetailDetailsRepository;
    let mockFactory: ReturnType<typeof createMockRepositoryFactory>;
    let existsMock: ReturnType<typeof vi.fn>;
    let getBusinessByIdMock: ReturnType<typeof vi.fn>;

    // Create reusable test data
    const createTestDetails = (override: Partial<RetailDetailsV2Row> = {}): RetailDetailsV2Row => ({
        id: faker.string.uuid(),
        business_id: faker.string.uuid(),
        store_type: 'Clothing',
        inventory_size: 500,
        has_online_store: true,
        operating_hours: null,
        delivery_available: true,
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
            type: 'retail'
        });

        // Create mock repository factory
        mockFactory = createMockRepositoryFactory(supabaseMock as unknown as SupabaseClient);
        
        // Create mock business repository with vi.fn() mocks
        mockFactory.getBusinessRepository = vi.fn().mockReturnValue({
            exists: existsMock,
            getBusinessById: getBusinessByIdMock
        });

        // Create repository with mocked dependencies
        repository = new RetailDetailsRepository(
            supabaseMock as unknown as SupabaseClient,
            mockFactory
        );
    });

    afterEach(() => {
        // Clear all mocks after each test
        vi.clearAllMocks();
        
        // Reset Supabase mock
        supabaseMock.resetMocks();
    });

    afterAll(() => {
        // Final cleanup to release any remaining resources
        vi.restoreAllMocks();
    });

    describe('Input Validation and Error Handling', () => {
        // Comprehensive input validation tests
        it('should validate business_id in create method', async () => {
            await expect(repository.create({
                business_id: '', // Empty business_id
                store_type: 'Test Store'
            } as RetailDetailsV2Insert)).rejects.toThrow(DatabaseError);
        });

        it('should handle extremely large input values', async () => {
            const businessId = faker.string.uuid();
            const longString = 'a'.repeat(10000); // Extremely long string

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            supabaseMock.mockResponse(
                ['retail_details_v2', 'insert'],
                { 
                    data: null, 
                    error: { 
                        message: 'Input too large', 
                        code: 'LIMIT_EXCEEDED' 
                    } 
                }
            );

            await expect(repository.create({
                business_id: businessId,
                store_type: longString
            })).rejects.toThrow(DatabaseError);
        });
    });

    describe('Business Type Validation', () => {
        it('should prevent create for non-retail business types', async () => {
            const businessId = faker.string.uuid();

            // Mock business with wrong type
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'service'
            });

            await expect(repository.create({
                business_id: businessId,
                store_type: 'Test Store'
            })).rejects.toThrow(DatabaseError);
        });
    });

    describe('getByBusinessId', () => {
        it('should retrieve details for a business', async () => {
            const businessId = faker.string.uuid();
            const mockDetails = createTestDetails({ business_id: businessId });

            // Reset and set specific mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            supabaseMock.mockResponse(
                ['retail_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
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
                type: 'retail'
            });

            supabaseMock.mockResponse(
                ['retail_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
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
                type: 'restaurant'
            });

            await expect(repository.getByBusinessId(businessId))
                .rejects.toThrow(DatabaseError);
        });
    });

    describe('create', () => {
        it('should create new retail details', async () => {
            const businessId = faker.string.uuid();
            const newDetails = createTestDetails({ business_id: businessId });

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            supabaseMock.mockResponse(
                ['retail_details_v2', 'insert'],
                { data: newDetails, error: null }
            );

            const result = await repository.create({
                business_id: businessId,
                store_type: newDetails.store_type,
                inventory_size: newDetails.inventory_size,
                has_online_store: newDetails.has_online_store,
                delivery_available: newDetails.delivery_available
            });

            expect(result).toEqual(newDetails);
        });

        it('should throw error for non-existent business', async () => {
            const businessId = faker.string.uuid();

            // Set mock to return false for business existence
            existsMock.mockResolvedValue(false);

            await expect(repository.create({
                business_id: businessId,
                store_type: 'Test Store'
            })).rejects.toThrow(DatabaseError);
        });

        it('should throw error for wrong business type', async () => {
            const businessId = faker.string.uuid();

            // Set mocks to simulate wrong business type
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            await expect(repository.create({
                business_id: businessId,
                store_type: 'Test Store'
            })).rejects.toThrow(DatabaseError);
        });

        it('should handle database insert errors', async () => {
            const businessId = faker.string.uuid();

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            supabaseMock.mockResponse(
                ['retail_details_v2', 'insert'],
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
                store_type: 'Test Store'
            })).rejects.toThrow(DatabaseError);
        });
    });

    describe('update', () => {
        it('should update existing retail details', async () => {
            const detailsId = faker.string.uuid();
            const businessId = faker.string.uuid();
            const existingDetails = createTestDetails({ 
                id: detailsId, 
                business_id: businessId 
            });
            const updatedDetails = {
                ...existingDetails,
                store_type: 'Updated Store Type',
                inventory_size: 750
            };

            // Mock getting existing details
            supabaseMock.mockResponse(
                ['retail_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            // Mock update operation
            supabaseMock.mockResponse(
                ['retail_details_v2', 'update'],
                { data: updatedDetails, error: null }
            );

            const result = await repository.update(detailsId, {
                store_type: 'Updated Store Type',
                inventory_size: 750
            });

            expect(result).toEqual(updatedDetails);
        });

        it('should throw error when updating non-existent details', async () => {
            const detailsId = faker.string.uuid();

            supabaseMock.mockResponse(
                ['retail_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: null, error: { code: 'PGRST116' } }
            );

            await expect(repository.update(detailsId, {
                store_type: 'Updated Store Type'
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
                ['retail_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Mock business with wrong type
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            await expect(repository.update(detailsId, {
                store_type: 'Updated Store Type'
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
                ['retail_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            // Mock update operation error
            supabaseMock.mockResponse(
                ['retail_details_v2', 'update'],
                { 
                    data: null, 
                    error: { 
                        message: 'Update failed', 
                        code: 'UPDATE_ERROR' 
                    } 
                }
            );

            await expect(repository.update(detailsId, {
                store_type: 'Updated Store Type'
            })).rejects.toThrow(DatabaseError);
        });
    });

    describe('delete', () => {
        it('should delete existing retail details', async () => {
            const detailsId = faker.string.uuid();
            const businessId = faker.string.uuid();
            const existingDetails = createTestDetails({ 
                id: detailsId, 
                business_id: businessId 
            });

            // Mock getting existing details
            supabaseMock.mockResponse(
                ['retail_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            // Mock delete operation
            supabaseMock.mockResponse(
                ['retail_details_v2', 'delete', `eq:id:${detailsId}`],
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
                ['retail_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
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
                ['retail_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
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
                ['retail_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            // Mock delete operation error
            supabaseMock.mockResponse(
                ['retail_details_v2', 'delete', `eq:id:${detailsId}`],
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
                type: 'retail'
            });

            supabaseMock.mockResponse(
                ['retail_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
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
                type: 'retail'
            });

            supabaseMock.mockResponse(
                ['retail_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
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

    describe('Performance and Concurrency', () => {
        it('should handle high-frequency concurrent operations', async () => {
            const businessId = faker.string.uuid();
            const mockDetails = createTestDetails({ business_id: businessId });

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            supabaseMock.mockResponse(
                ['retail_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
                { data: mockDetails, error: null }
            );

            // Simulate 50 concurrent operations
            const concurrentOperations = Array(50).fill(null).map(() => 
                repository.getByBusinessId(businessId)
            );

            const results = await Promise.all(concurrentOperations);

            // Verify all operations return the same result
            results.forEach(result => {
                expect(result).toEqual(mockDetails);
            });
        });

        it('should have consistent performance under repeated calls', async () => {
            const businessId = faker.string.uuid();
            const mockDetails = createTestDetails({ business_id: businessId });

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            supabaseMock.mockResponse(
                ['retail_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
                { data: mockDetails, error: null }
            );

            const startTime = performance.now();
            for (let i = 0; i < 100; i++) {
                await repository.getByBusinessId(businessId);
            }
            const endTime = performance.now();

            // Ensure overall operation time is reasonable
            expect(endTime - startTime).toBeLessThan(5000); // 5 seconds for 100 operations
        });
    });

    describe('Boundary Condition Tests', () => {
        it('should handle minimal valid input', async () => {
            const businessId = faker.string.uuid();

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            supabaseMock.mockResponse(
                ['retail_details_v2', 'insert'],
                { 
                    data: { 
                        id: faker.string.uuid(),
                        business_id: businessId,
                        store_type: '',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }, 
                    error: null 
                }
            );

            const result = await repository.create({
                business_id: businessId,
                store_type: ''
            });

            expect(result).toBeTruthy();
            expect(result.business_id).toBe(businessId);
        });

        it('should handle optional fields gracefully', async () => {
            const businessId = faker.string.uuid();

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            supabaseMock.mockResponse(
                ['retail_details_v2', 'insert'],
                { 
                    data: { 
                        id: faker.string.uuid(),
                        business_id: businessId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }, 
                    error: null 
                }
            );

            const result = await repository.create({
                business_id: businessId
            });

            expect(result).toBeTruthy();
            expect(result.business_id).toBe(businessId);
        });
    });

    describe('Error Propagation', () => {
        it('should propagate underlying database errors', async () => {
            const businessId = faker.string.uuid();

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'retail'
            });

            supabaseMock.mockResponse(
                ['retail_details_v2', 'insert'],
                { 
                    data: null, 
                    error: { 
                        message: 'Unique constraint violation', 
                        code: '23505' 
                    } 
                }
            );

            await expect(repository.create({
                business_id: businessId,
                store_type: 'Duplicate Store'
            })).rejects.toThrow(DatabaseError);
        });
    });
});