// src/app/settings/components/NotificationSettingsForm.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationSettings } from '@/lib/services/settings/settings.service';
import { useSettingsStore } from '../store/SettingsStore';

interface NotificationSettingsFormProps {
  settings: NotificationSettings;
  isLoading?: boolean;
}

const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({
  settings,
  isLoading = false
}) => {
  const { updateNotificationSettings } = useSettingsStore();

  const handleChatNotificationsChange = (checked: boolean) => {
    updateNotificationSettings({ enableChatNotifications: checked });
  };

  const handleEmailNotificationsChange = (checked: boolean) => {
    updateNotificationSettings({ enableEmailNotifications: checked });
  };

  const handleFrequencyChange = (value: 'realtime' | 'hourly' | 'daily') => {
    updateNotificationSettings({ notificationFrequency: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Interaction Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Chat Notifications</Label>
              <div className="text-sm text-gray-500">
                Receive notifications for new chat messages
              </div>
            </div>
            <Switch
              checked={settings.enableChatNotifications}
              onCheckedChange={handleChatNotificationsChange}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <div className="text-sm text-gray-500">
                Receive email notifications for important updates
              </div>
            </div>
            <Switch
              checked={settings.enableEmailNotifications}
              onCheckedChange={handleEmailNotificationsChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Notification Frequency</Label>
            <Select
              value={settings.notificationFrequency}
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
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsForm;