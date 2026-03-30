import React from 'react';

const CTA = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 to-pink-600/80"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Start Your Learning
              <span className="block">Journey Today</span>
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of learners and experience the power of AI-driven skill exchange. No commitment required.
            </p>
            <button className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
              Get Started Free
            </button>
          </div>
          
          <div className="absolute top-8 right-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-8 left-8 w-24 h-24 bg-white/10 rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default CTA;