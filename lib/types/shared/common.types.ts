// lib/types/shared/common.types.ts
export interface Pagination {
    page: number;
    limit: number;
    total?: number;
  }
  
  export interface QueryOptions {
    pagination?: Pagination;
    sort?: {
      field: string;
      direction: 'asc' | 'desc';
    };
    filter?: Record<string, any>;
  }