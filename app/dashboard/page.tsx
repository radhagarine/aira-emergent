'use client'
import { redirect } from 'next/navigation'
import { AppProvider } from '@/components/providers/app-provider';
import BusinessProfile from '@/app/dashboard/profile/components/BusinessProfile';

export default function DashboardPage() {
  return (
    <AppProvider>
      <BusinessProfile />
    </AppProvider>
  );
}