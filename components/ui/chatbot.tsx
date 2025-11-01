'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  User,
  Bot,
  HelpCircle,
  Phone,
  Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface ChatbotProps {
  className?: string
}

const initialMessages: Message[] = [
  {
    id: '1',
    type: 'bot',
    content: 'Hello! I\'m AiRA, your AI reception assistant. How can I help you today?',
    timestamp: new Date()
  }
]

const quickReplies = [
  'How does AiRA work?',
  'Pricing information',
  'Technical support',
  'Schedule a demo'
]

export function Chatbot({ className }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Lazy initialize audio context only when needed (memory optimization)
  const getAudioContext = () => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  // Play notification sound
  const playNotificationSound = () => {
    const ctx = getAudioContext()
    if (!ctx) return
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Create a pleasant notification sound (two tones)
    oscillator.frequency.value = 800
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)

    // Second tone
    setTimeout(() => {
      const oscillator2 = ctx.createOscillator()
      const gainNode2 = ctx.createGain()

      oscillator2.connect(gainNode2)
      gainNode2.connect(ctx.destination)

      oscillator2.frequency.value = 1000
      gainNode2.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

      oscillator2.start(ctx.currentTime)
      oscillator2.stop(ctx.currentTime + 0.15)
    }, 100)
  }
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: getBotResponse(content),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()

    if (message.includes('how') && message.includes('work')) {
      return 'AiRA is an AI-powered reception assistant that handles calls, schedules appointments, and provides customer support 24/7. Would you like to know more about specific features?'
    } else if (message.includes('price') || message.includes('cost')) {
      return 'Our pricing starts at $99/month for basic features. We offer custom plans for enterprises. Would you like me to connect you with our sales team for detailed pricing?'
    } else if (message.includes('demo')) {
      return 'I\'d be happy to arrange a demo for you! Please provide your email address or phone number, and our team will contact you within 24 hours.'
    } else if (message.includes('support') || message.includes('help')) {
      return 'For technical support, you can:\n• Email us at support@aira.aivn.ai\n• Call us at +1 (555) 123-4567\n• Or continue chatting here - I\'ll do my best to help!'
    } else if (message.includes('hello') || message.includes('hi')) {
      return 'Hello! Great to meet you! I\'m here to help you learn about AiRA and answer any questions you might have.'
    } else {
      return 'Thank you for your message! I\'m still learning, but I\'d love to help you. For detailed assistance, please contact our support team at support@aira.aivn.ai or use one of the quick options below.'
    }
  }

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply)
  }

  const handleOpenChat = () => {
    setIsOpen(true)
    // Play notification sound
    playNotificationSound()
  }

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50", className)}>
        <Button
          onClick={handleOpenChat}
          size="lg"
          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full p-0 overflow-hidden border-4 border-[#8B0000] shadow-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white"
        >
          <img
            src="/images/ai-assistant.png"
            alt="AiRA Assistant"
            className="h-full w-full object-cover"
          />
        </Button>
        <div className="hidden sm:block absolute -top-12 right-0 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap z-50 shadow-lg">
          Need help? Chat with AiRA
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50", className)}>
      <Card className={cn(
        "w-[calc(100vw-2rem)] sm:w-96 shadow-2xl border-2 border-[#8B0000]/20 transition-all duration-300",
        isMinimized ? "h-16" : "h-[calc(100vh-2rem)] sm:h-[600px]"
      )}>
        {/* Header */}
        <CardHeader className={cn(
          "bg-gradient-to-r from-[#8B0000] to-red-700 text-white",
          isMinimized ? "pb-3 rounded-lg" : "pb-2 rounded-t-lg"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 bg-white">
                  <img
                    src="/images/ai-assistant.png"
                    alt="AiRA Assistant"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">AiRA Assistant</CardTitle>
                {!isMinimized && (
                  <p className="text-xs text-white/80">Online • Typically replies in a few minutes</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Chat Content */}
        {!isMinimized && (
          <>
            <CardContent className="p-0 flex flex-col" style={{ height: 'calc(100% - 80px)' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-3",
                      message.type === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden",
                      message.type === 'user'
                        ? "bg-gray-200 dark:bg-gray-700"
                        : "bg-white border-2 border-[#8B0000]/20"
                    )}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      ) : (
                        <img
                          src="/images/ai-assistant.png"
                          alt="AiRA"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-lg",
                      message.type === 'user'
                        ? "bg-[#8B0000] text-white ml-auto"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    )}>
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      <span className={cn(
                        "text-xs mt-1 block",
                        message.type === 'user'
                          ? "text-white/70"
                          : "text-gray-500 dark:text-gray-400"
                      )}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white border-2 border-[#8B0000]/20 flex items-center justify-center">
                      <img
                        src="/images/ai-assistant.png"
                        alt="AiRA"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  {quickReplies.map((reply, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickReply(reply)}
                      className="text-xs h-8 text-left justify-start hover:bg-[#8B0000]/10 hover:border-[#8B0000]/30"
                    >
                      {reply}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage(newMessage)
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border-gray-300 dark:border-gray-600 focus:border-[#8B0000] focus:ring-[#8B0000]"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newMessage.trim()}
                    className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}