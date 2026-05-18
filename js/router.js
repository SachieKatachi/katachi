/**
 * ROUTER MODULE
 * Single source of truth for navigation
 * Replaces the dual go() / showPage() system
 */

const Router = (() => {
  const validScreens = ['s-land', 's-auth', 's-lang', 's-app'];
  
  function goToScreen(screenId, options = {}) {
    if (!validScreens.includes(screenId)) {
      Logger.warn('Invalid screen', { screenId });
      return false;
    }

    const currentScreen = UIState.getState().currentScreen;
    if (currentScreen === screenId && !options.force) {
      Logger.debug('Already on screen', { screenId });
      return true;
    }

    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
      UIState.setScreen(screenId);
      Logger.info('Navigated to screen', { from: currentScreen, to: screenId });
      
      // Reset scroll position
      if (options.resetScroll !== false) {
        window.scrollTo(0, 0);
      }

      return true;
    }

    Logger.error('Screen not found', { screenId });
    return false;
  }

  function goToPage(pageId) {
    // Only valid when on app screen
    if (UIState.getState().currentScreen !== 's-app') {
      Logger.warn('Cannot navigate to page outside app screen', { pageId });
      return false;
    }

    const validPages = CONFIG.nav.map(n => n.id).concat(['settings', 'pricing']);
    if (!validPages.includes(pageId)) {
      Logger.warn('Invalid page', { pageId });
      return false;
    }

    UIState.setPage(pageId);
    Logger.info('Page changed', { pageId });
    
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
      's-app': 's-land', // Would need history for better behavior
    };

    const targetScreen = backMap[currentScreen];
    if (targetScreen) {
      return goToScreen(targetScreen);
    }

    Logger.warn('Cannot go back from', { currentScreen });
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
    Logger.debug('Action registered', { action });
  }

  function dispatch(action, data = {}) {
    if (!handlers[action]) {
      Logger.warn('No handler for action', { action });
      return false;
    }

    Logger.debug('Action dispatched', { action, data });
    handlers[action].forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        Logger.error('Action handler error', { action, error: err.message });
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

EventDelegation.register('nav-land', () => Router.goToScreen('s-land'));
EventDelegation.register('nav-auth', () => Router.goToScreen('s-auth'));
EventDelegation.register('nav-app', () => Router.goToScreen('s-app'));

EventDelegation.register('auth-tab-signup', (data) => {
  document.getElementById('a-signup').style.display = '';
  document.getElementById('a-login').style.display = 'none';
  document.querySelectorAll('.auth-tab').forEach((el, i) => {
    el.classList.toggle('active', i === 0);
  });
  DOMUtil.clearError('signupError');
});

EventDelegation.register('auth-tab-login', (data) => {
  document.getElementById('a-signup').style.display = 'none';
  document.getElementById('a-login').style.display = '';
  document.querySelectorAll('.auth-tab').forEach((el, i) => {
    el.classList.toggle('active', i === 1);
  });
  DOMUtil.clearError('loginError');
});

EventDelegation.register('lang-select', (data) => {
  UIState.setLanguage(data.lang);
  document.querySelectorAll('.lang-opt').forEach(el => {
    el.classList.remove('sel');
  });
  document.getElementById('lo-' + data.lang).classList.add('sel');
});

EventDelegation.register('app-init', async () => {
  UIState.setLoading('app-init', true);
  try {
    // Initialize app features
    if (window.RecipesFeature && window.RecipesFeature.init) {
      await window.RecipesFeature.init();
    }
    Router.goToScreen('s-app');
  } catch (err) {
    Logger.error('App init error', { error: err.message });
  } finally {
    UIState.setLoading('app-init', false);
  }
});

EventDelegation.register('auth-signup', async () => {
  UIState.setLoading('signup', true);
  DOMUtil.clearError('signupError');

  try {
    const formData = {
      name: document.getElementById('aName').value,
      email: document.getElementById('aEmail').value,
      password: document.getElementById('aPassword').value,
      passwordConfirm: document.getElementById('aPasswordConfirm').value,
      code: document.getElementById('aCode').value,
    };

    const result = await EmailAuth.signup(formData);

    if (result.success) {
      AuthState.setUser(result.user, { id: result.sessionId });
      DOMUtil.clearForm('a-signup');
      Router.goToScreen('s-lang');
    } else {
      DOMUtil.showError('signupError', result.error);
    }
  } catch (err) {
    Logger.error('Signup action error', { error: err.message });
    DOMUtil.showError('signupError', 'Signup failed. Please try again.');
  } finally {
    UIState.setLoading('signup', false);
  }
});

EventDelegation.register('auth-login', async () => {
  UIState.setLoading('login', true);
  DOMUtil.clearError('loginError');

  try {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const result = await EmailAuth.login(email, password);

    if (result.success) {
      AuthState.setUser(result.user, { id: result.sessionId });
      DOMUtil.clearForm('a-login');
      Router.goToScreen('s-lang');
    } else {
      DOMUtil.showError('loginError', result.error);
    }
  } catch (err) {
    Logger.error('Login action error', { error: err.message });
    DOMUtil.showError('loginError', 'Login failed. Please try again.');
  } finally {
    UIState.setLoading('login', false);
  }
});

EventDelegation.register('auth-forgot', () => {
  const email = prompt('Enter your email to reset password:');
  if (email) {
    UIState.setLoading('forgot', true);
    EmailAuth.requestPasswordReset(email)
      .then(result => {
        if (result.success) {
          alert(result.message);
        } else {
          alert(result.error);
        }
      })
      .finally(() => UIState.setLoading('forgot', false));
  }
});
