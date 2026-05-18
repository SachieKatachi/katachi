/**
 * APP.JS
 * Main app initialization
 * Runs after all modules are loaded
 */

function initializeApp() {
  // Wait for all dependencies to load
  if (typeof CONFIG === 'undefined' || typeof window.Logger === 'undefined') {
    console.log('Waiting for modules to load...');
    setTimeout(initializeApp, 100);
    return;
  }

  window.Logger.info('Initializing Katachi app', { version: CONFIG.version });

  // Check authentication on app start
  const isAuthenticated = AuthState.isAuthenticated();
  window.Logger.info('Auth check', { isAuthenticated });

  if (isAuthenticated) {
    Router.goToScreen('s-app');
  } else {
    Router.goToScreen('s-land');
  }

  // Subscribe to state changes for debugging (only if CONFIG is ready)
  if (window.CONFIG && CONFIG.debug && CONFIG.debug.showStateUpdates) {
    AuthState.subscribe((authState) => {
      console.log('[AUTH STATE]', authState);
    });

    UIState.subscribe((uiState) => {
      console.log('[UI STATE]', uiState);
    });

    AppState.subscribe((appState) => {
      console.log('[APP STATE]', appState.recipes.length + ' recipes');
    });
  }
}

// Handle theme changes
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const storedTheme = StorageUtil.getItem(CONFIG.storage.preferences);
    if (!storedTheme || !storedTheme.themeOverride) {
      UIState.setTheme(e.matches ? 'dark' : 'light');
    }
  });
}

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // ESC closes modals
  if (e.key === 'Escape') {
    const openModals = UIState.getState().openModals;
    if (openModals && openModals.length > 0) {
      UIState.closeModal();
      window.Logger.debug('Modal closed via ESC');
    }
  }

  // Ctrl+K / Cmd+K for search (future feature)
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (EventDelegation && EventDelegation.dispatch) {
      EventDelegation.dispatch('search-open');
    }
  }
});

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Global error handling
window.addEventListener('error', (event) => {
  if (window.Logger) {
    window.Logger.error('Uncaught error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (window.Logger) {
    window.Logger.error('Unhandled promise rejection', {
      reason: event.reason?.message || event.reason,
    });
  }
});

// Expose logging for debugging
window.getLogs = () => window.Logger ? window.Logger.getLogs() : [];
window.clearLogs = () => { if (window.Logger) window.Logger.clearLogs(); };
