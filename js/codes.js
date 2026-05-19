/**
 * CODES MODULE
 * Generate and manage access codes
 * Full EN/JA support
 */

const Codes = (() => {
  const STORAGE_KEY = 'k_codes';
  let codes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

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
    return codes;
  }

  function getById(id) {
    return codes.find(c => c.id === id);
  }

  function getByCode(codeStr) {
    return codes.find(c => c.code === codeStr);
  }

  function update(id, data) {
    const code = getById(id);
    if (!code) return null;
    Object.assign(code, data);
    save();
    return code;
  }

  function revoke(id) {
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
    return codes.filter(c => c.status === 'active' && new Date(c.expiryDate) >= new Date());
  }

  function getExpired() {
    return codes.filter(c => new Date(c.expiryDate) < new Date());
  }

  function getByTier(tier) {
    return codes.filter(c => c.tier === tier);
  }

  function getStats() {
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
    window.Logger.info('Codes module loaded', { count: codes.length });
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
    getStats
  };
})();

window.Codes = Codes;
console.log('[Codes] Codes module loaded');
