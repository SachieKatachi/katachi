/**
 * EMAIL AUTH MODULE
 * Handles signup, login, password reset with Supabase
 */

const EmailAuth = (() => {
  // Supabase credentials - REPLACE WITH YOUR OWN
  const SUPABASE_URL = 'https://gxqmyiwzyueyalfanton.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_lAB7aXd0ZnsHHTCFs426yA_YUK_kmsx';

  async function signup(formData) {
    try {
      const { name, email, password } = formData;

      if (!name || !email || !password) {
        return {
          success: false,
          error: 'All fields are required'
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Validate password length
      if (password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters'
        };
      }

      // Call Supabase Auth API
      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: email,
          password: password,
          data: {
            name: name
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error_description || data.message || 'Signup failed'
        };
      }

      if (window.Logger) {
        window.Logger.info('Signup successful', { email });
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: name
        },
        sessionId: data.session.access_token
      };
    } catch (err) {
      if (window.Logger) {
        window.Logger.error('Signup error', { error: err.message });
      }
      return {
        success: false,
        error: err.message || 'Signup failed'
      };
    }
  }

  async function login(email, password) {
    try {
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      // Call Supabase Auth API
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

      if (!response.ok) {
        return {
          success: false,
          error: data.error_description || 'Invalid email or password'
        };
      }

      if (window.Logger) {
        window.Logger.info('Login successful', { email });
      }

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
      if (window.Logger) {
        window.Logger.error('Login error', { error: err.message });
      }
      return {
        success: false,
        error: err.message || 'Login failed'
      };
    }
  }

  async function requestPasswordReset(email) {
    try {
      if (!email) {
        return {
          success: false,
          error: 'Email is required'
        };
      }

      const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: email
        })
      });

      if (!response.ok) {
        return {
          success: false,
          error: 'Password reset request failed'
        };
      }

      if (window.Logger) {
        window.Logger.info('Password reset requested', { email });
      }

      return {
        success: true,
        message: 'Check your email for password reset instructions'
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Password reset failed'
      };
    }
  }

  // Logout (clear session)
  function logout() {
    localStorage.removeItem('katachi_session');
    if (window.Logger) {
      window.Logger.info('Logged out');
    }
  }

  return {
    signup,
    login,
    requestPasswordReset,
    logout
  };
})();
