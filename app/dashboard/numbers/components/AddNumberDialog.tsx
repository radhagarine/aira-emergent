'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
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
import { useBusinessService } from '@/components/providers/service-provider'
import { useAuth } from '@/components/providers/supabase-provider'
import { BusinessNumberType } from '@/lib/types/database/numbers.types'
import { BusinessResponse } from '@/lib/services/business/types'
import { toast } from 'sonner'

interface AddNumberDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface AvailableNumber {
  phoneNumber: string
  friendlyName: string
  locality: string | null
  region: string | null
  monthlyCost: number
  capabilities: {
    voice: boolean
    sms: boolean
    mms: boolean
  }
}

const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
]

const NUMBER_TYPES = [
  { value: 'local', label: 'Local' },
  { value: 'tollFree', label: 'Toll-Free' },
  { value: 'mobile', label: 'Mobile' },
]

export function AddNumberDialog({ open, onClose, onSuccess }: AddNumberDialogProps) {
  const businessService = useBusinessService()

  // Search state
  const [countryCode, setCountryCode] = useState('US')
  const [numberType, setNumberType] = useState<'local' | 'tollFree' | 'mobile'>('local')
  const [pattern, setPattern] = useState('')
  const [searching, setSearching] = useState(false)
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([])
  const [searchError, setSearchError] = useState('')

  // Purchase state
  const [selectedNumber, setSelectedNumber] = useState<string>('')
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState('')
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState('')
  const [displayName, setDisplayName] = useState('')

  const { user } = useAuth()
  const userId = user?.id || ''

  useEffect(() => {
    if (open) {
      loadBusinesses()
      // Reset state
      setAvailableNumbers([])
      setSelectedNumber('')
      setPattern('')
      setSearchError('')
      setPurchaseError('')
    }
  }, [open])

  const loadBusinesses = async () => {
    try {
      const businessData = await businessService.getBusinessProfile(userId)
      setBusinesses(businessData)
      if (businessData.length > 0) {
        setSelectedBusiness(businessData[0].id)
      }
    } catch (error) {
      console.error('Error loading businesses:', error)
    }
  }

  const handleSearch = async () => {
    if (!countryCode || !numberType) {
      setSearchError('Please select country and number type')
      return
    }

    setSearching(true)
    setSearchError('')
    setAvailableNumbers([])
    setSelectedNumber('')

    try {
      const response = await fetch('/api/numbers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode,
          numberType,
          areaCode: pattern || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search numbers')
      }

      setAvailableNumbers(data.numbers || [])

      if (data.numbers.length === 0) {
        setSearchError('No numbers found matching your criteria. Try a different area code or pattern.')
      }
    } catch (error: any) {
      console.error('Error searching numbers:', error)
      setSearchError(error.message || 'Failed to search for numbers')
    } finally {
      setSearching(false)
    }
  }

  const handlePurchase = async () => {
    if (!selectedNumber) {
      setPurchaseError('Please select a phone number')
      return
    }

    if (!selectedBusiness) {
      setPurchaseError('Please select a business')
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
          phoneNumber: selectedNumber,
          businessId: selectedBusiness,
          displayName,
          countryCode,
          numberType: numberType === 'tollFree' ? BusinessNumberType.TOLL_FREE :
                      numberType === 'mobile' ? BusinessNumberType.MOBILE :
                      BusinessNumberType.LOCAL,
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
      onSuccess()
      onClose()

      // Reset form
      setAvailableNumbers([])
      setSelectedNumber('')
      setPattern('')
      setDisplayName('')
    } catch (error: any) {
      console.error('Error purchasing number:', error)
      setPurchaseError(error.message || 'Failed to purchase number')
    } finally {
      setPurchasing(false)
    }
  }

  const selectedNumberInfo = availableNumbers.find(n => n.phoneNumber === selectedNumber)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buy phone number</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select your country and optionally add a pattern
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Country</Label>
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Number Type</Label>
                <Select value={numberType} onValueChange={(v: any) => setNumberType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NUMBER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Pattern (optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 615 (area code)"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                />
                <Button
                  onClick={handleSearch}
                  disabled={searching}
                  className="bg-red-800 hover:bg-red-900 text-white"
                >
                  {searching ? 'Searching...' : <><Search className="h-4 w-4 mr-2" /> Search</>}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                For example, to search for phone numbers in the US starting with a 615 prefix, specify 615.
                Search results will be in the form "1615XXXXXX"
              </p>
            </div>

            {searchError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {searchError}
              </div>
            )}
          </div>

          {/* Results Section */}
          {availableNumbers.length > 0 && (
            <div className="space-y-3">
              <div>
                <Label>Select phone number</Label>
                <Select value={selectedNumber} onValueChange={setSelectedNumber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a number" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNumbers.map((number) => (
                      <SelectItem key={number.phoneNumber} value={number.phoneNumber}>
                        {number.phoneNumber} - ${number.monthlyCost.toFixed(2)}/month
                        {number.locality && ` (${number.locality}, ${number.region})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedNumber && (
                <>
                  <div>
                    <Label>Business</Label>
                    <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                      <SelectTrigger>
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
                  </div>

                  <div>
                    <Label>Display Name</Label>
                    <Input
                      placeholder="e.g., Customer Support Line"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>

                  {selectedNumberInfo && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                      <div className="font-semibold mb-1">Purchase Summary</div>
                      <div>Number: {selectedNumberInfo.phoneNumber}</div>
                      <div>Monthly cost: ${selectedNumberInfo.monthlyCost.toFixed(2)}</div>
                      <div>Capabilities: Voice: {selectedNumberInfo.capabilities.voice ? '✓' : '✗'},
                        SMS: {selectedNumberInfo.capabilities.sms ? '✓' : '✗'},
                        MMS: {selectedNumberInfo.capabilities.mms ? '✓' : '✗'}</div>
                    </div>
                  )}

                  {purchaseError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {purchaseError}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={purchasing}>
              Cancel
            </Button>
            {selectedNumber && (
              <Button
                onClick={handlePurchase}
                disabled={purchasing || !displayName || !selectedBusiness}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {purchasing ? 'Purchasing...' : 'Purchase number'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
