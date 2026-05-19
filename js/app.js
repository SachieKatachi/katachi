/**
 * APP.JS - ENHANCED
 * Main app initialization with profile modal and settings
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
    setupProfileModal();
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

/**
 * SETUP PROFILE MODAL
 */
function setupProfileModal() {
  const profileBtn = document.getElementById('user-menu');
  const profileModal = document.getElementById('profile-modal');
  const overlay = document.querySelector('.modal-overlay');
  const closeButtons = document.querySelectorAll('[data-action="close-modal"]');
  const logoutBtn = document.getElementById('modal-logout-btn');
  
  if (!profileBtn || !profileModal) {
    console.warn('[App] Profile button or modal not found');
    return;
  }

  // Load current user info
  const currentUser = ClientAuth.getCurrentUser();
  if (currentUser) {
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-tier').textContent = localStorage.getItem('k_user_tier') || 'Free';
    const joinDate = new Date(currentUser.createdAt);
    document.getElementById('profile-joined').textContent = joinDate.toLocaleDateString();
  }

  // Open modal
  profileBtn.addEventListener('click', () => {
    profileModal.classList.add('active');
    setupModalHandlers();
  });

  // Close modal
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      profileModal.classList.remove('active');
    });
  });

  overlay.addEventListener('click', () => {
    profileModal.classList.remove('active');
  });

  // Logout from modal
  logoutBtn.addEventListener('click', () => {
    if (window.ClientAuth) {
      window.ClientAuth.logout();
    }
    profileModal.classList.remove('active');
    Router.goToScreen('s-land');
  });

  // Set current language/theme in modal
  updateModalSettings();
}

/**
 * SETUP MODAL HANDLERS
 */
function setupModalHandlers() {
  const langChoices = document.querySelectorAll('.lang-choice');
  const themeChoices = document.querySelectorAll('.theme-choice');
  const changePwdBtn = document.getElementById('change-pwd-btn');
  
  // Language choices
  langChoices.forEach(btn => {
    btn.addEventListener('click', async () => {
      const lang = btn.getAttribute('data-lang');
      localStorage.setItem('k_lang', lang);
      
      // Update UI
      langChoices.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update page language
      if (window.I18n) {
        window.I18n.setLanguage(lang);
        window.I18n.updatePageLanguage();
      }
      
      console.log('[Profile] Language changed to:', lang);
    });
  });

  // Theme choices
  themeChoices.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('k_theme', theme);
      
      // Update UI
      themeChoices.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      console.log('[Profile] Theme changed to:', theme);
    });
  });

  // Password change
  changePwdBtn.addEventListener('click', async () => {
    const currentPwd = document.getElementById('current-pwd').value;
    const newPwd = document.getElementById('new-pwd').value;
    const confirmPwd = document.getElementById('confirm-pwd').value;
    const message = document.getElementById('pwd-message');

    // Validation
    if (!currentPwd || !newPwd || !confirmPwd) {
      message.classList.add('error');
      message.classList.remove('success');
      message.textContent = 'All fields are required';
      return;
    }

    if (newPwd !== confirmPwd) {
      message.classList.add('error');
      message.classList.remove('success');
      message.textContent = 'New passwords do not match';
      return;
    }

    if (newPwd.length < 6) {
      message.classList.add('error');
      message.classList.remove('success');
      message.textContent = 'Password must be at least 6 characters';
      return;
    }

    // Attempt password change
    const currentUser = ClientAuth.getCurrentUser();
    const result = await ClientAuth.resetPassword(currentUser.email, currentPwd, newPwd);

    if (result.success) {
      message.classList.remove('error');
      message.classList.add('success');
      message.textContent = 'Password updated successfully';
      
      // Clear form
      document.getElementById('current-pwd').value = '';
      document.getElementById('new-pwd').value = '';
      document.getElementById('confirm-pwd').value = '';
      
      setTimeout(() => {
        message.textContent = '';
        message.classList.remove('success');
      }, 3000);
    } else {
      message.classList.add('error');
      message.classList.remove('success');
      message.textContent = result.error || 'Failed to update password';
    }
  });
}

/**
 * UPDATE MODAL SETTINGS DISPLAY
 */
function updateModalSettings() {
  const currentLang = localStorage.getItem('k_lang') || 'en';
  const currentTheme = localStorage.getItem('k_theme') || 'dark';
  
  // Set language buttons
  document.querySelectorAll('.lang-choice').forEach(btn => {
    if (btn.getAttribute('data-lang') === currentLang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Set theme buttons
  document.querySelectorAll('.theme-choice').forEach(btn => {
    if (btn.getAttribute('data-theme') === currentTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
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
    const profileModal = document.getElementById('profile-modal');
    if (profileModal && profileModal.classList.contains('active')) {
      profileModal.classList.remove('active');
    }
    
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

