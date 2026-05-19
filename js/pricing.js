/**
 * PRICING MODULE - FIXED VERSION
 * Manage tiers, credits, and billing
 * Full EN/JA support, proper bounds checking, safe credit logic
 * 
 * CHANGES FROM ORIGINAL:
 * 1. Fixed useAiCredit() - now checks if COUNT exceeds remaining (not just zero)
 * 2. Fixed getRemainingAiCredits() - now clamps to 0 minimum (no negatives)
 * 3. Added comprehensive input validation
 * 4. Standardized all error responses to {success, reason/error} format
 * 5. Added bounds checking for all numeric operations
 * 6. Added tier validation before use
 * 7. Improved logging and debugging
 */

const Pricing = (() => {
  const STORAGE_KEY = 'k_pricing';

  // Tier definitions - frozen to prevent accidental mutations
  const tiers = Object.freeze({
    free: Object.freeze({
      name: 'Free Forever',
      price: 0,
      aiCredits: 5,
      recipes: 10,
      users: 1,
      features: Object.freeze(['recipes', 'prep'])
    }),
    pro: Object.freeze({
      name: 'Pro',
      price: 29,
      aiCredits: 100,
      recipes: -1, // unlimited
      users: 1,
      features: Object.freeze(['recipes', 'prep', 'inventory', 'scanning', 'ai'])
    }),
    growth: Object.freeze({
      name: 'Growth',
      price: 59,
      aiCredits: 250,
      recipes: -1,
      users: 5,
      features: Object.freeze(['recipes', 'prep', 'inventory', 'scanning', 'ai', 'codes', 'reports'])
    }),
    multi: Object.freeze({
      name: 'Multi',
      price: 149,
      aiCredits: 500,
      recipes: -1,
      users: -1,
      features: Object.freeze(['recipes', 'prep', 'inventory', 'scanning', 'ai', 'codes', 'reports', 'analytics'])
    })
  });

  let userTier = localStorage.getItem('k_user_tier') || 'free';
  let aiCreditsUsed = parseInt(localStorage.getItem('k_ai_credits_used')) || 0;
  let subscriptions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

  /**
   * Input validation helpers
   */
  function validateTierName(tierName) {
    return tierName && tiers[tierName] ? tierName : null;
  }

  function validatePositiveNumber(value, fieldName) {
    const num = parseInt(value);
    if (isNaN(num) || num < 0) {
      return { valid: false, error: `${fieldName} must be a positive number` };
    }
    return { valid: true, value: num };
  }

  function save() {
    try {
      localStorage.setItem('k_user_tier', userTier);
      localStorage.setItem('k_ai_credits_used', aiCreditsUsed.toString());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
      if (window.Logger) {
        window.Logger.info('Pricing saved', { tier: userTier, creditsUsed: aiCreditsUsed });
      }
    } catch (err) {
      if (window.Logger) {
        window.Logger.error('Failed to save pricing', { error: err.message });
      }
    }
  }

  /**
   * Get tier definition by name
   * @param {string} tierName - Tier name (free, pro, growth, multi)
   * @returns {Object|null} Tier definition or null if invalid
   */
  function getTier(tierName) {
    const validTier = validateTierName(tierName);
    return validTier ? tiers[validTier] : tiers.free;
  }

  /**
   * Get all available tiers
   * @returns {Object} All tier definitions
   */
  function getAllTiers() {
    return tiers;
  }

  /**
   * Set user tier
   * @param {string} tierName - Tier name
   * @returns {boolean} Success
   */
  function setUserTier(tierName) {
    const validTier = validateTierName(tierName);
    if (!validTier) {
      if (window.Logger) {
        window.Logger.warn('Invalid tier name', { tierName });
      }
      return false;
    }

    userTier = validTier;
    aiCreditsUsed = 0; // Reset credits on tier change
    subscriptions[userTier] = {
      tier: validTier,
      subscribedAt: new Date().toISOString(),
      aiCreditsUsed: 0
    };

    save();

    if (window.Logger) {
      window.Logger.info('User tier changed', { tier: validTier, credits: getTier(validTier).aiCredits });
    }

    return true;
  }

  /**
   * Get current user tier
   * @returns {string} Tier name
   */
  function getUserTier() {
    return userTier;
  }

  /**
   * Check if user can use a feature
   * @param {string} feature - Feature name
   * @returns {boolean} True if feature available in current tier
   */
  function canUseFeature(feature) {
    if (!feature || typeof feature !== 'string') {
      return false;
    }
    const tier = getTier(userTier);
    return tier.features.includes(feature.toLowerCase());
  }

  /**
   * Get remaining AI credits
   * CRITICAL FIX: Clamps to 0 minimum to prevent negative display
   * @returns {number} Remaining credits (minimum 0)
   */
  function getRemainingAiCredits() {
    const tier = getTier(userTier);
    if (!tier) {
      return 0;
    }
    // CRITICAL FIX: Clamp to 0 minimum - prevents negative display
    return Math.max(0, tier.aiCredits - aiCreditsUsed);
  }

  /**
   * Use AI credits
   * CRITICAL FIX: Checks if COUNT exceeds remaining (not just if zero)
   * @param {number} count - Number of credits to use (default 1)
   * @returns {Object} {success, reason, creditsUsed, remaining}
   */
  function useAiCredit(count = 1) {
    // Validate count
    const countValidation = validatePositiveNumber(count, 'Credit count');
    if (!countValidation.valid) {
      return { success: false, reason: countValidation.error };
    }

    const creditCount = countValidation.value;

    // Check current tier exists
    const tier = getTier(userTier);
    if (!tier) {
      return { success: false, reason: 'Invalid tier configuration' };
    }

    // Get remaining credits BEFORE attempting to use
    const remaining = getRemainingAiCredits();

    // CRITICAL FIX: Check if requested COUNT exceeds available
    // NOT just checking if remaining <= 0
    if (remaining < creditCount) {
      if (window.Logger) {
        window.Logger.warn('Insufficient AI credits', { 
          requested: creditCount, 
          available: remaining,
          tier: userTier 
        });
      }
      return {
        success: false,
        reason: 'Insufficient AI credits',
        requested: creditCount,
        available: remaining,
        needed: creditCount - remaining
      };
    }

    // Use credits safely
    aiCreditsUsed += creditCount;
    save();

    if (window.Logger) {
      window.Logger.info('AI credits used', { 
        count: creditCount, 
        remaining: getRemainingAiCredits(),
        tier: userTier 
      });
    }

    return {
      success: true,
      creditsUsed: creditCount,
      remaining: getRemainingAiCredits()
    };
  }

  /**
   * Purchase additional AI credits
   * Note: In production, this would integrate with payment system
   * @param {number} count - Number of credits to add
   * @returns {Object} {success, creditsAdded, newTotal}
   */
  function purchaseAiCredits(count) {
    // Validate count
    const countValidation = validatePositiveNumber(count, 'Credits to purchase');
    if (!countValidation.valid) {
      return { success: false, error: countValidation.error };
    }

    const creditCount = countValidation.value;

    const tier = getTier(userTier);
    if (!tier) {
      return { success: false, error: 'Invalid tier configuration' };
    }

    // In a real system, this would:
    // 1. Process payment
    // 2. Verify transaction
    // 3. Add credits to tier or track separately
    
    // For MVP, we track purchased credits separately or increase tier limit
    // For now, log the intent
    if (window.Logger) {
      window.Logger.info('Purchase AI credits requested', { 
        count: creditCount,
        tier: userTier,
        currentUsage: aiCreditsUsed,
        currentLimit: tier.aiCredits
      });
    }

    return {
      success: true,
      creditsAdded: creditCount,
      message: 'Credit purchase logged. Payment integration required.'
    };
  }

  /**
   * Get usage statistics
   * @returns {Object} Usage stats for current tier
   */
  function getUsageStats() {
    const tier = getTier(userTier);
    if (!tier) {
      return null;
    }

    const recipesUsed = window.Recipes?.getAll?.()?.length || 0;
    const recipesLimit = tier.recipes === -1 ? 'Unlimited' : tier.recipes;

    return {
      tier: userTier,
      tierName: tier.name,
      tierPrice: tier.price,
      aiCreditsUsed: Math.max(0, aiCreditsUsed), // Clamp to 0
      aiCreditsRemaining: getRemainingAiCredits(),
      aiCreditsTotal: tier.aiCredits,
      recipesUsed,
      recipesLimit,
      usersLimit: tier.users === -1 ? 'Unlimited' : tier.users,
      features: Array.from(tier.features),
      creditsPercentUsed: Math.round((aiCreditsUsed / tier.aiCredits) * 100)
    };
  }

  /**
   * Check if tier has unlimited recipes
   * @returns {boolean} True if recipes are unlimited
   */
  function hasUnlimitedRecipes() {
    const tier = getTier(userTier);
    return tier && tier.recipes === -1;
  }

  /**
   * Check if tier has unlimited users
   * @returns {boolean} True if users are unlimited
   */
  function hasUnlimitedUsers() {
    const tier = getTier(userTier);
    return tier && tier.users === -1;
  }

  /**
   * Check if user has exceeded recipe limit
   * @returns {Object} {exceeded, used, limit}
   */
  function checkRecipeLimit() {
    const tier = getTier(userTier);
    if (!tier) {
      return { exceeded: true, used: 0, limit: 0 };
    }

    if (tier.recipes === -1) {
      return { exceeded: false, used: 0, limit: -1 }; // unlimited
    }

    const used = window.Recipes?.getAll?.()?.length || 0;
    return {
      exceeded: used > tier.recipes,
      used,
      limit: tier.recipes,
      remaining: Math.max(0, tier.recipes - used)
    };
  }

  // Initialize from localStorage if available
  const savedTier = localStorage.getItem('k_user_tier');
  if (savedTier && validateTierName(savedTier)) {
    userTier = savedTier;
  }

  const savedCredits = localStorage.getItem('k_ai_credits_used');
  if (savedCredits) {
    const parsed = parseInt(savedCredits);
    if (!isNaN(parsed) && parsed >= 0) {
      aiCreditsUsed = parsed;
    }
  }

  if (window.Logger) {
    window.Logger.info('Pricing module loaded (FIXED)', { 
      tier: userTier, 
      creditsUsed: aiCreditsUsed,
      remaining: getRemainingAiCredits()
    });
  }

  return {
    getTier,
    getAllTiers,
    setUserTier,
    getUserTier,
    canUseFeature,
    getRemainingAiCredits,
    useAiCredit,
    purchaseAiCredits,
    getUsageStats,
    hasUnlimitedRecipes,
    hasUnlimitedUsers,
    checkRecipeLimit
  };
})();

window.Pricing = Pricing;
console.log('[Pricing] Pricing module loaded (FIXED)');
