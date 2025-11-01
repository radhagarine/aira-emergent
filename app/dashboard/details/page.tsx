'use client';

import BusinessDashboard from './BusinessDashboard';

export default function BusinessDetailsPage() {
  // REMOVED: AppProvider wrapper - providers already exist in layouts
  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4 max-w-full overflow-hidden">
      <BusinessDashboard />
    </div>
  );
}