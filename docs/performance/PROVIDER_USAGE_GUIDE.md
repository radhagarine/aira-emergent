# Provider Usage Guide

## Quick Reference for Developers

This guide explains how to correctly use providers and services in the AiRA application after the performance optimization fixes.

---

## Provider Hierarchy (What You Need to Know)

### Root Level (`app/layout.tsx`)
```tsx
<SupabaseProvider>      // Provides: Supabase client singleton
  <AuthProvider>        // Provides: Auth state, user, session
    {children}
  </AuthProvider>
</SupabaseProvider>
```

**Available Everywhere:**
- `useSupabase()` - Get Supabase client
- `useAuth()` - Get auth state, user, session, signIn/signOut methods

### Dashboard Level (`app/dashboard/layout.tsx`)
```tsx
<EnhancedServiceProvider>  // Provides: All business services
  {children}
</EnhancedServiceProvider>
```

**Available in Dashboard:**
- `useBusinessService()` - Business CRUD operations
- `useAppointmentService()` - Appointment management
- `useFileService()` - File upload/management
- `useBusinessNumbersService()` - Phone number management
- `useRestaurantService()` - Restaurant-specific operations
- `useRetailService()` - Retail-specific operations
- `useServiceBusinessService()` - Service business operations
- `useTypeSpecificService(type)` - Get service by business type

---

## Common Usage Patterns

### 1. Accessing Auth State
```tsx
'use client'
import { useAuth } from '@/components/providers/auth-provider'

function MyComponent() {
  const { user, session, isLoading, signIn, signOut } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### 2. Accessing Supabase Client
```tsx
'use client'
import { useSupabase } from '@/components/providers/supabase-provider'

function MyComponent() {
  const { supabase } = useSupabase()

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('my_table')
      .select('*')
    // ...
  }

  return <div>...</div>
}
```

### 3. Using Business Service (Dashboard Pages)
```tsx
'use client'
import { useBusinessService } from '@/components/providers/service-provider'

function BusinessProfile() {
  const businessService = useBusinessService()
  const [business, setBusiness] = useState(null)

  useEffect(() => {
    const loadBusiness = async () => {
      const result = await businessService.getBusinessById(businessId)
      if (result.success) {
        setBusiness(result.data)
      }
    }
    loadBusiness()
  }, [businessService])

  return <div>...</div>
}
```

### 4. Using Type-Specific Services
```tsx
'use client'
import { useTypeSpecificService } from '@/components/providers/service-provider'

function BusinessDetails({ businessType }: { businessType: string }) {
  // Automatically gets the right service (Restaurant, Retail, or Service)
  const typeService = useTypeSpecificService(businessType)

  const loadDetails = async () => {
    const details = await typeService.getDetails(businessId)
    // ...
  }

  return <div>...</div>
}
```

---

## What NOT to Do

### ❌ DON'T: Wrap Pages in Providers
```tsx
// ❌ WRONG - Providers already exist in layouts
export default function MyPage() {
  return (
    <AppProvider>           // Don't do this!
      <SupabaseProvider>    // Don't do this!
        <AuthProvider>      // Don't do this!
          <MyContent />
        </AuthProvider>
      </SupabaseProvider>
    </AppProvider>
  )
}
```

### ✅ DO: Use Pages Directly
```tsx
// ✅ CORRECT - Providers come from layouts
export default function MyPage() {
  return <MyContent />
}
```

### ❌ DON'T: Create New Supabase Clients
```tsx
// ❌ WRONG - Creates new instance
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function MyComponent() {
  const supabase = createClientComponentClient()  // Don't do this!
  // ...
}
```

### ✅ DO: Use the Hook
```tsx
// ✅ CORRECT - Uses singleton instance
import { useSupabase } from '@/components/providers/supabase-provider'

function MyComponent() {
  const { supabase } = useSupabase()  // Do this!
  // ...
}
```

### ❌ DON'T: Nest Service Providers
```tsx
// ❌ WRONG - Already in dashboard layout
function MyDashboardPage() {
  return (
    <ServiceProvider>           // Don't do this!
      <EnhancedServiceProvider> // Don't do this!
        <MyContent />
      </EnhancedServiceProvider>
    </ServiceProvider>
  )
}
```

### ✅ DO: Use Service Hooks Directly
```tsx
// ✅ CORRECT - Provider already exists
function MyDashboardPage() {
  const businessService = useBusinessService()  // Do this!
  return <MyContent />
}
```

---

## Creating New Pages

### Standard Page Template
```tsx
'use client'

// Import only what you need
import { useAuth } from '@/components/providers/auth-provider'
import { useBusinessService } from '@/components/providers/service-provider'

export default function MyNewPage() {
  // Access services via hooks
  const { user, isLoading } = useAuth()
  const businessService = useBusinessService()

  // Your component logic
  // ...

  return (
    <div>
      {/* Your UI */}
    </div>
  )
}
```

### Dashboard Page Template (with Auth Check)
```tsx
'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useBusinessService } from '@/components/providers/service-provider'
import { useEffect, useState } from 'react'

export default function MyDashboardPage() {
  const { user, isLoading } = useAuth()
  const businessService = useBusinessService()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      // Load your data
    }
    loadData()
  }, [user, businessService])

  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  return (
    <div>
      {/* Your dashboard content */}
    </div>
  )
}
```

---

## Server Components vs Client Components

### Server Components (API Routes)
```tsx
// app/api/my-route/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // Your server logic
}
```

### Client Components (Pages/Components)
```tsx
'use client'
import { useSupabase } from '@/components/providers/supabase-provider'

function MyClientComponent() {
  const { supabase } = useSupabase()
  // Your client logic
}
```

---

## Service Layer Methods

### Business Service
```tsx
const businessService = useBusinessService()

// Get business by ID
const result = await businessService.getBusinessById(id)

// Get businesses by user
const businesses = await businessService.getBusinessesByUserId(userId)

// Create business
const created = await businessService.createBusiness(businessData)

// Update business
const updated = await businessService.updateBusiness(id, updates)

// Delete business
const deleted = await businessService.deleteBusiness(id)
```

### Appointment Service
```tsx
const appointmentService = useAppointmentService()

// Get appointments
const appointments = await appointmentService.getAppointmentsByBusiness(businessId)

// Create appointment
const created = await appointmentService.createAppointment(appointmentData)

// Update appointment
const updated = await appointmentService.updateAppointment(id, updates)
```

### File Service
```tsx
const fileService = useFileService()

// Upload file
const uploaded = await fileService.uploadFile(file, businessId)

// Get files
const files = await fileService.getFilesByBusiness(businessId)

// Delete file
const deleted = await fileService.deleteFile(fileId)
```

### Type-Specific Services
```tsx
// Restaurant Service
const restaurantService = useRestaurantService()
const menu = await restaurantService.getMenu(businessId)

// Retail Service
const retailService = useRetailService()
const inventory = await retailService.getInventory(businessId)

// Service Business Service
const serviceBusinessService = useServiceBusinessService()
const schedule = await serviceBusinessService.getSchedule(businessId)
```

---

## Debugging Tips

### Check Provider Hierarchy
```tsx
// Add this to your component to verify providers are available
function DebugComponent() {
  try {
    const { user } = useAuth()
    const { supabase } = useSupabase()
    const businessService = useBusinessService()

    console.log('✅ All providers accessible:', {
      hasUser: !!user,
      hasSupabase: !!supabase,
      hasBusinessService: !!businessService
    })
  } catch (error) {
    console.error('❌ Provider error:', error)
  }

  return <div>Check console for provider status</div>
}
```

### Common Errors

**Error: "useAuth must be used within an AuthProvider"**
- Solution: Make sure your component is inside the app layout or a child of it

**Error: "useServices must be used within a ServiceProvider"**
- Solution: Make sure your component is inside the dashboard layout

**Error: Multiple Supabase instances detected**
- Solution: Check that you're not creating new clients; use `useSupabase()` hook

---

## Performance Best Practices

### 1. Memoize Service Calls
```tsx
const businessService = useBusinessService()

const loadBusiness = useCallback(async (id) => {
  const result = await businessService.getBusinessById(id)
  return result
}, [businessService])
```

### 2. Avoid Unnecessary Re-renders
```tsx
// Memoize components that don't need frequent updates
const BusinessCard = memo(({ business }) => {
  return <div>{business.name}</div>
})
```

### 3. Use React Query or SWR for Data Fetching
```tsx
import useSWR from 'swr'

function MyComponent() {
  const businessService = useBusinessService()

  const { data, error } = useSWR(
    ['business', businessId],
    () => businessService.getBusinessById(businessId)
  )

  // ...
}
```

---

## Need Help?

- Check the provider implementations in `/components/providers/`
- Review the test files for usage examples
- See `PERFORMANCE_FIX_SUMMARY.md` for architectural details
- Check browser console for provider-related errors

---

**Last Updated:** 2025-10-14
**Version:** Post-Performance-Optimization
