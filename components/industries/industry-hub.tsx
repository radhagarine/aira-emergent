'use client'

import { useState, useRef } from 'react'
import { Utensils, Home, Stethoscope, Scissors, ShoppingBag, Briefcase, GraduationCap, Car, Plane } from 'lucide-react'
import AIVoiceAssistant from './aivoiceassistant'

type RecordingItem = {
  name: string
  icon: React.ElementType
  color: string
  recording: string | null
}

const items: RecordingItem[] = [
  { name: 'Restaurants', icon: Utensils, color: 'from-orange-400 to-orange-300', recording: null },
  { name: 'Real Estate', icon: Home, color: 'from-blue-400 to-blue-300', recording: null },
  { name: 'Healthcare', icon: Stethoscope, color: 'from-green-400 to-green-300', recording: null },
  { name: 'Beauty', icon: Scissors, color: 'from-purple-400 to-purple-300', recording: null },
  { name: 'Retail', icon: ShoppingBag, color: 'from-pink-400 to-pink-300', recording: null },
  { name: 'Finance', icon: Briefcase, color: 'from-indigo-400 to-indigo-300', recording: null },
  { name: 'Education', icon: GraduationCap, color: 'from-yellow-400 to-yellow-300', recording: null },
  { name: 'Automotive', icon: Car, color: 'from-red-400 to-red-300', recording: null },
  { name: 'Travel', icon: Plane, color: 'from-teal-400 to-teal-300', recording: null },
]

const renderText = (text: string) => {
  if (text.includes('24/7')) {
    const parts = text.split('24/7')
    return parts.map((part, i) =>
      i === 0 ? part : <><span key={i} className="text-[#8B0000] font-semibold">24/7</span>{part}</>
    )
  }
  if (text.includes('Aira')) {
    const parts = text.split('Aira')
    return parts.map((part, i) =>
      i === parts.length - 1 ? part : <>{part}<span className="text-[#8B0000] font-semibold">Aira</span></>
    )
  }
  return text
}

export default function IndustriesSection() {
  return (
    <section id="industries" className="py-6 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center justify-center min-h-screen w-full bg-white p-4">
        {/* Banner Image */}
        <div className="col-span-1 flex justify-start items-stretch h-full">
          <img 
            src="/images/industries1.png"
            alt="Transform Automate Scale Your Business"
            className="w-full h-full object-contain object-left"
          />
        </div>

        {/* Interactive Component */}
        <div className="col-span-1 md:col-span-3 relative h-[600px] md:h-full flex items-center justify-center">
          <AIVoiceAssistant />
        </div>
      </div>
    </section>
  )
}