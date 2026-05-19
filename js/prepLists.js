/**
 * PREP LISTS MODULE - FIXED VERSION
 * Station-based prep sheets from recipes
 * Full EN/JA support, error handling, input validation
 * 
 * CHANGES FROM ORIGINAL:
 * 1. Added Recipes module dependency check
 * 2. Standardized all error responses to {success, data/error} format
 * 3. Added input validation for all parameters
 * 4. Fixed generatePrepSheet() to safely handle missing recipes
 * 5. Added quantity validation
 * 6. Added proper error messages for debugging
 */

const PrepLists = (() => {
  const STORAGE_KEY = 'k_prepLists';
  let prepLists = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  /**
   * Input validation helpers
   */
  function validateString(value, fieldName, minLength = 1) {
    if (!value || typeof value !== 'string' || value.trim().length < minLength) {
      return { valid: false, error: `${fieldName} must be a non-empty string` };
    }
    return { valid: true };
  }

  function validateArray(value, fieldName) {
    if (!Array.isArray(value)) {
      return { valid: false, error: `${fieldName} must be an array` };
    }
    return { valid: true };
  }

  function validateDate(value) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date format' };
    }
    return { valid: true };
  }

  function generateId() {
    return 'prep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prepLists));
      if (window.Logger) {
        window.Logger.info('Prep lists saved', { count: prepLists.length });
      }
    } catch (err) {
      if (window.Logger) {
        window.Logger.error('Failed to save prep lists', { error: err.message });
      }
    }
  }

  /**
   * Create a new prep list
   * @param {Object} data - {name, date, shift, recipeIds, stations, quantities}
   * @returns {Object} {success, data/error}
   */
  function create(data) {
    // Validate input
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid data object' };
    }

    // Validate required fields
    const nameValidation = validateString(data.name, 'Prep list name');
    if (!nameValidation.valid) {
      return { success: false, error: nameValidation.error };
    }

    const dateValidation = validateDate(data.date || new Date());
    if (!dateValidation.valid) {
      return { success: false, error: dateValidation.error };
    }

    const recipeIdsValidation = validateArray(data.recipeIds || [], 'Recipe IDs');
    if (!recipeIdsValidation.valid) {
      return { success: false, error: recipeIdsValidation.error };
    }

    // Create prep list
    const prepList = {
      id: generateId(),
      name: data.name.trim(),
      date: data.date || new Date().toISOString().split('T')[0],
      shift: data.shift || 'All Day',
      recipeIds: data.recipeIds || [],
      stations: data.stations || {},
      quantities: data.quantities || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    prepLists.push(prepList);
    save();

    if (window.Logger) {
      window.Logger.info('Prep list created', { name: prepList.name, recipes: prepList.recipeIds.length });
    }

    return { success: true, data: prepList };
  }

  /**
   * Get all prep lists
   * @returns {Array} Array of prep lists
   */
  function getAll() {
    return prepLists;
  }

  /**
   * Get prep list by ID
   * @param {string} id - Prep list ID
   * @returns {Object|null} Prep list or null
   */
  function getById(id) {
    if (!id || typeof id !== 'string') {
      return null;
    }
    return prepLists.find(p => p.id === id) || null;
  }

  /**
   * Update prep list
   * @param {string} id - Prep list ID
   * @param {Object} data - Fields to update
   * @returns {Object} {success, data/error}
   */
  function update(id, data) {
    // Validate ID
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid prep list ID' };
    }

    const prep = getById(id);
    if (!prep) {
      return { success: false, error: 'Prep list not found' };
    }

    // Validate input data
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid data object' };
    }

    // Validate optional fields if provided
    if (data.name !== undefined) {
      const nameValidation = validateString(data.name, 'Prep list name');
      if (!nameValidation.valid) {
        return { success: false, error: nameValidation.error };
      }
      prep.name = data.name.trim();
    }

    if (data.date !== undefined) {
      const dateValidation = validateDate(data.date);
      if (!dateValidation.valid) {
        return { success: false, error: dateValidation.error };
      }
      prep.date = data.date;
    }

    if (data.shift !== undefined) {
      const shiftValidation = validateString(data.shift, 'Shift');
      if (!shiftValidation.valid) {
        return { success: false, error: shiftValidation.error };
      }
      prep.shift = data.shift.trim();
    }

    if (data.recipeIds !== undefined) {
      const recipesValidation = validateArray(data.recipeIds, 'Recipe IDs');
      if (!recipesValidation.valid) {
        return { success: false, error: recipesValidation.error };
      }
      prep.recipeIds = data.recipeIds;
    }

    if (data.stations !== undefined) {
      if (typeof data.stations !== 'object' || Array.isArray(data.stations)) {
        return { success: false, error: 'Stations must be an object' };
      }
      prep.stations = data.stations;
    }

    if (data.quantities !== undefined) {
      if (typeof data.quantities !== 'object' || Array.isArray(data.quantities)) {
        return { success: false, error: 'Quantities must be an object' };
      }
      prep.quantities = data.quantities;
    }

    prep.updatedAt = new Date().toISOString();
    save();

    if (window.Logger) {
      window.Logger.info('Prep list updated', { id, name: prep.name });
    }

    return { success: true, data: prep };
  }

  /**
   * Delete prep list
   * @param {string} id - Prep list ID
   * @returns {Object} {success, error}
   */
  function delete_(id) {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid prep list ID' };
    }

    const initialLength = prepLists.length;
    prepLists = prepLists.filter(p => p.id !== id);

    if (prepLists.length === initialLength) {
      return { success: false, error: 'Prep list not found' };
    }

    save();

    if (window.Logger) {
      window.Logger.info('Prep list deleted', { id });
    }

    return { success: true };
  }

  /**
   * Build prep list from selected recipes
   * @param {Array} recipeIds - Array of recipe IDs
   * @param {Object} data - {name, date, shift, stations}
   * @returns {Object} {success, data/error}
   */
  function buildFromRecipes(recipeIds, data) {
    // CRITICAL FIX: Check if Recipes module is loaded
    if (!window.Recipes) {
      return { success: false, error: 'Recipes module not loaded. Cannot build prep list.' };
    }

    // Validate recipeIds
    const recipesValidation = validateArray(recipeIds, 'Recipe IDs');
    if (!recipesValidation.valid) {
      return { success: false, error: recipesValidation.error };
    }

    if (recipeIds.length === 0) {
      return { success: false, error: 'At least one recipe must be selected' };
    }

    // Verify all recipes exist
    const missingRecipes = [];
    recipeIds.forEach(id => {
      if (!window.Recipes.getById(id)) {
        missingRecipes.push(id);
      }
    });

    if (missingRecipes.length > 0) {
      return { success: false, error: `${missingRecipes.length} recipe(s) not found` };
    }

    // Create prep list with validated data
    const prepData = {
      name: data?.name || 'Prep List ' + new Date().toLocaleDateString(),
      date: data?.date || new Date().toISOString().split('T')[0],
      shift: data?.shift || 'All Day',
      recipeIds: recipeIds,
      stations: data?.stations || {}
    };

    return create(prepData);
  }

  /**
   * Generate printable prep sheet from prep list
   * CRITICAL FIX: Now handles missing Recipes and validates data
   * @param {string} prepListId - Prep list ID
   * @returns {Object} {success, data/error} - data contains sheet structure
   */
  function generatePrepSheet(prepListId) {
    // Validate prep list exists
    if (!prepListId || typeof prepListId !== 'string') {
      return { success: false, error: 'Invalid prep list ID' };
    }

    const prepList = getById(prepListId);
    if (!prepList) {
      return { success: false, error: 'Prep list not found' };
    }

    // CRITICAL FIX: Check if Recipes module is loaded
    if (!window.Recipes) {
      return { success: false, error: 'Recipes module not loaded. Cannot generate prep sheet.' };
    }

    // Get all recipes and validate they exist
    const recipes = [];
    const missingRecipeIds = [];

    prepList.recipeIds.forEach(id => {
      const recipe = window.Recipes.getById(id);
      if (recipe) {
        recipes.push(recipe);
      } else {
        missingRecipeIds.push(id);
      }
    });

    // Log warning if some recipes missing
    if (missingRecipeIds.length > 0) {
      if (window.Logger) {
        window.Logger.warn('Some recipes missing from prep sheet', { missingRecipeIds });
      }
    }

    // Must have at least one recipe
    if (recipes.length === 0) {
      return { success: false, error: 'No recipes found for this prep list' };
    }

    // Build prep sheet with validated data
    try {
      const sheet = {
        id: prepList.id,
        name: prepList.name,
        date: prepList.date,
        shift: prepList.shift,
        generatedAt: new Date().toISOString(),
        recipes: recipes.map(r => {
          const quantity = prepList.quantities[r.id];
          const validQuantity = quantity && typeof quantity === 'number' && quantity > 0 ? quantity : r.yield;
          
          return {
            id: r.id,
            name: r.name,
            category: r.category || 'Main Course',
            yield: r.yield,
            quantity: validQuantity,
            station: prepList.stations[r.id] || 'General',
            prepTime: r.prepTime || 0,
            cookTime: r.cookTime || 0,
            ingredients: r.ingredients || [],
            steps: r.steps || []
          };
        }),
        totalRecipes: recipes.length,
        missingRecipes: missingRecipeIds.length
      };

      if (window.Logger) {
        window.Logger.info('Prep sheet generated', { 
          prepListId, 
          recipes: recipes.length,
          missing: missingRecipeIds.length 
        });
      }

      return { success: true, data: sheet };
    } catch (err) {
      if (window.Logger) {
        window.Logger.error('Error generating prep sheet', { error: err.message });
      }
      return { success: false, error: 'Failed to generate prep sheet: ' + err.message };
    }
  }

  /**
   * Get prep lists by date range
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {Array} Matching prep lists
   */
  function getByDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      return [];
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      if (window.Logger) {
        window.Logger.warn('Invalid date format for getByDateRange');
      }
      return [];
    }

    return prepLists.filter(p => {
      const pDate = new Date(p.date);
      return pDate >= start && pDate <= end;
    });
  }

  /**
   * Get prep lists by shift
   * @param {string} shift - Shift name (e.g., "AM Prep", "PM Prep")
   * @returns {Array} Matching prep lists
   */
  function getByShift(shift) {
    if (!shift || typeof shift !== 'string') {
      return [];
    }

    return prepLists.filter(p => p.shift === shift.trim());
  }

  // Initialize
  if (window.Logger) {
    window.Logger.info('PrepLists module loaded', { count: prepLists.length });
  }

  return {
    create,
    getAll,
    getById,
    update,
    delete: delete_,
    buildFromRecipes,
    generatePrepSheet,
    getByDateRange,
    getByShift
  };
})();

window.PrepLists = PrepLists;
console.log('[PrepLists] PrepLists module loaded (FIXED)');
