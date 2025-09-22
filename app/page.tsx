"use client"

import { Navbar } from "@/components/nav/navbar"
import { Hero } from "@/components/hero/hero"
import InteractiveHub from "@/components/industries/industry-hub"
import FAQS from "@/components/faqs/faqs"
import { Features } from "@/components/features/features"
import { Footer } from "@/components/footer/footer"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div>
        <Navbar />
        <Hero />
        <InteractiveHub />
        <Features />
        <FAQS />
        <Footer />
      </div>
    </main>
  )
}