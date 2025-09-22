'use client'

import OverviewPage from './components/BusinessOverview'
import { AppProvider } from '@/components/providers/app-provider';


export default function BusinessOverviewPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <AppProvider>
          <OverviewPage />
        </AppProvider>
      </div>
    </div>
  )
}