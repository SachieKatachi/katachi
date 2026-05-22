// ============================================================================
// KATACHI - STANDARDS MODULE
// Store SOPs, quality standards, procedures, and kitchen documentation
// ============================================================================

const StandardsModule = (() => {
    const STORAGE_KEY = 'k_standards';
    let standards = [];
    let currentStandardId = null;

    // ============================================================================
    // STANDARD TYPES
    // ============================================================================

    const STANDARD_TYPES = {
        SOP: 'Standard Operating Procedure',
        RECIPE_STANDARD: 'Recipe Standard',
        QUALITY_CONTROL: 'Quality Control',
        SAFETY: 'Safety Protocol',
        CLEANING: 'Cleaning Procedure',
        OPENING: 'Opening Checklist',
        CLOSING: 'Closing Checklist',
        TRAINING: 'Training Material',
        PLATING: 'Plating Guide',
        OTHER: 'Other'
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        loadStandards();
        renderStandardsView();
        attachEventListeners();
        console.log('✅ Standards module initialized');
    }

    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================

    function loadStandards() {
        const stored = localStorage.getItem(STORAGE_KEY);
        standards = stored ? JSON.parse(stored) : [];
    }

    function saveStandards() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(standards));
    }

    function generateId() {
        return 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ============================================================================
    // STANDARD CRUD
    // ============================================================================

    function createStandard(data) {
        const newStandard = {
            id: generateId(),
            title: data.title,
            type: data.type || 'SOP',
            category: data.category || 'General',
            description: data.description || '',
            content: data.content || '', // Markdown or rich text
            steps: data.steps || [], // Array of step objects
            relatedRecipes: data.relatedRecipes || [],
            requiredFor: data.requiredFor || [], // Roles that must know this
            media: data.media || [], // Images, videos
            version: 1,
            status: 'active', // active, draft, archived
            createdBy: data.createdBy || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastReviewed: null,
            reviewSchedule: data.reviewSchedule || 'quarterly', // daily, weekly, monthly, quarterly, yearly
            criticalControl: data.criticalControl || false, // HACCP critical control point
            tags: data.tags || []
        };

        standards.unshift(newStandard);
        saveStandards();
        return newStandard;
    }

    function updateStandard(standardId, updates) {
        const standard = standards.find(s => s.id === standardId);
        if (!standard) return null;

        // If content changes, increment version
        if (updates.content && updates.content !== standard.content) {
            updates.version = (standard.version || 1) + 1;
        }

        Object.assign(standard, updates, {
            updatedAt: new Date().toISOString()
        });

        saveStandards();
        return standard;
    }

    function deleteStandard(standardId) {
        const index = standards.findIndex(s => s.id === standardId);
        if (index === -1) return false;

        standards.splice(index, 1);
        saveStandards();
        return true;
    }

    function getStandard(standardId) {
        return standards.find(s => s.id === standardId);
    }

    function archiveStandard(standardId) {
        return updateStandard(standardId, { status: 'archived' });
    }

    function markReviewed(standardId) {
        return updateStandard(standardId, { 
            lastReviewed: new Date().toISOString() 
        });
    }

    // ============================================================================
    // STEPS MANAGEMENT
    // ============================================================================

    function addStep(standardId, step) {
        const standard = getStandard(standardId);
        if (!standard) return null;

        if (!standard.steps) {
            standard.steps = [];
        }

        standard.steps.push({
            id: generateId(),
            number: standard.steps.length + 1,
            title: step.title,
            description: step.description,
            timeEstimate: step.timeEstimate || null,
            criticalPoint: step.criticalPoint || false,
            media: step.media || null
        });

        saveStandards();
        return standard;
    }

    function removeStep(standardId, stepId) {
        const standard = getStandard(standardId);
        if (!standard) return null;

        const index = standard.steps.findIndex(s => s.id === stepId);
        if (index === -1) return null;

        standard.steps.splice(index, 1);
        
        // Renumber steps
        standard.steps.forEach((step, idx) => {
            step.number = idx + 1;
        });

        saveStandards();
        return standard;
    }

    function reorderSteps(standardId, newOrder) {
        const standard = getStandard(standardId);
        if (!standard) return null;

        standard.steps = newOrder;
        standard.steps.forEach((step, idx) => {
            step.number = idx + 1;
        });

        saveStandards();
        return standard;
    }

    // ============================================================================
    // FILTERING & SEARCH
    // ============================================================================

    function filterByType(type) {
        return standards.filter(s => s.type === type);
    }

    function filterByCategory(category) {
        return standards.filter(s => s.category === category);
    }

    function filterByStatus(status) {
        return standards.filter(s => s.status === status);
    }

    function filterCritical() {
        return standards.filter(s => s.criticalControl === true);
    }

    function searchStandards(query) {
        const lowerQuery = query.toLowerCase();
        return standards.filter(s => 
            s.title.toLowerCase().includes(lowerQuery) ||
            s.description.toLowerCase().includes(lowerQuery) ||
            s.content.toLowerCase().includes(lowerQuery) ||
            s.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }

    function getStandardsForRole(role) {
        return standards.filter(s => 
            s.requiredFor && s.requiredFor.includes(role)
        );
    }

    // ============================================================================
    // REVIEW TRACKING
    // ============================================================================

    function needsReview() {
        const now = new Date();
        
        return standards.filter(standard => {
            if (!standard.lastReviewed) return true;

            const lastReview = new Date(standard.lastReviewed);
            const daysSince = Math.floor((now - lastReview) / (1000 * 60 * 60 * 24));

            switch(standard.reviewSchedule) {
                case 'daily': return daysSince >= 1;
                case 'weekly': return daysSince >= 7;
                case 'monthly': return daysSince >= 30;
                case 'quarterly': return daysSince >= 90;
                case 'yearly': return daysSince >= 365;
                default: return false;
            }
        });
    }

    function getReviewStats() {
        const total = standards.filter(s => s.status === 'active').length;
        const reviewed = standards.filter(s => s.lastReviewed).length;
        const pending = needsReview().length;
        const critical = filterCritical().length;

        return {
            total,
            reviewed,
            pending,
            critical,
            compliance: total > 0 ? Math.round(((total - pending) / total) * 100) : 100
        };
    }

    // ============================================================================
    // CATEGORIES & TAGS
    // ============================================================================

    function getCategories() {
        return [...new Set(standards.map(s => s.category))];
    }

    function getAllTags() {
        const tagSet = new Set();
        standards.forEach(s => {
            if (s.tags) {
                s.tags.forEach(tag => tagSet.add(tag));
            }
        });
        return Array.from(tagSet);
    }

    // ============================================================================
    // STATS
    // ============================================================================

    function getStandardsStats() {
        const total = standards.length;
        const active = standards.filter(s => s.status === 'active').length;
        const draft = standards.filter(s => s.status === 'draft').length;
        const archived = standards.filter(s => s.status === 'archived').length;

        const typeBreakdown = {};
        Object.keys(STANDARD_TYPES).forEach(type => {
            typeBreakdown[type] = standards.filter(s => s.type === type).length;
        });

        return {
            total,
            active,
            draft,
            archived,
            typeBreakdown
        };
    }

    // ============================================================================
    // UI RENDERING
    // ============================================================================

    function renderStandardsView() {
        const container = document.getElementById('standards-container');
        if (!container) return;

        if (standards.length === 0) {
            container.innerHTML = renderEmptyState();
            return;
        }

        const stats = getStandardsStats();
        const reviewStats = getReviewStats();

        const html = `
            <div class="standards-header">
                <div>
                    <h2 data-en="Standards & SOPs" data-ja="基準とSOP">Standards & SOPs</h2>
                    <div class="standards-stats-row">
                        <span class="stat">${stats.active} active standards</span>
                        <span class="stat stat-compliance">${reviewStats.compliance}% compliant</span>
                        ${reviewStats.pending > 0 ? `<span class="stat stat-alert">${reviewStats.pending} need review</span>` : ''}
                    </div>
                </div>
                <button class="btn-primary" id="create-standard-btn">
                    <span data-en="+ New Standard" data-ja="+ 新規基準">+ New Standard</span>
                </button>
            </div>

            <div class="standards-tabs">
                <button class="tab-btn active" data-tab="all">All Standards</button>
                <button class="tab-btn" data-tab="critical">Critical</button>
                <button class="tab-btn" data-tab="review">Needs Review</button>
            </div>

            <div class="tab-content" id="all-tab">
                ${renderStandardsGrid(standards)}
            </div>

            <div class="tab-content" id="critical-tab" style="display: none;">
                ${renderStandardsGrid(filterCritical())}
            </div>

            <div class="tab-content" id="review-tab" style="display: none;">
                ${renderStandardsGrid(needsReview())}
            </div>
        `;

        container.innerHTML = html;
    }

    function renderStandardsGrid(standardsList) {
        if (standardsList.length === 0) {
            return '<div class="empty-message">No standards found</div>';
        }

        return `
            <div class="standards-filters">
                <select id="filter-type">
                    <option value="">All Types</option>
                    ${Object.entries(STANDARD_TYPES).map(([key, name]) => 
                        `<option value="${key}">${name}</option>`
                    ).join('')}
                </select>
                <input type="text" id="search-standards" placeholder="Search standards..." class="search-input">
            </div>

            <div class="standards-list">
                ${standardsList.map(standard => renderStandardCard(standard)).join('')}
            </div>
        `;
    }

    function renderStandardCard(standard) {
        const statusClass = `status-${standard.status}`;
        const needsReviewFlag = needsReview().some(s => s.id === standard.id);

        return `
            <div class="standard-card ${statusClass}" data-standard-id="${standard.id}">
                <div class="standard-header">
                    <div>
                        <h3>${standard.title}</h3>
                        <div class="standard-type-badge">${STANDARD_TYPES[standard.type]}</div>
                    </div>
                    ${standard.criticalControl ? '<div class="critical-badge">⚠️ Critical</div>' : ''}
                </div>

                <div class="standard-meta">
                    <span class="category-badge">${standard.category}</span>
                    <span class="version-badge">v${standard.version}</span>
                    ${needsReviewFlag ? '<span class="review-badge">📋 Needs Review</span>' : ''}
                </div>

                <p class="standard-description">${standard.description || 'No description'}</p>

                ${standard.steps && standard.steps.length > 0 ? `
                    <div class="standard-steps-preview">
                        ${standard.steps.length} steps
                    </div>
                ` : ''}

                <div class="standard-footer">
                    <div class="standard-dates">
                        ${standard.lastReviewed ? `
                            <div>Last reviewed: ${formatDate(standard.lastReviewed)}</div>
                        ` : '<div>Never reviewed</div>'}
                    </div>
                    <div class="standard-actions">
                        <button class="btn-sm btn-secondary view-standard" data-standard-id="${standard.id}">View</button>
                        ${needsReviewFlag ? `
                            <button class="btn-sm btn-primary mark-reviewed" data-standard-id="${standard.id}">Mark Reviewed</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    function renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">✓</div>
                <h3 data-en="No Standards Yet" data-ja="基準がありません">No Standards Yet</h3>
                <p data-en="Create SOPs and quality standards for your kitchen" 
                   data-ja="キッチンのSOPと品質基準を作成します">
                    Create SOPs and quality standards for your kitchen
                </p>
                <button class="btn-primary" id="create-first-standard">
                    <span data-en="Create First Standard" data-ja="最初の基準を作成">Create First Standard</span>
                </button>
            </div>
        `;
    }

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================

    function attachEventListeners() {
        const container = document.getElementById('standards-container');
        if (!container) return;

        container.addEventListener('click', (e) => {
            if (e.target.closest('#create-standard-btn') || e.target.closest('#create-first-standard')) {
                showCreateStandardModal();
            }

            if (e.target.closest('.view-standard')) {
                const standardId = e.target.closest('.view-standard').dataset.standardId;
                showStandardDetailModal(standardId);
            }

            if (e.target.closest('.mark-reviewed')) {
                const standardId = e.target.closest('.mark-reviewed').dataset.standardId;
                markReviewed(standardId);
                renderStandardsView();
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
    // MODALS (PLACEHOLDER)
    // ============================================================================

    function showCreateStandardModal() {
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'create-standard' }}));
    }

    function showStandardDetailModal(standardId) {
        currentStandardId = standardId;
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'standard-detail', standardId }}));
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
        createStandard,
        updateStandard,
        deleteStandard,
        getStandard,
        archiveStandard,
        markReviewed,
        addStep,
        removeStep,
        reorderSteps,
        filterByType,
        filterByCategory,
        filterCritical,
        searchStandards,
        getStandardsForRole,
        needsReview,
        getReviewStats,
        getCategories,
        getAllTags,
        getStandardsStats,
        renderStandardsView,
        getAllStandards: () => standards,
        STANDARD_TYPES
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', StandardsModule.init);
} else {
    StandardsModule.init();
}
