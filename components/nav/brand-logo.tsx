import Link from 'next/link'
import Image from 'next/image'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export function BrandLogo() {
  return (
    <Link href="/" className="flex items-center">
      <div className="relative w-44 h-12">
        <Image
          src="/images/BoxedLogo.png"
          alt="AIRA - The AI Reception Assistant"
          fill
          priority
          className="object-contain"
          sizes="(max-width: 768px) 120px, 180px"
        />
      </div>
    </Link>
  )
}