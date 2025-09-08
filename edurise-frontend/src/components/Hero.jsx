import React from 'react';
import { BookOpen, Users, Coins, ArrowRight, Play } from 'lucide-react';

const Hero = () => {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Your AI-Powered
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Learning Exchange
                </span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                Exchange skills without money. Teach what you know, learn what you want. 
                Our AI matches you with perfect learning partners in a fair token-based system.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                Start Learning <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button className="border border-purple-500 px-8 py-4 rounded-full font-semibold text-lg hover:bg-purple-500/10 transition-all duration-300 flex items-center justify-center">
                <Play className="w-5 h-5 mr-2" /> Watch Demo
              </button>
            </div>

            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">10K+</div>
                <div className="text-sm text-gray-400">Active Learners</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400">500+</div>
                <div className="text-sm text-gray-400">Skills Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">50K+</div>
                <div className="text-sm text-gray-400">Sessions Completed</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="w-full h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-3xl"></div>
              <div className="relative z-10">
                <div className="w-64 h-64 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <div className="w-48 h-48 bg-slate-900 rounded-full flex items-center justify-center">
                    <BookOpen className="w-24 h-24 text-purple-400" />
                  </div>
                </div>
              </div>
              <div className="absolute top-8 left-8 bg-slate-800/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">Live Session</span>
                </div>
              </div>
              <div className="absolute bottom-8 right-8 bg-slate-800/80 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm">25 Tokens</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;