# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **myAja**, a React Native health companion app built with Expo SDK ~54. The app helps users track supplement intake, provides recommendations, and monitors health goals. It features authentication (email/password and Google), a custom navigation system, and integrates with a backend API at http://127.0.0.1:8000.

## Development Commands

### Setup and Running
- `npm install` - Install dependencies
- `npx expo start` - Start development server (opens menu for platform selection)
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run web` - Run on web browser

### Docker Commands
- `docker compose build` - Build Docker images
- `docker compose up` - Start containers (app available at http://localhost:8081)
- `docker compose up -d` - Start containers in detached mode
- `docker compose down` - Stop and remove containers
- `docker compose logs -f` - View container logs

### Code Quality
- `npm run lint` - Run ESLint checks
- `npm run reset-project` - Reset to blank project (removes starter code)

## Architecture

### Navigation System
The app uses a **custom navigation system** (NOT React Navigation's native stack), implemented via state management in `app/_layout.tsx`:
- Pre-auth screens: `welcome` → `login` → `signup` → `onboarding` → `dashboard`
- Post-auth tabs: `accueil` (dashboard) | `recommandations` | `suivi` | `encyclopedie`
- Navigation handled via `onNavigate` prop callbacks passing screen names as strings
- Bottom navigation appears only after reaching dashboard

### Authentication Flow
Authentication is managed through Context API:
- **AuthContext** (`context/auth.tsx`) - Provides `useAuth()` hook with:
  - `loginWithEmail(email, password)` - Returns UserResponse
  - `signupWithEmail(email, password)` - Returns UserResponse
  - `logout()` - Clears token and user state
  - `refreshMe()` - Refreshes user data from `/users/me`
  - `token`, `user`, `loading` states
- Token persistence via `@react-native-async-storage/async-storage` (key: `aja_token`)
- Axios interceptor auto-attaches Bearer token to all requests

### API Service Layer
Backend integration in `services/api.ts`:
- Base URL: `http://127.0.0.1:8000` (local development)
- Endpoints:
  - `POST /auth/signup` - Create account
  - `POST /auth/login` - Authenticate
  - `GET /users/me?include_personal=true` - Get current user
  - `PUT /users/me/profile` - Update profile
- All API calls use axios instance with auto-attached auth headers

### Component Structure
- **Screen Components** (`components/screens/`): Full-page views for each route
  - All accept `onNavigate?: (screen: string) => void` prop (except main app tabs)
  - Dashboard, recommendations, suivi, and encyclopedie screens have no navigation prop
- **UI Components** (`components/ui/`): Reusable elements like icons, collapsibles
- **Shared Components** (`components/`): Bottom navigation, themed wrappers, etc.

### Theme System
- Primary color: `#14272d` (dark teal)
- Secondary: `#7ea69d` (sage green)
- Accent: `#dfc485` (gold)
- Background: `#fef6e2` (cream)
- Custom hooks: `use-color-scheme.ts`, `use-theme-color.ts`
- Constants defined in `constants/theme.ts`

### Key Dependencies
- **expo-router** v6 - File-based routing (configured but custom nav system used)
- **lucide-react-native** - Icon library (used throughout)
- **axios** - HTTP client
- **react-native-chart-kit** / **react-native-svg** - Data visualization
- **expo-blur**, **expo-linear-gradient** - UI effects

## Important Patterns

### Adding New Screens
1. Create screen component in `components/screens/[name]-screen.tsx`
2. Add screen type to `Screen` or `Tab` union in `app/_layout.tsx`
3. Import and conditionally render in `RootApp()` component
4. For auth screens, add to conditional block (lines 38-60)
5. For main app tabs, add to tab content section (lines 63-74)

### API Calls
Always use the `api` instance from `services/api.ts`:
```typescript
import { api } from '@/services/api';
const { data } = await api.get<ResponseType>('/endpoint');
```
Never manually attach Authorization headers - the interceptor handles this.

### Navigation
Use the `onNavigate` callback pattern:
```typescript
// In screen component
onNavigate("dashboard"); // Pre-auth screen names
// OR
onTabChange("accueil"); // Post-auth tab names
```

### TypeScript Paths
The project uses `@/*` path aliases (configured in `tsconfig.json`):
```typescript
import { DashboardScreen } from '@/components/screens/dashboard-screen';
import { useAuth } from '@/context/auth';
```

## Expo Configuration
- App name: `myAja`, slug: `myaja`, scheme: `myaja`
- New Architecture enabled (`newArchEnabled: true`)
- React Compiler experiment enabled
- Typed routes experiment enabled
- Edge-to-edge Android UI
- Supports iOS tablets

## Docker Setup

The application is fully Dockerized with both frontend and backend services:

### Services
1. **Frontend (app)**: Expo React Native application
   - Dockerfile: Node 20 Alpine base with Expo CLI
   - Ports: 19006 (web), 8081 (Metro bundler), 19000-19002 (Expo dev server)

2. **Backend (backend)**: Node.js/Express mock API server
   - Dockerfile: Node 20 Alpine with Express
   - Port: 8000
   - Features: Mock authentication, user management, CORS enabled
   - Location: `/backend` directory

### Configuration
- **docker-compose.yml**: Orchestrates both frontend and backend containers
- **Network**: Both services communicate via `myaja-network` bridge
- **Volumes**: Both use volume mounts for hot reload during development

### Environment Variables
- `EXPO_PUBLIC_API_URL` - Backend API URL (default: `http://127.0.0.1:8000`)
  - For Docker web: Use `http://localhost:8000` (browser runs on host, not in container)
  - For native Docker builds: Use `http://host.docker.internal:8000` to access host's backend
  - See `.env.example` for configuration options

### Volume Mounts
The Docker setup uses volume mounts to enable hot reloading:
- Source code mounted to `/app`
- `node_modules` and `.expo` excluded for performance

## Notes
- **Backend**: A mock Node.js/Express backend is included in `/backend` directory
  - Runs on port 8000 with CORS enabled for development
  - Provides mock authentication and user management
  - In-memory storage (data resets on restart)
  - Replace with real backend for production
- **Docker networking**: Frontend (browser) accesses backend via `http://localhost:8000`
- **Development**: Both frontend and backend have hot reload enabled via volume mounts
- Native folders (`/ios`, `/android`) are gitignored and auto-generated by Expo
- The app uses React 19 and React Native 0.81.5
