/**
 * ROUTER MODULE
 * Handles screen navigation and button actions
 */

const Router = (() => {
  // Track current screen
  let currentScreen = 's-land';

  // Hide all screens, show one
  function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
      screen.style.display = 'none';
      screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.style.display = 'flex';
      targetScreen.classList.add('active');
      currentScreen = screenId;
      
      if (window.Logger) {
        window.Logger.info('Navigated to screen', { from: 'router', to: screenId });
      }
      console.log('[ROUTER] Screen changed to:', screenId);
    } else {
      console.error('[ROUTER] Screen not found:', screenId);
    }
  }

  // Navigate to screen
  function goToScreen(screenId) {
    console.log('[ROUTER] goToScreen called:', screenId);
    
    // Validate screen exists
    const screen = document.getElementById(screenId);
    if (!screen) {
      console.error('[ROUTER] Screen does not exist:', screenId);
      return;
    }

    showScreen(screenId);

    // Handle special logic for each screen
    if (screenId === 's-auth') {
      setupAuthTabs();
    } else if (screenId === 's-lang') {
      setupLanguageScreen();
    } else if (screenId === 's-app') {
      setupAppScreen();
    }
  }

  // Setup auth screen tabs
  function setupAuthTabs() {
    const signupTab = document.querySelector('[data-tab="signup"]');
    const loginTab = document.querySelector('[data-tab="login"]');
    const nameField = document.getElementById('nameField');
    const passwordConfirmField = document.getElementById('passwordConfirmField');
    const submitBtn = document.getElementById('authSubmitBtn');

    if (signupTab) {
      signupTab.addEventListener('click', () => {
        // Show signup fields
        if (nameField) nameField.style.display = 'block';
        if (passwordConfirmField) passwordConfirmField.style.display = 'block';
        if (submitBtn) submitBtn.textContent = 'Sign Up';
        
        // Update tab styling
        signupTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
      });
    }

    if (loginTab) {
      loginTab.addEventListener('click', () => {
        // Hide signup fields
        if (nameField) nameField.style.display = 'none';
        if (passwordConfirmField) passwordConfirmField.style.display = 'none';
        if (submitBtn) submitBtn.textContent = 'Sign In';
        
        // Update tab styling
        loginTab.classList.add('active');
        if (signupTab) signupTab.classList.remove('active');
      });
    }
  }

  // Setup language screen
  function setupLanguageScreen() {
    console.log('[ROUTER] Language screen setup');
    const langButtons = document.querySelectorAll('[data-action="lang-select"]');
    
    langButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        console.log('[ROUTER] Language selected:', lang);
        
        if (window.AuthState) {
          window.AuthState.setLanguage(lang);
        }
        
        goToScreen('s-app');
      });
    });
  }

  // Setup app screen
  function setupAppScreen() {
    console.log('[ROUTER] App screen setup');
  }

  // Attach global button handlers
  function attachButtonHandlers() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      console.log('[ROUTER] Button action:', action);

      switch (action) {
        case 'nav-land':
          goToScreen('s-land');
          break;
        case 'nav-auth':
          goToScreen('s-auth');
          break;
        case 'nav-signin':
          goToScreen('s-auth');
          // Switch to login tab
          const loginTab = document.querySelector('[data-tab="login"]');
          if (loginTab) loginTab.click();
          break;
        case 'logout':
          if (window.EmailAuth) {
            window.EmailAuth.logout();
          }
          goToScreen('s-land');
          break;
        case 'signup-tab':
          // Handled in setupAuthTabs
          break;
        case 'login-tab':
          // Handled in setupAuthTabs
          break;
        case 'lang-select':
          // Handled in setupLanguageScreen
          break;
        default:
          console.log('[ROUTER] Unknown action:', action);
      }
    });
  }

  // Initialize router
  function init() {
    console.log('[ROUTER] Initializing');
    attachButtonHandlers();
    setupAuthTabs();
    showScreen('s-land');
  }

  return {
    goToScreen: goToScreen,
    getCurrentScreen: () => currentScreen,
    init: init
  };
})();

// CRITICAL: Export to window
window.Router = Router;
console.log('[ROUTER] Router module loaded');

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.Router && window.Router.init) {
      window.Router.init();
    }
  });
} else {
  if (window.Router && window.Router.init) {
    window.Router.init();
  }
}
