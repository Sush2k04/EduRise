import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  Search, 
  Filter,
  Video,
  MessageSquare,
  Star,
  Coins,
  Play,
  UserPlus
} from 'lucide-react';
import io from 'socket.io-client';

const StartLearning = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [sessionMode, setSessionMode] = useState('find-teacher'); // find-teacher, offer-teaching
  const [showCreateSession, setShowCreateSession] = useState(false);

  // Mock user data (replace with actual auth context)
  const currentUser = {
    id: 'user123',
    name: 'Your Name',
    avatar: '🧑‍💻',
    skills: ['React.js', 'Node.js', 'Python'],
    tokens: 25
  };

  const skillCategories = [
    { id: 'all', name: 'All Skills', icon: '🌟' },
    { id: 'programming', name: 'Programming', icon: '💻' },
    { id: 'design', name: 'Design', icon: '🎨' },
    { id: 'languages', name: 'Languages', icon: '🗣️' },
    { id: 'music', name: 'Music', icon: '🎵' },
    { id: 'photography', name: 'Photography', icon: '📸' },
    { id: 'writing', name: 'Writing', icon: '✍️' }
  ];

  // Mock active users data
  const mockUsers = [
    {
      id: 'user1',
      name: 'Sarah Chen',
      avatar: '👩‍💻',
      skills: ['React.js', 'JavaScript', 'UI/UX'],
      rating: 4.9,
      reviews: 127,
      tokenRate: 5,
      isAvailable: true,
      category: 'programming',
      bio: 'Frontend developer with 5+ years experience',
      isOnline: true
    },
    {
      id: 'user2',
      name: 'Alex Kumar',
      avatar: '👨‍💼',
      skills: ['Python', 'Data Science', 'Machine Learning'],
      rating: 4.8,
      reviews: 89,
      tokenRate: 6,
      isAvailable: true,
      category: 'programming',
      bio: 'Data scientist and ML engineer',
      isOnline: true
    },
    {
      id: 'user3',
      name: 'Maria Rodriguez',
      avatar: '👩‍🎨',
      skills: ['Photoshop', 'Illustrator', 'Brand Design'],
      rating: 4.9,
      reviews: 156,
      tokenRate: 4,
      isAvailable: false,
      category: 'design',
      bio: 'Creative designer specializing in branding',
      isOnline: false
    },
    {
      id: 'user4',
      name: 'John Smith',
      avatar: '👨‍🔬',
      skills: ['Spanish', 'French', 'Language Teaching'],
      rating: 4.7,
      reviews: 203,
      tokenRate: 3,
      isAvailable: true,
      category: 'languages',
      bio: 'Polyglot and language instructor',
      isOnline: true
    }
  ];

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Register current user
    newSocket.emit('register-user', currentUser);

    // Listen for active users updates
    newSocket.on('active-users-updated', (users) => {
      setActiveUsers(users);
    });

    // Listen for session invitations
    newSocket.on('session-invitation', (invitation) => {
      // Handle session invitation
      console.log('Session invitation received:', invitation);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSkill = selectedSkill === 'all' || user.category === selectedSkill;
    return matchesSearch && matchesSkill;
  });

  const handleStartSession = (instructor) => {
    if (currentUser.tokens < instructor.tokenRate) {
      alert('Insufficient tokens!');
      return;
    }

    // Create session and navigate to session page
    const sessionData = {
      instructor: instructor,
      learner: currentUser,
      skill: instructor.skills[0], // Primary skill
      tokenRate: instructor.tokenRate
    };

    // Emit session creation to socket
    socket?.emit('create-session', sessionData);

    // Navigate to session page
    navigate(`/session/${Date.now()}`, { 
      state: { sessionData, userRole: 'learner' }
    });
  };

  const handleOfferTeaching = () => {
    setShowCreateSession(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-purple-500/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-purple-500/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Start Learning</h1>
              <p className="text-sm text-gray-400">Connect with peer learners worldwide</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-full">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">{currentUser.tokens}</span>
            </div>
            <div className="text-2xl">{currentUser.avatar}</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Mode Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-2 flex">
              <button
                onClick={() => setSessionMode('find-teacher')}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                  sessionMode === 'find-teacher'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Find a Teacher</span>
              </button>
              <button
                onClick={() => setSessionMode('offer-teaching')}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                  sessionMode === 'offer-teaching'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Offer Teaching</span>
              </button>
            </div>
          </div>
        </div>

        {sessionMode === 'find-teacher' ? (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search skills or teachers..."
                    className="w-full bg-slate-700/50 border border-purple-500/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                {/* Skill Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="bg-slate-700/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400 transition-colors"
                  >
                    {skillCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Teachers Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((teacher) => (
                <div 
                  key={teacher.id}
                  className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-purple-400/40 transition-all hover:transform hover:scale-105"
                >
                  {/* Teacher Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="text-3xl">{teacher.avatar}</div>
                        {teacher.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{teacher.name}</h3>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-400">{teacher.rating} ({teacher.reviews})</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      teacher.isAvailable 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {teacher.isAvailable ? 'Available' : 'Busy'}
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-300 text-sm mb-4">{teacher.bio}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {teacher.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {teacher.skills.length > 3 && (
                      <span className="text-purple-400 text-xs">+{teacher.skills.length - 3} more</span>
                    )}
                  </div>

                  {/* Token Rate and Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">{teacher.tokenRate} tokens/hr</span>
                    </div>
                    
                    <button
                      onClick={() => handleStartSession(teacher)}
                      disabled={!teacher.isAvailable || currentUser.tokens < teacher.tokenRate}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Session</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No teachers found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : (
          // Offer Teaching Mode
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Share Your Knowledge</h2>
              <p className="text-gray-300 mb-8">
                Become a teacher and earn tokens by sharing your skills with eager learners. 
                Set your own rates and schedule.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Coins className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="font-semibold mb-2">Earn Tokens</h4>
                  <p className="text-sm text-gray-400">Get rewarded for teaching</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="font-semibold mb-2">Flexible Schedule</h4>
                  <p className="text-sm text-gray-400">Teach when convenient</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="font-semibold mb-2">Build Community</h4>
                  <p className="text-sm text-gray-400">Connect with learners</p>
                </div>
              </div>

              <button
                onClick={handleOfferTeaching}
                className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
              >
                Start Teaching
              </button>
            </div>

            {/* Your Skills */}
            <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4">Your Skills</h3>
              <div className="flex flex-wrap gap-3">
                {currentUser.skills.map((skill, index) => (
                  <div key={index} className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 px-4 py-2 rounded-lg">
                    <span className="text-purple-300 font-medium">{skill}</span>
                  </div>
                ))}
                <button className="border-2 border-dashed border-purple-500/30 px-4 py-2 rounded-lg text-purple-400 hover:border-purple-500/50 hover:text-purple-300 transition-colors">
                  + Add Skill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Sessions Indicator */}
        <div className="fixed bottom-6 right-6">
          <div className="bg-slate-800/90 backdrop-blur-sm border border-purple-500/20 rounded-full px-4 py-2 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">{activeUsers.length} online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartLearning;