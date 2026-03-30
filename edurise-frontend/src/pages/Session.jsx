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
import { getCurrentUser as getStoredUser } from '../services/api';
import { tddsAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { formatScoreAsPercentage } from '../utils/timeFormat';
import { sessionAPI } from '../services/api';
import { tokenAPI } from '../services/api';

// Import our existing components
import ChatSection from '../components2/ChatSection';
import NotesSection from '../components2/NotesSection';
import FeedbackSection from '../components2/FeedbackSection';

const isLiveSessionUI = (s) => s === 'active' || s === 'ongoing';

const Session = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [sessionData, setSessionData] = useState(location.state?.sessionData || null);
  const [userRole] = useState(location.state?.userRole || 'learner');
  const [sessionLoadError, setSessionLoadError] = useState('');
  
  // WebRTC states
  const [localStream, setLocalStream] = useState(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  
  // Media states
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Session states
  const [sessionStatus, setSessionStatus] = useState('connecting');
  const [sessionTimer, setSessionTimer] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [tddsResult, setTddsResult] = useState(null);
  const [tddsRecording, setTddsRecording] = useState(false);
  const [tddsAnalyzing, setTddsAnalyzing] = useState(false);
  const [tddsTranscript, setTddsTranscript] = useState('');
  const [sessionLoading, setSessionLoading] = useState(false);
  const chatMessagesRef = useRef([]);

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
    // If page was opened directly (no navigation state), fetch session data
    (async () => {
      if (sessionData) return;
      try {
        setSessionLoading(true);
        setSessionLoadError('');
        const s = await sessionAPI.getById(sessionId);
        // Normalize for UI: prefer skill.name
        setSessionData({
          ...s,
          skill: s?.skill?.name || s?.topic || 'Peer Learning',
          tokenRate: s?.tokenRate,
          status: s?.status
        });
        if (s?.status === 'ongoing' || s?.status === 'active') {
          setSessionStatus('ongoing');
        } else if (s?.status === 'pending') {
          setSessionStatus('connecting');
        }
      } catch (e) {
        setSessionLoadError(e.message);
      } finally {
        setSessionLoading(false);
      }
    })();
  }, [sessionId]);

  useEffect(() => {
    let interval;
    if (isLiveSessionUI(sessionStatus)) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStatus]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        await sessionAPI.join(sessionId);
      } catch (e) {
        if (!cancelled) console.warn('Session join:', e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const initializeSession = async () => {
    try {
      // Initialize socket connection
      const newSocket = getSocket();
      setSocket(newSocket);
      socketRef.current = newSocket;

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
      await initializeWebRTC(newSocket);
      
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setSessionStatus('error');
    }
  };

  const setupSocketListeners = (socket) => {
    socket.on('session-joined', (data) => {
      // The second participant to join becomes the initiator (creates offer)
      setIsInitiator(data?.participants === 2);
    });

    socket.on('user-joined-session', () => {
      setSessionStatus('ongoing');
    });

    socket.on('session-started', () => {
      setSessionStatus('ongoing');
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

    socket.on('session-ended', () => {
      setSessionStatus('ended');
      // Show session summary or redirect
    });
  };

  const initializeWebRTC = async (socketForIce) => {
    try {
      // Create peer connection
      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;

      // Set up peer connection event listeners
      pc.onicecandidate = (event) => {
        if (event.candidate && socketForIce) {
          socketForIce.emit('webrtc-ice-candidate', {
            sessionId,
            candidate: event.candidate
          });
        }
      };

      pc.ontrack = (event) => {
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
      await getUserMedia(pc);
      
    } catch (error) {
      console.error('WebRTC initialization failed:', error);
    }
  };

  const getUserMedia = async (pc) => {
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
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      setIsMicOn(true);
      setIsVideoOn(true);
      
    } catch (error) {
      console.error('Failed to get user media:', error);
    }
  };

  const handleOffer = async (offer) => {
    try {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socketRef.current?.emit('webrtc-answer', {
        sessionId,
        answer
      });
    } catch (error) {
      console.error('Handle offer failed:', error);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Handle answer failed:', error);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Handle ICE candidate failed:', error);
    }
  };

  const startCall = async () => {
    try {
      const pc = pcRef.current;
      if (!pc) return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socketRef.current?.emit('webrtc-offer', {
        sessionId,
        offer
      });
    } catch (error) {
      console.error('Start call failed:', error);
    }
  };

  useEffect(() => {
    // Auto-start call when active and you're the initiator
    if (!isLiveSessionUI(sessionStatus)) return;
    if (!isInitiator) return;
    if (!pcRef.current) return;
    if (!localStream) return;
    if (pcRef.current.signalingState !== 'stable') return;
    startCall();
  }, [sessionStatus, isInitiator, localStream]);

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
        const sender = pcRef.current?.getSenders().find(s => 
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
        const sender = pcRef.current?.getSenders().find(s => 
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

  const endSession = async () => {
    if (!window.confirm('Are you sure you want to end this session?')) return;
    // Enhanced TDDS (v2): analyze chat transcript at end (non-blocking)
    try {
      const transcript = chatMessagesRef.current.join('\n');
      const topic = getSkillLabel() || 'general';
      if ((transcript || '').trim().length > 10) {
        await tddsAPI.analyzeSession({ sessionId, transcript, topic });
      }
    } catch (err) {
      console.error('TDDS analysis failed:', err);
    }
    try {
      await sessionAPI.end(sessionId, {});
    } catch (e) {
      console.warn('End session API:', e.message);
    }
    socket?.emit('end-session', { sessionId });
    cleanup();
    navigate('/dashboard');
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (pcRef.current) pcRef.current.close();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentUser = () => {
    const u = getStoredUser();
    return {
      id: u?.id || 'anonymous',
      name: u?.name || 'Anonymous',
      avatar: u?.avatar || '🧑‍💻'
    };
  };

  const getSkillLabel = () => {
    const s = sessionData?.skill;
    if (!s) return sessionData?.topic || 'Peer Learning';
    if (typeof s === 'string') return s;
    if (typeof s === 'object') return s?.name || sessionData?.topic || 'Peer Learning';
    return sessionData?.topic || 'Peer Learning';
  };

  const isHost = () => {
    const me = getCurrentUser();
    // Check against _id because instructor is populated from MongoDB
    return sessionData?.instructor?._id === String(me?.id);
  };

  const runTddsCheck = async () => {
    const topic = getSkillLabel() || 'General';

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    // Fallback when speech-to-text isn’t available
    if (!SpeechRecognition) {
      const transcript = window.prompt('Speech-to-text not supported here. Paste transcript text.');
      if (!transcript) return;
      try {
        const res = await tddsAPI.evaluate({ topic, transcript, sessionId });
        setTddsResult(res);
        setTddsTranscript(transcript);
      } catch (e) {
        alert(e.message);
      }
      return;
    }

    // Toggle: if already recording, ignore (we auto-stop on speech end)
    if (tddsRecording || tddsAnalyzing) return;

    setTddsResult(null);
    setTddsTranscript('');
    setTddsRecording(true);
    setTddsAnalyzing(false);

    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    recog.interimResults = true;
    recog.continuous = false; // stop after you finish speaking
    recog.maxAlternatives = 1;

    let finalText = '';
    let interimText = '';
    let lastTranscript = '';

    recog.onstart = () => {
      // Useful when debugging mic/speech recognition issues
      console.log('[TDDS] SpeechRecognition started');
    };

    recog.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalText += chunk;
        else interimText = chunk;
      }
      lastTranscript = (finalText + ' ' + interimText).trim();
      setTddsTranscript(lastTranscript);
    };

    recog.onerror = (err) => {
      setTddsRecording(false);
      setTddsAnalyzing(false);
      const reason = err?.error ? ` (${err.error})` : '';
      console.error('[TDDS] SpeechRecognition error:', err);
      alert(
        `Speech recognition failed${reason}. ` +
          'Check microphone permissions, make sure you are speaking, and try again.'
      );
    };

    recog.onend = async () => {
      setTddsRecording(false);
      const transcript = (lastTranscript || '').trim();
      if (!transcript) {
        alert('No speech detected. Please try again and speak clearly.');
        return;
      }

      setTddsAnalyzing(true);
      try {
        const res = await tddsAPI.evaluate({ topic, transcript, sessionId });
        setTddsResult(res);
        setTddsTranscript(transcript);
      } catch (e) {
        alert(e.message);
      } finally {
        setTddsAnalyzing(false);
      }
    };

    try {
      recog.start();
    } catch {
      setTddsRecording(false);
      setTddsAnalyzing(false);
    }
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'good': return <Wifi className="w-4 h-4 text-green-400" />;
      case 'medium': return <Wifi className="w-4 h-4 text-yellow-400" />;
      case 'poor': return <Wifi className="w-4 h-4 text-red-400" />;
      default: return <Wifi className="w-4 h-4 text-green-400" />;
    }
  };

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-slate-900/60 border border-purple-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-2">Loading session…</h2>
          {sessionLoading && <p className="text-gray-400">Fetching session details.</p>}
          {!sessionLoading && !sessionLoadError && (
            <p className="text-gray-400">Waiting for session data.</p>
          )}
          {sessionLoadError && (
            <div className="mt-3 text-sm text-red-400">
              {sessionLoadError}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-slate-800 border border-purple-500/20 px-4 py-2 rounded-lg"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/sessions')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg font-medium"
            >
              Back to Sessions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sessionStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Session Error</h2>
          <p className="text-gray-400 mb-2">Failed to connect to the session</p>
          {sessionLoadError && <p className="text-red-400 mb-6">{sessionLoadError}</p>}
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-full"
          >
            Back to dashboard
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
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-purple-500/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-xl font-bold">
                  Learning Session - {getSkillLabel()}
                </h1>
                {isHost() && (
                  <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-semibold">
                    HOST
                  </span>
                )}
              </div>
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
              isLiveSessionUI(sessionStatus) ? 'bg-green-500/20 text-green-400' : 
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

            {isHost() && (
              <button
                onClick={runTddsCheck}
                disabled={tddsRecording || tddsAnalyzing}
                className={`border border-purple-500/30 px-4 py-2 rounded-full text-sm hover:bg-slate-800 transition ${
                  tddsRecording || tddsAnalyzing
                    ? 'bg-slate-800/50 text-gray-400 cursor-not-allowed'
                    : 'bg-slate-800/70 text-white'
                }`}
              >
                {tddsRecording || tddsAnalyzing ? (
                  <span className="inline-flex items-center gap-2">
                    Analyzing...
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full" />
                  </span>
                ) : (
                  'TDDS Check'
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {tddsResult && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="p-3 bg-slate-800/60 border border-purple-500/20 rounded text-sm text-gray-200 flex flex-wrap gap-6">
            <div>
              <span className="text-gray-400">Relevance:</span>{' '}
              {Math.round((tddsResult.relevanceScore || 0) * 100)}%
            </div>
            <div>
              <span className="text-gray-400">Distraction delta:</span>{' '}
              {Math.round((tddsResult.distractionDelta || 0) * 100)}%
            </div>
            <div>
              <span className="text-gray-400">Your distractionScore:</span>{' '}
              {formatScoreAsPercentage(tddsResult.userDistractionScore)}
            </div>
          </div>
        </div>
      )}

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
              {!isConnected && isLiveSessionUI(sessionStatus) && (
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
    onTranscriptLine={(line) => {
      chatMessagesRef.current.push(line);
    }}
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
                  <span className="text-white">{getSkillLabel()}</span>
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
                    isLiveSessionUI(sessionStatus) ? 'text-green-400' : 
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