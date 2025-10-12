'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface BuyNumberDialogProps {
  open: boolean
  onClose: () => void
  onSelectNumber: (phoneNumber: string) => void
}

interface PhoneNumber {
  phoneNumber: string
  friendlyName: string
  locality: string
  region: string
  postalCode: string
  isoCountry: string
  capabilities: {
    voice: boolean
    sms: boolean
    mms: boolean
  }
}

// Popular US area codes
const US_AREA_CODES = [
  { value: 'any', label: 'Any Area Code' },
  { value: '212', label: '212 - New York, NY' },
  { value: '213', label: '213 - Los Angeles, CA' },
  { value: '305', label: '305 - Miami, FL' },
  { value: '312', label: '312 - Chicago, IL' },
  { value: '415', label: '415 - San Francisco, CA' },
  { value: '469', label: '469 - Dallas, TX' },
  { value: '512', label: '512 - Austin, TX' },
  { value: '602', label: '602 - Phoenix, AZ' },
  { value: '615', label: '615 - Nashville, TN' },
  { value: '617', label: '617 - Boston, MA' },
  { value: '619', label: '619 - San Diego, CA' },
  { value: '702', label: '702 - Las Vegas, NV' },
  { value: '713', label: '713 - Houston, TX' },
  { value: '720', label: '720 - Denver, CO' },
  { value: '754', label: '754 - Fort Lauderdale, FL' },
  { value: '786', label: '786 - Miami, FL' },
  { value: '818', label: '818 - Los Angeles, CA' },
  { value: '917', label: '917 - New York, NY' },
]

export function BuyNumberDialog({ open, onClose, onSelectNumber }: BuyNumberDialogProps) {
  const [country, setCountry] = useState('United States')
  const [numberType, setNumberType] = useState('Local')
  const [pattern, setPattern] = useState('any')
  const [searching, setSearching] = useState(false)
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([])
  const [error, setError] = useState('')

  const handleSearch = async () => {
    setSearching(true)
    setError('')
    setAvailableNumbers([])

    try {
      const response = await fetch('/api/numbers/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          countryCode: country === 'United States' ? 'US' : country,
          numberType: numberType.toLowerCase(),
          areaCode: pattern === 'any' ? undefined : pattern,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search numbers')
      }

      setAvailableNumbers(data.numbers)

      if (data.numbers.length === 0) {
        setError('No phone numbers found matching your criteria. Try a different pattern.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching for numbers')
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleSelectNumber = (phoneNumber: string) => {
    onSelectNumber(phoneNumber)
    onClose()
  }

  const formatPhoneNumber = (phoneNumber: string) => {
    // Format +1XXXXXXXXXX to +1 (XXX) XXX-XXXX
    if (phoneNumber.startsWith('+1')) {
      const digits = phoneNumber.slice(2)
      if (digits.length === 10) {
        return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
      }
    }
    return phoneNumber
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Buy phone number</DialogTitle>
          <DialogDescription>
            Select your country and optionally add a pattern
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="United States">🇺🇸 United States</SelectItem>
                  <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                  <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="numberType">Number Type</Label>
              <Select value={numberType} onValueChange={setNumberType}>
                <SelectTrigger id="numberType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Local">Local</SelectItem>
                  <SelectItem value="TollFree">Toll-Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="areaCode">Area Code (optional)</Label>
            <div className="flex gap-2">
              <Select value={pattern} onValueChange={setPattern}>
                <SelectTrigger id="areaCode" className="flex-1">
                  <SelectValue placeholder="Select area code" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {US_AREA_CODES.map((code) => (
                    <SelectItem key={code.value} value={code.value}>
                      {code.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                disabled={searching}
                className="bg-red-800 hover:bg-red-900 text-white min-w-[140px]"
              >
                {searching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Select an area code to find phone numbers in specific regions. Leave blank to search all available numbers.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto mt-4 border-t pt-4">
          {availableNumbers.length > 0 ? (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                Available Numbers ({availableNumbers.length})
              </h3>
              <div className="space-y-2">
                {availableNumbers.map((number) => (
                  <div
                    key={number.phoneNumber}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatPhoneNumber(number.phoneNumber)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {number.locality && number.region
                          ? `${number.locality}, ${number.region}`
                          : number.region || 'Location not specified'}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {number.capabilities.voice && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Voice</span>
                        )}
                        {number.capabilities.sms && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">SMS</span>
                        )}
                        {number.capabilities.mms && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">MMS</span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSelectNumber(number.phoneNumber)}
                      className="bg-red-800 hover:bg-red-900 text-white"
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !searching && !error && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Search for available phone numbers</p>
                <p className="text-sm">Select a country and click Search to get started</p>
              </div>
            )
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
