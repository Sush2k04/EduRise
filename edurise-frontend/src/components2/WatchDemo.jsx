import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  ArrowLeft,
  Users,
  MessageCircle,
  StickyNote,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import ChatSection from './ChatSection';
import NotesSection from './NotesSection';
import FeedbackSection from './FeedbackSection';
import MeetingControls from './MeetingControls';

const WatchDemo = () => {
  const [activeTab, setActiveTab] = useState('chat'); // chat, notes, feedback
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Demo video data
  const demoData = {
    title: "EduRise Platform Demo - Peer-to-Peer Learning",
    instructor: "Sarah Chen",
    instructorAvatar: "👩‍💻",
    skill: "React.js Development",
    duration: "12:34",
    viewers: 23,
    tokens: 5
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-purple-500/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleGoBack}
              className="p-2 hover:bg-purple-500/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{demoData.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>by {demoData.instructor}</span>
                <span>•</span>
                <span>{demoData.skill}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{demoData.viewers} watching</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full text-sm font-medium">
              Cost: {demoData.tokens} Tokens
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid lg:grid-cols-3 gap-6">
        {/* Main Video Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <VideoPlayer 
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            volume={volume}
            setVolume={setVolume}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            duration={duration}
            setDuration={setDuration}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
          />
          {/* <MeetingControls /> */}


          {/* Meeting Controls (for live sessions) */}

          {/* Video Info */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{demoData.instructorAvatar}</div>
                <div>
                  <h3 className="text-xl font-semibold">{demoData.instructor}</h3>
                  <p className="text-gray-400">Expert in {demoData.skill}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">(4.9 • 127 reviews)</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full font-medium hover:from-purple-600 hover:to-pink-600 transition-all">
                  Book Session
                </button>
              </div>
            </div>
            
            <div className="border-t border-purple-500/20 pt-4">
              <h4 className="font-semibold mb-2">What you'll learn:</h4>
              <ul className="text-gray-300 space-y-1">
                <li>• React.js fundamentals and component architecture</li>
                <li>• State management with hooks and context</li>
                <li>• Building interactive user interfaces</li>
                <li>• Best practices for modern React development</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl overflow-hidden">
            <div className="flex border-b border-purple-500/20">
              {[
                { id: 'chat', label: 'Live Chat', icon: MessageCircle },
                { id: 'notes', label: 'Notes', icon: StickyNote },
                { id: 'feedback', label: 'Feedback', icon: Star }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 p-4 transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-purple-500/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="h-96 overflow-hidden">
              {activeTab === 'chat' && <ChatSection />}
              {activeTab === 'notes' && <NotesSection />}
              {activeTab === 'feedback' && <FeedbackSection />}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
            <h4 className="font-semibold mb-4">Session Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{demoData.viewers}</div>
                <div className="text-sm text-gray-400">Live Viewers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-400">95%</div>
                <div className="text-sm text-gray-400">Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">4.9</div>
                <div className="text-sm text-gray-400">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{demoData.tokens}</div>
                <div className="text-sm text-gray-400">Tokens</div>
              </div>
            </div>
          </div>

          {/* Related Skills */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
            <h4 className="font-semibold mb-4">Related Skills</h4>
            <div className="space-y-3">
              {[
                { name: 'JavaScript Fundamentals', tokens: 3, rating: 4.8 },
                { name: 'Node.js Backend', tokens: 4, rating: 4.9 },
                { name: 'UI/UX Design', tokens: 5, rating: 4.7 }
              ].map((skill, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                  <div>
                    <div className="font-medium text-sm">{skill.name}</div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-400">{skill.rating}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-purple-400">{skill.tokens} tokens</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchDemo;