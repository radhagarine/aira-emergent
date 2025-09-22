"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause } from 'lucide-react'

interface AudioPlayerProps {
  audioSrc: string | null
  activeIndustry: string | null
}

export function AudioPlayer({ audioSrc, activeIndustry }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (audioSrc) {
      audio.src = audioSrc
      audio.load()
      setError(null)
    } else {
      audio.pause()
      audio.currentTime = 0
      setIsPlaying(false)
      setError(null)
    }
  }, [audioSrc])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch((error) => {
        console.error("Audio playback failed:", error)
        setError("Audio playback failed. Please try again.")
      })
    }
  }

  if (!audioSrc) return null

  return (
    <div className="flex items-center justify-center mt-8">
      <audio
        ref={audioRef}
        preload="auto"
      />
      <Button onClick={togglePlayPause} variant="outline" size="sm" className="p-2">
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      {error && (
        <div className="text-red-500 ml-4">
          {error}
        </div>
      )}
      {activeIndustry && (
        <div className="ml-4 text-sm text-gray-600">
          Now playing: {activeIndustry}
        </div>
      )}
    </div>
  )
}

