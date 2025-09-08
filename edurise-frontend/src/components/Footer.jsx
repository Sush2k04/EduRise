import React from 'react';
import { BookOpen, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-purple-500/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold">EduRise</span>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering learners worldwide through peer-to-peer skill exchange.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer">
                <Globe className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-purple-400 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">How it Works</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-purple-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Status</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-purple-400 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-purple-500/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">© 2024 EduRise. All rights reserved.</p>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <span className="text-gray-400">Built with</span>
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            <span className="text-gray-400">by SMVEC Team</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;