# 🏦 EduRise Barter Token System - Complete Guide

## Overview
The token system now uses a **fair barter exchange** model where tokens are exchanged based on skill matching and mutual teaching.

---

## 📊 Token System Rules

### **CASE 1: Barter/Reciprocal Teaching (Balanced Exchange)**
✅ **When Both Teach Each Other**

**Requirements:**
- Instructor teaches Learner skill X
- Learner WANTS to learn skill X ✓
- Learner can teach Instructor skill Y
- Instructor WANTS to learn skill Y ✓

**Token Exchange:**
```
Instructor:  +1 token (from teaching) → -1 token (from learning) = NET 0
Learner:     -1 token (from learning) → +1 token (from teaching) = NET 0
```
**Result:** ✅ isReciprocal: true | tokensExchanged: 0

---

### **CASE 2: One-Way Teaching (Unbalanced)**
🔄 **When Only One Person Teaches**

**Requirements:**
- Instructor teaches Learner skill X
- Learner WANTS to learn skill X ✓
- Learner CANNOT teach back anything instructor wants OR
- Learner doesn't want to reciprocate

**Token Exchange:**
```
Instructor:  +1 token (earned from teaching learner)
Learner:     -1 token (paid for learning)
```
**Result:** ❌ isReciprocal: false | tokensExchanged: +1

---

### **CASE 3: No Interest (No Exchange)**
🚫 **When Learner Doesn't Want to Learn**

**Requirements:**
- Instructor teaches skill X
- Learner does NOT want to learn skill X ✗

**Token Exchange:**
```
NO TOKENS EXCHANGED
```
**Result:** ❌ isReciprocal: false | tokensExchanged: 0

---

## 🔄 Example Scenarios

### **Scenario 1: Perfect Barter** ✨
```
User A (Instructor):
  - skillsToTeach: [JavaScript, React]
  - skillsToLearn: [Python, Data Science]
  - tokens: 10

User B (Learner):
  - skillsToTeach: [Python, Django]
  - skillsToLearn: [JavaScript, React]
  - tokens: 10

SESSION:
- A teaches B "JavaScript" 
- B wants to learn "JavaScript" ✓
- B can teach A "Python"
- A wants to learn "Python" ✓

RESULT:
  - A gets +1 (teaches B) → -1 (B teaches A) = 0 change → Final: 10 tokens
  - B gets -1 (learns from A) → +1 (teaches A) = 0 change → Final: 10 tokens
  - barterDetails.isReciprocal: true
  - barterDetails.tokensExchanged: 0
```

### **Scenario 2: One-Way Teaching** 📌
```
User A (Instructor):
  - skillsToTeach: [JavaScript]
  - skillsToLearn: [Python]
  - tokens: 10

User B (Learner):
  - skillsToTeach: [C++]  ← B doesn't have Python!
  - skillsToLearn: [JavaScript]
  - tokens: 10

SESSION:
- A teaches B "JavaScript"
- B wants to learn "JavaScript" ✓
- B cannot teach A "Python" ✗

RESULT:
  - A gets +1 (teaches B, B can't reciprocate) → Final: 11 tokens
  - B gets -1 (learns from A) → Final: 9 tokens
  - barterDetails.isReciprocal: false
  - barterDetails.tokensExchanged: +1
```

### **Scenario 3: No Interest** 🛑
```
User A (Instructor):
  - skillsToTeach: [JavaScript]
  - tokens: 10

User B (Learner):
  - skillsToLearn: [Python]  ← NOT JavaScript!
  - tokens: 10

SESSION:
- A teaches B "JavaScript"
- B does NOT want to learn "JavaScript" ✗

RESULT:
  - A gets 0 (B didn't want to learn) → Final: 10 tokens
  - B gets 0 (not interested) → Final: 10 tokens
  - barterDetails.instructorTeachingWanted: false
  - barterDetails.tokensExchanged: 0
```

---

## 🔧 Implementation Details

### **Backend Changes**

#### **1. Session Model** (`models/Session.js`)
```javascript
barterSystem: {
  instructorTeachingWanted: Boolean,     // Did learner want to learn?
  learnerCanTeachBack: Boolean,          // Does learner have matching skill?
  isReciprocal: Boolean,                 // Both exchange (net = 0)?
  learnerTaughtBackSkill: {
    name: String                         // What skill did learner teach back?
  }
}
```

#### **2. Session Controller** (`controllers/sessionController.js`)
Updated `endSession()` function with:
- Skill matching logic
- Case detection (Barter/One-way/No interest)
- Token calculation
- Detailed console logging for debugging

### **How Token Exchange Works**

```javascript
// 1. Get both users' skill lists
const instructorSkillsToTeach = instructor.skillsToTeach || [];
const instructorSkillsToLearn = instructor.skillsToLearn || [];
const learnerSkillsToLearn = learner.skillsToLearn || [];
const learnerSkillsToTeach = learner.skillsToTeach || [];

// 2. Check if learner wants what instructor teaches
const doesLearnerWantToLearn = 
  learnerSkillsToLearn.includes(session.skill.name);

// 3. Check if learner can teach something instructor wants
const canLearnerTeachBack = 
  learnerSkillsToTeach.some(skill => 
    instructorSkillsToLearn.includes(skill)
  );

// 4. Apply token logic
if (doesLearnerWantToLearn) {
  if (canLearnerTeachBack) {
    // CASE 1: Barter - NET = 0
    instructor.tokens += 0;
    learner.tokens += 0;
  } else {
    // CASE 2: One-way - A gets +1, B gets -1
    instructor.tokens += 1;
    learner.tokens -= 1;
  }
} else {
  // CASE 3: No interest - NO CHANGE
  instructor.tokens += 0;
  learner.tokens += 0;
}
```

---

## 📡 API Response

### **End Session Request**
```bash
PUT /api/session/{sessionId}/end
{
  "feedback": { "rating": 5, "comment": "Great session!" },
  "notes": []
}
```

### **End Session Response**
```json
{
  "success": true,
  "message": "Session ended successfully",
  "barterDetails": {
    "instructorTeachingWanted": true,
    "learnerCanTeachBack": true,
    "isReciprocal": true,
    "learnerTaughtBackSkill": {
      "name": "Python"
    }
  }
}
```

---

## 🧪 Testing the System

### **Test Case 1: Barter (Net = 0)**
```bash
# User A Setup
Profile:
  - Skills to teach: JavaScript, React
  - Skills to learn: Python, Django
  - Initial tokens: 10

# User B Setup
Profile:
  - Skills to teach: Python, Django
  - Skills to learn: JavaScript, React
  - Initial tokens: 10

# Create Session
A (instructor) teaches JavaScript to B (learner)

# Expected Result
# A: 10 tokens (no change)
# B: 10 tokens (no change)
# isReciprocal: true
```

### **Test Case 2: One-Way**
```bash
# User A Setup
Profile:
  - Skills to teach: JavaScript
  - Skills to learn: Python
  - Initial tokens: 10

# User B Setup
Profile:
  - Skills to teach: C++ (NOT Python!)
  - Skills to learn: JavaScript
  - Initial tokens: 10

# Create Session
A teaches JavaScript to B

# Expected Result
# A: 11 tokens (+1)
# B: 9 tokens (-1)
# isReciprocal: false
```

---

## 🐛 Debugging

Check backend logs (listen for `[Barter]` prefix):
```
[Barter] Skill taught: javascript
[Barter] Learner wants to learn: true
[Barter] Learner skills to teach: [python, django]
[Barter] Instructor skills to learn: [python]
[Barter] Learner can teach back: true
[Barter] CASE 1: Reciprocal teaching (Barter) - NET = 0 tokens
[Barter] Token update - Instructor: 0, Learner: 0
```

---

## ⚠️ Important Notes

1. **Skill Matching** is case-insensitive
   - "JavaScript" = "javascript" = "JavaScript"

2. **Tokens Update in Real-Time**
   - Check User model for current token balance

3. **Barter System is Automatic**
   - No need to manually specify which case applies
   - Backend automatically detects based on skill arrays

4. **Logging**
   - All token exchanges are logged with `[Barter]` prefix
   - Use backend console to debug issues

---

## 🎯 Key Feature: Skill Syncing

When you update profile skills:
```javascript
// Changes to Profile.skillsOffer/skillsLearn
// Automatically sync to User.skillsToTeach/skillsToLearn
```

This ensures:
- Real-time matching
- Accurate token calculations
- Unified data across system

