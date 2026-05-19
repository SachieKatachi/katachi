/**
 * RECIPES MODULE
 * Recipe management: create, edit, delete, scale, cost calculations
 * Full EN/JA support via i18n
 */

const Recipes = (() => {
  const STORAGE_KEY = 'k_recipes';
  let recipes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  let currentRecipe = null;

  function generateId() {
    return 'recipe_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    if (window.Logger) {
      window.Logger.info('Recipes saved', { count: recipes.length });
    }
  }

  function create(data) {
    const recipe = {
      id: generateId(),
      name: data.name || '',
      category: data.category || 'Main Course',
      yield: parseInt(data.yield) || 4,
      prepTime: parseInt(data.prepTime) || 0,
      cookTime: parseInt(data.cookTime) || 0,
      ingredients: data.ingredients || [],
      steps: data.steps || [],
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    recipes.push(recipe);
    save();
    if (window.Logger) {
      window.Logger.info('Recipe created', { name: recipe.name });
    }
    return recipe;
  }

  function update(id, data) {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return null;

    Object.assign(recipe, {
      ...data,
      yield: parseInt(data.yield) || recipe.yield,
      prepTime: parseInt(data.prepTime) || recipe.prepTime,
      cookTime: parseInt(data.cookTime) || recipe.cookTime,
      updatedAt: new Date().toISOString()
    });
    save();
    if (window.Logger) {
      window.Logger.info('Recipe updated', { name: recipe.name });
    }
    return recipe;
  }

  function delete_(id) {
    recipes = recipes.filter(r => r.id !== id);
    save();
    if (window.Logger) {
      window.Logger.info('Recipe deleted', { id });
    }
  }

  function getAll() {
    return recipes;
  }

  function getById(id) {
    return recipes.find(r => r.id === id);
  }

  function scale(id, newYield) {
    const recipe = getById(id);
    if (!recipe) return null;

    const scaleFactor = newYield / recipe.yield;
    const scaled = JSON.parse(JSON.stringify(recipe));
    scaled.yield = newYield;

    // Scale ingredients
    scaled.ingredients = scaled.ingredients.map(ing => ({
      ...ing,
      quantity: parseFloat((ing.quantity * scaleFactor).toFixed(2)),
      cost: parseFloat((ing.cost * scaleFactor).toFixed(2))
    }));

    return scaled;
  }

  function calculateCosts(recipe) {
    const totalCost = recipe.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
    const costPerServing = recipe.yield > 0 ? totalCost / recipe.yield : 0;

    return {
      total: parseFloat(totalCost.toFixed(2)),
      perServing: parseFloat(costPerServing.toFixed(2))
    };
  }

  function search(query) {
    const q = query.toLowerCase();
    return recipes.filter(r => 
      r.name.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.ingredients.some(i => i.name.toLowerCase().includes(q))
    );
  }

  function addIngredient(recipeId, ingredient) {
    const recipe = getById(recipeId);
    if (!recipe) return null;

    const ing = {
      id: 'ing_' + Date.now(),
      name: ingredient.name || '',
      quantity: parseFloat(ingredient.quantity) || 0,
      unit: ingredient.unit || '',
      cost: parseFloat(ingredient.cost) || 0
    };

    recipe.ingredients.push(ing);
    update(recipeId, recipe);
    return ing;
  }

  function updateIngredient(recipeId, ingId, ingredient) {
    const recipe = getById(recipeId);
    if (!recipe) return null;

    const ing = recipe.ingredients.find(i => i.id === ingId);
    if (!ing) return null;

    Object.assign(ing, {
      name: ingredient.name || ing.name,
      quantity: parseFloat(ingredient.quantity) || ing.quantity,
      unit: ingredient.unit || ing.unit,
      cost: parseFloat(ingredient.cost) || ing.cost
    });

    update(recipeId, recipe);
    return ing;
  }

  function deleteIngredient(recipeId, ingId) {
    const recipe = getById(recipeId);
    if (!recipe) return null;

    recipe.ingredients = recipe.ingredients.filter(i => i.id !== ingId);
    update(recipeId, recipe);
  }

  function addStep(recipeId, step) {
    const recipe = getById(recipeId);
    if (!recipe) return null;

    const s = {
      id: 'step_' + Date.now(),
      order: recipe.steps.length + 1,
      description: step.description || ''
    };

    recipe.steps.push(s);
    update(recipeId, recipe);
    return s;
  }

  function updateStep(recipeId, stepId, step) {
    const recipe = getById(recipeId);
    if (!recipe) return null;

    const s = recipe.steps.find(st => st.id === stepId);
    if (!s) return null;

    s.description = step.description || s.description;
    update(recipeId, recipe);
    return s;
  }

  function deleteStep(recipeId, stepId) {
    const recipe = getById(recipeId);
    if (!recipe) return null;

    recipe.steps = recipe.steps.filter(s => s.id !== stepId);
    // Re-order steps
    recipe.steps.forEach((s, i) => {
      s.order = i + 1;
    });
    update(recipeId, recipe);
  }

  // Initialization
  if (window.Logger) {
    window.Logger.info('Recipes module loaded', { count: recipes.length });
  }

  return {
    create,
    update,
    delete: delete_,
    getAll,
    getById,
    scale,
    calculateCosts,
    search,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    addStep,
    updateStep,
    deleteStep
  };
})();

window.Recipes = Recipes;
console.log('[Recipes] Recipes module loaded');
