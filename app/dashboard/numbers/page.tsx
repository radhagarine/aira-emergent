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
          <Button variant="outline" className="flex items-center gap-2">
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
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone number</TableHead>
              <TableHead>Agent answering this phone number</TableHead>
              <TableHead>Telephony</TableHead>
              <TableHead>Bought on</TableHead>
              <TableHead>Renews on</TableHead>
              <TableHead>Monthly rent</TableHead>
              <TableHead>Unlink agent from phone</TableHead>
              <TableHead>Delete phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {numbers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No phone numbers found. Click "Buy phone number" to get started.
                </TableCell>
              </TableRow>
            ) : (
              numbers.map((number) => (
                <TableRow key={number.id}>
                  <TableCell className="font-medium">
                    {formatPhoneNumber(number.phone_number)}
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600 font-medium">
                      {number.display_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    {number.provider || 'plivo'}
                  </TableCell>
                  <TableCell>
                    {formatDate(number.purchase_date)}
                  </TableCell>
                  <TableCell>
                    {calculateRenewalDate(number.purchase_date)}
                  </TableCell>
                  <TableCell>
                    ${number.monthly_cost?.toFixed(1) || '5.0'}
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-blue-600 hover:underline text-sm"
                      onClick={() => setEditingNumber(number)}
                    >
                      Unlink agent ↗
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setDeletingNumber(number)}
                      className="text-red-600 hover:text-red-800"
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