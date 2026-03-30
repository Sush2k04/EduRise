import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  skillsOffer: [{ 
    type: String,
    trim: true
  }],
  skillsLearn: [{ 
    type: String,
    trim: true
  }],
  availability: { 
    type: String, 
    default: 'Evenings',
    enum: ['Morning', 'Afternoon', 'Evenings', 'Weekends', 'Flexible']
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  // Enhanced TDDS (v2): running averages (0..1)
  avgRelevanceScore: { type: Number, default: 0.5, min: 0, max: 1 },
  avgDistractionScore: { type: Number, default: 0.5, min: 0, max: 1 }
}, { 
  timestamps: true 
});

export default mongoose.model('Profile', profileSchema);