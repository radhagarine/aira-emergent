import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileService } from '@/lib/services/file/file.service';
import { BusinessFileType } from '@/lib/types/database/business.types';
import { ServiceError } from '@/lib/types/shared/error.types';
import { MockFile } from '@/tests/utils/mocks/file.mock';

describe('FileService', () => {
  let fileService: FileService;
  let mockBusinessFilesRepository: any;
  let mockFileStorageRepository: any;
  let mockRepositoryFactory: any;
  
  beforeEach(() => {
    // Create mock repositories with ALL methods used in the tests
    mockBusinessFilesRepository = {
      getFilesByBusinessId: vi.fn(),
      getFilesByType: vi.fn(),
      createFile: vi.fn(),
      deleteFile: vi.fn(),
      getFileById: vi.fn(),
      updateFile: vi.fn(),
      getFileByOriginalName: vi.fn(),
      deleteFileByOriginalName: vi.fn()
    };
    
    mockFileStorageRepository = {
      uploadFile: vi.fn(),
      deleteFile: vi.fn(),
      getPublicUrl: vi.fn(),
      validateFile: vi.fn()
    };
    
    // Create a complete mock repository factory
    mockRepositoryFactory = {
      getClient: vi.fn().mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ 
            data: { 
              user: { id: 'user-123', email: 'test@example.com' } 
            } 
          }),
          getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-123' } } } })
        }
      }),
      getBusinessFilesRepository: vi.fn().mockReturnValue(mockBusinessFilesRepository),
      getFileStorageRepository: vi.fn().mockReturnValue(mockFileStorageRepository),
      getBusinessRepository: vi.fn().mockReturnValue({
        getBusinessById: vi.fn(),
        getBusinessWithDetails: vi.fn(),
        getBusinessesWithDetails: vi.fn(),
        createBusiness: vi.fn(),
        updateBusiness: vi.fn(),
        exists: vi.fn(),
        getBusinessDetails: vi.fn()
      }),
      getRestaurantDetailsRepository: vi.fn().mockReturnValue({
        getByBusinessId: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      }),
      getRetailDetailsRepository: vi.fn().mockReturnValue({
        getByBusinessId: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      }),
      getServiceDetailsRepository: vi.fn().mockReturnValue({
        getByBusinessId: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      }),
      getAppointmentsRepository: vi.fn().mockReturnValue({}),
      reset: vi.fn()
    };
    
    // Create service instance
    fileService = new FileService(mockRepositoryFactory);
    
    // Mock cache manager methods
    (fileService as any).cacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
      clearByPrefix: vi.fn()
    };

    // Spy on uploadFile method to properly track calls
    vi.spyOn(fileService, 'uploadFile');
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });
  
  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      // Create test data
      const businessId = 'business-123';
      const testFile = new MockFile(['test content'], 'test.pdf', { type: 'application/pdf' }) as unknown as File;
      const fileType = BusinessFileType.KnowledgeBase;
      
      // Mock repository responses
      mockFileStorageRepository.uploadFile.mockResolvedValue({
        storagePath: 'path/to/file',
        publicUrl: 'https://example.com/file'
      });
      
      mockBusinessFilesRepository.createFile.mockResolvedValue({
        id: 'file-123',
        original_name: 'test.pdf',
        file_size: 100,
        mime_type: 'application/pdf',
        created_at: '2025-03-14T12:00:00Z',
        metadata: { lastModified: 123456789 }
      });
      
      // Mock getPublicUrl to return a string URL directly
      mockFileStorageRepository.getPublicUrl.mockReturnValue('https://example.com/file');
      
      // Call the service method
      const result = await fileService.uploadFile(businessId, testFile, fileType);
      
      // Verify the result
      expect(result).toEqual({
        id: 'file-123',
        name: 'test.pdf',
        size: 100,
        type: 'application/pdf',
        url: 'https://example.com/file',
        metadata: { lastModified: 123456789 },
        uploadDate: '2025-03-14T12:00:00Z'
      });
      
      // Verify repository calls
      expect(mockFileStorageRepository.validateFile).toHaveBeenCalledWith(testFile);
      expect(mockFileStorageRepository.uploadFile).toHaveBeenCalledWith(
        testFile,
        businessId,
        fileType,
        undefined
      );
      expect(mockBusinessFilesRepository.createFile).toHaveBeenCalledWith({
        business_id: businessId,
        file_type: fileType,
        original_name: 'test.pdf',
        file: testFile,
        metadata: expect.any(Object)
      });
      expect((fileService as any).cacheManager.clearByPrefix).toHaveBeenCalledWith(`files:${businessId}`);
    });
    
    it('should throw error when validation fails', async () => {
      // Create test data
      const businessId = 'business-123';
      const testFile = new MockFile(['test content'], 'test.exe', { type: 'application/x-msdownload' }) as unknown as File;
      const fileType = BusinessFileType.KnowledgeBase;
      
      // Mock validation to throw error
      mockFileStorageRepository.validateFile.mockImplementation(() => {
        throw new Error('File validation failed');
      });
      
      // Call the service method and expect it to throw
      await expect(fileService.uploadFile(businessId, testFile, fileType))
        .rejects.toBeInstanceOf(ServiceError);
      
      // Verify that uploadFile was not called due to validation failure
      expect(mockFileStorageRepository.uploadFile).not.toHaveBeenCalled();
    });
    
    it('should validate required fields', async () => {
      // Create test data with missing businessId
      const businessId = '';
      const testFile = new MockFile(['test content'], 'test.pdf', { type: 'application/pdf' }) as unknown as File;
      const fileType = BusinessFileType.KnowledgeBase;
      
      // Call the service method and expect it to throw
      await expect(fileService.uploadFile(businessId, testFile, fileType))
        .rejects.toBeInstanceOf(ServiceError);
      
      // Verify repository calls
      expect(mockFileStorageRepository.uploadFile).not.toHaveBeenCalled();
      expect(mockBusinessFilesRepository.createFile).not.toHaveBeenCalled();
    });
  });
  
  describe('getBusinessFiles', () => {
    it('should return all files for a business from cache if available', async () => {
      // Create test data
      const businessId = 'business-123';
      const cachedFiles = [
        {
          id: 'file-1',
          name: 'test1.pdf',
          size: 100,
          type: 'application/pdf',
          url: 'https://example.com/path/to/file1',
          uploadDate: '2025-03-14T12:00:00Z',
          metadata: null,
          fileType: BusinessFileType.KnowledgeBase
        }
      ];
      
      // Mock cache response
      (fileService as any).cacheManager.get.mockReturnValue(cachedFiles);
      
      // Call the service method
      const result = await fileService.getBusinessFiles(businessId);
      
      // Verify the result
      expect(result).toEqual(cachedFiles);
      
      // Verify cache was checked
      expect((fileService as any).cacheManager.get).toHaveBeenCalledWith(`files:${businessId}:all`);
      
      // Verify that repository was not called
      expect(mockBusinessFilesRepository.getFilesByBusinessId).not.toHaveBeenCalled();
    });
    
    it('should return all files for a business from repository if not in cache', async () => {
      // Create test data
      const businessId = 'business-123';
      const mockFiles = [
        {
          id: 'file-1',
          original_name: 'test1.pdf',
          file_size: 100,
          mime_type: 'application/pdf',
          storage_path: 'path/to/file1',
          file_type: BusinessFileType.KnowledgeBase,
          created_at: '2025-03-14T12:00:00Z',
          metadata: null
        },
        {
          id: 'file-2',
          original_name: 'test2.csv',
          file_size: 200,
          mime_type: 'text/csv',
          storage_path: 'path/to/file2',
          file_type: BusinessFileType.CSVConfig,
          created_at: '2025-03-14T13:00:00Z',
          metadata: { columns: ['id', 'name'] }
        }
      ];
      
      // Mock cache to return null
      (fileService as any).cacheManager.get.mockReturnValue(null);
      
      // Mock repository responses
      mockBusinessFilesRepository.getFilesByBusinessId.mockResolvedValue(mockFiles);
      
      // Mock getPublicUrl to return a URL string directly
      mockFileStorageRepository.getPublicUrl.mockImplementation(
        (path: string) => `https://example.com/${path}`
      );
      
      // Call the service method
      const result = await fileService.getBusinessFiles(businessId);
      
      // Verify the result format
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('file-1');
      expect(result[0].url).toBe('https://example.com/path/to/file1');  // Now a string
      expect(result[1].id).toBe('file-2');
      expect(result[1].metadata).toEqual({ columns: ['id', 'name'] });
      
      // Verify repository calls
      expect(mockBusinessFilesRepository.getFilesByBusinessId).toHaveBeenCalledWith(businessId);
      expect(mockFileStorageRepository.getPublicUrl).toHaveBeenCalledTimes(2);
      
      // Verify cache was set
      expect((fileService as any).cacheManager.set).toHaveBeenCalledWith(`files:${businessId}:all`, expect.any(Array));
    });
  });
  
  describe('getFilesByType', () => {
    it('should return files of a specific type from cache if available', async () => {
      // Create test data
      const businessId = 'business-123';
      const fileType = BusinessFileType.KnowledgeBase;
      const cachedFiles = [
        {
          id: 'file-1',
          name: 'test1.pdf',
          size: 100,
          type: 'application/pdf',
          url: 'https://example.com/path/to/file1',
          uploadDate: '2025-03-14T12:00:00Z',
          metadata: null,
          fileType: fileType
        }
      ];
      
      // Mock cache response
      (fileService as any).cacheManager.get.mockReturnValue(cachedFiles);
      
      // Call the service method
      const result = await fileService.getFilesByType(businessId, fileType);
      
      // Verify the result
      expect(result).toEqual(cachedFiles);
      
      // Verify cache was checked
      expect((fileService as any).cacheManager.get).toHaveBeenCalledWith(`files:${businessId}:${fileType}`);
      
      // Verify that repository was not called
      expect(mockBusinessFilesRepository.getFilesByType).not.toHaveBeenCalled();
    });
    
    it('should return files of a specific type from repository if not in cache', async () => {
      // Create test data
      const businessId = 'business-123';
      const fileType = BusinessFileType.KnowledgeBase;
      const mockFiles = [
        {
          id: 'file-1',
          original_name: 'test1.pdf',
          file_size: 100,
          mime_type: 'application/pdf',
          storage_path: 'path/to/file1',
          file_type: fileType,
          created_at: '2025-03-14T12:00:00Z',
          metadata: null
        }
      ];
      
      // Mock cache to return null
      (fileService as any).cacheManager.get.mockReturnValue(null);
      
      // Mock repository responses
      mockBusinessFilesRepository.getFilesByType.mockResolvedValue(mockFiles);
      
      // Mock getPublicUrl to return a URL string directly
      mockFileStorageRepository.getPublicUrl.mockImplementation(
        (path: string) => `https://example.com/${path}`
      );
      
      // Call the service method
      const result = await fileService.getFilesByType(businessId, fileType);
      
      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('file-1');
      expect(result[0].url).toBe('https://example.com/path/to/file1');  // Now a string
      
      // Verify repository calls
      expect(mockBusinessFilesRepository.getFilesByType).toHaveBeenCalledWith(businessId, fileType);
      expect(mockFileStorageRepository.getPublicUrl).toHaveBeenCalledTimes(1);
      
      // Verify cache was set
      expect((fileService as any).cacheManager.set).toHaveBeenCalledWith(`files:${businessId}:${fileType}`, expect.any(Array));
    });
  });
  
  describe('deleteFile', () => {
    it('should delete a file by ID successfully', async () => {
      // Create test data
      const fileId = 'file-123';
      
      // Mock file fetch
      mockBusinessFilesRepository.getFileById.mockResolvedValue({
        id: fileId,
        business_id: 'business-123',
        original_name: 'test.pdf',
        storage_path: 'path/to/file',
        file_size: 100,
        mime_type: 'application/pdf', 
        file_type: 'knowledge_base',
        created_at: '2025-03-14T12:00:00Z',
        updated_at: '2025-03-14T12:00:00Z',
        metadata: null
      });
      
      // Mock repository response
      mockBusinessFilesRepository.deleteFile.mockResolvedValue(undefined);
      
      // Call the service method
      await fileService.deleteFile(fileId);
      
      // Verify repository calls
      expect(mockBusinessFilesRepository.deleteFile).toHaveBeenCalledWith(fileId);
      
      // Verify cache was cleared for the business
      expect((fileService as any).cacheManager.clearByPrefix).toHaveBeenCalledWith('files:business-123');
    });
    
    it('should delete a file by name successfully', async () => {
      // Create test data
      const fileName = 'test.pdf';
      const businessId = 'business-123';
      
      // Call the service method
      await fileService.deleteFile(fileName, businessId);
      
      // Verify repository calls
      expect(mockBusinessFilesRepository.deleteFileByOriginalName).toHaveBeenCalledWith(businessId, fileName);
      
      // Verify cache was cleared for the business
      expect((fileService as any).cacheManager.clearByPrefix).toHaveBeenCalledWith(`files:${businessId}`);
    });
    
    it('should throw error when deleting a file by name without businessId', async () => {
      // Create test data
      const fileName = 'test.pdf';
      
      // Call the service method and expect it to throw
      await expect(fileService.deleteFile(fileName))
        .rejects.toBeInstanceOf(ServiceError);
      
      // Verify repository calls were not made
      expect(mockBusinessFilesRepository.deleteFileByOriginalName).not.toHaveBeenCalled();
      expect(mockBusinessFilesRepository.deleteFile).not.toHaveBeenCalled();
    });
  });
  
  describe('uploadKnowledgeBaseFile', () => {
    it('should upload a knowledge base file successfully', async () => {
      // Create test data
      const businessId = 'business-123';
      const testFile = new MockFile(['test content'], 'test.pdf', { type: 'application/pdf' }) as unknown as File;
      
      // Mock auth user
      mockRepositoryFactory.getClient().auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } }
      });
      
      // Mock uploadFile method to return a resolved value
      (fileService.uploadFile as any).mockResolvedValue({
        id: 'file-123',
        name: 'test.pdf',
        size: 100,
        type: 'application/pdf',
        url: 'https://example.com/file',
        metadata: { fileOrigin: 'knowledge-base-upload' },
        uploadDate: '2025-03-14T12:00:00Z'
      });
      
      // Call the service method
      const result = await fileService.uploadKnowledgeBaseFile(businessId, testFile);
      
      // Verify the result
      expect(result).toEqual({
        name: 'test.pdf',
        size: 100,
        type: 'application/pdf',
        uploadDate: '2025-03-14T12:00:00Z'
      });
      
      // Verify auth was checked
      expect(mockRepositoryFactory.getClient().auth.getUser).toHaveBeenCalled();
      
      // Verify uploadFile was called with correct params
      expect(fileService.uploadFile).toHaveBeenCalledWith(
        businessId,
        testFile,
        BusinessFileType.KnowledgeBase,
        expect.objectContaining({
          fileOrigin: 'knowledge-base-upload',
          uploadTimestamp: expect.any(String)
        }),
        undefined
      );
    });
    
    it('should validate knowledge base file type', async () => {
      // Create test data with invalid file type
      const businessId = 'business-123';
      const testFile = new MockFile(['test content'], 'test.exe', { type: 'application/x-msdownload' }) as unknown as File;
      
      // Spy on the private validateKnowledgeBaseFile method
      const validateSpy = vi.spyOn(fileService as any, 'validateKnowledgeBaseFile').mockImplementation(() => {
        throw new ServiceError(
          'Invalid file type for knowledge base',
          'VALIDATION_ERROR',
          'Knowledge base files must be PDF, DOC, DOCX, TXT, CSV, or JSON'
        );
      });
      
      // Call the service method and expect it to throw
      await expect(fileService.uploadKnowledgeBaseFile(businessId, testFile))
        .rejects.toBeInstanceOf(ServiceError);
      
      // Verify uploadFile was not called
      expect(fileService.uploadFile).not.toHaveBeenCalled();
      
      // Restore the original method
      validateSpy.mockRestore();
    });
  });
  
  describe('uploadConfigFile', () => {
    it('should upload a CSV config file successfully', async () => {
      // Create test data
      const businessId = 'business-123';
      const testFile = new MockFile(['test content'], 'test.csv', { type: 'text/csv' }) as unknown as File;
      
      // Mock uploadFile method to return a resolved value
      (fileService.uploadFile as any).mockResolvedValue({
        id: 'file-123',
        name: 'test.csv',
        size: 100,
        type: 'text/csv',
        url: 'https://example.com/file',
        metadata: null,
        uploadDate: '2025-03-14T12:00:00Z'
      });
      
      // Call the service method
      const result = await fileService.uploadConfigFile(businessId, testFile);
      
      // Verify the result matches what uploadFile returns
      expect(result).toEqual({
        id: 'file-123',
        name: 'test.csv',
        size: 100,
        type: 'text/csv',
        url: 'https://example.com/file',
        metadata: null,
        uploadDate: '2025-03-14T12:00:00Z'
      });
      
      // Verify uploadFile was called with correct params
      expect(fileService.uploadFile).toHaveBeenCalledWith(
        businessId,
        testFile,
        BusinessFileType.CSVConfig,
        undefined,
        undefined
      );
    });
    
    it('should reject non-CSV files', async () => {
      // Create test data
      const businessId = 'business-123';
      const testFile = new MockFile(['test content'], 'test.pdf', { type: 'application/pdf' }) as unknown as File;
      
      // Mock uploadFile spy to prevent actual call
      const uploadFileSpy = vi.spyOn(fileService, 'uploadFile');
      
      // Call the service method and expect it to throw
      await expect(fileService.uploadConfigFile(businessId, testFile))
        .rejects.toBeInstanceOf(ServiceError);
      
      // Verify that uploadFile was not called
      expect(uploadFileSpy).not.toHaveBeenCalled();
      
      // Restore the original method
      uploadFileSpy.mockRestore();
    });
  });
  
  describe('getKnowledgeBaseFiles', () => {
    it('should get knowledge base files from cache if available', async () => {
      // Create test data
      const businessId = 'business-123';
      const cachedFiles = [
        {
          name: 'test1.pdf',
          size: 100,
          type: 'application/pdf',
          uploadDate: '2025-03-14T12:00:00Z'
        }
      ];
      
      // Mock cache response
      (fileService as any).cacheManager.get.mockReturnValue(cachedFiles);
      
      // Call the service method
      const result = await fileService.getKnowledgeBaseFiles(businessId);
      
      // Verify the result
      expect(result).toEqual(cachedFiles);
      
      // Verify cache was checked
      expect((fileService as any).cacheManager.get).toHaveBeenCalledWith(`files:${businessId}:knowledge_base`);
      
      // Verify that repository was not called
      expect(mockBusinessFilesRepository.getFilesByType).not.toHaveBeenCalled();
    });
    
    it('should get knowledge base files from repository if not in cache', async () => {
      // Create test data
      const businessId = 'business-123';
      const mockFiles = [
        {
          id: 'file-1',
          original_name: 'test1.pdf',
          file_size: 100,
          mime_type: 'application/pdf',
          storage_path: 'path/to/file1',
          file_type: BusinessFileType.KnowledgeBase,
          created_at: '2025-03-14T12:00:00Z',
          metadata: null
        }
      ];
      
      // Mock cache to return null
      (fileService as any).cacheManager.get.mockReturnValue(null);
      
      // Mock repository responses
      mockBusinessFilesRepository.getFilesByType.mockResolvedValue(mockFiles);
      
      // Call the service method
      const result = await fileService.getKnowledgeBaseFiles(businessId);
      
      // Verify the result
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'test1.pdf',
        size: 100,
        type: 'application/pdf',
        uploadDate: '2025-03-14T12:00:00Z'
      });
      
      // Verify repository calls
      expect(mockBusinessFilesRepository.getFilesByType).toHaveBeenCalledWith(
        businessId, 
        BusinessFileType.KnowledgeBase
      );
      
      // Verify cache was set
      expect((fileService as any).cacheManager.set).toHaveBeenCalledWith(
        `files:${businessId}:knowledge_base`, 
        expect.any(Array)
      );
    });
    
    it('should throw error if businessId is not provided', async () => {
      // Call the service method without businessId
      await expect(fileService.getKnowledgeBaseFiles(''))
        .rejects.toBeInstanceOf(ServiceError);
      
      // Verify repository was not called
      expect(mockBusinessFilesRepository.getFilesByType).not.toHaveBeenCalled();
    });
  });
  
  describe('validateFileByType', () => {
    it('should call the appropriate validation based on file type', async () => {
      // Create test data
      const testFile = new MockFile(['test content'], 'test.pdf', { type: 'application/pdf' }) as unknown as File;
      
      // Mock validation methods
      vi.spyOn(fileService as any, 'validateKnowledgeBaseFile').mockImplementation(() => {});
      vi.spyOn(fileService as any, 'validateCSVFile').mockImplementation(() => {});
      vi.spyOn(fileService as any, 'validateProfileImage').mockImplementation(() => {});
      
      // Call the method for each file type
      (fileService as any).validateFileByType(testFile, BusinessFileType.KnowledgeBase);
      (fileService as any).validateFileByType(testFile, BusinessFileType.CSVConfig);
      (fileService as any).validateFileByType(testFile, BusinessFileType.ProfileImage);
      
      // Verify appropriate validations were called
      expect(mockFileStorageRepository.validateFile).toHaveBeenCalledTimes(3);
      expect((fileService as any).validateKnowledgeBaseFile).toHaveBeenCalledTimes(1);
      expect((fileService as any).validateCSVFile).toHaveBeenCalledTimes(1);
      expect((fileService as any).validateProfileImage).toHaveBeenCalledTimes(1);
    });
  });
});