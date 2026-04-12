# Legacy Mock Backend

This folder contains the old Express mock server used during early UI integration.

## Status
- Deprecated
- Not the source of truth anymore
- Real backend: `d:/ptut/Experta/api.py`

## When to use this folder
Only if you want a lightweight mock server for isolated frontend experiments.
Do not use it for real auth, onboarding, recommendations, tracking, or encyclopedie testing.

## Start it
```powershell
cd d:\ptut\AJA_ptut\backend
npm install
npm run start:legacy
```

## Why it is not the main backend anymore
The frontend now depends on endpoints that only exist in the FastAPI backend, including:
- `GET /dashboard/random-questions`
- `GET /users/me/current-recommendation`
- `POST /users/me/recommendations/{recommendation_id}/intakes/bulk`
- encyclopedie routes

## Recommendation
Use `d:/ptut/Experta/api.py` for day-to-day development.
