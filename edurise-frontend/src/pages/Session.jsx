import React, { useState, useEffect, useRef } from 'react';
// import ChatSection from '../components2/ChatSection';
import ChatSectionLive from '../components3/ChatSectionLive';

import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  MessageCircle,
  StickyNote,
  Star,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Phone,
  Settings,
  Coins,
  Clock,
  Wifi
} from 'lucide-react';
import io from 'socket.io-client';

// Import our existing components
import ChatSection from '../components2/ChatSection';
import NotesSection from '../components2/NotesSection';
import FeedbackSection from '../components2/FeedbackSection';

const Session = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [sessionData, setSessionData] = useState(location.state?.sessionData || null);
  const [userRole, setUserRole] = useState(location.state?.userRole || 'learner');
  
  // WebRTC states
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Media states
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Session states
  const [sessionStatus, setSessionStatus] = useState('connecting');
  const [sessionTimer, setSessionTimer] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('good');

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    let interval;
    if (sessionStatus === 'active') {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStatus]);

  const initializeSession = async () => {
    try {
      // Initialize socket connection
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      setSocket(newSocket);

      // Join session room
      newSocket.emit('join-session', {
        sessionId,
        userInfo: {
          id: getCurrentUser().id,
          name: getCurrentUser().name,
          role: userRole
        }
      });

      // Set up WebRTC event listeners
      setupSocketListeners(newSocket);
      
      // Initialize WebRTC
      await initializeWebRTC();
      
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setSessionStatus('error');
    }
  };

  const setupSocketListeners = (socket) => {
    socket.on('user-joined-session', (data) => {
      console.log('User joined:', data);
      setSessionStatus('active');
    });

    socket.on('webrtc-offer', async (data) => {
      await handleOffer(data.offer, data.from);
    });

    socket.on('webrtc-answer', async (data) => {
      await handleAnswer(data.answer);
    });

    socket.on('webrtc-ice-candidate', async (data) => {
      await handleIceCandidate(data.candidate);
    });

    socket.on('session-ended', (data) => {
      setSessionStatus('ended');
      // Show session summary or redirect
    });
  };

  const initializeWebRTC = async () => {
    try {
      // Create peer connection
      const pc = new RTCPeerConnection(rtcConfig);
      setPeerConnection(pc);

      // Set up peer connection event listeners
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc-ice-candidate', {
            sessionId,
            candidate: event.candidate
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        setIsConnected(pc.connectionState === 'connected');
        if (pc.connectionState === 'failed') {
          setConnectionQuality('poor');
        }
      };

      // Get user media
      await getUserMedia();
      
    } catch (error) {
      console.error('WebRTC initialization failed:', error);
    }
  };

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add stream to peer connection
      if (peerConnection) {
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
      }

      setIsMicOn(true);
      setIsVideoOn(true);
      
    } catch (error) {
      console.error('Failed to get user media:', error);
    }
  };

  const handleOffer = async (offer, from) => {
    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit('webrtc-answer', {
        sessionId,
        answer
      });
    } catch (error) {
      console.error('Handle offer failed:', error);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Handle answer failed:', error);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Handle ICE candidate failed:', error);
    }
  };

  const startCall = async () => {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socket.emit('webrtc-offer', {
        sessionId,
        offer
      });
    } catch (error) {
      console.error('Start call failed:', error);
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        
        // Replace video track in peer connection
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
        
        setIsScreenSharing(true);
        
        videoTrack.onended = () => {
          setIsScreenSharing(false);
          // Switch back to camera
          if (localStream) {
            const cameraTrack = localStream.getVideoTracks()[0];
            sender.replaceTrack(cameraTrack);
          }
        };
      } else {
        // Stop screen sharing and switch back to camera
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && localStream) {
          const cameraTrack = localStream.getVideoTracks()[0];
          await sender.replaceTrack(cameraTrack);
        }
        
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Screen share toggle failed:', error);
    }
  };

  const endSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      socket?.emit('end-session', { sessionId });
      cleanup();
      navigate('/start-learning');
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    if (socket) {
      socket.close();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentUser = () => ({
    id: 'current-user',
    name: 'Your Name',
    avatar: '🧑‍💻'
  });

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'good': return <Wifi className="w-4 h-4 text-green-400" />;
      case 'medium': return <Wifi className="w-4 h-4 text-yellow-400" />;
      case 'poor': return <Wifi className="w-4 h-4 text-red-400" />;
      default: return <Wifi className="w-4 h-4 text-green-400" />;
    }
  };

  if (sessionStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Session Error</h2>
          <p className="text-gray-400 mb-6">Failed to connect to the session</p>
          <button 
            onClick={() => navigate('/start-learning')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-full"
          >
            Back to Learning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-purple-500/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/start-learning')}
              className="p-2 hover:bg-purple-500/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">
                Learning Session - {sessionData?.skill || 'Peer Learning'}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>with {sessionData?.instructor?.name || sessionData?.learner?.name}</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(sessionTimer)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getConnectionIcon()}
                  <span className="capitalize">{connectionQuality}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              sessionStatus === 'active' ? 'bg-green-500/20 text-green-400' : 
              sessionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {sessionStatus}
            </div>
            
            {sessionData?.tokenRate && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full text-sm font-medium">
                Cost: {sessionData.tokenRate} tokens/hr
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid lg:grid-cols-3 gap-6">
        {/* Video Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96">
            {/* Remote Video */}
            <div className="relative bg-slate-800 rounded-2xl overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-sm text-white">
                  {sessionData?.instructor?.name || 'Peer'}
                </span>
              </div>
              {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-400">Connecting...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Local Video */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-sm text-white">You</span>
              </div>
              
              {!isVideoOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">{getCurrentUser().avatar}</span>
                    </div>
                    <p className="text-gray-400 text-sm">Camera Off</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Controls */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-center space-x-4">
              {/* Microphone */}
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full transition-all ${
                  isMicOn 
                    ? 'bg-slate-700 text-white hover:bg-slate-600' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              {/* Video */}
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-all ${
                  isVideoOn 
                    ? 'bg-slate-700 text-white hover:bg-slate-600' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Screen Share */}
              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition-all ${
                  isScreenSharing 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
              </button>

              {/* Start Call (if not connected) */}
              {!isConnected && sessionStatus === 'active' && (
                <button
                  onClick={startCall}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-full font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Start Call
                </button>
              )}

              {/* Settings */}
              <button className="p-3 bg-slate-700 text-white hover:bg-slate-600 rounded-full transition-all">
                <Settings className="w-5 h-5" />
              </button>

              {/* End Call */}
              <button
                onClick={endSession}
                className="p-3 bg-red-500 text-white hover:bg-red-600 rounded-full transition-all"
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl overflow-hidden">
            <div className="flex border-b border-purple-500/20">
              {[
                { id: 'chat', label: 'Chat', icon: MessageCircle },
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
              {activeTab === 'chat' && (
  <ChatSectionLive 
    socket={socket} 
    sessionId={sessionId} 
    currentUser={getCurrentUser()} 
  />
)}
              {activeTab === 'notes' && <NotesSection socket={socket} sessionId={sessionId} />}
              {activeTab === 'feedback' && <FeedbackSection socket={socket} sessionId={sessionId} />}
            </div>
          </div>

          {/* Session Info */}
          {sessionData && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <h4 className="font-semibold mb-4">Session Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Skill:</span>
                  <span className="text-white">{sessionData.skill}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">{formatTime(sessionTimer)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rate:</span>
                  <span className="text-yellow-400">{sessionData.tokenRate || 0} tokens/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`capitalize ${
                    sessionStatus === 'active' ? 'text-green-400' : 
                    sessionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {sessionStatus}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Session;