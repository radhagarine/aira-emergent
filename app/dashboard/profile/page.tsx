'use client'

import { AppProvider } from '@/components/providers/app-provider';
import BusinessProfile from '@/app/dashboard/profile/components/BusinessProfile';

export default function ProfilePage() {
  return (
    <div className="p-6">
      <div className="space-y-6">
        <AppProvider>
          <BusinessProfile />
        </AppProvider>
      </div>
    </div>
  )
}