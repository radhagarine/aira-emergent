// hero-media.tsx
import { useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from 'lucide-react'

interface HeroMediaProps {
  onVideoLoad?: (video: HTMLVideoElement) => void;
}

export function HeroMedia({ onVideoLoad }: HeroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  //const [hasEnded, setHasEnded] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleCanPlay = () => {
      setIsVideoLoaded(true)
      video.muted = true
      video.play().catch(() => {
        setIsVideoLoaded(false)
      })
      
      if (onVideoLoad) {
        onVideoLoad(video)
      }
    }


    video.addEventListener('canplay', handleCanPlay)
    //video.addEventListener('ended', handleEnded)
    
    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      //video.removeEventListener('ended', handleEnded)
    }
  }, [onVideoLoad])

  const toggleMute = () => {
    if (videoRef.current) {
      const video = videoRef.current
      video.muted = !video.muted
      setIsMuted(video.muted)
    }
  }

  return (
    <div className="absolute inset-0 z-0 w-full h-full">
      {/* Fallback Image - Only show if video hasn't loaded yet */}
      {!isVideoLoaded && (
        <div 
          className="absolute inset-0 bg-[url('/office-bg.jpg')] bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3))`
          }}
          aria-hidden={true}
        />
      )}

      {/* Video Background */}
      <video
        ref={videoRef}
        className={`object-cover w-full h-full transition-opacity duration-1000
                    ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
        playsInline
        muted={isMuted}
        preload="auto"
        poster="/images/office-bg.jpg"
        aria-hidden="true"
        loop
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      >
        <source src="/audio/vedio1.mp4" type="video/mp4" />
      </video>

      {/* Audio Control Button - Positioned next to chatbot */}
      {isVideoLoaded && (
        <button
          onClick={toggleMute}
          className="fixed bottom-4 right-20 sm:bottom-6 sm:right-24 z-40 p-3 rounded-full
                     bg-[#8B0000] backdrop-blur-sm hover:bg-[#8B0000]/90
                     transition-all duration-200 shadow-lg hover:scale-110 border-2 border-white/30"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" />
          ) : (
            <Volume2 className="w-6 h-6 text-white animate-pulse" />
          )}
        </button>
      )}

      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"
        aria-hidden="true"
      />
    </div>
  )
}