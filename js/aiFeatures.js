/**
 * AI FEATURES MODULE
 * Claude integration via backend proxy
 * Uses Supabase Edge Functions (recommended) or backend endpoint
 * Recipe Assistant, Generator, Translator
 */

const AIFeatures = (() => {
  // Backend endpoint - change this to your actual backend URL
  const BACKEND_URL = localStorage.getItem('ai_backend_url') || 'https://your-backend.com/api/ai';

  /**
   * askAssistant - Ask cooking question via Claude
   * Requires valid session and AI credits
   */
  async function askAssistant(question) {
    // CRITICAL FIX: Check dependencies
    if (!window.Pricing) {
      return { success: false, error: 'Pricing module not initialized' };
    }

    // Validate input
    if (!question || question.trim().length === 0) {
      return { success: false, error: 'Question cannot be empty' };
    }

    // Check AI credits BEFORE making request
    const creditCheck = window.Pricing.useAiCredit(1);
    if (!creditCheck?.success) {
      return { success: false, error: creditCheck?.reason || 'No AI credits remaining' };
    }

    try {
      const response = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('k_auth_token') || ''}`
        },
        body: JSON.stringify({
          question: question,
          tier: window.Pricing?.getUserTier?.() || 'free'
        })
      });

      if (!response.ok) {
        // Refund credit on error
        window.Pricing?.useAiCredit?.(-1);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        window.Pricing?.useAiCredit?.(-1);
        throw new Error(data.error || 'AI request failed');
      }

      if (window.Logger) {
        window.Logger.info('AI Assistant question answered');
      }

      return { success: true, answer: data.answer };
    } catch (err) {
      if (window.Logger) {
        window.Logger.error('AI Assistant error', { error: err.message });
      }
      return { success: false, error: err.message };
    }
  }

  /**
   * generateRecipe - Generate recipe from description
   */
  async function generateRecipe(description) {
    // CRITICAL FIX: Check dependencies
    if (!window.Pricing) {
      return { success: false, error: 'Pricing module not initialized' };
    }

    if (!description || description.trim().length === 0) {
      return { success: false, error: 'Description cannot be empty' };
    }

    // Check credits (2 credits for generation)
    const creditCheck = window.Pricing.useAiCredit(2);
    if (!creditCheck?.success) {
      return { success: false, error: 'Insufficient AI credits' };
    }

    try {
      const response = await fetch(`${BACKEND_URL}/generate-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('k_auth_token') || ''}`
        },
        body: JSON.stringify({
          description: description,
          tier: window.Pricing?.getUserTier?.() || 'free'
        })
      });

      if (!response.ok) {
        window.Pricing?.useAiCredit?.(-2);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.recipe) {
        window.Pricing?.useAiCredit?.(-2);
        throw new Error(data.error || 'Recipe generation failed');
      }

      // CRITICAL FIX: Validate recipe structure
      const recipe = data.recipe;
      if (!recipe.name || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) {
        window.Pricing?.useAiCredit?.(-2);
        throw new Error('Invalid recipe structure from server');
      }

      if (window.Logger) {
        window.Logger.info('Recipe generated', { name: recipe.name });
      }

      return { success: true, recipe };
    } catch (err) {
      if (window.Logger) {
        window.Logger.error('Recipe generation error', { error: err.message });
      }
      return { success: false, error: err.message };
    }
  }

  /**
   * translateRecipe - Translate recipe to target language
   */
  async function translateRecipe(recipeId, targetLang) {
    // CRITICAL FIX: Check dependencies
    if (!window.Pricing) {
      return { success: false, error: 'Pricing module not initialized' };
    }

    if (!window.Recipes) {
      return { success: false, error: 'Recipes module not loaded' };
    }

    const recipe = window.Recipes.getById(recipeId);
    if (!recipe) {
      return { success: false, error: 'Recipe not found' };
    }

    if (!targetLang || targetLang.trim().length === 0) {
      return { success: false, error: 'Target language required' };
    }

    const creditCheck = window.Pricing.useAiCredit(1);
    if (!creditCheck?.success) {
      return { success: false, error: 'No AI credits' };
    }

    try {
      const response = await fetch(`${BACKEND_URL}/translate-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('k_auth_token') || ''}`
        },
        body: JSON.stringify({
          recipeId: recipeId,
          recipe: recipe,
          targetLang: targetLang,
          tier: window.Pricing?.getUserTier?.() || 'free'
        })
      });

      if (!response.ok) {
        window.Pricing?.useAiCredit?.(-1);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        window.Pricing?.useAiCredit?.(-1);
        throw new Error(data.error || 'Translation failed');
      }

      if (window.Logger) {
        window.Logger.info('Recipe translated', { lang: targetLang });
      }

      return { success: true, translation: data.translation };
    } catch (err) {
      if (window.Logger) {
        window.Logger.error('Recipe translation error', { error: err.message });
      }
      return { success: false, error: err.message };
    }
  }

  /**
   * scanImage - Upload image for AI analysis (invoices, recipes, handwriting)
   */
  async function scanImage(imageFile) {
    if (!window.Pricing) {
      return { success: false, error: 'Pricing module not initialized' };
    }

    if (!imageFile) {
      return { success: false, error: 'Image file required' };
    }

    const creditCheck = window.Pricing.useAiCredit(1);
    if (!creditCheck?.success) {
      return { success: false, error: 'No AI credits for scanning' };
    }

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('tier', window.Pricing?.getUserTier?.() || 'free');

      const response = await fetch(`${BACKEND_URL}/scan-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('k_auth_token') || ''}`
        },
        body: formData
      });

      if (!response.ok) {
        window.Pricing?.useAiCredit?.(-1);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        window.Pricing?.useAiCredit?.(-1);
        throw new Error(data.error || 'Scan failed');
      }

      if (window.Logger) {
        window.Logger.info('Image scanned successfully');
      }

      return { success: true, result: data.result };
    } catch (err) {
      if (window.Logger) {
        window.Logger.error('Image scan error', { error: err.message });
      }
      return { success: false, error: err.message };
    }
  }

  /**
   * setBackendUrl - Configure backend endpoint
   */
  function setBackendUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    localStorage.setItem('ai_backend_url', url);
    if (window.Logger) {
      window.Logger.info('AI backend URL configured', { url });
    }
    return true;
  }

  /**
   * hasBackendUrl - Check if backend is configured
   */
  function hasBackendUrl() {
    return !!localStorage.getItem('ai_backend_url');
  }

  if (window.Logger) {
    window.Logger.info('AI Features module loaded (backend proxy mode)');
  }

  return {
    askAssistant,
    generateRecipe,
    translateRecipe,
    scanImage,
    setBackendUrl,
    hasBackendUrl
  };
})();

window.AIFeatures = AIFeatures;
console.log('[AIFeatures] AI Features module loaded (backend proxy)');
