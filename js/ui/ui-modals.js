function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function showToast(message, color = 'cyan') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const colorMap = {
        cyan: 'border-cyan-400/50 text-cyan-100',
        emerald: 'border-emerald-400/50 text-emerald-100',
        amber: 'border-amber-400/50 text-amber-100',
        rose: 'border-rose-400/50 text-rose-100',
        pink: 'border-pink-400/50 text-pink-100',
        slate: 'border-slate-500/50 text-slate-200'
    };
    toast.className = `glass-panel px-3.5 py-2.5 rounded-2xl border ${colorMap[color] || colorMap.cyan} text-xs font-medium shadow-xl transition-all duration-300 opacity-0 translate-y-2`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3400);
}

function downloadStandaloneHTML() {
    const htmlContent = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Downloaded standalone index.html ready for Cloudflare Pages or Netlify!', 'emerald');
}

// =========================================================================
// COZY HEALING: DAILY FORTUNE BOTTLE & POLAROID PHOTO BOOTH
// =========================================================================

const DAILY_FORTUNES = [
    { text: "Mỗi ngày trôi qua, bạn luôn là điều kỳ diệu và đáng yêu nhất dưới đại dương này! ✨", author: "Bé Axolotl má hồng" },
    { text: "Hãy dịu dàng với chính bản thân mình nhé, hôm nay bạn đã làm rất tốt rồi! 🌸", author: "Đại dương gửi gắm" },
    { text: "Một chú cá nhỏ vừa gửi lời thì thầm: Chúc bạn một ngày ngập tràn nụ cười và bình yên! 🐟💕", author: "Cá Hề Nemo" },
    { text: "Hôm nay chỉ số may mắn của bạn đạt 100%! Hãy tự thưởng cho mình một món ngọt ngào nhé! 🍰", author: "Bạch tuộc Dumbo" },
    { text: "Dù ngoài kia có sóng gió thế nào, bể cá nhỏ này luôn là chốn bình yên chờ đón bạn trở về. 🐚💖", author: "Ngọc trai xà cừ" },
    { text: "Nụ cười rạng rỡ của bạn có thể thắp sáng cả rạn san hô lung linh dưới đáy biển! 🌟", author: "Thần biển cả" },
    { text: "Ước mơ của bạn tựa như chú cá nhỏ bơi ra biển lớn, nhất định sẽ chạm tới bến bờ hạnh phúc! 🌊", author: "Cá Ngựa Rồng" },
    { text: "Bạn xinh đẹp và tỏa sáng theo cách rất riêng của chính mình, hãy luôn tự tin nhé! 💖", author: "Hải quỳ dạ quang" },
    { text: "Hít một hơi thật sâu, ngắm nhìn đàn cá bơi lội và để mọi âu lo tan biến theo bọt nước nào. 🫧", author: "Bác Rùa biển" },
    { text: "Vũ trụ vừa gửi đến bạn một chiếc ôm ấm áp từ lòng đại dương bao la! 🐬✨", author: "Cá Heo xanh" }
];

let lastFortuneDay = null;

function openDailyFortuneModal() {
    let modal = document.getElementById('fortuneBottleModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fortuneBottleModal';
        modal.className = 'fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-md flex items-center justify-center p-4';
        document.body.appendChild(modal);
    }

    const fortune = DAILY_FORTUNES[Math.floor(Math.random() * DAILY_FORTUNES.length)];

    modal.innerHTML = `
        <div class="glass-panel rounded-3xl max-w-md w-full p-6 border border-pink-400/50 shadow-2xl space-y-4 text-center relative overflow-hidden animate-float">
            <div class="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none"></div>
            <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>

            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/30 to-purple-500/30 border border-pink-400/40 mx-auto flex items-center justify-center text-3xl shadow-lg">
                💌
            </div>

            <div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-pink-300 px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30">Chai Thủy Tinh Lời Nhắn</span>
                <h3 class="font-bold text-lg text-white mt-1.5">Thông Điệp Yêu Thương Mỗi Ngày</h3>
            </div>

            <div class="p-4 rounded-2xl bg-slate-900/90 border border-pink-500/30 space-y-2 relative">
                <p class="text-sm text-pink-100 font-medium italic leading-relaxed">
                    "${fortune.text}"
                </p>
                <div class="text-[11px] text-pink-300/80 text-right font-semibold">
                    — ${fortune.author}
                </div>
            </div>

            <div class="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center gap-2 text-xs text-amber-200 font-semibold font-mono-num">
                <i class="ph-fill ph-gift text-base text-amber-300"></i>
                Quà may mắn: +15🪙 AquaCoins & +20 XP!
            </div>

            <button onclick="claimFortuneReward()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition">
                Nhận lời chúc & Đóng
            </button>
        </div>
    `;

    modal.classList.remove('hidden');
    playSound('affection');
}

function claimFortuneReward() {
    const modal = document.getElementById('fortuneBottleModal');
    if (modal) modal.classList.add('hidden');
    lastFortuneDay = new Date().toDateString();
    state.coins += 15;
    addXP(20);
    playSound('coin');
    spawnParticleBurst(cw * 0.5, ch * 0.4, '#f472b6', 16, 'heart');
    updateHUD();
    saveGame(true);
    showToast('✨ Chúc bạn một ngày thật ngọt ngào và tràn đầy năng lượng!', 'pink');
}

// Polaroid Photo Booth
function openPolaroidPhotoBooth() {
    let modal = document.getElementById('polaroidModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'polaroidModal';
        modal.className = 'fixed inset-0 z-50 bg-slate-950/85 backdrop-filter backdrop-blur-md flex items-center justify-center p-4';
        document.body.appendChild(modal);
    }

    // Capture screenshot from active canvas (2D or 3D)
    const activeCanvas = (state.renderMode === '3d' && document.getElementById('threeCanvas'))
        ? document.getElementById('threeCanvas')
        : document.getElementById('aquariumCanvas');

    let dataUrl = '';
    try {
        dataUrl = activeCanvas.toDataURL('image/png');
    } catch (e) {
        console.error('Screenshot capture failed:', e);
    }

    const user = (typeof ProfileManager !== 'undefined') ? ProfileManager.getCurrentUser() : null;
    const userName = user ? (user.displayName || user.username) : 'AquaVerse';
    const dateStr = new Date().toLocaleDateString('vi-VN');

    modal.innerHTML = `
        <div class="max-w-md w-full space-y-3">
            <!-- Vintage Polaroid Frame Card -->
            <div id="polaroid-card" class="bg-slate-100 p-4 pb-6 rounded-2xl shadow-2xl text-slate-800 space-y-3 border-4 border-white relative">
                <!-- Stickers -->
                <span class="absolute -top-3 -left-2 text-2xl select-none filter drop-shadow">🎀</span>
                <span class="absolute -top-2 -right-1 text-xl select-none filter drop-shadow">⭐</span>
                <span class="absolute bottom-3 right-3 text-xl select-none filter drop-shadow">💖</span>

                <!-- Photo Image -->
                <div class="w-full aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden shadow-inner border border-slate-300 relative flex items-center justify-center">
                    ${dataUrl ? `<img src="${dataUrl}" class="w-full h-full object-cover" alt="Aquarium Memory">` : `<div class="text-xs text-slate-400">Đang lưu hình ảnh...</div>`}
                </div>

                <!-- Handwritten Polaroid Caption -->
                <div class="px-1 text-center font-semibold">
                    <div class="text-sm text-slate-800 tracking-tight font-bold">✨ Bể Cá Của ${userName} ✨</div>
                    <div class="text-[10px] text-slate-500 font-mono-num mt-0.5">${dateStr} • AquaVerse Sanctuary</div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
                <button onclick="downloadPolaroidSnapshot('${dataUrl}')" class="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/25 transition">
                    <i class="ph-bold ph-download-simple text-base"></i> Tải ảnh Polaroid về máy
                </button>
                <button onclick="closePolaroidPhotoBooth()" class="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold">
                    Đóng
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    playSound('affection');
}

function closePolaroidPhotoBooth() {
    const modal = document.getElementById('polaroidModal');
    if (modal) modal.classList.add('hidden');
}

function downloadPolaroidSnapshot(dataUrl) {
    if (!dataUrl) {
        showToast('Chưa có ảnh chụp!', 'rose');
        return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `AquaVerse_Polaroid_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('📸 Đã tải ảnh Polaroid về máy thành công!', 'emerald');
}