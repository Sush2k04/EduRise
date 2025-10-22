import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Heart, ThumbsUp } from 'lucide-react';

const ChatSection = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      user: 'Sarah Chen',
      avatar: '👩‍💻',
      message: 'Welcome to the React.js demo session! Feel free to ask questions.',
      timestamp: '2:30 PM',
      isInstructor: true
    },
    {
      id: 2,
      user: 'Alex Kumar',
      avatar: '👨‍💼',
      message: 'This is amazing! How do you handle state management in large apps?',
      timestamp: '2:31 PM',
      isInstructor: false
    },
    {
      id: 3,
      user: 'Maria Rodriguez',
      avatar: '👩‍🎨',
      message: 'Great question! I was wondering the same thing.',
      timestamp: '2:31 PM',
      isInstructor: false,
      likes: 3
    },
    {
      id: 4,
      user: 'John Smith',
      avatar: '👨‍🔬',
      message: 'Can you show us how to implement useContext?',
      timestamp: '2:32 PM',
      isInstructor: false
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const emojis = ['😊', '👍', '❤️', '🤔', '😮', '👏', '🔥', '💯', '🙌', '🤝'];

  useEffect(() => {
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      user: 'You',
      avatar: '🧑‍💻',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isInstructor: false
    };

    setMessages([...messages, message]);
    setNewMessage('');
    
    // Simulate instructor response (for demo)
    if (newMessage.toLowerCase().includes('question')) {
      setTimeout(() => {
        const response = {
          id: messages.length + 2,
          user: 'Sarah Chen',
          avatar: '👩‍💻',
          message: 'Great question! Let me address that in the next section.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isInstructor: true
        };
        setMessages(prev => [...prev, response]);
      }, 2000);
    }
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const likeMessage = (messageId) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, likes: (msg.likes || 0) + 1 }
        : msg
    ));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Live Chat</h3>
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {['👩‍💻', '👨‍💼', '👩‍🎨', '👨‍🔬'].map((avatar, index) => (
                <div key={index} className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-800 text-sm">
                  {avatar}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-400">23 online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="group">
            <div className={`flex items-start space-x-3 ${message.isInstructor ? 'bg-purple-500/10 -mx-2 px-2 py-2 rounded-lg' : ''}`}>
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  message.isInstructor ? 'ring-2 ring-purple-400' : 'bg-slate-700'
                }`}>
                  {message.avatar}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`font-medium text-sm ${
                    message.isInstructor ? 'text-purple-400' : 'text-gray-300'
                  }`}>
                    {message.user}
                  </span>
                  {message.isInstructor && (
                    <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                      Instructor
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{message.timestamp}</span>
                </div>
                
                <p className="text-white text-sm mt-1 break-words">{message.message}</p>
                
                {message.likes && (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Heart className="w-3 h-3 text-red-400" />
                      <span>{message.likes} likes</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Message Actions */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                <button
                  onClick={() => likeMessage(message.id)}
                  className="p-1 hover:bg-purple-500/20 rounded-full transition-colors"
                >
                  <ThumbsUp className="w-3 h-3 text-gray-400 hover:text-purple-400" />
                </button>
                <button className="p-1 hover:bg-purple-500/20 rounded-full transition-colors">
                  <MoreVertical className="w-3 h-3 text-gray-400 hover:text-purple-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-purple-500/20">
        <form onSubmit={handleSendMessage} className="relative">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full bg-slate-700 border border-purple-500/20 rounded-full px-4 py-2 pr-20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
              />
              
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {/* Emoji Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1 hover:bg-purple-500/20 rounded-full transition-colors"
                  >
                    <Smile className="w-4 h-4 text-gray-400 hover:text-purple-400" />
                  </button>
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-8 right-0 bg-slate-800 border border-purple-500/20 rounded-lg p-3 grid grid-cols-5 gap-2 shadow-lg z-10">
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          className="w-8 h-8 hover:bg-purple-500/20 rounded transition-colors text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Attachment Button */}
                <button
                  type="button"
                  className="p-1 hover:bg-purple-500/20 rounded-full transition-colors"
                >
                  <Paperclip className="w-4 h-4 text-gray-400 hover:text-purple-400" />
                </button>
              </div>
            </div>
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </form>
        
        {/* Quick Actions */}
        <div className="flex items-center space-x-2 mt-3">
          <span className="text-xs text-gray-400">Quick reactions:</span>
          {['👍', '❤️', '🤔', '👏'].map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiClick(emoji)}
              className="text-sm hover:scale-110 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatSection;