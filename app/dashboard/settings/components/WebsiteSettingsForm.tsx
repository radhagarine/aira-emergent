// src/app/settings/components/WebsiteSettingsForm.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WebsiteSettings } from '@/lib/services/settings/settings.service';
import { useSettingsStore } from '../store/SettingsStore';

interface WebsiteSettingsFormProps {
  settings: WebsiteSettings;
  isLoading?: boolean;
}

const WebsiteSettingsForm: React.FC<WebsiteSettingsFormProps> = ({
  settings,
  isLoading = false
}) => {
  const { updateWebsiteSettings } = useSettingsStore();

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
    <Card>
      <CardHeader>
        <CardTitle>Website Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">   
              Business Name
            </Label>
            <Input 
              value={settings.businessName}
              onChange={handleBusinessNameChange}
              placeholder="Enter your business name"
              className="w-full h-12"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Website Theme</Label>
            <Select 
              value={settings.theme} 
              onValueChange={handleThemeChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Theme</SelectItem>
                <SelectItem value="dark">Dark Theme</SelectItem>
                <SelectItem value="light">Light Theme</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Dark Mode</Label>
              <div className="text-sm text-gray-500">
                Allow users to switch between light and dark mode
              </div>
            </div>
            <Switch
              checked={settings.enableDarkMode}
              onCheckedChange={handleDarkModeChange}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebsiteSettingsForm;