'use client'

import { FC } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart,
  Calendar,
  Settings,
  User,
  Building2,
  Phone,
  Menu
} from 'lucide-react'
import { SidebarVideoLogo } from '@/components/ui/video-logo'

const navItems = [
  { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Details', href: '/dashboard/details', icon: Building2 },
  { name: 'Numbers', href: '/dashboard/numbers', icon: Phone },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export const Sidebar: FC<SidebarProps> = ({ isOpen, onToggle, isMobile = false }) => {
  const pathname = usePathname()

  return (
    <div
      className={`fixed top-0 left-0 h-screen transition-all duration-300 z-50 ${
        isMobile
          ? isOpen
            ? 'w-80 translate-x-0' // Mobile: full width when open
            : 'w-80 -translate-x-full' // Mobile: hidden when closed
          : isOpen
          ? 'w-64' // Desktop: normal width when open
          : 'w-16' // Desktop: collapsed when closed
      }`}
    >
      {/* Gradient background - responsive to dark mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-800 via-red-900 to-red-950 dark:from-gray-800 dark:via-gray-900 dark:to-black"></div>

      {/* Content wrapper */}
      <div className="relative h-full flex flex-col">
        {/* Header section */}
        <div className="h-16 flex items-center px-4">
          {/* Menu toggle button */}
          <button
            onClick={onToggle}
            className="bg-white dark:bg-gray-700 p-2 rounded-lg transition-colors focus:outline-none hover:bg-white/80 dark:hover:bg-gray-600"
          >
            <Menu className="h-5 w-5 text-red-800 dark:text-gray-200" />
          </button>

          {/* Logo section */}
          {(isOpen || isMobile) && (
            <div className="flex-grow flex justify-start items-center pl-4">
              <SidebarVideoLogo />
            </div>
          )}
        </div>

        {/* Navigation section */}
        <nav className="flex-1 px-3 py-8 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if (isMobile) onToggle();
              }}
              className={`flex items-center gap-3 px-2 py-3 text-white dark:text-gray-200 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-gray-700/30 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-white dark:hover:border-gray-400 mb-2 cursor-pointer ${
                pathname === item.href ? 'text-white bg-white/20 dark:bg-gray-700/40 shadow-lg backdrop-blur-sm' : ''
              }`}
              title={!isOpen && !isMobile ? item.name : undefined}
            >
              <item.icon
                className={`h-5 w-5 flex-shrink-0 ${!isOpen && !isMobile ? 'mx-auto' : ''}`}
              />
              {(isOpen || isMobile) && (
                <span className="whitespace-nowrap">
                  {item.name}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}