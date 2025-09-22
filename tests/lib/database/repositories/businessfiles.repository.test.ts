import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SupabaseMock } from '@/tests/utils/mocks/supabase-mock';
import { BusinessFilesRepository } from '@/lib/database/repositories/businessfiles.repository';
import { faker } from '@faker-js/faker';
import { createMockRepositoryFactory } from '@/tests/utils/mocks/repositoryMocks';
import { SupabaseClient } from '@supabase/supabase-js';
import { BusinessFileV2Row, BusinessFileType } from '@/lib/types/database/business.types';
import { DatabaseError } from '@/lib/types/shared/error.types';
import { MockFile } from '@/tests/utils/mocks/file.mock';

describe('BusinessFilesRepository', () => {
    let supabaseMock: SupabaseMock;
    let repository: BusinessFilesRepository;
    let mockFactory: ReturnType<typeof createMockRepositoryFactory>;
    
    // Create wrapper for mocking file storage methods
    const createFileStorageRepoMock = () => {
        const uploadFileMock = vi.fn(
            async (file: File, businessId: string, fileType: BusinessFileType, onProgress?: (progress: number) => void) => {
                if (onProgress) onProgress(50);
                return { 
                    storagePath: 'test/path', 
                    publicUrl: 'http://test.com/file' 
                };
            }
        );

        const deleteFileMock = vi.fn(async (storagePath: string) => {
            return undefined;
        });

        const getPublicUrlMock = vi.fn(() => 'http://test.com/file');
        const validateFileMock = vi.fn();

        return {
            uploadFile: uploadFileMock,
            deleteFile: deleteFileMock,
            getPublicUrl: getPublicUrlMock,
            validateFile: validateFileMock
        };
    };

    // Create reusable test data
    const createTestFile = (override: Partial<BusinessFileV2Row> = {}): BusinessFileV2Row => ({
        id: faker.string.uuid(),
        business_id: faker.string.uuid(),
        file_type: BusinessFileType.KnowledgeBase,
        original_name: 'test.pdf',
        storage_path: 'path/to/file',
        file_size: 1024,
        mime_type: 'application/pdf',
        metadata: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...override
    });

    beforeEach(() => {
        // Create a mock Supabase client
        supabaseMock = new SupabaseMock();
        
        // Mock auth methods
        (supabaseMock as any).auth = {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'test-user' } },
                error: null
            }),
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'mock-token' } },
                error: null
            })
        };
        
        // Create mock repository factory
        mockFactory = createMockRepositoryFactory(supabaseMock as unknown as SupabaseClient);
        
        // Create file storage repo mock
        const fileStorageRepoMock = createFileStorageRepoMock();
        
        mockFactory.getFileStorageRepository = vi.fn().mockReturnValue(fileStorageRepoMock);

        // Create repository instance
        repository = new BusinessFilesRepository(
            supabaseMock as unknown as SupabaseClient,
            mockFactory
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
        supabaseMock.resetMocks();
    });

    describe('getFileById', () => {
        it('should retrieve a single file by ID', async () => {
            const fileId = faker.string.uuid();
            const mockFile = createTestFile({ id: fileId });

            // Setup the complete path that matches exactly what the repository will call
            supabaseMock.mockResponse(
                ['business_files_v2', 'select:*', `eq:id:${fileId}`, 'single'],
                { data: mockFile, error: null }
            );

            const result = await repository.getFileById(fileId);
            expect(result).toEqual(mockFile);
        });

        it('should return null for non-existent file', async () => {
            const fileId = faker.string.uuid();

            supabaseMock.mockResponse(
                ['business_files_v2', 'select:*', `eq:id:${fileId}`, 'single'],
                { data: null, error: { code: 'PGRST116', message: 'No rows returned' } }
            );

            const result = await repository.getFileById(fileId);
            expect(result).toBeNull();
        });
    });

    describe('updateFile', () => {
        it('should update an existing file', async () => {
            const fileId = faker.string.uuid();
            const businessId = faker.string.uuid();
            const existingFile = createTestFile({ 
                id: fileId, 
                business_id: businessId 
            });
            const mockNewFile = new MockFile(['new content'], 'updated.pdf', { 
                type: 'application/pdf' 
            });

            // Mock getting existing file
            supabaseMock.mockResponse(
                ['business_files_v2', 'select:*', `eq:id:${fileId}`, 'single'],
                { data: existingFile, error: null }
            );

            // Mock successful file update
            supabaseMock.mockResponse(
                ['business_files_v2', 'update', `eq:id:${fileId}`, 'select:*', 'single'],
                { 
                    data: createTestFile({ 
                        id: fileId, 
                        business_id: businessId,
                        storage_path: 'new/path',
                        original_name: 'updated.pdf'
                    }), 
                    error: null 
                }
            );

            // Mock upload file
            const fileStorageRepo = mockFactory.getFileStorageRepository();
            (fileStorageRepo.uploadFile as any).mockResolvedValueOnce({
                storagePath: 'new/path',
                publicUrl: 'http://test.com/updated.pdf'
            });

            const result = await repository.updateFile(fileId, {
                file: mockNewFile as unknown as File,
                original_name: 'updated.pdf'
            });

            expect(result).toBeTruthy();
            expect(fileStorageRepo.uploadFile).toHaveBeenCalled();
            expect(fileStorageRepo.deleteFile).toHaveBeenCalledWith(existingFile.storage_path);
        });

        it('should handle update of non-existent file', async () => {
            const fileId = faker.string.uuid();
            const mockNewFile = new MockFile(['new content'], 'updated.pdf', { 
                type: 'application/pdf' 
            });

            // Mock non-existent file
            supabaseMock.mockResponse(
                ['business_files_v2', 'select:*', `eq:id:${fileId}`, 'single'],
                { data: null, error: { code: 'PGRST116' } }
            );

            await expect(repository.updateFile(fileId, {
                file: mockNewFile as unknown as File,
                original_name: 'updated.pdf'
            })).rejects.toThrow(DatabaseError);
        });
    });

    describe('deleteFile', () => {
        it('should delete a file and its storage', async () => {
            const fileId = faker.string.uuid();
            const mockFile = createTestFile({ id: fileId });

            // Mock the actual implementation of the getFileById method
            vi.spyOn(repository, 'getFileById').mockResolvedValueOnce(mockFile);

            // Mock delete operation
            supabaseMock.mockResponse(
                ['business_files_v2', 'delete', `eq:id:${fileId}`],
                { data: null, error: null }
            );

            const fileStorageRepo = mockFactory.getFileStorageRepository();

            await repository.deleteFile(fileId);

            expect(fileStorageRepo.deleteFile)
                .toHaveBeenCalledWith(mockFile.storage_path);
        });

        it('should handle non-existent file deletion', async () => {
            const fileId = faker.string.uuid();

            // Mock getFileById to return null
            vi.spyOn(repository, 'getFileById').mockResolvedValueOnce(null);

            await expect(repository.deleteFile(fileId))
                .rejects.toThrow(DatabaseError);
        });
    });
    
    describe('getFilesByType', () => {
        it('should retrieve files by type', async () => {
            const businessId = faker.string.uuid();
            const fileType = BusinessFileType.KnowledgeBase;
            const mockFile = createTestFile({ 
                business_id: businessId, 
                file_type: fileType 
            });

            // Use exact query path for getFilesByType
            supabaseMock.mockResponse(
                ['business_files_v2', 'select:*', `eq:business_id:${businessId}`, `eq:file_type:${fileType}`, 'order:created_at:desc'],
                { data: [mockFile], error: null }
            );

            const result = await repository.getFilesByType(businessId, fileType);
            expect(result).toEqual([mockFile]);
        });

        it('should handle database errors when retrieving files by type', async () => {
            const businessId = faker.string.uuid();
            const fileType = BusinessFileType.KnowledgeBase;

            supabaseMock.mockResponse(
                ['business_files_v2', 'select:*', `eq:business_id:${businessId}`, `eq:file_type:${fileType}`, 'order:created_at:desc'],
                { 
                    data: null, 
                    error: { 
                        message: 'Database error', 
                        code: 'ERROR',
                        details: 'Test error' 
                    } 
                }
            );

            await expect(repository.getFilesByType(businessId, fileType))
                .rejects.toThrow(DatabaseError);
        });
    });

    describe('getFileByOriginalName', () => {
        it('should retrieve a file by its original name', async () => {
            const businessId = faker.string.uuid();
            const originalName = 'test.pdf';
            const mockFile = createTestFile({ 
                business_id: businessId, 
                original_name: originalName 
            });

            // Instead of trying to mock a complex chain, create a direct mock
            // for this specific test
            const mockSingle = vi.fn().mockResolvedValue({
                data: mockFile, 
                error: null
            });
            
            const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
            const mockEq2 = vi.fn().mockReturnValue({ limit: mockLimit });
            const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
            const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
            
            // Replace the from method for this test only
            const originalFrom = supabaseMock.from;
            supabaseMock.from = mockFrom;
            
            const result = await repository.getFileByOriginalName(businessId, originalName);
            
            // Restore original from method
            supabaseMock.from = originalFrom;
            
            expect(result).toEqual(mockFile);
        });

        it('should return null for non-existent file by original name', async () => {
            const businessId = faker.string.uuid();
            const originalName = 'nonexistent.pdf';

            // Setup mock for not found case
            const mockSingle = vi.fn().mockResolvedValue({
                data: null, 
                error: { code: 'PGRST116' }
            });
            
            const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
            const mockEq2 = vi.fn().mockReturnValue({ limit: mockLimit });
            const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
            const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
            
            // Replace the from method for this test only
            const originalFrom = supabaseMock.from;
            supabaseMock.from = mockFrom;
            
            const result = await repository.getFileByOriginalName(businessId, originalName);
            
            // Restore original from method
            supabaseMock.from = originalFrom;
            
            expect(result).toBeNull();
        });
    });

    describe('deleteFileByOriginalName', () => {
        it('should delete a file by its original name', async () => {
            const businessId = faker.string.uuid();
            const originalName = 'test.pdf';
            const mockFile = createTestFile({ 
                business_id: businessId, 
                original_name: originalName 
            });

            // Mock getFileByOriginalName directly
            vi.spyOn(repository, 'getFileByOriginalName').mockResolvedValueOnce(mockFile);
            
            // Mock deleteFile as well to avoid chaining issues
            vi.spyOn(repository, 'deleteFile').mockResolvedValueOnce();

            await repository.deleteFileByOriginalName(businessId, originalName);

            // Verify correct methods were called
            expect(repository.getFileByOriginalName).toHaveBeenCalledWith(businessId, originalName);
            expect(repository.deleteFile).toHaveBeenCalledWith(mockFile.id);
        });

        it('should handle deletion of non-existent file by original name', async () => {
            const businessId = faker.string.uuid();
            const originalName = 'nonexistent.pdf';

            // Mock getFileByOriginalName to return null
            vi.spyOn(repository, 'getFileByOriginalName').mockResolvedValueOnce(null);

            await expect(repository.deleteFileByOriginalName(businessId, originalName))
                .rejects.toThrow(DatabaseError);
        });
    });
});