"use client"

import Link from "next/link"
import { useNavigation } from "@/hooks/use-navigation"
import { useAuth } from "@/components/providers/supabase-provider"

interface NavLinksProps {
  scrolled?: boolean;
}

const publicNavItems = [
  { href: "/#hero", label: "Home" },
  { href: "/#footer", label: "About" },
  { href: "/#industries", label: "Services" },
  { href: "/#faqs", label: "FAQs" },
  { href: "/#footer", label: "Contact" },
]

export function NavLinks({ scrolled = false }: NavLinksProps) {
  const { isActive } = useNavigation()
  const { user } = useAuth()

  // Combine public nav items with conditional dashboard link
  const navItems = [
    ...publicNavItems,
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : [])
  ]

  return (
    <nav className="hidden md:flex items-center space-x-8">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-base font-medium transition-colors duration-200 ease-in-out
            ${scrolled 
              ? 'text-gray-800 hover:text-[#8B0000]' 
              : 'text-white hover:text-[#8B0000]'}
            ${item.href.startsWith('/#') 
              ? ''
              : isActive(item.href)
                ? 'text-[#8B0000] font-semibold'
                : ''}
            hover:scale-105 transition-transform`}
          onClick={(e) => {
            if (item.href.startsWith('/#')) {
              e.preventDefault();
              const element = document.getElementById(item.href.substring(2));
              element?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}