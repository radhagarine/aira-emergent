'use client'

import React, { useState, useEffect } from 'react'
import { Utensils, Plane, Scissors, Stethoscope, Home, Car } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { motion, AnimatePresence } from 'framer-motion'

const businesses = [
  {
    icon: Utensils,
    name: 'Restaurants',
    position: { top: '8%', left: '50%', transform: 'translateX(-50%)' },
    chatPosition: { top: '50%', right: '110%', transform: 'translateY(-50%)' },
    messages: [
      { role: 'ai', content: "Welcome to Tasty Dining! How can I assist you today?" },
      { role: 'user', content: "I'd like to make a reservation for dinner." },
      { role: 'ai', content: "I'll be happy to help with that. What time would you prefer?" },
      { role: 'user', content: "Around 7 PM this Friday." },
      { role: 'ai', content: "For how many people?" },
    ]
  },
  {
    icon: Scissors,
    name: 'Salons',
    position: { top: '50%', right: '8%', transform: 'translateY(-50%)' },
    chatPosition: { top: '110%', left: '50%', transform: 'translateX(-50%)' },
    messages: [
      { role: 'ai', content: "Looking fabulous is just a booking away. What service are you interested in?" },
      { role: 'user', content: "I'd like to book a hair styling appointment." }
    ]
  },
  {
    icon: Plane,
    name: 'Travel',
    position: { bottom: '8%', left: '50%', transform: 'translateX(-50%)' },
    chatPosition: { top: '50%', left: '110%', transform: 'translateY(-50%)' },
    messages: [
      { role: 'ai', content: "Ready for your next adventure! Let's plan your perfect getaway!" },
      { role: 'user', content: "I'm looking for a beach vacation package." }
    ]
  },
  {
    icon: Stethoscope,
    name: 'Healthcare',
    position: { top: '50%', left: '8%', transform: 'translateY(-50%)' },
    chatPosition: { bottom: '110%', right: '50%', transform: 'translateX(50%)' },
    messages: [
      { role: 'ai', content: "Your health is our priority. How can I assist you with your medical needs?" },
      { role: 'user', content: "I need to schedule a check-up appointment." }
    ]
  },
  {
    icon: Home,
    name: 'Real Estate',
    position: { top: '20%', right: '20%' },
    chatPosition: { top: '50%', left: '110%', transform: 'translateY(-50%)' },
    messages: [
      { role: 'ai', content: "Looking for your dream home? Let's start your property search today!" },
      { role: 'user', content: "I'm interested in viewing 3-bedroom houses." }
    ]
  },
  {
    icon: Car,
    name: 'Automotive',
    position: { bottom: '20%', left: '20%' },
    chatPosition: { top: '110%', right: '110%', transform: 'translateX(50%)' },
    messages: [
      { role: 'ai', content: "Car troubles or looking for a new ride? I'm here to help with all things automotive!" },
      { role: 'user', content: "I need to schedule a maintenance service." }
    ]
  },
]

const getUserAvatar = (businessName: string) => {
  switch(businessName) {
    case 'Restaurants':
      return "/images/restaurant.png"
    case 'Salons':
      return "/images/Saloons.png"
    case 'Healthcare':
      return "/images/healthcar.png"
    case 'Real Estate':
      return "/images/realestate.png" 
    case 'Travel':
      return "Travel.png"
    case 'Automotive':
      return "automotive.png"
    default:
      return "/placeholder.svg?height=32&width=32"
  }
}

export default function AIVoiceAssistant() {
  const [hoveredBusiness, setHoveredBusiness] = useState<string | null>(null)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    if (hoveredBusiness) {
      setCurrentMessageIndex(0)
      const interval = setInterval(() => {
        setCurrentMessageIndex(prevIndex => {
          const business = businesses.find(b => b.name === hoveredBusiness);
          if (business?.messages && Array.isArray(business.messages) && prevIndex < business.messages.length - 1) {
            return prevIndex + 1
          }
          clearInterval(interval)
          return prevIndex
        })
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [hoveredBusiness])

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {/* Central Video */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-80 h-80">
        <video
          className="w-full h-full object-cover"
          loop
          muted
          autoPlay
        >
          <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pink.-X5DHbi9A8UWE0NiV6tcdcjrK3RzoyG.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Business Buttons */}
      {businesses.map(({ icon: Icon, name, position, chatPosition, messages }) => (
        <div key={name} className="absolute" style={position}>
          <div className="relative">
            {hoveredBusiness === name && (
              <div 
                className="absolute w-56"
                style={chatPosition}
              >
                <div className="bg-[#8B0000] rounded-[32px] p-3 flex flex-col gap-2 shadow-lg relative border-2 border-white overflow-hidden"
                     style={{
                       boxShadow: '2px 2px 0 rgba(0,0,0,0.1), -1px -1px 0 rgba(255,255,255,0.25)',
                       height: '150px',
                     }}>
                  <div className="flex-grow overflow-hidden flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                      {messages && messages[currentMessageIndex] && (
                        <motion.div
                          key={currentMessageIndex}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                          className="flex items-center gap-2 mb-2 text-center"
                        >
                          <Avatar className="w-[50px] h-[50px] border border-white/20 shrink-0">
                            {messages[currentMessageIndex].role === 'ai' ? (
                              <AvatarImage 
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20241220-WA0008.jpg-bC0ULHq2hsTEbCHyWaa6qrgKXBsQ20.jpeg"
                                alt="AIRA"
                              />
                            ) : (
                              <AvatarImage 
                                src={getUserAvatar(name)}
                                alt="User"
                              />
                            )}
                            <AvatarFallback>{messages[currentMessageIndex].role === 'ai' ? 'AI' : 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex justify-center">
                            <span className="text-white text-sm">{messages[currentMessageIndex].content}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
            <button
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-white rounded-full shadow-lg transition-all duration-200 group hover:bg-gradient-to-b hover:from-[#8B0000] hover:to-[#5C0000] hover:shadow-[#8B0000]/50 hover:shadow-xl border-2 border-[#8B0000]"
              style={{
                minWidth: '140px',
              }}
              onMouseEnter={() => setHoveredBusiness(name)}
              onMouseLeave={() => setHoveredBusiness(null)}
            >
              <div className="flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#FFE5E5] group-hover:bg-[#8B0000] transition-colors duration-200">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF4D4D] group-hover:text-white" />
              </div>
              <span className="flex-1 text-center font-medium text-gray-700 group-hover:text-white text-xs sm:text-base">{name}</span>
              <div className="w-7 sm:w-10" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

