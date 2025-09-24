'use client'

import Link from 'next/link'
import Image from 'next/image'

interface VideoLogoProps {
  width?: number
  height?: number
  className?: string
  href?: string
}

export function VideoLogo({
  width = 150,
  height = 50,
  className = "",
  href = "/"
}: VideoLogoProps) {
  const logoElement = (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      {/* Original logo for dark theme */}
      <Image
        src="/images/aira-logo-new.png"
        alt="AiRA Logo"
        width={width}
        height={height}
        className="object-contain dark:block hidden"
        priority
      />
      {/* White logo for light theme using CSS filter */}
      <Image
        src="/images/aira-logo-new.png"
        alt="AiRA Logo"
        width={width}
        height={height}
        className="object-contain dark:hidden block"
        style={{
          filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)'
        }}
        priority
      />
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {logoElement}
      </Link>
    )
  }

  return logoElement
}

// Variant for navbar (larger, more prominent for navigation)
export function NavbarVideoLogo() {
  return (
    <VideoLogo
      width={140}
      height={45}
      className="transition-transform duration-200 hover:scale-105"
      href="/"
    />
  )
}

// Variant for dashboard sidebar (larger, more prominent with theme-aware logo)
export function SidebarVideoLogo() {
  const logoElement = (
    <div
      className="flex items-center justify-center transition-opacity duration-200"
      style={{ width: 130, height: 42 }}
    >
      {/* Original logo for dark theme sidebar */}
      <Image
        src="/images/aira-logo-new.png"
        alt="AiRA Logo"
        width={130}
        height={42}
        className="object-contain dark:block hidden"
        priority
      />
      {/* White logo for light theme sidebar */}
      <Image
        src="/images/aira-logo-new.png"
        alt="AiRA Logo"
        width={130}
        height={42}
        className="object-contain dark:hidden block"
        style={{
          filter: 'brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)'
        }}
        priority
      />
    </div>
  )

  return (
    <Link href="/" className="block">
      {logoElement}
    </Link>
  )
}

// Variant for auth pages (extra large, very prominent)
export function AuthVideoLogo() {
  return (
    <VideoLogo
      width={180}
      height={60}
      className="mx-auto"
      href="/"
    />
  )
}

// Variant for footer (medium, more visible)
export function FooterVideoLogo() {
  return (
    <VideoLogo
      width={100}
      height={32}
      className="transition-opacity duration-200 hover:opacity-80"
      href="/"
    />
  )
}