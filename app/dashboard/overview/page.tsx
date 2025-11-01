'use client'

import OverviewPage from './components/BusinessOverview'

export default function BusinessOverviewPage() {
  // REMOVED: AppProvider wrapper - providers already exist in layouts
  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <OverviewPage />
      </div>
    </div>
  )
}