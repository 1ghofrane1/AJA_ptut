# myAja - Personalized Supplement Recommendation App 💊

A React Native Expo application that provides personalized supplement recommendations based on user health goals, medical conditions, and lifestyle. Features intelligent recommendation engine, progress tracking, and intake monitoring.

## 📱 Project Overview

**myAja** helps users:
- Complete health onboarding with medical screening
- Receive personalized supplement recommendations grouped by health objectives
- Track daily supplement intake
- Monitor progress and adherence over time
- Access educational content about supplements

## 🏗️ Architecture

### Frontend (React Native + Expo)
- **Framework**: Expo SDK 54 with React Native 0.81.5
- **Navigation**: Custom state-based navigation system
- **Authentication**: JWT-based with AsyncStorage persistence
- **API Client**: Axios with request interceptors
- **Styling**: React Native StyleSheet with custom theme

### Backend (Mock Express Server)
- **Framework**: Express.js
- **Storage**: In-memory (for development)
- **CORS**: Enabled for local development
- **Authentication**: Mock JWT tokens

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (recommended)
- Expo Go app on your mobile device

### Option 1: Docker (Recommended)

```bash
# Start both frontend and backend
docker compose up

# Or start them separately
docker compose up backend
docker compose up app
```

The app will be available at:
- **Frontend**: http://localhost:8081 (web) or scan QR code with Expo Go
- **Backend**: http://localhost:8000

### Option 2: Local Development

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
npm install
npx expo start
```

## 📱 Testing on Mobile

1. Install **Expo Go** on your iOS or Android device
2. Ensure your device is on the same network as your computer
3. Start the app: `docker compose up` or `npx expo start`
4. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

### Network Configuration

The app is configured to work on your local network. The `docker-compose.yml` includes:
```yaml
environment:
  - REACT_NATIVE_PACKAGER_HOSTNAME=10.0.0.46  # Update this to your local IP
  - EXPO_PUBLIC_API_URL=http://10.0.0.46:8000
```

**To update for your network:**
1. Find your local IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
2. Update the IP addresses in `docker-compose.yml`
3. Restart: `docker compose down && docker compose up`

## 🎯 Features Implementation Status

### ✅ Fully Implemented & Connected to Backend

1. **Authentication & Onboarding**
   - Email/password signup and login
   - 6-step onboarding flow (5 for men, 6 for women)
   - Collects: personal info, pregnancy/breastfeeding, activity level, health goals, medical conditions, allergies
   - Data saved to backend via `PUT /users/me/profile`

2. **Dashboard Screen** (`components/screens/dashboard-screen.tsx`)
   - Fetches data from `GET /dashboard`
   - Shows personalized greeting with user's first name
   - Real-time progress tracking (today's completion %)
   - Weekly adherence visualization
   - Supplement counts (taken/total)

3. **Recommendations Screen** (`components/screens/recommendations-screen.tsx`)
   - Fetches personalized plan from `GET /decide/me`
   - Displays recommendations grouped by health objective
   - Shows user's health goals
   - Interactive checkboxes to mark supplements as taken
   - Persists intake status to backend via `POST /supplements/intake`
   - Expandable cards with detailed information:
     - Justification for recommendation
     - Active molecules
     - Timing (morning/evening)
     - Safety warnings
   - Sophisticated data transformation layer handling multiple API response formats

4. **Suivi/Tracking Screen** (`components/screens/suivi-screen.tsx`)
   - Fetches progress data from `GET /tracking/progress`
   - Evolution curve showing improvement over 10 days
   - Mini sparkline charts for insights
   - Daily intake timeline with timestamps
   - Monthly heatmap visualization (last 30 days)
   - Handles empty data gracefully

5. **Encyclopédie Screen** (`components/screens/encyclopedie-screen.tsx`)
   - API-driven educational content about supplements (via `GET /encyclopedie/supplements`)
   - Searchable database
   - Detailed information cards with accordion sections
   - Organized by health categories

## 📂 Project Structure

```
.
├── components/
│   ├── screens/
│   │   ├── dashboard-screen.tsx        ✅ Connected to backend
│   │   ├── recommendations-screen.tsx  ✅ Connected to backend
│   │   ├── suivi-screen.tsx           ✅ Connected to backend
│   │   ├── encyclopedie-screen.tsx    ✅ Connected to backend
│   │   ├── onboarding-screen.tsx      ✅ Connected to backend
│   │   ├── login-screen.tsx           ✅ Connected to backend
│   │   └── signup-screen.tsx          ✅ Connected to backend
│   └── ui/                            # Reusable UI components
├── context/
│   └── auth.tsx                       # Authentication context & state
├── services/
│   └── api.ts                         # API client & functions
├── backend/
│   ├── server.js                      # Express backend
│   ├── Dockerfile                     # Backend container config
│   └── README.md                      # Backend documentation
├── docker-compose.yml                 # Full stack orchestration
├── Dockerfile                         # Frontend container config
└── CLAUDE.md                          # Development guidelines

```

## 🔌 API Integration

### Frontend API Service (`services/api.ts`)

All backend communication goes through `services/api.ts`:

```typescript
// Authentication
signup(email, password)
login(email, password)

// User Management
getMe()
updateMyProfile(payload)

// Recommendations & Decision Engine
getDecisionForMe()          // Recommendations screen
trackSupplementIntake(id, taken)

// Progress & Dashboard
getProgress()               // Suivi/tracking screen
getDashboard()              // Dashboard screen
```

### Environment Variables

The API base URL is configured via environment variable:
```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000";
```

Set in `docker-compose.yml`:
```yaml
environment:
  - EXPO_PUBLIC_API_URL=http://10.0.0.46:8000
```

## 🗄️ Backend Endpoints

See [backend/README.md](./backend/README.md) for detailed documentation.

**Quick Reference:**
- `POST /auth/signup` - Create account
- `POST /auth/login` - Authenticate
- `GET /users/me` - Get current user
- `PUT /users/me/profile` - Update profile (onboarding)
- `GET /decide/me` - Get personalized recommendations grouped by goals ⭐
- `POST /supplements/intake` - Track supplement intake
- `GET /tracking/progress` - Get progress data (charts, heatmaps)
- `GET /dashboard` - Get dashboard summary

## 🎨 Design System

### Color Palette
```
Primary: #14272d (Dark teal)
Secondary: #7ea69d (Teal)
Accent: #dfc485 (Gold)
Background: #fef6e2 (Cream)
Light: #b3d3d2, #e7ede7
```

### Typography
- **Headers**: 24px, bold
- **Body**: 14-16px
- **Captions**: 12px

### Components
- Rounded corners (12-16px)
- Subtle shadows for depth
- Icon-first design with lucide-react-native
- Custom circular progress indicators

## 🔐 Authentication Flow

1. User signs up with email/password
2. Backend returns JWT token + user object
3. Token stored in AsyncStorage
4. Token automatically attached to all API requests via Axios interceptor
5. User redirected to onboarding (if profile incomplete) or dashboard

## 📊 Data Flow

### Onboarding → Recommendations
```
User completes onboarding
    ↓
Profile saved to backend (PUT /users/me/profile)
    ↓
Backend analyzes goals & medical conditions
    ↓
Frontend fetches recommendations (GET /decide/me)
    ↓
Recommendations grouped by objective and displayed
```

### Intake Tracking → Progress
```
User marks supplement as taken
    ↓
Frontend sends intake (POST /supplements/intake)
    ↓
Backend stores with timestamp
    ↓
Progress/Dashboard screens fetch updated data
    ↓
Charts and heatmaps reflect new data
```

## 🔄 Recent Changes & Improvements

### Backend Integration (February 2026)
- ✅ Added `/decide/me` endpoint for grouped recommendations
- ✅ Added `/dashboard` endpoint for overview
- ✅ Added `/tracking/progress` endpoint with analytics
- ✅ Added supplement intake tracking with persistence
- ✅ Implemented recommendation filtering based on contraindications
- ✅ Added support for environment variable configuration

### Frontend Updates
- ✅ Connected Dashboard screen to real backend data
- ✅ Connected Suivi/Tracking screen with charts and analytics
- ✅ Maintained student's sophisticated Recommendations screen implementation
- ✅ Added loading states for all data fetching
- ✅ Added error handling with graceful fallbacks
- ✅ Optimistic UI updates for intake tracking

## ⚠️ Important Notes

### Data Persistence
**All backend data is in-memory and will be lost on restart!**
- User accounts
- User profiles
- Intake history
- Progress data

After backend restart, users must:
1. Sign up again with a new email
2. Complete onboarding again

### Development vs Production
This is a **development setup** with:
- ❌ Plain text password storage
- ❌ Mock JWT tokens
- ❌ No database
- ❌ No data validation
- ⚠️ **NOT production-ready!**

### Known Limitations
1. Backend restarts clear all data (in-memory storage)
2. No real-time synchronization between devices
3. Limited supplement library (3 supplements)
4. Simplified recommendation algorithm
5. No user profile editing after onboarding

## 🧪 Testing

### Manual Testing Flow

1. **Start the app**
   ```bash
   docker compose up
   ```

2. **Open on mobile** (scan QR code with Expo Go)

3. **Test complete flow:**
   - Sign up with email/password
   - Complete all 6 onboarding steps
   - View dashboard (should show your name and 0% progress)
   - Go to Recommendations tab (should show personalized plan)
   - Mark supplements as taken (checkboxes)
   - Go to Suivi tab (should show progress charts)
   - Go back to Dashboard (should show updated progress)

### Testing Endpoints Directly

```bash
# Sign up
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get recommendations (use token from signup response)
curl http://localhost:8000/decide/me \
  -H "Authorization: Bearer mock_token_user_1_..."
```

## 🚧 Next Steps / TODOs

### High Priority
- [ ] Add real database (PostgreSQL/MongoDB)
- [ ] Implement proper JWT authentication with expiration
- [ ] Add password hashing (bcrypt)
- [ ] Add user profile editing screen
- [ ] Expand supplement library

### Medium Priority
- [ ] Add push notifications for supplement reminders
- [ ] Add export feature for progress data
- [ ] Add social sharing of achievements
- [ ] Improve recommendation algorithm with ML
- [ ] Add supplement interaction warnings

### Low Priority
- [ ] Add dark mode support
- [ ] Add multi-language support
- [ ] Add accessibility improvements
- [ ] Add animations and micro-interactions

## 📚 Documentation

- [Backend API Documentation](./backend/README.md) - Complete API reference
- [CLAUDE.md](./CLAUDE.md) - Development guidelines and architecture notes

## 🤝 Contributing

This is a student project for MSE (Master of Science in Engineering).

### Key Guidelines
- Maintain compatibility with existing frontend implementation
- Update backend README when adding new endpoints
- Test on both web and mobile before committing
- Keep the mock nature clearly documented
- Respect the student's original design patterns (especially in RecommendationsScreen)

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Async/await for API calls
- ESLint/Prettier for formatting

## 📝 License

Student project - Academic use only

## 👥 Team

- Student: Ghofrane (ghofranebouallegue5@gmail.com)
- Assisted by: Claude Code (Anthropic)

---

**Note**: This is a development/prototype application. Do not use in production without implementing proper security, data validation, and persistence.
