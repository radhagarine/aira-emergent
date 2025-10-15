// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { cn } from "@/lib/utils"  // Make sure you have this utility
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Chatbot } from '@/components/ui/chatbot'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AiRA - AI Reception Assistant',
  description: 'Intelligent AI-powered reception assistant for businesses',
  icons: {
    icon: [
      {
        url: '/favicon.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        url: '/icon.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
}

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
          <AuthProvider>
            {children}
            <Chatbot />
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}