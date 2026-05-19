/**
 * CLIENT-SIDE AUTH WITH HASHED PASSWORDS
 * Uses bcryptjs for secure password hashing
 * Includes signup, login, password reset, logout
 * 
 * FEATURES:
 * - Passwords hashed with bcrypt (never stored in plaintext)
 * - Login validation (checks password against hash)
 * - Password reset (requires current password verification)
 * - Email uniqueness checks
 * - Session management
 */

const ClientAuth = (() => {
  const STORAGE_KEY = 'k_users';
  const AUTH_KEY = 'k_auth_email';
  let users = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  /**
   * Sign up new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} name - User full name
   * @returns {Promise<{success: boolean, error?: string, message?: string}>}
   */
  async function signup(email, password, name) {
    try {
      // Validate inputs
      if (!email || !password || !name) {
        return { success: false, error: 'All fields required' };
      }

      if (email.trim().length === 0) {
        return { success: false, error: 'Email cannot be empty' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      if (name.trim().length === 0) {
        return { success: false, error: 'Name cannot be empty' };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Check if user exists
      if (users[email]) {
        return { success: false, error: 'Email already registered' };
      }

      // Hash password
      if (!window.bcrypt) {
        return { success: false, error: 'Encryption library not loaded. Please refresh the page.' };
      }

      const hashedPassword = await window.bcrypt.hash(password, 10);

      // Store user
      users[email] = {
        email,
        name: name.trim(),
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        lastPasswordReset: null
      };

      save();
      localStorage.setItem(AUTH_KEY, email);

      if (window.Logger) {
        window.Logger.info('User signed up', { email });
      }

      return { success: true, message: 'Account created successfully' };
    } catch (err) {
      if (window.Logger) {
        window.Logger.error('Signup error', { error: err.message });
      }
      return { success: false, error: 'Signup failed: ' + err.message };
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, error?: string, message?: string}>}
   */
  async function login(email, password) {
    try {
      // Validate inputs
      if (!email || !password) {
        return { success: false, error: 'Email and password required' };
      }

      // Check if user exists
      if (!users[email]) {
        return { success: false, error: 'User not found' };
      }

      // Verify password
      if (!window.bcrypt) {
        return { success: false, error: 'Encryption library not loaded. Please refresh the page.' };
      }

      const user = users[email];
      const isValid = await window.bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        return { success: false, error: 'Invalid password' };
      }

      // Set auth session
      localStorage.setItem(AUTH_KEY, email);

      if (window.Logger) {
        window.Logger.info('User logged in', { email });
      }

      return { success: true, message: 'Logged in successfully' };
    } catch (err) {
      if (window.Logger) {
        window.Logger.error('Login error', { error: err.message });
      }
      return { success: false, error: 'Login failed: ' + err.message };
    }
  }

  /**
   * Reset user password
   * @param {string} email - User email
   * @param {string} currentPassword - Current password for verification
   * @param {string} newPassword - New password
   * @returns {Promise<{success: boolean, error?: string, message?: string}>}
   */
  async function resetPassword(email, currentPassword, newPassword) {
    try {
      // Validate inputs
      if (!email || !currentPassword || !newPassword) {
        return { success: false, error: 'All fields required' };
      }

      if (newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters' };
      }

      if (currentPassword === newPassword) {
        return { success: false, error: 'New password must be different from current password' };
      }

      // Check if user exists
      if (!users[email]) {
        return { success: false, error: 'User not found' };
      }

      // Verify current password
      if (!window.bcrypt) {
        return { success: false, error: 'Encryption library not loaded. Please refresh the page.' };
      }

      const user = users[email];
      const isValid = await window.bcrypt.compare(currentPassword, user.passwordHash);

      if (!isValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Hash new password
      const hashedPassword = await window.bcrypt.hash(newPassword, 10);

      // Update user
      user.passwordHash = hashedPassword;
      user.lastPasswordReset = new Date().toISOString();

      save();

      if (window.Logger) {
        window.Logger.info('Password reset', { email });
      }

      return { success: true, message: 'Password reset successfully' };
    } catch (err) {
      if (window.Logger) {
        window.Logger.error('Password reset error', { error: err.message });
      }
      return { success: false, error: 'Password reset failed: ' + err.message };
    }
  }

  /**
   * Logout user
   */
  function logout() {
    localStorage.removeItem(AUTH_KEY);
    if (window.Logger) {
      window.Logger.info('User logged out');
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  function isLoggedIn() {
    const email = localStorage.getItem(AUTH_KEY);
    return !!email && !!users[email];
  }

  /**
   * Get current authenticated user
   * @returns {Object|null}
   */
  function getCurrentUser() {
    const email = localStorage.getItem(AUTH_KEY);
    if (!email || !users[email]) {
      return null;
    }

    const user = users[email];
    return {
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      lastPasswordReset: user.lastPasswordReset
    };
  }

  /**
   * Get all users (for debugging only - don't expose in production)
   * @returns {Object}
   */
  function getAllUsers() {
    return Object.keys(users).map(email => ({
      email: users[email].email,
      name: users[email].name,
      createdAt: users[email].createdAt
    }));
  }

  /**
   * Clear all users (for demo reset)
   */
  function clearAllUsers() {
    users = {};
    save();
    localStorage.removeItem(AUTH_KEY);
    if (window.Logger) {
      window.Logger.info('All users cleared');
    }
  }

  if (window.Logger) {
    window.Logger.info('ClientAuth module loaded', { userCount: Object.keys(users).length });
  }

  return {
    signup,
    login,
    resetPassword,
    logout,
    isLoggedIn,
    getCurrentUser,
    getAllUsers,
    clearAllUsers
  };
})();

window.ClientAuth = ClientAuth;
console.log('[ClientAuth] Client-side authentication module loaded');
