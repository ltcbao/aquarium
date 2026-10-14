function toggleVacationMode() {
    state.vacationMode = !state.vacationMode;
    showToast(state.vacationMode ? '🏖️ Vacation Feeder Mode enabled!' : 'Vacation Mode disabled.', 'cyan');
    renderDrawerContent();
    saveGame(true);
}

function copySaveToClipboard() {
    const area = document.getElementById('save-json-textarea');
    if (!area) return;
    area.select();
    document.execCommand('copy');
    showToast('Save JSON copied to clipboard!', 'emerald');
}

function exportSaveJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `aquaverse_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Downloaded aquarium backup JSON file!', 'emerald');
}

function importSaveFromTextarea() {
    const area = document.getElementById('save-json-textarea');
    if (!area) return;
    try {
        const parsed = JSON.parse(area.value);
        if (!parsed || !Array.isArray(parsed.fish)) throw new Error('Invalid save schema');
        state = parsed;
        saveGame(true);
        updateHUD();
        renderDrawerContent();
        showToast('Aquarium state restored from JSON!', 'emerald');
    } catch (e) {
        showToast('Invalid JSON format. Please check your backup string.', 'rose');
    }
}

let resetConfirmArmed = false;
function resetAquariumConfirm() {
    const btn = document.getElementById('btn-reset-tank');
    if (!resetConfirmArmed) {
        resetConfirmArmed = true;
        if (btn) btn.textContent = 'Click Again to Confirm';
        setTimeout(() => {
            resetConfirmArmed = false;
            if (btn) btn.textContent = 'Reset Tank';
        }, 4000);
        return;
    }
    resetConfirmArmed = false;
    initStarterAquarium();
    saveGame(true);
    closeInspector();
    updateHUD();
    renderDrawerContent();
    showToast('Aquarium reset to fresh starter tank!', 'amber');
}

