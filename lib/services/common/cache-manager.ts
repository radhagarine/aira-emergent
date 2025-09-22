interface CacheItem<T> {
  value: T;
  expiry: number;
  createdAt: number;
  originalTTL: number;
}

export class CacheManager {
  // Internal cache storage
  private cache: Map<string, CacheItem<any>> = new Map();
  
  // Default TTL in milliseconds (5 minutes)
  private defaultTTL: number = 5 * 60 * 1000;
  
  // Enable debug logging
  private debug: boolean = false;

  /**
   * Internal debug log method
   */
  private debugLog(message: string): void {
    if (this.debug) {
      console.log(`[CacheManager] ${message}`);
    }
  }
  
  /**
   * Set a value in the cache with optional TTL
   */
  public set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const actualTtl = ttl ?? this.defaultTTL;
    const expiryTime = now + actualTtl;
    
    this.debugLog(`SET: ${key}
      - Value: ${JSON.stringify(value)}
      - Current Time: ${new Date(now).toISOString()}
      - Expiry Time: ${new Date(expiryTime).toISOString()}
      - TTL: ${actualTtl}ms`);
    
    this.cache.set(key, {
      value,
      expiry: expiryTime,
      createdAt: now,
      originalTTL: actualTtl
    });
  }
  
  /**
   * Get a value from the cache
   */
  public get<T>(key: string): T | null {
    const now = Date.now();
    const item = this.cache.get(key);
    
    if (!item) {
      this.debugLog(`GET: ${key} - NOT FOUND`);
      return null;
    }
    
    const isExpired = now > item.expiry;
    
    this.debugLog(`GET: ${key}
      - Value: ${JSON.stringify(item.value)}
      - Current Time: ${new Date(now).toISOString()}
      - Expiry Time: ${new Date(item.expiry).toISOString()}
      - Created At: ${new Date(item.createdAt).toISOString()}
      - Status: ${isExpired ? 'EXPIRED' : 'VALID'}
      - Remaining: ${((item.expiry - now) / 1000).toFixed(2)}s`);
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }
  
  /**
   * Refresh a cache item with a new value and reset its TTL
   */
  public refresh<T>(key: string, newValue: T): boolean {
    const now = Date.now();
    const item = this.cache.get(key);
    
    if (!item) {
      this.debugLog(`REFRESH: ${key} - NOT FOUND`);
      return false;
    }
    
    const newExpiry = now + item.originalTTL;
    
    this.debugLog(`REFRESH: ${key}
      - Old Value: ${JSON.stringify(item.value)}
      - New Value: ${JSON.stringify(newValue)}
      - Old Expiry: ${new Date(item.expiry).toISOString()}
      - Current Time: ${new Date(now).toISOString()}
      - New Expiry: ${new Date(newExpiry).toISOString()}
      - Original Create Time: ${new Date(item.createdAt).toISOString()}
      - Original TTL: ${item.originalTTL}ms`);
    
    const isExpired = now > item.expiry;
    
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    // Update the item with new value and original TTL
    this.cache.set(key, {
      value: newValue,
      expiry: newExpiry,
      createdAt: item.createdAt,
      originalTTL: item.originalTTL
    });
    
    return true;
  }
  
  /**
   * Get a value from the cache along with its metadata
   */
  public getWithMetadata<T>(key: string): { value: T; expiry: number } | null {
    const now = Date.now();
    const item = this.cache.get(key);
    
    if (!item) {
      this.debugLog(`GET_WITH_METADATA: ${key} - NOT FOUND`);
      return null;
    }
    
    const isExpired = now > item.expiry;
    
    this.debugLog(`GET_WITH_METADATA: ${key}
      - Current Time: ${new Date(now).toISOString()}
      - Expiry Time: ${new Date(item.expiry).toISOString()}
      - Status: ${isExpired ? 'EXPIRED' : 'VALID'}
      - Remaining: ${((item.expiry - now) / 1000).toFixed(2)}s`);
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return {
      value: item.value as T,
      expiry: item.expiry
    };
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   */
  public has(key: string): boolean {
    const now = Date.now();
    const item = this.cache.get(key);
    
    if (!item) {
      this.debugLog(`HAS: ${key} - NOT FOUND`);
      return false;
    }
    
    const isExpired = now > item.expiry;
    
    this.debugLog(`HAS: ${key}
      - Current Time: ${new Date(now).toISOString()}
      - Expiry Time: ${new Date(item.expiry).toISOString()}
      - Status: ${isExpired ? 'EXPIRED' : 'VALID'}
      - Remaining: ${((item.expiry - now) / 1000).toFixed(2)}s`);
    
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear a specific key from the cache
   */
  public clear(key: string): void {
    this.debugLog(`CLEAR: ${key}`);
    this.cache.delete(key);
  }
  
  /**
   * Clear all keys that start with a specific prefix
   */
  public clearByPrefix(prefix: string): void {
    this.debugLog(`CLEAR_BY_PREFIX: ${prefix}`);
    
    Array.from(this.cache.keys()).forEach(key => {
      if (key.startsWith(prefix)) {
        this.debugLog(`CLEAR_BY_PREFIX: deleted ${key}`);
        this.cache.delete(key);
      }
    });
  }
  
  /**
   * Clear all entries from the cache
   */
  public clearAll(): void {
    this.debugLog(`CLEAR_ALL: Removing all ${this.cache.size} entries`);
    this.cache.clear();
  }
  
  /**
   * Set the default TTL for the cache
   */
  public setDefaultTTL(ttl: number): void {
    this.debugLog(`SET_DEFAULT_TTL: ${ttl}ms`);
    this.defaultTTL = ttl;
  }
  
  /**
   * Get the default TTL for the cache
   */
  public getDefaultTTL(): number {
    return this.defaultTTL;
  }
  
  /**
   * Get the number of items in the cache
   */
  public size(): number {
    return this.cache.size;
  }
  
  /**
   * Get the raw cache contents for debugging
   */
  public _getDebugCacheContents(): Record<string, { value: any, expiry: number, expiresIn: string, isExpired: boolean }> {
    const now = Date.now();
    const result: Record<string, any> = {};
    
    this.cache.forEach((item, key) => {
      result[key] = {
        value: item.value,
        expiry: item.expiry,
        expiresIn: `${((item.expiry - now) / 1000).toFixed(2)}s`,
        isExpired: now > item.expiry
      };
    });
    
    return result;
  }
  
  /**
   * Toggle debug logging
   */
  public setDebug(enabled: boolean): void {
    this.debug = enabled;
  }
}