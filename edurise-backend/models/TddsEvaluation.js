import mongoose from 'mongoose';

const tddsEvaluationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', index: true },
    topic: { type: String, required: true },
    transcript: { type: String, required: true },
    relevanceScore: { type: Number, required: true, min: 0, max: 1 },
<<<<<<< HEAD
    distractionDelta: { type: Number, required: true, min: 0, max: 1 }
=======
    distractionDelta: { type: Number, required: true, min: 0, max: 1 },
    // TDDS v2 (optional): direct distraction score (0..1)
    distractionScore: { type: Number, min: 0, max: 1 }
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
  },
  { timestamps: true }
);

tddsEvaluationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('TddsEvaluation', tddsEvaluationSchema);

