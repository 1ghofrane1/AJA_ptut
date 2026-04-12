# myAja

A React Native + Expo app for personalized supplement recommendations, onboarding, tracking, and encyclopedie content.

## Architecture

### Frontend
- Location: `d:/ptut/AJA_ptut`
- Stack: Expo SDK 54, React Native, Axios, React Query
- Navigation: app-local screen state in `app/_layout.tsx`
- Shared data layer: `hooks/use-health-data.ts`

### Official backend
- Location: `d:/ptut/Experta/api.py`
- Stack: FastAPI + MongoDB + recommendation engine
- This is the backend the frontend is expected to use for:
  - auth
  - onboarding/profile updates
  - recommendations
  - tracking/progress
  - dashboard/home questions
  - encyclopedie

### Legacy mock backend
- Location: `d:/ptut/AJA_ptut/backend/server.js`
- Stack: Express + in-memory data
- Status: deprecated
- Keep it only for isolated UI mock/demo work. It is not the source of truth anymore.

## Quick start

### 1. Start the official backend
```powershell
cd d:\ptut\Experta
python -m uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

### 2. Start the frontend
```powershell
cd d:\ptut\AJA_ptut
npm install
npm run web
```

The frontend uses `EXPO_PUBLIC_API_URL` when provided, otherwise it falls back to:
```txt
http://127.0.0.1:8000
```

## Current app flow

1. Signup / login
2. Onboarding profile completion
3. Personalized recommendations
4. Daily tracking in `Suivi`
5. Encyclopedie browsing
6. Home dashboard with random Q/A cards + tracking preview

## Data consistency work already in place

- `Accueil`, `Recommendations`, and `Suivi` now share a React Query client.
- Recommendation/intake saves invalidate shared health queries.
- `Recommendations` and `Suivi` align against the same active recommendation and progress state.

## Main frontend modules

- `services/api.ts`: typed API client
- `hooks/use-health-data.ts`: shared query/mutation hooks
- `components/screens/dashboard-screen.tsx`: accueil
- `components/screens/recommendations-screen.tsx`: recommendation plan
- `components/screens/suivi-screen.tsx`: tracking
- `components/screens/encyclopedie-screen.tsx`: supplement knowledge base

## Notes

- `expo-router` is installed because Expo expects the router entrypoint, but the app currently still uses local screen state in `app/_layout.tsx`.
- Full router migration is still a future refactor, not the current runtime model.

## Useful commands

```powershell
# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Frontend unit tests
npm test
```
