# Quick Start Guide for Ghofrane 🚀

This guide will help you get the myAja app running quickly, both with and without Docker.

## ⚡ TL;DR - Start in 3 Commands

### With Docker (Easiest)
```bash
git pull origin main
docker compose up
# Open http://localhost:8081
```

### Without Docker
```bash
git pull origin main
cd backend && npm install && npm start &
cd .. && npm install && npx expo start
# Open http://localhost:8081
```

---

## 📋 What's New

All backend integration is complete! Your RecommendationsScreen code was kept **100% unchanged**. Here's what's working:

✅ **Backend API** - 10 endpoints, all tested
✅ **Dashboard** - Shows real user data and progress
✅ **Recommendations** - Your implementation works perfectly!
✅ **Suivi/Tracking** - Real intake history with charts
✅ **72 automated tests** - All passing
✅ **Complete documentation** - API, testing, integration

---

## 🐳 Option 1: With Docker (Recommended)

### Why Docker?
- Everything pre-configured
- No need to manage ports or processes
- Backend and frontend start together
- Network settings already configured

### Steps:

1. **Pull latest changes:**
```bash
git pull origin main
```

2. **Start everything:**
```bash
docker compose up
```

3. **Access the app:**
   - **Web**: http://localhost:8081
   - **Mobile**: Scan QR code in terminal with Expo Go app

4. **View logs:**
```bash
# Backend logs
docker compose logs backend -f

# Frontend logs
docker compose logs app -f
```

5. **Restart after changes:**
```bash
# Restart backend only
docker compose restart backend

# Rebuild everything
docker compose up --build

# Stop everything
docker compose down
```

### Testing on Your Phone:

If using your phone on the same network, update `docker-compose.yml`:

```yaml
environment:
  - REACT_NATIVE_PACKAGER_HOSTNAME=YOUR_LOCAL_IP  # e.g., 192.168.1.100
  - EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
```

Find your IP:
- Mac: `ipconfig getifaddr en0`
- Linux: `hostname -I`
- Windows: `ipconfig`

Then restart:
```bash
docker compose down && docker compose up
```

---

## 💻 Option 2: Without Docker

### Prerequisites:
- Node.js 20+
- Two terminal windows

### Steps:

1. **Pull latest changes:**
```bash
git pull origin main
```

2. **Install dependencies:**
```bash
# Install frontend dependencies (from project root)
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. **Start backend** (Terminal 1):
```bash
cd backend
npm start
```

You should see:
```
🚀 myAja Mock Backend running on http://0.0.0.0:8000
```

4. **Start frontend** (Terminal 2):
```bash
npx expo start
```

5. **Access the app:**
   - **Web**: Press `w` or open http://localhost:8081
   - **Mobile**: Press `i` for iOS simulator or `a` for Android emulator
   - **Mobile Device**: Scan QR code with Expo Go app

### Testing on Your Phone:

If testing on a physical device:

1. Find your local IP address (e.g., 192.168.1.100)
2. Create `.env` file in project root:
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```
3. Restart Expo: `npx expo start --clear`

---

## 🧪 Running Tests

The backend has a comprehensive test suite (72 tests):

```bash
# With Docker
docker compose exec backend node test.js

# Without Docker
cd backend
node test.js
```

Expected output:
```
✓ Passed: 72
✗ Failed: 0
Time:    0.13s

🎉 All tests passed!
```

---

## 🔍 Troubleshooting

### "Package version warnings"
Already fixed! We updated:
- expo: ~54.0.31 → ~54.0.33
- expo-font: ~14.0.10 → ~14.0.11
- expo-router: ~6.0.21 → ~6.0.23

### "401 Unauthorized" errors
The backend uses in-memory storage. After restart:
1. Sign up with a new account
2. Complete onboarding
3. Then you can use the app

### "Slow loading"
First load takes 10-20 seconds. Subsequent reloads are faster (2-5s).

To clear cache:
```bash
# With Docker
docker compose down && docker compose up --build

# Without Docker
npx expo start --clear
```

### "Can't connect to backend"
Check backend is running:
```bash
curl http://localhost:8000/
```

Should return:
```json
{"message":"myAja Backend API - Mock Server","status":"running"}
```

### Ports already in use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 8081
lsof -ti:8081 | xargs kill -9
```

---

## 📚 Documentation Files

All documentation is ready:

- **README.md** - Complete project overview
- **INTEGRATION_SUMMARY.md** - What was integrated (for you!)
- **TESTING.md** - Test suite documentation
- **backend/README.md** - API documentation
- **QUICKSTART.md** - This file!

---

## 🎯 First Time Setup

Follow this flow when you first start the app:

1. **Sign Up** - Create a new account
2. **Onboarding** - Complete all 6 steps (5 for men)
   - Personal info (name, age, sex, height, weight)
   - Pregnancy/breastfeeding (women only)
   - Activity level
   - Health goals
   - Medical conditions
   - Allergies
3. **Dashboard** - See your personalized greeting
4. **Recommendations** - View your supplement plan grouped by goals
5. **Mark as taken** - Check supplements you've taken
6. **Suivi** - View your progress and intake history

---

## 💡 Key Notes

### Your Code
Your `recommendations-screen.tsx` was **kept 100% unchanged**. The backend was built to match your expected data format.

### Data Persistence
⚠️ Backend uses **in-memory storage** - all data is lost on restart. This is normal for development. For production, you'd need a real database (PostgreSQL, MongoDB, etc.).

### API Base URL
The frontend automatically uses:
- **Development**: http://127.0.0.1:8000 (default)
- **Custom**: Set `EXPO_PUBLIC_API_URL` environment variable

### Network Testing
When testing on mobile device:
- Device must be on same WiFi as computer
- Update IP addresses in config
- Restart both frontend and backend

---

## 🤝 Need Help?

If you encounter any issues:

1. Check the logs:
   ```bash
   # Docker
   docker compose logs backend -f
   docker compose logs app -f

   # Non-Docker
   # Check terminal windows where you started backend/frontend
   ```

2. Run tests to verify backend:
   ```bash
   cd backend && node test.js
   ```

3. Check the INTEGRATION_SUMMARY.md for detailed explanations

---

## 🎉 You're Ready!

Everything is configured and tested. Just run:

```bash
docker compose up
```

Or without Docker:
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
npx expo start
```

Then open http://localhost:8081 and start testing! 🚀

**Happy coding!** 💊✨
