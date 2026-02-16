# myAja Backend - Mock API Server

This is a **mock backend server** for development and testing purposes.

## 🎯 Features

- ✅ CORS enabled for local development
- ✅ Mock authentication (signup/login)
- ✅ User profile management with onboarding data
- ✅ **Personalized supplement recommendations** based on user goals
- ✅ **Supplement intake tracking** with persistence
- ✅ **Progress tracking & analytics** (daily, weekly, monthly)
- ✅ **Dashboard aggregation** for overview
- ✅ In-memory data storage
- ⚠️ **NOT for production use**

## 📋 API Endpoints

### Authentication
**`POST /auth/signup`** - Create new account
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "mock_token_user_1_1234567890",
  "token_type": "bearer",
  "user": {
    "id": "user_1",
    "email": "user@example.com",
    "role": "user",
    "profile": {},
    "created_at": "2026-02-16T08:00:00.000Z",
    "updated_at": "2026-02-16T08:00:00.000Z"
  }
}
```

**`POST /auth/login`** - Authenticate user
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response: (same as signup)
```

### User Management
**`GET /users/me`** - Get current user (requires Authorization header)

**`GET /users/me/profile`** - Get user profile data

**`PUT /users/me/profile`** - Update user profile (called by onboarding)
```json
Request:
{
  "personal": {
    "name": "Marie Dupont",
    "sex": "female",
    "age_range": "31-45",
    "height_cm": 165,
    "weight_kg": 60
  },
  "activity_level": "moderate",
  "goals": ["sleep_support", "stress_anxiety_support", "immune_support"],
  "medical": {
    "is_pregnant": false,
    "is_breastfeeding": false,
    "conditions": ["gi_disorder"],
    "diseases": ["insomnia"],
    "medications": [],
    "allergies": ["none"]
  }
}
```

### 🆕 Supplement Recommendations & Decision Engine

**`GET /decide/me`** - Get personalized supplement recommendations grouped by goals
- Returns recommendations organized by user objectives
- Filters out contraindicated supplements based on medical conditions/medications
- Includes intake tracking status
- **Used by the Recommendations screen**

```json
Response:
{
  "decision": {
    "plan_par_objectif": {
      "sleep_support": [
        {
          "id": "mag_bisgly",
          "produit": "Magnésium Bisglycinate",
          "posologie": "300mg",
          "timing": "evening",
          "justification": "Favorise la relaxation et améliore la qualité du sommeil",
          "molecules": ["Magnésium", "Glycine"],
          "warning": "Prendre 30 min avant le coucher",
          "symptomes_couverts": ["sleep_support", "stress_anxiety_support"],
          "taken": false
        }
      ],
      "immune_support": [
        {
          "id": "vit_d3",
          "produit": "Vitamine D3",
          "posologie": "2000 UI",
          "timing": "morning",
          "justification": "Renforce le système immunitaire...",
          "molecules": ["Cholécalciférol"],
          "symptomes_couverts": ["immune_support"],
          "taken": true
        }
      ]
    },
    "goals": ["sleep_support", "immune_support"]
  },
  "derived_input": {
    "goals": ["sleep_support", "immune_support"],
    "objectifs": ["sleep_support", "immune_support"]
  }
}
```

**`GET /supplements/recommendations`** - Get flat list of recommendations (legacy)
- Simpler format, not grouped by goals
- **Available for Dashboard or alternative views**

```json
Response:
{
  "recommendations": [
    {
      "id": "mag_bisgly",
      "name": "Magnésium Bisglycinate",
      "dosage": "300mg",
      "timing": "evening",
      "reason": "Favorise la relaxation et améliore la qualité du sommeil",
      "molecules": ["Magnésium", "Glycine"],
      "warnings": "Prendre 30 min avant le coucher",
      "taken": false
    }
  ],
  "goals": [
    { "label": "sleep_support", "confidence": 3 }
  ]
}
```

**`POST /supplements/intake`** - Track supplement intake
```json
Request:
{
  "supplement_id": "mag_bisgly",
  "taken": true
}

Response:
{
  "success": true,
  "taken": true
}
```

### 📊 Progress Tracking

**`GET /tracking/progress`** - Get comprehensive tracking data
- Evolution curve (last 10 days)
- Weekly adherence
- Monthly heatmap (last 30 days)
- Today's intake log with timestamps
- **Used by the Suivi (Tracking) screen**

```json
Response:
{
  "today_progress": 67,
  "weekly_data": [
    { "day": "L", "completed": true },
    { "day": "M", "completed": true },
    { "day": "M", "completed": false },
    { "day": "J", "completed": true },
    { "day": "V", "completed": true },
    { "day": "S", "completed": false },
    { "day": "D", "completed": false }
  ],
  "adherence_data": [true, true, false, true, true, false, false],
  "evolution_data": [
    { "day": 1, "value": 45 },
    { "day": 2, "value": 52 },
    ...
    { "day": 10, "value": 67 }
  ],
  "monthly_data": [
    { "day": 1, "intensity": 0 },
    { "day": 2, "intensity": 2 },
    { "day": 3, "intensity": 3 },
    ...
  ],
  "daily_intakes": [
    { "time": "08:15", "name": "Vitamine D3", "taken": true },
    { "time": "08:16", "name": "Oméga-3 EPA/DHA", "taken": true }
  ]
}
```

### 📈 Dashboard

**`GET /dashboard`** - Get dashboard summary
- User's first name
- Today's progress percentage
- Supplement counts (taken/total)
- Weekly adherence data
- **Used by the Dashboard screen**

```json
Response:
{
  "user_name": "Marie",
  "today_progress": 67,
  "supplements_taken": 2,
  "supplements_total": 3,
  "weekly_data": [
    { "day": "L", "completed": true },
    ...
  ],
  "adherence_data": [true, true, false, true, true, false, false]
}
```

## 🗄️ Data Structure

### Supplement Library
The backend includes 3 supplements with the following structure:
```javascript
{
  id: 'mag_bisgly',
  name: 'Magnésium Bisglycinate',
  dosage: '300mg',
  timing: 'evening',
  reason: 'Favorise la relaxation et améliore la qualité du sommeil',
  molecules: ['Magnésium', 'Glycine'],
  warnings: 'Prendre 30 min avant le coucher',
  goals: ['sleep_support', 'stress_anxiety_support'],
  conditions_avoid: []
}
```

**Current supplements:**
1. **Magnésium Bisglycinate** (evening) - Sleep, stress/anxiety
2. **Vitamine D3** (morning) - Immune support
3. **Oméga-3 EPA/DHA** (morning) - Cognition, inflammation
   - ⚠️ Avoided if user takes anticoagulants

### Intake Tracking
Intakes are stored per user with timestamps:
```javascript
{
  supplement_id: 'mag_bisgly',
  timestamp: '2026-02-16T21:30:00.000Z'
}
```

## 🚀 Running Locally

### With Docker (Recommended)
```bash
# From project root
docker compose up backend

# Or to rebuild after changes
docker compose up backend --build

# Restart after code changes
docker compose restart backend
```

### Without Docker
```bash
cd backend
npm install
npm start
```

The server will run on http://localhost:8000 (or http://0.0.0.0:8000 in Docker)

## 🔧 Environment Variables

- `PORT` - Server port (default: 8000)
- `NODE_ENV` - Environment mode (default: development)

## 🔐 Authentication

All protected endpoints require an `Authorization` header:
```
Authorization: Bearer mock_token_user_1_1234567890
```

The token is returned on signup/login and should be stored by the frontend.

## 📱 Frontend Integration

### Screens Connected to Backend:
1. ✅ **Onboarding** → `PUT /users/me/profile`
2. ✅ **Dashboard** → `GET /dashboard`
3. ✅ **Recommendations** → `GET /decide/me` + `POST /supplements/intake`
4. ✅ **Suivi (Tracking)** → `GET /tracking/progress`
5. ℹ️ **Encyclopédie** - Static educational content (no backend)

### Frontend API Functions (services/api.ts):
```typescript
// Authentication
signup(email, password)
login(email, password)

// User
getMe()
updateMyProfile(payload)

// Recommendations
getDecisionForMe()          // Used by Recommendations screen
trackSupplementIntake(id, taken)

// Progress & Dashboard
getProgress()               // Used by Suivi screen
getDashboard()              // Used by Dashboard screen
```

## ⚠️ Important Notes

### Data Persistence
- **All data is stored in-memory** and will be lost when the backend restarts
- This includes:
  - User accounts
  - User profiles
  - Supplement intake history
  - Progress data

### After Backend Restart:
1. Users need to **sign up again** with a new email
2. Complete onboarding again
3. Intake tracking starts fresh

### Security Warnings
- ❌ Passwords stored in plain text
- ❌ Tokens are simple mock tokens
- ❌ No token expiration
- ❌ No validation of user data
- ⚠️ **DO NOT use in production!**

## 🔄 Recommendation Algorithm

The backend filters supplements based on:
1. **User goals** (from profile) - Matches supplements to objectives
2. **Medical contraindications** - Excludes supplements with `conditions_avoid` matching:
   - User medical conditions
   - User medications
3. **Intake status** - Tracks what was taken today

Example: If user takes anticoagulants, Oméga-3 is excluded.

## 🧪 Testing

### Automated Test Suite ⭐

A comprehensive test suite is included: `test.js`

**Run all tests:**
```bash
node test.js
```

**Test coverage:**
- ✅ 72 tests total
- ✅ Unit tests (2 tests)
- ✅ Integration tests (40 tests)
- ✅ End-to-end workflow tests (9 tests)
- ✅ Smoke tests (11 tests)
- ✅ All endpoints covered (100%)

**Expected output:**
```
╔═══════════════════════════════════════════╗
║   myAja Backend Test Suite               ║
╚═══════════════════════════════════════════╝

━━━ Unit Tests ━━━
  ✓ Token format validation
  ✓ Token extraction logic

━━━ Integration Tests - Authentication ━━━
  ✓ GET / - Health check
  ✓ POST /auth/signup - Create account
  ...

Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Passed: 72
✗ Failed: 0
  Total:   72
  Time:    0.04s

🎉 All tests passed!
```

See [TESTING.md](../TESTING.md) for complete testing documentation.

### Manual Testing with curl:
```bash
# 1. Signup
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 2. Get recommendations (use token from step 1)
curl http://localhost:8000/decide/me \
  -H "Authorization: Bearer mock_token_user_1_1234567890"

# 3. Track intake
curl -X POST http://localhost:8000/supplements/intake \
  -H "Authorization: Bearer mock_token_user_1_1234567890" \
  -H "Content-Type: application/json" \
  -d '{"supplement_id":"vit_d3","taken":true}'

# 4. Get progress
curl http://localhost:8000/tracking/progress \
  -H "Authorization: Bearer mock_token_user_1_1234567890"
```

## 📝 Next Steps for Production

To make this production-ready, you need to:

1. **Database** - Replace in-memory storage with PostgreSQL/MongoDB
2. **Authentication** - Implement proper JWT with expiration and refresh tokens
3. **Password Security** - Hash passwords with bcrypt
4. **Validation** - Add input validation (express-validator)
5. **Error Handling** - Proper error middleware
6. **Real Supplement Data** - Integrate with a real supplement database or API
7. **Recommendation Engine** - Connect to a real decision engine (ML model, rule engine)
8. **Logging** - Add proper logging (winston, morgan)
9. **Rate Limiting** - Prevent abuse
10. **HTTPS** - Enable SSL/TLS
11. **Environment Config** - Use proper env variables
12. **Tests** - Add unit and integration tests

## 🤝 Contributing

This is a student project. Changes should maintain compatibility with the existing frontend.

### Key Integration Points:
- `/decide/me` response format is expected by RecommendationsScreen
- `/dashboard` response format is expected by DashboardScreen
- `/tracking/progress` response format is expected by SuiviScreen
