import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Hand,
  Phone,
  PhoneOff
} from 'lucide-react';

const MeetingControls = ({
  isMicOn,
  toggleMic,
  isCameraOn,
  toggleCamera,
  isScreenSharing,
  toggleScreenShare,
  endCall
}) => {
  return (
    <div className="flex items-center justify-center space-x-4 p-4 bg-slate-800/80 backdrop-blur-sm rounded-full shadow-lg border border-purple-500/20 absolute bottom-57 left-100  ">
      {/* Mic Button */}
      <button
        onClick={toggleMic}
        className={`p-3 rounded-full transition-colors duration-200 ${
          isMicOn ? 'bg-purple-500 hover:bg-purple-600' : 'bg-red-500 hover:bg-red-600'
        }`}
        title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
      >
        {isMicOn ? (
          <Mic className="w-5 h-5 text-white" />
        ) : (
          <MicOff className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Camera Button */}
      <button
        onClick={toggleCamera}
        className={`p-3 rounded-full transition-colors duration-200 ${
          isCameraOn ? 'bg-purple-500 hover:bg-purple-600' : 'bg-red-500 hover:bg-red-600'
        }`}
        title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
      >
        {isCameraOn ? (
          <Video className="w-5 h-5 text-white" />
        ) : (
          <VideoOff className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Screen Share Button */}
      <button
        onClick={toggleScreenShare}
        className={`p-3 rounded-full transition-colors duration-200 ${
          isScreenSharing ? 'bg-purple-500 hover:bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'
        }`}
        title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
      >
        {isScreenSharing ? (
          <MonitorOff className="w-5 h-5 text-white" />
        ) : (
          <Monitor className="w-5 h-5 text-white" />
        )}
      </button>

      {/* End Call Button */}
      <button
        onClick={endCall}
        className="p-3 bg-red-600 rounded-full hover:bg-red-700 transition-colors duration-200"
        title="Leave Meeting"
      >
        <PhoneOff className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};

export default MeetingControls;