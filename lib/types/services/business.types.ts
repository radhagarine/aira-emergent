import { 
    BusinessType,
    BusinessV2Row,
    RestaurantDetailsV2Row,
    RetailDetailsV2Row,
    ServiceDetailsV2Row 
  } from '../database/business.types';
  
  // Service-level types that compose database types into business objects
  export interface BusinessDetails {
    business: BusinessV2Row;
    details: RestaurantDetailsV2Row | RetailDetailsV2Row | ServiceDetailsV2Row;
  }
  
  export interface CreateBusinessDto {
    name: string;
    type: BusinessType;
    email?: string;
    phone?: string;
    address?: string;
  }
  
  export interface UpdateBusinessDto {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }