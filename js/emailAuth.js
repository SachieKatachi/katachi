/**
 * EMAIL AUTH MODULE
 * Handles signup, login with Supabase
 * Version 2 - Better error handling
 */

const EmailAuth = (() => {
  const SUPABASE_URL = 'https://gxqmyiwzyueyalfanton.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_lAB7aXd0ZnsHHTCFs426yA_YUK_kmsx';

  async function signup(formData) {
    try {
      const { name, email, password } = formData;

      if (!name || !email || !password) {
        alert('All fields are required');
        return { success: false, error: 'All fields required' };
      }

      if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return { success: false, error: 'Password too short' };
      }

      if (window.Logger) {
        window.Logger.info('Attempting signup', { email });
      }

      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: email,
          password: password,
          data: { name: name }
        })
      });

      const data = await response.json();

      if (window.Logger) {
        window.Logger.info('Signup response', { status: response.status, data });
      }

      if (!response.ok) {
        const errorMsg = data.error_description || data.message || 'Signup failed';
        alert('Signup Error: ' + errorMsg);
        return { success: false, error: errorMsg };
      }

      if (!data.user) {
        alert('Signup failed: No user returned');
        return { success: false, error: 'No user data' };
      }

      alert('Signup successful! Welcome ' + name);

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: name
        },
        sessionId: data.session ? data.session.access_token : 'demo_token'
      };
    } catch (err) {
      alert('Signup Error: ' + err.message);
      if (window.Logger) {
        window.Logger.error('Signup exception', { error: err.message });
      }
      return { success: false, error: err.message };
    }
  }

  async function login(email, password) {
    try {
      if (!email || !password) {
        alert('Email and password required');
        return { success: false, error: 'Missing fields' };
      }

      if (window.Logger) {
        window.Logger.info('Attempting login', { email });
      }

      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (window.Logger) {
        window.Logger.info('Login response', { status: response.status, data });
      }

      if (!response.ok) {
        const errorMsg = data.error_description || 'Invalid email or password';
        alert('Login Error: ' + errorMsg);
        return { success: false, error: errorMsg };
      }

      if (!data.user) {
        alert('Login failed: No user data');
        return { success: false, error: 'No user data' };
      }

      alert('Login successful!');

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || email.split('@')[0]
        },
        sessionId: data.access_token
      };
    } catch (err) {
      alert('Login Error: ' + err.message);
      if (window.Logger) {
        window.Logger.error('Login exception', { error: err.message });
      }
      return { success: false, error: err.message };
    }
  }

  function logout() {
    localStorage.removeItem('katachi_session');
    if (window.Logger) {
      window.Logger.info('Logged out');
    }
  }

  return {
    signup,
    login,
    logout,
    requestPasswordReset: async (email) => ({ success: true })
  };
})();
