// ============================================================================
// KATACHI - PRICING MODULE
// Set menu prices, calculate margins, and optimize profitability
// ============================================================================

const PricingModule = (() => {
    const STORAGE_KEY = 'k_pricing';
    let pricingData = {}; // Map of recipeId -> pricing info

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        loadPricing();
        console.log('✅ Pricing module initialized');
    }

    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================

    function loadPricing() {
        const stored = localStorage.getItem(STORAGE_KEY);
        pricingData = stored ? JSON.parse(stored) : {};
    }

    function savePricing() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pricingData));
    }

    // ============================================================================
    // PRICING STRATEGIES
    // ============================================================================

    const PRICING_STRATEGIES = {
        COST_PLUS: 'cost_plus',           // Cost + fixed markup %
        TARGET_MARGIN: 'target_margin',    // Target profit margin %
        COMPETITIVE: 'competitive',        // Match competitor pricing
        VALUE_BASED: 'value_based',       // Based on perceived value
        PSYCHOLOGICAL: 'psychological'     // $9.99 vs $10.00
    };

    const PRICING_TIERS = {
        ECONOMY: { multiplier: 2.5, name: 'Economy' },      // 2.5x cost
        STANDARD: { multiplier: 3.0, name: 'Standard' },    // 3x cost
        PREMIUM: { multiplier: 3.5, name: 'Premium' },      // 3.5x cost
        LUXURY: { multiplier: 4.0, name: 'Luxury' }         // 4x cost
    };

    // ============================================================================
    // PRICE CALCULATION
    // ============================================================================

    function calculatePrice(recipeId, strategy = 'cost_plus', options = {}) {
        // Get recipe cost from CostingModule
        if (typeof CostingModule === 'undefined') {
            console.warn('CostingModule not loaded');
            return null;
        }

        const costData = CostingModule.getRecipeCost(recipeId);
        if (!costData) {
            console.warn(`No cost data found for recipe ${recipeId}`);
            return null;
        }

        const cost = costData.costPerServing;
        let calculatedPrice = 0;
        let calculation = {};

        switch(strategy) {
            case PRICING_STRATEGIES.COST_PLUS:
                const markup = options.markup || 200; // Default 200% markup = 3x cost
                calculatedPrice = cost * (1 + markup / 100);
                calculation = {
                    method: 'Cost Plus',
                    cost: cost,
                    markup: markup,
                    markupAmount: calculatedPrice - cost
                };
                break;

            case PRICING_STRATEGIES.TARGET_MARGIN:
                const targetMargin = options.targetMargin || 66.67; // Default 66.67% margin
                calculatedPrice = cost / (1 - targetMargin / 100);
                calculation = {
                    method: 'Target Margin',
                    cost: cost,
                    targetMargin: targetMargin,
                    actualMargin: ((calculatedPrice - cost) / calculatedPrice) * 100
                };
                break;

            case PRICING_STRATEGIES.COMPETITIVE:
                calculatedPrice = options.competitorPrice || cost * 3;
                calculation = {
                    method: 'Competitive',
                    cost: cost,
                    competitorPrice: options.competitorPrice,
                    ourMargin: ((calculatedPrice - cost) / calculatedPrice) * 100
                };
                break;

            case PRICING_STRATEGIES.VALUE_BASED:
                const tier = options.tier || 'STANDARD';
                const multiplier = PRICING_TIERS[tier]?.multiplier || 3.0;
                calculatedPrice = cost * multiplier;
                calculation = {
                    method: 'Value Based',
                    tier: PRICING_TIERS[tier]?.name,
                    multiplier: multiplier,
                    cost: cost
                };
                break;

            case PRICING_STRATEGIES.PSYCHOLOGICAL:
                const basePrice = cost * (options.multiplier || 3);
                // Round to psychological price points (.99, .95, .49)
                calculatedPrice = Math.ceil(basePrice) - 0.01;
                calculation = {
                    method: 'Psychological',
                    basePrice: basePrice,
                    adjustment: 'Rounded to .99'
                };
                break;

            default:
                calculatedPrice = cost * 3; // Default 3x cost
        }

        // Apply psychological rounding if enabled
        if (options.psychologicalPricing && strategy !== PRICING_STRATEGIES.PSYCHOLOGICAL) {
            const rounded = Math.ceil(calculatedPrice) - 0.01;
            calculation.psychologicalAdjustment = {
                before: calculatedPrice,
                after: rounded
            };
            calculatedPrice = rounded;
        }

        const foodCostPercentage = (cost / calculatedPrice) * 100;
        const margin = calculatedPrice - cost;
        const marginPercentage = (margin / calculatedPrice) * 100;

        return {
            recipeId,
            price: calculatedPrice,
            cost: cost,
            margin: margin,
            marginPercentage: marginPercentage,
            foodCostPercentage: foodCostPercentage,
            strategy: strategy,
            calculation: calculation,
            calculatedAt: new Date().toISOString()
        };
    }

    // ============================================================================
    // PRICE MANAGEMENT
    // ============================================================================

    function setPrice(recipeId, price, strategy = 'manual', notes = '') {
        if (typeof CostingModule === 'undefined') {
            console.warn('CostingModule not loaded');
            return null;
        }

        const costData = CostingModule.getRecipeCost(recipeId);
        if (!costData) {
            console.warn(`No cost data for recipe ${recipeId}`);
            return null;
        }

        const cost = costData.costPerServing;
        const margin = price - cost;
        const marginPercentage = (margin / price) * 100;
        const foodCostPercentage = (cost / price) * 100;

        const priceData = {
            recipeId: recipeId,
            recipeName: costData.recipeName,
            price: parseFloat(price),
            cost: cost,
            margin: margin,
            marginPercentage: marginPercentage,
            foodCostPercentage: foodCostPercentage,
            strategy: strategy,
            notes: notes,
            setAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            priceHistory: pricingData[recipeId]?.priceHistory || []
        };

        // Add to price history
        if (pricingData[recipeId]) {
            priceData.priceHistory.push({
                price: pricingData[recipeId].price,
                changedAt: new Date().toISOString()
            });
        }

        pricingData[recipeId] = priceData;
        savePricing();

        // Achievement check: Perfectionist (99%+ margin)
        if (marginPercentage >= 99) {
            checkAchievement('perfectionist');
        }

        return priceData;
    }

    function updatePrice(recipeId, newPrice, notes = '') {
        const existing = pricingData[recipeId];
        if (!existing) {
            return setPrice(recipeId, newPrice, 'manual', notes);
        }

        return setPrice(recipeId, newPrice, existing.strategy, notes);
    }

    function getPrice(recipeId) {
        return pricingData[recipeId] || null;
    }

    function deletePrice(recipeId) {
        if (!pricingData[recipeId]) return false;

        delete pricingData[recipeId];
        savePricing();
        return true;
    }

    // ============================================================================
    // PRICE OPTIMIZATION
    // ============================================================================

    function optimizePrice(recipeId, constraints = {}) {
        const pricing = calculatePrice(recipeId, PRICING_STRATEGIES.TARGET_MARGIN, {
            targetMargin: constraints.targetMargin || 65
        });

        if (!pricing) return null;

        const recommendations = [];

        // Check food cost percentage (ideal: 28-35%)
        if (pricing.foodCostPercentage > 35) {
            recommendations.push({
                type: 'increase',
                message: `Food cost is ${pricing.foodCostPercentage.toFixed(1)}%. Consider raising price to $${(pricing.cost / 0.32).toFixed(2)} for 32% food cost.`,
                suggestedPrice: pricing.cost / 0.32,
                reason: 'Lower food cost percentage'
            });
        } else if (pricing.foodCostPercentage < 28) {
            recommendations.push({
                type: 'decrease',
                message: `Food cost is only ${pricing.foodCostPercentage.toFixed(1)}%. You could lower price or improve quality.`,
                suggestedPrice: pricing.cost / 0.30,
                reason: 'Room for price adjustment'
            });
        }

        // Psychological pricing check
        if (pricing.price % 1 !== 0.99 && pricing.price % 1 !== 0.95) {
            const psychPrice = Math.ceil(pricing.price) - 0.01;
            recommendations.push({
                type: 'psychological',
                message: `Round to $${psychPrice.toFixed(2)} for psychological pricing`,
                suggestedPrice: psychPrice,
                reason: 'Psychological pricing (.99 ending)'
            });
        }

        // Competitive positioning
        if (constraints.competitorPrice) {
            const diff = pricing.price - constraints.competitorPrice;
            const diffPercent = (diff / constraints.competitorPrice) * 100;

            if (Math.abs(diffPercent) > 15) {
                recommendations.push({
                    type: 'competitive',
                    message: `Your price is ${diffPercent > 0 ? 'higher' : 'lower'} than competitors by ${Math.abs(diffPercent).toFixed(1)}%`,
                    suggestedPrice: constraints.competitorPrice,
                    reason: 'Competitive positioning'
                });
            }
        }

        return {
            current: pricing,
            recommendations: recommendations,
            optimizedAt: new Date().toISOString()
        };
    }

    function bulkOptimizePrices(targetMargin = 65) {
        if (typeof CostingModule === 'undefined') return [];

        const allCosts = Object.values(CostingModule.exportRecipeCosts());
        const optimized = [];

        allCosts.forEach(costData => {
            const pricing = calculatePrice(costData.recipeId, PRICING_STRATEGIES.TARGET_MARGIN, {
                targetMargin: targetMargin
            });

            if (pricing) {
                optimized.push(pricing);
            }
        });

        return optimized;
    }

    // ============================================================================
    // PRICING ANALYTICS
    // ============================================================================

    function getPricingStats() {
        const allPrices = Object.values(pricingData);
        
        if (allPrices.length === 0) {
            return {
                totalPriced: 0,
                avgMargin: 0,
                avgFoodCost: 0,
                highMarginItems: 0,
                lowMarginItems: 0
            };
        }

        const avgMargin = allPrices.reduce((sum, p) => sum + p.marginPercentage, 0) / allPrices.length;
        const avgFoodCost = allPrices.reduce((sum, p) => sum + p.foodCostPercentage, 0) / allPrices.length;
        const highMarginItems = allPrices.filter(p => p.marginPercentage >= 65).length;
        const lowMarginItems = allPrices.filter(p => p.marginPercentage < 50).length;

        return {
            totalPriced: allPrices.length,
            avgMargin: avgMargin,
            avgFoodCost: avgFoodCost,
            highMarginItems: highMarginItems,
            lowMarginItems: lowMarginItems,
            avgPrice: allPrices.reduce((sum, p) => sum + p.price, 0) / allPrices.length
        };
    }

    function getHighMarginItems(threshold = 70) {
        return Object.values(pricingData)
            .filter(p => p.marginPercentage >= threshold)
            .sort((a, b) => b.marginPercentage - a.marginPercentage);
    }

    function getLowMarginItems(threshold = 50) {
        return Object.values(pricingData)
            .filter(p => p.marginPercentage < threshold)
            .sort((a, b) => a.marginPercentage - b.marginPercentage);
    }

    // ============================================================================
    // ACHIEVEMENT SYSTEM HOOKS
    // ============================================================================

    function checkAchievement(type) {
        if (typeof AchievementSystem === 'undefined') return;

        switch(type) {
            case 'perfectionist':
                // Check if user has items with 99%+ margin targets
                const perfectItems = Object.values(pricingData).filter(p => p.marginPercentage >= 99);
                if (perfectItems.length >= 1) {
                    AchievementSystem.unlock('perfectionist');
                }
                break;
        }
    }

    // ============================================================================
    // UI RENDERING
    // ============================================================================

    function renderPricingView() {
        const container = document.getElementById('pricing-container');
        if (!container) return;

        const stats = getPricingStats();

        const html = `
            <div class="pricing-header">
                <div>
                    <h2 data-en="Menu Pricing" data-ja="メニュー価格設定">Menu Pricing</h2>
                    <div class="pricing-stats-row">
                        <span class="stat">${stats.totalPriced} items priced</span>
                        <span class="stat stat-margin">${stats.avgMargin.toFixed(1)}% avg margin</span>
                        <span class="stat stat-food-cost">${stats.avgFoodCost.toFixed(1)}% avg food cost</span>
                    </div>
                </div>
                <button class="btn-primary" id="optimize-all-prices">Optimize All Prices</button>
            </div>

            <div class="pricing-tabs">
                <button class="tab-btn active" data-tab="pricing">Price List</button>
                <button class="tab-btn" data-tab="calculator">Price Calculator</button>
                <button class="tab-btn" data-tab="insights">Insights</button>
            </div>

            <div class="tab-content" id="pricing-tab">
                ${renderPricingTable()}
            </div>

            <div class="tab-content" id="calculator-tab" style="display: none;">
                ${renderPriceCalculator()}
            </div>

            <div class="tab-content" id="insights-tab" style="display: none;">
                ${renderPricingInsights()}
            </div>
        `;

        container.innerHTML = html;
    }

    function renderPricingTable() {
        const prices = Object.values(pricingData);

        if (prices.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🏷️</div>
                    <h3>No Prices Set Yet</h3>
                    <p>Set menu prices to track margins and profitability</p>
                </div>
            `;
        }

        return `
            <table class="pricing-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Cost</th>
                        <th>Price</th>
                        <th>Margin</th>
                        <th>Margin %</th>
                        <th>Food Cost %</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${prices.map(item => {
                        const marginClass = item.marginPercentage >= 65 ? 'good' : 
                                          item.marginPercentage >= 50 ? 'okay' : 'low';
                        
                        return `
                            <tr>
                                <td><strong>${item.recipeName}</strong></td>
                                <td>$${item.cost.toFixed(2)}</td>
                                <td><strong>$${item.price.toFixed(2)}</strong></td>
                                <td>$${item.margin.toFixed(2)}</td>
                                <td class="margin-${marginClass}">${item.marginPercentage.toFixed(1)}%</td>
                                <td>${item.foodCostPercentage.toFixed(1)}%</td>
                                <td>
                                    ${item.foodCostPercentage > 35 ? '⚠️ High' : 
                                      item.foodCostPercentage < 28 ? '💡 Low' : '✅ Good'}
                                </td>
                                <td>
                                    <button class="btn-sm btn-secondary optimize-price" data-recipe-id="${item.recipeId}">
                                        Optimize
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    function renderPriceCalculator() {
        return `
            <div class="price-calculator">
                <h3>Price Calculator</h3>
                <p>Calculate optimal price using different strategies</p>
                <div class="calculator-form">
                    <select id="calc-recipe">
                        <option value="">Select a recipe...</option>
                    </select>
                    <select id="calc-strategy">
                        <option value="cost_plus">Cost Plus (Markup %)</option>
                        <option value="target_margin">Target Margin %</option>
                        <option value="value_based">Value Based (Tier)</option>
                        <option value="psychological">Psychological Pricing</option>
                    </select>
                    <button class="btn-primary" id="calculate-price-btn">Calculate</button>
                </div>
                <div id="calc-result" class="calc-result"></div>
            </div>
        `;
    }

    function renderPricingInsights() {
        const highMargin = getHighMarginItems(70);
        const lowMargin = getLowMarginItems(50);

        return `
            <div class="insights-grid">
                <div class="insight-card">
                    <h3>🌟 Best Performers (70%+ margin)</h3>
                    <div class="insight-list">
                        ${highMargin.slice(0, 5).map(item => `
                            <div class="insight-item">
                                <span class="insight-name">${item.recipeName}</span>
                                <span class="insight-value good">${item.marginPercentage.toFixed(1)}%</span>
                            </div>
                        `).join('') || '<p>No high-margin items yet</p>'}
                    </div>
                </div>

                <div class="insight-card">
                    <h3>⚠️ Needs Attention (&lt;50% margin)</h3>
                    <div class="insight-list">
                        ${lowMargin.slice(0, 5).map(item => `
                            <div class="insight-item">
                                <span class="insight-name">${item.recipeName}</span>
                                <span class="insight-value low">${item.marginPercentage.toFixed(1)}%</span>
                            </div>
                        `).join('') || '<p>All items have good margins!</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        init,
        calculatePrice,
        setPrice,
        updatePrice,
        getPrice,
        deletePrice,
        optimizePrice,
        bulkOptimizePrices,
        getPricingStats,
        getHighMarginItems,
        getLowMarginItems,
        renderPricingView,
        PRICING_STRATEGIES,
        PRICING_TIERS
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', PricingModule.init);
} else {
    PricingModule.init();
}
