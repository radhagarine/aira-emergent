'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/providers/auth-provider'
import { BusinessNumberType } from '@/lib/types/database/numbers.types'
import { toast } from 'sonner'

interface AddNumberDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialPhoneNumber?: string
}

export function AddNumberDialog({ open, onClose, onSuccess, initialPhoneNumber }: AddNumberDialogProps) {
  const { user } = useAuth()

  // Purchase state
  const [phoneNumber, setPhoneNumber] = useState('')
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState('')
  const [displayName, setDisplayName] = useState('')

  const userId = user?.id || ''

  useEffect(() => {
    if (open) {
      // Set phone number if provided
      if (initialPhoneNumber) {
        setPhoneNumber(initialPhoneNumber)
      }
      // Reset state
      setPurchaseError('')
    }
  }, [open, initialPhoneNumber])

  const handlePurchase = async () => {
    if (!phoneNumber) {
      setPurchaseError('Please select a phone number')
      return
    }

    if (!displayName) {
      setPurchaseError('Please enter a display name')
      return
    }

    setPurchasing(true)
    setPurchaseError('')

    try {
      const response = await fetch('/api/numbers/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          displayName,
          countryCode: 'US',
          numberType: BusinessNumberType.LOCAL,
          userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'INSUFFICIENT_BALANCE') {
          throw new Error(`Insufficient balance. You need $${data.requiredAmount?.toFixed(2) || '0.00'} to purchase this number.`)
        }
        throw new Error(data.error || 'Failed to purchase number')
      }

      // Success!
      toast.success('Phone number purchased successfully!')
      onSuccess()
      onClose()

      // Reset form
      setPhoneNumber('')
      setDisplayName('')
    } catch (error: any) {
      console.error('Error purchasing number:', error)
      setPurchaseError(error.message || 'Failed to purchase number')
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Purchase phone number</DialogTitle>
          <DialogDescription>
            Complete the purchase of your selected phone number
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Phone Number Display */}
          <div>
            <Label>Phone Number</Label>
            <Input
              value={phoneNumber}
              disabled
              className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium cursor-not-allowed"
            />
          </div>

          {/* Display Name */}
          <div>
            <Label>Display Name</Label>
            <Input
              placeholder="e.g., Customer Support Line"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              A friendly name to identify this number in your dashboard
            </p>
          </div>

          {purchaseError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {purchaseError}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={purchasing}>
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={purchasing || !displayName || !phoneNumber}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {purchasing ? 'Purchasing...' : 'Purchase number'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
