'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

export function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-full transition-all duration-200 relative group"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <Sun
          className={`absolute inset-0 h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-red-800 dark:group-hover:text-red-400 transition-all duration-300 ${
            isDarkMode
              ? 'rotate-90 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100'
          }`}
        />

        {/* Moon Icon */}
        <Moon
          className={`absolute inset-0 h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-red-800 dark:group-hover:text-red-400 transition-all duration-300 ${
            isDarkMode
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </button>
  )
}