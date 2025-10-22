import React, { useState } from 'react';
import { 
  Star, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare,
  Award,
  Target,
  BookOpen,
  Clock,
  TrendingUp
} from 'lucide-react';

const FeedbackSection = ({ socket, sessionId }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedbackType, setFeedbackType] = useState('session'); // session, instructor, overall

  const feedbackTags = {
    session: [
      { id: 'clear', label: 'Clear Explanation', icon: '💡' },
      { id: 'helpful', label: 'Very Helpful', icon: '🙌' },
      { id: 'engaging', label: 'Engaging', icon: '⭐' },
      { id: 'patient', label: 'Patient', icon: '😌' },
      { id: 'knowledgeable', label: 'Knowledgeable', icon: '🧠' },
      { id: 'prepared', label: 'Well Prepared', icon: '📚' }
    ],
    improvement: [
      { id: 'audio', label: 'Audio Quality', icon: '🔊' },
      { id: 'pace', label: 'Teaching Pace', icon: '⏱️' },
      { id: 'examples', label: 'More Examples', icon: '📝' },
      { id: 'interaction', label: 'More Interaction', icon: '💬' },
      { id: 'materials', label: 'Study Materials', icon: '📖' },
      { id: 'practice', label: 'Practice Time', icon: '🎯' }
    ]
  };

  const quickFeedbacks = [
    { type: 'positive', text: 'Excellent session! Very clear and helpful.', tags: ['clear', 'helpful'] },
    { type: 'positive', text: 'Great teaching style, easy to follow along.', tags: ['engaging', 'clear'] },
    { type: 'neutral', text: 'Good session, could use more examples.', tags: ['helpful', 'examples'] },
    { type: 'positive', text: 'Perfect pace and very patient with questions.', tags: ['patient', 'pace'] }
  ];

  const handleRatingClick = (value) => {
    setRating(value);
  };

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleQuickFeedback = (quickFeedback) => {
    setFeedback(quickFeedback.text);
    setSelectedTags(quickFeedback.tags);
    setRating(quickFeedback.type === 'positive' ? 5 : quickFeedback.type === 'neutral' ? 3 : 2);
  };

  const handleSubmitFeedback = () => {
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }

    const feedbackData = {
      rating,
      comment: feedback,
      tags: selectedTags,
      type: feedbackType,
      timestamp: new Date().toISOString()
    };

    // Emit feedback to socket
    if (socket) {
      socket.emit('submit-feedback', {
        sessionId,
        feedback: feedbackData,
        reviewer: {
          id: 'current-user', // Replace with actual user ID
          name: 'Your Name'
        }
      });
    }

    setHasSubmitted(true);
  };

  if (hasSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <Award className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Thank You!</h3>
        <p className="text-gray-400 mb-4">Your feedback has been submitted successfully.</p>
        <div className="bg-slate-700/50 rounded-lg p-4 w-full">
          <div className="flex items-center justify-center space-x-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-300">{feedback}</p>
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedTags.map(tagId => {
                const tag = [...feedbackTags.session, ...feedbackTags.improvement]
                  .find(t => t.id === tagId);
                return tag ? (
                  <span key={tagId} className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs">
                    {tag.icon} {tag.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-purple-500/20">
        <h3 className="font-semibold text-white mb-2">Session Feedback</h3>
        <p className="text-sm text-gray-400">Help improve the learning experience</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Rating */}
        <div className="text-center">
          <h4 className="text-sm font-medium text-white mb-3">How would you rate this session?</h4>
          <div className="flex justify-center space-x-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingClick(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-600 hover:text-yellow-400'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-400">
            {rating > 0 && (
              <span>
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            )}
          </div>
        </div>

        {/* Quick Feedback */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3">Quick Feedback</h4>
          <div className="space-y-2">
            {quickFeedbacks.map((quick, index) => (
              <button
                key={index}
                onClick={() => handleQuickFeedback(quick)}
                className="w-full text-left bg-slate-700/30 hover:bg-slate-700/50 border border-purple-500/20 rounded-lg p-3 transition-all"
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    quick.type === 'positive' ? 'bg-green-400' : 
                    quick.type === 'neutral' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></div>
                  <p className="text-sm text-gray-300">{quick.text}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3">What went well?</h4>
          <div className="grid grid-cols-2 gap-2">
            {feedbackTags.session.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagToggle(tag.id)}
                className={`p-2 rounded-lg text-xs transition-all ${
                  selectedTags.includes(tag.id)
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-400'
                    : 'bg-slate-700/30 text-gray-400 border border-purple-500/20 hover:bg-slate-700/50'
                }`}
              >
                <span className="block">{tag.icon}</span>
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Improvement Areas */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3">Areas for improvement</h4>
          <div className="grid grid-cols-2 gap-2">
            {feedbackTags.improvement.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagToggle(tag.id)}
                className={`p-2 rounded-lg text-xs transition-all ${
                  selectedTags.includes(tag.id)
                    ? 'bg-orange-500/30 text-orange-300 border border-orange-400'
                    : 'bg-slate-700/30 text-gray-400 border border-purple-500/20 hover:bg-slate-700/50'
                }`}
              >
                <span className="block">{tag.icon}</span>
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Written Feedback */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3">Additional Comments</h4>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts about this session..."
            rows={4}
            className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors resize-none text-sm"
          />
        </div>

        {/* Session Stats Preview */}
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3">Session Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400">Duration: 45 min</span>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400">Notes: 5 taken</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-gray-400">Goals: 3/3 covered</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-400">Progress: +15%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-4 border-t border-purple-500/20">
        <button
          onClick={handleSubmitFeedback}
          disabled={rating === 0}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>Submit Feedback</span>
        </button>
        
        <p className="text-xs text-gray-500 text-center mt-2">
          Your feedback helps improve the platform for everyone
        </p>
      </div>
    </div>
  );
};

export default FeedbackSection;