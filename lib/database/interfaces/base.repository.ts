import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryFactory } from '../repository.factory';

export interface IRepository {
  getClient(): SupabaseClient;
  getFactory(): RepositoryFactory;
}