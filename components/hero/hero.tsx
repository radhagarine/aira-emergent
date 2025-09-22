"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { HeroMedia } from "./hero-media"
import { useAuth } from '@/components/providers/supabase-provider'

export function Hero() {
  const [showContent, setShowContent] = useState(false)
  const { signIn } = useAuth()

  const handleVideoLoad = useCallback((video: HTMLVideoElement) => {
    if (!video) return

    // Use a data attribute instead of a custom property
    video.setAttribute('data-played-once', 'false')

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const hasPlayedOnce = video.getAttribute('data-played-once') === 'true'

      // Show content at 11 seconds (1 second before end)
      if (currentTime >= 4 && !hasPlayedOnce) {
        setShowContent(true)
        video.setAttribute('data-played-once', 'true')
      } 
    }

    // Add the event listener
    video.addEventListener('timeupdate', handleTimeUpdate)

    // Handle video end to keep content visible
    const handleEnded = () => {
      setShowContent(true)
    }
    video.addEventListener('ended', handleEnded)

    // Return cleanup function
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <section
      id="hero"
      className="relative w-full h-screen flex items-center overflow-hidden"
    >
      <HeroMedia onVideoLoad={handleVideoLoad} />

      <div
        className={`relative container mx-auto px-4 z-10 transform transition-all duration-1000 ease-in-out
          ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-8">
            <h1 className="flex items-baseline gap-3">
              <span className="text-3xl md:text-4xl font-light">
                Hi, I am
              </span>
              <span className="relative text-4xl md:text-5xl font-bold text-[#8B0000]
  [text-shadow:0_0_7px_#8B0000,0_0_10px_#8B0000,0_0_21px_#8B0000,0_0_42px_#5C0000,0_0_82px_#5C0000] 
  animate-[neon_1.5s_ease-in-out_infinite_alternate]">
                AiRA
              </span>
            </h1>
            <div className="space-y-2">
              <p className="text-lg md:text-xl">
                Your voice enabled AI Reception assistant
              </p>
              <p className="text-lg md:text-xl">
                that can transform your business.
              </p>
            </div>
            <Button
              className="relative bg-[#8B0000] hover:bg-[#8B0000]/90 text-white px-8 py-6 text-lg
                        transition-all duration-300 hover:scale-105 active:scale-98
                        before:content-[''] before:absolute before:inset-0 before:border-2 
                        before:border-[#8B0000] before:rounded-lg before:opacity-100 
                        before:animate-sparkle after:content-[''] after:absolute after:inset-0 
                        after:border-2 after:border-white after:rounded-lg after:opacity-100 
                        after:animate-sparkle"
              onClick={(e) => {
                e.stopPropagation()
                signIn()
              }}
            >
              Get Started →
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}