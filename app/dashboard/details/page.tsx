'use client';

import { AppProvider } from '@/components/providers/app-provider';
import BusinessDashboard from './BusinessDashboard';

export default function BusinessDetailsPage() {
  return (
    <AppProvider>
      <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4 max-w-full overflow-hidden">
        <BusinessDashboard />
      </div>
    </AppProvider>
  );
}