import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerInteractionData } from '@/lib/services/business/types';

interface CustomerSettingsProps {
  settings: CustomerInteractionData;
  onChange: (updates: Partial<CustomerInteractionData>) => void;
}

const CustomerSettings: React.FC<CustomerSettingsProps> = ({
  settings,
  onChange
}) => {
  // Handle field change
  const handleChange = (field: keyof CustomerInteractionData, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Customer Interaction Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="ai_communication_style">AI Communication Style</Label>
          <Select 
            value={settings.ai_communication_style || 'professional'}
            onValueChange={(value) => handleChange('ai_communication_style', value)}
          >
            <SelectTrigger id="ai_communication_style" className="w-full">
              <SelectValue placeholder="Select communication style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            Choose how AiRA should communicate with your customers
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="greeting_message">Greeting Message</Label>
          <Textarea
            id="greeting_message"
            value={settings.greeting_message || ''}
            onChange={(e) => handleChange('greeting_message', e.target.value)}
            placeholder="Enter the greeting message for customers"
            className="min-h-[120px]"
          />
          <p className="text-sm text-gray-500">
            This message will be used when greeting customers
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="special_instructions">Special Instructions</Label>
          <Textarea
            id="special_instructions"
            value={settings.special_instructions || ''}
            onChange={(e) => handleChange('special_instructions', e.target.value)}
            placeholder="Enter any special instructions for customer interactions"
            className="min-h-[150px]"
          />
          <p className="text-sm text-gray-500">
            Any specific guidelines or rules for handling customer interactions
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerSettings;