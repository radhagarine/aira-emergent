'use client'

import { Inter } from 'next/font/google'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

const inter = Inter({ subsets: ['latin'] })

const waveAnimation = keyframes`
  0% {
    transform: scaleY(0.2);
  }
  100% {
    transform: scaleY(1);
  }
`

const AnimatedSpan = styled.span`
  position: absolute;
  height: 100%;
  width: 1px;
  background-color: #8B0000;
  opacity: 0.1;
  animation: ${waveAnimation} ease-in-out infinite alternate;
`

export function AiraLogo() {
  return (
    <div className={`inline-flex items-baseline tracking-tight gap-[0.2em] ${inter.className} relative`}>
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <AnimatedSpan
            key={i}
            style={{
              left: `${10 + i * 10}%`,
              animationDuration: `${0.8 + i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <span className="text-[1.7rem] font-bold text-black relative z-10">A</span>
      <span className="text-[1.7rem] font-bold text-black relative z-10">i</span>
      <span className="text-[2.1rem] font-bold text-[#8B0000] -mt-1 relative z-10">R</span>
      <span className="text-[1.7rem] font-bold text-black relative z-10">A</span>
    </div>
  )
}

