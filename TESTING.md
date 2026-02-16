# Testing Guide 🧪

This document describes the test suite and testing procedures for the myAja backend.

## 📋 Test Suite Overview

The backend includes a comprehensive test suite covering:
- **Unit Tests**: Helper function validation
- **Integration Tests**: API endpoint functionality
- **End-to-End Tests**: Complete user workflows
- **Smoke Tests**: All endpoints reachable

**Total: 72 tests**

## 🚀 Running Tests

### Quick Run
```bash
# From backend directory
node test.js

# Or from project root
cd backend && node test.js

# With Docker (backend must be running)
docker compose exec backend node test.js
```

### Expected Output
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
  ✓ POST /auth/signup - Duplicate email rejected
  ✓ POST /auth/login - Authenticate user
  ...

Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Passed: 72
✗ Failed: 0
  Total:   72
  Time:    0.04s

🎉 All tests passed!
```

## 📊 Test Categories

### 1. Unit Tests (2 tests)
Tests internal helper functions without making API calls.

- Token format validation
- Token extraction logic (userId from JWT)

### 2. Integration Tests - Authentication (11 tests)
Tests the auth system end-to-end.

- Health check endpoint
- User signup (success & duplicate rejection)
- User login (success & invalid credentials)
- Get current user (authorized & unauthorized)

### 3. Integration Tests - Profile Management (4 tests)
Tests user profile operations.

- Update profile (onboarding data)
- Get profile
- Profile data persistence
- Profile field validation

### 4. Integration Tests - Recommendations (6 tests)
Tests the recommendation engine.

- Get personalized plan (GET /decide/me)
- Recommendations grouped by goals
- Legacy format (GET /supplements/recommendations)
- Contraindication filtering
- Goal matching

### 5. Integration Tests - Intake Tracking (5 tests)
Tests supplement intake tracking.

- Mark supplement as taken
- Verify status updates in recommendations
- Unmark supplement
- Invalid supplement ID handling
- Timestamp recording

### 6. Integration Tests - Progress & Dashboard (14 tests)
Tests analytics and dashboard endpoints.

- Dashboard summary (GET /dashboard)
- User name extraction
- Progress calculation
- Supplement counts
- Progress analytics (GET /tracking/progress)
- Data structure validation:
  - Weekly data (7 days)
  - Adherence data (7 days)
  - Evolution data (10 days)
  - Monthly heatmap (30 days)
  - Daily intake log

### 7. End-to-End Workflow Tests (9 tests)
Tests complete user journeys from signup to tracking.

**Workflow:**
1. User signs up
2. Completes onboarding (profile update)
3. Gets personalized recommendations
4. Marks supplement as taken
5. Views dashboard (sees progress)
6. Views tracking page (sees intake history)

### 8. Smoke Tests (11 tests)
Verifies all endpoints are reachable.

Tests each endpoint returns a non-500 status:
- GET /
- POST /auth/signup
- POST /auth/login
- GET /users/me
- GET /users/me/profile
- PUT /users/me/profile
- GET /decide/me
- GET /supplements/recommendations
- POST /supplements/intake
- GET /tracking/progress
- GET /dashboard

## 🔧 Prerequisites

### Backend Must Be Running
```bash
# Start backend
docker compose up backend

# Or locally
cd backend && npm start
```

The test suite connects to `http://localhost:8000`.

### No Prior Test Data Required
Tests create fresh users for each run using timestamped emails.

## 📝 Test Implementation Details

### Test Structure
```javascript
// Unit test example
async function runUnitTests() {
  logTest('Token format validation');
  const token = 'mock_token_user_1_1771232610502';
  const parts = token.split('_');
  assert(parts.length >= 4, 'Token should have at least 4 parts');
}

// Integration test example
async function testAuthentication() {
  logTest('POST /auth/signup - Create account');
  const res = await makeRequest(
    { path: '/auth/signup', method: 'POST', ... },
    { email: TEST_EMAIL, password: TEST_PASSWORD }
  );
  assertEqual(res.status, 201, 'Signup status code');
  assertNotNull(res.data.access_token, 'Signup returns token');
}
```

### Assertion Functions
- `assert(condition, testName, errorMsg)` - General assertion
- `assertEqual(actual, expected, testName)` - Value equality
- `assertNotNull(value, testName)` - Null check
- `pass(message)` - Mark test as passed
- `fail(message)` - Mark test as failed

### HTTP Request Helper
```javascript
async function makeRequest(options, body = null)
```

Returns: `{ status, data }`

## 🐛 Known Issues & Fixes

### Critical Bug Fixed: Token Parsing
**Issue**: Token parsing was extracting wrong user ID from JWT.

**Token Format**: `mock_token_user_1_1771232610502`

**Bug**: Code was splitting by `_` and taking index 2, which gave `'user'` instead of `'user_1'`.

**Fix**: Implemented `extractUserIdFromToken()` helper:
```javascript
function extractUserIdFromToken(token) {
  // Remove prefix and timestamp suffix
  const withoutPrefix = token.replace('mock_token_', '');
  const lastUnderscoreIndex = withoutPrefix.lastIndexOf('_');
  return withoutPrefix.substring(0, lastUnderscoreIndex);
}
```

**Result**: All endpoints now correctly identify users. ✅

## 🔄 Test Data Management

### Test Users
Tests create unique users with timestamped emails:
```javascript
const TEST_EMAIL = `test-${Date.now()}@example.com`;
```

### Data Cleanup
Since backend uses in-memory storage:
- Data automatically cleared on restart
- No cleanup scripts needed
- Each test run is independent

## 📈 Adding New Tests

### 1. Add Test Function
```javascript
async function testNewFeature(token) {
  logSection('Integration Tests - New Feature');

  logTest('GET /new-endpoint - Description');
  try {
    const res = await makeRequest({
      path: '/new-endpoint',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assertEqual(res.status, 200, 'New endpoint status');
    assertNotNull(res.data.field, 'Response has field');
  } catch (e) {
    fail(`New feature: ${e.message}`);
  }
}
```

### 2. Call From Main Runner
```javascript
async function runAllTests() {
  // ... existing tests ...
  await testNewFeature(token);
}
```

### 3. Update Test Count
Update this documentation with new test count.

## 🎯 Test Coverage

### Endpoints Covered: 100%
All 10 backend endpoints are tested:
- ✅ POST /auth/signup
- ✅ POST /auth/login
- ✅ GET /users/me
- ✅ GET /users/me/profile
- ✅ PUT /users/me/profile
- ✅ GET /decide/me
- ✅ GET /supplements/recommendations
- ✅ POST /supplements/intake
- ✅ GET /tracking/progress
- ✅ GET /dashboard

### Functionality Covered
- ✅ Authentication (signup, login)
- ✅ Authorization (token validation)
- ✅ Profile management (CRUD)
- ✅ Recommendation engine
- ✅ Intake tracking
- ✅ Progress analytics
- ✅ Dashboard aggregation
- ✅ Error handling
- ✅ Duplicate prevention
- ✅ Data persistence

### Edge Cases Tested
- ✅ Duplicate email signup
- ✅ Invalid credentials
- ✅ Missing authentication
- ✅ Invalid tokens
- ✅ Invalid supplement IDs
- ✅ Empty profile data

## 🔍 Debugging Failed Tests

### View Test Output
Failed tests show:
```
✗ FAIL Test name: Error message
```

### Common Issues

#### 1. Backend Not Running
```
✗ FAIL Health check: connect ECONNREFUSED
```
**Solution**: Start backend with `docker compose up backend`

#### 2. Port Already in Use
```
✗ FAIL Health check: EADDRINUSE
```
**Solution**: Kill process on port 8000 or change PORT

#### 3. Backend Restarted During Tests
```
✗ FAIL User not found
```
**Solution**: Don't restart backend while tests are running

## 📊 CI/CD Integration

### GitHub Actions Example
```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start backend
        run: docker compose up -d backend
      - name: Wait for backend
        run: sleep 5
      - name: Run tests
        run: cd backend && node test.js
      - name: Stop backend
        run: docker compose down
```

### Local Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running backend tests..."
cd backend && node test.js

if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

## 🎓 Best Practices

### 1. Run Tests Before Committing
```bash
cd backend && node test.js
git add .
git commit -m "Your changes"
```

### 2. Test After Backend Changes
Any change to `server.js` should trigger test run.

### 3. Update Tests With New Features
Add tests for new endpoints immediately.

### 4. Keep Tests Fast
Current suite: 0.04s ⚡
Target: < 1s for full suite

### 5. Test Both Success and Failure Paths
Every endpoint should test:
- ✅ Success case
- ❌ Failure cases (auth, validation, etc.)

## 🔮 Future Enhancements

### Planned Tests
- [ ] Performance tests (response times)
- [ ] Load tests (concurrent users)
- [ ] Security tests (SQL injection, XSS)
- [ ] Data validation tests
- [ ] Timezone handling tests

### Test Framework Migration
Consider migrating to Jest or Mocha for:
- Better assertion library
- Mocking support
- Coverage reports
- Parallel test execution

### Frontend Testing
Separate frontend test suite needed for:
- React component tests
- Navigation tests
- API integration tests
- UI/UX tests

## 📚 Resources

- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#-3-testing-best-practices)
- [HTTP Testing with Supertest](https://www.npmjs.com/package/supertest)
- [Jest Documentation](https://jestjs.io/)

---

**Test suite maintained by**: Development team
**Last updated**: February 16, 2026
**Backend version**: v1.0.0 (Development)
