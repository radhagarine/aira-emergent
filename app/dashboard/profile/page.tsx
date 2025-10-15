'use client'

import BusinessProfile from '@/app/dashboard/profile/components/BusinessProfile';

export default function ProfilePage() {
  // REMOVED: AppProvider wrapper - providers already exist in layouts
  return (
    <div className="p-6">
      <div className="space-y-6">
        <BusinessProfile />
      </div>
    </div>
  )
}