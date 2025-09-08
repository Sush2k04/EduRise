import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Menu, X } from 'lucide-react';
import { getCurrentUser, removeAuthData } from '../services/api';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    removeAuthData();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                EduRise
              </span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-purple-400 transition-colors">How it Works</a>
              <a href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</a>
              <a href="#testimonials" className="hover:text-purple-400 transition-colors">Reviews</a>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-purple-400">Welcome, {user.name}</span>
                <span className="text-yellow-400 flex items-center">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                  {user.tokens} tokens
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-white hover:text-purple-400 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-purple-400 transition-colors">Login</Link>
                <Link 
                  to="/signup" 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-purple-500/20">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#features" className="block px-3 py-2 hover:text-purple-400">Features</a>
            <a href="#how-it-works" className="block px-3 py-2 hover:text-purple-400">How it Works</a>
            <a href="#pricing" className="block px-3 py-2 hover:text-purple-400">Pricing</a>
            <a href="#testimonials" className="block px-3 py-2 hover:text-purple-400">Reviews</a>
            <div className="pt-4 pb-3 border-t border-purple-500/20">
              {user ? (
                <>
                  <div className="px-3 py-2 text-purple-400">Welcome, {user.name}</div>
                  <div className="px-3 py-2 text-yellow-400">{user.tokens} tokens</div>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 hover:text-purple-400"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="block px-3 py-2 hover:text-purple-400"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="block w-full mt-2 bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 rounded-full font-medium text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;