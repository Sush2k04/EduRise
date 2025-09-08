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
  tokens: { 
    type: Number, 
    default: 5 
  },
  rating: { 
    type: Number, 
    default: 5,
    min: 1,
    max: 5
  },
  avatar: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

export default mongoose.model('User', userSchema);