/**
 * LOGGER UTILITY
 * Centralized logging for debugging across modules
 */
const Logger = (() => {
  const logs = [];

  function log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, message, data };
    logs.push(entry);

    // Console output
    if (CONFIG.logging.enabled) {
      const levelIndex = ['debug', 'info', 'warn', 'error'].indexOf(level);
      const configIndex = ['debug', 'info', 'warn', 'error'].indexOf(CONFIG.logging.level);
      
      if (levelIndex >= configIndex) {
        const style = {
          debug: 'color: #888; font-size: 11px',
          info: 'color: #0066cc; font-weight: bold',
          warn: 'color: #ff9800; font-weight: bold',
          error: 'color: #d32f2f; font-weight: bold',
        }[level];

        console.log(`%c[${level.toUpperCase()}] ${message}`, style, data);
      }
    }

    return entry;
  }

  function debug(message, data) { return log('debug', message, data); }
  function info(message, data) { return log('info', message, data); }
  function warn(message, data) { return log('warn', message, data); }
  function error(message, data) { return log('error', message, data); }
  function getLogs() { return [...logs]; }
  function clearLogs() { logs.length = 0; }

  return { log, debug, info, warn, error, getLogs, clearLogs };
})();

// ═══════════════════════════════════════════════════════

/**
 * STORAGE UTILITY
 * Wrapper around localStorage with error handling
 */
const StorageUtil = (() => {
  function setItem(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      Logger.debug('Storage set', { key, size: serialized.length });
      return true;
    } catch (err) {
      Logger.error('Storage set failed', { key, error: err.message });
      return false;
    }
  }

  function getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (err) {
      Logger.error('Storage get failed', { key, error: err.message });
      return defaultValue;
    }
  }

  function removeItem(key) {
    try {
      localStorage.removeItem(key);
      Logger.debug('Storage removed', { key });
      return true;
    } catch (err) {
      Logger.error('Storage remove failed', { key, error: err.message });
      return false;
    }
  }

  function clear() {
    try {
      localStorage.clear();
      Logger.info('Storage cleared');
      return true;
    } catch (err) {
      Logger.error('Storage clear failed', { error: err.message });
      return false;
    }
  }

  return { setItem, getItem, removeItem, clear };
})();

// ═══════════════════════════════════════════════════════

/**
 * VALIDATORS UTILITY
 * Common validation functions
 */
const Validators = (() => {
  function isValidEmail(email) {
    return CONFIG.auth.emailRegex.test(email);
  }

  function isValidPassword(password) {
    return CONFIG.auth.passwordRegex.test(password);
  }

  function isEmpty(value) {
    return !value || (typeof value === 'string' && value.trim().length === 0);
  }

  function isLengthInRange(value, min, max) {
    const length = typeof value === 'string' ? value.length : (value || []).length;
    return length >= min && length <= max;
  }

  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  return { isValidEmail, isValidPassword, isEmpty, isLengthInRange, isValidUrl };
})();

// ═══════════════════════════════════════════════════════

/**
 * DOM UTILITY
 * Helper functions for DOM manipulation
 */
const DOMUtil = (() => {
  function show(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) element.style.display = '';
    return element;
  }

  function hide(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) element.style.display = 'none';
    return element;
  }

  function toggle(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) {
      element.style.display = element.style.display === 'none' ? '' : 'none';
    }
    return element;
  }

  function addClass(element, className) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) element.classList.add(className);
    return element;
  }

  function removeClass(element, className) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) element.classList.remove(className);
    return element;
  }

  function hasClass(element, className) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    return element ? element.classList.contains(className) : false;
  }

  function setText(element, text) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) element.textContent = text;
    return element;
  }

  function setHTML(element, html) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) element.innerHTML = html;
    return element;
  }

  function clear(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) element.innerHTML = '';
    return element;
  }

  function getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    
    const data = {};
    const inputs = form.querySelectorAll('input[data-field], textarea[data-field], select[data-field]');
    inputs.forEach(input => {
      const field = input.getAttribute('data-field');
      data[field] = input.value;
    });
    return data;
  }

  function setFormData(formId, data) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    Object.entries(data).forEach(([field, value]) => {
      const input = form.querySelector(`[data-field="${field}"]`);
      if (input) input.value = value;
    });
  }

  function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
  }

  function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
      DOMUtil.show(errorEl);
    }
  }

  function clearError(elementId) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = '';
      DOMUtil.hide(errorEl);
    }
  }

  return {
    show, hide, toggle,
    addClass, removeClass, hasClass,
    setText, setHTML, clear,
    getFormData, setFormData, clearForm,
    showError, clearError,
  };
})();
window.Logger = Logger();
window.StorageUtil = StorageUtil();
window.Validators = Validators();
window.DOMUtil = DOMUtil();
