/**
 * AquaVerse Admin, Dev Tools & Authentication UI
 * Provides full control console for Admin, clean account management for players,
 * and dynamic role-based UI visibility.
 */

// Global modals controller
function openAuthModal() {
    let modal = document.getElementById('authModal');
    if (!modal) {
        createAuthModalDOM();
        modal = document.getElementById('authModal');
    }
    renderAuthModalContent('login');
    modal.classList.remove('hidden');
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('hidden');
}

function openAdminConsole() {
    if (!ProfileManager.isAdmin()) {
        showToast('⚠️ Bạn cần đăng nhập tài khoản Admin để truy cập!', 'rose');
        return;
    }
    let modal = document.getElementById('adminConsoleModal');
    if (!modal) {
        createAdminModalDOM();
        modal = document.getElementById('adminConsoleModal');
    }
    renderAdminConsoleContent();
    modal.classList.remove('hidden');
}

function closeAdminConsole() {
    const modal = document.getElementById('adminConsoleModal');
    if (modal) modal.classList.add('hidden');
}

// Update Top HUD User / Admin Badge
function updateUserProfileHUD() {
    const container = document.getElementById('hud-user-profile-badge');
    if (!container) return;

    const user = ProfileManager.getCurrentUser();
    const isAdmin = ProfileManager.isAdmin();

    if (isAdmin) {
        container.innerHTML = `
            <button onclick="openAdminConsole()" class="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border border-amber-400/50 text-amber-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-amber-500/20" title="Bảng điều khiển Admin & Cheat Tools">
                <i class="ph-fill ph-crown text-amber-300 text-sm"></i>
                <span class="truncate max-w-[80px] sm:max-w-none">Admin</span>
                <span class="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black">DEV</span>
            </button>
        `;
    } else {
        container.innerHTML = `
            <button onclick="openAuthModal()" class="px-2 sm:px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-600/60 text-slate-200 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm" title="Quản lý tài khoản người chơi">
                <i class="ph-fill ph-user-circle text-cyan-300 text-sm"></i>
                <span class="truncate max-w-[70px] sm:max-w-none">${user.displayName || user.username}</span>
            </button>
        `;
    }

    // Toggle Admin-only elements in UI
    const adminScanBtn = document.getElementById('btn-scan-ecosystem');
    if (adminScanBtn) {
        if (isAdmin) {
            adminScanBtn.classList.remove('hidden');
        } else {
            adminScanBtn.classList.add('hidden');
        }
    }

    // Hide turbo 5x speed from regular players to prevent game pacing breakdown
    const turboBtn = document.getElementById('speed-5');
    if (turboBtn) {
        if (isAdmin) {
            turboBtn.classList.remove('hidden');
        } else {
            turboBtn.classList.add('hidden');
            if (simSpeed > 2) setSimSpeed(1);
        }
    }
}

// DOM Templates: Auth Modal
function createAuthModalDOM() {
    const el = document.createElement('div');
    el.id = 'authModal';
    el.className = 'hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-md flex items-center justify-center p-4';
    el.innerHTML = `
        <div class="glass-panel rounded-3xl max-w-md w-full p-5 sm:p-6 border border-cyan-400/30 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div class="flex items-center gap-2.5">
                    <div class="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                        <i class="ph-fill ph-user-switch text-2xl"></i>
                    </div>
                    <div>
                        <h3 id="auth-modal-title" class="font-bold text-lg text-white">Tài khoản Người chơi</h3>
                        <p class="text-xs text-slate-400">Lưu tiến trình bể cá riêng biệt</p>
                    </div>
                </div>
                <button onclick="closeAuthModal()" class="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                    <i class="ph-bold ph-x text-lg"></i>
                </button>
            </div>

            <!-- Tab Switcher -->
            <div class="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button onclick="renderAuthModalContent('login')" id="tab-auth-login" class="py-1.5 rounded-lg transition bg-cyan-500 text-slate-950 font-bold">Đăng nhập</button>
                <button onclick="renderAuthModalContent('register')" id="tab-auth-register" class="py-1.5 rounded-lg transition text-slate-300 hover:text-white">Đăng ký</button>
                <button onclick="renderAuthModalContent('switch')" id="tab-auth-switch" class="py-1.5 rounded-lg transition text-slate-300 hover:text-white">Đổi User</button>
            </div>

            <!-- Content Area -->
            <div id="auth-modal-body" class="space-y-3 pt-1"></div>
        </div>
    `;
    document.body.appendChild(el);
}

function renderAuthModalContent(mode = 'login') {
    const body = document.getElementById('auth-modal-body');
    const tabLogin = document.getElementById('tab-auth-login');
    const tabRegister = document.getElementById('tab-auth-register');
    const tabSwitch = document.getElementById('tab-auth-switch');

    [tabLogin, tabRegister, tabSwitch].forEach(t => {
        if (t) {
            t.className = 'py-1.5 rounded-lg transition text-slate-300 hover:text-white';
        }
    });

    if (mode === 'login') {
        if (tabLogin) tabLogin.className = 'py-1.5 rounded-lg transition bg-cyan-500 text-slate-950 font-bold';
        body.innerHTML = `
            <form onsubmit="handleLoginSubmit(event)" class="space-y-3">
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Tên đăng nhập (Username):</label>
                    <input type="text" id="auth-input-username" required placeholder="admin hoặc player1" class="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu (Password):</label>
                    <input type="password" id="auth-input-password" required placeholder="••••••••" class="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none">
                </div>
                <div class="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-200 leading-relaxed">
                    💡 <b>Tài khoản Admin mẫu:</b> <code>admin</code> / <code>admin888</code> (Mở toàn bộ công cụ Cheat & Dev)<br>
                    💡 <b>Người chơi thường:</b> <code>player1</code> / <code>123456</code>
                </div>
                <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition">
                    Đăng nhập vào Bể Cá
                </button>
            </form>
        `;
    } else if (mode === 'register') {
        if (tabRegister) tabRegister.className = 'py-1.5 rounded-lg transition bg-cyan-500 text-slate-950 font-bold';
        body.innerHTML = `
            <form onsubmit="handleRegisterSubmit(event)" class="space-y-3">
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Tên hiển thị (Tùy chọn):</label>
                    <input type="text" id="auth-input-display" placeholder="Ví dụ: Bé Cá Nemo" class="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Tên đăng nhập (Username):</label>
                    <input type="text" id="auth-input-reg-user" required placeholder="Từ 3 ký tự trở lên" class="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu (Password):</label>
                    <input type="password" id="auth-input-reg-pass" required placeholder="Từ 4 ký tự" class="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none">
                </div>
                <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition">
                    Tạo tài khoản & Bắt đầu nuôi cá
                </button>
            </form>
        `;
    } else if (mode === 'switch') {
        if (tabSwitch) tabSwitch.className = 'py-1.5 rounded-lg transition bg-cyan-500 text-slate-950 font-bold';
        const profiles = ProfileManager.getAllProfiles();
        const cur = ProfileManager.getCurrentUser();
        body.innerHTML = `
            <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                ${profiles.map(p => {
                    const isCur = p.username === cur.username;
                    return `
                        <div class="p-2.5 rounded-xl bg-slate-900/80 border ${isCur ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-800'} flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2 min-w-0">
                                <i class="ph-fill ${p.role === 'admin' ? 'ph-crown text-amber-400' : 'ph-user text-cyan-400'} text-lg"></i>
                                <div class="truncate">
                                    <div class="font-bold text-xs text-white truncate">${p.displayName || p.username}</div>
                                    <div class="text-[10px] text-slate-400 font-mono-num">@${p.username} • ${p.role.toUpperCase()}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                                ${isCur ? `
                                    <span class="text-[10px] font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/30">Đang chọn</span>
                                ` : `
                                    <button onclick="handleQuickSwitch('${p.username}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200">
                                        Chọn
                                    </button>
                                `}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="pt-2 border-t border-slate-800 flex justify-between">
                <button onclick="handleLogout()" class="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-300 text-xs font-semibold">
                    Đăng xuất
                </button>
                <button onclick="closeAuthModal()" class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">
                    Đóng
                </button>
            </div>
        `;
    }
}

// Authentication Handlers
function handleLoginSubmit(e) {
    e.preventDefault();
    const u = document.getElementById('auth-input-username').value;
    const p = document.getElementById('auth-input-password').value;

    const res = ProfileManager.login(u, p);
    if (!res.success) {
        showToast(res.message, 'rose');
        return;
    }

    closeAuthModal();
    saveGame(true); // Save current state before switching
    loadGame();     // Load target user's aquarium
    updateUserProfileHUD();
    updateHUD();
    if (typeof syncDecorations3D === 'function') syncDecorations3D();
    showToast(`Đã đăng nhập: ${res.session.displayName || res.session.username} (${res.session.role.toUpperCase()})!`, 'emerald');
}

function handleRegisterSubmit(e) {
    e.preventDefault();
    const disp = document.getElementById('auth-input-display').value;
    const u = document.getElementById('auth-input-reg-user').value;
    const p = document.getElementById('auth-input-reg-pass').value;

    const res = ProfileManager.register(u, p, disp);
    if (!res.success) {
        showToast(res.message, 'rose');
        return;
    }

    closeAuthModal();
    initStarterAquarium(); // Fresh starter tank for new user
    saveGame(true);
    updateUserProfileHUD();
    updateHUD();
    if (typeof syncDecorations3D === 'function') syncDecorations3D();
    showToast(`Chào mừng ${res.session.displayName}! Bạn đã nhận được một bể cá mới và 380 AquaCoins!`, 'emerald');
}

function handleQuickSwitch(username) {
    saveGame(true);
    if (ProfileManager.switchUser(username)) {
        loadGame();
        updateUserProfileHUD();
        updateHUD();
        if (typeof syncDecorations3D === 'function') syncDecorations3D();
        renderAuthModalContent('switch');
        showToast(`Đã chuyển sang tài khoản @${username}!`, 'cyan');
    }
}

function handleLogout() {
    saveGame(true);
    ProfileManager.logout();
    loadGame();
    updateUserProfileHUD();
    updateHUD();
    if (typeof syncDecorations3D === 'function') syncDecorations3D();
    closeAuthModal();
    showToast('Đã đăng xuất về chế độ Khách mặc định.', 'slate');
}

// =========================================================================
// ADMIN & DEV CONSOLE
// =========================================================================

function createAdminModalDOM() {
    const el = document.createElement('div');
    el.id = 'adminConsoleModal';
    el.className = 'hidden fixed inset-0 z-50 bg-slate-950/85 backdrop-filter backdrop-blur-md flex items-center justify-center p-4';
    el.innerHTML = `
        <div class="glass-panel rounded-3xl max-w-xl w-full p-5 sm:p-6 border border-amber-400/40 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div class="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <div class="flex items-center gap-2.5">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                        <i class="ph-fill ph-crown text-2xl"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-lg text-white">Admin & Developer Console</h3>
                            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold">FULL ACCESS</span>
                        </div>
                        <p class="text-xs text-slate-400">Công cụ kiểm thử, hack tài nguyên & mô phỏng chuyên sâu</p>
                    </div>
                </div>
                <button onclick="closeAdminConsole()" class="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                    <i class="ph-bold ph-x text-lg"></i>
                </button>
            </div>

            <div id="admin-console-body" class="space-y-4"></div>
        </div>
    `;
    document.body.appendChild(el);
}

function renderAdminConsoleContent() {
    const body = document.getElementById('admin-console-body');
    if (!body) return;

    body.innerHTML = `
        <!-- Section 1: Resource & Level Cheats -->
        <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <i class="ph-fill ph-coins"></i> Cheat Tiền tệ & Cấp độ
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onclick="adminCheatCoins(1000)" class="py-2 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold transition flex items-center justify-center gap-1">
                    +1,000🪙
                </button>
                <button onclick="adminCheatCoins(10000)" class="py-2 px-2.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/50 text-amber-200 text-xs font-bold transition flex items-center justify-center gap-1">
                    +10,000🪙
                </button>
                <button onclick="adminLevelUp(1)" class="py-2 px-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold transition flex items-center justify-center gap-1">
                    +1 Level
                </button>
                <button onclick="adminLevelUp(5)" class="py-2 px-2.5 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-200 text-xs font-bold transition flex items-center justify-center gap-1">
                    +5 Level
                </button>
            </div>
        </div>

        <!-- Section 2: Lifecycle & Hatching Controls -->
        <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <i class="ph-fill ph-egg"></i> Thúc đẩy Vòng đời Sinh vật
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button onclick="adminInstantHatch()" class="py-2 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-semibold transition">
                    🐣 Nở tất cả Trứng
                </button>
                <button onclick="adminInstantAdult()" class="py-2 px-2.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/50 text-emerald-200 text-xs font-semibold transition">
                    👑 Lên Trưởng thành
                </button>
                <button onclick="adminFeedAll()" class="py-2 px-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-semibold transition">
                    🍗 No nê 100%
                </button>
            </div>
        </div>

        <!-- Section 3: Water & Tank Maintenance -->
        <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <i class="ph-fill ph-drop"></i> Môi trường & Hệ sinh thái
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button onclick="adminPurifyWater()" class="py-2 px-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-semibold transition">
                    💧 Nước 100% & Sạch cặn
                </button>
                <button onclick="scanAndSyncEcosystem(true)" class="py-2 px-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 text-xs font-semibold transition">
                    🌿 Quét & Sinh tất cả loài
                </button>
                <button onclick="adminUnlockAllDex()" class="py-2 px-2.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/40 text-fuchsia-200 text-xs font-semibold transition">
                    🧬 Mở full FishDex
                </button>
            </div>
        </div>

        <!-- Section 4: Trigger Tank Events -->
        <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2.5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <i class="ph-fill ph-lightning"></i> Kích hoạt Sự kiện Hồ cá
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onclick="adminTriggerEvent('golden_hour')" class="py-1.5 px-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs font-medium">
                    ☀️ Golden Hour
                </button>
                <button onclick="adminTriggerEvent('algae_bloom')" class="py-1.5 px-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-medium">
                    🌿 Bùng tảo
                </button>
                <button onclick="adminTriggerEvent('heat_wave')" class="py-1.5 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 text-xs font-medium">
                    🔥 Sóng nhiệt
                </button>
                <button onclick="adminTriggerEvent('clear')" class="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium">
                    ✕ Xóa sự kiện
                </button>
            </div>
        </div>

        <!-- Section 5: Account Management (Admin Overview) -->
        <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2.5">
            <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <i class="ph-fill ph-users"></i> Danh sách Tài khoản Đã lưu
                </h4>
                <button onclick="openAuthModal()" class="text-xs text-cyan-300 hover:underline">+ Tạo/Đổi User</button>
            </div>
            <div class="space-y-1.5 max-h-40 overflow-y-auto">
                ${ProfileManager.getAllProfiles().map(p => `
                    <div class="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                            <span class="font-bold text-white">${p.displayName || p.username}</span>
                            <span class="text-[10px] text-slate-400 ml-1">(@${p.username})</span>
                            <span class="text-[9px] px-1.5 py-0.2 rounded font-bold ml-1 ${p.role === 'admin' ? 'bg-amber-500/30 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'}">${p.role.toUpperCase()}</span>
                        </div>
                        ${p.username !== 'admin' ? `
                            <button onclick="adminDeleteUser('${p.username}')" class="text-rose-400 hover:text-rose-300 text-xs" title="Xóa tài khoản này">
                                <i class="ph-bold ph-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="flex justify-between items-center pt-2">
            <button onclick="adminResetCurrentTank()" class="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/40 text-rose-300 font-bold text-xs transition">
                💥 Reset Bể về Mặc định
            </button>
            <button onclick="closeAdminConsole()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold">
                Đóng Console
            </button>
        </div>
    `;
}

// Admin Action Implementations
function adminCheatCoins(amount) {
    state.coins += amount;
    addFloatingText(cw * 0.5, ch * 0.4, `+${amount}🪙 ADMIN CHEAT`, '#fbbf24');
    playSound('coin');
    updateHUD();
    saveGame(true);
    showToast(`👑 Admin: Đã nạp +${amount}🪙 AquaCoins!`, 'amber');
}

function adminLevelUp(levels = 1) {
    state.level += levels;
    state.xp = 0;
    playSound('levelup');
    updateHUD();
    saveGame(true);
    showToast(`👑 Admin: Đã tăng +${levels} Level (Hiện tại: LVL ${state.level})!`, 'cyan');
}

function adminInstantHatch() {
    let hatched = 0;
    state.fish.forEach(f => {
        if (f.stage === 'egg') {
            f.stage = 'fry';
            f.maturity = 16;
            f.growthTimer = 1.0;
            hatched++;
        }
    });
    playSound('hatch');
    updateHUD();
    saveGame(true);
    showToast(`👑 Admin: Đã kích nở ngay lập tức ${hatched} quả trứng!`, 'emerald');
}

function adminInstantAdult() {
    let promoted = 0;
    state.fish.forEach(f => {
        if (f.stage !== 'adult') {
            f.stage = 'adult';
            f.maturity = 100;
            f.growthTimer = 1.0;
            promoted++;
        }
    });
    playSound('levelup');
    updateHUD();
    saveGame(true);
    showToast(`👑 Admin: Đã nâng cấp ${promoted} cá con/nhỡ lên Trưởng thành!`, 'amber');
}

function adminFeedAll() {
    state.fish.forEach(f => {
        f.hunger = 100;
        f.health = 100;
    });
    updateHUD();
    saveGame(true);
    showToast('👑 Admin: Toàn bộ cá trong bể đã no 100% và đầy máu!', 'emerald');
}

function adminPurifyWater() {
    state.waterQuality = 100;
    state.waste = [];
    playSound('clean');
    updateHUD();
    saveGame(true);
    showToast('👑 Admin: Nước đạt 100% pha lê và siphoned sạch cặn đáy!', 'cyan');
}

function adminUnlockAllDex() {
    if (!state.discoveredDex) state.discoveredDex = {};
    Object.keys(SPECIES_CATALOG).forEach(spId => {
        ['normal', 'lustre', 'prism', 'cosmic'].forEach(morph => {
            recordDexDiscovery(spId, morph);
        });
    });
    updateHUD();
    saveGame(true);
    showToast('👑 Admin: Đã mở khóa 100% toàn bộ loài và biến dị trong FishDex!', 'pink');
}

function adminTriggerEvent(eventId) {
    if (eventId === 'clear') {
        activeTankEvent = null;
        showToast('Đã hủy sự kiện môi trường.', 'slate');
    } else {
        const defs = {
            golden_hour: { id: 'golden_hour', title: 'Golden Hour (2x Growth & XP)', banner: 'Tia sáng vàng rực rỡ • Sinh trưởng & XP gấp 2!', duration: 60, remaining: 60, color: 'text-amber-300 border-amber-400/50 bg-amber-500/20', icon: 'ph-sun' },
            algae_bloom: { id: 'algae_bloom', title: 'Algae Bloom Outbreak', banner: 'Tảo bùng phát • Dọn cặn nhận x2 tiền!', duration: 45, remaining: 45, color: 'text-emerald-300 border-emerald-400/50 bg-emerald-500/20', icon: 'ph-plant' },
            heat_wave: { id: 'heat_wave', title: 'Tropical Heat Wave', banner: 'Nhiệt độ tăng • Cá bơi năng động & tiêu hao đói nhanh!', duration: 50, remaining: 50, color: 'text-rose-300 border-rose-400/50 bg-rose-500/20', icon: 'ph-thermometer-hot' }
        };
        activeTankEvent = defs[eventId] || null;
        if (activeTankEvent) showToast(`👑 Admin: Đã kích hoạt sự kiện: ${activeTankEvent.title}!`, 'purple');
    }
    updateHUD();
}

function adminDeleteUser(username) {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản @${username}?`)) return;
    const res = ProfileManager.deleteProfile(username);
    if (!res.success) {
        showToast(res.message, 'rose');
    } else {
        showToast(`Đã xóa tài khoản @${username}!`, 'slate');
        renderAdminConsoleContent();
    }
}

function adminResetCurrentTank() {
    if (!confirm('Khởi tạo lại toàn bộ bể cá này về trạng thái sơ cấp?')) return;
    initStarterAquarium();
    saveGame(true);
    closeAdminConsole();
    updateHUD();
    if (typeof syncDecorations3D === 'function') syncDecorations3D();
    showToast('Bể cá đã được reset về mặc định!', 'amber');
}
