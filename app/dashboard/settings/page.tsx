'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

// Auth and services
import { useAuth } from '@/components/providers/auth-provider'
import { useSettingsStore } from './store/SettingsStore'

// Components
import WebsiteSettingsForm from './components/WebsiteSettingsForm'
import NotificationSettingsForm from './components/NotificationSettingsForm'
import DisplaySettingsForm from './components/DisplaySettingsForm'
import AdvancedSettingsForm from './components/AdvancedSettingsForm'
import CrmIntegrationForm from './components/CrmIntegrationForm'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('website')

  // Auth
  const { user } = useAuth()
  
  // Settings state
  const { 
    settings, 
    loading, 
    error, 
    saving,
    saveSuccess,
    fetchSettings,
    saveSettings,
    resetSaveState
  } = useSettingsStore()

  // Load settings on mount
  useEffect(() => {
    if (user?.id) {
      fetchSettings(user.id)
    }
  }, [user?.id, fetchSettings])

  // Handle save
  const handleSave = async () => {
    if (!user?.id || !settings) return
    
    try {
      const success = await saveSettings(user.id)
      
      if (success) {
        toast.success('Settings saved successfully')
      }
    } catch (err) {
      console.error('Error saving settings:', err)
      toast.error('Failed to save settings')
    }
  }

  // Reset success state on tab change
  useEffect(() => {
    resetSaveState()
  }, [activeTab, resetSaveState])

  // Show loading state
  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-sm text-gray-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 rounded-full bg-red-100">
            <Loader2 className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-lg font-medium text-gray-900">Failed to load settings</p>
          <p className="text-sm text-gray-500">{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => user?.id && fetchSettings(user.id)}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // If settings is null even though we're not loading, return early
  if (!settings) {
    return null
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Settings</h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Settings related to the website, how business user is interacted with the AiRA website
          </p>
        </div>
      </div>

      <Tabs defaultValue="website" value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="w-full h-auto border-b border-border bg-transparent flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <TabsTrigger
                value="website"
                className="relative border-2 border-transparent bg-card dark:bg-card data-[state=active]:border-[#8B0000] dark:data-[state=active]:border-red-400 data-[state=active]:border-b-transparent data-[state=active]:text-[#8B0000] dark:data-[state=active]:text-red-400 px-3 py-2 sm:px-6 sm:py-2 text-foreground text-sm sm:text-base w-full sm:w-auto"
            >
                Website Settings
            </TabsTrigger>
            <TabsTrigger
                value="functionality"
                className="relative border-2 border-transparent bg-card dark:bg-card data-[state=active]:border-[#8B0000] dark:data-[state=active]:border-red-400 data-[state=active]:border-b-transparent data-[state=active]:text-[#8B0000] dark:data-[state=active]:text-red-400 px-3 py-2 sm:px-6 sm:py-2 text-foreground text-sm sm:text-base w-full sm:w-auto"
            >
                P2 Functionality
            </TabsTrigger>
            <TabsTrigger
                value="crm"
                className="relative border-2 border-transparent bg-card dark:bg-card data-[state=active]:border-[#8B0000] dark:data-[state=active]:border-red-400 data-[state=active]:border-b-transparent data-[state=active]:text-[#8B0000] dark:data-[state=active]:text-red-400 px-3 py-2 sm:px-6 sm:py-2 text-foreground text-sm sm:text-base w-full sm:w-auto"
            >
                CRM Integration
            </TabsTrigger>
        </TabsList>

        <TabsContent value="website" className="space-y-6">
          <WebsiteSettingsForm
            settings={settings.websiteSettings}
            notificationSettings={settings.notificationSettings}
            displaySettings={settings.displaySettings}
            isLoading={loading || saving}
          />
        </TabsContent>


        <TabsContent value="functionality" className="space-y-6">
          <AdvancedSettingsForm
            settings={settings.advancedSettings}
            userId={user?.id || ''}
            isLoading={loading || saving}
          />
        </TabsContent>

        <TabsContent value="crm" className="space-y-6">
          <CrmIntegrationForm
            isLoading={loading || saving}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 items-center">
        {saveSuccess && (
          <div className="flex items-center text-green-600 text-sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Changes saved successfully
          </div>
        )}
        <Button 
          className="bg-[#8B0000] hover:bg-[#6B0000]"
          onClick={handleSave}
          disabled={loading || saving || !user?.id}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}