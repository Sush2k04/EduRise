# 🔍 Token Settlement Debugging Guide

## Issue Identified
Tokens are not updating after session ends. The balance stays the same and no transactions appear in the token history page.

## Root Cause Analysis

### Changes Made
We've added comprehensive logging to trace the exact point where token settlement is failing:

1. **Session Controller (`endSession`)** - Detailed logs for session state
2. **Token Service (`processSessionTokens`)** - Step-by-step guard checks  
3. **Token Service (`earn` & `spend`)** - Transaction creation logging

---

## How to Debug

### Step 1: Open Backend Server Logs
Run your backend and watch the console output:

```bash
cd d:\Edurise-Update 2\edurise-backend
npm start
# OR if using nodemon
nodemon server.js
```

### Step 2: Perform a Test Session
1. Start a session on frontend
2. Connect both users (at least join the session)
3. Click "End Session" button
4. Watch backend logs for messages starting with `[SessionEnd]` and `[Tokens]`

### Step 3: Read the Debug Output

#### Expected Output (Success):
```
[SessionEnd] Session 507f1f77bcf36cd796111111:
{
  status: 'completed',
  tokensProcessed: false,
  duration: { scheduled: 60, actual: 5 },
  instructor: ObjectId(...),
  learner: ObjectId(...)
}

[SessionEnd] Triggering token settlement for session 507f1f77bcf36cd796111111

[Tokens] Processing session 507f1f77bcf36cd796111111, minDuration: 5 mins

[Tokens] Session fetched: {
  exists: true,
  status: 'completed',
  tokensProcessed: false,
  instructor: ObjectId(...),
  learner: ObjectId(...),
  duration: { scheduled: 60, actual: 5 }
}

[Tokens] Session 507f1f77bcf36cd796111111: All guards passed. Processing settlement...

[Tokens] User ObjectId(inst...) earning 1 token
[Tokens] User ObjectId(inst...) balances before earn: { tokenBalance: 5, tokens: 5, totalEarned: 0 }
[Tokens] User ObjectId(inst...) saved after earn: { tokenBalance: 6, tokens: 6, totalEarned: 1 }

[Tokens] User ObjectId(learn...) spending 1 token
[Tokens] User ObjectId(learn...) balances before spend: { tokenBalance: 5, tokens: 5, totalSpent: 0 }
[Tokens] User ObjectId(learn...) saved after spend: { tokenBalance: 4, tokens: 4, totalSpent: 1 }

[Tokens] Session 507f1f77bcf36cd796111111: ✅ Settlement complete! Instructor +1, Learner -1

[SessionEnd] Token settlement completed for session 507f1f77bcf36cd796111111
```

---

## Common Failure Scenarios

### ❌ Scenario 1: Wrong Status
```
[SessionEnd] Token settlement skipped - status check failed. 
Status: pending, tokensProcessed: false
```

**Cause**: Session status is not "completed"  
**Solution**: Check that session.status = 'completed' is being set in endSession()

### ❌ Scenario 2: Duration Too Short
```
[Tokens] Session 507f1f77bcf36cd796111111: Duration too short (2/5 mins). 
Tokens not awarded.
```

**Cause**: Actual session duration is less than 5 minutes  
**Solution**: Join session and keep it active for at least 5 minutes before ending

### ❌ Scenario 3: Learner Not Set
```
[Tokens] Session 507f1f77bcf36cd796111111: ❌ Learner not set
```

**Cause**: Session created without learner (possible with solo sessions)  
**Solution**: Ensure session is started with both instructor and learner via `startSessionWithPeer()`

### ❌ Scenario 4: Insufficient Tokens
```
[Tokens] spend() error: Insufficient tokens
```

**Cause**: Learner doesn't have enough tokens to pay 1 token cost  
**Solution**: Give learner starting tokens (test environment only)

### ❌ Scenario 5: User Not Found
```
[Tokens] User 507f1f77bcf36cd796111111 not found for earn()
```

**Cause**: User ID is invalid or user deleted  
**Solution**: Verify user exists in database

---

## Database Queries for Testing

### Check Session State
```javascript
// In MongoDB shell or MongoDB Compass
db.sessions.findOne({ _id: ObjectId("507f1f77bcf36cd796111111") })

// Look for:
// - status: "completed"
// - tokensProcessed: true (after settlement)
// - duration.actual: 5+ (in minutes)
// - instructor: ObjectId (should exist)
// - learner: ObjectId (should exist)
```

### Check User Token Balance
```javascript
db.users.findOne({ _id: ObjectId("507f1f77bcf36cd796111111") })

// Look for:
// - tokenBalance: number (should be updated)
// - tokens: number (legacy sync)
// - totalEarned: number (should increase for instructor)
// - totalSpent: number (should increase for learner)
```

### Check Transactions
```javascript
db.tokentransactions.find({ 
  userId: ObjectId("507f1f77bcf36cd796111111")
}).sort({ createdAt: -1 })

// Should see +1 (teach) for instructor, -1 (learn) for learner
```

---

## API Response Verification

### Check Session End Response
The `sessionAPI.end()` response should now include token settlement info:

```javascript
{
  success: true,
  message: "Session ended successfully",
  sessionId: "507f1f77bcf36cd796111111",
  status: "completed",
  tokensProcessed: true,    // Should be TRUE after settlement
  tokensExchanged: 1        // Should be 1
}
```

If `tokensProcessed` is false, the settlement didn't happen yet. Check console logs.

---

## Frontend Token History Page

### Check /token-history Page
After token settlement:

1. Visit http://localhost:5173/token-history
2. Verify:
   - Balance increased (for instructor) or decreased (for learner)
   - Transaction appears in history with type "teach" or "learn"
   - Amount shown is +1 or -1
   - Timestamp is recent

### If Not Updating:
1. ✅ Hard refresh: `Ctrl + Shift + R` (clear cache)
2. ✅ Check TokenBadge in navigation - does balance update there?
3. ✅ Fetch token balance directly: Check API response for `/token/balance`

---

## Testing Checklist

### ✅ Pre-Test Setup
- [ ] Backend running with console visible
- [ ] Both users logged in and on different devices/browsers
- [ ] Users are connected (have accepted connection request)
- [ ] Starting tokens set (test both users have at least 1 token)

### ✅ During Test
- [ ] Step 1: Click "Start Learning" to create session
- [ ] Step 2: Other user accepts session invite
- [ ] Step 3: Both users click "Join" to start video
- [ ] Step 4: Keep session active for at least 5 minutes
- [ ] Step 5: One user clicks "End Session" button
- [ ] Step 6: Check backend logs for [SessionEnd] and [Tokens] messages

### ✅ Post-Test Verification
- [ ] Backend shows settlement completed logs
- [ ] tokensProcessed in response is `true`
- [ ] Check database: User token balances updated
- [ ] Check database: TokenTransaction records created
- [ ] Visit /token-history: See new transaction
- [ ] TokenBadge in navbar shows updated balance

---

## Log Levels by Status

| Log Level | Meaning | Action |
|-----------|---------|--------|
| `[SessionEnd]` info log | Integration point working | ✅ Normal |
| `[Tokens]` info log | Token processing running | ✅ Normal |
| `ERROR` in red | Something failed | ⚠️ Check message |
| No logs at all | endSession not called | ⚠️ Button not wired |

---

## Quick Fixes to Try

### 1. If No [SessionEnd] Logs Appear
**Problem**: endSession() not being called

**Check**:
```javascript
// In Session.jsx line 406
await sessionAPI.end(sessionId, {});
// Is this being reached?
```

Add console.log before API call:
```javascript
console.log('[Frontend] Calling sessionAPI.end() for session:', sessionId);
await sessionAPI.end(sessionId, {});
```

### 2. If Duration Shows as 0 or Negative
**Problem**: startTime not set when session created

**Check**: Session creation stores startTime?
```javascript
const session = new Session({
  // ... 
  startTime: new Date(),  // Should be set at creation or join?
})
```

### 3. If Learner is Null
**Problem**: Session created without learner field

**Check startSessionWithPeer** in sessionController:
```javascript
const session = new Session({
  instructor: req.user.id,
  learner: peerUserId,  // Must be set
  // ...
})
```

---

## Performance Notes

**Token Settlement Timing**:
- Called immediately when session ends
- Non-blocking (errors don't fail session response)
- Should complete in < 100ms typical
- If slower: Check if user documents are locked/slow

**Database Indexes**:
- Ensure User collection is indexed on `_id`
- TokenTransaction can be slower with millions of records (add createdAt index)

---

## Next Steps

1. **Run a test session** with logs visible
2. **Screenshot/copy** the [SessionEnd] and [Tokens] logs
3. **Compare** with expected output above
4. **Identify** which guard is returning early
5. **Fix** the root cause based on scenario above

---

## File Changes Summary

### Modified Files:
1. `controllers/sessionController.js`
   - Enhanced logging in endSession()
   - Better error messages
   - Response now includes token status

2. `services/tokenService.js`
   - Comprehensive logging in processSessionTokens()
   - Detailed logs in earn() and spend()
   - Clear guard check messages

### What to Monitor:
- Filter backend logs for `[SessionEnd]` 
- Filter backend logs for `[Tokens]`
- Check HTTP response status: should be 200
- Check tokensProcessed in response

---

## Support

If tokens still don't update after implementing this guide:

1. **Share backend logs** showing [SessionEnd] and [Tokens] messages
2. **Check MongoDB directly** - did documents actually update?
3. **Verify session.learner** is set (not null) by checking DB
4. **Watch the endSession() response** - check tokensProcessed value

The new logging will show exactly which step is failing! 🔍
