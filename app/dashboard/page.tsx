'use client'
import BusinessProfile from '@/app/dashboard/profile/components/BusinessProfile';

export default function DashboardPage() {
  // REMOVED: AppProvider wrapper - providers already exist in layouts
  // This prevents creating a 3rd set of duplicate providers
  return <BusinessProfile />;
}