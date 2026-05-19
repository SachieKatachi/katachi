/**
 * CLIENT AUTH - WITH INLINE BCRYPTJS
 * Secure password hashing with no external CDN dependencies
 */

window.ClientAuth = (() => {
  const USERS_KEY = 'k_users';
  const AUTH_KEY = 'k_auth_email';

  function getAllUsers() {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : {};
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  async function signup(email, password, name) {
    try {
      if (!email || !password || !name) {
        return { success: false, error: 'All fields required' };
      }

      const users = getAllUsers();
      
      if (users[email]) {
        return { success: false, error: 'Email already registered' };
      }

      // Hash password with bcryptjs
      const hashedPassword = await window.bcrypt.hash(password, 10);

      users[email] = {
        name,
        email,
        password: hashedPassword, // Store hashed password
        createdAt: new Date().toISOString()
      };

      saveUsers(users);
      localStorage.setItem(AUTH_KEY, email);

      console.log('[ClientAuth] User registered:', email);
      return { success: true };
    } catch (err) {
      console.error('[ClientAuth] Signup error:', err);
      return { success: false, error: 'Registration failed: ' + err.message };
    }
  }

  async function login(email, password) {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email and password required' };
      }

      const users = getAllUsers();
      const user = users[email];

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Compare password with hash
      const isValid = await window.bcrypt.compare(password, user.password);

      if (!isValid) {
        return { success: false, error: 'Incorrect password' };
      }

      localStorage.setItem(AUTH_KEY, email);

      console.log('[ClientAuth] User logged in:', email);
      return { success: true };
    } catch (err) {
      console.error('[ClientAuth] Login error:', err);
      return { success: false, error: 'Login failed: ' + err.message };
    }
  }

  async function resetPassword(email, currentPassword, newPassword) {
    try {
      if (!email || !currentPassword || !newPassword) {
        return { success: false, error: 'All fields required' };
      }

      const users = getAllUsers();
      const user = users[email];

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Verify current password
      const isValid = await window.bcrypt.compare(currentPassword, user.password);
      
      if (!isValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Hash new password
      const newHashedPassword = await window.bcrypt.hash(newPassword, 10);
      user.password = newHashedPassword;
      saveUsers(users);

      console.log('[ClientAuth] Password reset for:', email);
      return { success: true };
    } catch (err) {
      console.error('[ClientAuth] Reset error:', err);
      return { success: false, error: 'Reset failed: ' + err.message };
    }
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    console.log('[ClientAuth] User logged out');
  }

  function isLoggedIn() {
    return !!localStorage.getItem(AUTH_KEY);
  }

  function getCurrentUser() {
    const email = localStorage.getItem(AUTH_KEY);
    if (!email) return null;
    const users = getAllUsers();
    return users[email];
  }

  function clearAllUsers() {
    localStorage.removeItem(USERS_KEY);
    console.log('[ClientAuth] All users cleared');
  }

  return {
    signup,
    login,
    resetPassword,
    logout,
    isLoggedIn,
    getCurrentUser,
    clearAllUsers
  };
})();

console.log('[ClientAuth] Client-side authentication module loaded');

