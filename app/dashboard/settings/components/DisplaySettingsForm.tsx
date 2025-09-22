// src/app/settings/components/DisplaySettingsForm.tsx
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
import { DisplaySettings } from '@/lib/services/settings/settings.service';
import { useSettingsStore } from '../store/SettingsStore';

interface DisplaySettingsFormProps {
  settings: DisplaySettings;
  isLoading?: boolean;
}

const DisplaySettingsForm: React.FC<DisplaySettingsFormProps> = ({
  settings,
  isLoading = false
}) => {
  const { updateDisplaySettings } = useSettingsStore();

  const handleDateFormatChange = (value: 'mdy' | 'dmy' | 'ymd') => {
    updateDisplaySettings({ dateFormat: value });
  };

  const handleTimeZoneChange = (value: string) => {
    updateDisplaySettings({ timeZone: value });
  };

  const handle24HourTimeChange = (checked: boolean) => {
    updateDisplaySettings({ use24HourTime: checked });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select
              value={settings.dateFormat}
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
              value={settings.timeZone}
              onValueChange={handleTimeZoneChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="est">Eastern Time</SelectItem>
                <SelectItem value="pst">Pacific Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>24-Hour Time</Label>
              <div className="text-sm text-gray-500">
                Use 24-hour time format instead of 12-hour
              </div>
            </div>
            <Switch
              checked={settings.use24HourTime}
              onCheckedChange={handle24HourTimeChange}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DisplaySettingsForm;