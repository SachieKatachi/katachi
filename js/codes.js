/**
 * CODES MODULE - WITH ADMIN GATE
 * Generate and manage access codes
 * Admin only: koukishabanguh@gmail.com
 * Full EN/JA support
 */

const Codes = (() => {
  const STORAGE_KEY = 'k_codes';
  const ADMIN_EMAIL = 'koukishabanguh@gmail.com';
  let codes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  function isAdmin() {
    const currentEmail = localStorage.getItem('k_auth_email');
    return currentEmail === ADMIN_EMAIL;
  }

  function generateCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  function generateId() {
    return 'code_' + Date.now();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  }

  function create(data) {
    if (!isAdmin()) {
      console.warn('[Codes] Non-admin attempted to create code');
      return null;
    }

    const code = {
      id: generateId(),
      code: generateCode(),
      tier: data.tier || 'Pro',
      industry: data.industry || '',
      seats: parseInt(data.seats) || 1,
      status: 'active',
      expiryDate: data.expiryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      usedBy: null,
      usedAt: null
    };
    codes.push(code);
    save();
    if (window.Logger) {
      window.Logger.info('Code generated', { tier: code.tier });
    }
    return code;
  }

  function getAll() {
    if (!isAdmin()) return [];
    return codes;
  }

  function getById(id) {
    if (!isAdmin()) return null;
    return codes.find(c => c.id === id);
  }

  function getByCode(codeStr) {
    // Public method - can validate codes without admin
    return codes.find(c => c.code === codeStr);
  }

  function update(id, data) {
    if (!isAdmin()) return null;
    const code = getById(id);
    if (!code) return null;
    Object.assign(code, data);
    save();
    return code;
  }

  function revoke(id) {
    if (!isAdmin()) return null;
    const code = getById(id);
    if (!code) return null;
    code.status = 'revoked';
    save();
    if (window.Logger) {
      window.Logger.info('Code revoked', { code: code.code });
    }
    return code;
  }

  function validate(codeStr) {
    const code = getByCode(codeStr);
    if (!code) return { valid: false, reason: 'Code not found' };
    if (code.status !== 'active') return { valid: false, reason: 'Code inactive' };
    if (new Date(code.expiryDate) < new Date()) return { valid: false, reason: 'Code expired' };
    return { valid: true, code };
  }

  function getActive() {
    if (!isAdmin()) return [];
    return codes.filter(c => c.status === 'active' && new Date(c.expiryDate) >= new Date());
  }

  function getExpired() {
    if (!isAdmin()) return [];
    return codes.filter(c => new Date(c.expiryDate) < new Date());
  }

  function getByTier(tier) {
    if (!isAdmin()) return [];
    return codes.filter(c => c.tier === tier);
  }

  function getStats() {
    if (!isAdmin()) {
      return {
        total: 0,
        active: 0,
        expired: 0,
        byTier: { free: 0, pro: 0, growth: 0, multi: 0 }
      };
    }
    return {
      total: codes.length,
      active: getActive().length,
      expired: getExpired().length,
      byTier: {
        free: getByTier('Free').length,
        pro: getByTier('Pro').length,
        growth: getByTier('Growth').length,
        multi: getByTier('Multi').length
      }
    };
  }

  if (window.Logger) {
    const adminStatus = isAdmin() ? 'ADMIN' : 'non-admin';
    window.Logger.info('Codes module loaded', { count: codes.length, admin: adminStatus });
  }

  return {
    create,
    getAll,
    getById,
    getByCode,
    update,
    revoke,
    validate,
    getActive,
    getExpired,
    getByTier,
    getStats,
    isAdmin
  };
})();

window.Codes = Codes;
console.log('[Codes] Codes module loaded - Admin Gate Active');
