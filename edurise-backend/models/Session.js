import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const NoteSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  videoTime: {
    type: String,
    default: '00:00'
  },
  tags: [{
    type: String
  }],
  isStarred: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SessionSchema = new mongoose.Schema({
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  learner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  skill: {
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },
  sessionType: {
    type: String,
    enum: ['video', 'audio', 'chat'],
    default: 'video'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'ongoing', 'completed', 'cancelled'],
    default: 'pending'
  },
  /** Users who called PUT /session/:id/join (both required before status → ongoing). */
  participantsJoined: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  scheduledAt: {
    type: Date
  },
  topic: {
    type: String,
    default: 'General'
  },
  // tokens per minute (e.g. 1/30 means 1 token per 30 minutes)
  tokenRate: {
    type: Number
  },
  duration: {
    scheduled: {
      type: Number, // in minutes
      default: 60
    },
    actual: {
      type: Number // in minutes
    }
  },
  tokensExchanged: {
    type: Number,
    default: 0
  },
  // Token Economy (v2): who taught whom flags, processed guard
  a_taught_b: { type: Boolean, default: false },
  b_taught_a: { type: Boolean, default: false },
  tokensProcessed: { type: Boolean, default: false },
  chatMessages: [MessageSchema],
  notes: [NoteSchema],
  feedback: {
    instructorFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      submittedAt: Date
    },
    learnerFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      submittedAt: Date
    }
  },
  sessionMetadata: {
    roomId: String,
    recordingUrl: String,
    sharedFiles: [{
      name: String,
      url: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startTime: Date,
  endTime: Date
});

SessionSchema.set('toJSON', { virtuals: true });
SessionSchema.set('toObject', { virtuals: true });
/** Creator / initiator (same as instructor). */
SessionSchema.virtual('userA').get(function() {
  return this.instructor;
});
/** Invited peer (same as learner). */
SessionSchema.virtual('userB').get(function() {
  return this.learner;
});

// Index for efficient queries
SessionSchema.index({ instructor: 1, status: 1 });
SessionSchema.index({ learner: 1, status: 1 });
SessionSchema.index({ createdAt: -1 });

// Virtual for session duration calculation
SessionSchema.virtual('actualDuration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // in minutes
  }
  return null;
});

// Method to add chat message
SessionSchema.methods.addChatMessage = function(senderId, message) {
  this.chatMessages.push({
    sender: senderId,
    message: message,
    timestamp: new Date()
  });
  return this.save();
};

SessionSchema.methods.addNote = function(authorId, noteData) {
  this.notes.push({
    author: authorId,
    ...noteData,
    createdAt: new Date()
  });
  return this.save();
};

// Static method to find active sessions for user
const LIVE_SESSION_STATUSES = ['pending', 'active', 'ongoing'];

SessionSchema.statics.findActiveForUser = function(userId) {
  return this.find({
    $or: [
      { instructor: userId },
      { learner: userId }
    ],
    status: { $in: LIVE_SESSION_STATUSES }
  }).populate('instructor learner', 'name email avatar skills');
};

export { LIVE_SESSION_STATUSES };

export default mongoose.model('Session', SessionSchema);