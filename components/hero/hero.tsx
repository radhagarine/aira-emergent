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
      className="relative w-full min-h-screen flex items-center overflow-hidden py-20 md:py-0"
    >
      <HeroMedia onVideoLoad={handleVideoLoad} />

      <div
        className={`relative container mx-auto px-4 sm:px-6 lg:px-8 z-10 transform transition-all duration-1000 ease-in-out
          ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
      >
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            <div className="space-y-4 md:space-y-6">
              {/* Greeting */}
              <div className="space-y-1 md:space-y-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-white/90">
                  Meet
                </h2>
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-[#8B0000]
                  [text-shadow:0_0_7px_#8B0000,0_0_10px_#8B0000,0_0_21px_#8B0000,0_0_42px_#5C0000,0_0_82px_#5C0000]
                  animate-[neon_1.5s_ease-in-out_infinite_alternate] tracking-tight leading-none">
                  AiRA
                </h1>
              </div>

              {/* Description */}
              <div className="space-y-2 md:space-y-3 pt-2 md:pt-4">
                <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-relaxed">
                  Your AI-Powered Reception Assistant
                </p>
                <p className="text-base sm:text-lg md:text-xl text-white/80 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Transform your business with 24/7 voice-enabled customer service that never sleeps.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 md:pt-6 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="relative bg-[#8B0000] hover:bg-[#8B0000]/90 text-white px-8 sm:px-10 py-5 sm:py-7 text-base sm:text-lg font-bold
                            transition-all duration-300 hover:scale-105 active:scale-98 group
                            shadow-2xl hover:shadow-[#8B0000]/50 w-full sm:w-auto"
                  onClick={(e) => {
                    e.stopPropagation()
                    signIn()
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    Get Started
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </Button>
                <Button
                  size="lg"
                  className="relative bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-8 sm:px-10 py-5 sm:py-7 text-base sm:text-lg font-bold
                            transition-all duration-300 hover:scale-105 active:scale-98
                            border-2 border-white/30 hover:border-white/50 shadow-xl w-full sm:w-auto"
                  onClick={(e) => {
                    e.stopPropagation()
                    document.getElementById('faqs')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    📞 Try Live Demo
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}