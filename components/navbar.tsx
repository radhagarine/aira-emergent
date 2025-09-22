"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-50 border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold">
                A<span className="text-[#8B0000]">i</span>R<span className="text-[#8B0000]">A</span>
              </span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-sm font-medium hover:text-[#8B0000] transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-[#8B0000] transition-colors">
              About
            </Link>
            <Link href="/services" className="text-sm font-medium hover:text-[#8B0000] transition-colors">
              Services
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-[#8B0000] transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hidden md:inline-flex">
              Log in
            </Button>
            <Button 
              className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white transition-all duration-300 
                        hover:scale-105 active:scale-98"
            >
              Sign up
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

