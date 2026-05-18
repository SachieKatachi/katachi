/**
 * ROUTER MODULE
 * Single source of truth for navigation
 * Replaces the dual go() / showPage() system
 */

const Router = (() => {
  const validScreens = ['s-land', 's-auth', 's-lang', 's-app'];
  
  function goToScreen(screenId, options = {}) {
    if (!validScreens.includes(screenId)) {
      window.Logger.warn('Invalid screen', { screenId });
      return false;
    }

    const currentScreen = UIState.getState().currentScreen;
    if (currentScreen === screenId && !options.force) {
      window.Logger.debug('Already on screen', { screenId });
      return true;
    }

    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
      screen.style.display = 'none';
    });

    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
      targetScreen.style.display = 'flex';
      UIState.setScreen(screenId);
      window.Logger.info('Navigated to screen', { from: currentScreen, to: screenId });
      
      // Reset scroll position
      if (options.resetScroll !== false) {
        window.scrollTo(0, 0);
      }

      return true;
    }

    window.Logger.error('Screen not found', { screenId });
    return false;
  }

  function goToPage(pageId) {
    // Only valid when on app screen
    if (UIState.getState().currentScreen !== 's-app') {
      window.Logger.warn('Cannot navigate to page outside app screen', { pageId });
      return false;
    }

    const validPages = CONFIG.nav.map(n => n.id).concat(['settings', 'pricing']);
    if (!validPages.includes(pageId)) {
      window.Logger.warn('Invalid page', { pageId });
      return false;
    }

    UIState.setPage(pageId);
    window.Logger.info('Page changed', { pageId });
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('page-changed', { detail: { pageId } }));

    return true;
  }

  function back() {
    const currentScreen = UIState.getState().currentScreen;
    
    // Define back navigation
    const backMap = {
      's-auth': 's-land',
      's-lang': 's-auth',
      's-app': 's-land',
    };

    const targetScreen = backMap[currentScreen];
    if (targetScreen) {
      return goToScreen(targetScreen);
    }

    window.Logger.warn('Cannot go back from', { currentScreen });
    return false;
  }

  return {
    goToScreen,
    goToPage,
    back,
  };
})();

// ═══════════════════════════════════════════════════════
// EVENT DELEGATION SYSTEM
// ═══════════════════════════════════════════════════════

const EventDelegation = (() => {
  const handlers = {};

  function register(action, handler) {
    if (!handlers[action]) {
      handlers[action] = [];
    }
    handlers[action].push(handler);
    if (window.Logger) {
      window.Logger.debug('Action registered', { action });
    }
  }

  function dispatch(action, data = {}) {
    if (!handlers[action]) {
      if (window.Logger) {
        window.Logger.warn('No handler for action', { action });
      }
      return false;
    }

    if (window.Logger) {
      window.Logger.debug('Action dispatched', { action, data });
    }
    handlers[action].forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        if (window.Logger) {
          window.Logger.error('Action handler error', { action, error: err.message });
        }
      }
    });

    return true;
  }

  // Initialize global click handler
  document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-action]');
    if (button) {
      const action = button.getAttribute('data-action');
      const data = {};

      // Collect data attributes
      Array.from(button.attributes).forEach(attr => {
        if (attr.name.startsWith('data-')) {
          const key = attr.name.replace('data-', '');
          if (key !== 'action') {
            data[key] = attr.value;
          }
        }
      });

      e.preventDefault();
      dispatch(action, data);
    }
  });

  return {
    register,
    dispatch,
  };
})();

// ═══════════════════════════════════════════════════════
// REGISTER ALL NAVIGATION ACTIONS
// ═══════════════════════════════════════════════════════

// Basic navigation
EventDelegation.register('nav-land', () => Router.goToScreen('s-land'));
EventDelegation.register('nav-auth', () => Router.goToScreen('s-auth'));
EventDelegation.register('nav-signin', () => Router.goToScreen('s-auth'));
EventDelegation.register('nav-app', () => Router.goToScreen('s-app'));

// Auth tabs
EventDelegation.register('signup-tab', () => {
  // Show signup fields
  const nameField = document.getElementById('nameField');
  const passwordConfirmField = document.getElementById('passwordConfirmField');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  
  if (nameField) nameField.style.display = 'block';
  if (passwordConfirmField) passwordConfirmField.style.display = 'block';
  if (authSubmitBtn) authSubmitBtn.textContent = 'Sign Up';
  
  // Update tab styles
  document.querySelectorAll('.auth-tab').forEach((tab, i) => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === 'signup');
  });
  
  if (window.Logger) {
    window.Logger.debug('Switched to signup mode');
  }
});

EventDelegation.register('login-tab', () => {
  // Hide signup fields
  const nameField = document.getElementById('nameField');
  const passwordConfirmField = document.getElementById('passwordConfirmField');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  
  if (nameField) nameField.style.display = 'none';
  if (passwordConfirmField) passwordConfirmField.style.display = 'none';
  if (authSubmitBtn) authSubmitBtn.textContent = 'Sign In';
  
  // Update tab styles
  document.querySelectorAll('.auth-tab').forEach((tab, i) => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === 'login');
  });
  
  if (window.Logger) {
    window.Logger.debug('Switched to login mode');
  }
});

// Language selection
EventDelegation.register('lang-select', (data) => {
  if (UIState && UIState.setLanguage) {
    UIState.setLanguage(data.lang);
  }
  if (window.Logger) {
    window.Logger.info('Language selected', { lang: data.lang });
  }
  // Navigate to app after language selection
  Router.goToScreen('s-app');
});

// Logout
EventDelegation.register('logout', () => {
  if (AuthState && AuthState.logout) {
    AuthState.logout();
  }
  Router.goToScreen('s-land');
});

// Auth form submission
EventDelegation.register('auth-submit', async (data) => {
  const isSignup = document.getElementById('authSubmitBtn').textContent === 'Sign Up';
  
  if (isSignup) {
    await handleSignup();
  } else {
    await handleLogin();
  }
});

async function handleSignup() {
  if (UIState) UIState.setLoading('auth', true);
  
  try {
    const name = document.getElementById('authName')?.value;
    const email = document.getElementById('authEmail')?.value;
    const password = document.getElementById('authPassword')?.value;
    const passwordConfirm = document.getElementById('authPasswordConfirm')?.value;

    if (!name || !email || !password || !passwordConfirm) {
      alert('Please fill in all fields');
      return;
    }

    if (password !== passwordConfirm) {
      alert('Passwords do not match');
      return;
    }

    if (EmailAuth && EmailAuth.signup) {
      const result = await EmailAuth.signup({
        name,
        email,
        password,
      });

      if (result.success) {
        if (AuthState && AuthState.setUser) {
          AuthState.setUser(result.user);
        }
        Router.goToScreen('s-lang');
        if (window.Logger) {
          window.Logger.info('Signup successful');
        }
      } else {
        alert(result.error || 'Signup failed');
      }
    }
  } catch (err) {
    if (window.Logger) {
      window.Logger.error('Signup error', { error: err.message });
    }
    alert('Signup failed: ' + err.message);
  } finally {
    if (UIState) UIState.setLoading('auth', false);
  }
}

async function handleLogin() {
  if (UIState) UIState.setLoading('auth', true);
  
  try {
    const email = document.getElementById('authEmail')?.value;
    const password = document.getElementById('authPassword')?.value;

    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    if (EmailAuth && EmailAuth.login) {
      const result = await EmailAuth.login(email, password);

      if (result.success) {
        if (AuthState && AuthState.setUser) {
          AuthState.setUser(result.user);
        }
        Router.goToScreen('s-lang');
        if (window.Logger) {
          window.Logger.info('Login successful');
        }
      } else {
        alert(result.error || 'Login failed');
      }
    }
  } catch (err) {
    if (window.Logger) {
      window.Logger.error('Login error', { error: err.message });
    }
    alert('Login failed: ' + err.message);
  } finally {
    if (UIState) UIState.setLoading('auth', false);
  }
}
