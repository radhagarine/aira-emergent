import Link from 'next/link'
import { AiraLogo } from '@/components/ui/aira-logo'
import { BrandLogo } from '../nav/brand-logo'
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react'

export function Footer() {
  return (
    <footer id="footer" className="bg-gray-100 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-1 sm:col-span-2">
            <BrandLogo />
            <p className="mt-4 text-gray-600 text-sm sm:text-base">
              Revolutionizing reception services<br /> with AI-powered solutions.
            </p>
            
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Quick Links</h3>
            <ul className="space-y-2">
              {['About', 'Services', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href={`/`} className="text-gray-600 hover:text-[#8B0000] transition-colors text-sm sm:text-base">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Connect</h3>
            <div className="flex space-x-4">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, index) => (
                <a key={index} href="#" className="text-gray-600 hover:text-[#8B0000] transition-colors">
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600 text-sm sm:text-base">
          <p>&copy; {new Date().getFullYear()} Aira. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

