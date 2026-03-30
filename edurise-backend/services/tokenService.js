import User from '../models/User.js';
import TokenTransaction from '../models/TokenTransaction.js';
import Session from '../models/Session.js';

function getNumberOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

async function ensureBalances(user) {
  // Migrate-on-read: if tokenBalance missing, seed from legacy `tokens`.
  if (typeof user.tokenBalance !== 'number') {
    user.tokenBalance = getNumberOr(user.tokens, 0);
  }
  if (typeof user.tokens !== 'number') {
    user.tokens = getNumberOr(user.tokenBalance, 0);
  }
  if (typeof user.totalEarned !== 'number') user.totalEarned = 0;
  if (typeof user.totalSpent !== 'number') user.totalSpent = 0;
}

const tokenService = {
  // Give tokens to a user (teaching reward)
  async earn(userId, amount, sessionId = null, type = 'teach') {
    try {
      console.log(`[Tokens] earn() called: userId=${userId}, amount=${amount}, type=${type}, sessionId=${sessionId}`);
      
      const user = await User.findById(userId);
      if (!user) {
        console.error(`[Tokens] User ${userId} not found for earn()`);
        throw new Error('User not found');
      }
      
      await ensureBalances(user);
      console.log(`[Tokens] User ${userId} balances before earn:`, { tokenBalance: user.tokenBalance, tokens: user.tokens, totalEarned: user.totalEarned });

      user.tokenBalance += amount;
      user.tokens += amount; // keep legacy UI in sync
      user.totalEarned += amount;
      await user.save();
      console.log(`[Tokens] User ${userId} saved after earn:`, { tokenBalance: user.tokenBalance, tokens: user.tokens, totalEarned: user.totalEarned });

      const transaction = await TokenTransaction.create({
        userId,
        amount,
        type,
        sessionId,
        description: `Earned ${amount} token(s) for ${type}`
      });
      console.log(`[Tokens] Transaction created for earn:`, transaction._id);

      return user.tokenBalance;
    } catch (err) {
      console.error(`[Tokens] earn() error:`, err.message);
      throw err;
    }
  },

  // Deduct tokens from a user (learning cost)
  async spend(userId, amount, sessionId = null, type = 'learn') {
    try {
      console.log(`[Tokens] spend() called: userId=${userId}, amount=${amount}, type=${type}, sessionId=${sessionId}`);
      
      const user = await User.findById(userId);
      if (!user) {
        console.error(`[Tokens] User ${userId} not found for spend()`);
        throw new Error('User not found');
      }
      
      await ensureBalances(user);
      console.log(`[Tokens] User ${userId} balances before spend:`, { tokenBalance: user.tokenBalance, tokens: user.tokens, totalSpent: user.totalSpent });

      if (user.tokenBalance < amount) {
        console.error(`[Tokens] User ${userId} has insufficient tokens: ${user.tokenBalance} < ${amount}`);
        throw new Error('Insufficient tokens');
      }
      
      user.tokenBalance -= amount;
      user.tokens -= amount; // keep legacy UI in sync
      user.totalSpent += amount;
      await user.save();
      console.log(`[Tokens] User ${userId} saved after spend:`, { tokenBalance: user.tokenBalance, tokens: user.tokens, totalSpent: user.totalSpent });

      const transaction = await TokenTransaction.create({
        userId,
        amount: -amount,
        type,
        sessionId,
        description: `Spent ${amount} token(s) for ${type}`
      });
      console.log(`[Tokens] Transaction created for spend:`, transaction._id);

      return user.tokenBalance;
    } catch (err) {
      console.error(`[Tokens] spend() error:`, err.message);
      throw err;
    }
  },

  async getBalance(userId) {
    const user = await User.findById(userId).select('tokenBalance totalEarned totalSpent tokens').lean();
    if (!user) throw new Error('User not found');

    const balance = typeof user.tokenBalance === 'number' ? user.tokenBalance : getNumberOr(user.tokens, 0);
    return {
      balance,
      totalEarned: getNumberOr(user.totalEarned, 0),
      totalSpent: getNumberOr(user.totalSpent, 0)
    };
  },

  async getHistory(userId, limit = 20) {
    return TokenTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sessionId', 'createdAt');
  },

  /**
   * Automatic Token Settlement (v3)
   * Called when a session completes successfully.
   * Instructor receives +1 token, Learner pays -1 token.
   * Only processes if:
   * - Session status is "completed"
   * - Actual duration >= MIN_DURATION (e.g., 5 minutes)
   * - Both instructor and learner exist
   * - Not already processed (tokensProcessed guard)
   */
  async processSessionTokens(sessionId, minDurationMinutes = 5) {
    try {
      console.log(`[Tokens] Processing session ${sessionId}, minDuration: ${minDurationMinutes} mins`);
      
      const session = await Session.findById(sessionId);
      console.log(`[Tokens] Session fetched:`, {
        exists: !!session,
        status: session?.status,
        tokensProcessed: session?.tokensProcessed,
        instructor: session?.instructor,
        learner: session?.learner,
        duration: session?.duration
      });
      
      // Guard: already processed or session doesn't exist
      if (!session) {
        console.log(`[Tokens] Session ${sessionId} not found`);
        return;
      }
      
      if (session.tokensProcessed) {
        console.log(`[Tokens] Session ${sessionId}: Already processed`);
        return;
      }
      
      // Guard: session not completed
      if (session.status !== 'completed') {
        console.log(`[Tokens] Session ${sessionId}: Status is "${session.status}", not "completed". Skipping.`);
        return;
      }
      
      // Guard: insufficient duration
      const actualDuration = session.duration?.actual ?? 0;
      console.log(`[Tokens] Session ${sessionId}: Actual duration = ${actualDuration} minutes (required: ${minDurationMinutes})`);
      
      if (actualDuration < minDurationMinutes) {
        console.log(`[Tokens] Session ${sessionId}: ❌ Duration too short (${actualDuration}/${minDurationMinutes} mins). Tokens not awarded.`);
        return;
      }
      
      // Guard: both participants required
      if (!session.instructor) {
        console.log(`[Tokens] Session ${sessionId}: ❌ Instructor not set`);
        return;
      }
      
      if (!session.learner) {
        console.log(`[Tokens] Session ${sessionId}: ❌ Learner not set`);
        return;
      }
      
      console.log(`[Tokens] Session ${sessionId}: All guards passed. Processing settlement...`);
      
      // Instructor (host) earns 1 token for teaching
      console.log(`[Tokens] Session ${sessionId}: Instructor ${session.instructor} earning 1 token`);
      await this.earn(session.instructor, 1, sessionId, 'teach');
      
      // Learner pays 1 token for learning
      console.log(`[Tokens] Session ${sessionId}: Learner ${session.learner} spending 1 token`);
      await this.spend(session.learner, 1, sessionId, 'learn');
      
      // Mark as processed to prevent double-processing
      session.tokensProcessed = true;
      session.tokensExchanged = 1;
      await session.save();
      console.log(`[Tokens] Session ${sessionId}: ✅ Settlement complete! Instructor +1, Learner -1`);
    } catch (err) {
      console.error(`[Tokens] Session ${sessionId}: ❌ Processing failed:`, err.message);
      console.error(`[Tokens] Full error:`, err);
      throw err;
    }
  }
};

export default tokenService;

