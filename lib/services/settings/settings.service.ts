// src/lib/services/settings/settings.service.ts
import { 
    getRepositoryFactory, 
    RepositoryFactory 
  } from '@/lib/database/repository.factory';
  import { 
    DatabaseError, 
    ServiceError 
  } from '@/lib/types/shared/error.types';
  import { CacheManager } from '@/lib/services/common/cache-manager';
  
  // Define types for settings
  export interface WebsiteSettings {
    businessName?: string;
    businessDescription?: string;
    logo?: string;
    websiteUrl?: string;
    primaryPhone?: string;
    businessEmail?: string;
    businessAddress?: string;
    businessHours?: string;
    theme?: 'default' | 'dark' | 'light';
    enableDarkMode?: boolean;
    showLogo?: boolean;
    enableSSL?: boolean;
    enableAnalytics?: boolean;
    analyticsId?: string;
    enableCookieConsent?: boolean;
    maintenanceMode?: boolean;
  }
  
  export interface NotificationSettings {
    enableChatNotifications: boolean;
    enableEmailNotifications: boolean;
    notificationFrequency: 'realtime' | 'hourly' | 'daily';
  }
  
  export interface DisplaySettings {
    dateFormat: 'mdy' | 'dmy' | 'ymd';
    timeZone: 'utc' | 'est' | 'pst' | string;
    use24HourTime: boolean;
  }
  
  export interface AdvancedSettings {
    enableAdvancedFeatures: boolean;
    enableApiAccess: boolean;
    apiKey: string | null;
  }
  
  export interface UserSettings {
    userId: string;
    websiteSettings: WebsiteSettings;
    notificationSettings: NotificationSettings;
    displaySettings: DisplaySettings;
    advancedSettings: AdvancedSettings;
  }
  
  export class SettingsService {
    private repositoryFactory: RepositoryFactory;
    private cacheManager: CacheManager;
    
    constructor(repoFactoryOverride?: RepositoryFactory) {
      this.repositoryFactory = repoFactoryOverride || getRepositoryFactory();
      this.cacheManager = new CacheManager();
    }
  
    /**
     * Get user settings
     * @param userId User ID
     */
    async getUserSettings(userId: string): Promise<UserSettings> {
      try {
        // Check cache first
        const cacheKey = `settings:${userId}`;
        const cachedSettings = this.cacheManager.get<UserSettings>(cacheKey);
        if (cachedSettings) {
          return cachedSettings;
        }
  
        // In a real implementation, this would fetch from the database
        // For now, we'll use default settings
        const settings = await this.getDefaultSettings(userId);
        
        // Store in cache
        this.cacheManager.set(cacheKey, settings);
        
        return settings;
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw ServiceError.fromRepositoryError(error);
        }
        throw ServiceError.create(
          'Failed to retrieve user settings',
          'FETCH_SETTINGS_ERROR',
          error
        );
      }
    }
  
    /**
     * Update user settings
     * @param userId User ID
     * @param settings Settings to update
     */
    async updateUserSettings(
      userId: string, 
      settings: Partial<UserSettings>
    ): Promise<UserSettings> {
      try {
        // Get current settings
        const currentSettings = await this.getUserSettings(userId);
        
        // Merge with updates
        const updatedSettings: UserSettings = {
          ...currentSettings,
          ...settings,
          websiteSettings: {
            ...currentSettings.websiteSettings,
            ...(settings.websiteSettings || {})
          },
          notificationSettings: {
            ...currentSettings.notificationSettings,
            ...(settings.notificationSettings || {})
          },
          displaySettings: {
            ...currentSettings.displaySettings,
            ...(settings.displaySettings || {})
          },
          advancedSettings: {
            ...currentSettings.advancedSettings,
            ...(settings.advancedSettings || {})
          }
        };
        
        // In a real implementation, this would save to the database
        // For now, we'll just update the cache
        const cacheKey = `settings:${userId}`;
        this.cacheManager.set(cacheKey, updatedSettings);
        
        // Return the updated settings
        return updatedSettings;
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw ServiceError.fromRepositoryError(error);
        }
        throw ServiceError.create(
          'Failed to update user settings',
          'UPDATE_SETTINGS_ERROR',
          error
        );
      }
    }
  
    /**
     * Generate a new API key for a user
     * @param userId User ID
     */
    async generateApiKey(userId: string): Promise<string> {
      try {
        // Generate a random API key
        const apiKey = 'api_' + Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
        
        // Update user settings with the new API key
        await this.updateUserSettings(userId, {
          advancedSettings: {
            apiKey
          } as AdvancedSettings
        });
        
        return apiKey;
      } catch (error) {
        throw ServiceError.create(
          'Failed to generate API key',
          'API_KEY_GENERATION_ERROR',
          error
        );
      }
    }
  
    /**
     * Get default settings for a new user
     * @param userId User ID
     */
    private async getDefaultSettings(userId: string): Promise<UserSettings> {
      return {
        userId,
        websiteSettings: {
          businessName: 'AiRA Business',
          theme: 'default',
          enableDarkMode: false
        },
        notificationSettings: {
          enableChatNotifications: true,
          enableEmailNotifications: true,
          notificationFrequency: 'realtime'
        },
        displaySettings: {
          dateFormat: 'mdy',
          timeZone: 'utc',
          use24HourTime: false
        },
        advancedSettings: {
          enableAdvancedFeatures: false,
          enableApiAccess: false,
          apiKey: null
        }
      };
    }
  }
  
  // Export a singleton instance
  export const settingsService = new SettingsService();