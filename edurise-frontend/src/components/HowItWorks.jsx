import React from 'react';
import { UserCheck, Zap, Calendar, Award } from 'lucide-react';

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">EduRise</span> Works
          </h2>
          <p className="text-xl text-gray-300">Simple steps to start your learning journey</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              title: "Create Profile",
              description: "Sign up and list the skills you can teach and want to learn",
              icon: <UserCheck className="w-8 h-8" />
            },
            {
              step: "02", 
              title: "AI Matching",
              description: "Our AI finds perfect learning partners based on your preferences",
              icon: <Zap className="w-8 h-8" />
            },
            {
              step: "03",
              title: "Schedule & Learn",
              description: "Book sessions, attend live or recorded classes, and exchange knowledge",
              icon: <Calendar className="w-8 h-8" />
            },
            {
              step: "04",
              title: "Earn & Grow",
              description: "Earn tokens by teaching, get verified badges, and build your reputation",
              icon: <Award className="w-8 h-8" />
            }
          ].map((step, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 bg-slate-900 text-purple-400 text-sm font-bold px-3 py-1 rounded-full">
                  {step.step}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;