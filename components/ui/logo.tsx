import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <span className="text-2xl font-bold tracking-tight">
        A<span className="text-[#8B0000]">i</span>R
        <span className="text-[#8B0000]">A</span>
      </span>
    </Link>
  )
}

