// ============================================================================
// KATACHI - COSTING MODULE
// Calculate recipe costs, track ingredient pricing, and analyze margins
// ============================================================================

const CostingModule = (() => {
    const STORAGE_KEY = 'k_costing';
    const INGREDIENT_COSTS_KEY = 'k_ingredient_costs';
    let recipeCosts = {}; // Map of recipeId -> cost data
    let ingredientCosts = {}; // Map of ingredientName -> cost per unit

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        loadCosts();
        console.log('✅ Costing module initialized');
    }

    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================

    function loadCosts() {
        const storedRecipeCosts = localStorage.getItem(STORAGE_KEY);
        const storedIngredientCosts = localStorage.getItem(INGREDIENT_COSTS_KEY);
        
        recipeCosts = storedRecipeCosts ? JSON.parse(storedRecipeCosts) : {};
        ingredientCosts = storedIngredientCosts ? JSON.parse(storedIngredientCosts) : {};
    }

    function saveCosts() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recipeCosts));
        localStorage.setItem(INGREDIENT_COSTS_KEY, JSON.stringify(ingredientCosts));
    }

    // ============================================================================
    // INGREDIENT COST MANAGEMENT
    // ============================================================================

    function setIngredientCost(ingredientName, costPerUnit, unit) {
        ingredientCosts[ingredientName] = {
            costPerUnit: parseFloat(costPerUnit),
            unit: unit,
            updatedAt: new Date().toISOString()
        };
        
        saveCosts();
        
        // Recalculate all recipe costs that use this ingredient
        recalculateAffectedRecipes(ingredientName);
        
        return ingredientCosts[ingredientName];
    }

    function getIngredientCost(ingredientName) {
        return ingredientCosts[ingredientName] || null;
    }

    function updateIngredientCost(ingredientName, newCost) {
        if (!ingredientCosts[ingredientName]) {
            console.warn(`Ingredient ${ingredientName} not found`);
            return null;
        }

        ingredientCosts[ingredientName].costPerUnit = parseFloat(newCost);
        ingredientCosts[ingredientName].updatedAt = new Date().toISOString();
        
        saveCosts();
        recalculateAffectedRecipes(ingredientName);
        
        return ingredientCosts[ingredientName];
    }

    function deleteIngredientCost(ingredientName) {
        if (!ingredientCosts[ingredientName]) return false;
        
        delete ingredientCosts[ingredientName];
        saveCosts();
        return true;
    }

    function importFromInventory() {
        if (typeof InventoryModule === 'undefined') {
            console.warn('InventoryModule not loaded');
            return false;
        }

        const inventoryItems = InventoryModule.getAllItems();
        let imported = 0;

        inventoryItems.forEach(item => {
            if (item.unitCost > 0) {
                setIngredientCost(item.name, item.unitCost, item.unit);
                imported++;
            }
        });

        console.log(`✅ Imported ${imported} ingredient costs from inventory`);
        return imported;
    }

    // ============================================================================
    // RECIPE COST CALCULATION
    // ============================================================================

    function calculateRecipeCost(recipe) {
        if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
            return {
                totalCost: 0,
                costPerServing: 0,
                missingCosts: [],
                breakdown: []
            };
        }

        let totalCost = 0;
        let missingCosts = [];
        let breakdown = [];

        recipe.ingredients.forEach(ingredient => {
            const ingredientCostData = getIngredientCost(ingredient.name);
            
            if (!ingredientCostData) {
                missingCosts.push(ingredient.name);
                breakdown.push({
                    name: ingredient.name,
                    quantity: ingredient.quantity,
                    unit: ingredient.unit,
                    cost: 0,
                    missing: true
                });
            } else {
                // Convert units if needed (simplified - in real app would handle unit conversion)
                const cost = ingredient.quantity * ingredientCostData.costPerUnit;
                totalCost += cost;
                
                breakdown.push({
                    name: ingredient.name,
                    quantity: ingredient.quantity,
                    unit: ingredient.unit,
                    costPerUnit: ingredientCostData.costPerUnit,
                    cost: cost,
                    missing: false
                });
            }
        });

        const yield_ = recipe.yield || 1;
        const costPerServing = totalCost / yield_;

        const costData = {
            recipeId: recipe.id,
            recipeName: recipe.name,
            totalCost: totalCost,
            costPerServing: costPerServing,
            yield: yield_,
            missingCosts: missingCosts,
            breakdown: breakdown,
            calculatedAt: new Date().toISOString(),
            accuracy: missingCosts.length === 0 ? 100 : Math.round(((recipe.ingredients.length - missingCosts.length) / recipe.ingredients.length) * 100)
        };

        // Store the calculation
        recipeCosts[recipe.id] = costData;
        saveCosts();

        // Achievement check: Cost Master
        if (missingCosts.length === 0 && recipe.ingredients.length > 0) {
            checkAchievement('cost_master');
        }

        // Achievement check: Precision (100% accuracy)
        if (costData.accuracy === 100) {
            checkAchievement('precision');
        }

        return costData;
    }

    function getRecipeCost(recipeId) {
        return recipeCosts[recipeId] || null;
    }

    function recalculateAffectedRecipes(ingredientName) {
        // This would need RecipesModule to get all recipes
        if (typeof RecipesModule === 'undefined') return;

        const allRecipes = RecipesModule.getAllRecipes();
        
        allRecipes.forEach(recipe => {
            const usesIngredient = recipe.ingredients.some(ing => ing.name === ingredientName);
            if (usesIngredient) {
                calculateRecipeCost(recipe);
            }
        });

        console.log(`♻️ Recalculated recipes using ${ingredientName}`);
    }

    function recalculateAllRecipes() {
        if (typeof RecipesModule === 'undefined') {
            console.warn('RecipesModule not loaded');
            return 0;
        }

        const allRecipes = RecipesModule.getAllRecipes();
        let calculated = 0;

        allRecipes.forEach(recipe => {
            calculateRecipeCost(recipe);
            calculated++;
        });

        console.log(`♻️ Recalculated ${calculated} recipes`);
        return calculated;
    }

    // ============================================================================
    // COST ANALYSIS
    // ============================================================================

    function analyzeRecipeCost(recipeId, targetPrice = null) {
        const costData = getRecipeCost(recipeId);
        if (!costData) return null;

        const analysis = {
            ...costData,
            targetPrice: targetPrice,
            targetMargin: null,
            targetMarginPercentage: null,
            foodCostPercentage: null,
            recommendations: []
        };

        if (targetPrice) {
            const margin = targetPrice - costData.costPerServing;
            const marginPercentage = (margin / targetPrice) * 100;
            const foodCostPercentage = (costData.costPerServing / targetPrice) * 100;

            analysis.targetMargin = margin;
            analysis.targetMarginPercentage = marginPercentage;
            analysis.foodCostPercentage = foodCostPercentage;

            // Industry standard: food cost should be 28-35%
            if (foodCostPercentage > 35) {
                analysis.recommendations.push({
                    type: 'warning',
                    message: `Food cost is ${foodCostPercentage.toFixed(1)}%. Consider increasing price or reducing ingredient costs.`,
                    priority: 'high'
                });
            } else if (foodCostPercentage < 25) {
                analysis.recommendations.push({
                    type: 'info',
                    message: `Food cost is only ${foodCostPercentage.toFixed(1)}%. You may have room to improve quality or lower price.`,
                    priority: 'low'
                });
            } else {
                analysis.recommendations.push({
                    type: 'success',
                    message: `Food cost is ${foodCostPercentage.toFixed(1)}% - within ideal range (28-35%).`,
                    priority: 'info'
                });
            }

            // Check if margin meets target (e.g., 60%+ margin)
            if (marginPercentage >= 60) {
                analysis.recommendations.push({
                    type: 'success',
                    message: `Strong margin at ${marginPercentage.toFixed(1)}%.`
                });
            }
        }

        if (costData.missingCosts.length > 0) {
            analysis.recommendations.push({
                type: 'warning',
                message: `Missing cost data for ${costData.missingCosts.length} ingredient(s): ${costData.missingCosts.join(', ')}`,
                priority: 'high'
            });
        }

        return analysis;
    }

    function getCostingStats() {
        const totalRecipes = Object.keys(recipeCosts).length;
        const totalIngredients = Object.keys(ingredientCosts).length;
        
        let recipesWithFullCosting = 0;
        let avgAccuracy = 0;

        Object.values(recipeCosts).forEach(cost => {
            if (cost.accuracy === 100) {
                recipesWithFullCosting++;
            }
            avgAccuracy += cost.accuracy;
        });

        avgAccuracy = totalRecipes > 0 ? avgAccuracy / totalRecipes : 0;

        return {
            totalRecipes,
            totalIngredients,
            recipesWithFullCosting,
            recipesWithPartialCosting: totalRecipes - recipesWithFullCosting,
            avgAccuracy: Math.round(avgAccuracy)
        };
    }

    function getTopExpensiveRecipes(limit = 10) {
        return Object.values(recipeCosts)
            .sort((a, b) => b.costPerServing - a.costPerServing)
            .slice(0, limit);
    }

    function getTopExpensiveIngredients(limit = 10) {
        return Object.entries(ingredientCosts)
            .map(([name, data]) => ({
                name,
                costPerUnit: data.costPerUnit,
                unit: data.unit
            }))
            .sort((a, b) => b.costPerUnit - a.costPerUnit)
            .slice(0, limit);
    }

    // ============================================================================
    // BATCH OPERATIONS
    // ============================================================================

    function bulkUpdateIngredientCosts(updates) {
        // updates = [{name, costPerUnit, unit}, ...]
        let updated = 0;

        updates.forEach(update => {
            if (update.name && update.costPerUnit !== undefined) {
                setIngredientCost(update.name, update.costPerUnit, update.unit);
                updated++;
            }
        });

        console.log(`✅ Bulk updated ${updated} ingredient costs`);
        return updated;
    }

    function exportIngredientCosts() {
        return Object.entries(ingredientCosts).map(([name, data]) => ({
            name,
            costPerUnit: data.costPerUnit,
            unit: data.unit,
            updatedAt: data.updatedAt
        }));
    }

    function exportRecipeCosts() {
        return Object.values(recipeCosts);
    }

    // ============================================================================
    // ACHIEVEMENT SYSTEM HOOKS
    // ============================================================================

    function checkAchievement(type) {
        if (typeof AchievementSystem === 'undefined') return;

        switch(type) {
            case 'cost_master':
                // Check if user has calculated at least one full recipe cost
                const hasFullCost = Object.values(recipeCosts).some(cost => cost.accuracy === 100);
                if (hasFullCost) {
                    AchievementSystem.unlock('cost_master');
                }
                break;
            case 'precision':
                // Check if user has achieved 100% accuracy on multiple recipes
                const fullCostRecipes = Object.values(recipeCosts).filter(cost => cost.accuracy === 100);
                if (fullCostRecipes.length >= 5) {
                    AchievementSystem.unlock('precision');
                }
                break;
        }
    }

    // ============================================================================
    // UI RENDERING
    // ============================================================================

    function renderCostingView() {
        const container = document.getElementById('costing-container');
        if (!container) return;

        const stats = getCostingStats();

        const html = `
            <div class="costing-header">
                <div>
                    <h2 data-en="Recipe Costing" data-ja="レシピ原価計算">Recipe Costing</h2>
                    <div class="costing-stats-row">
                        <span class="stat">${stats.totalRecipes} recipes costed</span>
                        <span class="stat">${stats.totalIngredients} ingredients tracked</span>
                        <span class="stat stat-accuracy">${stats.avgAccuracy}% avg accuracy</span>
                    </div>
                </div>
                <div class="costing-actions">
                    <button class="btn-secondary" id="import-from-inventory">Import from Inventory</button>
                    <button class="btn-primary" id="manage-ingredient-costs">Manage Ingredient Costs</button>
                </div>
            </div>

            <div class="costing-tabs">
                <button class="tab-btn active" data-tab="recipes">Recipe Costs</button>
                <button class="tab-btn" data-tab="ingredients">Ingredient Costs</button>
                <button class="tab-btn" data-tab="insights">Insights</button>
            </div>

            <div class="tab-content" id="recipes-tab">
                ${renderRecipeCostsTable()}
            </div>

            <div class="tab-content" id="ingredients-tab" style="display: none;">
                ${renderIngredientCostsTable()}
            </div>

            <div class="tab-content" id="insights-tab" style="display: none;">
                ${renderCostingInsights()}
            </div>
        `;

        container.innerHTML = html;
    }

    function renderRecipeCostsTable() {
        const costs = Object.values(recipeCosts);

        if (costs.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">💰</div>
                    <h3>No Recipe Costs Yet</h3>
                    <p>Calculate costs for your recipes to track profitability</p>
                </div>
            `;
        }

        return `
            <table class="costing-table">
                <thead>
                    <tr>
                        <th>Recipe</th>
                        <th>Total Cost</th>
                        <th>Cost/Serving</th>
                        <th>Yield</th>
                        <th>Accuracy</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${costs.map(cost => `
                        <tr>
                            <td><strong>${cost.recipeName}</strong></td>
                            <td>$${cost.totalCost.toFixed(2)}</td>
                            <td><strong>$${cost.costPerServing.toFixed(2)}</strong></td>
                            <td>${cost.yield} servings</td>
                            <td>
                                <span class="accuracy-badge ${cost.accuracy === 100 ? 'complete' : 'partial'}">
                                    ${cost.accuracy}%
                                </span>
                            </td>
                            <td>
                                <button class="btn-sm btn-secondary view-breakdown" data-recipe-id="${cost.recipeId}">
                                    View Breakdown
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    function renderIngredientCostsTable() {
        const ingredients = Object.entries(ingredientCosts);

        if (ingredients.length === 0) {
            return `
                <div class="empty-state">
                    <h3>No Ingredient Costs Yet</h3>
                    <p>Add ingredient costs to enable recipe costing</p>
                    <button class="btn-primary" id="add-ingredient-cost">Add Ingredient Cost</button>
                </div>
            `;
        }

        return `
            <div class="ingredient-costs-actions">
                <button class="btn-primary" id="add-ingredient-cost">+ Add Ingredient</button>
            </div>
            <table class="costing-table">
                <thead>
                    <tr>
                        <th>Ingredient</th>
                        <th>Cost per Unit</th>
                        <th>Unit</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${ingredients.map(([name, data]) => `
                        <tr>
                            <td><strong>${name}</strong></td>
                            <td>$${data.costPerUnit.toFixed(2)}</td>
                            <td>${data.unit}</td>
                            <td>${formatDate(data.updatedAt)}</td>
                            <td>
                                <button class="btn-icon edit-ingredient-cost" data-name="${name}">✏️</button>
                                <button class="btn-icon delete-ingredient-cost" data-name="${name}">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    function renderCostingInsights() {
        const topExpensive = getTopExpensiveRecipes(5);
        const topIngredients = getTopExpensiveIngredients(5);

        return `
            <div class="insights-grid">
                <div class="insight-card">
                    <h3>Most Expensive Recipes (per serving)</h3>
                    <div class="insight-list">
                        ${topExpensive.map(recipe => `
                            <div class="insight-item">
                                <span class="insight-name">${recipe.recipeName}</span>
                                <span class="insight-value">$${recipe.costPerServing.toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="insight-card">
                    <h3>Most Expensive Ingredients</h3>
                    <div class="insight-list">
                        ${topIngredients.map(ing => `
                            <div class="insight-item">
                                <span class="insight-name">${ing.name}</span>
                                <span class="insight-value">$${ing.costPerUnit.toFixed(2)}/${ing.unit}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================

    function attachEventListeners() {
        const container = document.getElementById('costing-container');
        if (!container) return;

        container.addEventListener('click', (e) => {
            if (e.target.closest('#import-from-inventory')) {
                const imported = importFromInventory();
                alert(`Imported ${imported} ingredient costs from inventory`);
                renderCostingView();
            }

            if (e.target.closest('.tab-btn')) {
                const tab = e.target.closest('.tab-btn').dataset.tab;
                switchTab(tab);
            }
        });
    }

    function switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
        document.getElementById(`${tabName}-tab`).style.display = 'block';
    }

    // ============================================================================
    // UTILITIES
    // ============================================================================

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        init,
        setIngredientCost,
        getIngredientCost,
        updateIngredientCost,
        deleteIngredientCost,
        importFromInventory,
        calculateRecipeCost,
        getRecipeCost,
        recalculateAllRecipes,
        analyzeRecipeCost,
        getCostingStats,
        getTopExpensiveRecipes,
        getTopExpensiveIngredients,
        bulkUpdateIngredientCosts,
        exportIngredientCosts,
        exportRecipeCosts,
        renderCostingView,
        attachEventListeners
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', CostingModule.init);
} else {
    CostingModule.init();
}
