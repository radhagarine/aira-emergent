import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/providers/supabase-provider';
import { User2 } from 'lucide-react'; 

export function AuthButtons() {
  const { user, signIn, signOut } = useAuth();
  const [imageError, setImageError] = useState(false);

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
    <div className="flex items-center gap-2 sm:gap-4">
      <Link href="/auth/login">
        <Button
          variant="ghost"
          className="hidden sm:inline-flex border-2 border-[#8B0000] text-sm"
        >
          Sign In
        </Button>
      </Link>
      <Link href="/auth/signup">
        <Button
          className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white transition-all duration-300
                    hover:scale-105 active:scale-98 text-sm px-3 py-2 sm:px-4 sm:py-2"
        >
          Sign Up
        </Button>
      </Link>
    </div>
  );
}