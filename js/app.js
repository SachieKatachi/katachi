/**
 * APP.JS
 * Main app initialization
 * Runs after all modules are loaded
 */

// Use window.Logger directly (don't destructure)
function initializeApp() {
  window.Logger.info('Initializing Katachi app', { version: CONFIG.version });

  // Check authentication on app start
  const isAuthenticated = AuthState.isAuthenticated();
  window.Logger.info('Auth check', { isAuthenticated });

  if (isAuthenticated) {
    Router.goToScreen('s-app');
  } else {
    Router.goToScreen('s-land');
  }

  // Subscribe to state changes for debugging
  if (CONFIG.debug.showStateUpdates) {
    AuthState.subscribe((authState) => {
      console.log('[AUTH STATE]', authState);
    });
  }

  UIState.subscribe((uiState) => {
    console.log('[UI STATE]', uiState);
  });

  AppState.subscribe((appState) => {
    console.log('[APP STATE]', appState.recipes.length + ' recipes');
  });
}

// Handle theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!StorageUtil.getItem(CONFIG.storage.preferences)?.themeOverride) {
    UIState.setTheme(e.matches ? 'dark' : 'light');
  }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // ESC closes modals
  if (e.key === 'Escape') {
    const openModal = UIState.getState().openModals.length;
    if (openModal > 0) {
      UIState.closeModal();
      window.Logger.debug('Modal closed via ESC');
    }
  }

  // Ctrl+K / Cmd+K for search (future feature)
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    EventDelegation.dispatch('search-open');
  }
});

window.Logger.info('App initialized successfully');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Global error handling
window.addEventListener('error', (event) => {
  window.Logger.error('Uncaught error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  window.Logger.error('Unhandled promise rejection', {
    reason: event.reason?.message || event.reason,
  });
});

// Expose logging for debugging
window.getLogs = () => window.Logger.getLogs();
window.clearLogs = () => window.Logger.clearLogs();
