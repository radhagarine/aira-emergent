// CrmIntegrationForm.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link, CheckCircle, AlertCircle, Settings } from 'lucide-react';

interface CrmIntegrationFormProps {
  isLoading?: boolean;
}

const CrmIntegrationForm: React.FC<CrmIntegrationFormProps> = ({
  isLoading = false
}) => {
  const [selectedCrm, setSelectedCrm] = React.useState('');
  const [crmApiKey, setCrmApiKey] = React.useState('');
  const [crmApiUrl, setCrmApiUrl] = React.useState('');
  const [testingConnection, setTestingConnection] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleTestConnection = async () => {
    if (!selectedCrm || !crmApiKey || !crmApiUrl) {
      setConnectionStatus('error');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      // Simulate API test - replace with actual CRM connection test
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For demo purposes, randomly succeed or fail
      const success = Math.random() > 0.3;
      setConnectionStatus(success ? 'success' : 'error');
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  const crmProviders = [
    { value: 'salesforce', label: 'Salesforce', popular: true },
    { value: 'hubspot', label: 'HubSpot', popular: true },
    { value: 'pipedrive', label: 'Pipedrive', popular: true },
    { value: 'zoho', label: 'Zoho CRM' },
    { value: 'freshsales', label: 'Freshsales' },
    { value: 'monday', label: 'Monday.com' },
    { value: 'airtable', label: 'Airtable' },
    { value: 'custom', label: 'Custom API' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-red-600" />
          <CardTitle>CRM Integration</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect AiRA to your CRM system for seamless data synchronization
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>CRM Provider</Label>
            <Select value={selectedCrm} onValueChange={setSelectedCrm}>
              <SelectTrigger>
                <SelectValue placeholder="Select your CRM provider" />
              </SelectTrigger>
              <SelectContent>
                {crmProviders.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    <div className="flex items-center gap-2">
                      {provider.label}
                      {provider.popular && (
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCrm && (
            <>
              <div className="space-y-2">
                <Label>API Endpoint URL</Label>
                <Input
                  value={crmApiUrl}
                  onChange={(e) => setCrmApiUrl(e.target.value)}
                  placeholder={`Enter your ${crmProviders.find(p => p.value === selectedCrm)?.label} API URL`}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Example: https://your-domain.salesforce.com/services/data/v52.0/
                </p>
              </div>

              <div className="space-y-2">
                <Label>API Key / Access Token</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={crmApiKey}
                    onChange={(e) => setCrmApiKey(e.target.value)}
                    placeholder="Enter your CRM API key or access token"
                    disabled={isLoading}
                    className="font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This key will be encrypted and stored securely
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={!crmApiKey || !crmApiUrl || testingConnection || isLoading}
                  className="flex items-center gap-2"
                >
                  {testingConnection ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>

                {connectionStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Connection successful</span>
                  </div>
                )}

                {connectionStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Connection failed</span>
                  </div>
                )}
              </div>

              {connectionStatus === 'success' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Integration Features Available
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Automatic lead creation from phone calls</li>
                    <li>• Contact synchronization</li>
                    <li>• Call logging and activity tracking</li>
                    <li>• Appointment scheduling integration</li>
                    <li>• Real-time data synchronization</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CrmIntegrationForm;