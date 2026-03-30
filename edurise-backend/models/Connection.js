import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

connectionSchema.index({ from: 1, to: 1 }, { unique: true });
connectionSchema.index({ to: 1, status: 1, createdAt: -1 });

export default mongoose.model('Connection', connectionSchema);

