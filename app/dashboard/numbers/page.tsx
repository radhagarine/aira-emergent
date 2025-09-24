'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useBusinessNumbersService } from '@/components/providers/service-provider'
import { BusinessNumberWithBusiness, NumberUsageStats } from '@/lib/types/database/numbers.types'
import { AddNumberDialog } from './components/AddNumberDialog'
import { EditNumberDialog } from './components/EditNumberDialog'
import { DeleteNumberDialog } from './components/DeleteNumberDialog'

export default function NumbersPage() {
  const businessNumbersService = useBusinessNumbersService()
  const [numbers, setNumbers] = useState<BusinessNumberWithBusiness[]>([])
  const [stats, setStats] = useState<NumberUsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingNumber, setEditingNumber] = useState<BusinessNumberWithBusiness | null>(null)
  const [deletingNumber, setDeletingNumber] = useState<BusinessNumberWithBusiness | null>(null)

  // Mock user ID and balance - in real app, get from auth context
  const userId = 'user123'
  const availableBalance = 0.96

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [numbersData, statsData] = await Promise.all([
        businessNumbersService.getAllNumbersByUserId(userId),
        businessNumbersService.getUsageStatistics(userId)
      ])
      setNumbers(numbersData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading numbers data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneNumber = (phoneNumber: string) => {
    // Simple formatting for display
    return phoneNumber
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    }) + ', ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const calculateRenewalDate = (purchaseDate: string | null) => {
    if (!purchaseDate) return '-'
    const purchase = new Date(purchaseDate)
    const renewal = new Date(purchase)
    renewal.setMonth(renewal.getMonth() + 1)
    return renewal.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My phone numbers</h1>
          <p className="text-muted-foreground">
            Buy and view your phone numbers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span>Available balance:</span>
            <span className="font-semibold">${availableBalance.toFixed(2)}</span>
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.location.href = '/dashboard/funds'}
          >
            <Plus className="h-4 w-4" />
            Add more funds
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            Docs
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-red-800 hover:bg-red-900 text-white"
          >
            Buy phone number
          </Button>
        </div>
      </div>

      {/* Numbers Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Phone number</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Agent answering this phone number</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Telephony</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Bought on</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Renews on</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Monthly rent</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Unlink agent from phone</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Delete phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {numbers.length === 0 ? (
              <TableRow className="border-b border-gray-200 dark:border-gray-700">
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground dark:text-gray-400">
                  No phone numbers found. Click "Buy phone number" to get started.
                </TableCell>
              </TableRow>
            ) : (
              numbers.map((number) => (
                <TableRow key={number.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                    {formatPhoneNumber(number.phone_number)}
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {number.display_name}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">
                    {number.provider || 'plivo'}
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">
                    {formatDate(number.purchase_date)}
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">
                    {calculateRenewalDate(number.purchase_date)}
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">
                    ${number.monthly_cost?.toFixed(1) || '5.0'}
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      onClick={() => setEditingNumber(number)}
                    >
                      Unlink agent ↗
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setDeletingNumber(number)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <AddNumberDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={loadData}
      />

      {editingNumber && (
        <EditNumberDialog
          open={!!editingNumber}
          number={editingNumber}
          onClose={() => setEditingNumber(null)}
          onSuccess={loadData}
        />
      )}

      {deletingNumber && (
        <DeleteNumberDialog
          open={!!deletingNumber}
          number={deletingNumber}
          onClose={() => setDeletingNumber(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}