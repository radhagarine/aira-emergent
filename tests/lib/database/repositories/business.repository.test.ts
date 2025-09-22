import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SupabaseMock } from '@/tests/utils/mocks/supabase-mock';
import { BusinessRepository } from '@/lib/database/repositories/business.repository';
import { faker } from '@faker-js/faker';
import { createMockRepositoryFactory } from '@/tests/utils/mocks/repositoryMocks';
import { SupabaseClient } from '@supabase/supabase-js';
import { BusinessV2Row, BusinessWithDetails, BusinessFileType } from '@/lib/types/database/business.types';
import { DatabaseError } from '@/lib/types/shared/error.types';

describe('BusinessRepository', () => {
    let supabaseMock: SupabaseMock;
    let businessRepository: BusinessRepository;
    let mockFactory: ReturnType<typeof createMockRepositoryFactory>;

    // Helper function to create test data
    const createTestBusiness = (): BusinessV2Row => ({
        id: faker.string.uuid(),
        name: 'Test Business',
        user_id: faker.string.uuid(),
        type: 'restaurant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        address: '123 Test St',
        email: 'test@example.com',
        phone: '1234567890',
        profile_image: null
    });

    // Helper function to create a test business with details
    const createTestBusinessWithDetails = (): BusinessWithDetails => {
        const business = createTestBusiness();
        return {
            ...business,
            restaurant_details_v2: {
                id: faker.string.uuid(),
                business_id: business.id,
                menu_items: 'Test Menu',
                cuisine_type: 'Italian',
                seating_capacity: 50,
                delivery_available: true,
                takeout_available: true,
                operating_hours: '9-5',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                agent_instructions: null,
                ai_communication_style: null,
                greeting_message: null,
                special_instructions: null
            },
            retail_details_v2: null,
            service_details_v2: null
        };
    };

    // Helper to setup mock file storage repository
    const setupMockFileStorage = (publicUrl: string) => {
        const uploadResult = {
            storagePath: 'path/to/file.jpg',
            publicUrl
        };
        const mockFileStorageRepo = {
            uploadFile: vi.fn().mockResolvedValue(uploadResult),
            deleteFile: vi.fn().mockResolvedValue(undefined),
            getPublicUrl: vi.fn().mockReturnValue(publicUrl)
        };
        mockFactory.getFileStorageRepository = vi.fn().mockReturnValue(mockFileStorageRepo);
        return mockFileStorageRepo;
    };

    beforeEach(() => {
        supabaseMock = new SupabaseMock();
        mockFactory = createMockRepositoryFactory(supabaseMock as unknown as SupabaseClient);
        businessRepository = new BusinessRepository(
            supabaseMock as unknown as SupabaseClient,
            mockFactory
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Basic CRUD operations', () => {
        it('should retrieve businesses with details for a user', async () => {
            const userId = faker.string.uuid();
            const mockBusinessWithDetails = createTestBusinessWithDetails();
            mockBusinessWithDetails.user_id = userId;

            // Use type assertion to match Supabase client type
            vi.spyOn(supabaseMock, 'from').mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ 
                    data: [mockBusinessWithDetails], 
                    error: null 
                }),
                single: vi.fn().mockResolvedValue({ 
                    data: mockBusinessWithDetails, 
                    error: null 
                }),
                insert: vi.fn().mockReturnThis(),
                update: vi.fn().mockReturnThis(),
                delete: vi.fn().mockResolvedValue({ error: null }),
            } as any);

            const result = await businessRepository.getBusinessesWithDetails(userId);
            expect(result).toEqual([mockBusinessWithDetails]);
        });

        it('should retrieve a business with details by ID', async () => {
            const businessId = faker.string.uuid();
            const mockBusinessWithDetails = createTestBusinessWithDetails();
            mockBusinessWithDetails.id = businessId;

            // Use type assertion to match Supabase client type
            vi.spyOn(supabaseMock, 'from').mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ 
                    data: mockBusinessWithDetails, 
                    error: null 
                }),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
                insert: vi.fn().mockReturnThis(),
                update: vi.fn().mockReturnThis(),
                delete: vi.fn().mockResolvedValue({ error: null }),
            } as any);

            const result = await businessRepository.getBusinessWithDetails(businessId);
            expect(result).toEqual(mockBusinessWithDetails);
        });

        it('should create a business with text profile image', async () => {
            const mockBusiness = createTestBusiness();
            const businessData = {
                name: mockBusiness.name,
                user_id: mockBusiness.user_id,
                type: mockBusiness.type as any,
                address: mockBusiness.address,
                email: mockBusiness.email,
                phone: mockBusiness.phone,
                profile_image: 'https://example.com/image.jpg'
            };

            // Use type assertion to match Supabase client type
            vi.spyOn(supabaseMock, 'from').mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ 
                    data: mockBusiness, 
                    error: null 
                }),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
                update: vi.fn().mockReturnThis(),
                delete: vi.fn().mockResolvedValue({ error: null }),
            } as any);

            const result = await businessRepository.createBusiness(businessData);
            expect(result).toEqual(mockBusiness);
        });

        it('should update a business with file profile image', async () => {
            const businessId = faker.string.uuid();
            const mockBusiness = createTestBusiness();
            mockBusiness.id = businessId;
            mockBusiness.profile_image = 'https://example.com/old.jpg';
            
            const mockFile = new File(['test'], 'updated.jpg', { type: 'image/jpeg' });
            const mockFileStorageRepo = setupMockFileStorage('https://example.com/updated.jpg');
            
            const updateData = {
                name: 'Updated Business',
                profile_image: mockFile
            };

            // Mock the first call (select existing business)
            vi.spyOn(supabaseMock, 'from')
                .mockReturnValueOnce({
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ 
                        data: mockBusiness, 
                        error: null 
                    }),
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                    insert: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    delete: vi.fn().mockResolvedValue({ error: null }),
                } as any)
                // Mock the second call (update business)
                .mockReturnValueOnce({
                    update: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ 
                        data: {
                            ...mockBusiness, 
                            name: updateData.name,
                            profile_image: 'https://example.com/updated.jpg'
                        }, 
                        error: null 
                    }),
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                    insert: vi.fn().mockReturnThis(),
                    delete: vi.fn().mockResolvedValue({ error: null }),
                } as any);

            const result = await businessRepository.updateBusiness(businessId, updateData);

            expect(mockFileStorageRepo.deleteFile).toHaveBeenCalledWith(mockBusiness.profile_image);
            expect(mockFileStorageRepo.uploadFile).toHaveBeenCalledWith(
                mockFile,
                businessId,
                BusinessFileType.ProfileImage
            );
            expect(result.name).toBe('Updated Business');
            expect(result.profile_image).toBe('https://example.com/updated.jpg');
        });
    });

    describe('Error handling', () => {
        it('should handle database errors when creating a business', async () => {
            const mockBusiness = createTestBusiness();
            const businessData = {
                name: mockBusiness.name,
                user_id: mockBusiness.user_id,
                type: mockBusiness.type as any
            };

            // Use type assertion to match Supabase client type
            vi.spyOn(supabaseMock, 'from').mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ 
                    data: null,
                    error: { message: 'Insert error', code: 'DB_ERROR' }
                }),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
                update: vi.fn().mockReturnThis(),
                delete: vi.fn().mockResolvedValue({ error: null }),
            } as any);

            await expect(
                businessRepository.createBusiness(businessData)
            ).rejects.toThrow(DatabaseError);
        });
    });
});