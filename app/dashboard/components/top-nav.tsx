'use client'

import { FC, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, Settings, LogOut, ChevronRight, Home, Menu, Wallet } from 'lucide-react'
import { User2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TopNavProps {
  onMenuClick: () => void;
}

export const TopNav: FC<TopNavProps> = ({ onMenuClick }) => {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [imageError, setImageError] = useState(false)

  // Get user name from user metadata or email
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'

  // Get avatar URL from user metadata
  const userAvatar = user?.user_metadata?.picture || user?.user_metadata?.avatar_url

  // Get breadcrumb items from pathname
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    return [
      { name: 'Home', href: '/' },
      { name: 'Dashboard', href: '/dashboard' },
      ...(segments.length > 1
        ? [{
            name: segments[segments.length - 1].charAt(0).toUpperCase() + segments[segments.length - 1].slice(1),
            href: pathname
          }]
        : []
      )
    ]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="bg-gradient-to-r from-white to-red-50 dark:from-gray-800 dark:to-gray-700 shadow-md border-b border-border transition-colors duration-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {/* Mobile Menu Button - Only visible on small screens */}
            <button
              onClick={onMenuClick}
              className="sm:hidden p-2 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-lg transition-colors focus:outline-none"
            >
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Breadcrumb Navigation - Hidden on small screens */}
            <nav className="hidden sm:flex items-center space-x-2">
              {breadcrumbs.map((item, index) => (
                <div key={item.href} className="flex items-center">
                  {index === 0 ? (
                    <Link
                      href={item.href}
                      className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-800 dark:hover:text-red-400 transition-colors"
                    >
                      <Home className="h-4 w-4 mr-1" />
                      <span className="hidden lg:inline">{item.name}</span>
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center ${
                        index === breadcrumbs.length - 1
                          ? 'text-red-800 dark:text-red-400 font-semibold'
                          : 'text-gray-600 dark:text-gray-300 hover:text-red-800 dark:hover:text-red-400'
                      } transition-colors`}
                    >
                      <ChevronRight className="h-4 w-4 mx-1 lg:mx-2 text-gray-400 dark:text-gray-500" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile: Show current page title */}
            <div className="sm:hidden">
              <h1 className="text-lg font-semibold text-red-800 dark:text-red-400 truncate">
                {breadcrumbs[breadcrumbs.length - 1]?.name || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notification Button */}
            <button className="p-2 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-full transition-colors relative group">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300 group-hover:text-red-800 dark:group-hover:text-red-400" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Wallet Button */}
            <Link href="/dashboard/funds" className="p-2 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-full transition-colors group">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300 group-hover:text-red-800 dark:group-hover:text-red-400" />
            </Link>

            {/* Settings Button */}
            <Link href="/dashboard/settings" className="p-2 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-full transition-colors group">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300 group-hover:text-red-800 dark:group-hover:text-red-400" />
            </Link>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 p-2 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-full transition-all transform hover:scale-105">
                <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gradient-to-br from-red-100 to-red-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center border-2 border-red-800/20 dark:border-gray-500/20 shadow-lg">
                  {userAvatar && !imageError ? (
                    <Image
                      src={userAvatar}
                      alt={userName || 'User avatar'}
                      width={32}
                      height={32}
                      className="object-cover"
                      onError={() => setImageError(true)}
                      priority
                    />
                  ) : (
                    <User2 className="h-5 w-5 text-red-800 dark:text-gray-300" />
                  )}
                </div>
                <span className="hidden lg:block font-medium text-gray-700 dark:text-gray-200 max-w-24 truncate">
                  {userName}
                </span>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
                <DropdownMenuLabel className="text-red-800 dark:text-red-400">
                  {user?.email || 'My Account'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer hover:bg-red-50 dark:hover:bg-gray-700">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer hover:bg-red-50 dark:hover:bg-gray-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopNav;