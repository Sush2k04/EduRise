import mongoose from 'mongoose';

const tokenTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // positive = earn, negative = spend
  type: { type: String, enum: ['initial', 'teach', 'learn', 'purchase'], required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('TokenTransaction', tokenTransactionSchema);

