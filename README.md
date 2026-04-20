# myAja (`AJA_ptut`)

Frontend app built with Expo / React Native for onboarding, recommendations, tracking, and encyclopedie content.

## What To Run

For the real project, this folder is only the frontend.

- `AJA_ptut` = frontend UI
- `Experta` = real backend API + recommendation engine + MongoDB storage
- `AJA_ptut/backend` = old mock backend, not the one to use for the client demo

## Run Guide

### Prerequisites

- Node.js + npm
- Python 3.10+
- MongoDB running locally on `mongodb://127.0.0.1:27017`
- Two terminals

### 1. Start the backend (`Experta`): https://github.com/mohamedazizbraham/Experta.git (master branch)

```powershell
cd d:\ptut\Experta
Copy-Item .env.example .env
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

If `.env` already exists and dependencies are already installed, only the last 2 commands are needed.

### 2. Start the frontend (`AJA_ptut`)

```powershell
cd d:\ptut\AJA_ptut
Copy-Item .env.example .env
npm install
npm run web
```

Then open `http://localhost:8082`.

## How `AJA_ptut` And `Experta` Work Together

`AJA_ptut` does not compute recommendations itself. It calls the FastAPI backend from [`services/api.ts`](services/api.ts).

Main flow:

1. The user signs up or logs in from the frontend.
2. The frontend sends auth requests to `Experta` on port `8000`.
3. The onboarding form updates the user profile in MongoDB through `Experta`.
4. When the user asks for recommendations, the frontend calls `GET /decide/me`.
5. `Experta` runs the rule engine, stores the recommendation, and returns the result to the UI.
6. Tracking and encyclopedie screens keep reading data from the same backend.

If `Experta` is not running, the frontend can open, but signup, onboarding, recommendations, tracking, and encyclopedie data will not work.

## API URL

The frontend uses `EXPO_PUBLIC_API_URL` when it is set. Otherwise it falls back to:

```txt
http://127.0.0.1:8000
```

The default `.env.example` already points to the correct local backend URL.

For a phone on the same Wi-Fi network, set:

```txt
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:8000
```

In that case, keep the backend running with `--host 0.0.0.0`.

## Useful Commands

```powershell
# Start the web app
npm run web

# Start Expo dev server (choose device manually)
npx expo start

# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Frontend tests
npm test
```
