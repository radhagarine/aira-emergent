// src/app/settings/store/SettingsStore.ts
import { create } from 'zustand';
import { 
  UserSettings, 
  WebsiteSettings,
  NotificationSettings,
  DisplaySettings,
  AdvancedSettings,
  settingsService
} from '@/lib/services/settings/settings.service';
import { ServiceError } from '@/lib/types/shared/error.types';

interface SettingsState {
  // Settings data
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveSuccess: boolean;
  
  // Actions
  fetchSettings: (userId: string) => Promise<void>;
  updateWebsiteSettings: (updates: Partial<WebsiteSettings>) => void;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  updateDisplaySettings: (updates: Partial<DisplaySettings>) => void;
  updateAdvancedSettings: (updates: Partial<AdvancedSettings>) => void;
  saveSettings: (userId: string) => Promise<boolean>;
  generateApiKey: (userId: string) => Promise<string | null>;
  resetSaveState: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state
  settings: null,
  loading: false,
  error: null,
  saving: false,
  saveSuccess: false,
  
  // Actions
  fetchSettings: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const settings = await settingsService.getUserSettings(userId);
      
      set({ 
        settings, 
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      
      set({ 
        loading: false, 
        error: error instanceof ServiceError ? error.message : 'Failed to load settings' 
      });
    }
  },
  
  updateWebsiteSettings: (updates: Partial<WebsiteSettings>) => {
    const { settings } = get();
    if (!settings) return;
    
    set({
      settings: {
        ...settings,
        websiteSettings: {
          ...settings.websiteSettings,
          ...updates
        }
      }
    });
  },
  
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => {
    const { settings } = get();
    if (!settings) return;
    
    set({
      settings: {
        ...settings,
        notificationSettings: {
          ...settings.notificationSettings,
          ...updates
        }
      }
    });
  },
  
  updateDisplaySettings: (updates: Partial<DisplaySettings>) => {
    const { settings } = get();
    if (!settings) return;
    
    set({
      settings: {
        ...settings,
        displaySettings: {
          ...settings.displaySettings,
          ...updates
        }
      }
    });
  },
  
  updateAdvancedSettings: (updates: Partial<AdvancedSettings>) => {
    const { settings } = get();
    if (!settings) return;
    
    set({
      settings: {
        ...settings,
        advancedSettings: {
          ...settings.advancedSettings,
          ...updates
        }
      }
    });
  },
  
  saveSettings: async (userId: string) => {
    const { settings } = get();
    if (!settings) return false;
    
    try {
      set({ saving: true, error: null, saveSuccess: false });
      
      await settingsService.updateUserSettings(userId, settings);
      
      set({ 
        saving: false, 
        error: null,
        saveSuccess: true
      });
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      
      set({ 
        saving: false, 
        error: error instanceof ServiceError ? error.message : 'Failed to save settings',
        saveSuccess: false
      });
      
      return false;
    }
  },
  
  generateApiKey: async (userId: string) => {
    try {
      set({ saving: true, error: null });
      
      const apiKey = await settingsService.generateApiKey(userId);
      
      // Update local state
      const { settings } = get();
      if (settings) {
        set({
          settings: {
            ...settings,
            advancedSettings: {
              ...settings.advancedSettings,
              apiKey
            }
          },
          saving: false,
          error: null
        });
      }
      
      return apiKey;
    } catch (error) {
      console.error('Error generating API key:', error);
      
      set({ 
        saving: false, 
        error: error instanceof ServiceError ? error.message : 'Failed to generate API key'
      });
      
      return null;
    }
  },
  
  resetSaveState: () => {
    set({ saveSuccess: false, error: null });
  }
}));