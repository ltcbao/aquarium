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