// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { cn } from "@/lib/utils"  // Make sure you have this utility
import { SupabaseProvider } from '@/components/providers/supabase-provider'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize dark mode before hydration to prevent flash
              try {
                const darkMode = localStorage.getItem('darkMode');
                if (darkMode === 'true') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased transition-colors duration-200",
          inter.className
        )}
      >
        <SupabaseProvider>
        {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}