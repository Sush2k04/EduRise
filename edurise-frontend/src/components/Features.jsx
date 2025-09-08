import React from 'react';
import { Users, Coins, Video, Award, MessageCircle, Shield } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "AI-Powered Matching",
      description: "Smart algorithms connect you with perfect learning partners based on skills and preferences."
    },
    {
      icon: <Coins className="w-6 h-6" />,
      title: "Token-Based Exchange",
      description: "Earn tokens by teaching, spend them learning. Fair and balanced skill exchange system."
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Live & Recorded Sessions",
      description: "Choose between real-time video calls or pre-recorded sessions that fit your schedule."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Skill Verification",
      description: "Verified badges and peer ratings ensure quality and trustworthy learning experiences."
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "24/7 Chat Support",
      description: "Continue conversations and get help even after sessions with integrated chat features."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Platform",
      description: "Advanced security measures protect your data and ensure safe learning environments."
    }
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Unleash Your <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Potential</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover how our AI-powered platform transforms skill sharing with cutting-edge features designed for modern learners.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 hover:border-purple-400/40 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;