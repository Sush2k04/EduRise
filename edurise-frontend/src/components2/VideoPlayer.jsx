import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  RotateCcw,
  SkipForward,
  SkipBack
} from 'lucide-react';

const VideoPlayer = ({
  isPlaying,
  setIsPlaying,
  isMuted,
  setIsMuted,
  volume,
  setVolume,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  isFullscreen,
  setIsFullscreen
}) => {
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('HD');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [setCurrentTime, setDuration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play();
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    video.volume = volume / 100;
  }, [isMuted, volume]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    video.currentTime = newTime;
  };

  const skipTime = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const toggleFullscreen = () => {
    const videoContainer = videoRef.current?.parentElement;
    if (!videoContainer) return;

    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSpeedChange = (speed) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettings(false);
  };

  return (
    <div 
      className="relative bg-black rounded-2xl overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-video object-cover"
        onClick={togglePlay}
        poster="/api/placeholder/800/450"
      >
        <source src="/demo-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Demo Video Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
          <h3 className="text-xl font-semibold mb-2">EduRise Demo Video</h3>
          <p className="text-gray-300">Click to start the demo</p>
        </div>
      </div>

      {/* Video Controls Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        
        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 hover:scale-110"
          >
            {isPlaying ? 
              <Pause className="w-8 h-8 text-white" /> : 
              <Play className="w-8 h-8 text-white ml-1" />
            }
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div
              ref={progressBarRef}
              className="w-full h-2 bg-white/20 rounded-full cursor-pointer hover:h-3 transition-all duration-200"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              >
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"></div>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? 
                  <Pause className="w-6 h-6 text-white" /> : 
                  <Play className="w-6 h-6 text-white" />
                }
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => skipTime(-10)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <SkipBack className="w-5 h-5 text-white" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skipTime(10)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <SkipForward className="w-5 h-5 text-white" />
              </button>

              {/* Volume Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isMuted ? 
                    <VolumeX className="w-5 h-5 text-white" /> : 
                    <Volume2 className="w-5 h-5 text-white" />
                  }
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer volume-slider"
                />
              </div>

              {/* Time Display */}
              <div className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration || 0)}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>

                {/* Settings Dropdown */}
                {showSettings && (
                  <div className="absolute bottom-12 right-0 bg-slate-800 border border-purple-500/20 rounded-lg p-4 min-w-48">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-white mb-2">Playback Speed</h4>
                      <div className="space-y-2">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            className={`block w-full text-left px-3 py-1 rounded text-sm transition-colors ${
                              playbackSpeed === speed
                                ? 'bg-purple-500 text-white'
                                : 'text-gray-300 hover:bg-purple-500/20'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Quality</h4>
                      <div className="space-y-2">
                        {['Auto', 'HD', '720p', '480p'].map((qual) => (
                          <button
                            key={qual}
                            onClick={() => setQuality(qual)}
                            className={`block w-full text-left px-3 py-1 rounded text-sm transition-colors ${
                              quality === qual
                                ? 'bg-purple-500 text-white'
                                : 'text-gray-300 hover:bg-purple-500/20'
                            }`}
                          >
                            {qual}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <Maximize className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span>LIVE DEMO</span>
      </div>
    </div>
  );
};

export default VideoPlayer;