'use client'

import { useState } from 'react'
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
import { useBusinessNumbersService, useBusinessService } from '@/components/providers/service-provider'
import { BusinessNumberType } from '@/lib/types/database/numbers.types'
import { BusinessResponse } from '@/lib/services/business/types'

interface AddNumberDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddNumberDialog({ open, onClose, onSuccess }: AddNumberDialogProps) {
  const businessNumbersService = useBusinessNumbersService()
  const businessService = useBusinessService()
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    displayName: '',
    countryCode: 'US',
    businessId: '',
    numberType: BusinessNumberType.LOCAL,
    provider: '',
    monthlyCoast: '',
    isPrimary: false,
    isActive: true,
    features: [] as string[],
    notes: ''
  })
  
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Mock user ID - in real app, get from auth context
  const userId = 'user123'

  const loadBusinesses = async () => {
    try {
      const businessData = await businessService.getBusinessProfile(userId)
      setBusinesses(businessData)
    } catch (error) {
      console.error('Error loading businesses:', error)
    }
  }

  React.useEffect(() => {
    if (open) {
      loadBusinesses()
    }
  }, [open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required'
    }

    if (!formData.displayName) {
      newErrors.displayName = 'Display name is required'
    }

    if (!formData.businessId) {
      newErrors.businessId = 'Business is required'
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
      await businessNumbersService.createNumber({
        phone_number: formData.phoneNumber,
        display_name: formData.displayName,
        country_code: formData.countryCode,
        business_id: formData.businessId,
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
      
      // Reset form
      setFormData({
        phoneNumber: '',
        displayName: '',
        countryCode: 'US',
        businessId: '',
        numberType: BusinessNumberType.LOCAL,
        provider: '',
        monthlyCoast: '',
        isPrimary: false,
        isActive: true,
        features: [],
        notes: ''
      })
    } catch (error) {
      console.error('Error creating number:', error)
      setErrors({ general: 'Failed to create number. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Business Number</DialogTitle>
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
              <Label htmlFor="business">Business *</Label>
              <Select
                value={formData.businessId}
                onValueChange={(value) => setFormData({ ...formData, businessId: value })}
              >
                <SelectTrigger className={errors.businessId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.businessId && (
                <p className="text-red-500 text-sm mt-1">{errors.businessId}</p>
              )}
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
              {loading ? 'Adding...' : 'Add Number'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Add React import
import React from 'react'