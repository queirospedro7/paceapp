// Pace — Ponto de entrada

/* ── Render batching ────────────────────────────────────────── */
const _pendingRenders = new Set();
let _renderRAF = null;

function scheduleRender(...fns) {
  fns.forEach(f => _pendingRenders.add(f));
  if (_renderRAF) return;
  _renderRAF = requestAnimationFrame(() => {
    _renderRAF = null;
    const toRun = [..._pendingRenders];
    _pendingRenders.clear();
    toRun.forEach(f => f());
  });
}

function renderAll() {
  scheduleRender(renderWeekGrid, renderToday);
  if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
  const mainGrid = document.getElementById('month-notes-grid-main');
  if (mainGrid && !mainGrid.closest('.hidden')) {
    scheduleRender(renderMonthGridMain);
  }
  const notesGrid = document.getElementById('month-notes-grid');
  if (notesGrid && !notesGrid.closest('.hidden')) {
    scheduleRender(renderMonthNotes, renderMonthGridOnly);
  }
}

function shiftWeek(dir) { S.weekOffset += dir; scheduleRender(renderWeekGrid); save(); }
function goToCurrentWeek() { S.weekOffset = 0; S.selectedDay = null; scheduleRender(renderWeekGrid); renderToday(); save(); }

/* ── Init ───────────────────────────────────────────────────── */
let _initialized = false;

function _hideSplash() {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('splash-out');
    setTimeout(() => {
      try { splash.remove(); } catch (_) {}
    }, 520);
  }
}

function _doInit() {
  if (_initialized) return;
  _initialized = true;

  try {
    loadSettings();
    if (typeof _refreshStaticTexts === 'function') _refreshStaticTexts();
    applyTheme();
    applyResolutionScale(true);
    if (settings.accentColor) {
      const contrastText = typeof getContrastColor === 'function' ? getContrastColor(settings.accentColor) : '#fff';
      const readableAccent = typeof getReadableAccentColor === 'function' ? getReadableAccentColor(settings.accentColor) : settings.accentColor;
      document.documentElement.style.setProperty('--accent', settings.accentColor);
      document.documentElement.style.setProperty('--accent-readable', readableAccent);
      document.documentElement.style.setProperty('--ring-color', settings.accentColor);
      document.documentElement.style.setProperty('--accent-text', contrastText);
    }
    if (settings.fontSize) applyFontSize();
    if (settings.mainLayout && settings.mainLayout !== 'default') applyMainLayout(settings.mainLayout);
    updateNotifBtn();
    updateGoalsSelect();
    refreshCategorySelects();
    refreshCategoryLookups();
    renderCustomCategories();

    renderAll();
    renderTemplatePicker();
    setView('main');
    document.getElementById('inp-recur')?.addEventListener('change', () => {
      toggleCustomRecurPanel();
      toggleDatePicker();
    });
    toggleCustomRecurPanel();
    toggleDatePicker();
  } catch (err) {
    console.error('[Pace] Error during _doInit:', err);
  } finally {
    setTimeout(_hideSplash, 600);
  }

  setTimeout(() => { updateNotifBtn(); }, 3000);

  try {
    tickClock();
    updateDateLabel();
    setInterval(tickClock, 1000);
    _refreshStaticTexts();
    initCustomSelects();
    if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
    checkScheduledNotifications();
    setInterval(() => {
      checkScheduledNotifications();
      if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
    }, 10000);
    window.addEventListener('resize', () => {
      if (settings.resolution === 'auto') applyResolutionScale(false);
    });

    function updateTimeProgress() {
      const now = new Date();
      const secsPassed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const dayBar = document.getElementById('day-bar');
      const dayPct = document.getElementById('day-percent');
      const monthBar = document.getElementById('month-bar');
      const monthPct = document.getElementById('month-percent');
      const yearBar = document.getElementById('year-bar');
      const yearPct = document.getElementById('year-percent');
      if (dayBar) dayBar.style.width = (secsPassed / 86400) * 100 + '%';
      if (dayPct) dayPct.textContent = Math.round((secsPassed / 86400) * 100) + '%';
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      if (monthBar) monthBar.style.width = (now.getDate() / daysInMonth) * 100 + '%';
      if (monthPct) monthPct.textContent = Math.round((now.getDate() / daysInMonth) * 100) + '%';
      const year = now.getFullYear();
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      const totalDays = isLeap ? 366 : 365;
      const start = new Date(year, 0, 0);
      const dayOfYear = Math.floor((now - start) / 86400000);
      if (yearBar) yearBar.style.width = (dayOfYear / totalDays) * 100 + '%';
      if (yearPct) yearPct.textContent = Math.round((dayOfYear / totalDays) * 100) + '%';
    }
    setInterval(updateTimeProgress, 60000);
    updateTimeProgress();

    window.addEventListener('beforeunload', () => {
      if (timer) { clearInterval(timer); timer = null; }
      if (soundVizInterval) { clearInterval(soundVizInterval); soundVizInterval = null; }
      if (typeof _vizRAF !== 'undefined' && _vizRAF) { cancelAnimationFrame(_vizRAF); _vizRAF = null; }
      clearNudges();
      stopIdleTimer();
      flushNoteSave();
    });
  } catch (err) {
    console.error('[Pace] Error setting up intervals:', err);
  }
}

// Aguarda o tauri-bridge carregar os dados persistidos antes de inicializar a app.
document.addEventListener('tauri-bridge-ready', _doInit, { once: true });

// Fallback de segurança: se após 2 segundos o evento não tiver corrido, forçar _doInit
setTimeout(() => {
  if (!_initialized) {
    console.warn('[Pace] Safety fallback init triggered');
    _doInit();
  }
}, 2000);

