// Pace — Interface do utilizador

/* ── DOM cache ──────────────────────────────────────────────── */
const _domCache = {};
function $(id) {
  const cached = _domCache[id];
  if (cached && cached.isConnected) return cached;
  const el = document.getElementById(id);
  if (el) _domCache[id] = el;
  else delete _domCache[id];
  return el;
}

/* ── Toast notifications ────────────────────────────────────── */
const TOAST_ICONS = {
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>`,
  info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  warn:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  focus:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>`,
  goal:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
};

let toastId = 0;
function toastHtml(text) {
  return escHtml(text).replace(/\n/g, '<br>');
}

function showToast(type = 'info', title = '', msg = '', ms = 5000) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return -1;
  const id = ++toastId;
  const el = document.createElement('div');
  el.className = `toast`;
  el.dataset.id = id;
  el.innerHTML = `
    <div class="toast-icon ${type}">${TOAST_ICONS[type] || ''}</div>
    <div class="toast-body">
      ${title ? `<div class="toast-title">${toastHtml(title)}</div>` : ''}
      ${msg    ? `<div class="toast-msg">${toastHtml(msg)}</div>` : ''}
    </div>
    <button class="toast-close" onclick="dismissToast(${id})">×</button>
  `;
  el.addEventListener('click', () => dismissToast(id));
  stack.appendChild(el);
  if (ms > 0) setTimeout(() => dismissToast(id), ms);
  return id;
}

function dismissToast(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el) return;
  el.classList.add('toast-out');
  setTimeout(() => el.remove(), 280);
}

function showBanner(msg, ms = 5000) { showToast('info', '', msg, ms); }

/* ── Confirm dialog ─────────────────────────────────────────── */
let _confirmCallback = null;
function showConfirm({ title, msg, okLabel = t('confirm_ok'), cancelLabel = t('confirm_cancel'), type = 'danger', onOk, onCancel }) {
  const titleEl = document.getElementById('confirm-title');
  const msgEl = document.getElementById('confirm-msg');
  const iconEl = document.getElementById('confirm-icon');
  const okBtn = document.getElementById('confirm-ok');
  const cancelBtn = document.getElementById('confirm-cancel');
  const modal = document.getElementById('modal-confirm');
  if (!titleEl || !msgEl || !iconEl || !okBtn || !cancelBtn || !modal) return;
  titleEl.textContent = title;
  msgEl.textContent = msg;

  iconEl.className = 'confirm-icon ' + type;
  const icons = {
    danger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="22" height="22"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    warn:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="22" height="22"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };
  iconEl.innerHTML = icons[type] || icons.danger;

  okBtn.textContent = okLabel;
  okBtn.className = 'confirm-btn-ok' + (type === 'warn' ? ' warn-ok' : '');
  cancelBtn.textContent = cancelLabel;

  _confirmCallback = { onOk: onOk || null, onCancel: onCancel || null };
  modal.classList.remove('hidden');
}

function confirmOk() {
  const cb = _confirmCallback;
  _confirmCallback = null;
  document.getElementById('modal-confirm')?.classList.add('hidden');
  if (cb?.onOk) cb.onOk();
}

function confirmCancel() {
  const cb = _confirmCallback;
  _confirmCallback = null;
  document.getElementById('modal-confirm')?.classList.add('hidden');
  if (cb?.onCancel) cb.onCancel();
}

/* ── Notification helpers ───────────────────────────────────── */
function notify(type, title, msg) {
  showToast(type, title, msg, 6000);
  pushNotification(type, title, msg);
  if (settings.notifsEnabled !== false) {
    nativeNotify(title, msg);
  }
}

function previewVolume() {
  const volEl = document.getElementById('setting-volume');
  const vol = volEl ? parseInt(volEl.value) / 100 : 0.7;
  playAlarmSound(settings.alarmSound || 'digital', vol);
}

function toggleNotesInput() {
  const notes = document.getElementById('task-notes');
  const btn = document.getElementById('toggle-notes-btn');
  if (notes.classList.contains('hidden')) {
    notes.classList.remove('hidden');
    notes.focus();
    btn.textContent = t('task_remove_notes');
  } else {
    notes.classList.add('hidden');
    notes.value = '';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="10" height="10"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> ' + t('task_add_notes');
  }
}

/* ── Data export / import ───────────────────────────────────── */
function exportData() {
  const data = {
    signature: 'PACE_BACKUP_V3',
    app: 'Pace',
    version: 3,
    exportDate: new Date().toISOString(),
    state: {
      tasks: S.tasks || [],
      goals: S.goals || [],
      sessions: S.sessions || 0,
      focusHistory: S.focusHistory || [],
      totalFocusTime: S.totalFocusTime || 0,
      monthNotes: S.monthNotes || {},
      weekOffset: S.weekOffset || 0,
      monthOffset: S.monthOffset || 0,
      selectedNoteDate: S.selectedNoteDate || today(),
      selectedDay: S.selectedDay || null,
      routines: S.routines || [],
      templates: S.templates || [],
      sessionCount: S.sessionCount || 0,
      notifications: S.notifications || [],
      dayRatings: S.dayRatings || {}
    },
    settings: { ...settings }
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateSuffix = fmtDate(new Date()).replace(/-/g, '');
  a.download = `pace-backup-${dateSuffix}.pace`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
  const noteCount = Object.keys(S.monthNotes || {}).length;
  const goalCount = (S.goals || []).length;
  showToast('success', t('export_ok'), t('export_ok_msg').replace('{tasks}', (S.tasks || []).length).replace('{goals}', goalCount).replace('{sessions}', S.sessions || 0).replace('{notes}', noteCount));
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pace,.json,application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const raw = JSON.parse(ev.target.result);
        if (!raw || typeof raw !== 'object') throw new Error(t('import_err_invalid_format'));

        const srcState = raw.state ? raw.state : raw;
        const srcSettings = raw.settings ? raw.settings : (raw.settings || null);

        if (!Array.isArray(srcState.tasks)) throw new Error(t('import_err_no_tasks'));
        const taskCount = srcState.tasks.length;
        const sessionCount = srcState.sessions || 0;
        const noteCount = srcState.monthNotes ? Object.keys(srcState.monthNotes).length : 0;
        const goalCount = srcState.goals ? srcState.goals.length : 0;
        const routineCount = srcState.routines ? srcState.routines.length : 0;

        const doImport = () => {
          S.tasks = srcState.tasks || [];
          S.goals = srcState.goals || [];
          S.sessions = srcState.sessions || 0;
          S.focusHistory = srcState.focusHistory || [];
          S.totalFocusTime = srcState.totalFocusTime || 0;
          S.monthNotes = {};
          if (srcState.monthNotes) {
            for (const [k, v] of Object.entries(srcState.monthNotes)) {
              S.monthNotes[k] = sanitizeNoteHtml(String(v || ''));
            }
          }
          S.weekOffset = srcState.weekOffset || 0;
          S.monthOffset = srcState.monthOffset || 0;
          S.selectedNoteDate = srcState.selectedNoteDate || today();
          S.selectedDay = srcState.selectedDay || null;
          S.routines = srcState.routines || [];
          S.templates = srcState.templates || [];
          S.sessionCount = srcState.sessionCount || 0;
          S.notifications = srcState.notifications || [];
          S.dayRatings = srcState.dayRatings || {};

          if (srcSettings && typeof srcSettings === 'object') {
            Object.assign(settings, srcSettings);
            if (!ALL_FOCUS_STYLES.includes(settings.focusStyle)) settings.focusStyle = SETTINGS_DEFAULTS.focusStyle;
            if (!ALL_CLOCK_STYLES.includes(settings.clockStyle)) settings.clockStyle = SETTINGS_DEFAULTS.clockStyle;
            if (!VIZ_ANIMATIONS.includes(settings.vizAnimation)) settings.vizAnimation = SETTINGS_DEFAULTS.vizAnimation;
            localStorage.setItem('li_settings', JSON.stringify(settings));

            applyTheme(settings.theme || 'dark');
            if (settings.accentColor) setAccentColor(settings.accentColor);
            applyFontSize();
            applyResolutionScale(true);
            if (typeof setAppLanguage === 'function') setAppLanguage(settings.language || 'pt');
            if (typeof loadSettings === 'function') loadSettings();
            if (typeof rebuildAllCustomSelects === 'function') rebuildAllCustomSelects();
            if (typeof renderAllSettingsGrids === 'function') renderAllSettingsGrids();
          }
          save();
          renderAll();
          refreshCategoryLookups();
          refreshCategorySelects();
          updateGoalsSelect();
          if (typeof scheduleRender === 'function') scheduleRender(renderToday, renderWeekGrid);
          showToast('success', t('import_ok'), t('import_ok_msg').replace('{tasks}', taskCount).replace('{goals}', goalCount).replace('{routines}', routineCount).replace('{sessions}', sessionCount).replace('{notes}', noteCount));
        };

        showConfirm({
          title: t('import_confirm_title'),
          msg: t('import_confirm_msg').replace('{tasks}', taskCount).replace('{goals}', goalCount).replace('{routines}', routineCount).replace('{sessions}', sessionCount).replace('{notes}', noteCount),
          okLabel: t('import_confirm_btn'),
          type: 'warn',
          onOk: doImport
        });
      } catch (err) {
        showToast('error', t('import_error'), t('import_error_msg').replace('{err}', err.message));
      }
    };
    reader.onerror = () => showToast('error', t('import_read_error'), t('import_read_error_msg'));
    reader.readAsText(file);
  };
  input.click();
}

/* ── Settings ───────────────────────────────────────────────── */
function loadSettings() {
  const themeEl = document.getElementById('setting-theme');
  if (themeEl) themeEl.value = settings.theme || 'dark';
  const fontSizeEl = document.getElementById('setting-font-size');
  if (fontSizeEl) fontSizeEl.value = settings.fontSize || 'large';
  const customFontSizeRow = document.getElementById('custom-font-size-row');
  const customFontSizeSlider = document.getElementById('setting-custom-font-size');
  const customFontSizeVal = document.getElementById('custom-font-size-val');
  if (customFontSizeSlider) customFontSizeSlider.value = settings.customFontSize || 15;
  if (customFontSizeVal) customFontSizeVal.textContent = (settings.customFontSize || 15) + 'px';
  if (customFontSizeRow) {
    if (settings.fontSize === 'custom') customFontSizeRow.classList.remove('hidden');
    else customFontSizeRow.classList.add('hidden');
  }
  const resEl = document.getElementById('setting-resolution');
  if (resEl) resEl.value = settings.resolution || 'auto';
  const customScaleRow = document.getElementById('custom-scale-row');
  const customScaleSlider = document.getElementById('setting-custom-scale');
  const customScaleVal = document.getElementById('custom-scale-val');
  if (customScaleSlider) customScaleSlider.value = settings.customScale || 100;
  if (customScaleVal) customScaleVal.textContent = (settings.customScale || 100) + '%';
  if (customScaleRow) {
    if (settings.resolution === 'custom') customScaleRow.classList.remove('hidden');
    else customScaleRow.classList.add('hidden');
  }
  const alarmEl = document.getElementById('setting-alarm-sound');
  if (alarmEl) alarmEl.value = settings.alarmSound || 'bell';
  const volEl = document.getElementById('setting-volume');
  if (volEl) {
    volEl.value = settings.volume ?? 70;
    updateVolumeLabel();
  }
  const secsEl = document.getElementById('setting-show-seconds');
  if (secsEl) secsEl.checked = settings.showSeconds !== false;
  const notifEl = document.getElementById('setting-notif-enabled');
  if (notifEl) notifEl.checked = settings.notifsEnabled !== false;
  const langEl = document.getElementById('setting-language');
  if (langEl) langEl.value = settings.language || 'en';
}

function saveSettings() {
  const themeEl = document.getElementById('setting-theme');
  if (themeEl) settings.theme = themeEl.value;
  const fontSizeEl = document.getElementById('setting-font-size');
  if (fontSizeEl) settings.fontSize = fontSizeEl.value;
  const customFontSizeSlider = document.getElementById('setting-custom-font-size');
  if (customFontSizeSlider) settings.customFontSize = parseFloat(customFontSizeSlider.value) || 15;
  const resEl = document.getElementById('setting-resolution');
  if (resEl) settings.resolution = resEl.value;
  const customScaleSlider = document.getElementById('setting-custom-scale');
  if (customScaleSlider) settings.customScale = parseInt(customScaleSlider.value) || 100;
  const alarmEl = document.getElementById('setting-alarm-sound');
  if (alarmEl) settings.alarmSound = alarmEl.value;
  const volEl = document.getElementById('setting-volume');
  if (volEl) settings.volume = parseInt(volEl.value) || 70;
  const secsEl = document.getElementById('setting-show-seconds');
  if (secsEl) settings.showSeconds = secsEl.checked;
  const notifEl = document.getElementById('setting-notif-enabled');
  if (notifEl) settings.notifsEnabled = notifEl.checked;
  localStorage.setItem('li_settings', JSON.stringify(settings));
}

function onResolutionChange(val) {
  settings.resolution = val;
  const customScaleRow = document.getElementById('custom-scale-row');
  if (customScaleRow) {
    if (val === 'custom') customScaleRow.classList.remove('hidden');
    else customScaleRow.classList.add('hidden');
  }
  applyResolutionScale(true);
  saveSettings();
}

function onCustomScaleInput(val) {
  const customScaleVal = document.getElementById('custom-scale-val');
  if (customScaleVal) customScaleVal.textContent = val + '%';
  settings.customScale = parseInt(val) || 100;
  applyResolutionScale(false);
}

function onCustomScaleChange(val) {
  settings.customScale = parseInt(val) || 100;
  applyResolutionScale(true);
  saveSettings();
}

function refreshCurrentScreenResolution() {
  const resEl = document.getElementById('setting-resolution');
  if (resEl) {
    resEl.value = 'auto';
    settings.resolution = 'auto';
    const customScaleRow = document.getElementById('custom-scale-row');
    if (customScaleRow) customScaleRow.classList.add('hidden');
  }
  applyResolutionScale(true);
  saveSettings();
  showToast('success', t('settings_res_refreshed', 'Resolução e escala recalibradas para o ecrã atual!'));
}

function initAutostartSetting() {
  const el = document.getElementById('setting-autostart');
  if (el && window.autostartBridge) {
    window.autostartBridge.isEnabled().then(enabled => {
      el.checked = !!enabled;
    }).catch(() => {});
  }
}

function toggleAutostart(enable) {
  if (window.autostartBridge) {
    window.autostartBridge.set(enable).then(success => {
      if (success) {
        showToast('success', t('autostart_updated'), enable ? t('autostart_enabled_msg') : t('autostart_disabled_msg'));
      } else {
        showToast('warn', t('autostart_updated'), t('autostart_failed_msg'));
      }
    }).catch(err => {
      console.warn('[Pace] Autostart error:', err);
    });
  }
}

function openSettings() {
  loadSettings();
  document.getElementById('modal-settings').classList.remove('hidden');
  ['setting-alarm-sound','setting-theme','setting-font-size','setting-language','setting-resolution'].forEach(id => {
    const el = document.getElementById(id);
    if (el) rebuildCustomSelect(el);
  });
  const notifToggle = document.getElementById('setting-notif-enabled');
  if (notifToggle) notifToggle.checked = settings.notifsEnabled !== false;
  initAutostartSetting();
  renderAllSettingsGrids();
}

function closeSettings() {
  saveSettings();
  document.getElementById('modal-settings')?.classList.add('hidden');
}

/* ── Notification centre ────────────────────────────────────── */
function openNotifications() {
  document.getElementById('modal-notifications')?.classList.remove('hidden');
  renderNotifications();
}

function closeNotifications() {
  document.getElementById('modal-notifications')?.classList.add('hidden');
}

function handleSettingsOverlayClick(e) {
  if (e.target.id === 'modal-settings') closeSettings();
}

function requestNotif() {
  if (settings.notifsEnabled === false) {
    settings.notifsEnabled = true;
    const toggle = document.getElementById('setting-notif-enabled');
    if (toggle) toggle.checked = true;
    saveSettings();
  }

  const isDesktop = window.__TAURI__ || (window.store && typeof window.store.getPath === 'function');
  if (isDesktop) {
    nativeNotify('Pace', t('notif_enabled_msg'));
    showToast('success', t('notif_active'), t('notif_enabled_msg'));
    updateNotifBtn();
  } else if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        nativeNotify('Pace', t('notif_enabled_msg'));
        showToast('success', t('notif_active'), t('notif_enabled_msg'));
      } else {
        showToast('warn', t('notif_denied'), t('notif_denied_msg'));
      }
      updateNotifBtn();
    });
  } else {
    nativeNotify('Pace', t('notif_enabled_msg'));
    showToast('success', t('notif_active'), t('notif_enabled_msg'));
    updateNotifBtn();
  }
}

function handleOverlayClick(e) {
  if (e.target === e.currentTarget) closeModal();
}

function handleGoalsOverlayClick(e) {
  if (e.target === e.currentTarget) closeGoals();
}

function closeModal() { document.getElementById('modal-focus')?.classList.add('hidden'); }

function updateNotifBtn() {
  const projectEnabled = settings.notifsEnabled !== false;
  const isDesktop = window.__TAURI__ || (window.store && typeof window.store.getPath === 'function');

  let deviceGranted = true;
  if (isDesktop) {
    deviceGranted = true;
  } else if (typeof Notification !== 'undefined') {
    deviceGranted = Notification.permission === 'granted';
  }

  // Verde APENAS se estiver ativo no projeto E a permissão do dispositivo estiver concedida
  const isFullyActive = projectEnabled && deviceGranted;

  const headerBtn = document.getElementById('notif-btn');
  const headerLbl = document.getElementById('notif-label');
  if (headerBtn) headerBtn.classList.remove('active', 'denied', 'off');

  if (isFullyActive) {
    if (headerLbl) headerLbl.textContent = t('notif_alerts_active');
    if (headerBtn) headerBtn.classList.add('active');
  } else {
    if (headerLbl) {
      if (!deviceGranted && projectEnabled) {
        headerLbl.textContent = t('notif_alerts_blocked');
      } else {
        headerLbl.textContent = t('notif_alerts_disabled');
      }
    }
    if (headerBtn) headerBtn.classList.add('off');
  }

  const centreBtn = document.getElementById('notifs-btn');
  if (centreBtn) centreBtn.classList.toggle('off', !isFullyActive);

  const settingsBtn = document.getElementById('settings-notif-btn');
  const settingsLbl = document.getElementById('settings-notif-label');
  if (!settingsBtn || !settingsLbl) return;

  const bellSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>';

  if (isFullyActive) {
    settingsBtn.className = 'notif-settings-btn active';
    settingsBtn.innerHTML = bellSvg + ' <span>' + t('notif_alerts_active') + '</span>';
    settingsLbl.textContent = t('settings_notify_active');
  } else {
    settingsBtn.className = 'notif-settings-btn off';
    settingsBtn.innerHTML = bellSvg + ' <span>' + t('notif_alerts_disabled') + '</span>';
    if (!deviceGranted && projectEnabled) {
      settingsLbl.textContent = t('settings_notify_blocked');
    } else {
      settingsLbl.textContent = t('settings_notify_disabled');
    }
  }
}

/* ── Keyboard shortcuts ─────────────────────────────────────── */
document.addEventListener('keydown', e => {
  const target = e.target;
  const tag = target.tagName;
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;

  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal-overlay:not(.hidden)');
    if (!modals.length) return;
    modals[modals.length - 1].classList.add('hidden');
    return;
  }

  const topModal = document.querySelector('.modal-overlay:not(.hidden)');
  if (topModal && e.key === 'Tab') {
    const focusable = topModal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && target === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && target === last) { e.preventDefault(); first.focus(); }
    return;
  }

  if (isInput) return;

  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    $('task-input')?.focus();
  }
  if (e.key === 'f' || e.key === 'F') {
    e.preventDefault();
    openFocusPicker();
  }
});
