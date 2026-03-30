import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

const Pricing = () => {
  const [activeTab, setActiveTab] = useState('monthly');

  const pricingPlans = [
    {
      name: "Free Explorer",
      price: "₹0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "5 tokens per month",
        "Basic skill matching",
        "Standard chat support",
        "Community access",
        "Basic profile features"
      ],
      highlighted: false
    },
    {
      name: "Skill Master",
      price: "₹299",
      period: "/month",
      description: "For serious learners and teachers",
      features: [
        "50 tokens per month",
        "AI-powered matching",
        "Priority scheduling",
        "Advanced analytics",
        "Verified badge program",
        "Premium chat features",
        "Session recordings"
      ],
      highlighted: true
    },
    {
      name: "Professional",
      price: "₹599",
      period: "/month",
      description: "For institutions and power users",
      features: [
        "Unlimited tokens",
        "Custom matching algorithms",
        "Dedicated account manager",
        "White-label options",
        "Advanced reporting",
        "API access",
        "24/7 priority support"
      ],
      highlighted: false
    }
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Affordable Plans for
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Every Need
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Choose the perfect plan for your learning journey. Upgrade anytime as you grow.
          </p>
          
          <div className="flex items-center justify-center mb-12">
            <div className="bg-slate-800 rounded-full p-1 flex">
              <button 
                onClick={() => setActiveTab('monthly')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === 'monthly' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setActiveTab('yearly')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === 'yearly' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <div 
              key={index} 
              className={`rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
                plan.highlighted 
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-2 border-purple-400 shadow-2xl' 
                  : 'bg-slate-800/50 border border-purple-500/20 hover:border-purple-400/40'
              }`}
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <p className="text-gray-300">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-3 px-6 rounded-full font-semibold transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-white text-purple-600 hover:bg-gray-100'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;