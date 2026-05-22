// ============================================================================
// KATACHI - PREP LISTS MODULE
// Organize daily prep workflow with task lists, assignments, and completion tracking
// ============================================================================

const PrepListsModule = (() => {
    const STORAGE_KEY = 'k_prepLists';
    let prepLists = [];
    let currentListId = null;

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        loadPrepLists();
        renderPrepListsView();
        attachEventListeners();
        console.log('✅ Prep Lists module initialized');
    }

    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================

    function loadPrepLists() {
        const stored = localStorage.getItem(STORAGE_KEY);
        prepLists = stored ? JSON.parse(stored) : [];
    }

    function savePrepLists() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prepLists));
    }

    function generateId() {
        return 'pl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ============================================================================
    // PREP LIST CRUD
    // ============================================================================

    function createPrepList(data) {
        const newList = {
            id: generateId(),
            name: data.name,
            date: data.date,
            station: data.station || 'General',
            assignedTo: data.assignedTo || null,
            tasks: [],
            createdAt: new Date().toISOString(),
            completedAt: null,
            status: 'pending' // pending, in-progress, completed
        };
        
        prepLists.unshift(newList);
        savePrepLists();
        
        // Achievement check: First Prep List
        checkAchievement('first_prep');
        
        return newList;
    }

    function updatePrepList(listId, updates) {
        const list = prepLists.find(l => l.id === listId);
        if (!list) return null;
        
        Object.assign(list, updates);
        savePrepLists();
        return list;
    }

    function deletePrepList(listId) {
        const index = prepLists.findIndex(l => l.id === listId);
        if (index === -1) return false;
        
        prepLists.splice(index, 1);
        savePrepLists();
        return true;
    }

    function getPrepList(listId) {
        return prepLists.find(l => l.id === listId);
    }

    // ============================================================================
    // TASK MANAGEMENT
    // ============================================================================

    function addTask(listId, taskData) {
        const list = getPrepList(listId);
        if (!list) return null;

        const task = {
            id: generateId(),
            description: taskData.description,
            recipeId: taskData.recipeId || null,
            recipeName: taskData.recipeName || null,
            quantity: taskData.quantity || null,
            unit: taskData.unit || null,
            priority: taskData.priority || 'medium', // low, medium, high
            estimatedTime: taskData.estimatedTime || null, // in minutes
            completed: false,
            completedAt: null,
            completedBy: null,
            notes: taskData.notes || ''
        };

        list.tasks.push(task);
        savePrepLists();
        
        return task;
    }

    function toggleTaskCompletion(listId, taskId, userId = null) {
        const list = getPrepList(listId);
        if (!list) return null;

        const task = list.tasks.find(t => t.id === taskId);
        if (!task) return null;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        task.completedBy = task.completed ? userId : null;

        // Update list status
        updateListStatus(list);
        savePrepLists();

        return task;
    }

    function updateTask(listId, taskId, updates) {
        const list = getPrepList(listId);
        if (!list) return null;

        const task = list.tasks.find(t => t.id === taskId);
        if (!task) return null;

        Object.assign(task, updates);
        savePrepLists();
        return task;
    }

    function deleteTask(listId, taskId) {
        const list = getPrepList(listId);
        if (!list) return false;

        const index = list.tasks.findIndex(t => t.id === taskId);
        if (index === -1) return false;

        list.tasks.splice(index, 1);
        updateListStatus(list);
        savePrepLists();
        return true;
    }

    function updateListStatus(list) {
        if (list.tasks.length === 0) {
            list.status = 'pending';
            list.completedAt = null;
            return;
        }

        const completedTasks = list.tasks.filter(t => t.completed).length;
        const totalTasks = list.tasks.length;

        if (completedTasks === 0) {
            list.status = 'pending';
            list.completedAt = null;
        } else if (completedTasks === totalTasks) {
            list.status = 'completed';
            list.completedAt = new Date().toISOString();
            // Achievement check: Prep Ready
            checkAchievement('prep_ready');
        } else {
            list.status = 'in-progress';
            list.completedAt = null;
        }
    }

    // ============================================================================
    // RECIPE INTEGRATION
    // ============================================================================

    function addRecipeToPrep(listId, recipeId) {
        // This assumes RecipesModule is available
        if (typeof RecipesModule === 'undefined') {
            console.warn('RecipesModule not loaded');
            return null;
        }

        const recipe = RecipesModule.getRecipe(recipeId);
        if (!recipe) return null;

        const task = addTask(listId, {
            description: `Prep: ${recipe.name}`,
            recipeId: recipe.id,
            recipeName: recipe.name,
            quantity: recipe.yield,
            unit: recipe.yieldUnit,
            estimatedTime: recipe.prepTime || null
        });

        return task;
    }

    // ============================================================================
    // FILTERING & SORTING
    // ============================================================================

    function filterPrepLists(filters = {}) {
        let filtered = [...prepLists];

        if (filters.status) {
            filtered = filtered.filter(l => l.status === filters.status);
        }

        if (filters.date) {
            filtered = filtered.filter(l => l.date === filters.date);
        }

        if (filters.station) {
            filtered = filtered.filter(l => l.station === filters.station);
        }

        if (filters.assignedTo) {
            filtered = filtered.filter(l => l.assignedTo === filters.assignedTo);
        }

        return filtered;
    }

    function getListStats(listId) {
        const list = getPrepList(listId);
        if (!list) return null;

        const totalTasks = list.tasks.length;
        const completedTasks = list.tasks.filter(t => t.completed).length;
        const highPriorityTasks = list.tasks.filter(t => t.priority === 'high' && !t.completed).length;
        const totalEstimatedTime = list.tasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0);
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            totalTasks,
            completedTasks,
            pendingTasks: totalTasks - completedTasks,
            highPriorityTasks,
            totalEstimatedTime,
            completionPercentage,
            status: list.status
        };
    }

    // ============================================================================
    // ACHIEVEMENT SYSTEM HOOKS
    // ============================================================================

    function checkAchievement(type) {
        // This will connect to the main achievement system
        if (typeof AchievementSystem === 'undefined') return;

        switch(type) {
            case 'first_prep':
                if (prepLists.length === 1) {
                    AchievementSystem.unlock('prep_ready');
                }
                break;
            case 'prep_ready':
                const completedLists = prepLists.filter(l => l.status === 'completed').length;
                if (completedLists === 1) {
                    AchievementSystem.unlock('prep_ready');
                }
                break;
        }
    }

    // ============================================================================
    // UI RENDERING
    // ============================================================================

    function renderPrepListsView() {
        const container = document.getElementById('prep-lists-container');
        if (!container) return;

        if (prepLists.length === 0) {
            container.innerHTML = renderEmptyState();
            return;
        }

        const html = `
            <div class="prep-lists-header">
                <h2 data-en="Prep Lists" data-ja="準備リスト">Prep Lists</h2>
                <button class="btn-primary" id="create-prep-list-btn">
                    <span data-en="+ New Prep List" data-ja="+ 新しい準備リスト">+ New Prep List</span>
                </button>
            </div>
            
            <div class="prep-lists-filters">
                <select id="filter-status">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
                <input type="date" id="filter-date" placeholder="Filter by date">
            </div>

            <div class="prep-lists-grid">
                ${prepLists.map(list => renderPrepListCard(list)).join('')}
            </div>
        `;

        container.innerHTML = html;
    }

    function renderPrepListCard(list) {
        const stats = getListStats(list.id);
        const statusClass = `status-${list.status}`;
        
        return `
            <div class="prep-list-card ${statusClass}" data-list-id="${list.id}">
                <div class="prep-list-header">
                    <div class="prep-list-title">
                        <h3>${list.name}</h3>
                        <span class="prep-list-date">${formatDate(list.date)}</span>
                    </div>
                    <div class="prep-list-actions">
                        <button class="btn-icon edit-list" data-list-id="${list.id}">✏️</button>
                        <button class="btn-icon delete-list" data-list-id="${list.id}">🗑️</button>
                    </div>
                </div>

                <div class="prep-list-meta">
                    <span class="station-badge">${list.station}</span>
                    ${list.assignedTo ? `<span class="assigned-badge">👤 ${list.assignedTo}</span>` : ''}
                </div>

                <div class="prep-list-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${stats.completionPercentage}%"></div>
                    </div>
                    <div class="progress-text">
                        ${stats.completedTasks}/${stats.totalTasks} tasks completed (${stats.completionPercentage}%)
                    </div>
                </div>

                ${stats.highPriorityTasks > 0 ? `
                    <div class="priority-alert">
                        ⚠️ ${stats.highPriorityTasks} high priority task${stats.highPriorityTasks > 1 ? 's' : ''}
                    </div>
                ` : ''}

                <div class="prep-list-tasks">
                    ${list.tasks.slice(0, 3).map(task => renderTaskPreview(task)).join('')}
                    ${list.tasks.length > 3 ? `<div class="more-tasks">+${list.tasks.length - 3} more tasks</div>` : ''}
                </div>

                <button class="btn-secondary view-list-btn" data-list-id="${list.id}">
                    View Full List →
                </button>
            </div>
        `;
    }

    function renderTaskPreview(task) {
        const checkedClass = task.completed ? 'checked' : '';
        const priorityIcon = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
        
        return `
            <div class="task-preview ${checkedClass}">
                <input type="checkbox" ${task.completed ? 'checked' : ''} disabled>
                <span class="task-description">${priorityIcon} ${task.description}</span>
            </div>
        `;
    }

    function renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3 data-en="No Prep Lists Yet" data-ja="準備リストがありません">No Prep Lists Yet</h3>
                <p data-en="Create your first prep list to organize your daily workflow" 
                   data-ja="最初の準備リストを作成して、毎日のワークフローを整理しましょう">
                    Create your first prep list to organize your daily workflow
                </p>
                <button class="btn-primary" id="create-first-prep-list">
                    <span data-en="Create First Prep List" data-ja="最初の準備リストを作成">Create First Prep List</span>
                </button>
            </div>
        `;
    }

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================

    function attachEventListeners() {
        const container = document.getElementById('prep-lists-container');
        if (!container) return;

        // Create new prep list
        container.addEventListener('click', (e) => {
            if (e.target.closest('#create-prep-list-btn') || e.target.closest('#create-first-prep-list')) {
                showCreatePrepListModal();
            }

            // View full list
            if (e.target.closest('.view-list-btn')) {
                const listId = e.target.closest('.view-list-btn').dataset.listId;
                showPrepListDetail(listId);
            }

            // Edit list
            if (e.target.closest('.edit-list')) {
                const listId = e.target.closest('.edit-list').dataset.listId;
                showEditPrepListModal(listId);
            }

            // Delete list
            if (e.target.closest('.delete-list')) {
                const listId = e.target.closest('.delete-list').dataset.listId;
                if (confirm('Delete this prep list?')) {
                    deletePrepList(listId);
                    renderPrepListsView();
                }
            }
        });

        // Filters
        const statusFilter = document.getElementById('filter-status');
        const dateFilter = document.getElementById('filter-date');

        if (statusFilter) {
            statusFilter.addEventListener('change', applyFilters);
        }
        if (dateFilter) {
            dateFilter.addEventListener('change', applyFilters);
        }
    }

    function applyFilters() {
        const status = document.getElementById('filter-status')?.value;
        const date = document.getElementById('filter-date')?.value;

        const filters = {};
        if (status) filters.status = status;
        if (date) filters.date = date;

        const filtered = filterPrepLists(filters);
        // Re-render with filtered results
        renderFilteredLists(filtered);
    }

    function renderFilteredLists(lists) {
        const grid = document.querySelector('.prep-lists-grid');
        if (!grid) return;

        grid.innerHTML = lists.map(list => renderPrepListCard(list)).join('');
    }

    // ============================================================================
    // MODALS (PLACEHOLDER - WILL BE IMPLEMENTED IN HTML)
    // ============================================================================

    function showCreatePrepListModal() {
        // This will trigger the modal defined in the HTML structure
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'create-prep-list' }}));
    }

    function showEditPrepListModal(listId) {
        currentListId = listId;
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'edit-prep-list', listId }}));
    }

    function showPrepListDetail(listId) {
        currentListId = listId;
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'prep-list-detail', listId }}));
    }

    // ============================================================================
    // UTILITIES
    // ============================================================================

    function formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        init,
        createPrepList,
        updatePrepList,
        deletePrepList,
        getPrepList,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        addRecipeToPrep,
        filterPrepLists,
        getListStats,
        getAllLists: () => prepLists
    };
})();

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', PrepListsModule.init);
} else {
    PrepListsModule.init();
}
