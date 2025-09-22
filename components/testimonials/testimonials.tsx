"use client"

import Image from "next/image"
import { motion } from "framer-motion"

const testimonials = [
  {
    quote: "Aira transformed our reception operations completely. The AI's ability to handle multiple inquiries simultaneously is remarkable.",
    author: "Sarah Johnson",
    title: "Operations Director",
    company: "TechCorp",
    //image: "/placeholder.svg?height=80&width=80"
    image: "/images/hero_img.jpg"
  },
  {
    quote: "The cost savings and efficiency gains have been substantial. Our clients love the professional and prompt responses.",
    author: "Michael Chen",
    title: "CEO",
    company: "Innovation Labs",
    //image: "/placeholder.svg?height=80&width=80"
    image: "/images/hero_img.jpg"
  },
  {
    quote: "Implementation was seamless, and the AI's learning capability means it gets better every day.",
    author: "Emma Williams",
    title: "IT Director",
    company: "Global Systems",
    //image: "/placeholder.svg?height=80&width=80"
    image: "/images/hero_img.jpg"
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-16 sm:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted by Industry Leaders</h2>
          <p className="text-lg text-gray-600">See what our clients have to say about Aira</p>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex flex-col items-center text-center">
                
                <blockquote className="text-gray-700 italic mb-4">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-gray-600">{testimonial.title}</p>
                  <p className="text-[#8B0000]">{testimonial.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

