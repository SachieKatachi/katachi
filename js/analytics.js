// ============================================================================
// KATACHI - ANALYTICS MODULE
// Dashboard, insights, reports, and business intelligence
// ============================================================================

const AnalyticsModule = (() => {
    const STORAGE_KEY = 'k_analytics_cache';
    let cachedAnalytics = {};

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        loadCache();
        console.log('✅ Analytics module initialized');
        
        // Achievement check: Insight Seeker
        checkAchievement('insight_seeker');
    }

    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================

    function loadCache() {
        const stored = localStorage.getItem(STORAGE_KEY);
        cachedAnalytics = stored ? JSON.parse(stored) : {};
    }

    function saveCache() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedAnalytics));
    }

    function cacheResult(key, data, ttl = 3600000) { // 1 hour default TTL
        cachedAnalytics[key] = {
            data: data,
            timestamp: Date.now(),
            ttl: ttl
        };
        saveCache();
    }

    function getCached(key) {
        const cached = cachedAnalytics[key];
        if (!cached) return null;

        const age = Date.now() - cached.timestamp;
        if (age > cached.ttl) {
            delete cachedAnalytics[key];
            saveCache();
            return null;
        }

        return cached.data;
    }

    // ============================================================================
    // CORE ANALYTICS
    // ============================================================================

    function getOverviewStats(period = 'today') {
        const cacheKey = `overview_${period}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const stats = {
            period: period,
            orders: getOrdersStats(period),
            revenue: getRevenueStats(period),
            inventory: getInventoryStats(),
            team: getTeamStats(),
            pricing: getPricingOverview(),
            timestamp: new Date().toISOString()
        };

        cacheResult(cacheKey, stats);
        return stats;
    }

    function getOrdersStats(period = 'today') {
        if (typeof OrdersModule === 'undefined') {
            return { total: 0, revenue: 0, avgValue: 0 };
        }

        const orderStats = OrdersModule.getOrderStats(period);
        return {
            total: orderStats.total,
            completed: orderStats.completed,
            pending: orderStats.pending,
            revenue: orderStats.revenue,
            avgOrderValue: orderStats.avgOrderValue
        };
    }

    function getRevenueStats(period = 'today') {
        if (typeof OrdersModule === 'undefined') {
            return { total: 0, trend: 0 };
        }

        const stats = OrdersModule.getOrderStats(period);
        // Calculate trend (simplified - would compare to previous period)
        const trend = 0; // Placeholder

        return {
            total: stats.revenue,
            completed: stats.completed,
            avgOrderValue: stats.avgOrderValue,
            trend: trend
        };
    }

    function getInventoryStats() {
        if (typeof InventoryModule === 'undefined') {
            return { total: 0, value: 0, lowStock: 0 };
        }

        const invStats = InventoryModule.getInventoryStats();
        return {
            totalItems: invStats.total,
            totalValue: invStats.totalValue,
            lowStock: invStats.lowStock,
            outOfStock: invStats.outOfStock
        };
    }

    function getTeamStats() {
        if (typeof TeamModule === 'undefined') {
            return { total: 0, active: 0 };
        }

        const teamStats = TeamModule.getTeamStats();
        return {
            total: teamStats.total,
            active: teamStats.active,
            inactive: teamStats.inactive
        };
    }

    function getPricingOverview() {
        if (typeof PricingModule === 'undefined') {
            return { avgMargin: 0, avgFoodCost: 0 };
        }

        const pricingStats = PricingModule.getPricingStats();
        return {
            itemsPriced: pricingStats.totalPriced,
            avgMargin: pricingStats.avgMargin,
            avgFoodCost: pricingStats.avgFoodCost,
            highMarginItems: pricingStats.highMarginItems
        };
    }

    // ============================================================================
    // TRENDS & TIME SERIES
    // ============================================================================

    function getRevenueTrend(days = 7) {
        // This would pull order data over time
        // Simplified implementation - would need actual historical data
        return {
            labels: getLast7Days(),
            data: [0, 0, 0, 0, 0, 0, 0], // Placeholder
            total: 0
        };
    }

    function getOrdersTrend(days = 7) {
        return {
            labels: getLast7Days(),
            data: [0, 0, 0, 0, 0, 0, 0], // Placeholder
            total: 0
        };
    }

    function getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        return days;
    }

    // ============================================================================
    // TOP PERFORMERS
    // ============================================================================

    function getTopRecipesByRevenue(limit = 10) {
        // Would need order history with recipe data
        return [];
    }

    function getTopRecipesByQuantity(limit = 10) {
        // Would need order history
        return [];
    }

    function getTopExpensiveIngredients(limit = 10) {
        if (typeof CostingModule === 'undefined') return [];
        return CostingModule.getTopExpensiveIngredients(limit);
    }

    function getTopExpensiveRecipes(limit = 10) {
        if (typeof CostingModule === 'undefined') return [];
        return CostingModule.getTopExpensiveRecipes(limit);
    }

    function getHighMarginItems(limit = 10) {
        if (typeof PricingModule === 'undefined') return [];
        return PricingModule.getHighMarginItems(70).slice(0, limit);
    }

    function getLowMarginItems(limit = 10) {
        if (typeof PricingModule === 'undefined') return [];
        return PricingModule.getLowMarginItems(50).slice(0, limit);
    }

    // ============================================================================
    // COMPLIANCE & OPERATIONS
    // ============================================================================

    function getComplianceScore() {
        let totalScore = 0;
        let categoryCount = 0;

        // Standards compliance
        if (typeof StandardsModule !== 'undefined') {
            const reviewStats = StandardsModule.getReviewStats();
            totalScore += reviewStats.compliance || 0;
            categoryCount++;
        }

        // Inventory compliance (stock levels)
        if (typeof InventoryModule !== 'undefined') {
            const invStats = InventoryModule.getInventoryStats();
            const stockScore = invStats.total > 0 
                ? ((invStats.total - invStats.outOfStock) / invStats.total) * 100 
                : 100;
            totalScore += stockScore;
            categoryCount++;
        }

        // Costing accuracy
        if (typeof CostingModule !== 'undefined') {
            const costStats = CostingModule.getCostingStats();
            totalScore += costStats.avgAccuracy || 0;
            categoryCount++;
        }

        return categoryCount > 0 ? Math.round(totalScore / categoryCount) : 0;
    }

    function getOperationalHealth() {
        const health = {
            overall: 0,
            categories: {}
        };

        // Inventory health
        if (typeof InventoryModule !== 'undefined') {
            const invStats = InventoryModule.getInventoryStats();
            const lowStockPercent = invStats.total > 0 ? (invStats.lowStock / invStats.total) * 100 : 0;
            health.categories.inventory = {
                score: Math.max(0, 100 - lowStockPercent * 2),
                status: lowStockPercent > 20 ? 'critical' : lowStockPercent > 10 ? 'warning' : 'good'
            };
        }

        // Pricing health
        if (typeof PricingModule !== 'undefined') {
            const pricingStats = PricingModule.getPricingStats();
            const healthyMargin = pricingStats.avgMargin >= 60 && pricingStats.avgMargin <= 75;
            health.categories.pricing = {
                score: healthyMargin ? 100 : 70,
                avgMargin: pricingStats.avgMargin,
                status: healthyMargin ? 'good' : 'warning'
            };
        }

        // Team coverage
        if (typeof TeamModule !== 'undefined') {
            const teamStats = TeamModule.getTeamStats();
            health.categories.team = {
                score: teamStats.active >= 3 ? 100 : 70,
                activeMembers: teamStats.active,
                status: teamStats.active >= 3 ? 'good' : 'warning'
            };
        }

        // Calculate overall
        const scores = Object.values(health.categories).map(c => c.score);
        health.overall = scores.length > 0 
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
            : 0;

        return health;
    }

    // ============================================================================
    // ALERTS & RECOMMENDATIONS
    // ============================================================================

    function getAlerts() {
        const alerts = [];

        // Inventory alerts
        if (typeof InventoryModule !== 'undefined') {
            const lowStock = InventoryModule.getLowStockItems();
            const outOfStock = InventoryModule.getOutOfStockItems();

            if (outOfStock.length > 0) {
                alerts.push({
                    type: 'critical',
                    category: 'inventory',
                    message: `${outOfStock.length} items out of stock`,
                    count: outOfStock.length,
                    priority: 1
                });
            }

            if (lowStock.length > 0) {
                alerts.push({
                    type: 'warning',
                    category: 'inventory',
                    message: `${lowStock.length} items low on stock`,
                    count: lowStock.length,
                    priority: 2
                });
            }
        }

        // Standards review alerts
        if (typeof StandardsModule !== 'undefined') {
            const needsReview = StandardsModule.needsReview();
            if (needsReview.length > 0) {
                alerts.push({
                    type: 'info',
                    category: 'standards',
                    message: `${needsReview.length} standards need review`,
                    count: needsReview.length,
                    priority: 3
                });
            }
        }

        // Pricing alerts
        if (typeof PricingModule !== 'undefined') {
            const lowMargin = PricingModule.getLowMarginItems(50);
            if (lowMargin.length > 0) {
                alerts.push({
                    type: 'warning',
                    category: 'pricing',
                    message: `${lowMargin.length} items with low margins (<50%)`,
                    count: lowMargin.length,
                    priority: 2
                });
            }
        }

        return alerts.sort((a, b) => a.priority - b.priority);
    }

    function getRecommendations() {
        const recommendations = [];

        // Check if modules need setup
        if (typeof CostingModule !== 'undefined') {
            const costStats = CostingModule.getCostingStats();
            if (costStats.totalIngredients === 0) {
                recommendations.push({
                    category: 'costing',
                    title: 'Set Up Ingredient Costs',
                    description: 'Import costs from inventory to enable recipe costing',
                    action: 'Import Now',
                    priority: 'high'
                });
            }
        }

        if (typeof TeamModule !== 'undefined') {
            const teamStats = TeamModule.getTeamStats();
            if (teamStats.total === 0) {
                recommendations.push({
                    category: 'team',
                    title: 'Add Your Team',
                    description: 'Add team members to assign tasks and track responsibilities',
                    action: 'Add Team',
                    priority: 'medium'
                });
            }
        }

        return recommendations;
    }

    // ============================================================================
    // ACHIEVEMENT SYSTEM HOOKS
    // ============================================================================

    function checkAchievement(type) {
        if (typeof AchievementSystem === 'undefined') return;

        switch(type) {
            case 'insight_seeker':
                // Unlock when user first views analytics
                AchievementSystem.unlock('insight_seeker');
                break;
        }
    }

    // ============================================================================
    // UI RENDERING
    // ============================================================================

    function renderAnalyticsView() {
        const container = document.getElementById('analytics-container');
        if (!container) return;

        const overview = getOverviewStats('today');
        const health = getOperationalHealth();
        const alerts = getAlerts();

        const html = `
            <div class="analytics-header">
                <h2 data-en="Analytics Dashboard" data-ja="分析ダッシュボード">Analytics Dashboard</h2>
                <div class="date-filter">
                    <select id="period-filter">
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
            </div>

            ${alerts.length > 0 ? renderAlerts(alerts) : ''}

            <div class="analytics-grid">
                ${renderMetricCard('Orders', overview.orders.total, '+12%', '📦')}
                ${renderMetricCard('Revenue', `$${overview.revenue.total.toFixed(2)}`, '+8%', '💰')}
                ${renderMetricCard('Avg Order', `$${overview.orders.avgOrderValue.toFixed(2)}`, '-3%', '🧾')}
                ${renderMetricCard('Health Score', `${health.overall}%`, health.overall >= 80 ? 'good' : 'warning', '🎯')}
            </div>

            <div class="analytics-sections">
                <div class="analytics-section">
                    <h3>Operational Health</h3>
                    ${renderHealthBars(health)}
                </div>

                <div class="analytics-section">
                    <h3>Top Performers</h3>
                    ${renderTopPerformers()}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function renderMetricCard(label, value, change, emoji) {
        const changeClass = change.startsWith('+') ? 'positive' : 'negative';
        
        return `
            <div class="metric-card">
                <div class="metric-icon">${emoji}</div>
                <div class="metric-content">
                    <div class="metric-label">${label}</div>
                    <div class="metric-value">${value}</div>
                    <div class="metric-change ${changeClass}">${change}</div>
                </div>
            </div>
        `;
    }

    function renderAlerts(alerts) {
        return `
            <div class="alerts-section">
                ${alerts.map(alert => `
                    <div class="alert alert-${alert.type}">
                        <span class="alert-icon">${alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                        <span class="alert-message">${alert.message}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderHealthBars(health) {
        return `
            <div class="health-bars">
                ${Object.entries(health.categories).map(([category, data]) => `
                    <div class="health-bar">
                        <div class="health-label">${category}</div>
                        <div class="health-progress">
                            <div class="health-fill status-${data.status}" style="width: ${data.score}%"></div>
                        </div>
                        <div class="health-score">${data.score}%</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderTopPerformers() {
        const highMargin = getHighMarginItems(5);
        
        if (highMargin.length === 0) {
            return '<p class="empty-message">No pricing data available yet</p>';
        }

        return `
            <div class="top-performers-list">
                ${highMargin.map(item => `
                    <div class="performer-item">
                        <span class="performer-name">${item.recipeName}</span>
                        <span class="performer-value good">${item.marginPercentage.toFixed(1)}% margin</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        init,
        getOverviewStats,
        getRevenueTrend,
        getOrdersTrend,
        getTopRecipesByRevenue,
        getTopExpensiveIngredients,
        getHighMarginItems,
        getLowMarginItems,
        getComplianceScore,
        getOperationalHealth,
        getAlerts,
        getRecommendations,
        renderAnalyticsView
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AnalyticsModule.init);
} else {
    AnalyticsModule.init();
}
