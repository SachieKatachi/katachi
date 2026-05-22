// ============================================================================
// KATACHI - INVENTORY MODULE
// Track stock levels, manage ingredients, and monitor inventory in real-time
// ============================================================================

const InventoryModule = (() => {
    const STORAGE_KEY = 'k_inventory';
    let inventoryItems = [];
    let currentItemId = null;

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        loadInventory();
        renderInventoryView();
        attachEventListeners();
        console.log('✅ Inventory module initialized');
    }

    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================

    function loadInventory() {
        const stored = localStorage.getItem(STORAGE_KEY);
        inventoryItems = stored ? JSON.parse(stored) : [];
    }

    function saveInventory() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inventoryItems));
    }

    function generateId() {
        return 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ============================================================================
    // INVENTORY ITEM CRUD
    // ============================================================================

    function createItem(data) {
        const newItem = {
            id: generateId(),
            name: data.name,
            category: data.category || 'Other',
            unit: data.unit || 'unit',
            currentStock: parseFloat(data.currentStock) || 0,
            parLevel: parseFloat(data.parLevel) || 0,
            reorderPoint: parseFloat(data.reorderPoint) || 0,
            unitCost: parseFloat(data.unitCost) || 0,
            supplier: data.supplier || null,
            location: data.location || 'General Storage',
            sku: data.sku || null,
            notes: data.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastRestocked: null,
            linkedRecipes: [] // Array of recipe IDs that use this ingredient
        };

        inventoryItems.unshift(newItem);
        saveInventory();

        // Achievement check: First inventory item
        if (inventoryItems.length === 1) {
            checkAchievement('first_inventory');
        }

        return newItem;
    }

    function updateItem(itemId, updates) {
        const item = inventoryItems.find(i => i.id === itemId);
        if (!item) return null;

        Object.assign(item, updates, {
            updatedAt: new Date().toISOString()
        });

        saveInventory();
        return item;
    }

    function deleteItem(itemId) {
        const index = inventoryItems.findIndex(i => i.id === itemId);
        if (index === -1) return false;

        inventoryItems.splice(index, 1);
        saveInventory();
        return true;
    }

    function getItem(itemId) {
        return inventoryItems.find(i => i.id === itemId);
    }

    // ============================================================================
    // STOCK MANAGEMENT
    // ============================================================================

    function adjustStock(itemId, quantity, type = 'manual', note = '') {
        const item = getItem(itemId);
        if (!item) return null;

        const oldStock = item.currentStock;
        item.currentStock = parseFloat(item.currentStock) + parseFloat(quantity);
        
        // Prevent negative stock
        if (item.currentStock < 0) {
            item.currentStock = 0;
        }

        item.updatedAt = new Date().toISOString();

        // Record stock movement
        if (!item.stockHistory) {
            item.stockHistory = [];
        }

        item.stockHistory.push({
            date: new Date().toISOString(),
            oldStock,
            newStock: item.currentStock,
            change: quantity,
            type, // 'manual', 'restock', 'usage', 'adjustment'
            note
        });

        // If restocking, update lastRestocked
        if (quantity > 0 && type === 'restock') {
            item.lastRestocked = new Date().toISOString();
        }

        saveInventory();
        return item;
    }

    function restockItem(itemId, quantity, note = '') {
        return adjustStock(itemId, quantity, 'restock', note || 'Restocked from supplier');
    }

    function useIngredient(itemId, quantity, note = '') {
        return adjustStock(itemId, -quantity, 'usage', note || 'Used in recipe');
    }

    function setStock(itemId, newQuantity, note = '') {
        const item = getItem(itemId);
        if (!item) return null;

        const change = newQuantity - item.currentStock;
        return adjustStock(itemId, change, 'adjustment', note || 'Stock count adjustment');
    }

    // ============================================================================
    // RECIPE INTEGRATION
    // ============================================================================

    function linkRecipe(itemId, recipeId) {
        const item = getItem(itemId);
        if (!item) return false;

        if (!item.linkedRecipes.includes(recipeId)) {
            item.linkedRecipes.push(recipeId);
            saveInventory();

            // Achievement check: Connected
            checkAchievement('connected');
            return true;
        }

        return false;
    }

    function unlinkRecipe(itemId, recipeId) {
        const item = getItem(itemId);
        if (!item) return false;

        const index = item.linkedRecipes.indexOf(recipeId);
        if (index > -1) {
            item.linkedRecipes.splice(index, 1);
            saveInventory();
            return true;
        }

        return false;
    }

    function getLinkedRecipes(itemId) {
        const item = getItem(itemId);
        if (!item) return [];

        // This would fetch actual recipe data from RecipesModule
        if (typeof RecipesModule !== 'undefined') {
            return item.linkedRecipes.map(recipeId => RecipesModule.getRecipe(recipeId)).filter(Boolean);
        }

        return item.linkedRecipes;
    }

    // ============================================================================
    // STOCK ALERTS & MONITORING
    // ============================================================================

    function getStockStatus(item) {
        const stockPercentage = item.parLevel > 0 ? (item.currentStock / item.parLevel) * 100 : 100;

        if (item.currentStock === 0) {
            return 'out_of_stock';
        } else if (item.currentStock <= item.reorderPoint) {
            return 'reorder_now';
        } else if (stockPercentage < 50) {
            return 'low_stock';
        } else if (stockPercentage >= 100) {
            return 'fully_stocked';
        } else {
            return 'adequate';
        }
    }

    function getLowStockItems() {
        return inventoryItems.filter(item => {
            const status = getStockStatus(item);
            return status === 'reorder_now' || status === 'low_stock' || status === 'out_of_stock';
        });
    }

    function getOutOfStockItems() {
        return inventoryItems.filter(item => getStockStatus(item) === 'out_of_stock');
    }

    function getReorderList() {
        return inventoryItems.filter(item => item.currentStock <= item.reorderPoint);
    }

    // ============================================================================
    // FILTERING & ANALYTICS
    // ============================================================================

    function filterByCategory(category) {
        return inventoryItems.filter(i => i.category === category);
    }

    function filterByLocation(location) {
        return inventoryItems.filter(i => i.location === location);
    }

    function filterBySupplier(supplier) {
        return inventoryItems.filter(i => i.supplier === supplier);
    }

    function getCategories() {
        return [...new Set(inventoryItems.map(i => i.category))];
    }

    function getLocations() {
        return [...new Set(inventoryItems.map(i => i.location))];
    }

    function getSuppliers() {
        return [...new Set(inventoryItems.map(i => i.supplier).filter(Boolean))];
    }

    function getTotalInventoryValue() {
        return inventoryItems.reduce((sum, item) => {
            return sum + (item.currentStock * item.unitCost);
        }, 0);
    }

    function getInventoryStats() {
        const total = inventoryItems.length;
        const lowStock = getLowStockItems().length;
        const outOfStock = getOutOfStockItems().length;
        const fullyStocked = inventoryItems.filter(i => getStockStatus(i) === 'fully_stocked').length;
        const totalValue = getTotalInventoryValue();

        return {
            total,
            lowStock,
            outOfStock,
            fullyStocked,
            adequate: total - lowStock - outOfStock - fullyStocked,
            totalValue,
            categories: getCategories().length,
            suppliers: getSuppliers().length
        };
    }

    // ============================================================================
    // ACHIEVEMENT SYSTEM HOOKS
    // ============================================================================

    function checkAchievement(type) {
        if (typeof AchievementSystem === 'undefined') return;

        switch(type) {
            case 'first_inventory':
                AchievementSystem.unlock('inventory_started');
                break;
            case 'connected':
                // Check if any item has linked recipes
                const hasLinks = inventoryItems.some(item => item.linkedRecipes.length > 0);
                if (hasLinks) {
                    AchievementSystem.unlock('connected');
                }
                break;
        }
    }

    // ============================================================================
    // UI RENDERING
    // ============================================================================

    function renderInventoryView() {
        const container = document.getElementById('inventory-container');
        if (!container) return;

        if (inventoryItems.length === 0) {
            container.innerHTML = renderEmptyState();
            return;
        }

        const stats = getInventoryStats();

        const html = `
            <div class="inventory-header">
                <div>
                    <h2 data-en="Inventory" data-ja="在庫">Inventory</h2>
                    <div class="inventory-stats-row">
                        <span class="stat">${stats.total} items</span>
                        <span class="stat stat-value">$${stats.totalValue.toFixed(2)} total value</span>
                        ${stats.lowStock > 0 ? `<span class="stat stat-alert">${stats.lowStock} low stock</span>` : ''}
                    </div>
                </div>
                <button class="btn-primary" id="add-inventory-btn">
                    <span data-en="+ Add Item" data-ja="+ アイテム追加">+ Add Item</span>
                </button>
            </div>

            <div class="inventory-filters">
                <select id="filter-category">
                    <option value="">All Categories</option>
                    ${getCategories().map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
                <select id="filter-location">
                    <option value="">All Locations</option>
                    ${getLocations().map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                </select>
                <select id="filter-status">
                    <option value="">All Status</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="reorder_now">Reorder Now</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="adequate">Adequate</option>
                    <option value="fully_stocked">Fully Stocked</option>
                </select>
                <input type="text" id="search-inventory" placeholder="Search items..." class="search-input">
            </div>

            <div class="inventory-table-container">
                ${renderInventoryTable()}
            </div>
        `;

        container.innerHTML = html;
    }

    function renderInventoryTable() {
        return `
            <table class="inventory-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Par Level</th>
                        <th>Status</th>
                        <th>Unit Cost</th>
                        <th>Total Value</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventoryItems.map(item => renderInventoryRow(item)).join('')}
                </tbody>
            </table>
        `;
    }

    function renderInventoryRow(item) {
        const status = getStockStatus(item);
        const statusClass = `status-${status}`;
        const statusIcons = {
            out_of_stock: '🔴',
            reorder_now: '🟠',
            low_stock: '🟡',
            adequate: '🟢',
            fully_stocked: '✅'
        };
        const totalValue = item.currentStock * item.unitCost;

        return `
            <tr class="inventory-row ${statusClass}" data-item-id="${item.id}">
                <td>
                    <div class="item-name-cell">
                        <strong>${item.name}</strong>
                        ${item.linkedRecipes.length > 0 ? `<span class="linked-badge" title="${item.linkedRecipes.length} linked recipes">🔗</span>` : ''}
                    </div>
                    ${item.sku ? `<div class="item-sku">SKU: ${item.sku}</div>` : ''}
                </td>
                <td><span class="category-badge">${item.category}</span></td>
                <td>
                    <strong>${item.currentStock}</strong> ${item.unit}
                </td>
                <td>${item.parLevel} ${item.unit}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusIcons[status]} ${status.replace(/_/g, ' ')}
                    </span>
                </td>
                <td>$${item.unitCost.toFixed(2)}/${item.unit}</td>
                <td><strong>$${totalValue.toFixed(2)}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon adjust-stock" data-item-id="${item.id}" title="Adjust Stock">⚖️</button>
                        <button class="btn-icon edit-item" data-item-id="${item.id}" title="Edit">✏️</button>
                        <button class="btn-icon delete-item" data-item-id="${item.id}" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }

    function renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3 data-en="No Inventory Items Yet" data-ja="在庫アイテムがありません">No Inventory Items Yet</h3>
                <p data-en="Start tracking your ingredients and stock levels" 
                   data-ja="材料と在庫レベルの追跡を開始します">
                    Start tracking your ingredients and stock levels
                </p>
                <button class="btn-primary" id="add-first-item">
                    <span data-en="Add First Item" data-ja="最初のアイテムを追加">Add First Item</span>
                </button>
            </div>
        `;
    }

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================

    function attachEventListeners() {
        const container = document.getElementById('inventory-container');
        if (!container) return;

        container.addEventListener('click', (e) => {
            // Add item
            if (e.target.closest('#add-inventory-btn') || e.target.closest('#add-first-item')) {
                showAddItemModal();
            }

            // Adjust stock
            if (e.target.closest('.adjust-stock')) {
                const itemId = e.target.closest('.adjust-stock').dataset.itemId;
                showAdjustStockModal(itemId);
            }

            // Edit item
            if (e.target.closest('.edit-item')) {
                const itemId = e.target.closest('.edit-item').dataset.itemId;
                showEditItemModal(itemId);
            }

            // Delete item
            if (e.target.closest('.delete-item')) {
                const itemId = e.target.closest('.delete-item').dataset.itemId;
                const item = getItem(itemId);
                if (confirm(`Delete ${item.name} from inventory?`)) {
                    deleteItem(itemId);
                    renderInventoryView();
                }
            }
        });

        // Filters & Search
        const categoryFilter = document.getElementById('filter-category');
        const locationFilter = document.getElementById('filter-location');
        const statusFilter = document.getElementById('filter-status');
        const searchInput = document.getElementById('search-inventory');

        if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
        if (locationFilter) locationFilter.addEventListener('change', applyFilters);
        if (statusFilter) statusFilter.addEventListener('change', applyFilters);
        if (searchInput) searchInput.addEventListener('input', applyFilters);
    }

    function applyFilters() {
        // Filter logic would go here
        // For now, this is a placeholder
        console.log('Filters applied');
    }

    // ============================================================================
    // MODALS (PLACEHOLDER)
    // ============================================================================

    function showAddItemModal() {
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'add-inventory-item' }}));
    }

    function showEditItemModal(itemId) {
        currentItemId = itemId;
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'edit-inventory-item', itemId }}));
    }

    function showAdjustStockModal(itemId) {
        currentItemId = itemId;
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'adjust-stock', itemId }}));
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        init,
        createItem,
        updateItem,
        deleteItem,
        getItem,
        adjustStock,
        restockItem,
        useIngredient,
        setStock,
        linkRecipe,
        unlinkRecipe,
        getLinkedRecipes,
        getStockStatus,
        getLowStockItems,
        getOutOfStockItems,
        getReorderList,
        filterByCategory,
        filterByLocation,
        getTotalInventoryValue,
        getInventoryStats,
        getAllItems: () => inventoryItems
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', InventoryModule.init);
} else {
    InventoryModule.init();
}
