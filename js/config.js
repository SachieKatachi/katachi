/**
 * CONFIG.JS
 * Central configuration for Katachi app
 * All magic numbers and constants live here
 */

const CONFIG = {
  // APP INFO
  appName: 'Katachi',
  version: '1.0.0',
  appUrl: 'https://getkatachi.app',

  // AUTH
  auth: {
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sessionTimeout: 1000 * 60 * 60 * 24, // 24 hours
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, // 8+ chars, uppercase, lowercase, digit
  },

  // STORAGE KEYS
  storage: {
    user: 'k_user',
    session: 'k_session',
    preferences: 'k_prefs',
    recipes: 'k_recipes',
    codes: 'k_codes',
    navNames: 'k_navNames',
    cwDone: 'k_cwDone',
  },

  // THEME
  theme: {
    light: 'light',
    dark: 'dark',
  },

  // LANGUAGES
  languages: ['en', 'ja'],
  defaultLanguage: 'en',

  // TRIAL PERIOD
  trial: {
    days: 14,
    freeForever: true, // Free tier available
  },

  // PRICING TIERS
  tiers: {
    free: { id: 'free', name: 'Free', price: 0 },
    pro: { id: 'pro', name: 'Pro', price: 29 },
    growth: { id: 'growth', name: 'Growth', price: 59 },
    multi: { id: 'multi', name: 'Multi', price: 149 },
  },

  // FEATURES BY TIER
  features: {
    free: ['recipes', 'basic_prep', 'inventory'],
    pro: ['recipes', 'prep_lists', 'inventory', 'orders', 'ai_basic'],
    growth: ['recipes', 'prep_lists', 'inventory', 'orders', 'ai_advanced', 'scanning'],
    multi: ['recipes', 'prep_lists', 'inventory', 'orders', 'ai_advanced', 'scanning', 'multi_location'],
  },

  // NAVIGATION
  nav: [
    { id: 'recipes', icon: '📋', label: 'Recipes' },
    { id: 'prep', icon: '✅', label: 'Prep' },
    { id: 'inventory', icon: '📦', label: 'Inventory' },
    { id: 'orders', icon: '🛒', label: 'Orders' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ],

  // API ENDPOINTS (if using backend)
  api: {
    baseUrl: process.env.API_URL || 'https://api.getkatachi.app',
    endpoints: {
      auth: '/api/auth',
      recipes: '/api/recipes',
      prep: '/api/prep',
      inventory: '/api/inventory',
    },
  },

  // LOGGING
  logging: {
    enabled: true,
    level: 'info', // 'debug', 'info', 'warn', 'error'
  },

  // DEBUGGING
  debug: {
    enabled: new URLSearchParams(window.location.search).has('debug'),
    showStateUpdates: new URLSearchParams(window.location.search).has('state'),
  },
};

// Freeze config to prevent accidental mutations
Object.freeze(CONFIG);
Object.freeze(CONFIG.auth);
Object.freeze(CONFIG.storage);
Object.freeze(CONFIG.theme);
Object.freeze(CONFIG.api);
