# Testing Guide

This project now has two relevant test layers:
- frontend unit tests in `d:/ptut/AJA_ptut`
- backend Python tests in `d:/ptut/Experta`

## Frontend

From `d:/ptut/AJA_ptut`:

```powershell
npm test
npx tsc --noEmit
npm run lint
```

### What frontend tests currently cover
- password policy validation
- signup validation
- shared progress-sync helpers used by `Suivi` / `Recommendations`

## Backend

From `d:/ptut/Experta`:

```powershell
python -m unittest test_suite.py
python -m py_compile api.py
```

The Python backend test suite exercises recommendation logic and integration helpers around the real FastAPI data flow.

## Manual smoke workflow

1. Start the official backend:
```powershell
cd d:\ptut\Experta
python -m uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

2. Start the frontend:
```powershell
cd d:\ptut\AJA_ptut
npm run web
```

3. Verify these flows:
- signup / login
- onboarding completion
- recommendations load
- supplement intakes save from `Suivi`
- saved state reflected in `Recommendations`
- dashboard random question carousel loads
- encyclopedie list/detail loads

## Important note about the old Express server

`d:/ptut/AJA_ptut/backend/server.js` is a legacy mock backend.
It is not the backend these tests are written against.
Use it only for isolated UI mock experiments.
