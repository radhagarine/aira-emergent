import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheManager } from '@/lib/services/common/cache-manager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  
  beforeEach(() => {
    // Use fake timers for testing cache expiration
    vi.useFakeTimers();
    
    // Create a new instance for each test
    cacheManager = new CacheManager();
    
    // Enable debug mode for better visibility during tests
    cacheManager.setDebug(true);
  });
  
  afterEach(() => {
    // Restore real timers
    vi.useRealTimers();
    
    // Clear the cache to prevent test pollution
    cacheManager.clearAll();
  });
  
  describe('Basic Functionality', () => {
    it('should store and retrieve values', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      // Store a value
      cacheManager.set(key, value);
      
      // Retrieve the value
      const retrieved = cacheManager.get(key);
      
      // Expect the retrieved value to match the stored value
      expect(retrieved).toEqual(value);
    });
    
    it('should return null for non-existent keys', () => {
      const result = cacheManager.get('non-existent-key');
      expect(result).toBeNull();
    });
    
    it('should report the correct cache size', () => {
      // Initially empty
      expect(cacheManager.size()).toBe(0);
      
      // Add some items
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      
      // Check size is 2
      expect(cacheManager.size()).toBe(2);
      
      // Remove one item
      cacheManager.clear('key1');
      
      // Check size is 1
      expect(cacheManager.size()).toBe(1);
      
      // Add another item
      cacheManager.set('key3', 'value3');
      
      // Check size is 2 again
      expect(cacheManager.size()).toBe(2);
      
      // Clear all
      cacheManager.clearAll();
      
      // Check size is 0
      expect(cacheManager.size()).toBe(0);
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire items after the default TTL', () => {
      const key = 'default-ttl-key';
      const value = { data: 'default-ttl-value' };
      
      // Store with default TTL
      cacheManager.set(key, value);
      
      // Value should be available immediately
      expect(cacheManager.get(key)).toEqual(value);
      
      // Default TTL is 5 minutes (300000ms)
      // Advance time by just under the default TTL
      vi.advanceTimersByTime(299000);
      
      // Value should still be available
      expect(cacheManager.get(key)).toEqual(value);
      
      // Advance time to just past the default TTL
      vi.advanceTimersByTime(2000);
      
      // Value should be expired now
      expect(cacheManager.get(key)).toBeNull();
    });
    
    it('should expire items after custom TTL', () => {
      const key = 'custom-ttl-key';
      const value = { data: 'custom-ttl-value' };
      const ttl = 5000; // 5 seconds
      
      // Store with custom TTL
      cacheManager.set(key, value, ttl);
      
      // Value should be available immediately
      expect(cacheManager.get(key)).toEqual(value);
      
      // Advance time by 4.9 seconds
      vi.advanceTimersByTime(4900);
      
      // Value should still be available
      expect(cacheManager.get(key)).toEqual(value);
      
      // Advance time by 0.2 seconds more (total 5.1 seconds)
      vi.advanceTimersByTime(200);
      
      // Value should be expired now
      expect(cacheManager.get(key)).toBeNull();
    });
    
    it('should allow changing default TTL', () => {
      const originalTTL = cacheManager.getDefaultTTL();
      const newTTL = 1000; // 1 second
      
      // Change default TTL
      cacheManager.setDefaultTTL(newTTL);
      
      // Verify TTL changed
      expect(cacheManager.getDefaultTTL()).toBe(newTTL);
      
      // Set a value without specifying TTL
      const key = 'new-default-ttl-key';
      cacheManager.set(key, 'test-value');
      
      // Advance time past new default TTL
      vi.advanceTimersByTime(1100);
      
      // Value should be expired
      expect(cacheManager.get(key)).toBeNull();
      
      // Restore original TTL
      cacheManager.setDefaultTTL(originalTTL);
    });
  });

  describe('Advanced Refresh Behavior', () => {
    it('should correctly refresh a cache item and reset its TTL', () => {
      const key = 'refresh-key';
      const initialValue = { data: 'initial-value' };
      const newValue = { data: 'new-value' };
      const ORIGINAL_TTL = 10000; // 10 seconds
      
      // Set initial value with specific TTL
      cacheManager.set(key, initialValue, ORIGINAL_TTL);
      
      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);
      
      // Refresh with new value (no TTL specified, should use original)
      const refreshResult = cacheManager.refresh(key, newValue);
      
      // Verify refresh was successful
      expect(refreshResult).toBe(true);
      
      // Verify value is updated
      const valueAfterRefresh = cacheManager.get(key);
      expect(valueAfterRefresh).toEqual(newValue);
      
      // Advance time by 9 seconds (4 seconds after refresh)
      vi.advanceTimersByTime(9000);
      
      // Value should still be available (within refreshed TTL)
      const valueAfter9s = cacheManager.get(key);
      expect(valueAfter9s).toEqual(newValue);
      
      // Advance time by 2 seconds (total 11 seconds from refresh)
      vi.advanceTimersByTime(2000);
      
      // Value should now be expired
      const valueAfter11s = cacheManager.get(key);
      expect(valueAfter11s).toBeNull();
    });

    it('should reject refresh for expired items', () => {
      const key = 'expired-refresh-key';
      const initialValue = { data: 'initial-value' };
      const newValue = { data: 'new-value' };
      const TTL = 5000; // 5 seconds
      
      // Set initial value with TTL
      cacheManager.set(key, initialValue, TTL);
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(6000);
      
      // Attempt to refresh expired item
      const refreshResult = cacheManager.refresh(key, newValue);
      
      // Verify refresh failed
      expect(refreshResult).toBe(false);
      
      // Verify item is still expired
      expect(cacheManager.get(key)).toBeNull();
    });

    it('should support multiple refreshes within original TTL', () => {
      const key = 'multi-refresh-key';
      const ORIGINAL_TTL = 10000; // 10 seconds
      const values = [
        { data: 'value1' },
        { data: 'value2' },
        { data: 'value3' }
      ];
      
      // Set initial value with 10-second TTL
      cacheManager.set(key, values[0], ORIGINAL_TTL);
      
      // Advance time by 3 seconds
      vi.advanceTimersByTime(3000);
      
      // First refresh
      const firstRefresh = cacheManager.refresh(key, values[1]);
      expect(firstRefresh).toBe(true);
      
      // Advance time by 4 seconds (total 7 seconds)
      vi.advanceTimersByTime(4000);
      
      // Second refresh
      const secondRefresh = cacheManager.refresh(key, values[2]);
      expect(secondRefresh).toBe(true);
      
      // Verify current value
      const currentValue = cacheManager.get(key);
      expect(currentValue).toEqual(values[2]);
      
      // Advance time by 9 seconds (total 16 seconds from first set, 9 seconds from last refresh)
      vi.advanceTimersByTime(9000);
      
      // Value should still be available
      const valueAfter9s = cacheManager.get(key);
      expect(valueAfter9s).toEqual(values[2]);
      
      // Advance time by 2 seconds (total 11 seconds from last refresh)
      vi.advanceTimersByTime(2000);
      
      // Value should be expired
      const expiredValue = cacheManager.get(key);
      expect(expiredValue).toBeNull();
    });
    
    it('should return false when refreshing non-existent keys', () => {
      // Attempt to refresh a non-existent key
      const refreshResult = cacheManager.refresh('non-existent-key', 'new-value');
      
      // Verify refresh failed
      expect(refreshResult).toBe(false);
    });
  });

  describe('Metadata and Existence Checks', () => {
    it('should support retrieving cached items with their expiry', () => {
      const key = 'metadata-key';
      const value = { data: 'test-value' };
      const ttl = 10000; // 10 seconds
      
      // Store a value with TTL
      cacheManager.set(key, value, ttl);
      
      // Get the value with metadata
      const result = cacheManager.getWithMetadata(key);
      
      // Check the value and that expiry time is roughly 10 seconds in the future
      expect(result).not.toBeNull();
      expect(result?.value).toEqual(value);
      
      const expectedExpiry = Date.now() + ttl;
      // Allow 100ms margin for test execution time
      expect(result?.expiry).toBeGreaterThan(expectedExpiry - 100);
      expect(result?.expiry).toBeLessThanOrEqual(expectedExpiry);
      
      // Advance time to just before expiry
      vi.advanceTimersByTime(9900);
      
      // Item should still exist
      const almostExpired = cacheManager.getWithMetadata(key);
      expect(almostExpired).not.toBeNull();
      
      // Advance time past expiry
      vi.advanceTimersByTime(200);
      
      // Item should be gone
      const expired = cacheManager.getWithMetadata(key);
      expect(expired).toBeNull();
    });

    it('should return null metadata for non-existent keys', () => {
      const result = cacheManager.getWithMetadata('non-existent-key');
      expect(result).toBeNull();
    });

    it('should support has() method to check for key existence', () => {
      const key = 'existence-key';
      
      // Initially key doesn't exist
      expect(cacheManager.has(key)).toBe(false);
      
      // Set a value
      cacheManager.set(key, 'test-value');
      
      // Now key should exist
      expect(cacheManager.has(key)).toBe(true);
      
      // Set with TTL and advance time to test expiration
      cacheManager.set(key, 'expiring-value', 5000);
      
      // Advance time past expiry
      vi.advanceTimersByTime(6000);
      
      // Key should no longer exist
      expect(cacheManager.has(key)).toBe(false);
    });
  });

  describe('Cache Management Methods', () => {
    it('should clear a specific key', () => {
      const key1 = 'key1';
      const key2 = 'key2';
      const value1 = { data: 'value1' };
      const value2 = { data: 'value2' };
      
      // Store two values
      cacheManager.set(key1, value1);
      cacheManager.set(key2, value2);
      
      // Clear one key
      cacheManager.clear(key1);
      
      // Expect key1 to be cleared, but key2 to remain
      expect(cacheManager.get(key1)).toBeNull();
      expect(cacheManager.get(key2)).toEqual(value2);
    });

    it('should clear all keys matching a prefix', () => {
      // Store values with different prefixes
      cacheManager.set('user:123:profile', { name: 'Alice' });
      cacheManager.set('user:123:settings', { theme: 'dark' });
      cacheManager.set('user:456:profile', { name: 'Bob' });
      cacheManager.set('product:123', { name: 'Widget' });
      
      // Clear all keys with the 'user:123:' prefix
      cacheManager.clearByPrefix('user:123:');
      
      // Check which values remain
      expect(cacheManager.get('user:123:profile')).toBeNull();
      expect(cacheManager.get('user:123:settings')).toBeNull();
      expect(cacheManager.get('user:456:profile')).toEqual({ name: 'Bob' });
      expect(cacheManager.get('product:123')).toEqual({ name: 'Widget' });
    });

    it('should clear all cache entries', () => {
      // Store multiple values
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.set('key3', 'value3');
      
      // Clear all cache entries
      cacheManager.clearAll();
      
      // Expect all keys to be cleared
      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBeNull();
      expect(cacheManager.get('key3')).toBeNull();
      expect(cacheManager.size()).toBe(0);
    });
  });

  describe('Debug and Utility Methods', () => {
    it('should support debug cache contents retrieval', () => {
      const key = 'debug-key';
      const value = { data: 'debug-value' };
      
      // Set a value
      cacheManager.set(key, value, 10000);
      
      // Get debug contents
      const debugContents = cacheManager._getDebugCacheContents();
      
      // Verify debug contents
      expect(debugContents[key]).toBeTruthy();
      expect(debugContents[key].value).toEqual(value);
      expect(debugContents[key].expiresIn).toMatch(/^\d+\.\d{2}s$/);
      expect(debugContents[key].isExpired).toBe(false);
    });

    it('should reflect expired items in debug contents', () => {
      const key = 'expired-debug-key';
      
      // Set a value with short TTL
      cacheManager.set(key, 'value', 1000);
      
      // Advance time past expiry
      vi.advanceTimersByTime(1100);
      
      // Get debug contents
      const debugContents = cacheManager._getDebugCacheContents();
      
      // The key should still be in the cache until get() is called
      expect(debugContents[key]).toBeTruthy();
      expect(debugContents[key].isExpired).toBe(true);
      expect(parseFloat(debugContents[key].expiresIn)).toBeLessThan(0);
      
      // But get() should return null and remove it
      expect(cacheManager.get(key)).toBeNull();
      
      // Now it should be removed from debug contents
      const updatedDebugContents = cacheManager._getDebugCacheContents();
      expect(updatedDebugContents[key]).toBeUndefined();
    });
    
    it('should toggle debug mode', () => {
      // Enable debug mode (already done in beforeEach)
      cacheManager.setDebug(true);
      
      // Spy on console.log
      const consoleSpy = vi.spyOn(console, 'log');
      
      // Set a value - should trigger debug log
      cacheManager.set('debug-test-key', 'value');
      
      // Expect console.log to have been called
      expect(consoleSpy).toHaveBeenCalled();
      
      // Clear spy calls
      consoleSpy.mockClear();
      
      // Disable debug mode
      cacheManager.setDebug(false);
      
      // Set another value - should not trigger debug log
      cacheManager.set('another-key', 'value');
      
      // Expect console.log not to have been called
      expect(consoleSpy).not.toHaveBeenCalled();
      
      // Restore console.log
      consoleSpy.mockRestore();
    });
  });
});