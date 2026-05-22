// ============================================================================
// KATACHI - VENDORS MODULE
// Manage suppliers, track purchase orders, and maintain vendor relationships
// ============================================================================

const VendorsModule = (() => {
    const STORAGE_KEY = 'k_vendors';
    const PO_STORAGE_KEY = 'k_purchase_orders';
    let vendors = [];
    let purchaseOrders = [];
    let currentVendorId = null;

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        loadVendors();
        loadPurchaseOrders();
        renderVendorsView();
        attachEventListeners();
        console.log('✅ Vendors module initialized');
    }

    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================

    function loadVendors() {
        const stored = localStorage.getItem(STORAGE_KEY);
        vendors = stored ? JSON.parse(stored) : [];
    }

    function saveVendors() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vendors));
    }

    function loadPurchaseOrders() {
        const stored = localStorage.getItem(PO_STORAGE_KEY);
        purchaseOrders = stored ? JSON.parse(stored) : [];
    }

    function savePurchaseOrders() {
        localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(purchaseOrders));
    }

    function generateId() {
        return 'vnd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function generatePONumber() {
        const date = new Date();
        const prefix = 'PO' + date.getFullYear().toString().slice(-2) + 
                      String(date.getMonth() + 1).padStart(2, '0');
        const sequence = String(purchaseOrders.length + 1).padStart(4, '0');
        return `${prefix}-${sequence}`;
    }

    // ============================================================================
    // VENDOR CRUD
    // ============================================================================

    function createVendor(data) {
        const newVendor = {
            id: generateId(),
            name: data.name,
            contactPerson: data.contactPerson || null,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            category: data.category || 'General', // Produce, Meat, Seafood, Dry Goods, etc.
            paymentTerms: data.paymentTerms || 'Net 30',
            deliveryDays: data.deliveryDays || [], // Array of weekdays
            minimumOrder: parseFloat(data.minimumOrder) || 0,
            accountNumber: data.accountNumber || null,
            website: data.website || null,
            notes: data.notes || '',
            rating: parseFloat(data.rating) || 0, // 0-5 stars
            isActive: data.isActive !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastOrderDate: null,
            totalSpent: 0,
            orderCount: 0
        };

        vendors.unshift(newVendor);
        saveVendors();
        return newVendor;
    }

    function updateVendor(vendorId, updates) {
        const vendor = vendors.find(v => v.id === vendorId);
        if (!vendor) return null;

        Object.assign(vendor, updates, {
            updatedAt: new Date().toISOString()
        });

        saveVendors();
        return vendor;
    }

    function deleteVendor(vendorId) {
        const index = vendors.findIndex(v => v.id === vendorId);
        if (index === -1) return false;

        vendors.splice(index, 1);
        saveVendors();
        return true;
    }

    function getVendor(vendorId) {
        return vendors.find(v => v.id === vendorId);
    }

    function toggleVendorStatus(vendorId) {
        const vendor = getVendor(vendorId);
        if (!vendor) return null;

        vendor.isActive = !vendor.isActive;
        vendor.updatedAt = new Date().toISOString();
        saveVendors();
        return vendor;
    }

    // ============================================================================
    // PURCHASE ORDERS
    // ============================================================================

    function createPurchaseOrder(data) {
        const vendor = getVendor(data.vendorId);
        if (!vendor) return null;

        const newPO = {
            id: generateId(),
            poNumber: generatePONumber(),
            vendorId: data.vendorId,
            vendorName: vendor.name,
            items: data.items || [], // Array of {itemName, quantity, unit, unitPrice}
            subtotal: 0,
            tax: 0,
            shipping: parseFloat(data.shipping) || 0,
            total: 0,
            status: 'draft', // draft, sent, confirmed, received, cancelled
            orderDate: new Date().toISOString(),
            expectedDeliveryDate: data.expectedDeliveryDate || null,
            actualDeliveryDate: null,
            notes: data.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Calculate totals
        newPO.subtotal = calculatePOSubtotal(newPO.items);
        newPO.tax = calculatePOTax(newPO.subtotal, data.taxRate || 0);
        newPO.total = newPO.subtotal + newPO.tax + newPO.shipping;

        purchaseOrders.unshift(newPO);
        savePurchaseOrders();
        return newPO;
    }

    function updatePurchaseOrder(poId, updates) {
        const po = purchaseOrders.find(p => p.id === poId);
        if (!po) return null;

        // Recalculate totals if items changed
        if (updates.items) {
            updates.subtotal = calculatePOSubtotal(updates.items);
            updates.tax = calculatePOTax(updates.subtotal, 0);
            updates.total = updates.subtotal + updates.tax + (updates.shipping || po.shipping);
        }

        Object.assign(po, updates, {
            updatedAt: new Date().toISOString()
        });

        savePurchaseOrders();
        return po;
    }

    function updatePOStatus(poId, newStatus) {
        const po = purchaseOrders.find(p => p.id === poId);
        if (!po) return null;

        po.status = newStatus;
        po.updatedAt = new Date().toISOString();

        // Update vendor stats when PO is received
        if (newStatus === 'received') {
            po.actualDeliveryDate = new Date().toISOString();
            updateVendorStats(po.vendorId, po.total);
            
            // Update inventory if items have inventory IDs
            updateInventoryFromPO(po);
        }

        savePurchaseOrders();
        return po;
    }

    function deletePurchaseOrder(poId) {
        const index = purchaseOrders.findIndex(p => p.id === poId);
        if (index === -1) return false;

        purchaseOrders.splice(index, 1);
        savePurchaseOrders();
        return true;
    }

    function getPurchaseOrder(poId) {
        return purchaseOrders.find(p => p.id === poId);
    }

    // ============================================================================
    // CALCULATIONS
    // ============================================================================

    function calculatePOSubtotal(items) {
        return items.reduce((sum, item) => {
            return sum + (item.unitPrice * item.quantity);
        }, 0);
    }

    function calculatePOTax(subtotal, taxRate) {
        return subtotal * taxRate;
    }

    // ============================================================================
    // VENDOR STATS
    // ============================================================================

    function updateVendorStats(vendorId, amount) {
        const vendor = getVendor(vendorId);
        if (!vendor) return;

        vendor.totalSpent += amount;
        vendor.orderCount += 1;
        vendor.lastOrderDate = new Date().toISOString();
        saveVendors();
    }

    function getVendorPurchaseOrders(vendorId) {
        return purchaseOrders.filter(po => po.vendorId === vendorId);
    }

    function getVendorStats(vendorId) {
        const vendor = getVendor(vendorId);
        if (!vendor) return null;

        const vendorPOs = getVendorPurchaseOrders(vendorId);
        const pending = vendorPOs.filter(po => po.status === 'sent' || po.status === 'confirmed').length;
        const completed = vendorPOs.filter(po => po.status === 'received').length;

        return {
            totalSpent: vendor.totalSpent,
            orderCount: vendor.orderCount,
            pendingOrders: pending,
            completedOrders: completed,
            lastOrderDate: vendor.lastOrderDate,
            avgOrderValue: vendor.orderCount > 0 ? vendor.totalSpent / vendor.orderCount : 0
        };
    }

    // ============================================================================
    // INVENTORY INTEGRATION
    // ============================================================================

    function updateInventoryFromPO(po) {
        if (typeof InventoryModule === 'undefined') {
            console.warn('InventoryModule not loaded');
            return;
        }

        po.items.forEach(item => {
            if (item.inventoryId) {
                InventoryModule.restockItem(
                    item.inventoryId, 
                    item.quantity, 
                    `Received from PO ${po.poNumber}`
                );
            }
        });
    }

    // ============================================================================
    // FILTERING
    // ============================================================================

    function filterVendors(filters = {}) {
        let filtered = [...vendors];

        if (filters.category) {
            filtered = filtered.filter(v => v.category === filters.category);
        }

        if (filters.isActive !== undefined) {
            filtered = filtered.filter(v => v.isActive === filters.isActive);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(v => 
                v.name.toLowerCase().includes(searchLower) ||
                v.contactPerson?.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }

    function filterPurchaseOrders(filters = {}) {
        let filtered = [...purchaseOrders];

        if (filters.status) {
            filtered = filtered.filter(po => po.status === filters.status);
        }

        if (filters.vendorId) {
            filtered = filtered.filter(po => po.vendorId === filters.vendorId);
        }

        return filtered;
    }

    function getCategories() {
        return [...new Set(vendors.map(v => v.category))];
    }

    // ============================================================================
    // UI RENDERING
    // ============================================================================

    function renderVendorsView() {
        const container = document.getElementById('vendors-container');
        if (!container) return;

        if (vendors.length === 0) {
            container.innerHTML = renderEmptyState();
            return;
        }

        const activeVendors = vendors.filter(v => v.isActive).length;
        const totalSpent = vendors.reduce((sum, v) => sum + v.totalSpent, 0);

        const html = `
            <div class="vendors-header">
                <div>
                    <h2 data-en="Vendors" data-ja="仕入先">Vendors</h2>
                    <div class="vendors-stats-row">
                        <span class="stat">${activeVendors} active vendors</span>
                        <span class="stat stat-value">$${totalSpent.toFixed(2)} total spent</span>
                    </div>
                </div>
                <button class="btn-primary" id="add-vendor-btn">
                    <span data-en="+ Add Vendor" data-ja="+ 仕入先追加">+ Add Vendor</span>
                </button>
            </div>

            <div class="vendors-tabs">
                <button class="tab-btn active" data-tab="vendors">Vendors</button>
                <button class="tab-btn" data-tab="purchase-orders">Purchase Orders</button>
            </div>

            <div class="tab-content" id="vendors-tab">
                <div class="vendors-filters">
                    <select id="filter-category">
                        <option value="">All Categories</option>
                        ${getCategories().map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                    <select id="filter-active">
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                    <input type="text" id="search-vendors" placeholder="Search vendors..." class="search-input">
                </div>

                <div class="vendors-grid">
                    ${vendors.map(vendor => renderVendorCard(vendor)).join('')}
                </div>
            </div>

            <div class="tab-content" id="purchase-orders-tab" style="display: none;">
                <div class="po-header">
                    <button class="btn-primary" id="create-po-btn">+ Create Purchase Order</button>
                </div>
                <div class="po-list">
                    ${purchaseOrders.slice(0, 20).map(po => renderPOCard(po)).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function renderVendorCard(vendor) {
        const statusClass = vendor.isActive ? 'active' : 'inactive';
        const stats = getVendorStats(vendor.id);

        return `
            <div class="vendor-card ${statusClass}" data-vendor-id="${vendor.id}">
                <div class="vendor-card-header">
                    <div>
                        <h3>${vendor.name}</h3>
                        ${vendor.contactPerson ? `<div class="vendor-contact">${vendor.contactPerson}</div>` : ''}
                    </div>
                    <div class="vendor-status-badge ${statusClass}">
                        ${vendor.isActive ? '✅ Active' : '⏸️ Inactive'}
                    </div>
                </div>

                <div class="vendor-meta">
                    <span class="category-badge">${vendor.category}</span>
                    ${vendor.paymentTerms ? `<span class="payment-badge">${vendor.paymentTerms}</span>` : ''}
                </div>

                <div class="vendor-contact-info">
                    ${vendor.phone ? `<div>📞 ${vendor.phone}</div>` : ''}
                    ${vendor.email ? `<div>✉️ ${vendor.email}</div>` : ''}
                </div>

                <div class="vendor-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Spent</span>
                        <span class="stat-value">$${stats.totalSpent.toFixed(2)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Orders</span>
                        <span class="stat-value">${stats.orderCount}</span>
                    </div>
                    ${stats.pendingOrders > 0 ? `
                        <div class="stat-item">
                            <span class="stat-label">Pending</span>
                            <span class="stat-value stat-alert">${stats.pendingOrders}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="vendor-actions">
                    <button class="btn-secondary btn-sm create-po" data-vendor-id="${vendor.id}">Create PO</button>
                    <button class="btn-secondary btn-sm edit-vendor" data-vendor-id="${vendor.id}">Edit</button>
                    <button class="btn-icon delete-vendor" data-vendor-id="${vendor.id}">🗑️</button>
                </div>
            </div>
        `;
    }

    function renderPOCard(po) {
        const statusClass = `status-${po.status}`;
        const statusEmoji = {
            draft: '📝',
            sent: '📤',
            confirmed: '✅',
            received: '📦',
            cancelled: '❌'
        };

        return `
            <div class="po-card ${statusClass}" data-po-id="${po.id}">
                <div class="po-header-row">
                    <div>
                        <strong>${po.poNumber}</strong>
                        <span class="po-vendor">${po.vendorName}</span>
                    </div>
                    <span class="po-status ${statusClass}">
                        ${statusEmoji[po.status]} ${po.status}
                    </span>
                </div>

                <div class="po-details">
                    <div>${po.items.length} items</div>
                    <div class="po-total">$${po.total.toFixed(2)}</div>
                </div>

                <div class="po-dates">
                    <div>Ordered: ${formatDate(po.orderDate)}</div>
                    ${po.expectedDeliveryDate ? `<div>Expected: ${formatDate(po.expectedDeliveryDate)}</div>` : ''}
                </div>

                <div class="po-actions">
                    ${po.status === 'draft' ? `<button class="btn-sm btn-primary send-po" data-po-id="${po.id}">Send PO</button>` : ''}
                    ${po.status === 'sent' || po.status === 'confirmed' ? `<button class="btn-sm btn-primary receive-po" data-po-id="${po.id}">Mark Received</button>` : ''}
                    <button class="btn-sm btn-secondary view-po" data-po-id="${po.id}">View</button>
                </div>
            </div>
        `;
    }

    function renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🏭</div>
                <h3 data-en="No Vendors Yet" data-ja="仕入先がありません">No Vendors Yet</h3>
                <p data-en="Add your suppliers to manage purchase orders" 
                   data-ja="仕入先を追加して発注管理を開始します">
                    Add your suppliers to manage purchase orders
                </p>
                <button class="btn-primary" id="add-first-vendor">
                    <span data-en="Add First Vendor" data-ja="最初の仕入先を追加">Add First Vendor</span>
                </button>
            </div>
        `;
    }

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================

    function attachEventListeners() {
        const container = document.getElementById('vendors-container');
        if (!container) return;

        container.addEventListener('click', (e) => {
            // Add vendor
            if (e.target.closest('#add-vendor-btn') || e.target.closest('#add-first-vendor')) {
                showAddVendorModal();
            }

            // Create PO
            if (e.target.closest('.create-po') || e.target.closest('#create-po-btn')) {
                const vendorId = e.target.closest('.create-po')?.dataset.vendorId || null;
                showCreatePOModal(vendorId);
            }

            // Edit vendor
            if (e.target.closest('.edit-vendor')) {
                const vendorId = e.target.closest('.edit-vendor').dataset.vendorId;
                showEditVendorModal(vendorId);
            }

            // Delete vendor
            if (e.target.closest('.delete-vendor')) {
                const vendorId = e.target.closest('.delete-vendor').dataset.vendorId;
                const vendor = getVendor(vendorId);
                if (confirm(`Delete ${vendor.name}?`)) {
                    deleteVendor(vendorId);
                    renderVendorsView();
                }
            }

            // Send PO
            if (e.target.closest('.send-po')) {
                const poId = e.target.closest('.send-po').dataset.poId;
                updatePOStatus(poId, 'sent');
                renderVendorsView();
            }

            // Receive PO
            if (e.target.closest('.receive-po')) {
                const poId = e.target.closest('.receive-po').dataset.poId;
                updatePOStatus(poId, 'received');
                renderVendorsView();
            }

            // Tab switching
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
    // MODALS (PLACEHOLDER)
    // ============================================================================

    function showAddVendorModal() {
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'add-vendor' }}));
    }

    function showEditVendorModal(vendorId) {
        currentVendorId = vendorId;
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'edit-vendor', vendorId }}));
    }

    function showCreatePOModal(vendorId = null) {
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'create-po', vendorId }}));
    }

    // ============================================================================
    // UTILITIES
    // ============================================================================

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        init,
        createVendor,
        updateVendor,
        deleteVendor,
        getVendor,
        toggleVendorStatus,
        createPurchaseOrder,
        updatePurchaseOrder,
        updatePOStatus,
        deletePurchaseOrder,
        getPurchaseOrder,
        getVendorPurchaseOrders,
        getVendorStats,
        filterVendors,
        filterPurchaseOrders,
        getAllVendors: () => vendors,
        getAllPurchaseOrders: () => purchaseOrders
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', VendorsModule.init);
} else {
    VendorsModule.init();
}
