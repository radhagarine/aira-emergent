import { IRepository } from './base.repository';
import {
  RestaurantDetailsV2Row,
  RestaurantDetailsV2Insert,
  RestaurantDetailsV2Update
} from '@/lib/types/database/business.types';

export interface IRestaurantDetailsRepository extends IRepository {
  getByBusinessId(businessId: string): Promise<RestaurantDetailsV2Row | null>;
  create(data: RestaurantDetailsV2Insert): Promise<RestaurantDetailsV2Row>;
  update(id: string, data: RestaurantDetailsV2Update): Promise<RestaurantDetailsV2Row>;
  delete(id: string): Promise<void>;
}