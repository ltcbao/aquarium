/**
 * AquaVerse Profile & Authentication Manager
 * Handles multi-user profiles, simple authentication, role management ('admin' vs 'user'),
 * and partitioned per-user persistent saves.
 */

const ProfileManager = (function () {
    const PROFILES_KEY = 'aquaverse_profiles_index';
    const SESSION_KEY = 'aquaverse_current_session';

    // Simple hashing for client-side password verification
    function hashPassword(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }
        return 'h_' + Math.abs(hash).toString(36);
    }

    // Default Seed Profiles (Admin default: admin / admin888)
    function getStoredProfiles() {
        try {
            const raw = localStorage.getItem(PROFILES_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') return parsed;
            }
        } catch (e) {
            console.error('Error reading profiles:', e);
        }

        // Initialize default admin and guest/player demo
        const initial = {
            'admin': {
                username: 'admin',
                displayName: 'Administrator',
                role: 'admin',
                passwordHash: hashPassword('admin888'),
                createdAt: Date.now(),
                lastLoginAt: Date.now()
            },
            'player1': {
                username: 'player1',
                displayName: 'Người chơi 1',
                role: 'user',
                passwordHash: hashPassword('123456'),
                createdAt: Date.now(),
                lastLoginAt: Date.now()
            }
        };
        saveProfiles(initial);
        return initial;
    }

    function saveProfiles(profiles) {
        try {
            localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
        } catch (e) {
            console.error('Error saving profiles:', e);
        }
    }

    // Current Session Management
    function getCurrentSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (raw) {
                const session = JSON.parse(raw);
                if (session && session.username) return session;
            }
        } catch (e) {
            console.error('Error reading session:', e);
        }

        // Default to player1 or admin
        const profiles = getStoredProfiles();
        const defaultUser = profiles['player1'] || profiles['admin'];
        const session = {
            username: defaultUser.username,
            role: defaultUser.role,
            displayName: defaultUser.displayName
        };
        setCurrentSession(session);
        return session;
    }

    function setCurrentSession(session) {
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch (e) {
            console.error('Error setting session:', e);
        }
    }

    return {
        init() {
            getStoredProfiles();
            getCurrentSession();
        },

        getCurrentUser() {
            return getCurrentSession();
        },

        isAdmin() {
            const cur = getCurrentSession();
            return cur && cur.role === 'admin';
        },

        getSaveKey(username) {
            const uname = (username || getCurrentSession().username || 'player1').toLowerCase().trim();
            return `aquaverse_save_user_${uname}`;
        },

        login(username, password) {
            const u = (username || '').trim().toLowerCase();
            const p = (password || '').trim();
            if (!u || !p) {
                return { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!' };
            }

            const profiles = getStoredProfiles();
            const profile = profiles[u];
            if (!profile) {
                return { success: false, message: 'Tài khoản không tồn tại. Vui lòng đăng ký mới!' };
            }

            if (profile.passwordHash !== hashPassword(p)) {
                return { success: false, message: 'Mật khẩu không chính xác!' };
            }

            profile.lastLoginAt = Date.now();
            profiles[u] = profile;
            saveProfiles(profiles);

            const session = {
                username: profile.username,
                role: profile.role,
                displayName: profile.displayName || profile.username
            };
            setCurrentSession(session);

            return { success: true, session };
        },

        register(username, password, displayName = '') {
            const u = (username || '').trim().toLowerCase();
            const p = (password || '').trim();
            if (!u || u.length < 3) {
                return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' };
            }
            if (!p || p.length < 4) {
                return { success: false, message: 'Mật khẩu phải có ít nhất 4 ký tự!' };
            }

            const profiles = getStoredProfiles();
            if (profiles[u]) {
                return { success: false, message: 'Tên đăng nhập này đã tồn tại!' };
            }

            // Regular user registration is always role 'user'
            const newProfile = {
                username: u,
                displayName: displayName.trim() || u,
                role: 'user',
                passwordHash: hashPassword(p),
                createdAt: Date.now(),
                lastLoginAt: Date.now()
            };

            profiles[u] = newProfile;
            saveProfiles(profiles);

            const session = {
                username: newProfile.username,
                role: newProfile.role,
                displayName: newProfile.displayName
            };
            setCurrentSession(session);

            return { success: true, session };
        },

        switchUser(username) {
            const u = (username || '').trim().toLowerCase();
            const profiles = getStoredProfiles();
            if (!profiles[u]) return false;

            const profile = profiles[u];
            profile.lastLoginAt = Date.now();
            saveProfiles(profiles);

            setCurrentSession({
                username: profile.username,
                role: profile.role,
                displayName: profile.displayName || profile.username
            });
            return true;
        },

        logout() {
            // Default back to player1
            this.switchUser('player1');
        },

        getAllProfiles() {
            const profiles = getStoredProfiles();
            return Object.values(profiles).map(p => ({
                username: p.username,
                displayName: p.displayName || p.username,
                role: p.role,
                createdAt: p.createdAt,
                lastLoginAt: p.lastLoginAt
            }));
        },

        deleteProfile(username) {
            const u = (username || '').trim().toLowerCase();
            if (u === 'admin') return { success: false, message: 'Không thể xóa tài khoản Admin mặc định!' };
            const profiles = getStoredProfiles();
            if (!profiles[u]) return { success: false, message: 'Tài khoản không tồn tại!' };

            delete profiles[u];
            saveProfiles(profiles);
            try {
                localStorage.removeItem(this.getSaveKey(u));
            } catch (e) { }

            if (getCurrentSession().username === u) {
                this.switchUser('player1');
            }
            return { success: true };
        }
    };
})();

// Auto-initialize profile manager immediately
ProfileManager.init();
