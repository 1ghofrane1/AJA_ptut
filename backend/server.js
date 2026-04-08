const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for all origins (for development)
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock user database
const users = new Map();
let userIdCounter = 1;

const EMAIL_REGEX =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const COMMON_EMAIL_DOMAIN_FIXES = {
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.fr': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'googlemail.fr': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'icloud.fr': 'icloud.com',
  'icloud,com': 'icloud.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outlook.fr': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com'
};

// Mock supplement intake tracking database
const supplementIntakes = new Map(); // userId -> array of intake records

// Supplement library (for recommendations)
const SUPPLEMENT_LIBRARY = [
  {
    id: 'mag_bisgly',
    name: 'Magnésium Bisglycinate',
    dosage: '300mg',
    timing: 'evening',
    reason: 'Favorise la relaxation et améliore la qualité du sommeil',
    molecules: ['Magnésium', 'Glycine'],
    warnings: 'Prendre 30 min avant le coucher',
    goals: ['sleep_support', 'stress_anxiety_support'],
    conditions_avoid: []
  },
  {
    id: 'vit_d3',
    name: 'Vitamine D3',
    dosage: '2000 UI',
    timing: 'morning',
    reason: 'Renforce le système immunitaire et l\'absorption du calcium',
    molecules: ['Cholécalciférol'],
    goals: ['immune_support'],
    conditions_avoid: []
  },
  {
    id: 'omega_3',
    name: 'Oméga-3 EPA/DHA',
    dosage: '1000mg',
    timing: 'morning',
    reason: 'Soutient la santé cardiovasculaire et cognitive',
    molecules: ['EPA', 'DHA'],
    warnings: 'À prendre pendant un repas',
    goals: ['focus_cognition', 'pain_inflammation'],
    conditions_avoid: ['taking_anticoagulants']
  }
];

// Helper to generate mock JWT token
const generateToken = (userId) => {
  return `mock_token_${userId}_${Date.now()}`;
};

// Helper to extract user ID from token
const extractUserIdFromToken = (token) => {
  // Token format: mock_token_user_1_1771232353622
  // Remove prefix and timestamp suffix to get userId
  const withoutPrefix = token.replace('mock_token_', '');
  const lastUnderscoreIndex = withoutPrefix.lastIndexOf('_');
  return withoutPrefix.substring(0, lastUnderscoreIndex);
};

// Helper to create user response
const createUserResponse = (user) => {
  return {
    id: user.id,
    email: user.email,
    role: user.role || 'user',
    profile: user.profile || {},
    created_at: user.created_at,
    updated_at: user.updated_at
  };
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const validateEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
    return { valid: false, normalizedEmail, reason: 'invalid_email' };
  }

  const [localPart, domain] = normalizedEmail.split('@');
  if (
    !localPart ||
    !domain ||
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..') ||
    domain.startsWith('.') ||
    domain.endsWith('.') ||
    domain.includes('..')
  ) {
    return { valid: false, normalizedEmail, reason: 'invalid_email' };
  }

  const suggestedDomain = COMMON_EMAIL_DOMAIN_FIXES[domain];
  if (suggestedDomain) {
    return {
      valid: false,
      normalizedEmail,
      reason: 'typo_domain',
      suggestion: `${localPart}@${suggestedDomain}`
    };
  }

  return { valid: true, normalizedEmail };
};

const findUserByEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);

  for (const [, user] of users) {
    if (normalizeEmail(user.email) === normalizedEmail) {
      return user;
    }
  }

  return null;
};

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'myAja Backend API - Mock Server', status: 'running' });
});

app.get('/auth/check-email', (req, res) => {
  const emailValidation = validateEmail(req.query.email);

  if (!emailValidation.valid) {
    return res.json({
      available: false,
      normalized_email: emailValidation.normalizedEmail,
      reason: emailValidation.reason,
      suggestion: emailValidation.suggestion || null
    });
  }

  const existingUser = findUserByEmail(emailValidation.normalizedEmail);

  return res.json({
    available: !existingUser,
    normalized_email: emailValidation.normalizedEmail,
    reason: existingUser ? 'already_exists' : null,
    suggestion: null
  });
});

// Signup endpoint
app.post('/auth/signup', (req, res) => {
  const { email, password } = req.body;
  const emailValidation = validateEmail(email);

  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  if (!emailValidation.valid) {
    return res.status(400).json({
      detail: 'Invalid email address',
      reason: emailValidation.reason,
      suggestion: emailValidation.suggestion || null
    });
  }

  const normalizedEmail = emailValidation.normalizedEmail;

  if (findUserByEmail(normalizedEmail)) {
    return res.status(409).json({ detail: 'User already exists' });
  }

  // Create new user
  const userId = `user_${userIdCounter++}`;
  const now = new Date().toISOString();
  const user = {
    id: userId,
    email: normalizedEmail,
    password, // In real app, this should be hashed!
    role: 'user',
    profile: {},
    created_at: now,
    updated_at: now
  };

  users.set(userId, user);

  const token = generateToken(userId);
  const userResponse = createUserResponse(user);

  console.log(`✅ New user signed up: ${email} (${userId})`);

  res.status(201).json({
    access_token: token,
    token_type: 'bearer',
    user: userResponse
  });
});

// Login endpoint
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  console.log(`🔐 Login attempt: ${email}`);

  if (!email || !password) {
    console.log(`❌ Login failed: Missing email or password`);
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  // Find user
  const foundUser = findUserByEmail(normalizedEmail);
  if (!foundUser || foundUser.password !== password) {
    console.log(`❌ Login failed: Invalid credentials for ${email} (user not found or wrong password)`);
    return res.status(401).json({ detail: 'Invalid credentials' });
  }

  const token = generateToken(foundUser.id);
  const userResponse = createUserResponse(foundUser);

  console.log(`✅ User logged in: ${email} (${foundUser.id})`);

  res.json({
    access_token: token,
    token_type: 'bearer',
    user: userResponse
  });
});

// Get current user endpoint
app.get('/users/me', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  const token = authHeader.substring(7);

  // Extract user ID from token (mock implementation)
  const userId = extractUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ detail: 'Invalid token' });
  }

  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }

  const userResponse = createUserResponse(user);
  res.json(userResponse);
});

// Get user profile endpoint
app.get('/users/me/profile', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  const token = authHeader.substring(7);
  const userId = extractUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ detail: 'Invalid token' });
  }

  // userId already extracted
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }

  // Return just the profile data
  res.json(user.profile || {});
});

// Update user profile endpoint
app.put('/users/me/profile', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  const token = authHeader.substring(7);
  const userId = extractUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ detail: 'Invalid token' });
  }

  // userId already extracted
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }

  // Update profile
  user.profile = { ...user.profile, ...req.body };
  user.updated_at = new Date().toISOString();
  users.set(userId, user);

  console.log(`✅ Profile updated for: ${user.email} (${userId})`);

  const userResponse = createUserResponse(user);
  res.json(userResponse);
});

// ============================================
// NEW ENDPOINTS FOR SUPPLEMENT TRACKING
// ============================================

// Get personalized supplement recommendations
app.get('/supplements/recommendations', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  const token = authHeader.substring(7);
  const userId = extractUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ detail: 'Invalid token' });
  }

  // userId already extracted
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }

  // Get user's goals and conditions from profile
  const userGoals = user.profile?.goals || [];
  const userConditions = user.profile?.medical?.conditions || [];
  const userMedications = user.profile?.medical?.medications || [];
  const allConditions = [...userConditions, ...userMedications];

  // Filter supplements based on user profile
  const recommendations = SUPPLEMENT_LIBRARY.filter(supp => {
    // Skip if user has contraindicated conditions
    if (supp.conditions_avoid.some(cond => allConditions.includes(cond))) {
      return false;
    }
    // Include if matches user goals
    if (userGoals.length === 0) return true; // If no goals, show all safe supplements
    return supp.goals.some(goal => userGoals.includes(goal));
  });

  // Get today's intake status
  const userIntakes = supplementIntakes.get(userId) || [];
  const today = new Date().toDateString();
  const todayIntakes = userIntakes.filter(intake =>
    new Date(intake.timestamp).toDateString() === today
  );

  // Add "taken" status to each recommendation
  const recommendationsWithStatus = recommendations.map(supp => ({
    ...supp,
    taken: todayIntakes.some(intake => intake.supplement_id === supp.id)
  }));

  res.json({
    recommendations: recommendationsWithStatus,
    goals: userGoals.slice(0, 3).map(goal => ({
      label: goal.replace(/_/g, ' '),
      confidence: 3
    }))
  });
});

// Track supplement intake
app.post('/supplements/intake', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  const token = authHeader.substring(7);
  const userId = extractUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ detail: 'Invalid token' });
  }

  // userId already extracted
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }

  const { supplement_id, taken } = req.body;

  if (!supplement_id || typeof taken !== 'boolean') {
    return res.status(400).json({ detail: 'supplement_id and taken (boolean) are required' });
  }

  // Get or create intake array for user
  let userIntakes = supplementIntakes.get(userId) || [];

  const today = new Date().toDateString();
  const now = new Date().toISOString();

  if (taken) {
    // Add intake record
    userIntakes.push({
      supplement_id,
      timestamp: now
    });
  } else {
    // Remove today's intake for this supplement
    userIntakes = userIntakes.filter(intake => {
      const isSameSupplement = intake.supplement_id === supplement_id;
      const isToday = new Date(intake.timestamp).toDateString() === today;
      return !(isSameSupplement && isToday);
    });
  }

  supplementIntakes.set(userId, userIntakes);

  console.log(`✅ Supplement intake updated: ${user.email} - ${supplement_id} = ${taken}`);

  res.json({ success: true, taken });
});

// Get user's progress data
app.get('/tracking/progress', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  const token = authHeader.substring(7);
  const userId = extractUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ detail: 'Invalid token' });
  }

  // userId already extracted
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }

  const userIntakes = supplementIntakes.get(userId) || [];

  // Calculate today's progress
  const today = new Date().toDateString();
  const todayIntakes = userIntakes.filter(intake =>
    new Date(intake.timestamp).toDateString() === today
  );

  // Get expected supplements count (from recommendations)
  const userGoals = user.profile?.goals || [];
  const expectedSupplements = SUPPLEMENT_LIBRARY.filter(supp =>
    userGoals.some(goal => supp.goals.includes(goal))
  );
  const expectedCount = expectedSupplements.length || 3;
  const todayProgress = Math.round((todayIntakes.length / expectedCount) * 100);

  // Calculate weekly data
  const weeklyData = [];
  const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    const dayIntakes = userIntakes.filter(intake =>
      new Date(intake.timestamp).toDateString() === dateStr
    );
    weeklyData.push({
      day: daysOfWeek[6 - i],
      completed: dayIntakes.length >= expectedCount
    });
  }

  // Calculate adherence data (last 7 days)
  const adherenceData = weeklyData.map(d => d.completed);

  // Calculate evolution data (last 10 days)
  const evolutionData = [];
  for (let i = 9; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    const dayIntakes = userIntakes.filter(intake =>
      new Date(intake.timestamp).toDateString() === dateStr
    );
    const score = Math.round((dayIntakes.length / expectedCount) * 100);
    evolutionData.push({
      day: 10 - i,
      value: Math.min(score, 100)
    });
  }

  // Calculate monthly heatmap (last 30 days)
  const monthlyData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    const dayIntakes = userIntakes.filter(intake =>
      new Date(intake.timestamp).toDateString() === dateStr
    );
    const intensity = Math.min(Math.floor(dayIntakes.length), 3);
    monthlyData.push({
      day: 30 - i,
      intensity
    });
  }

  res.json({
    today_progress: todayProgress,
    weekly_data: weeklyData,
    adherence_data: adherenceData,
    evolution_data: evolutionData,
    monthly_data: monthlyData,
    daily_intakes: todayIntakes.map(intake => {
      const supp = SUPPLEMENT_LIBRARY.find(s => s.id === intake.supplement_id);
      return {
        time: new Date(intake.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        name: supp?.name || 'Unknown',
        taken: true
      };
    })
  });
});

// Get decision for user (personalized supplement plan)
app.get('/decide/me', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  const token = authHeader.substring(7);
  const userId = extractUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ detail: 'Invalid token' });
  }

  // userId already extracted
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }

  // Get user's goals and conditions from profile
  const userGoals = user.profile?.goals || [];
  const userConditions = user.profile?.medical?.conditions || [];
  const userMedications = user.profile?.medical?.medications || [];
  const allConditions = [...userConditions, ...userMedications];

  // Get today's intake status
  const userIntakes = supplementIntakes.get(userId) || [];
  const today = new Date().toDateString();
  const todayIntakes = userIntakes.filter(intake =>
    new Date(intake.timestamp).toDateString() === today
  );

  // Build recommendations grouped by goal
  const planByGoal = {};

  for (const goal of userGoals) {
    // Find supplements that match this goal
    const matchingSupplements = SUPPLEMENT_LIBRARY.filter(supp => {
      // Skip if user has contraindicated conditions
      if (supp.conditions_avoid.some(cond => allConditions.includes(cond))) {
        return false;
      }
      // Include if matches this goal
      return supp.goals.includes(goal);
    });

    // Map to expected format
    planByGoal[goal] = matchingSupplements.map(supp => ({
      id: supp.id,
      produit: supp.name,
      posologie: supp.dosage,
      timing: supp.timing,
      justification: supp.reason,
      molecules: supp.molecules,
      warning: supp.warnings,
      symptomes_couverts: supp.goals,
      taken: todayIntakes.some(intake => intake.supplement_id === supp.id)
    }));
  }

  // Response format expected by frontend
  const response = {
    decision: {
      plan_par_objectif: planByGoal,
      goals: userGoals
    },
    derived_input: {
      goals: userGoals,
      objectifs: userGoals
    }
  };

  res.json(response);
});

// Get dashboard summary
app.get('/dashboard', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  const token = authHeader.substring(7);
  const userId = extractUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ detail: 'Invalid token' });
  }

  // userId already extracted
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }

  const userIntakes = supplementIntakes.get(userId) || [];

  // Get user's first name from profile
  const userName = user.profile?.personal?.name?.split(' ')[0] || 'User';

  // Calculate today's progress
  const today = new Date().toDateString();
  const todayIntakes = userIntakes.filter(intake =>
    new Date(intake.timestamp).toDateString() === today
  );

  const userGoals = user.profile?.goals || [];
  const expectedSupplements = SUPPLEMENT_LIBRARY.filter(supp =>
    userGoals.some(goal => supp.goals.includes(goal))
  );
  const expectedCount = expectedSupplements.length || 3;
  const todayProgress = Math.round((todayIntakes.length / expectedCount) * 100);

  // Calculate weekly adherence
  const weeklyData = [];
  const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    const dayIntakes = userIntakes.filter(intake =>
      new Date(intake.timestamp).toDateString() === dateStr
    );
    weeklyData.push({
      day: daysOfWeek[6 - i],
      completed: dayIntakes.length >= expectedCount
    });
  }

  const adherenceData = weeklyData.map(d => d.completed);

  res.json({
    user_name: userName,
    today_progress: todayProgress,
    supplements_taken: todayIntakes.length,
    supplements_total: expectedCount,
    weekly_data: weeklyData,
    adherence_data: adherenceData
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 myAja Mock Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📡 CORS enabled for frontend development`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST   /auth/signup                    - Create new account`);
  console.log(`   POST   /auth/login                     - Authenticate user`);
  console.log(`   GET    /users/me                       - Get current user`);
  console.log(`   GET    /users/me/profile               - Get user profile`);
  console.log(`   PUT    /users/me/profile               - Update user profile`);
  console.log(`   GET    /decide/me                      - Get personalized decision & recommendations`);
  console.log(`   GET    /supplements/recommendations    - Get personalized recommendations (legacy)`);
  console.log(`   POST   /supplements/intake             - Track supplement intake`);
  console.log(`   GET    /tracking/progress              - Get tracking data`);
  console.log(`   GET    /dashboard                      - Get dashboard summary`);
  console.log(`\n💡 This is a MOCK server for development only!\n`);
});
