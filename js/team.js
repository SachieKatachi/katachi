// ============================================================================
// KATACHI - TEAM MODULE
// Manage staff, assign roles, track permissions, and coordinate your crew
// ============================================================================

const TeamModule = (() => {
    const STORAGE_KEY = 'k_team';
    let teamMembers = [];
    let currentMemberId = null;

    // ============================================================================
    // ROLES & PERMISSIONS
    // ============================================================================

    const ROLES = {
        OWNER: {
            name: 'Owner',
            permissions: ['all'],
            level: 100
        },
        MANAGER: {
            name: 'Manager',
            permissions: ['recipes', 'prep', 'inventory', 'orders', 'vendors', 'costing', 'pricing', 'team_view', 'standards', 'analytics'],
            level: 80
        },
        HEAD_CHEF: {
            name: 'Head Chef',
            permissions: ['recipes', 'prep', 'inventory', 'orders', 'standards'],
            level: 60
        },
        SOUS_CHEF: {
            name: 'Sous Chef',
            permissions: ['recipes', 'prep', 'orders', 'standards_view'],
            level: 50
        },
        LINE_COOK: {
            name: 'Line Cook',
            permissions: ['prep_view', 'orders_view'],
            level: 30
        },
        PREP_COOK: {
            name: 'Prep Cook',
            permissions: ['prep', 'recipes_view'],
            level: 20
        },
        STAFF: {
            name: 'Staff',
            permissions: ['orders_view'],
            level: 10
        }
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        loadTeam();
        renderTeamView();
        attachEventListeners();
        console.log('✅ Team module initialized');
    }

    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================

    function loadTeam() {
        const stored = localStorage.getItem(STORAGE_KEY);
        teamMembers = stored ? JSON.parse(stored) : [];
    }

    function saveTeam() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(teamMembers));
    }

    function generateId() {
        return 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ============================================================================
    // TEAM MEMBER CRUD
    // ============================================================================

    function addMember(data) {
        const newMember = {
            id: generateId(),
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            role: data.role || 'STAFF',
            station: data.station || null, // Hot Line, Cold Line, Pastry, etc.
            startDate: data.startDate || new Date().toISOString(),
            status: 'active', // active, inactive, on_leave
            avatar: data.avatar || null,
            notes: data.notes || '',
            schedule: data.schedule || [], // Array of shifts
            certifications: data.certifications || [],
            emergencyContact: data.emergencyContact || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastActive: null
        };

        teamMembers.unshift(newMember);
        saveTeam();

        // Achievement check: Team Lead
        if (teamMembers.length === 1) {
            checkAchievement('team_lead');
        }

        return newMember;
    }

    function updateMember(memberId, updates) {
        const member = teamMembers.find(m => m.id === memberId);
        if (!member) return null;

        Object.assign(member, updates, {
            updatedAt: new Date().toISOString()
        });

        saveTeam();
        return member;
    }

    function deleteMember(memberId) {
        const index = teamMembers.findIndex(m => m.id === memberId);
        if (index === -1) return false;

        teamMembers.splice(index, 1);
        saveTeam();
        return true;
    }

    function getMember(memberId) {
        return teamMembers.find(m => m.id === memberId);
    }

    function toggleMemberStatus(memberId) {
        const member = getMember(memberId);
        if (!member) return null;

        member.status = member.status === 'active' ? 'inactive' : 'active';
        member.updatedAt = new Date().toISOString();
        saveTeam();
        return member;
    }

    // ============================================================================
    // PERMISSIONS
    // ============================================================================

    function hasPermission(memberId, permission) {
        const member = getMember(memberId);
        if (!member) return false;

        const role = ROLES[member.role];
        if (!role) return false;

        // Owner has all permissions
        if (role.permissions.includes('all')) return true;

        // Check specific permission or view variant
        return role.permissions.includes(permission) || 
               role.permissions.includes(permission.replace('_view', ''));
    }

    function getPermissions(memberId) {
        const member = getMember(memberId);
        if (!member) return [];

        const role = ROLES[member.role];
        return role ? role.permissions : [];
    }

    function canManageTeam(memberId) {
        return hasPermission(memberId, 'team') || hasPermission(memberId, 'all');
    }

    // ============================================================================
    // FILTERING & STATS
    // ============================================================================

    function filterByRole(role) {
        return teamMembers.filter(m => m.role === role);
    }

    function filterByStation(station) {
        return teamMembers.filter(m => m.station === station);
    }

    function filterByStatus(status) {
        return teamMembers.filter(m => m.status === status);
    }

    function getActiveMembers() {
        return teamMembers.filter(m => m.status === 'active');
    }

    function getTeamStats() {
        const total = teamMembers.length;
        const active = getActiveMembers().length;
        const inactive = teamMembers.filter(m => m.status === 'inactive').length;
        const onLeave = teamMembers.filter(m => m.status === 'on_leave').length;

        const roleBreakdown = {};
        Object.keys(ROLES).forEach(role => {
            roleBreakdown[role] = teamMembers.filter(m => m.role === role).length;
        });

        return {
            total,
            active,
            inactive,
            onLeave,
            roleBreakdown
        };
    }

    function getStationCoverage() {
        const stations = {};
        teamMembers.forEach(member => {
            if (member.station && member.status === 'active') {
                stations[member.station] = (stations[member.station] || 0) + 1;
            }
        });
        return stations;
    }

    // ============================================================================
    // SCHEDULE MANAGEMENT
    // ============================================================================

    function addShift(memberId, shift) {
        const member = getMember(memberId);
        if (!member) return null;

        if (!member.schedule) {
            member.schedule = [];
        }

        member.schedule.push({
            id: generateId(),
            day: shift.day, // 'monday', 'tuesday', etc.
            startTime: shift.startTime,
            endTime: shift.endTime,
            station: shift.station || member.station
        });

        saveTeam();
        return member;
    }

    function removeShift(memberId, shiftId) {
        const member = getMember(memberId);
        if (!member) return null;

        const index = member.schedule.findIndex(s => s.id === shiftId);
        if (index === -1) return null;

        member.schedule.splice(index, 1);
        saveTeam();
        return member;
    }

    function getSchedule(day = null) {
        const schedule = {};

        teamMembers.forEach(member => {
            if (member.status !== 'active') return;
            if (!member.schedule || member.schedule.length === 0) return;

            member.schedule.forEach(shift => {
                if (day && shift.day !== day) return;

                if (!schedule[shift.day]) {
                    schedule[shift.day] = [];
                }

                schedule[shift.day].push({
                    member: member.name,
                    memberId: member.id,
                    station: shift.station,
                    startTime: shift.startTime,
                    endTime: shift.endTime
                });
            });
        });

        return schedule;
    }

    // ============================================================================
    // ACHIEVEMENT SYSTEM HOOKS
    // ============================================================================

    function checkAchievement(type) {
        if (typeof AchievementSystem === 'undefined') return;

        switch(type) {
            case 'team_lead':
                if (teamMembers.length >= 1) {
                    AchievementSystem.unlock('team_lead');
                }
                break;
        }
    }

    // ============================================================================
    // UI RENDERING
    // ============================================================================

    function renderTeamView() {
        const container = document.getElementById('team-container');
        if (!container) return;

        if (teamMembers.length === 0) {
            container.innerHTML = renderEmptyState();
            return;
        }

        const stats = getTeamStats();

        const html = `
            <div class="team-header">
                <div>
                    <h2 data-en="Team" data-ja="チーム">Team</h2>
                    <div class="team-stats-row">
                        <span class="stat">${stats.total} members</span>
                        <span class="stat stat-active">${stats.active} active</span>
                        ${stats.onLeave > 0 ? `<span class="stat">${stats.onLeave} on leave</span>` : ''}
                    </div>
                </div>
                <button class="btn-primary" id="add-member-btn">
                    <span data-en="+ Add Member" data-ja="+ メンバー追加">+ Add Member</span>
                </button>
            </div>

            <div class="team-tabs">
                <button class="tab-btn active" data-tab="members">Team Members</button>
                <button class="tab-btn" data-tab="schedule">Schedule</button>
                <button class="tab-btn" data-tab="roles">Roles & Permissions</button>
            </div>

            <div class="tab-content" id="members-tab">
                ${renderMembersGrid()}
            </div>

            <div class="tab-content" id="schedule-tab" style="display: none;">
                ${renderScheduleView()}
            </div>

            <div class="tab-content" id="roles-tab" style="display: none;">
                ${renderRolesView()}
            </div>
        `;

        container.innerHTML = html;
    }

    function renderMembersGrid() {
        return `
            <div class="team-filters">
                <select id="filter-role">
                    <option value="">All Roles</option>
                    ${Object.keys(ROLES).map(role => `<option value="${role}">${ROLES[role].name}</option>`).join('')}
                </select>
                <select id="filter-status">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                </select>
            </div>

            <div class="team-grid">
                ${teamMembers.map(member => renderMemberCard(member)).join('')}
            </div>
        `;
    }

    function renderMemberCard(member) {
        const statusClass = `status-${member.status}`;
        const roleInfo = ROLES[member.role];

        return `
            <div class="member-card ${statusClass}" data-member-id="${member.id}">
                <div class="member-avatar">
                    ${member.avatar || getInitials(member.name)}
                </div>
                <div class="member-info">
                    <h3>${member.name}</h3>
                    <div class="member-role-badge">${roleInfo.name}</div>
                    ${member.station ? `<div class="member-station">📍 ${member.station}</div>` : ''}
                </div>
                <div class="member-meta">
                    ${member.email ? `<div>✉️ ${member.email}</div>` : ''}
                    ${member.phone ? `<div>📞 ${member.phone}</div>` : ''}
                </div>
                <div class="member-status-badge ${statusClass}">
                    ${member.status === 'active' ? '✅ Active' : 
                      member.status === 'on_leave' ? '🏖️ On Leave' : '⏸️ Inactive'}
                </div>
                <div class="member-actions">
                    <button class="btn-sm btn-secondary edit-member" data-member-id="${member.id}">Edit</button>
                    <button class="btn-sm btn-secondary toggle-status" data-member-id="${member.id}">
                        ${member.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        `;
    }

    function renderScheduleView() {
        const schedule = getSchedule();
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        return `
            <div class="schedule-calendar">
                ${days.map(day => `
                    <div class="schedule-day">
                        <h3>${day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                        <div class="schedule-shifts">
                            ${schedule[day] ? schedule[day].map(shift => `
                                <div class="shift-card">
                                    <strong>${shift.member}</strong>
                                    <div>${shift.station}</div>
                                    <div class="shift-time">${shift.startTime} - ${shift.endTime}</div>
                                </div>
                            `).join('') : '<p class="no-shifts">No shifts scheduled</p>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderRolesView() {
        return `
            <div class="roles-overview">
                <h3>Roles & Permissions</h3>
                <div class="roles-grid">
                    ${Object.entries(ROLES).map(([key, role]) => `
                        <div class="role-card">
                            <h4>${role.name}</h4>
                            <div class="role-level">Level ${role.level}</div>
                            <div class="role-permissions">
                                <strong>Permissions:</strong>
                                <ul>
                                    ${role.permissions.slice(0, 5).map(p => `<li>${p}</li>`).join('')}
                                    ${role.permissions.length > 5 ? `<li>+ ${role.permissions.length - 5} more</li>` : ''}
                                </ul>
                            </div>
                            <div class="role-count">
                                ${teamMembers.filter(m => m.role === key).length} team members
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3 data-en="No Team Members Yet" data-ja="チームメンバーがいません">No Team Members Yet</h3>
                <p data-en="Add your team to coordinate and assign tasks" 
                   data-ja="チームを追加してタスクを調整および割り当てます">
                    Add your team to coordinate and assign tasks
                </p>
                <button class="btn-primary" id="add-first-member">
                    <span data-en="Add First Member" data-ja="最初のメンバーを追加">Add First Member</span>
                </button>
            </div>
        `;
    }

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================

    function attachEventListeners() {
        const container = document.getElementById('team-container');
        if (!container) return;

        container.addEventListener('click', (e) => {
            if (e.target.closest('#add-member-btn') || e.target.closest('#add-first-member')) {
                showAddMemberModal();
            }

            if (e.target.closest('.edit-member')) {
                const memberId = e.target.closest('.edit-member').dataset.memberId;
                showEditMemberModal(memberId);
            }

            if (e.target.closest('.toggle-status')) {
                const memberId = e.target.closest('.toggle-status').dataset.memberId;
                toggleMemberStatus(memberId);
                renderTeamView();
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

    function showAddMemberModal() {
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'add-member' }}));
    }

    function showEditMemberModal(memberId) {
        currentMemberId = memberId;
        window.dispatchEvent(new CustomEvent('openModal', { detail: { modal: 'edit-member', memberId }}));
    }

    // ============================================================================
    // UTILITIES
    // ============================================================================

    function getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        init,
        addMember,
        updateMember,
        deleteMember,
        getMember,
        toggleMemberStatus,
        hasPermission,
        getPermissions,
        canManageTeam,
        filterByRole,
        filterByStation,
        getActiveMembers,
        getTeamStats,
        getStationCoverage,
        addShift,
        removeShift,
        getSchedule,
        renderTeamView,
        getAllMembers: () => teamMembers,
        ROLES
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', TeamModule.init);
} else {
    TeamModule.init();
}
