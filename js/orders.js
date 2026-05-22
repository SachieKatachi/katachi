// ============================================================================
// KATACHI - ORDERS MODULE
// Process customer orders, track fulfillment, and manage order workflow
// ============================================================================

const OrdersModule = (() => {
    const STORAGE_KEY = 'k_orders';
    let orders = [];
    let currentOrderId = null;

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        loadOrders();
        renderOrdersView();
        attachEventListeners();
        console.log('✅ Orders module initialized');
    }

    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================

    function loadOrders() {
        const stored = localStorage.getItem(STORAGE_KEY);
        orders = stored ? JSON.parse(stored) : [];
    }

    function saveOrders() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }

    function generateId() {
        return 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function generateOrderNumber() {
        const date = new Date();
        const prefix = date.getFullYear().toString().slice(-2) + 
                      String(date.getMonth() + 1).padStart(2, '0') + 
                      String(date.getDate()).padStart(2, '0');
        const sequence = String(orders.length + 1).padStart(4, '0');
        return `${prefix}-${sequence}`;
    }

    // ============================================================================
    // ORDER CRUD
    // ============================================================================

    function createOrder(data) {
        const newOrder = {
            id: generateId(),
            orderNumber: generateOrderNumber(),
            customerName: data.customerName || 'Walk-in',
            customerPhone: data.customerPhone || null,
            customerEmail: data.customerEmail || null,
            items: data.items || [], // Array of {recipeId, recipeName, quantity, price}
            subtotal: 0,
            tax: 0,
            total: 0,
            status: 'pending', // pending, preparing, ready, completed, cancelled
            orderType: data.orderType || 'dine-in', // dine-in, takeout, delivery
            tableNumber: data.tableNumber || null,
            notes: data.notes || '',
            specialRequests: data.specialRequests || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null,
            prepTime: data.prepTime || null, // estimated prep time in minutes
            assignedTo: data.assignedTo || null // staff member
        };

        // Calculate totals
        newOrder.subtotal = calculateSubtotal(newOrder.items);
        newOrder.tax = calculateTax(newOrder.subtotal, data.taxRate || 0.08);
        newOrder.total = newOrder.subtotal + newOrder.tax;

        orders.unshift(newOrder);
        saveOrders();

        // Check for inventory deductions
        deductInventoryForOrder(newOrder);

        return newOrder;
    }

    function updateOrder(orderId, updates) {
        const order = orders.find(o => o.id === orderId);
        if (!order) return null;

        // Recalculate totals if items changed
        if (updates.items) {
            updates.subtotal = calculateSubtotal(updates.items);
            updates.tax = calculateTax(updates.subtotal, 0.08);
            updates.total = updates.subtotal + updates.tax;
        }

        Object.assign(order, updates, {
            updatedAt: new Date().toISOString()
        });

        saveOrders();
        return order;
    }

    function updateOrderStatus(orderId, newStatus) {
        const order = orders.find(o => o.id === orderId);
        if (!order) return null;

        order.status = newStatus;
        order.updatedAt = new Date().toISOString();

        if (newStatus === 'completed') {
            order.completedAt = new Date().toISOString();
        }

        saveOrders();
        return order;
    }

    function deleteOrder(orderId) {
        const index = orders.findIndex(o => o.id === orderId);
        if (index === -1) return false;

        orders.splice(index, 1);
        saveOrders();
        return true;
    }

    function getOrder(orderId) {
        return orders.find(o => o.id === orderId);
    }

    // ============================================================================
    // ORDER ITEMS MANAGEMENT
    // ============================================================================

    function addItemToOrder(orderId, item) {
        const order = getOrder(orderId);
        if (!order) return null;

        order.items.push({
            id: generateId(),
            recipeId: item.recipeId || null,
            recipeName: item.recipeName,
            quantity: item.quantity || 1,
            price: item.price || 0,
            notes: item.notes || '',
            status: 'pending' // pending, preparing, ready
        });

        // Recalculate totals
        order.subtotal = calculateSubtotal(order.items);
        order.tax = calculateTax(order.subtotal, 0.08);
        order.total = order.subtotal + order.tax;

        saveOrders();
        return order;
    }

    function removeItemFromOrder(orderId, itemId) {
        const order = getOrder(orderId);
        if (!order) return null;

        const index = order.items.findIndex(i => i.id === itemId);
        if (index === -1) return null;

        order.items.splice(index, 1);

        // Recalculate totals
        order.subtotal = calculateSubtotal(order.items);
        order.tax = calculateTax(order.subtotal, 0.08);
        order.total = order.subtotal + order.tax;

        saveOrders();
        return order;
    }

    function updateOrderItem(orderId, itemId, updates) {
        const order = getOrder(orderId);
        if (!order) return null;

        const item = order.items.find(i => i.id === itemId);
        if (!item) return null;

        Object.assign(item, updates);

        // Recalculate totals
        order.subtotal = calculateSubtotal(order.items);
        order.tax = calculateTax(order.subtotal, 0.08);
        order.total = order.subtotal + order.tax;

        saveOrders();
        return order;
    }

    // ============================================================================
    // CALCULATIONS
    // ============================================================================

    function calculateSubtotal(items) {
        return items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
    }

    function calculateTax(subtotal, taxRate) {
        return subtotal * taxRate;
    }

    // ============================================================================
    // INVENTORY INTEGRATION
    // ============================================================================

    function deductInventoryForOrder(order) {
        if (typeof InventoryModule === 'undefined') {
            console.warn('InventoryModule not loaded');
            return;
        }

        order.items.forEach(item => {
            if (item.recipeId) {
                // This would fetch recipe ingredients and deduct from inventory
                // For now, this is a placeholder
                console.log(`Deducting inventory for recipe: ${item.recipeName}`);
            }
        });
    }

    // ============================================================================
    // FILTERING & STATS
    // ============================================================================

    function filterOrders(filters = {}) {
        let filtered = [...orders];

        if (filters.status) {
            filtered = filtered.filter(o => o.status === filters.status);
        }

        if (filters.orderType) {
            filtered = filtered.filter(o => o.orderType === filters.orderType);
        }

        if (filters.date) {
            const filterDate = new Date(filters.date).toDateString();
            filtered = filtered.filter(o => {
                const orderDate = new Date(o.createdAt).toDateString();
                return orderDate === filterDate;
            });
        }

        if (filters.assignedTo) {
            filtered = filtered.filter(o => o.assignedTo === filters.assignedTo);
        }

        return filtered;
    }

    function getOrdersByStatus(status) {
        return orders.filter(o => o.status === status);
    }

    function getTodaysOrders() {
        const today = new Date().toDateString();
        return orders.filter(o => {
            const orderDate = new Date(o.createdAt).toDateString();
            return orderDate === today;
        });
    }

    function getOrderStats(period = 'today') {
        let relevantOrders = [];

        if (period === 'today') {
            relevantOrders = getTodaysOrders();
        } else {
            relevantOrders = orders;
        }

        const total = relevantOrders.length;
        const pending = relevantOrders.filter(o => o.status === 'pending').length;
        const preparing = relevantOrders.filter(o => o.status === 'preparing').length;
        const ready = relevantOrders.filter(o => o.status === 'ready').length;
        const completed = relevantOrders.filter(o => o.status === 'completed').length;
        const cancelled = relevantOrders.filter(o => o.status === 'cancelled').length;

        const revenue = relevantOrders
            .filter(o => o.status === 'completed')
            .reduce((sum, o) => sum + o.total, 0);

        const avgOrderValue = completed > 0 ? revenue / completed : 0;

        return {
            total,
            pending,
            preparing,
            ready,
            completed,
            cancelled,
            revenue,
            avgOrderValue
        };
    }

    // ============================================================================
    // UI RENDERING
    // ============================================================================

    function renderOrdersView() {
        const container = document.getElementById('orders-container');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = renderEmptyState();
            return;
        }

        const stats = getOrderStats('today');

        const html = `
            <div class="orders-header">
                <div>
                    <h2 data-en="Orders" data-ja="注文">Orders</h2>
                    <div class="orders-stats-row">
                        <span class="stat">${stats.total} orders today</span>
                        <span class="stat stat-revenue">$${stats.revenue.toFixed(2)} revenue</span>
                        ${stats.pending > 0 ? `<span class="stat stat-alert">${stats.pending} pending</span>` : ''}
                    </div>
                </div>
                <button class="btn-primary" id="create-order-btn">
                    <span data-en="+ New Order" data-ja="+ 新しい注文">+ New Order</span>
                </button>
            </div>

            <div class="orders-filters">
                <select id="filter-status">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select id="filter-order-type">
                    <option value="">All Types</option>
                    <option value="dine-in">Dine-In</option>
                    <option value="takeout">Takeout</option>
                    <option value="delivery">Delivery</option>
                </select>
                <input type="date" id="filter-date" placeholder="Filter by date">
            </div>

            <div class="orders-grid">
                ${orders.slice(0, 50).map(order => renderOrderCard(order)).join('')}
            </div>
        `;

        container.innerHTML = html;
    }

    function renderOrderCard(order) {
        const statusClass = `status-${order.status}`;
        const statusEmoji = {
            pending: '⏳',
            preparing: '👨‍🍳',
            ready: '✅',
            completed: '🎉',
            cancelled: '❌'
        };

        const typeEmoji = {
            'dine-in': '🍽️',
            'takeout': '🥡',
            'delivery': '🚚'
        };

        return `
            <div class="order-card ${statusClass}" data-order-id="${order.id}">
                <div class="order-card-header">
                    <div class="order-number">
                        <strong>#${order.orderNumber}</strong>
                        <span class="order-type">${typeEmoji[order.orderType]} ${order.orderType}</span>
                    </div>
                    <div class="order-status-badge ${statusClass}">
                        ${statusEmoji[order.status]} ${order.status}
                    </div>
                </div>

                <div class="order-customer">
                    <strong>${order.customerName}</strong>
                    ${order.tableNumber ? `<span class="table-badge">Table ${order.tableNumber}</span>` : ''}
                </div>

                <div class="order-items-preview">
                    ${order.items.slice(0, 3).map(item => `
                        <div class="item-preview">
                            <span class="item-qty">${item.quantity}x</span> ${item.recipeName}
                        </div>
                    `).join('')}
                    ${order.items.length > 3 ? `<div class="more-items">+${order.items.length - 3} more items</div>` : ''}
                </div>

                ${order.specialRequests ? `
                    <div class="order-special-requests">
                        ⚠️ ${order.specialRequests}
                    </div>
                ` : ''}

                <div class="order-footer">
                    <div class="order-total">
                        <strong>$${order.total.toFixed(2)}</strong>
                    </div>
                    <div class="order-time">
                        ${formatOrderTime(order.createdAt)}
                    </div>
                </div>

                <div class="order-actions">
                    ${order.status === 'pending' ? `
                        <button class="btn-secondary btn-sm start-prep" data-order-id="${order.id}">Start Prep</button>
                    ` : ''}
                    ${order.status === 'preparing' ? `
                        <button class="btn-primary btn-sm mark-ready" data-order-id="${order.id}">Mark Ready</button>
                    ` : ''}
                    ${order.status === 'ready' ? `
                        <button class="btn-primary btn-sm complete-order" data-order-id="${order.id}">Complete</button>
                    ` : ''}
                    <button class="btn-secondary btn-sm view-order" data-order-id="${order.id}">View Details</button>
                </div>
            </div>
        `;
    }

    function renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📲</div>
                <h3 data-en="No Orders Yet" data-ja="注文がありません">No Orders Yet</h3>
                <p data-en="Start processing customer orders" 
                   data-ja="お客様の注文処理を開始します">
                    Start processing customer orders
                </p>
                <button class="btn-primary" id="create-first-order">
                    <span data-en="Create First Order" data-ja="最初の注文を作成">Create First Order</span>
                </button>
            </div>
        `;
    }

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================

    function attachEventListeners() {
        const container = document.getElementById('orders-container');
        if (!container) return;

        container.addEventListener('click', (e) => {
            // Create order
            if (e.target.closest('#create-order-btn') || e.target.closest('#create-first-order')) {
                showCreateOrderModal();
            }

            // Start prep
            if (e.target.closest('.start-prep')) {
                const orderId = e.target.closest('.start-prep').dataset.orderId;
                updateOrderStatus(orderId, 'preparing');
                renderOrdersView();
            }

            // Mark ready
            if (e.target.closest('.mark-ready')) {
                const orderId = e.target.closest('.mark-ready').dataset.orderId;
                updateOrderStatus(orderId, 'ready');
                renderOrdersView();
            }

            // Complete order
            if (e.target.closest('.complete-order')) {
                const orderId = e.target.closest('.complete-order').dataset.orderId;
                updateOrderStatus(orderId, 'completed');
                renderOrdersView();
            }

            // View details
            if (e.target.closest('.view-order')) {
                const orderId = e.target.closest('.view-order').dataset.orderId;
                showOrderDetailModal(orderId);
            }
        });

        // Filters
        const statusFilter = document.getElementById('filter-status');
        const typeFilter = document.getElementById('filter-order-type');
        const dateFilter = document.getElementById('filter-date');

        if (statusFilter) statusFilter.addEventListener('change', applyFilters);
        if (typeFilter) typeFilter.addEventListener('change', applyFilters);
        if (dateFilter) dateFilter.addEventListener('change', applyFilters);
    }

    function applyFilters() {
        // Placeholder for filter logic
        console.log('Filters applied');
    }

    // ============================================================================
    // MODALS (PLACEHOLDER)
    // ============================================================================

    function showCreateOrderModal() {
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'create-order' }}));
    }

    function showOrderDetailModal(orderId) {
        currentOrderId = orderId;
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'order-detail', orderId }}));
    }

    // ============================================================================
    // UTILITIES
    // ============================================================================

    function formatOrderTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        init,
        createOrder,
        updateOrder,
        updateOrderStatus,
        deleteOrder,
        getOrder,
        addItemToOrder,
        removeItemFromOrder,
        updateOrderItem,
        filterOrders,
        getOrdersByStatus,
        getTodaysOrders,
        getOrderStats,
        getAllOrders: () => orders
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', OrdersModule.init);
} else {
    OrdersModule.init();
}
