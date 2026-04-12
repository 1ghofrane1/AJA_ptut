# Integration Summary

## Source of truth

The project now has a clear backend split:

- Official backend: `d:/ptut/Experta/api.py`
- Legacy mock backend: `d:/ptut/AJA_ptut/backend/server.js`

Frontend integration should target the FastAPI backend only.

## What is integrated

### Auth and profile
- `POST /auth/signup`
- `POST /auth/login`
- `GET /users/me`
- `PUT /users/me/profile`
- `GET /auth/check-email`

### Recommendations
- `GET /users/me/current-recommendation`
- `GET /users/me/recommendations`
- `POST /users/me/recommendations/{recommendation_id}/intakes/bulk`

### Tracking and dashboard
- `GET /tracking/progress`
- `GET /dashboard`
- `GET /dashboard/random-questions`

### Encyclopedie
- `GET /encyclopedie/supplements`
- `GET /encyclopedie/supplements/{supplement_id}`

## Frontend consistency improvements

The app now uses a shared client-side data layer with React Query:

- `app/_layout.tsx`: provides `QueryClientProvider`
- `hooks/use-health-data.ts`: centralizes health queries and mutations

Shared queries now cover:
- progress snapshots
- current recommendation snapshot
- random dashboard questions
- intake save invalidation

This reduces duplicate fetch logic between:
- `Accueil`
- `Recommendations`
- `Suivi`

## Logic extraction started

To reduce giant-screen coupling, shared progress helpers now live in:
- `utils/progress-sync.ts`

These helpers centralize:
- grouped taken-state mapping
- supplement-id taken-state mapping
- bulk intake payload construction

## What is still intentionally pending

These are still valid next refactors, but they are larger than the current cleanup pass:
- full router migration away from manual screen state
- deeper breakup of `onboarding-screen.tsx`, `recommendations-screen.tsx`, and `suivi-screen.tsx`
- backend split of `Experta/api.py` into routers/services
