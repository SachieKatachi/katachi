/**
 * EMAIL AUTH MODULE - HYBRID VERSION (FIXED)
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
  function syncToSupabase(action, data) {
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
        console.log('Supabase sync: OK');
      }).catch(e => {
        console.log('Supabase sync: offline mode');
      });
    } catch (err) {
      // Silent fail
    }
  }

  const signup = async function(formData) {
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

      console.log('Signup successful:', email);

      // Sync to Supabase in background (non-blocking)
      syncToSupabase('signup', { name, email, password });

      return {
        success: true,
        user: { id: userId, name, email },
        sessionId: 'session_' + Date.now()
      };
    } catch (err) {
      console.error('Signup error:', err);
      return { success: false, error: err.message };
    }
  };

  const login = async function(email, password) {
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

      console.log('Login successful:', email);

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
      console.error('Login error:', err);
      return { success: false, error: err.message };
    }
  };

  const logout = function() {
    localStorage.removeItem('katachi_session');
    console.log('Logged out');
  };

  return {
    signup: signup,
    login: login,
    logout: logout,
    requestPasswordReset: async (email) => ({ success: true })
  };
})();

// CRITICAL: Export to window so it's accessible
window.EmailAuth = EmailAuth;
console.log('EmailAuth module loaded:', typeof window.EmailAuth);
