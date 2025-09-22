import { Button } from "@/components/ui/button"
import { MetricCard } from "@/components/metric-card"

export function Hero() {
  return (
    <div className="relative min-h-[80vh] flex items-center">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-[url('/images/office-bg.jpg')] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3))`
        }}
      />
      
      <div className="container mx-auto px-4 z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-white space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Transform Your
              <br />
              Reception
            </h1>
            <h2 className="text-4xl md:text-5xl font-bold text-[#8B0000]">
              with AI Excellence
            </h2>
            <p className="text-lg md:text-xl max-w-xl">
              Experience the future of reception services with Aira. Our AI-powered
              platform delivers <span className="text-[#8B0000] font-semibold">24/7</span> professional reception coverage with unmatched
              efficiency and elegance.
            </p>
            <Button 
              className="bg-[#8B0000] hover:bg-[#8B0000]/90 text-white px-8 py-6 text-lg
                        transition-all duration-300 hover:scale-105 active:scale-98"
            >
              Get Started →
            </Button>
          </div>

          {/* Right Column - Metric Cards */}
          <div className="space-y-4">
            <MetricCard value="98%" label="Customer Satisfaction" />
            <MetricCard value="<3s" label="Response Time" />
            <MetricCard value="40%" label="Cost Reduction" />
          </div>
        </div>
      </div>
    </div>
  )
}

