import { SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';
import { RepositoryFactory } from '@/lib/database/repository.factory'; // Adjust the path as necessary

export const createMockRepositoryFactory = (supabaseMock: SupabaseClient) => ({
  getBusinessRepository: () => vi.fn(), // Return a mock implementation
  getFilesRepository: () => vi.fn(), // Return a mock implementation
  getClient: () => supabaseMock, // Return the supabase client
  reset: vi.fn(), // Mock reset method
  // Add other necessary methods as needed
} as unknown as RepositoryFactory); // Cast to RepositoryFactory 