import React from 'react';
import { 
  Calendar, 
  PhoneOutgoing, 
  Languages, 
  MessagesSquare, 
  Users, 
  BarChart2 
} from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: Calendar,     // Keep Calendar for Scheduling
    iconColor: "bg-red-900/20",
    iconFill: "text-red-900",
    title: "Scheduling",
    description:
      "Streamline appointment management across industries. Clients can effortlessly book, reschedule, or cancel appointments through conversational AI.",
  },
  {
    icon: PhoneOutgoing, // Change to PhoneOutgoing for Outbound Calling
    iconColor: "bg-red-900/20",
    iconFill: "text-red-900",
    title: "Outbound Calling",
    description:
      "oost engagement with automated outreach and intelligent follow-ups designed to maximize conversions.",
  },
  {
    icon: Languages,    // Change to Languages for Multilingual Support
    iconColor: "bg-red-900/20",
    iconFill: "text-red-900",
    title: "Multilingual Support",
    description:
      "Enable seamless conversations in multiple languages, with AI that learns and adapts to provide personalized service.",
  },
  {
    icon: MessagesSquare, // Change to MessagesSquare for Smart Interactions
    iconColor: "bg-red-900/20",
    iconFill: "text-red-900",
    title: "Smart Interactions",
    description:
      "Centralize social media engagement, ensuring quick responses and consistent brand voice across all platforms.",
  },
  {
    icon: Users,   // Change to UsersRound for CRM Integration
    iconColor: "bg-red-900/20",
    iconFill: "text-red-900",
    title: "CRM Integration",
    description:
      "Sync effortlessly with your existing CRM systems for seamless data management, enhanced customer insights, and personalized service delivery.",
  },
  {
    icon: BarChart2,    // Change to BarChart2 for Business Analytics
    iconColor: "bg-red-900/20",
    iconFill: "text-red-900",
    title: "Business Analytics and Reporting",
    description:
      "Gain actionable insights with AI-driven analytics, tracking key metrics to optimize performance and make data-driven decisions.",
  },
];

export function Features() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4 text-gray-900">
            Voice Integrated Features for Modern Businesses
          </h2>
          <p className="text-xl text-gray-700 max-w-[800px] mx-auto">
            Everything you need to revolutionize your reception services
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, index) => (
            <div
              key={index}
              className="group relative h-full transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="absolute inset-0 rounded-2xl transition-all duration-300 
                bg-gradient-to-br from-red-500/5 via-red-500/5 to-red-500/10 
                group-hover:from-red-500/10 group-hover:via-red-500/15 group-hover:to-red-500/20 
                blur-xl"
              />
              
              <Card className="relative h-full overflow-hidden p-8 backdrop-blur-sm border-0
                bg-white/90 shadow-lg shadow-red-500/10 hover:shadow-xl hover:shadow-red-500/20"
              >
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl ${item.iconColor} mb-6 mx-auto
                    transform transition-transform duration-300 group-hover:scale-110 relative`}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent" />
                    <item.icon className={`w-8 h-8 ${item.iconFill} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`} />
                  </div>

                  <h3 className="text-xl font-semibold mb-4 text-center text-gray-900">
                    {item.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-center text-gray-700">
                    {item.description}
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 transition-transform duration-300 
                  bg-red-500/20 group-hover:scale-x-100"
                />
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;