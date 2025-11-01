import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Phone, X, MessageSquare, ArrowRight, Globe, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from "next/image"
import { BookingDialog } from '@/components/booking-dialog'

interface DialogflowBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const DialogflowBot: React.FC<DialogflowBotProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold px-2">Talk to AiRA</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <iframe
          width="350"
          height="430"
          src="https://console.dialogflow.com/api-client/demo/embedded/2b6756b8-9f62-4f48-b369-e34d31b62c4a?enableAutoTTS=true&enableAutoSTT=true&inputType=voice&outputType=voice&startVoice=true&defaultVoiceMode=true&autoEnableVoice=true&initPayload=WELCOME"
          className="border-none"
          allow="microphone"
        ></iframe>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const questions = [
    "What is Aira?",
    "How can Aira help my business?",
    "How do I get started?"
  ];

  const phoneNumbers = [
    {
      country: "United States",
      flag: "🇺🇸",
      code: "+1 (555)",
      number: "123-4567",
      fullNumber: "+15551234567",
      color: "blue",
      gradient: "from-blue-50 via-white to-blue-50",
      borderColor: "border-blue-200",
      hoverBorderColor: "hover:border-blue-500",
      iconGradient: "from-blue-500 to-blue-600",
      textColor: "text-blue-600",
      ringColor: "ring-blue-200"
    },
    {
      country: "India",
      flag: "🇮🇳",
      code: "+91 98765",
      number: "43210",
      fullNumber: "+919876543210",
      color: "orange",
      gradient: "from-orange-50 via-white to-orange-50",
      borderColor: "border-orange-200",
      hoverBorderColor: "hover:border-orange-500",
      iconGradient: "from-orange-500 to-orange-600",
      textColor: "text-orange-600",
      ringColor: "ring-orange-200"
    }
  ];

  const handlePrevCard = () => {
    setCurrentCardIndex((prev) => (prev === 0 ? phoneNumbers.length - 1 : prev - 1));
  };

  const handleNextCard = () => {
    setCurrentCardIndex((prev) => (prev === phoneNumbers.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="faqs" className="w-full mx-auto py-12 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-7xl items-center mx-auto">
        {/* Left Side - Call to Action & Phone Numbers */}
        <div className="flex flex-col justify-center space-y-8">
          <div className="text-left">
            <h3 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 text-[#722F37] leading-tight">
              Call AiRA for a
              <span className="block text-5xl sm:text-6xl md:text-7xl mt-2 bg-gradient-to-r from-[#722F37] via-red-600 to-rose-500 bg-clip-text text-transparent">Live Demo</span>
            </h3>
            <p className="text-lg sm:text-xl text-gray-600 font-medium mt-4">
              Experience AiRA in action!
            </p>
            <p className="text-lg sm:text-xl text-[#722F37] font-bold mt-2">Select your region and call now ↓</p>
          </div>

          <div className="relative flex items-center justify-center">
            {/* Swipe Left Arrow */}
            <button
              onClick={handlePrevCard}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 bg-white rounded-full p-3 shadow-xl hover:shadow-2xl hover:scale-110 transition-all border-2 border-gray-200 hover:border-[#722F37]"
            >
              <ChevronLeft className="h-6 w-6 text-[#722F37]" />
            </button>

            {/* Swipe Right Arrow */}
            <button
              onClick={handleNextCard}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 bg-white rounded-full p-3 shadow-xl hover:shadow-2xl hover:scale-110 transition-all border-2 border-gray-200 hover:border-[#722F37]"
            >
              <ChevronRight className="h-6 w-6 text-[#722F37]" />
            </button>

            {/* Flashcard Stack - Side by Side with Offset */}
            <div className="relative w-full max-w-xl mx-auto flex items-center justify-center" style={{ minHeight: '260px' }}>
              {phoneNumbers.map((phone, index) => {
                const isActive = index === currentCardIndex;
                const isPrev = index === (currentCardIndex === 0 ? phoneNumbers.length - 1 : currentCardIndex - 1);
                const isNext = index === (currentCardIndex === phoneNumbers.length - 1 ? 0 : currentCardIndex + 1);

                let position = 'hidden';
                let xOffset = 0;
                let zIndex = 0;
                let scale = 0.85;
                let opacity = 0.5;

                if (isActive) {
                  position = 'active';
                  xOffset = 0;
                  zIndex = 20;
                  scale = 1;
                  opacity = 1;
                } else if (isNext) {
                  position = 'next';
                  xOffset = 180;
                  zIndex = 10;
                  scale = 0.85;
                  opacity = 0.5;
                } else if (isPrev) {
                  position = 'prev';
                  xOffset = -180;
                  zIndex = 10;
                  scale = 0.85;
                  opacity = 0.5;
                }

                if (position === 'hidden') return null;

                return (
                  <a
                    key={index}
                    href={`tel:${phone.fullNumber}`}
                    className={`absolute transition-all duration-500 ${
                      isActive ? 'cursor-pointer' : 'pointer-events-none'
                    }`}
                    style={{
                      transform: `translateX(${xOffset}px) scale(${scale})`,
                      zIndex: zIndex,
                      opacity: opacity,
                      width: '280px'
                    }}
                  >
                    <Card className={`px-6 py-4 transition-all duration-500 border-4 ${phone.borderColor} bg-white relative overflow-hidden shadow-2xl rounded-2xl`}>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${phone.iconGradient} flex items-center justify-center shadow-lg ring-3 ${phone.ringColor} flex-shrink-0`}>
                          <Globe className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-xs font-black ${phone.textColor} mb-2 uppercase tracking-wider`}>{phone.flag} {phone.country}</p>
                          <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-200">
                            <p className="text-2xl font-black text-[#722F37] tracking-tight leading-tight">{phone.code}</p>
                            <p className="text-2xl font-black text-[#722F37] tracking-tight leading-tight">{phone.number}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowBookingForm(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-[#8B0000] rounded-full shadow-lg hover:bg-[#8B0000] transition-all duration-300 hover:scale-105 group"
            >
              <div className="w-3 h-3 bg-[#8B0000] rounded-full animate-pulse"></div>
              <p className="text-lg font-bold text-[#8B0000] group-hover:text-white transition-colors">Book your appointment instantly!</p>
            </button>
          </div>
        </div>

        {/* Right Side - AI Assistant Avatar */}
        <div className="flex flex-col justify-center items-center space-y-8">
          <div className="relative w-80 h-80">
            <div className="absolute inset-0 rounded-full bg-rose-200/30 animate-pulse-slow"></div>
            <div className="absolute inset-[10%] rounded-full bg-rose-200/40 animate-pulse-medium"></div>
            <div className="absolute inset-[20%] rounded-full bg-rose-200/50 animate-pulse-fast"></div>
            <div className="absolute inset-[30%] rounded-full bg-white border-4 border-white overflow-hidden shadow-lg">
              <Image
                src="/images/hero_img.JPG"
                alt="AI Assistant Avatar"
                width={480}
                height={480}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Circular Text - Let's Talk */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 320 320">
              <defs>
                <path
                  id="circlePath"
                  d="M 160, 160 m -140, 0 a 140,140 0 1,1 280,0 a 140,140 0 1,1 -280,0"
                />
              </defs>
              <text className="fill-[#722F37] font-black text-2xl tracking-[0.3em]" style={{ letterSpacing: '0.3em' }}>
                <textPath href="#circlePath" startOffset="25%">
                  LET'S TALK! ☎
                </textPath>
              </text>
            </svg>
          </div>
        </div>
      </div>

      <DialogflowBot isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />
      <BookingDialog open={showBookingForm} onOpenChange={setShowBookingForm} />

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0.4; }
        }
        @keyframes pulse-medium {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        @keyframes pulse-fast {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
        .animate-pulse-medium {
          animation: pulse-medium 2s infinite;
        }
        .animate-pulse-fast {
          animation: pulse-fast 1.5s infinite;
        }
      `}</style>
    </section>
  )
}