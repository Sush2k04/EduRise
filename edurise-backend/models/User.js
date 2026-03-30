import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  skillsToTeach: [{
    type: String,
    trim: true,
    default: []
  }],
  skillsToLearn: [{
    type: String,
    trim: true,
    default: []
  }],
  availability: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evenings', 'Weekends', 'Flexible'],
    default: 'Evenings'
  },
  tokens: { 
    type: Number, 
    default: 5 
  },
  // Token Economy (v2). Kept alongside legacy `tokens` for backwards compatibility.
  tokenBalance: { type: Number, default: 5 },
  totalEarned: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  rating: { 
    type: Number, 
    default: 5,
    min: 1,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  ratingSum: {
    type: Number,
    default: 0,
    min: 0
  },
  sessionHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  distractionScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  avatar: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

export default mongoose.model('User', userSchema);