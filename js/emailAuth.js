/**
 * EMAIL AUTH MODULE - HYBRID VERSION
 * Works immediately with localStorage
 * Syncs with Supabase in background
 */

const EmailAuth = (() => {
  const SUPABASE_URL = 'https://gxqmyiwzyueyalfanton.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_lAB7aXd0ZnsHHTCFs426yA_YUK_kmsx';
  const USERS_KEY = 'katachi_users';

  function getUsers() {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // Try to sync with Supabase (background, non-blocking)
  async function syncToSupabase(action, data) {
    try {
      const endpoint = action === 'signup' ? 'signup' : 'token?grant_type=password';
      const body = action === 'signup' 
        ? { email: data.email, password: data.password, data: { name: data.name } }
        : { email: data.email, password: data.password };

      const url = `${SUPABASE_URL}/auth/v1/${endpoint}`;
      
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body)
      }).then(r => r.json()).then(d => {
        if (window.Logger) {
          window.Logger.debug('Supabase sync result', { action, status: 'done' });
        }
      }).catch(e => {
        if (window.Logger) {
          window.Logger.debug('Supabase sync skipped (working offline)', { action });
        }
      });
    } catch (err) {
      // Silent fail - app continues to work
    }
  }

  async function signup(formData) {
    try {
      const { name, email, password } = formData;

      if (!name || !email || !password) {
        return { success: false, error: 'All fields required' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be 6+ chars' };
      }

      const users = getUsers();
      if (users[email]) {
        return { success: false, error: 'Email already registered' };
      }

      // Save locally - app works immediately
      const userId = 'user_' + Date.now();
      users[email] = {
        id: userId,
        name: name,
        email: email,
        password: btoa(password),
        createdAt: new Date().toISOString()
      };
      saveUsers(users);

      if (window.Logger) {
        window.Logger.info('Signup successful', { email });
      }

      // Sync to Supabase in background (non-blocking)
      syncToSupabase('signup', { name, email, password });

      return {
        success: true,
        user: { id: userId, name, email },
        sessionId: 'session_' + Date.now()
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function login(email, password) {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email and password required' };
      }

      const users = getUsers();
      const user = users[email];

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const hashedPassword = btoa(password);
      if (user.password !== hashedPassword) {
        return { success: false, error: 'Invalid password' };
      }

      if (window.Logger) {
        window.Logger.info('Login successful', { email });
      }

      // Sync to Supabase in background
      syncToSupabase('login', { email, password });

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        sessionId: 'session_' + Date.now()
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function logout() {
    localStorage.removeItem('katachi_session');
  }

  return {
    signup,
    login,
    logout,
    requestPasswordReset: async (email) => ({ success: true })
  };
})();
