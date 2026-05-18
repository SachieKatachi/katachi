/**
 * STATE MANAGEMENT
 * Centralized app state with observer pattern
 * Each state module handles one responsibility
 */

// ═══════════════════════════════════════════════════════
// AUTH STATE
// ═══════════════════════════════════════════════════════
const AuthState = (() => {
  let currentUser = null;
  let currentSession = null;
  const subscribers = new Set();

  // Initialize from storage
  function init() {
    const stored = StorageUtil.getItem(CONFIG.storage.session);
    if (stored && stored.id) {
      currentSession = stored;
      Logger.info('Session restored from storage');
    }
  }

  function subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  }

  function notify() {
    subscribers.forEach(callback => {
      try {
        callback({ user: currentUser, session: currentSession });
      } catch (err) {
        Logger.error('Auth subscriber error', { error: err.message });
      }
    });
  }

  function setUser(user, session) {
    currentUser = user;
    currentSession = session;
    StorageUtil.setItem(CONFIG.storage.session, session);
    Logger.info('Auth state updated', { userId: user?.id });
    notify();
  }

  function getUser() {
    return currentUser;
  }

  function getSession() {
    return currentSession;
  }

  function isAuthenticated() {
    return currentUser !== null && currentSession !== null;
  }

  function logout() {
    currentUser = null;
    currentSession = null;
    StorageUtil.removeItem(CONFIG.storage.session);
    Logger.info('User logged out');
    notify();
  }

  // Initialize on load
  init();

  return {
    subscribe,
    setUser,
    getUser,
    getSession,
    isAuthenticated,
    logout,
  };
})();

// ═══════════════════════════════════════════════════════
// UI STATE
// ═══════════════════════════════════════════════════════
const UIState = (() => {
  const state = {
    currentScreen: 's-land',
    currentPage: null,
    language: StorageUtil.getItem(CONFIG.storage.preferences)?.language || CONFIG.defaultLanguage,
    theme: StorageUtil.getItem(CONFIG.storage.preferences)?.theme || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    sidebarOpen: false,
    openModals: [],
    loadingStates: {},
  };

  const subscribers = new Set();

  function subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  }

  function notify() {
    if (CONFIG.debug.showStateUpdates) {
      console.log('[UI STATE]', state);
    }
    subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (err) {
        Logger.error('UI subscriber error', { error: err.message });
      }
    });
  }

  function setScreen(screenId) {
    const oldScreen = state.currentScreen;
    state.currentScreen = screenId;
    Logger.debug('Screen changed', { from: oldScreen, to: screenId });
    notify();
  }

  function setPage(pageId) {
    state.currentPage = pageId;
    Logger.debug('Page changed', { pageId });
    notify();
  }

  function setLanguage(lang) {
    if (!CONFIG.languages.includes(lang)) {
      Logger.warn('Invalid language', { lang });
      return;
    }
    state.language = lang;
    document.documentElement.lang = lang;
    savePreferences();
    Logger.info('Language changed', { lang });
    notify();
  }

  function setTheme(theme) {
    if (!['light', 'dark'].includes(theme)) {
      Logger.warn('Invalid theme', { theme });
      return;
    }
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    savePreferences();
    Logger.info('Theme changed', { theme });
    notify();
  }

  function toggleTheme() {
    setTheme(state.theme === 'light' ? 'dark' : 'light');
  }

  function openModal(modalId) {
    if (!state.openModals.includes(modalId)) {
      state.openModals.push(modalId);
      Logger.debug('Modal opened', { modalId });
      notify();
    }
  }

  function closeModal(modalId = null) {
    if (modalId === null) {
      state.openModals.pop();
    } else {
      state.openModals = state.openModals.filter(id => id !== modalId);
    }
    Logger.debug('Modal closed', { modalId });
    notify();
  }

  function getOpenModalId() {
    return state.openModals[state.openModals.length - 1] || null;
  }

  function setLoading(key, isLoading) {
    state.loadingStates[key] = isLoading;
    Logger.debug('Loading state changed', { key, isLoading });
    notify();
  }

  function isLoading(key) {
    return state.loadingStates[key] === true;
  }

  function savePreferences() {
    StorageUtil.setItem(CONFIG.storage.preferences, {
      language: state.language,
      theme: state.theme,
    });
  }

  // Initialize theme
  setTheme(state.theme);

  return {
    subscribe,
    setScreen,
    setPage,
    setLanguage,
    setTheme,
    toggleTheme,
    openModal,
    closeModal,
    getOpenModalId,
    setLoading,
    isLoading,
    getState: () => ({ ...state }),
  };
})();

// ═══════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════
const AppState = (() => {
  const state = {
    recipes: StorageUtil.getItem(CONFIG.storage.recipes) || [],
    codes: StorageUtil.getItem(CONFIG.storage.codes) || [],
    navNames: StorageUtil.getItem(CONFIG.storage.navNames) || {},
    completedSteps: StorageUtil.getItem(CONFIG.storage.cwDone) || {},
  };

  const subscribers = new Set();

  function subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  }

  function notify() {
    subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (err) {
        Logger.error('App subscriber error', { error: err.message });
      }
    });
  }

  function setRecipes(recipes) {
    state.recipes = recipes;
    StorageUtil.setItem(CONFIG.storage.recipes, recipes);
    Logger.debug('Recipes updated', { count: recipes.length });
    notify();
  }

  function addRecipe(recipe) {
    state.recipes.push(recipe);
    StorageUtil.setItem(CONFIG.storage.recipes, state.recipes);
    Logger.info('Recipe added', { id: recipe.id });
    notify();
  }

  function updateRecipe(id, updates) {
    const recipe = state.recipes.find(r => r.id === id);
    if (recipe) {
      Object.assign(recipe, updates);
      StorageUtil.setItem(CONFIG.storage.recipes, state.recipes);
      Logger.info('Recipe updated', { id });
      notify();
    }
  }

  function deleteRecipe(id) {
    state.recipes = state.recipes.filter(r => r.id !== id);
    StorageUtil.setItem(CONFIG.storage.recipes, state.recipes);
    Logger.info('Recipe deleted', { id });
    notify();
  }

  function getRecipes() {
    return [...state.recipes];
  }

  function getRecipe(id) {
    return state.recipes.find(r => r.id === id);
  }

  function setCodes(codes) {
    state.codes = codes;
    StorageUtil.setItem(CONFIG.storage.codes, codes);
    notify();
  }

  function getCodes() {
    return [...state.codes];
  }

  function setNavNames(names) {
    state.navNames = names;
    StorageUtil.setItem(CONFIG.storage.navNames, names);
    notify();
  }

  function getNavNames() {
    return { ...state.navNames };
  }

  function markStepComplete(stepId) {
    state.completedSteps[stepId] = true;
    StorageUtil.setItem(CONFIG.storage.cwDone, state.completedSteps);
    notify();
  }

  function getState() {
    return {
      recipes: [...state.recipes],
      codes: [...state.codes],
      navNames: { ...state.navNames },
      completedSteps: { ...state.completedSteps },
    };
  }

  return {
    subscribe,
    setRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipes,
    getRecipe,
    setCodes,
    getCodes,
    setNavNames,
    getNavNames,
    markStepComplete,
    getState,
  };
})();
