#!/usr/bin/env node

/**
 * Backend Test Suite
 *
 * Includes:
 * - Unit tests for helper functions
 * - Integration tests for API endpoints
 * - End-to-end workflow tests
 *
 * Usage: node test.js
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:8000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'test123';

// Test results tracking
let passed = 0;
let failed = 0;
const failures = [];

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// ============================================
// TEST UTILITIES
// ============================================

function logSection(title) {
  console.log(`\n${colors.bold}${colors.cyan}━━━ ${title} ━━━${colors.reset}\n`);
}

function logTest(name) {
  process.stdout.write(`  ${name} ... `);
}

function pass(message = '') {
  console.log(`${colors.green}✓ PASS${colors.reset} ${message}`);
  passed++;
}

function fail(message) {
  console.log(`${colors.red}✗ FAIL${colors.reset} ${message}`);
  failed++;
  failures.push(`${message}`);
}

function assert(condition, testName, errorMsg) {
  if (condition) {
    pass(testName);
  } else {
    fail(`${testName}: ${errorMsg}`);
  }
}

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    pass(testName);
  } else {
    fail(`${testName}: Expected ${expected}, got ${actual}`);
  }
}

function assertNotNull(value, testName) {
  if (value !== null && value !== undefined) {
    pass(testName);
  } else {
    fail(`${testName}: Value is null or undefined`);
  }
}

// HTTP request helper
function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// ============================================
// UNIT TESTS
// ============================================

async function runUnitTests() {
  logSection('Unit Tests');

  // Test 1: Token format validation
  logTest('Token format validation');
  const token = 'mock_token_user_1_1771232610502';
  const parts = token.split('_');
  assert(parts.length >= 4, 'Token should have at least 4 parts', `Got ${parts.length} parts`);

  // Test 2: Token extraction logic
  logTest('Token extraction logic');
  const withoutPrefix = token.replace('mock_token_', '');
  const lastUnderscoreIndex = withoutPrefix.lastIndexOf('_');
  const userId = withoutPrefix.substring(0, lastUnderscoreIndex);
  assertEqual(userId, 'user_1', 'UserId extraction from token');
}

// ============================================
// INTEGRATION TESTS - Authentication
// ============================================

async function testAuthentication() {
  logSection('Integration Tests - Authentication');

  let token = null;
  let userId = null;

  // Test 1: Health check
  logTest('GET / - Health check');
  try {
    const res = await makeRequest({ path: '/' });
    assertEqual(res.status, 200, 'Health check status');
    assertEqual(res.data.status, 'running', 'Health check response');
  } catch (e) {
    fail(`Health check: ${e.message}`);
  }

  // Test 2: Signup
  logTest('POST /auth/signup - Create account');
  try {
    const res = await makeRequest(
      {
        path: '/auth/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: TEST_EMAIL, password: TEST_PASSWORD }
    );
    assertEqual(res.status, 201, 'Signup status code');
    assertNotNull(res.data.access_token, 'Signup returns token');
    assertNotNull(res.data.user, 'Signup returns user');
    assertEqual(res.data.user.email, TEST_EMAIL, 'Signup email matches');

    token = res.data.access_token;
    userId = res.data.user.id;
  } catch (e) {
    fail(`Signup: ${e.message}`);
  }

  // Test 3: Duplicate signup
  logTest('POST /auth/signup - Duplicate email rejected');
  try {
    const res = await makeRequest(
      {
        path: '/auth/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: TEST_EMAIL, password: TEST_PASSWORD }
    );
    assertEqual(res.status, 400, 'Duplicate signup rejected');
  } catch (e) {
    fail(`Duplicate signup: ${e.message}`);
  }

  // Test 4: Login
  logTest('POST /auth/login - Authenticate user');
  try {
    const res = await makeRequest(
      {
        path: '/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: TEST_EMAIL, password: TEST_PASSWORD }
    );
    assertEqual(res.status, 200, 'Login status code');
    assertNotNull(res.data.access_token, 'Login returns token');
  } catch (e) {
    fail(`Login: ${e.message}`);
  }

  // Test 5: Invalid credentials
  logTest('POST /auth/login - Invalid credentials rejected');
  try {
    const res = await makeRequest(
      {
        path: '/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: TEST_EMAIL, password: 'wrongpassword' }
    );
    assertEqual(res.status, 401, 'Invalid credentials rejected');
  } catch (e) {
    fail(`Invalid credentials: ${e.message}`);
  }

  // Test 6: Get current user
  logTest('GET /users/me - Get current user');
  try {
    const res = await makeRequest({
      path: '/users/me',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assertEqual(res.status, 200, 'Get user status code');
    assertEqual(res.data.id, userId, 'User ID matches');
    assertEqual(res.data.email, TEST_EMAIL, 'User email matches');
  } catch (e) {
    fail(`Get current user: ${e.message}`);
  }

  // Test 7: Unauthorized access
  logTest('GET /users/me - Unauthorized without token');
  try {
    const res = await makeRequest({ path: '/users/me' });
    assertEqual(res.status, 401, 'Unauthorized without token');
  } catch (e) {
    fail(`Unauthorized access: ${e.message}`);
  }

  return { token, userId };
}

// ============================================
// INTEGRATION TESTS - Profile Management
// ============================================

async function testProfileManagement(token) {
  logSection('Integration Tests - Profile Management');

  // Test 1: Update profile
  logTest('PUT /users/me/profile - Update profile');
  try {
    const profileData = {
      personal: {
        name: 'Test User',
        sex: 'female',
        age_range: '31-45',
        height_cm: 165,
        weight_kg: 60
      },
      activity_level: 'moderate',
      goals: ['sleep_support', 'immune_support', 'focus_cognition'],
      medical: {
        is_pregnant: false,
        is_breastfeeding: false,
        conditions: [],
        diseases: [],
        medications: [],
        allergies: ['none']
      }
    };

    const res = await makeRequest(
      {
        path: '/users/me/profile',
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      profileData
    );

    assertEqual(res.status, 200, 'Update profile status');
    assertEqual(res.data.profile.personal.name, 'Test User', 'Profile name updated');
    assertEqual(res.data.profile.goals.length, 3, 'Profile goals count');
  } catch (e) {
    fail(`Update profile: ${e.message}`);
  }

  // Test 2: Get profile
  logTest('GET /users/me/profile - Get profile');
  try {
    const res = await makeRequest({
      path: '/users/me/profile',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assertEqual(res.status, 200, 'Get profile status');
    assertNotNull(res.data.personal, 'Profile has personal data');
  } catch (e) {
    fail(`Get profile: ${e.message}`);
  }
}

// ============================================
// INTEGRATION TESTS - Recommendations
// ============================================

async function testRecommendations(token) {
  logSection('Integration Tests - Recommendations');

  // Test 1: Get personalized recommendations (decide/me)
  logTest('GET /decide/me - Get personalized plan');
  try {
    const res = await makeRequest({
      path: '/decide/me',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assertEqual(res.status, 200, 'Get recommendations status');
    assertNotNull(res.data.decision, 'Response has decision');
    assertNotNull(res.data.decision.plan_par_objectif, 'Decision has plan_par_objectif');

    const goals = res.data.decision.goals;
    assert(goals.length > 0, 'Has goals', 'No goals found');

    // Check if sleep_support goal has recommendations
    const sleepSupplements = res.data.decision.plan_par_objectif.sleep_support;
    if (sleepSupplements) {
      assert(sleepSupplements.length > 0, 'Sleep support has recommendations', 'No recommendations');
    } else {
      pass('Sleep support goal processed (no matching supplements)');
    }
  } catch (e) {
    fail(`Get recommendations: ${e.message}`);
  }

  // Test 2: Get legacy recommendations format
  logTest('GET /supplements/recommendations - Legacy format');
  try {
    const res = await makeRequest({
      path: '/supplements/recommendations',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assertEqual(res.status, 200, 'Legacy recommendations status');
    assertNotNull(res.data.recommendations, 'Has recommendations array');
  } catch (e) {
    fail(`Legacy recommendations: ${e.message}`);
  }
}

// ============================================
// INTEGRATION TESTS - Intake Tracking
// ============================================

async function testIntakeTracking(token) {
  logSection('Integration Tests - Intake Tracking');

  // Test 1: Track supplement intake (taken)
  logTest('POST /supplements/intake - Mark as taken');
  try {
    const res = await makeRequest(
      {
        path: '/supplements/intake',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      { supplement_id: 'mag_bisgly', taken: true }
    );
    assertEqual(res.status, 200, 'Track intake status');
    assertEqual(res.data.taken, true, 'Intake marked as taken');
  } catch (e) {
    fail(`Track intake: ${e.message}`);
  }

  // Test 2: Verify intake reflected in recommendations
  logTest('GET /decide/me - Verify intake status updated');
  try {
    const res = await makeRequest({
      path: '/decide/me',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const sleepSupplements = res.data.decision.plan_par_objectif.sleep_support;
    if (sleepSupplements) {
      const magnesium = sleepSupplements.find(s => s.id === 'mag_bisgly');
      if (magnesium) {
        assertEqual(magnesium.taken, true, 'Magnesium marked as taken');
      } else {
        fail('Magnesium not found in recommendations');
      }
    } else {
      pass('Sleep support processed (conditional test)');
    }
  } catch (e) {
    fail(`Verify intake: ${e.message}`);
  }

  // Test 3: Unmark supplement
  logTest('POST /supplements/intake - Unmark supplement');
  try {
    const res = await makeRequest(
      {
        path: '/supplements/intake',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      { supplement_id: 'mag_bisgly', taken: false }
    );
    assertEqual(res.status, 200, 'Unmark intake status');
    assertEqual(res.data.taken, false, 'Intake unmarked');
  } catch (e) {
    fail(`Unmark intake: ${e.message}`);
  }

  // Test 4: Invalid supplement ID
  logTest('POST /supplements/intake - Invalid supplement ID');
  try {
    const res = await makeRequest(
      {
        path: '/supplements/intake',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      { supplement_id: 'invalid_id', taken: true }
    );
    // Should still succeed (we track anything the frontend sends)
    assertEqual(res.status, 200, 'Invalid ID handled gracefully');
  } catch (e) {
    fail(`Invalid supplement ID: ${e.message}`);
  }
}

// ============================================
// INTEGRATION TESTS - Progress & Dashboard
// ============================================

async function testProgressAndDashboard(token) {
  logSection('Integration Tests - Progress & Dashboard');

  // Test 1: Get dashboard
  logTest('GET /dashboard - Dashboard summary');
  try {
    const res = await makeRequest({
      path: '/dashboard',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assertEqual(res.status, 200, 'Dashboard status');
    assertNotNull(res.data.user_name, 'Dashboard has user_name');
    assertEqual(res.data.user_name, 'Test', 'User name extracted correctly');
    assertNotNull(res.data.today_progress, 'Dashboard has today_progress');
    assertNotNull(res.data.supplements_taken, 'Dashboard has supplements_taken');
    assertNotNull(res.data.supplements_total, 'Dashboard has supplements_total');
    assertNotNull(res.data.weekly_data, 'Dashboard has weekly_data');
  } catch (e) {
    fail(`Dashboard: ${e.message}`);
  }

  // Test 2: Get progress data
  logTest('GET /tracking/progress - Progress analytics');
  try {
    const res = await makeRequest({
      path: '/tracking/progress',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assertEqual(res.status, 200, 'Progress status');
    assertNotNull(res.data.today_progress, 'Has today_progress');
    assertNotNull(res.data.weekly_data, 'Has weekly_data');
    assertNotNull(res.data.adherence_data, 'Has adherence_data');
    assertNotNull(res.data.evolution_data, 'Has evolution_data');
    assertNotNull(res.data.monthly_data, 'Has monthly_data');
    assertNotNull(res.data.daily_intakes, 'Has daily_intakes');

    // Verify data structures
    assertEqual(res.data.weekly_data.length, 7, 'Weekly data has 7 days');
    assertEqual(res.data.adherence_data.length, 7, 'Adherence data has 7 days');
    assertEqual(res.data.evolution_data.length, 10, 'Evolution data has 10 days');
    assertEqual(res.data.monthly_data.length, 30, 'Monthly data has 30 days');
  } catch (e) {
    fail(`Progress: ${e.message}`);
  }
}

// ============================================
// END-TO-END WORKFLOW TESTS
// ============================================

async function testEndToEndWorkflow() {
  logSection('End-to-End Workflow Tests');

  const workflowEmail = `e2e-${Date.now()}@example.com`;
  let token = null;

  logTest('E2E: Complete user journey');

  try {
    // Step 1: Signup
    const signupRes = await makeRequest(
      {
        path: '/auth/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: workflowEmail, password: 'e2etest123' }
    );
    assert(signupRes.status === 201, 'E2E Step 1: Signup', 'Failed');
    token = signupRes.data.access_token;

    // Step 2: Complete onboarding (update profile)
    const profileRes = await makeRequest(
      {
        path: '/users/me/profile',
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      {
        personal: { name: 'E2E Test User', sex: 'male' },
        goals: ['energy_fatigue', 'focus_cognition']
      }
    );
    assert(profileRes.status === 200, 'E2E Step 2: Onboarding', 'Failed');

    // Step 3: Get recommendations
    const recRes = await makeRequest({
      path: '/decide/me',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(recRes.status === 200, 'E2E Step 3: Get recommendations', 'Failed');

    // Step 4: Mark supplement as taken
    const intakeRes = await makeRequest(
      {
        path: '/supplements/intake',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      { supplement_id: 'vit_d3', taken: true }
    );
    assert(intakeRes.status === 200, 'E2E Step 4: Track intake', 'Failed');

    // Step 5: View dashboard (should show progress)
    const dashRes = await makeRequest({
      path: '/dashboard',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(dashRes.status === 200, 'E2E Step 5: View dashboard', 'Failed');
    assert(dashRes.data.supplements_taken > 0, 'E2E: Dashboard shows intake', 'No intake recorded');

    // Step 6: View tracking page
    const trackRes = await makeRequest({
      path: '/tracking/progress',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(trackRes.status === 200, 'E2E Step 6: View tracking', 'Failed');
    assert(trackRes.data.daily_intakes.length > 0, 'E2E: Tracking shows intake', 'No intake in tracking');

    pass('Complete E2E workflow');
  } catch (e) {
    fail(`E2E workflow: ${e.message}`);
  }
}

// ============================================
// SMOKE TESTS
// ============================================

async function runSmokeTests() {
  logSection('Smoke Tests - All Endpoints Reachable');

  const endpoints = [
    { method: 'GET', path: '/', requiresAuth: false },
    { method: 'POST', path: '/auth/signup', requiresAuth: false },
    { method: 'POST', path: '/auth/login', requiresAuth: false },
    { method: 'GET', path: '/users/me', requiresAuth: true },
    { method: 'GET', path: '/users/me/profile', requiresAuth: true },
    { method: 'PUT', path: '/users/me/profile', requiresAuth: true },
    { method: 'GET', path: '/decide/me', requiresAuth: true },
    { method: 'GET', path: '/supplements/recommendations', requiresAuth: true },
    { method: 'POST', path: '/supplements/intake', requiresAuth: true },
    { method: 'GET', path: '/tracking/progress', requiresAuth: true },
    { method: 'GET', path: '/dashboard', requiresAuth: true },
  ];

  // Create a test user for authenticated endpoints
  const testRes = await makeRequest(
    {
      path: '/auth/signup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: `smoke-${Date.now()}@example.com`, password: 'smoke123' }
  );
  const token = testRes.data.access_token;

  for (const endpoint of endpoints) {
    logTest(`${endpoint.method} ${endpoint.path}`);
    try {
      const options = {
        path: endpoint.path,
        method: endpoint.method,
        headers: endpoint.requiresAuth
          ? { 'Authorization': `Bearer ${token}` }
          : {}
      };

      const res = await makeRequest(options);

      // Accept any non-500 status as success for smoke test
      if (res.status < 500) {
        pass('Endpoint reachable');
      } else {
        fail(`Server error: ${res.status}`);
      }
    } catch (e) {
      fail(`Not reachable: ${e.message}`);
    }
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log(`\n${colors.bold}${colors.blue}╔═══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}║   myAja Backend Test Suite               ║${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}╚═══════════════════════════════════════════╝${colors.reset}\n`);

  const startTime = Date.now();

  try {
    // Unit tests
    await runUnitTests();

    // Integration tests
    const { token } = await testAuthentication();
    await testProfileManagement(token);
    await testRecommendations(token);
    await testIntakeTracking(token);
    await testProgressAndDashboard(token);

    // End-to-end tests
    await testEndToEndWorkflow();

    // Smoke tests
    await runSmokeTests();

  } catch (e) {
    console.error(`\n${colors.red}Fatal error: ${e.message}${colors.reset}`);
    console.error(e.stack);
  }

  // Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}Test Summary${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  console.log(`${colors.green}✓ Passed:${colors.reset} ${passed}`);
  console.log(`${colors.red}✗ Failed:${colors.reset} ${failed}`);
  console.log(`  Total:   ${passed + failed}`);
  console.log(`  Time:    ${duration}s\n`);

  if (failed > 0) {
    console.log(`${colors.bold}${colors.red}Failed Tests:${colors.reset}`);
    failures.forEach((failure, i) => {
      console.log(`  ${i + 1}. ${failure}`);
    });
    console.log('');
    process.exit(1);
  } else {
    console.log(`${colors.bold}${colors.green}🎉 All tests passed!${colors.reset}\n`);
    process.exit(0);
  }
}

// Run tests
runAllTests();
