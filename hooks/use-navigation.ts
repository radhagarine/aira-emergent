import { usePathname } from 'next/navigation'

export function useNavigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  return { isActive }
}

