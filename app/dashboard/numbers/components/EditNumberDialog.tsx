'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useBusinessNumbersService } from '@/components/providers/service-provider'
import { BusinessNumberType, BusinessNumberWithBusiness } from '@/lib/types/database/numbers.types'

interface EditNumberDialogProps {
  open: boolean
  number: BusinessNumberWithBusiness
  onClose: () => void
  onSuccess: () => void
}

export function EditNumberDialog({ open, number, onClose, onSuccess }: EditNumberDialogProps) {
  const businessNumbersService = useBusinessNumbersService()

  const [formData, setFormData] = useState({
    phoneNumber: '',
    displayName: '',
    countryCode: '',
    numberType: BusinessNumberType.LOCAL,
    provider: '',
    monthlyCoast: '',
    isPrimary: false,
    isActive: true,
    features: [] as string[],
    notes: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && number) {
      setFormData({
        phoneNumber: number.phone_number,
        displayName: number.display_name,
        countryCode: number.country_code,
        numberType: number.number_type,
        provider: number.provider || '',
        monthlyCoast: number.monthly_cost?.toString() || '',
        isPrimary: number.is_primary,
        isActive: number.is_active,
        features: number.features || [],
        notes: number.notes || ''
      })
    }
  }, [open, number])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required'
    }

    if (!formData.displayName) {
      newErrors.displayName = 'Display name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await businessNumbersService.updateNumber(number.id, {
        phone_number: formData.phoneNumber,
        display_name: formData.displayName,
        country_code: formData.countryCode,
        number_type: formData.numberType,
        provider: formData.provider || null,
        monthly_cost: formData.monthlyCoast ? parseFloat(formData.monthlyCoast) : null,
        is_primary: formData.isPrimary,
        is_active: formData.isActive,
        features: formData.features.length > 0 ? formData.features : null,
        notes: formData.notes || null
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating number:', error)
      setErrors({ general: 'Failed to update number. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Business Number</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className={errors.phoneNumber ? 'border-red-500' : ''}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="Main Business Line"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className={errors.displayName ? 'border-red-500' : ''}
              />
              {errors.displayName && (
                <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="countryCode">Country Code</Label>
              <Input
                id="countryCode"
                placeholder="US"
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="numberType">Number Type</Label>
              <Select
                value={formData.numberType}
                onValueChange={(value) => setFormData({ ...formData, numberType: value as BusinessNumberType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(BusinessNumberType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                placeholder="e.g., Twilio, RingCentral"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="monthlyCoast">Monthly Cost</Label>
              <Input
                id="monthlyCoast"
                type="number"
                step="0.01"
                placeholder="25.00"
                value={formData.monthlyCoast}
                onChange={(e) => setFormData({ ...formData, monthlyCoast: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this number..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={formData.isPrimary}
                onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: !!checked })}
              />
              <Label htmlFor="isPrimary">Set as primary number</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Number'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}