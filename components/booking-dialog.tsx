'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Calendar } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDialog({ open, onOpenChange }: BookingDialogProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    companyUrl: '',
    bookingReason: '',
    duration: '',
    additionalInfo: ''
  });

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    onOpenChange(false);
    // Reset form
    setFormData({
      companyName: '',
      companyUrl: '',
      bookingReason: '',
      duration: '',
      additionalInfo: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-red-50 via-white to-red-50 border-2 border-[#8B0000]">
        {/* Background Calendar Icon */}
        <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
          <Calendar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 text-[#8B0000]" />
        </div>

        <DialogHeader className="relative z-10">
          <DialogTitle className="text-3xl font-bold text-[#8B0000]">Book A Call With AiRA Team</DialogTitle>
          <DialogDescription className="text-gray-600 text-base">
            Schedule a personalized demo with our team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="company-name" className="text-[#8B0000] font-semibold">
              Please share the company name
            </Label>
            <Input
              id="company-name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="border-[#8B0000]/30 focus:border-[#8B0000] focus:ring-[#8B0000] bg-white text-gray-900"
              placeholder="Enter your company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-url" className="text-[#8B0000] font-semibold">
              Please share the company url
            </Label>
            <Input
              id="company-url"
              type="url"
              value={formData.companyUrl}
              onChange={(e) => setFormData({ ...formData, companyUrl: e.target.value })}
              className="border-[#8B0000]/30 focus:border-[#8B0000] focus:ring-[#8B0000] bg-white text-gray-900"
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking-reason" className="text-[#8B0000] font-semibold">
              Please select why you are booking this call
            </Label>
            <Select value={formData.bookingReason} onValueChange={(value) => setFormData({ ...formData, bookingReason: value })}>
              <SelectTrigger className="border-[#8B0000]/30 focus:border-[#8B0000] focus:ring-[#8B0000] bg-white text-gray-900">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">Product Demo</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="support">Technical Support</SelectItem>
                <SelectItem value="pricing">Pricing Discussion</SelectItem>
                <SelectItem value="integration">Integration Assistance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-[#8B0000] font-semibold">
              Please share how many minutes you will be consuming with AiRA
            </Label>
            <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
              <SelectTrigger className="border-[#8B0000]/30 focus:border-[#8B0000] focus:ring-[#8B0000] bg-white text-gray-900">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-info" className="text-[#8B0000] font-semibold">
              Anything you want the AiRA team to know before the call (please be descriptive)
            </Label>
            <Textarea
              id="additional-info"
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              className="border-[#8B0000]/30 focus:border-[#8B0000] focus:ring-[#8B0000] min-h-[120px] bg-white text-gray-900"
              placeholder="Please provide any additional details..."
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSubmit}
              className="bg-[#8B0000] hover:bg-[#A52A2A] text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              disabled={!formData.companyName || !formData.companyUrl || !formData.bookingReason || !formData.duration}
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
