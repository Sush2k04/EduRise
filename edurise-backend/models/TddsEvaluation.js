import mongoose from 'mongoose';

const tddsEvaluationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', index: true },
    topic: { type: String, required: true },
    transcript: { type: String, required: true },
    relevanceScore: { type: Number, required: true, min: 0, max: 1 },
    distractionDelta: { type: Number, required: true, min: 0, max: 1 }
  },
  { timestamps: true }
);

tddsEvaluationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('TddsEvaluation', tddsEvaluationSchema);

