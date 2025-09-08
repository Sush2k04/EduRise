import React from 'react';
import { Coins, Star } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "UX Designer",
      avatar: "👩‍💻",
      content: "I taught design fundamentals and learned Python in return. EduRise made skill exchange so seamless!",
      rating: 5,
      tokens: 45
    },
    {
      name: "Marcus Johnson",
      role: "Web Developer",
      avatar: "👨‍💼",
      content: "The AI matching is incredible. Found the perfect Spanish tutor who wanted to learn React.js!",
      rating: 5,
      tokens: 62
    },
    {
      name: "Priya Patel",
      role: "Marketing Specialist",
      avatar: "👩‍🎨",
      content: "Amazing community! I've learned photography and taught digital marketing. Win-win for everyone.",
      rating: 5,
      tokens: 38
    }
  ];

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Success <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Stories</span>
          </h2>
          <p className="text-xl text-gray-300">Real experiences from our learning community</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 hover:border-purple-400/40 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="text-4xl mr-4">{testimonial.avatar}</div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}</div>
                </div>
                <div className="ml-auto flex items-center space-x-1">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400">{testimonial.tokens}</span>
                </div>
              </div>
              <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
              <div className="flex items-center">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;