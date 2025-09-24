// src/app/settings/components/WebsiteSettingsForm.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WebsiteSettings, NotificationSettings, DisplaySettings } from '@/lib/services/settings/settings.service';
import { useSettingsStore } from '../store/SettingsStore';
import { Upload, Globe, Phone, Mail, MapPin, Clock, Shield, Palette, Bell, Monitor } from 'lucide-react';

interface WebsiteSettingsFormProps {
  settings: WebsiteSettings;
  notificationSettings: NotificationSettings;
  displaySettings: DisplaySettings;
  isLoading?: boolean;
}

const WebsiteSettingsForm: React.FC<WebsiteSettingsFormProps> = ({
  settings,
  notificationSettings,
  displaySettings,
  isLoading = false
}) => {
  const { updateWebsiteSettings, updateNotificationSettings, updateDisplaySettings } = useSettingsStore();
  const [logoFile, setLogoFile] = React.useState<File | null>(null);

  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateWebsiteSettings({ businessName: e.target.value });
  };

  const handleThemeChange = (value: 'default' | 'dark' | 'light') => {
    updateWebsiteSettings({ theme: value });
  };

  const handleDarkModeChange = (checked: boolean) => {
    updateWebsiteSettings({ enableDarkMode: checked });

    // Apply dark mode to the document immediately
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Here you would typically upload the file and update settings
      // For now, we'll just store the file name
      updateWebsiteSettings({ logo: file.name });
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateWebsiteSettings({ [field]: e.target.value });
  };

  const handleSwitchChange = (field: string) => (checked: boolean) => {
    updateWebsiteSettings({ [field]: checked });
  };

  // Notification handlers
  const handleChatNotificationsChange = (checked: boolean) => {
    updateNotificationSettings({ enableChatNotifications: checked });
  };

  const handleEmailNotificationsChange = (checked: boolean) => {
    updateNotificationSettings({ enableEmailNotifications: checked });
  };

  const handleFrequencyChange = (value: 'realtime' | 'hourly' | 'daily') => {
    updateNotificationSettings({ notificationFrequency: value });
  };

  // Display handlers
  const handleDateFormatChange = (value: 'mdy' | 'dmy' | 'ymd') => {
    updateDisplaySettings({ dateFormat: value });
  };

  const handleTimeZoneChange = (value: string) => {
    updateDisplaySettings({ timeZone: value });
  };

  const handle24HourTimeChange = (checked: boolean) => {
    updateDisplaySettings({ use24HourTime: checked });
  };

  React.useEffect(() => {
    // Set dark mode on component mount based on settings or localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    const shouldUseDarkMode = settings.enableDarkMode || savedDarkMode === 'true';

    if (shouldUseDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.enableDarkMode]);

  return (
    <div className="space-y-6">
      {/* Business Identity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-red-600" />
            <CardTitle>Business Identity</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure your business information and branding
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input
                value={settings.businessName || ''}
                onChange={handleBusinessNameChange}
                placeholder="Enter your business name"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Business Description</Label>
              <Input
                value={settings.businessDescription || ''}
                onChange={handleInputChange('businessDescription')}
                placeholder="Brief description of your business"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Business Logo</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isLoading}
                className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended size: 200x200px, PNG or JPEG format
            </p>
          </div>

          <div className="space-y-2">
            <Label>Business Website</Label>
            <Input
              value={settings.websiteUrl || ''}
              onChange={handleInputChange('websiteUrl')}
              placeholder="https://www.yourwebsite.com"
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-red-600" />
            <CardTitle>Contact Information</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Set up your business contact details
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Primary Phone Number
              </Label>
              <Input
                value={settings.primaryPhone || ''}
                onChange={handleInputChange('primaryPhone')}
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Business Email
              </Label>
              <Input
                value={settings.businessEmail || ''}
                onChange={handleInputChange('businessEmail')}
                placeholder="contact@yourcompany.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Business Address
            </Label>
            <Textarea
              value={settings.businessAddress || ''}
              onChange={handleInputChange('businessAddress')}
              placeholder="123 Business Street, City, State, ZIP Code"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Business Hours
            </Label>
            <Textarea
              value={settings.businessHours || ''}
              onChange={handleInputChange('businessHours')}
              placeholder="Monday - Friday: 9:00 AM - 6:00 PM&#10;Saturday: 10:00 AM - 4:00 PM&#10;Sunday: Closed"
              rows={3}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Website Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-red-600" />
            <CardTitle>Website Appearance</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Customize the look and feel of your website
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Dark Mode</Label>
              <div className="text-sm text-muted-foreground">
                Allow users to switch between light and dark mode
              </div>
            </div>
            <Switch
              checked={settings.enableDarkMode || false}
              onCheckedChange={handleDarkModeChange}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Business Logo</Label>
              <div className="text-sm text-muted-foreground">
                Display your business logo in the header
              </div>
            </div>
            <Switch
              checked={settings.showLogo || false}
              onCheckedChange={handleSwitchChange('showLogo')}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            <CardTitle>Security & Privacy</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure security and privacy settings
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable SSL/HTTPS</Label>
              <div className="text-sm text-muted-foreground">
                Force HTTPS connections for security
              </div>
            </div>
            <Switch
              checked={settings.enableSSL || false}
              onCheckedChange={handleSwitchChange('enableSSL')}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Google Analytics</Label>
              <div className="text-sm text-muted-foreground">
                Track website performance and visitor analytics
              </div>
            </div>
            <Switch
              checked={settings.enableAnalytics || false}
              onCheckedChange={handleSwitchChange('enableAnalytics')}
              disabled={isLoading}
            />
          </div>

          {settings.enableAnalytics && (
            <div className="space-y-2">
              <Label>Google Analytics Tracking ID</Label>
              <Input
                value={settings.analyticsId || ''}
                onChange={handleInputChange('analyticsId')}
                placeholder="G-XXXXXXXXXX"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cookie Consent Banner</Label>
              <div className="text-sm text-muted-foreground">
                Show cookie consent banner for GDPR compliance
              </div>
            </div>
            <Switch
              checked={settings.enableCookieConsent || false}
              onCheckedChange={handleSwitchChange('enableCookieConsent')}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <div className="text-sm text-muted-foreground">
                Put website in maintenance mode for updates
              </div>
            </div>
            <Switch
              checked={settings.maintenanceMode || false}
              onCheckedChange={handleSwitchChange('maintenanceMode')}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* User Interaction */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-600" />
            <CardTitle>User Interaction</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure notifications and user communication settings
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Chat Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive notifications for new chat messages
              </div>
            </div>
            <Switch
              checked={notificationSettings?.enableChatNotifications || false}
              onCheckedChange={handleChatNotificationsChange}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive email notifications for important updates
              </div>
            </div>
            <Switch
              checked={notificationSettings?.enableEmailNotifications || false}
              onCheckedChange={handleEmailNotificationsChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Notification Frequency</Label>
            <Select
              value={notificationSettings?.notificationFrequency || 'realtime'}
              onValueChange={handleFrequencyChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-red-600" />
            <CardTitle>Display Preferences</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Customize date, time, and regional display settings
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={displaySettings?.dateFormat || 'mdy'}
                onValueChange={handleDateFormatChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="ymd">YYYY/MM/DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Zone</Label>
              <Select
                value={displaySettings?.timeZone || 'utc'}
                onValueChange={handleTimeZoneChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="est">Eastern Time (EST)</SelectItem>
                  <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                  <SelectItem value="cst">Central Time (CST)</SelectItem>
                  <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>24-Hour Time</Label>
              <div className="text-sm text-muted-foreground">
                Use 24-hour time format instead of 12-hour
              </div>
            </div>
            <Switch
              checked={displaySettings?.use24HourTime || false}
              onCheckedChange={handle24HourTimeChange}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteSettingsForm;