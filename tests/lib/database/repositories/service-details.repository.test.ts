import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { SupabaseMock } from '@/tests/utils/mocks/supabase-mock';
import { ServiceDetailsRepository } from '@/lib/database/repositories/service-details.repository'
import { faker } from '@faker-js/faker';
import { createMockRepositoryFactory } from '@/tests/utils/mocks/repositoryMocks';
import { SupabaseClient } from '@supabase/supabase-js';
import { ServiceDetailsV2Row } from '@/lib/types/database/business.types';
import { DatabaseError } from '@/lib/types/shared/error.types';

describe('ServiceDetailsRepository', () => {
    let supabaseMock: SupabaseMock;
    let repository: ServiceDetailsRepository;
    let mockFactory: ReturnType<typeof createMockRepositoryFactory>;
    let existsMock: ReturnType<typeof vi.fn>;
    let getBusinessByIdMock: ReturnType<typeof vi.fn>;

    // Create reusable test data
    const createTestDetails = (override: Partial<ServiceDetailsV2Row> = {}): ServiceDetailsV2Row => ({
        id: faker.string.uuid(),
        business_id: faker.string.uuid(),
        service_type: 'Consulting',
        service_area: 'Global',
        is_mobile_service: true,
        requires_booking: true,
        operating_hours: null,
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
            type: 'service'
        });

        // Create mock repository factory
        mockFactory = createMockRepositoryFactory(supabaseMock as unknown as SupabaseClient);
        
        // Create mock business repository with vi.fn() mocks
        mockFactory.getBusinessRepository = vi.fn().mockReturnValue({
            exists: existsMock,
            getBusinessById: getBusinessByIdMock
        });

        // Create repository with mocked dependencies
        repository = new ServiceDetailsRepository(
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

    describe('Database Connectivity and Error Handling', () => {
        it('should handle database connection errors during getByBusinessId', async () => {
            const businessId = faker.string.uuid();

            supabaseMock.mockResponse(
                ['service_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
                { 
                    data: null, 
                    error: { 
                        message: 'Network error', 
                        code: 'CONNECTION_ERROR' 
                    } 
                }
            );

            await expect(repository.getByBusinessId(businessId))
                .rejects
                .toThrow(DatabaseError);
        });

        it('should handle database connection errors during create', async () => {
            const businessId = faker.string.uuid();

            supabaseMock.mockResponse(
                ['service_details_v2', 'insert'],
                { 
                    data: null, 
                    error: { 
                        message: 'Connection timeout', 
                        code: 'CONNECTION_TIMEOUT' 
                    } 
                }
            );

            await expect(repository.create({
                business_id: businessId,
                service_type: 'Test Service'
            })).rejects.toThrow(DatabaseError);
        });
    });

    describe('Field Validation and Boundary Conditions', () => {
        it('should validate service type length', async () => {
            const businessId = faker.string.uuid();
            
            // Very long service type
            const longServiceType = 'A'.repeat(256);

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'service'
            });

            supabaseMock.mockResponse(
                ['service_details_v2', 'insert'],
                { 
                    data: null, 
                    error: { 
                        message: 'Service type too long', 
                        code: 'LENGTH_EXCEEDED' 
                    } 
                }
            );

            await expect(repository.create({
                business_id: businessId,
                service_type: longServiceType
            })).rejects.toThrow(DatabaseError);
        });

        it('should handle null or empty required fields', async () => {
            const businessId = faker.string.uuid();

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'service'
            });

            supabaseMock.mockResponse(
                ['service_details_v2', 'insert'],
                { 
                    data: null, 
                    error: { 
                        message: 'Required fields missing', 
                        code: 'REQUIRED_FIELD_MISSING' 
                    } 
                }
            );

            await expect(repository.create({
                business_id: businessId,
                service_type: '' // Empty string
            })).rejects.toThrow(DatabaseError);
        });
    });

    describe('Performance and Edge Cases', () => {
        it('should handle multiple concurrent create operations', async () => {
            const businessId = faker.string.uuid();

            // Simulate multiple concurrent inserts
            const insertPromises = Array.from({ length: 5 }, () => 
                repository.create({
                    business_id: businessId,
                    service_type: faker.company.name()
                })
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'service'
            });

            // Simulate successful responses for each insert
            insertPromises.forEach((_, index) => {
                supabaseMock.mockResponse(
                    ['service_details_v2', 'insert'],
                    { 
                        data: createTestDetails({ business_id: businessId }), 
                        error: null 
                    }
                );
            });

            const results = await Promise.all(insertPromises);
            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result).toBeDefined();
                expect(result.business_id).toBe(businessId);
            });
        });

        it('should handle large batch update', async () => {
            const businessId = faker.string.uuid();
            const details = createTestDetails({ business_id: businessId });

            // Simulate large batch update
            const batchUpdateData = {
                service_type: 'Large Batch Service',
                is_mobile_service: false,
                requires_booking: false,
                service_area: 'Updated Large Area',
                special_instructions: 'Batch update test with very long special instructions...'
            };

            // Mock getting existing details
            supabaseMock.mockResponse(
                ['service_details_v2', 'select:*', `eq:id:${details.id}`, 'single'],
                { data: details, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'service'
            });

            // Mock update operation
            supabaseMock.mockResponse(
                ['service_details_v2', 'update'],
                { data: { ...details, ...batchUpdateData }, error: null }
            );

            const result = await repository.update(details.id, batchUpdateData);

            expect(result).toBeDefined();
            expect(result.service_type).toBe(batchUpdateData.service_type);
            expect(result.is_mobile_service).toBe(batchUpdateData.is_mobile_service);
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
                type: 'service'
            });

            supabaseMock.mockResponse(
                ['service_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
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
                type: 'service'
            });

            supabaseMock.mockResponse(
                ['service_details_v2', 'select:*', `eq:business_id:${businessId}`, 'single'],
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
        it('should create new service details', async () => {
            const businessId = faker.string.uuid();
            const newDetails = createTestDetails({ business_id: businessId });

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'service'
            });

            supabaseMock.mockResponse(
                ['service_details_v2', 'insert'],
                { data: newDetails, error: null }
            );

            const result = await repository.create({
                business_id: businessId,
                service_type: newDetails.service_type,
                service_area: newDetails.service_area,
                is_mobile_service: newDetails.is_mobile_service,
                requires_booking: newDetails.requires_booking
            });

            expect(result).toEqual(newDetails);
        });

        it('should throw error for non-existent business', async () => {
            const businessId = faker.string.uuid();

            // Set mock to return false for business existence
            existsMock.mockResolvedValue(false);

            await expect(repository.create({
                business_id: businessId,
                service_type: 'Test Service'
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
                service_type: 'Test Service'
            })).rejects.toThrow(DatabaseError);
        });

        it('should handle database insert errors', async () => {
            const businessId = faker.string.uuid();

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'service'
            });

            supabaseMock.mockResponse(
                ['service_details_v2', 'insert'],
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
                service_type: 'Test Service'
            })).rejects.toThrow(DatabaseError);
        });
    });

    describe('update', () => {
        it('should update existing service details', async () => {
            const detailsId = faker.string.uuid();
            const businessId = faker.string.uuid();
            const existingDetails = createTestDetails({ 
                id: detailsId, 
                business_id: businessId 
            });
            const updatedDetails = {
                ...existingDetails,
                service_type: 'Updated Service Type',
                service_area: 'Regional'
            };

            // Mock getting existing details
            supabaseMock.mockResponse(
                ['service_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'service'
            });

            // Mock update operation
            supabaseMock.mockResponse(
                ['service_details_v2', 'update'],
                { data: updatedDetails, error: null }
            );

            const result = await repository.update(detailsId, {
                service_type: 'Updated Service Type',
                service_area: 'Regional'
            });

            expect(result).toEqual(updatedDetails);
        });

        it('should throw error when updating non-existent details', async () => {
            const detailsId = faker.string.uuid();

            supabaseMock.mockResponse(
                ['service_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: null, error: { code: 'PGRST116' } }
            );

            await expect(repository.update(detailsId, {
                service_type: 'Updated Service Type'
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
                ['service_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Mock business with wrong type
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'restaurant'
            });

            await expect(repository.update(detailsId, {
                service_type: 'Updated Service Type'
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
                ['service_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'service'
            });

            // Mock update operation error
            supabaseMock.mockResponse(
                ['service_details_v2', 'update'],
                { 
                    data: null, 
                    error: { 
                        message: 'Update failed', 
                        code: 'UPDATE_ERROR' 
                    } 
                }
            );

            await expect(repository.update(detailsId, {
                service_type: 'Updated Service Type'
            })).rejects.toThrow(DatabaseError);
        });
    });

    describe('delete', () => {
        it('should delete existing service details', async () => {
            const detailsId = faker.string.uuid();
            const businessId = faker.string.uuid();
            const existingDetails = createTestDetails({ 
                id: detailsId, 
                business_id: businessId 
            });

            // Mock getting existing details
            supabaseMock.mockResponse(
                ['service_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
                { data: existingDetails, error: null }
            );

            // Reset and set mock implementations
            existsMock.mockResolvedValue(true);
            getBusinessByIdMock.mockResolvedValue({
                id: businessId,
                type: 'service'
            });

            // Mock delete operation
            supabaseMock.mockResponse(
                ['service_details_v2', 'delete', `eq:id:${detailsId}`],
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
                ['service_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
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
                ['service_details_v2', 'select:*', `eq:id:${detailsId}`, 'single'],
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
    });
});
