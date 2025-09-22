import Link from 'next/link'
import Image from 'next/image'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export function BrandLogoDashboard() {
  return (
    <Link href="/" className="flex justify-center w-full py-4">
      <div className="relative w-48 h-14">
        <Image
          src="/images/BoxedLogoLight.png"
          alt="AIRA - The AI Reception Assistant"
          fill
          priority
          className="object-contain object-center"
          sizes="(max-width: 768px) 140px, 192px"
        />
      </div>
    </Link>
  )
}