'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useBusinessNumbersService } from '@/components/providers/service-provider'
import { BusinessNumberWithBusiness } from '@/lib/types/database/numbers.types'

interface DeleteNumberDialogProps {
  open: boolean
  number: BusinessNumberWithBusiness
  onClose: () => void
  onSuccess: () => void
}

export function DeleteNumberDialog({ open, number, onClose, onSuccess }: DeleteNumberDialogProps) {
  const businessNumbersService = useBusinessNumbersService()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      await businessNumbersService.deleteNumber(number.id)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error deleting number:', error)
      setError(error.message || 'Failed to delete number. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle>Delete Phone Number</DialogTitle>
              <DialogDescription className="mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <div className="font-semibold">{number.display_name}</div>
              <div className="text-sm text-muted-foreground">{number.phone_number}</div>
              {number.business && (
                <div className="text-sm text-muted-foreground">
                  Business: {number.business.name}
                </div>
              )}
              {number.is_primary && (
                <div className="text-sm font-medium text-yellow-600">
                  ⚠️ This is a primary number
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this phone number? This will permanently remove it from your account and any associated configurations.
          </p>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Number'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}