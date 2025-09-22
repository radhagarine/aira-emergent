'use client'

import { useState, useEffect } from 'react'

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check localStorage and current document class on mount
    const savedTheme = localStorage.getItem('darkMode')
    const currentlyDark = document.documentElement.classList.contains('dark')

    setIsDarkMode(savedTheme === 'true' || currentlyDark)
  }, [])

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)

    // Apply theme to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }

  return {
    isDarkMode,
    toggleTheme
  }
}