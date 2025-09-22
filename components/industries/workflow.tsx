// components/industries/workflow.tsx
'use client'

import { motion, Variants } from 'framer-motion'
import { Cog, LineChart, Zap } from 'lucide-react'
import { Card } from "@/components/ui/card"

type Step = {
  icon: React.ElementType
  title: string
  delay: number
}

const steps: Step[] = [
  {
    icon: Zap,
    title: "Transform",
    delay: 0.1
  },
  {
    icon: Cog,
    title: "Automate",
    delay: 0.2
  },
  {
    icon: LineChart,
    title: "Scale",
    delay: 0.3
  }
]

const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

const containerVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function WorkflowSteps() {
  return (
    <motion.div 
      className="space-y-10 relative py-2"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Vertical line connecting cards - starts after first card */}
      <div className="absolute left-1/2 top-[120px] bottom-0 w-0.5 bg-gradient-to-b from-[#8B0000] via-[#8B0000] to-transparent opacity-20 transform -translate-x-1/2" />
      
      {steps.map((step, index) => (
        <motion.div
          key={step.title}
          variants={fadeInUp}
          custom={index}
          className="relative"
        >
          <Card className="transform transition-all duration-300 hover:scale-105 border-0 relative z-10 bg-white shadow-[0_0_30px_rgba(139,0,0,0.1)] hover:shadow-[0_0_50px_rgba(139,0,0,0.2)] max-w-[280px] mx-auto">
            <div className="p-6 flex flex-col items-center">
              {/* Icon container with gradient background */}
              <div className="relative mb-3 group">
                {/* Outer glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-[#8B0000] to-[#5C0000] rounded-full opacity-75 group-hover:opacity-100 blur transition-opacity duration-300" />
                {/* Icon background */}
                <div className="relative bg-gradient-to-br from-[#8B0000] to-[#5C0000] p-3 rounded-full transform transition-transform duration-300 group-hover:scale-110">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                {/* Pulsing ring */}
                <div className="absolute inset-0 border-2 border-[#8B0000] rounded-full animate-ping opacity-20" />
              </div>
              
              {/* Title with gradient text */}
              <h4 className="text-xl font-bold text-[#8B0000]">
                {step.title}
              </h4>
            </div>
          </Card>
          
          {/* Centered arrow indicator for non-last items */}
          {index < steps.length - 1 && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-20">
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 bg-gradient-to-r from-[#8B0000] to-[#5C0000] rounded rotate-45 transform translate-y-1/2" />
                <div className="absolute inset-0.5 bg-white rounded rotate-45" />
                <div className="absolute inset-1 bg-gradient-to-r from-[#8B0000] to-[#5C0000] rounded rotate-45" />
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}