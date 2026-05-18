/**
 * EMAIL AUTH MODULE
 * Handles user registration, login, and session management
 * Uses client-side hashing (NOT for production - needs backend)
 */

const EmailAuth = (() => {
  // Private state
  const users = new Map(); // In-memory for demo, should be backend
  const sessions = new Map();

  // ═══════════════════════════════════════════
  // PASSWORD HASHING (FOR DEMO ONLY)
  // In production: Use bcrypt on backend, never hash on client
  // ═══════════════════════════════════════════
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function verifyPassword(password, hash) {
    const hashedPassword = await hashPassword(password);
    return hashedPassword === hash;
  }

  // ═══════════════════════════════════════════
  // USER REGISTRATION
  // ═══════════════════════════════════════════
  async function signup(userData) {
    const logger = window.Logger;
    
    try {
      // VALIDATION
      const validation = validateSignup(userData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const { name, email, password } = userData;

      // CHECK IF EMAIL EXISTS
      if (users.has(email.toLowerCase())) {
        return { success: false, error: 'Email already registered' };
      }

      // HASH PASSWORD
      const passwordHash = await hashPassword(password);

      // CREATE USER
      const user = {
        id: generateUserId(),
        name,
        email: email.toLowerCase(),
        passwordHash,
        createdAt: new Date().toISOString(),
        tier: 'free',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        verified: false,
        accessCode: userData.code || null,
      };

      // STORE USER
      users.set(email.toLowerCase(), user);
      
      // Save to localStorage (development only)
      const allUsers = JSON.parse(localStorage.getItem(CONFIG.storage.user) || '{}');
      allUsers[email.toLowerCase()] = user;
      localStorage.setItem(CONFIG.storage.user, JSON.stringify(allUsers));

      logger.info('User registered', { email, userId: user.id });

      // CREATE SESSION
      const session = createSession(user);

      return { 
        success: true, 
        user: sanitizeUser(user),
        sessionId: session.id 
      };
    } catch (err) {
      logger.error('Signup error', err);
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  }

  // ═══════════════════════════════════════════
  // USER LOGIN
  // ═══════════════════════════════════════════
  async function login(email, password) {
    const logger = window.Logger;
    
    try {
      // VALIDATION
      if (!email || !password) {
        return { success: false, error: 'Email and password required' };
      }

      if (!CONFIG.auth.emailRegex.test(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // FIND USER
      let user = users.get(email.toLowerCase());
      
      // If not in memory, try localStorage
      if (!user) {
        const allUsers = JSON.parse(localStorage.getItem(CONFIG.storage.user) || '{}');
        user = allUsers[email.toLowerCase()];
      }

      if (!user) {
        return { success: false, error: 'Email not found' };
      }

      // VERIFY PASSWORD
      const passwordValid = await verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        return { success: false, error: 'Incorrect password' };
      }

      // CHECK TRIAL/SUBSCRIPTION
      const now = new Date();
      const trialEnd = new Date(user.trialEndsAt);
      
      if (user.tier === 'free' && now > trialEnd) {
        return { success: false, error: 'Trial expired. Please upgrade or contact support.' };
      }

      logger.info('User logged in', { email, userId: user.id });

      // CREATE SESSION
      const session = createSession(user);

      return { 
        success: true, 
        user: sanitizeUser(user),
        sessionId: session.id 
      };
    } catch (err) {
      logger.error('Login error', err);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  // ═══════════════════════════════════════════
  // PASSWORD RESET
  // ═══════════════════════════════════════════
  async function requestPasswordReset(email) {
    const logger = window.Logger;
    
    try {
      // FIND USER
      let user = users.get(email.toLowerCase());
      if (!user) {
        const allUsers = JSON.parse(localStorage.getItem(CONFIG.storage.user) || '{}');
        user = allUsers[email.toLowerCase()];
      }

      if (!user) {
        // Don't reveal if email exists (security)
        return { success: true, message: 'If email exists, reset link sent' };
      }

      // GENERATE RESET TOKEN
      const resetToken = generateResetToken();
      user.resetToken = resetToken;
      user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      // UPDATE USER
      users.set(email.toLowerCase(), user);
      
      // Save to localStorage
      const allUsers = JSON.parse(localStorage.getItem(CONFIG.storage.user) || '{}');
      allUsers[email.toLowerCase()] = user;
      localStorage.setItem(CONFIG.storage.user, JSON.stringify(allUsers));

      logger.info('Password reset requested', { email });

      // IN PRODUCTION: Send email with reset link
      // For demo: Log the token
      console.log(`[DEMO] Reset token for ${email}: ${resetToken}`);

      return { success: true, message: 'Reset link sent to email' };
    } catch (err) {
      logger.error('Password reset error', err);
      return { success: false, error: 'Reset failed. Please try again.' };
    }
  }

  // ═══════════════════════════════════════════
  // RESET PASSWORD WITH TOKEN
  // ═══════════════════════════════════════════
  async function resetPassword(email, resetToken, newPassword) {
    const logger = window.Logger;
    
    try {
      // VALIDATION
      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // FIND USER
      let user = users.get(email.toLowerCase());
      if (!user) {
        const allUsers = JSON.parse(localStorage.getItem(CONFIG.storage.user) || '{}');
        user = allUsers[email.toLowerCase()];
      }

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // VERIFY TOKEN
      if (!user.resetToken || user.resetToken !== resetToken) {
        return { success: false, error: 'Invalid reset token' };
      }

      // CHECK TOKEN EXPIRY
      if (new Date() > new Date(user.resetTokenExpiry)) {
        return { success: false, error: 'Reset token expired' };
      }

      // HASH NEW PASSWORD
      const newPasswordHash = await hashPassword(newPassword);
      user.passwordHash = newPasswordHash;
      delete user.resetToken;
      delete user.resetTokenExpiry;

      // UPDATE USER
      users.set(email.toLowerCase(), user);
      
      // Save to localStorage
      const allUsers = JSON.parse(localStorage.getItem(CONFIG.storage.user) || '{}');
      allUsers[email.toLowerCase()] = user;
      localStorage.setItem(CONFIG.storage.user, JSON.stringify(allUsers));

      logger.info('Password reset completed', { email });

      return { success: true, message: 'Password updated successfully' };
    } catch (err) {
      logger.error('Password reset completion error', err);
      return { success: false, error: 'Failed to reset password' };
    }
  }

  // ═══════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════
  function createSession(user) {
    const sessionId = generateSessionId();
    const session = {
      id: sessionId,
      userId: user.id,
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CONFIG.auth.sessionTimeout).toISOString(),
    };

    sessions.set(sessionId, session);
    
    // Save to localStorage
    localStorage.setItem(CONFIG.storage.session, JSON.stringify(session));

    return session;
  }

  function getSession(sessionId) {
    let session = sessions.get(sessionId);
    
    if (!session) {
      const stored = localStorage.getItem(CONFIG.storage.session);
      if (stored) {
        session = JSON.parse(stored);
      }
    }

    if (!session) return null;

    // CHECK EXPIRY
    if (new Date() > new Date(session.expiresAt)) {
      sessions.delete(sessionId);
      localStorage.removeItem(CONFIG.storage.session);
      return null;
    }

    return session;
  }

  function logout() {
    sessions.clear();
    localStorage.removeItem(CONFIG.storage.session);
    return { success: true };
  }

  // ═══════════════════════════════════════════
  // VALIDATION FUNCTIONS
  // ═══════════════════════════════════════════
  function validateSignup(data) {
    const { name, email, password, passwordConfirm } = data;

    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Name is required' };
    }

    if (name.length > 100) {
      return { valid: false, error: 'Name too long' };
    }

    if (!email || !CONFIG.auth.emailRegex.test(email)) {
      return { valid: false, error: 'Valid email required' };
    }

    const passValidation = validatePassword(password);
    if (!passValidation.valid) {
      return passValidation;
    }

    if (password !== passwordConfirm) {
      return { valid: false, error: 'Passwords do not match' };
    }

    return { valid: true };
  }

  function validatePassword(password) {
    if (!password) {
      return { valid: false, error: 'Password is required' };
    }

    if (password.length < CONFIG.auth.minPasswordLength) {
      return { valid: false, error: `Password must be at least ${CONFIG.auth.minPasswordLength} characters` };
    }

    if (!CONFIG.auth.passwordRegex.test(password)) {
      return { valid: false, error: 'Password must contain uppercase, lowercase, and numbers' };
    }

    return { valid: true };
  }

  // ═══════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════
  function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function generateResetToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  function sanitizeUser(user) {
    const { passwordHash, resetToken, resetTokenExpiry, ...safe } = user;
    return safe;
  }

  // PUBLIC API
  return {
    signup,
    login,
    logout,
    getSession,
    requestPasswordReset,
    resetPassword,
  };
})();
