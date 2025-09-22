import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, X, MessageSquare, ArrowRight } from 'lucide-react'
import Image from "next/image"

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

  const questions = [
    "What is Aira?",
    "How can Aira help my business?",
    "How do I get started?"
  ];

  return (
    <section id="faqs" className="w-full mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold mb-8 text-center sm:text-4xl md:text-5xl">Frequently Asked Questions</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl items-center mx-auto"> 
        <div className="flex flex-col justify-center col-span-1">
          <Card className="max-w-lg w-full p-6 bg-gradient-to-br from-white via-white to-red-50 shadow-lg rounded-2xl mx-auto relative overflow-hidden group">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/5 rounded-full transform translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-900/5 rounded-full transform -translate-x-16 translate-y-16" />
            
            <div className="relative space-y-6">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-red-900">
                    <MessageSquare className="h-6 w-6" />
                    Ask anything about Aira:
                  </h2>
                  
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div
                        key={index}
                        className={`relative p-4 rounded-lg transition-all duration-300 cursor-pointer
                          ${activeQuestion === index 
                            ? 'bg-red-900/10 shadow-md' 
                            : 'hover:bg-red-900/5'}`}
                        onMouseEnter={() => setActiveQuestion(index)}
                        onMouseLeave={() => setActiveQuestion(null)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-gray-700 text-lg font-medium">
                            {question}
                          </p>
                          <ArrowRight className={`h-5 w-5 text-red-900 transform transition-transform duration-300
                            ${activeQuestion === index ? 'translate-x-1 opacity-100' : 'opacity-0'}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Interactive hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/0 via-red-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </Card>
        </div>

        <div className="flex flex-col justify-center items-center col-span-1 space-y-4">
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
          </div>
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Button 
              size="lg" 
              className="bg-[#722F37] hover:bg-[#8a383f] text-white px-8 py-6 text-lg rounded-full"
              onClick={() => setIsBotOpen(true)}
            >
              <Mic className="mr-2 h-5 w-5" />
              Talk to Aira
            </Button>
          </div>
        </div>
      </div>

      <DialogflowBot isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />

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