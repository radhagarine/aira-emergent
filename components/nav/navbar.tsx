// Navbar.tsx
"use client"

import { useState, useEffect } from "react"
import { BrandLogo } from "./brand-logo"
import { NavLinks } from "./nav-links"
import { AuthButtons } from "./auth-buttons"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20
      setScrolled(isScrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300
        ${scrolled 
          ? 'bg-white/95 shadow-md backdrop-blur-sm' 
          : 'bg-transparent'}`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex h-16 items-center justify-between">
          <BrandLogo />
          <NavLinks scrolled={scrolled} />
          <AuthButtons />
        </nav>
      </div>
    </header>
  )
}