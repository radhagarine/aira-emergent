import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/providers/supabase-provider';
import { User2 } from 'lucide-react';
import { BookingDialog } from '@/components/booking-dialog';

interface AuthButtonsProps {
  scrolled?: boolean;
}

export function AuthButtons({ scrolled = false }: AuthButtonsProps) {
  const { user, signIn, signOut } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  if (user) {
    const userAvatar = user.user_metadata?.picture || user.user_metadata?.avatar_url;

    return (
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gray-200 flex items-center justify-center">
          {userAvatar && !imageError ? (
            <Image
              src={userAvatar}
              alt="User avatar"
              width={32}
              height={32}
              className="object-cover"
              onError={() => setImageError(true)}
              priority
            />
          ) : (
            <User2 className="h-5 w-5 text-gray-600" />
          )}
        </div>
        
        <Button 
          variant="ghost" 
          className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white transition-all duration-300 
                    hover:scale-105 active:scale-98"
          onClick={signOut}
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          onClick={() => setShowBookingDialog(true)}
          className={`hidden sm:inline-flex border-2 text-sm transition-all duration-300 hover:scale-105 px-4 py-2 rounded-lg font-medium ${
            scrolled
              ? 'border-[#8B0000] bg-transparent text-[#8B0000] hover:bg-[#8B0000] hover:text-white'
              : 'border-white bg-transparent text-white hover:bg-white hover:text-[#8B0000]'
          }`}
        >
          Book a Demo
        </Button>
      <Link href="/auth/login">
        <Button
          className={`hidden sm:inline-flex border-2 text-sm transition-all duration-300 hover:scale-105 px-4 py-2 rounded-lg font-medium ${
            scrolled
              ? 'border-[#8B0000] bg-transparent text-[#8B0000] hover:bg-[#8B0000] hover:text-white'
              : 'border-white bg-transparent text-white hover:bg-white hover:text-[#8B0000]'
          }`}
        >
          Sign In
        </Button>
      </Link>
      <Link href="/auth/signup">
        <Button
          className="bg-[#8B0000] hover:bg-[#A52A2A] text-white transition-all duration-300
                    hover:scale-105 active:scale-98 text-sm px-4 py-2 rounded-lg font-medium shadow-lg"
        >
          Sign Up
        </Button>
      </Link>
    </div>
    <BookingDialog open={showBookingDialog} onOpenChange={setShowBookingDialog} />
    </>
  );
}