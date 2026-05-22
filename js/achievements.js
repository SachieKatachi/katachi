// ============================================================================
// KATACHI - ACHIEVEMENT SYSTEM
// Gamification system for unlocking achievements across all modules
// ============================================================================

const AchievementSystem = (() => {
    const STORAGE_KEY = 'k_achievements';
    let unlockedAchievements = [];

    // ============================================================================
    // ACHIEVEMENT DEFINITIONS (ALL 11 LOCKED IN)
    // ============================================================================

    const ACHIEVEMENTS = {
        // Beginner Tier
        first_recipe: {
            id: 'first_recipe',
            emoji: '🍳',
            title: 'First Recipe',
            description: 'Create your first recipe',
            tagline: 'Every master starts with a single dish.',
            tier: 'beginner',
            module: 'recipes'
        },
        perfect_scale: {
            id: 'perfect_scale',
            emoji: '⚖️',
            title: 'Perfect Scale',
            description: 'Scale a recipe accurately',
            tagline: 'Precision is the soul of cooking.',
            tier: 'beginner',
            module: 'recipes'
        },
        cost_master: {
            id: 'cost_master',
            emoji: '💰',
            title: 'Cost Master',
            description: 'Calculate full recipe costing',
            tagline: 'Know your numbers, control your kitchen.',
            tier: 'beginner',
            module: 'costing'
        },

        // Intermediate Tier
        prep_ready: {
            id: 'prep_ready',
            emoji: '📋',
            title: 'Prep Ready',
            description: 'Create first prep list',
            tagline: 'Organization is half the battle.',
            tier: 'intermediate',
            module: 'prepLists'
        },
        connected: {
            id: 'connected',
            emoji: '🔗',
            title: 'Connected',
            description: 'Link recipe to inventory',
            tagline: 'Everything flows together.',
            tier: 'intermediate',
            module: 'inventory'
        },
        precision: {
            id: 'precision',
            emoji: '🏆',
            title: 'Precision',
            description: 'Achieve 100% cost accuracy',
            tagline: 'Not a penny wasted.',
            tier: 'intermediate',
            module: 'costing'
        },

        // Advanced Tier
        team_lead: {
            id: 'team_lead',
            emoji: '👥',
            title: 'Team Lead',
            description: 'Invite team member',
            tagline: 'No chef stands alone.',
            tier: 'advanced',
            module: 'team'
        },
        insight_seeker: {
            id: 'insight_seeker',
            emoji: '📊',
            title: 'Insight Seeker',
            description: 'Review analytics dashboard',
            tagline: 'Data reveals the path forward.',
            tier: 'advanced',
            module: 'analytics'
        },
        kitchen_master: {
            id: 'kitchen_master',
            emoji: '🌟',
            title: 'Kitchen Master',
            description: 'Set up complete kitchen system',
            tagline: 'The form has been mastered.',
            tier: 'advanced',
            module: 'settings'
        },

        // Easter Eggs
        form_seeker: {
            id: 'form_seeker',
            emoji: '🔓',
            title: 'The Form Seeker',
            description: 'Found admin access',
            tagline: 'Curiosity reveals hidden paths.',
            tier: 'easter_egg',
            module: 'admin'
        },
        speed_demon: {
            id: 'speed_demon',
            emoji: '⚡',
            title: 'Speed Demon',
            description: 'Scale 10 recipes in one session',
            tagline: 'Lightning fast, flawlessly precise.',
            tier: 'easter_egg',
            module: 'recipes'
        },
        perfectionist: {
            id: 'perfectionist',
            emoji: '🎯',
            title: 'Perfectionist',
            description: 'Hit 99%+ margin targets',
            tagline: 'Excellence is not negotiable.',
            tier: 'easter_egg',
            module: 'pricing'
        }
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        loadAchievements();
        console.log('✅ Achievement System initialized');
        console.log(`📊 ${unlockedAchievements.length}/12 achievements unlocked`);
    }

    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================

    function loadAchievements() {
        const stored = localStorage.getItem(STORAGE_KEY);
        unlockedAchievements = stored ? JSON.parse(stored) : [];
    }

    function saveAchievements() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedAchievements));
    }

    // ============================================================================
    // UNLOCK ACHIEVEMENT
    // ============================================================================

    function unlock(achievementId) {
        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) {
            console.warn(`Achievement ${achievementId} not found`);
            return false;
        }

        // Check if already unlocked
        const alreadyUnlocked = unlockedAchievements.find(a => a.id === achievementId);
        if (alreadyUnlocked) {
            console.log(`Achievement ${achievementId} already unlocked`);
            return false;
        }

        // Add to unlocked list
        const unlockedData = {
            id: achievement.id,
            unlockedAt: new Date().toISOString()
        };
        
        unlockedAchievements.push(unlockedData);
        saveAchievements();

        // Show popup
        showAchievementPopup(achievement);

        console.log(`🎉 Achievement unlocked: ${achievement.title}`);
        return true;
    }

    // ============================================================================
    // POPUP UI
    // ============================================================================

    function showAchievementPopup(achievement) {
        // Remove any existing popup
        const existing = document.getElementById('achievement-popup');
        if (existing) {
            existing.remove();
        }

        // Create popup elements
        const overlay = document.createElement('div');
        overlay.className = 'achievement-overlay';
        overlay.id = 'achievement-overlay';

        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.id = 'achievement-popup';

        popup.innerHTML = `
            <div class="achievement-emoji">${achievement.emoji}</div>
            <div class="achievement-badge">ACHIEVEMENT UNLOCKED</div>
            <div class="achievement-title">${achievement.title}</div>
            <div class="achievement-tagline">"${achievement.tagline}"</div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        // Trigger animation
        setTimeout(() => {
            overlay.classList.add('active');
            popup.classList.add('active');
        }, 10);

        // Auto-close after 4 seconds
        setTimeout(() => {
            closeAchievementPopup();
        }, 4000);

        // Click to close
        overlay.addEventListener('click', closeAchievementPopup);
    }

    function closeAchievementPopup() {
        const overlay = document.getElementById('achievement-overlay');
        const popup = document.getElementById('achievement-popup');

        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }

        if (popup) {
            popup.classList.remove('active');
            setTimeout(() => popup.remove(), 300);
        }
    }

    // ============================================================================
    // QUERY FUNCTIONS
    // ============================================================================

    function isUnlocked(achievementId) {
        return unlockedAchievements.some(a => a.id === achievementId);
    }

    function getUnlockedCount() {
        return unlockedAchievements.length;
    }

    function getTotalCount() {
        return Object.keys(ACHIEVEMENTS).length;
    }

    function getProgress() {
        const total = getTotalCount();
        const unlocked = getUnlockedCount();
        return {
            unlocked,
            total,
            percentage: Math.round((unlocked / total) * 100)
        };
    }

    function getAchievementsByTier(tier) {
        return Object.values(ACHIEVEMENTS).filter(a => a.tier === tier);
    }

    function getAchievementsByModule(module) {
        return Object.values(ACHIEVEMENTS).filter(a => a.module === module);
    }

    function getAllAchievements() {
        return Object.values(ACHIEVEMENTS).map(achievement => ({
            ...achievement,
            unlocked: isUnlocked(achievement.id),
            unlockedAt: unlockedAchievements.find(a => a.id === achievement.id)?.unlockedAt || null
        }));
    }

    // ============================================================================
    // RENDER ACHIEVEMENTS VIEW
    // ============================================================================

    function renderAchievementsView(containerId = 'achievements-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const progress = getProgress();
        const tiers = {
            beginner: getAchievementsByTier('beginner'),
            intermediate: getAchievementsByTier('intermediate'),
            advanced: getAchievementsByTier('advanced'),
            easter_egg: getAchievementsByTier('easter_egg')
        };

        const html = `
            <div class="achievements-header">
                <h2 data-en="Achievements" data-ja="実績">Achievements</h2>
                <div class="achievements-progress">
                    <div class="progress-circle">
                        <span class="progress-number">${progress.unlocked}/${progress.total}</span>
                    </div>
                    <span class="progress-text">${progress.percentage}% Complete</span>
                </div>
            </div>

            <div class="achievements-tiers">
                ${renderTier('Beginner', tiers.beginner)}
                ${renderTier('Intermediate', tiers.intermediate)}
                ${renderTier('Advanced', tiers.advanced)}
                ${renderTier('Easter Eggs', tiers.easter_egg)}
            </div>
        `;

        container.innerHTML = html;
    }

    function renderTier(tierName, achievements) {
        return `
            <div class="achievement-tier">
                <h3 class="tier-title">${tierName}</h3>
                <div class="achievement-grid">
                    ${achievements.map(achievement => renderAchievementCard(achievement)).join('')}
                </div>
            </div>
        `;
    }

    function renderAchievementCard(achievement) {
        const unlocked = isUnlocked(achievement.id);
        const lockedClass = unlocked ? 'unlocked' : 'locked';

        return `
            <div class="achievement-card ${lockedClass}">
                <div class="achievement-icon">${unlocked ? achievement.emoji : '🔒'}</div>
                <div class="achievement-info">
                    <h4 class="achievement-name">${unlocked ? achievement.title : '???'}</h4>
                    <p class="achievement-desc">${unlocked ? achievement.description : 'Locked'}</p>
                    ${unlocked ? `<p class="achievement-quote">"${achievement.tagline}"</p>` : ''}
                </div>
            </div>
        `;
    }

    // ============================================================================
    // TESTING / DEBUG
    // ============================================================================

    function resetAllAchievements() {
        if (confirm('Reset all achievements? This cannot be undone.')) {
            unlockedAchievements = [];
            saveAchievements();
            console.log('🔄 All achievements reset');
            return true;
        }
        return false;
    }

    function unlockAll() {
        Object.keys(ACHIEVEMENTS).forEach(id => {
            if (!isUnlocked(id)) {
                const unlockedData = {
                    id,
                    unlockedAt: new Date().toISOString()
                };
                unlockedAchievements.push(unlockedData);
            }
        });
        saveAchievements();
        console.log('🎉 All achievements unlocked (DEBUG MODE)');
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        init,
        unlock,
        isUnlocked,
        getProgress,
        getUnlockedCount,
        getTotalCount,
        getAllAchievements,
        getAchievementsByTier,
        getAchievementsByModule,
        renderAchievementsView,
        resetAllAchievements,
        unlockAll // DEBUG ONLY
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AchievementSystem.init);
} else {
    AchievementSystem.init();
}
