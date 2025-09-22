// src/app/settings/components/AdvancedSettingsForm.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AdvancedSettings } from '@/lib/services/settings/settings.service';
import { useSettingsStore } from '../store/SettingsStore';
import { Loader2 } from 'lucide-react';

interface AdvancedSettingsFormProps {
  settings: AdvancedSettings;
  userId: string;
  isLoading?: boolean;
}

const AdvancedSettingsForm: React.FC<AdvancedSettingsFormProps> = ({
  settings,
  userId,
  isLoading = false
}) => {
  const { 
    updateAdvancedSettings, 
    generateApiKey,
    saving 
  } = useSettingsStore();

  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleAdvancedFeaturesChange = (checked: boolean) => {
    updateAdvancedSettings({ enableAdvancedFeatures: checked });
  };

  const handleApiAccessChange = (checked: boolean) => {
    updateAdvancedSettings({ enableApiAccess: checked });
    
    // If turning off API access, clear the API key
    if (!checked) {
      updateAdvancedSettings({ apiKey: null });
    }
  };

  const handleGenerateApiKey = async () => {
    setIsGenerating(true);
    
    try {
      await generateApiKey(userId);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>P2 Functionality</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Advanced Features</Label>
              <div className="text-sm text-gray-500">
                Access to beta and experimental features
              </div>
            </div>
            <Switch
              checked={settings.enableAdvancedFeatures}
              onCheckedChange={handleAdvancedFeaturesChange}
              disabled={isLoading || saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>API Access</Label>
              <div className="text-sm text-gray-500">
                Enable API access for third-party integrations
              </div>
            </div>
            <Switch
              checked={settings.enableApiAccess}
              onCheckedChange={handleApiAccessChange}
              disabled={isLoading || saving}
            />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input 
                value={settings.apiKey || ''} 
                placeholder="Your API key will appear here" 
                disabled
                className="font-mono text-sm"
              />
              <Button 
                variant="outline"
                onClick={handleGenerateApiKey}
                disabled={!settings.enableApiAccess || isLoading || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : 'Generate'}
              </Button>
            </div>
            {settings.apiKey && (
              <p className="text-xs text-gray-500 mt-1">
                Keep this key secret. For security reasons, we won't show it again.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedSettingsForm;