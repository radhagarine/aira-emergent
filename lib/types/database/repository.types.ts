import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '../../database/repository.factory';

export interface IBaseRepository {
  getClient(): SupabaseClient;
  getFactory(): RepositoryFactory;
}