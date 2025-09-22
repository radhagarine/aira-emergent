export class BaseError extends Error {
    constructor(
      message: string,
      public readonly code: string,
      public readonly details?: string
    ) {
      super(message);
      this.name = this.constructor.name;
      
      // Maintains proper stack trace for where error was thrown
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  export class DatabaseError extends BaseError {
    constructor(
      message: string,
      code: string,
      details?: string
    ) {
      super(message, code, details);
      this.name = 'DatabaseError';
    }
  
    static fromSupabaseError(error: { message: string; code: string }): DatabaseError {
      return new DatabaseError(
        error.message,
        error.code
      );
    }
  }
  
  // Common error codes
  export const ErrorCodes = {
    NOT_FOUND: 'NOT_FOUND',
    INSERT_ERROR: 'INSERT_ERROR',
    UPDATE_ERROR: 'UPDATE_ERROR',
    DELETE_ERROR: 'DELETE_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  } as const;
  
  export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

  export class ServiceError extends Error {
    constructor(
        public message: string,
        public code: string,
        public originalError?: unknown
    ) {
        super(message);
        this.name = 'ServiceError';
    }
  
    static fromRepositoryError(error: DatabaseError): ServiceError {
        return new ServiceError(
            `Service operation failed: ${error.message}`,
            error.code,
            error
        );
    }
  
    static create(
        message: string, 
        code: string, 
        originalError?: unknown
    ): ServiceError {
        return new ServiceError(message, code, originalError);
    }
  }
  /*

  export class ServiceError extends BaseError {
    constructor(message: string, code: string, originalError?: Error) {
      super(message, code, originalError);
      this.name = 'ServiceError';
    }
  }
  
  export class ValidationError extends BaseError {
    constructor(message: string, code: string, originalError?: Error) {
        super(message, code, originalError);
      this.name = 'ValidationError';
    }
  }
  
  export class NotFoundError extends BaseError {
    constructor(message: string, code: string, originalError?: Error) {
        super(message, code, originalError);
      this.name = 'NotFoundError';
    }
  }
  
  export class ConflictError extends BaseError {
    constructor(message: string, code: string, originalError?: Error) {
        super(message, code, originalError);
      this.name = 'ConflictError';
    }
  }
    */