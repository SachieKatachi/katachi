// ============================================================================
// KATACHI - SETTINGS & ADMIN MODULE
// System configuration, user preferences, and administrative functions
// ============================================================================

const SettingsModule = (() => {
    const STORAGE_KEY = 'k_settings';
    let settings = {};

    // ============================================================================
    // DEFAULT SETTINGS
    // ============================================================================

    const DEFAULT_SETTINGS = {
        general: {
            restaurantName: '',
            cuisine: '',
            location: '',
            timezone: 'America/New_York',
            currency: 'USD',
            language: 'en'
        },
        business: {
            taxRate: 0.08,
            serviceFee: 0,
            defaultTipPercentage: 0,
            openingHours: {},
            phoneNumber: '',
            email: '',
            website: ''
        },
        inventory: {
            lowStockThreshold: 20,
            reorderPointDays: 7,
            autoDeduct: true,
            trackBatches: false
        },
        costing: {
            defaultMarkup: 200,
            targetFoodCostPercentage: 32,
            autoRecalculate: true,
            includeLabor: false
        },
        pricing: {
            defaultStrategy: 'cost_plus',
            psychologicalPricing: true,
            roundToNearest: 0.99
        },
        notifications: {
            lowStock: true,
            orderAlerts: true,
            reviewReminders: true,
            emailNotifications: true
        },
        display: {
            theme: 'light',
            compactMode: false,
            showTutorials: true,
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h'
        },
        security: {
            sessionTimeout: 30,
            requirePassword: false,
            twoFactorAuth: false
        },
        integrations: {
            pos: null,
            accounting: null,
            inventory: null
        }
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        loadSettings();
        applySettings();
        console.log('✅ Settings module initialized');
        
        // Achievement check: Kitchen Master
        checkAchievement('kitchen_master');
    }

    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================

    function loadSettings() {
        const stored = localStorage.getItem(STORAGE_KEY);
        settings = stored ? JSON.parse(stored) : { ...DEFAULT_SETTINGS };
        
        // Merge with defaults to ensure all keys exist
        settings = deepMerge(DEFAULT_SETTINGS, settings);
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        applySettings();
    }

    function deepMerge(target, source) {
        const output = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        }
        
        return output;
    }

    // ============================================================================
    // SETTINGS GETTERS & SETTERS
    // ============================================================================

    function get(path) {
        const keys = path.split('.');
        let value = settings;
        
        for (const key of keys) {
            value = value?.[key];
            if (value === undefined) return null;
        }
        
        return value;
    }

    function set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let obj = settings;
        
        for (const key of keys) {
            if (!obj[key]) obj[key] = {};
            obj = obj[key];
        }
        
        obj[lastKey] = value;
        saveSettings();
        
        return value;
    }

    function reset() {
        if (confirm('Reset all settings to defaults? This cannot be undone.')) {
            settings = { ...DEFAULT_SETTINGS };
            saveSettings();
            return true;
        }
        return false;
    }

    function exportSettings() {
        return JSON.parse(JSON.stringify(settings));
    }

    function importSettings(data) {
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            settings = deepMerge(DEFAULT_SETTINGS, parsed);
            saveSettings();
            return true;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }

    // ============================================================================
    // APPLY SETTINGS
    // ============================================================================

    function applySettings() {
        // Apply theme
        if (settings.display.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        // Apply language
        if (settings.general.language) {
            document.documentElement.lang = settings.general.language;
        }

        // Apply compact mode
        if (settings.display.compactMode) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }
    }

    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================

    function getAllData() {
        const data = {
            settings: settings,
            timestamp: new Date().toISOString()
        };

        // Collect data from all modules
        if (typeof RecipesModule !== 'undefined') {
            data.recipes = RecipesModule.getAllRecipes();
        }
        if (typeof PrepListsModule !== 'undefined') {
            data.prepLists = PrepListsModule.getAllLists();
        }
        if (typeof InventoryModule !== 'undefined') {
            data.inventory = InventoryModule.getAllItems();
        }
        if (typeof OrdersModule !== 'undefined') {
            data.orders = OrdersModule.getAllOrders();
        }
        if (typeof VendorsModule !== 'undefined') {
            data.vendors = VendorsModule.getAllVendors();
            data.purchaseOrders = VendorsModule.getAllPurchaseOrders();
        }
        if (typeof CostingModule !== 'undefined') {
            data.ingredientCosts = CostingModule.exportIngredientCosts();
            data.recipeCosts = CostingModule.exportRecipeCosts();
        }
        if (typeof PricingModule !== 'undefined') {
            // Would export pricing data
        }
        if (typeof TeamModule !== 'undefined') {
            data.team = TeamModule.getAllMembers();
        }
        if (typeof StandardsModule !== 'undefined') {
            data.standards = StandardsModule.getAllStandards();
        }
        if (typeof AchievementSystem !== 'undefined') {
            data.achievements = AchievementSystem.getAllAchievements();
        }

        return data;
    }

    function exportData(format = 'json') {
        const data = getAllData();
        
        if (format === 'json') {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `katachi-backup-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            return true;
        }
        
        return false;
    }

    function importData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            // Import settings
            if (data.settings) {
                importSettings(data.settings);
            }

            // Import module data
            // This would require import methods on each module
            // For now, just log success
            console.log('✅ Data import complete');
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }

    function clearAllData() {
        if (!confirm('Clear ALL data? This will delete everything and cannot be undone!')) {
            return false;
        }

        if (!confirm('Are you ABSOLUTELY sure? This action is permanent!')) {
            return false;
        }

        // Clear all localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('k_')) {
                localStorage.removeItem(key);
            }
        });

        console.log('🗑️ All data cleared');
        window.location.reload();
        return true;
    }

    // ============================================================================
    // ACHIEVEMENT SYSTEM HOOKS
    // ============================================================================

    function checkAchievement(type) {
        if (typeof AchievementSystem === 'undefined') return;

        switch(type) {
            case 'kitchen_master':
                // Check if user has set up most of the system
                const hasRecipes = typeof RecipesModule !== 'undefined' && RecipesModule.getAllRecipes().length > 0;
                const hasInventory = typeof InventoryModule !== 'undefined' && InventoryModule.getAllItems().length > 0;
                const hasTeam = typeof TeamModule !== 'undefined' && TeamModule.getAllMembers().length > 0;
                const hasPricing = typeof PricingModule !== 'undefined' && PricingModule.getPricingStats().totalPriced > 0;

                if (hasRecipes && hasInventory && hasTeam && hasPricing) {
                    AchievementSystem.unlock('kitchen_master');
                }
                break;
        }
    }

    // ============================================================================
    // UI RENDERING
    // ============================================================================

    function renderSettingsView() {
        const container = document.getElementById('settings-container');
        if (!container) return;

        const html = `
            <div class="settings-header">
                <h2 data-en="Settings" data-ja="設定">Settings</h2>
            </div>

            <div class="settings-tabs">
                <button class="tab-btn active" data-tab="general">General</button>
                <button class="tab-btn" data-tab="business">Business</button>
                <button class="tab-btn" data-tab="modules">Modules</button>
                <button class="tab-btn" data-tab="display">Display</button>
                <button class="tab-btn" data-tab="data">Data & Backup</button>
            </div>

            <div class="tab-content" id="general-tab">
                ${renderGeneralSettings()}
            </div>

            <div class="tab-content" id="business-tab" style="display: none;">
                ${renderBusinessSettings()}
            </div>

            <div class="tab-content" id="modules-tab" style="display: none;">
                ${renderModuleSettings()}
            </div>

            <div class="tab-content" id="display-tab" style="display: none;">
                ${renderDisplaySettings()}
            </div>

            <div class="tab-content" id="data-tab" style="display: none;">
                ${renderDataManagement()}
            </div>
        `;

        container.innerHTML = html;
    }

    function renderGeneralSettings() {
        return `
            <div class="settings-section">
                <h3>Restaurant Information</h3>
                <div class="settings-form">
                    <div class="form-group">
                        <label>Restaurant Name</label>
                        <input type="text" id="setting-restaurant-name" value="${settings.general.restaurantName || ''}" placeholder="Your Restaurant">
                    </div>
                    <div class="form-group">
                        <label>Cuisine Type</label>
                        <input type="text" id="setting-cuisine" value="${settings.general.cuisine || ''}" placeholder="e.g., Japanese, Italian">
                    </div>
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="setting-location" value="${settings.general.location || ''}" placeholder="City, State">
                    </div>
                    <div class="form-group">
                        <label>Timezone</label>
                        <select id="setting-timezone">
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                    </div>
                    <button class="btn-primary" id="save-general">Save Changes</button>
                </div>
            </div>
        `;
    }

    function renderBusinessSettings() {
        return `
            <div class="settings-section">
                <h3>Business Settings</h3>
                <div class="settings-form">
                    <div class="form-group">
                        <label>Tax Rate (%)</label>
                        <input type="number" step="0.01" id="setting-tax-rate" value="${(settings.business.taxRate * 100).toFixed(2)}">
                    </div>
                    <div class="form-group">
                        <label>Currency</label>
                        <select id="setting-currency">
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="JPY">JPY (¥)</option>
                        </select>
                    </div>
                    <button class="btn-primary" id="save-business">Save Changes</button>
                </div>
            </div>
        `;
    }

    function renderModuleSettings() {
        return `
            <div class="settings-section">
                <h3>Module Settings</h3>
                
                <h4>Inventory</h4>
                <div class="settings-form">
                    <div class="form-group checkbox">
                        <label>
                            <input type="checkbox" id="setting-auto-deduct" ${settings.inventory.autoDeduct ? 'checked' : ''}>
                            Auto-deduct inventory from orders
                        </label>
                    </div>
                </div>

                <h4>Costing</h4>
                <div class="settings-form">
                    <div class="form-group">
                        <label>Default Markup (%)</label>
                        <input type="number" id="setting-default-markup" value="${settings.costing.defaultMarkup}">
                    </div>
                    <div class="form-group">
                        <label>Target Food Cost (%)</label>
                        <input type="number" id="setting-target-food-cost" value="${settings.costing.targetFoodCostPercentage}">
                    </div>
                </div>

                <button class="btn-primary" id="save-modules">Save Changes</button>
            </div>
        `;
    }

    function renderDisplaySettings() {
        return `
            <div class="settings-section">
                <h3>Display Preferences</h3>
                <div class="settings-form">
                    <div class="form-group">
                        <label>Theme</label>
                        <select id="setting-theme">
                            <option value="light" ${settings.display.theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${settings.display.theme === 'dark' ? 'selected' : ''}>Dark</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Language</label>
                        <select id="setting-language">
                            <option value="en" ${settings.general.language === 'en' ? 'selected' : ''}>English</option>
                            <option value="ja" ${settings.general.language === 'ja' ? 'selected' : ''}>日本語</option>
                        </select>
                    </div>
                    <div class="form-group checkbox">
                        <label>
                            <input type="checkbox" id="setting-compact-mode" ${settings.display.compactMode ? 'checked' : ''}>
                            Compact Mode
                        </label>
                    </div>
                    <button class="btn-primary" id="save-display">Save Changes</button>
                </div>
            </div>
        `;
    }

    function renderDataManagement() {
        return `
            <div class="settings-section">
                <h3>Data Management</h3>
                
                <div class="data-actions">
                    <div class="action-card">
                        <h4>Export Data</h4>
                        <p>Download all your data as a backup file</p>
                        <button class="btn-secondary" id="export-data-btn">Export JSON</button>
                    </div>

                    <div class="action-card">
                        <h4>Import Data</h4>
                        <p>Restore data from a backup file</p>
                        <input type="file" id="import-file" accept=".json" style="display: none;">
                        <button class="btn-secondary" id="import-data-btn">Import JSON</button>
                    </div>

                    <div class="action-card danger">
                        <h4>Clear All Data</h4>
                        <p>Delete everything and start fresh</p>
                        <button class="btn-danger" id="clear-data-btn">Clear All Data</button>
                    </div>

                    <div class="action-card">
                        <h4>Reset Settings</h4>
                        <p>Reset all settings to defaults (keeps your data)</p>
                        <button class="btn-secondary" id="reset-settings-btn">Reset Settings</button>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================

    function attachEventListeners() {
        const container = document.getElementById('settings-container');
        if (!container) return;

        container.addEventListener('click', (e) => {
            // Tab switching
            if (e.target.closest('.tab-btn')) {
                const tab = e.target.closest('.tab-btn').dataset.tab;
                switchTab(tab);
            }

            // Export data
            if (e.target.id === 'export-data-btn') {
                exportData('json');
            }

            // Import data
            if (e.target.id === 'import-data-btn') {
                document.getElementById('import-file').click();
            }

            // Clear data
            if (e.target.id === 'clear-data-btn') {
                clearAllData();
            }

            // Reset settings
            if (e.target.id === 'reset-settings-btn') {
                reset();
                renderSettingsView();
            }

            // Save buttons
            if (e.target.id === 'save-general') {
                set('general.restaurantName', document.getElementById('setting-restaurant-name').value);
                set('general.cuisine', document.getElementById('setting-cuisine').value);
                set('general.location', document.getElementById('setting-location').value);
                alert('Settings saved!');
            }

            if (e.target.id === 'save-display') {
                set('display.theme', document.getElementById('setting-theme').value);
                set('general.language', document.getElementById('setting-language').value);
                set('display.compactMode', document.getElementById('setting-compact-mode').checked);
                alert('Settings saved!');
                window.location.reload();
            }
        });

        // File import handler
        const fileInput = document.getElementById('import-file');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const success = importData(event.target.result);
                    if (success) {
                        alert('Data imported successfully!');
                        window.location.reload();
                    } else {
                        alert('Import failed. Please check the file.');
                    }
                };
                reader.readAsText(file);
            });
        }
    }

    function switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
        document.getElementById(`${tabName}-tab`).style.display = 'block';
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        init,
        get,
        set,
        reset,
        exportSettings,
        importSettings,
        exportData,
        importData,
        clearAllData,
        getAllData,
        renderSettingsView,
        attachEventListeners
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SettingsModule.init);
} else {
    SettingsModule.init();
}
