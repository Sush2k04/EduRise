import React, { useState } from 'react';
import { Star } from 'lucide-react';

const FeedbackSection = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    // Here you would typically send the feedback to your backend
    console.log('Feedback submitted:', { rating, feedback });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-white" fill="currentColor" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Thank You!</h3>
        <p className="text-gray-400">Your feedback has been submitted successfully.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <h3 className="font-semibold text-white mb-6 text-center">Rate This Session</h3>
      
      <div className="flex-1">
        {/* Rating Stars */}
        <div className="flex justify-center mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="p-2 hover:scale-110 transition-transform"
            >
              <Star
                className="w-8 h-8"
                fill={star <= rating ? 'currentColor' : 'none'}
                color={star <= rating ? '#f59e0b' : '#9ca3af'}
              />
            </button>
          ))}
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-300 mb-2">
              Optional: Share your thoughts
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What did you like or how can we improve?"
              rows={4}
              className="w-full bg-slate-700 border border-purple-500/20 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors text-sm resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={rating === 0}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackSection;