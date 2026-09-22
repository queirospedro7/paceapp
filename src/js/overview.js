// Pace — Overview Panel (Month / Week / Statistics)
'use strict';

/* ── STATE ─────────────────────────────────────────────────── */
let _ovMonthOffset = 0; // months from current
let _ovTab = 'month';   // 'month' | 'week' | 'stats'
let _ovWeekOffset = 0;  // separate week offset for overview week tab
let _ovStatsMonthOffset = 0;
let _ovStatsSelectedDay = today();

/* ── OPEN / CLOSE ──────────────────────────────────────────── */
function openOverview() {
  _ovMonthOffset = 0;
  _ovWeekOffset  = 0;
  setView('overview');
  ovSetTab(_ovTab || 'month', false);
  renderOverview();
  const btn = document.getElementById('overview-btn');
  if (btn) btn.classList.add('active');
}

function closeOverview() {
  setView('main');
  const btn = document.getElementById('overview-btn');
  if (btn) btn.classList.remove('active');
}

/* ── TAB SWITCHING ─────────────────────────────────────────── */
function ovSetTab(tab, doRender = true) {
  _ovTab = tab;
  const tabs = ['month', 'week', 'stats'];
  tabs.forEach(id => {
    const btn   = document.getElementById('ov-tab-' + id);
    const panel = document.getElementById('ov-panel-' + id);
    const active = id === tab;
    if (btn)   { btn.classList.toggle('active', active); btn.setAttribute('aria-selected', active); }
    if (panel) panel.classList.toggle('hidden', !active);
  });
  // Show/hide month nav / week nav
  const monthNav = document.getElementById('ov-month-nav');
  if (monthNav) monthNav.classList.toggle('hidden', tab !== 'month');
  const weekNav = document.getElementById('ov-week-nav');
  if (weekNav) weekNav.classList.toggle('hidden', tab !== 'week');
  if (doRender) renderOverview();
}

/* ── NAVIGATION ────────────────────────────────────────────── */
function ovShiftMonth(dir)  { _ovMonthOffset += dir; renderOverview(); }
function ovGoToToday()      { _ovMonthOffset = 0; renderOverview(); }
function ovShiftWeek(dir)   { _ovWeekOffset += dir; renderOverview(); }
function ovWeekToday()      { _ovWeekOffset = 0; renderOverview(); }

/* ── MAIN RENDER ───────────────────────────────────────────── */
function renderOverview() {
  const now   = new Date();
  const base  = new Date(now.getFullYear(), now.getMonth() + _ovMonthOffset, 1);
  const year  = base.getFullYear();
  const month = base.getMonth();

  // Update month label
  const labelEl = document.getElementById('ov-month-label');
  if (labelEl) {
    labelEl.textContent = base.toLocaleDateString(t('misc_locale'), { month: 'long', year: 'numeric' });
  }

  if (_ovTab === 'month') {
    _renderOvMonthGrid(year, month);
    _renderOvMonthSidebar(year, month);
  } else if (_ovTab === 'week') {
    _renderOvWeekGrid();
  } else if (_ovTab === 'stats') {
    _renderOvStats();
  }
}

/* ── MONTH GRID ────────────────────────────────────────────── */
function _renderOvMonthGrid(year, month) {
  const grid = document.getElementById('ov-month-grid');
  if (!grid) return;

  const todayStr   = today();
  const firstDay   = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1; // Mon = 0

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let html = '';

  for (let i = 0; i < startDow; i++) html += '<div class="ov-day-cell empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = fmtDate(dateObj);
    const isToday = dateStr === todayStr;
    const isPast  = dateStr < todayStr;

    const dayTasks  = activeTasksForDate(dateObj);
    const doneCount = dayTasks.filter(tk => isCompleted(tk, dateStr)).length;
    const total     = dayTasks.length;
    const allDone   = total > 0 && doneCount === total;

    const hasNote = !!(S.monthNotes && S.monthNotes[dateStr] &&
      (typeof S.monthNotes[dateStr] === 'string'
        ? S.monthNotes[dateStr].replace(/<[^>]*>/g,'').trim()
        : (S.monthNotes[dateStr].content || '').trim()));

    // Routines
    const dow = dateObj.getDay();
    const activeRoutines = (S.routines || []).filter(r => {
      if (!r.tasks || !r.tasks.length) return false;
      return !r.days || !r.days.length || r.days.includes(dow);
    });
    const routinesDone = activeRoutines.filter(r => {
      const comps = (r.completions && r.completions[dateStr]) || {};
      return r.tasks.every(rt => comps[rt.id]);
    });

    // Focus
    const focusMins = (S.focusHistory || [])
      .filter(s => s.date && s.date.startsWith(dateStr))
      .reduce((a, s) => a + (s.duration || 0), 0);

    const totalItems = total + activeRoutines.length;
    const doneItems  = doneCount + routinesDone.length;
    const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    // Progress bar
    let progressBar = '';
    if (totalItems > 0) {
      progressBar = `<div class="ov-day-prog"><div class="ov-day-prog-fill${allDone ? ' done' : ''}" style="width:${overallPct}%"></div></div>`;
    }

    // Bottom indicators row
    let dots = '';
    if (total > 0) {
      dots += `<span class="ov-day-badge${allDone ? ' done' : ''}">${doneCount}/${total}</span>`;
    }
    if (focusMins >= 30) {
      dots += `<span class="ov-day-focus-pill">${focusMins >= 60 ? Math.floor(focusMins/60)+'h' : focusMins+'m'}</span>`;
    }
    if (hasNote && total === 0 && focusMins < 30) {
      dots += `<span class="ov-day-note-dot"></span>`;
    }

    const classes = [
      'ov-day-cell',
      isToday  ? 'today'   : '',
      isPast && !isToday ? 'past' : '',
      allDone  ? 'all-done': '',
    ].filter(Boolean).join(' ');

    html += `
      <div class="${classes}" onclick="ovOpenDay('${dateStr}')" title="${dateObj.toLocaleDateString(t('misc_locale'),{weekday:'long',day:'numeric',month:'long'})}">
        <span class="ov-day-num">${d}</span>
        ${progressBar}
        ${dots ? `<div class="ov-day-indicators">${dots}</div>` : ''}
      </div>`;
  }

  grid.innerHTML = html;
}

function ovOpenDay(dateStr) {
  openDayDetail(dateStr);
}

/* ── MONTH SUMMARY STRIP ───────────────────────────────────── */
function _renderOvMonthSidebar(year, month) {
  const el = document.getElementById('ov-month-stats');
  if (!el) return;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let totalTasks = 0, doneTasks = 0, totalFocusMins = 0;
  let totalRoutines = 0, doneRoutines = 0, daysWithActivity = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = fmtDate(dateObj);
    const dayTasks = activeTasksForDate(dateObj);
    const dow = dateObj.getDay();

    const activeRoutines = (S.routines || []).filter(r => {
      if (!r.tasks || !r.tasks.length) return false;
      return !r.days || !r.days.length || r.days.includes(dow);
    });
    const routinesDone = activeRoutines.filter(r => {
      const comps = (r.completions && r.completions[dateStr]) || {};
      return r.tasks.every(rt => comps[rt.id]);
    });

    const dayDone = dayTasks.filter(tk => isCompleted(tk, dateStr)).length;
    totalTasks    += dayTasks.length;
    doneTasks     += dayDone;
    totalRoutines += activeRoutines.length;
    doneRoutines  += routinesDone.length;
    if (dayTasks.length || activeRoutines.length) daysWithActivity++;

    totalFocusMins += (S.focusHistory || [])
      .filter(s => s.date && s.date.startsWith(dateStr))
      .reduce((a, s) => a + (s.duration || 0), 0);
  }

  const taskPct    = totalTasks    > 0 ? Math.round((doneTasks    / totalTasks)    * 100) : 0;
  const routinePct = totalRoutines > 0 ? Math.round((doneRoutines / totalRoutines) * 100) : 0;

  const fmtM = m => {
    if (!m) return '0m';
    return m < 60 ? m + 'm' : Math.floor(m/60) + 'h' + (m%60 ? ' '+(m%60)+'m' : '');
  };

  // Upcoming goal deadlines this month
  const activeGoals = (S.goals || []).filter(g => !g.done);
  const now = new Date();
  const upcoming = [];
  activeGoals.forEach(g => {
    if (!g.deadline) return;
    const dl = new Date(g.deadline);
    if (dl.getFullYear() === year && dl.getMonth() === month && dl >= now) {
      upcoming.push({ name: g.name, deadline: g.deadline, dl });
    }
  });
  upcoming.sort((a, b) => a.deadline.localeCompare(b.deadline));

  let html = `
    <div class="ov-strip-stat">
      <span class="ov-strip-val">${doneTasks}/${totalTasks}</span>
      <span class="ov-strip-lbl" data-i18n="month_tasks">${t('month_tasks')}</span>
      <div class="ov-strip-bar"><div class="ov-strip-fill" style="width:${taskPct}%"></div></div>
    </div>`;

  if (totalRoutines > 0) {
    html += `
    <div class="ov-strip-sep"></div>
    <div class="ov-strip-stat">
      <span class="ov-strip-val">${doneRoutines}/${totalRoutines}</span>
      <span class="ov-strip-lbl" data-i18n="month_routines">${t('month_routines')}</span>
      <div class="ov-strip-bar"><div class="ov-strip-fill" style="width:${routinePct}%"></div></div>
    </div>`;
  }

  html += `
    <div class="ov-strip-sep"></div>
    <div class="ov-strip-stat">
      <span class="ov-strip-val">${fmtM(totalFocusMins)}</span>
      <span class="ov-strip-lbl" data-i18n="month_focus">${t('month_focus')}</span>
    </div>
    <div class="ov-strip-sep"></div>
    <div class="ov-strip-stat">
      <span class="ov-strip-val">${daysWithActivity}d</span>
      <span class="ov-strip-lbl" data-i18n="ov_active_days">${t('ov_active_days')}</span>
    </div>`;

  if (upcoming.length) {
    const next = upcoming[0];
    const dlLabel = next.dl.toLocaleDateString(t('misc_locale'), { day: 'numeric', month: 'short' });
    html += `
    <div class="ov-strip-sep"></div>
    <div class="ov-strip-goals">
      <span class="ov-strip-lbl" data-i18n="ov_goal_deadlines">${t('ov_goal_deadlines')}</span>
      <div class="ov-strip-goal-list">`;
    upcoming.slice(0, 3).forEach(item => {
      const lbl = item.dl.toLocaleDateString(t('misc_locale'), { day: 'numeric', month: 'short' });
      html += `<span class="ov-strip-goal-item"><span class="ov-strip-goal-dot"></span>${escHtml(item.name)}<span class="ov-strip-goal-date">${lbl}</span></span>`;
    });
    html += `</div></div>`;
  }

  el.innerHTML = html;
}

/* ── WEEK GRID ─────────────────────────────────────────────── */
function _renderOvWeekGrid() {
  const grid      = document.getElementById('ov-week-grid');
  const labelEl   = document.getElementById('ov-week-label');
  if (!grid) return;

  const days     = getWeekDays(_ovWeekOffset);
  const todayStr = today();
  const now      = new Date();

  // Week label
  if (labelEl && days.length >= 7) {
    const first = days[0].toLocaleDateString(t('misc_locale'), { day: 'numeric', month: 'short' });
    const last  = days[6].toLocaleDateString(t('misc_locale'), { day: 'numeric', month: 'short', year: 'numeric' });
    labelEl.textContent = `${first} – ${last}`;
  }

  let html = '';
  days.forEach(dateObj => {
    const dateStr = fmtDate(dateObj);
    const isToday = dateStr === todayStr;
    const isPast  = dateObj < now && !isToday;
    const dow     = dateObj.getDay();

    const dayTasks  = activeTasksForDate(dateObj);
    const doneCount = dayTasks.filter(tk => isCompleted(tk, dateStr)).length;
    const total     = dayTasks.length;
    const pct       = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    const activeRoutines = (S.routines || []).filter(r => {
      if (!r.tasks || !r.tasks.length) return false;
      return !r.days || !r.days.length || r.days.includes(dow);
    });

    const focusMins = (S.focusHistory || [])
      .filter(s => s.date && s.date.startsWith(dateStr))
      .reduce((a, s) => a + (s.duration || 0), 0);

    const dateLabel = dateObj.toLocaleDateString(t('misc_locale'), { day: 'numeric', month: 'short' });
    const dayName   = dateObj.toLocaleDateString(t('misc_locale'), { weekday: 'long' });

    // Build tasks content
    let tasksHtml = '';
    if (activeRoutines.length) {
      const pills = activeRoutines.map(r => {
        const comps   = (r.completions && r.completions[dateStr]) || {};
        const doneAll = r.tasks.length > 0 && r.tasks.every(rt => comps[rt.id]);
        return `<span class="ov-wd-routine-pill${doneAll ? ' done' : ''}" style="--rc:${r.color||'#6366f1'}">${escHtml(r.name)}</span>`;
      }).join('');
      tasksHtml += `<div class="ov-wd-routines">${pills}</div>`;
    }

    if (dayTasks.length === 0 && activeRoutines.length === 0) {
      tasksHtml = `<div class="ov-wd-empty">${t('task_empty_day')}</div>`;
    } else if (dayTasks.length > 0) {
      tasksHtml += '<div class="ov-wd-tasks">';
      dayTasks.slice(0, 7).forEach(tk => {
        const done     = isCompleted(tk, dateStr);
        const catColor = tk.category ? (CATEGORY_COLORS && CATEGORY_COLORS[tk.category]) || '' : '';
        const catLabel = tk.category ? getCategoryLabel(tk.category) : '';
        tasksHtml += `
          <div class="ov-wd-task${done ? ' done' : ''}" style="pointer-events:none; cursor:default;">
            <div class="ov-wd-chk${done ? ' checked' : ''}"></div>
            ${catLabel ? `<span class="ov-wd-task-cat" style="color:${catColor}">${catLabel}</span>` : ''}
            <span class="ov-wd-task-name">${escHtml(tk.name)}</span>
            ${tk.scheduledTime ? `<span class="ov-wd-task-time">${escHtml(tk.scheduledTime)}</span>` : ''}
          </div>`;
      });
      if (dayTasks.length > 7) {
        tasksHtml += `<div class="ov-wd-empty">+${dayTasks.length - 7} more</div>`;
      }
      tasksHtml += '</div>';
    }

    html += `
      <div class="ov-week-day${isToday ? ' ov-today' : ''}${isPast ? ' ov-past' : ''}">
        <div class="ov-wd-head" onclick="ovOpenDay('${dateStr}')">
          <div class="ov-wd-left">
            <span class="ov-wd-name">${dayName}${isToday ? ' · ' + t('today_label') : ''}</span>
            <span class="ov-wd-date">${dateLabel}</span>
          </div>
          <div class="ov-wd-right">
            ${focusMins > 0 ? `<span class="ov-wd-focus">${focusMins >= 60 ? Math.floor(focusMins/60)+'h' : focusMins+'m'}</span>` : ''}
            <span class="ov-wd-count">${doneCount}/${total}</span>
            <div class="ov-wd-bar"><div class="ov-wd-bar-fill" style="width:${pct}%"></div></div>
            <span class="ov-wd-pct">${pct}%</span>
          </div>
        </div>
        ${tasksHtml}
      </div>`;
  });

  grid.innerHTML = html;
}

/* ── STATISTICS ────────────────────────────────────────────── */
let _ovStatsRange = 7; // 7 | 14 | 30 | 'all'

function ovSetStatsRange(range) {
  _ovStatsRange = range;
  document.querySelectorAll('.ov-range-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.range === String(range));
  });
  _renderOvStats();
}

function _getRangeDays(range) {
  let count = typeof range === 'number' ? range : parseInt(range);
  if (range === 'all' || isNaN(count)) {
    let earliest = new Date();
    (S.focusHistory || []).forEach(s => {
      if (s.date) {
        const d = new Date(s.date.slice(0, 10));
        if (!isNaN(d) && d < earliest) earliest = d;
      }
    });
    (S.tasks || []).forEach(tk => {
      if (tk.created) {
        const d = new Date(tk.created);
        if (!isNaN(d) && d < earliest) earliest = d;
      }
      if (tk.completions) {
        Object.keys(tk.completions).forEach(ds => {
          const d = new Date(ds);
          if (!isNaN(d) && d < earliest) earliest = d;
        });
      }
    });
    const diffDays = Math.ceil((new Date() - earliest) / (1000 * 60 * 60 * 24)) + 1;
    count = Math.max(30, Math.min(365, diffDays));
  }
  const days = [];
  const todayDate = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function _renderOvStats() {
  const rangeDays = _getRangeDays(_ovStatsRange);
  const todayStr  = today();
  const rangeStartStr = fmtDate(rangeDays[0]);
  const rangeEndStr   = fmtDate(rangeDays[rangeDays.length - 1]);

  const fmtM = m => m < 60 ? m + 'm' : Math.floor(m / 60) + 'h' + (m % 60 ? ' ' + (m % 60) + 'm' : '');

  // 1. Task calculations in range
  let rangeTotalTasks = 0, rangeDoneTasks = 0;
  rangeDays.forEach(d => {
    const ds = fmtDate(d);
    const tasks = activeTasksForDate(d);
    rangeTotalTasks += tasks.length;
    rangeDoneTasks  += tasks.filter(tk => isCompleted(tk, ds)).length;
  });
  const taskRate = rangeTotalTasks > 0 ? Math.round((rangeDoneTasks / rangeTotalTasks) * 100) : 0;

  // 2. Focus calculations in range
  const allHistory = S.focusHistory || [];
  const rangeHistory = _ovStatsRange === 'all'
    ? allHistory
    : allHistory.filter(s => s.date && s.date.slice(0, 10) >= rangeStartStr && s.date.slice(0, 10) <= rangeEndStr);

  const rangeFocusMins = rangeHistory.reduce((a, s) => a + (s.duration || 0), 0);

  // Active days count
  let activeDays = 0;
  rangeDays.forEach(d => {
    const ds = fmtDate(d);
    const hasFocus = allHistory.some(s => s.date && s.date.startsWith(ds) && s.duration > 0);
    const hasDone = activeTasksForDate(d).some(tk => isCompleted(tk, ds));
    if (hasFocus || hasDone) activeDays++;
  });
  const dailyAvgMins = activeDays > 0 ? Math.round(rangeFocusMins / activeDays) : 0;

  // 3. Current streak and Best streak across all history
  let currentStreak = 0;
  const checkDate = new Date();
  for (let i = 0; i < 365; i++) {
    if (i > 0) checkDate.setDate(checkDate.getDate() - 1);
    const ds = fmtDate(checkDate);
    const hasDone = activeTasksForDate(checkDate).some(tk => isCompleted(tk, ds));
    const hasFocus = allHistory.some(s => s.date && s.date.startsWith(ds) && s.duration > 0);
    if (hasDone || hasFocus) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  // Best streak calculation
  let bestStreak = currentStreak;
  let tempStreak = 0;
  const historyCheck = new Date();
  for (let i = 0; i < 180; i++) {
    const ds = fmtDate(historyCheck);
    const hasDone = activeTasksForDate(historyCheck).some(tk => isCompleted(tk, ds));
    const hasFocus = allHistory.some(s => s.date && s.date.startsWith(ds) && s.duration > 0);
    if (hasDone || hasFocus) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
    historyCheck.setDate(historyCheck.getDate() - 1);
  }

  // 4. Pace Score (0-100%)
  const consistencyFactor = Math.min(100, Math.round((activeDays / Math.max(1, rangeDays.length)) * 100));
  const focusFactor = Math.min(100, Math.round((rangeFocusMins / (rangeDays.length * 45)) * 100));
  const paceScore = Math.min(100, Math.round((taskRate * 0.4) + (consistencyFactor * 0.35) + (focusFactor * 0.25)));

  // 5. Pomodoros count (sessions >= 20 mins)
  const pomoCount = rangeHistory.filter(s => (s.duration || 0) >= 20).length;

  // 6. Best day & Peak hours
  let bestDayName = '—';
  let bestDayMins = 0;
  rangeDays.forEach(d => {
    const ds = fmtDate(d);
    const dayFoc = rangeHistory.filter(s => s.date && s.date.startsWith(ds)).reduce((a, s) => a + (s.duration || 0), 0);
    if (dayFoc > bestDayMins) {
      bestDayMins = dayFoc;
      bestDayName = d.toLocaleDateString(t('misc_locale'), { weekday: 'short', day: 'numeric' });
    }
  });

  // Update 4 Primary KPI Cards (Clean, Professional, No Emojis)
  const kpiFocus = document.getElementById('kpi-focus-week');
  if (kpiFocus) kpiFocus.textContent = rangeFocusMins > 0 ? fmtM(rangeFocusMins) : '0m';
  const kpiFocusSub = document.getElementById('kpi-focus-sub');
  if (kpiFocusSub) kpiFocusSub.textContent = `Média: ${dailyAvgMins}m / dia`;

  const kpiTasks = document.getElementById('kpi-tasks-week');
  if (kpiTasks) kpiTasks.textContent = `${rangeDoneTasks}/${rangeTotalTasks}`;
  const kpiTasksSub = document.getElementById('kpi-tasks-sub');
  if (kpiTasksSub) kpiTasksSub.textContent = `${taskRate}% de conclusão`;

  const kpiStreakEl = document.getElementById('kpi-streak');
  if (kpiStreakEl) kpiStreakEl.textContent = `${currentStreak} ${currentStreak === 1 ? 'dia' : 'dias'}`;
  const kpiStreakSub = document.getElementById('kpi-streak-sub');
  if (kpiStreakSub) kpiStreakSub.textContent = `${t('stats_best_streak')}: ${bestStreak} ${bestStreak === 1 ? 'dia' : 'dias'}`;

  const kpiPomo = document.getElementById('kpi-pomodoros');
  if (kpiPomo) kpiPomo.textContent = `${rangeHistory.length} ${rangeHistory.length === 1 ? 'sessão' : 'sessões'}`;
  const kpiPomoSub = document.getElementById('kpi-pomo-sub');
  if (kpiPomoSub) {
    kpiPomoSub.textContent = bestDayMins > 0 ? `Pico: ${bestDayName} (${fmtM(bestDayMins)})` : 'Sem sessões no período';
  }

  // Render Subsections
  _renderOvStatsMiniCalendar();
  _renderOvHourlyHeatmap(rangeHistory);
  _renderOvCatBreakdown(rangeDays, rangeHistory);
  _renderOvMonthSummaryCard();
}

function ovStatsShiftMonth(dir) {
  _ovStatsMonthOffset += dir;
  _renderOvStatsMiniCalendar();
}

function ovStatsCurrentMonth() {
  _ovStatsMonthOffset = 0;
  _ovStatsSelectedDay = today();
  _renderOvStatsMiniCalendar();
}

function ovStatsSelectDay(dateStr) {
  if (!dateStr) return;
  _ovStatsSelectedDay = dateStr;
  _renderOvStatsMiniCalendar();
  openStatsDayModal(dateStr);
}

function ovOpenDay(dateStr) {
  openMonthDayModal(dateStr);
}

/* ── OVERVIEW DAY MODAL (SIMPLE, CLEAN, NOTES-STYLE) ─────────────────────── */
function openMonthDayModal(dateStr) {
  const modal = document.getElementById('modal-month-day');
  const title = document.getElementById('month-day-title');
  const content = document.getElementById('month-day-content');
  const ratingWrap = document.getElementById('modal-day-rating');
  if (!modal || !content) return;

  const ds = dateStr || today();
  const isToday = ds === today();
  const dateObj = new Date(ds + 'T12:00:00');

  const rawWeekday = dateObj.toLocaleDateString(t('misc_locale'), { weekday: 'short' });
  const weekdayName = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1);
  const dayMonthYear = dateObj.toLocaleDateString(t('misc_locale'), { day: 'numeric', month: 'long' });
  const rating = (S.dayRatings && S.dayRatings[ds]) || '';

  // Focus metrics
  const daySessions = (S.focusHistory || []).filter(s => s.date && s.date.startsWith(ds));
  const focMins = daySessions.reduce((a, s) => a + (s.duration || 0), 0);
  const fmtM = m => m < 60 ? m + 'm' : Math.floor(m / 60) + 'h' + (m % 60 ? ' ' + (m % 60) + 'm' : '');

  // Task metrics
  const dayTasks = activeTasksForDate(dateObj);
  const doneTasks = dayTasks.filter(tk => isCompleted(tk, ds));
  const doneCount = doneTasks.length;
  const totalCount = dayTasks.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Routines metrics
  const dow = dateObj.getDay();
  const activeRoutines = (S.routines || []).filter(r => {
    if (!r.tasks || !r.tasks.length) return false;
    return !r.days || !r.days.length || r.days.includes(dow);
  });
  const routinesDone = activeRoutines.filter(r => {
    const comps = (r.completions && r.completions[ds]) || {};
    return r.tasks.every(rt => comps[rt.id]);
  });

  // Note preview
  const noteRaw = (S.monthNotes && S.monthNotes[ds]) || '';
  const noteText = (typeof noteRaw === 'string' ? noteRaw : (noteRaw.content || '')).replace(/<[^>]*>/g, '').trim();

  // Header Title
  if (title) {
    title.textContent = `${weekdayName}, ${dayMonthYear}`;
  }

  // Header Rating Dots (Identical to Notes)
  if (ratingWrap) {
    ratingWrap.innerHTML = `
      <button type="button" class="notes-rate-dot positive${rating === 'positive' ? ' active' : ''}" onclick="monthDaySetRating('${ds}', 'positive')" title="${t('rating_positive') || 'Dia Positivo'}"></button>
      <button type="button" class="notes-rate-dot neutral${rating === 'neutral' ? ' active' : ''}" onclick="monthDaySetRating('${ds}', 'neutral')" title="${t('rating_neutral') || 'Dia Indiferente'}"></button>
      <button type="button" class="notes-rate-dot negative${rating === 'negative' ? ' active' : ''}" onclick="monthDaySetRating('${ds}', 'negative')" title="${t('rating_negative') || 'Dia Negativo'}"></button>
    `;
  }

  // Tasks List HTML
  let tasksListHtml = '';
  if (totalCount > 0) {
    tasksListHtml = '<div class="mday-task-list">';
    dayTasks.forEach(tk => {
      const isDone = isCompleted(tk, ds);
      const catColor = tk.category ? (CATEGORY_COLORS && CATEGORY_COLORS[tk.category]) || 'var(--accent)' : 'var(--accent)';
      const catLabel = tk.category ? getCategoryLabel(tk.category) : '';
      tasksListHtml += `
        <div class="mday-task-item ${isDone ? 'done' : ''}">
          <button type="button" class="mday-task-check ${isDone ? 'checked' : ''}" onclick="monthDayToggleTask('${escAttr(tk.id)}','${escAttr(ds)}')"></button>
          <div class="mday-task-info" onclick="monthDayToggleTask('${escAttr(tk.id)}','${escAttr(ds)}')">
            <span class="mday-task-title">${escHtml(tk.name || tk.text || '')}</span>
            <div class="mday-task-meta">
              ${catLabel ? `<span class="mday-cat-tag" style="color:${catColor}">${catLabel}</span>` : ''}
              ${tk.mins ? `<span class="mday-dur-tag">${fmtM(tk.mins)}</span>` : ''}
              ${tk.scheduledTime ? `<span class="mday-time-tag">${escHtml(tk.scheduledTime)}</span>` : ''}
            </div>
          </div>
        </div>`;
    });
    tasksListHtml += '</div>';
  } else {
    tasksListHtml = `<div class="mday-empty">${t('insp_no_tasks') || 'Sem tarefas agendadas'}</div>`;
  }

  // Meta row (today badge, focus mins, routines)
  let metaHtml = '';
  if (isToday || focMins > 0 || activeRoutines.length > 0) {
    metaHtml = '<div class="mday-meta-row">';
    if (isToday) metaHtml += `<span class="mday-today-tag">${t('misc_today') || 'Hoje'}</span>`;
    if (focMins > 0) {
      metaHtml += `<span class="mday-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${fmtM(focMins)} ${t('insp_focus') || 'foco'}</span>`;
    }
    if (activeRoutines.length > 0) {
      metaHtml += `<span class="mday-meta-item">${routinesDone.length}/${activeRoutines.length} ${t('month_routines') || 'rotinas'}</span>`;
    }
    metaHtml += '</div>';
  }

  content.innerHTML = `
    ${metaHtml}

    <!-- Tasks Section -->
    <div class="mday-section">
      <div class="mday-section-head">
        <span class="mday-section-title">${t('insp_tasks') || 'Tarefas'}</span>
        <span class="mday-section-count">${doneCount}/${totalCount}</span>
      </div>
      ${totalCount > 0 ? `<div class="mday-prog-track"><div class="mday-prog-bar" style="width:${pct}%"></div></div>` : ''}
      ${tasksListHtml}
    </div>

    <!-- Daily Note Block -->
    <div class="mday-section">
      <div class="mday-section-head">
        <span class="mday-section-title">${t('insp_daily_note') || 'Nota do Dia'}</span>
        ${noteText ? `<button type="button" class="mday-link-btn" onclick="monthDayOpenNotes('${ds}')">${t('month_edit_note') || 'Abrir'}</button>` : ''}
      </div>
      ${noteText
        ? `<div class="mday-note-preview" onclick="monthDayOpenNotes('${ds}')" title="${t('insp_open_note') || 'Abrir no Bloco de Notas'}">${sanitizeNoteHtml(typeof noteRaw === 'string' ? noteRaw : (noteRaw.content || ''))}</div>`
        : `<div class="mday-note-placeholder" onclick="monthDayOpenNotes('${ds}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><span>${t('insp_no_note') || 'Sem nota · Clica para escrever'}</span></div>`
      }
    </div>

    <!-- Actions -->
    <div class="mday-footer">
      <button type="button" class="mday-btn" onclick="monthDayGoToDay('${ds}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>${t('insp_go_to_day') || 'Ir para Tarefas'}</span>
      </button>
      <button type="button" class="mday-btn" onclick="monthDayOpenNotes('${ds}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>
        <span>${t('nav_notes') || 'Abrir Notas'}</span>
      </button>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeMonthDayModal() {
  const modal = document.getElementById('modal-month-day');
  if (modal) modal.classList.add('hidden');
  const statsModal = document.getElementById('modal-stats-day');
  if (statsModal) statsModal.classList.add('hidden');
}

function handleMonthDayOverlayClick(e) {
  if (e.target && (e.target.id === 'modal-month-day' || e.target.id === 'modal-stats-day')) {
    closeMonthDayModal();
  }
}

function monthDaySetRating(dateStr, ratingVal) {
  if (!S.dayRatings || typeof S.dayRatings !== 'object') S.dayRatings = {};
  if (S.dayRatings[dateStr] === ratingVal) {
    delete S.dayRatings[dateStr];
  } else {
    S.dayRatings[dateStr] = ratingVal;
  }
  save();
  openMonthDayModal(dateStr);
  if (typeof renderOverview === 'function') renderOverview();
  if (typeof renderMonthNotes === 'function') renderMonthNotes();
  if (typeof renderToday === 'function') renderToday();
  if (typeof _renderOvStatsMiniCalendar === 'function') _renderOvStatsMiniCalendar();
}
window.monthDaySetRating = monthDaySetRating;

function monthDayToggleTask(taskId, dateStr) {
  toggleTaskDate(taskId, dateStr);
  openMonthDayModal(dateStr);
  if (typeof renderOverview === 'function') renderOverview();
  if (typeof renderNotesDayTasks === 'function') renderNotesDayTasks();
  if (typeof renderToday === 'function') renderToday();
}
window.monthDayToggleTask = monthDayToggleTask;

function monthDayOpenNotes(dateStr) {
  closeMonthDayModal();
  S.selectedNoteDate = dateStr;
  save();
  if (typeof openNotes === 'function') openNotes();
  if (typeof selectMonthNoteDay === 'function') {
    selectMonthNoteDay(null, dateStr);
  }
}
window.monthDayOpenNotes = monthDayOpenNotes;

function monthDayGoToDay(dateStr) {
  closeMonthDayModal();
  if (typeof selectDayFromWeek === 'function') {
    selectDayFromWeek(dateStr);
  } else {
    S.selectedDay = dateStr === today() ? null : dateStr;
    save();
    if (typeof renderToday === 'function') renderToday();
  }
  if (typeof setView === 'function') setView('main');
  else if (typeof openTasks === 'function') openTasks();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.monthDayGoToDay = monthDayGoToDay;

function openStatsDayModal(dateStr) {
  openMonthDayModal(dateStr);
}

function closeStatsDayModal() {
  closeMonthDayModal();
}

function handleStatsDayOverlayClick(e) {
  closeMonthDayModal();
}

function closeDayInspector() {
  closeMonthDayModal();
}

function handleDayInspectorOverlayClick(event) {
  closeMonthDayModal();
}

window.openMonthDayModal = openMonthDayModal;
window.closeMonthDayModal = closeMonthDayModal;
window.handleMonthDayOverlayClick = handleMonthDayOverlayClick;
window.openStatsDayModal = openStatsDayModal;
window.closeStatsDayModal = closeStatsDayModal;
window.handleStatsDayOverlayClick = handleStatsDayOverlayClick;
window.ovOpenDay = ovOpenDay;
window.ovStatsShiftMonth = ovStatsShiftMonth;
window.ovStatsCurrentMonth = ovStatsCurrentMonth;
window.ovStatsSelectDay = ovStatsSelectDay;

function _renderOvStatsMiniCalendar() {
  const calEl = document.getElementById('ov-stats-mini-calendar');
  const titleEl = document.getElementById('ov-stats-month-title');
  if (!calEl) return;

  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + _ovStatsMonthOffset, 1);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();

  if (titleEl) {
    const monthName = targetDate.toLocaleDateString(t('misc_locale'), { month: 'long', year: 'numeric' });
    titleEl.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  }

  // Weekday abbreviations starting on Monday
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today();

  const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  let posCount = 0, neuCount = 0, negCount = 0;
  let html = '<div class="ov-cal-weekdays">';
  weekdays.forEach(wd => {
    html += `<span class="ov-cal-wd">${wd}</span>`;
  });
  html += '</div><div class="ov-cal-grid">';

  // Empty leading slots (like Notes)
  for (let i = 0; i < firstDayIndex; i++) {
    html += '<div class="ov-cal-cell empty"></div>';
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const currDate = new Date(year, month, day);
    const ds = fmtDate(currDate);
    const isToday = ds === todayStr;
    const isSelected = ds === _ovStatsSelectedDay;

    // Rating
    const rating = (S.dayRatings && S.dayRatings[ds]) || ''; // 'positive' | 'neutral' | 'negative' | ''
    if (rating === 'positive') posCount++;
    else if (rating === 'neutral') neuCount++;
    else if (rating === 'negative') negCount++;

    // Tasks and focus info
    const tasks = activeTasksForDate(currDate);
    const doneTasks = tasks.filter(tk => isCompleted(tk, ds)).length;
    const focMins = (S.focusHistory || [])
      .filter(s => s.date && s.date.startsWith(ds))
      .reduce((a, s) => a + (s.duration || 0), 0);

    let ratingCls = '';
    if (rating === 'positive') ratingCls = ' rating-pos';
    else if (rating === 'neutral') ratingCls = ' rating-neu';
    else if (rating === 'negative') ratingCls = ' rating-neg';

    let dotHtml = '';
    if (rating === 'positive') dotHtml = '<span class="ov-cal-dot pos" title="Positivo"></span>';
    else if (rating === 'neutral') dotHtml = '<span class="ov-cal-dot neu" title="Indiferente"></span>';
    else if (rating === 'negative') dotHtml = '<span class="ov-cal-dot neg" title="Negativo"></span>';
    else if (doneTasks > 0 || focMins > 0) dotHtml = '<span class="ov-cal-dot act" title="Atividade"></span>';

    const tooltip = `${ds}: ${rating ? rating.toUpperCase() + ' • ' : ''}${doneTasks}/${tasks.length} tarefas, ${focMins}m foco (Clica para ver detalhes)`;

    html += `
      <button type="button" class="ov-cal-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${ratingCls}"
              onclick="ovStatsSelectDay('${ds}')"
              title="${tooltip}">
        <span class="ov-cal-day-num">${day}</span>
        ${dotHtml}
      </button>`;
  }

  html += '</div>';
  calEl.innerHTML = html;

  // Render Day Ratings Breakdown below calendar
  const ratingSumEl = document.getElementById('ov-stats-rating-summary');
  if (ratingSumEl) {
    const ratedCount = posCount + neuCount + negCount;
    const posPct = ratedCount > 0 ? Math.round((posCount / ratedCount) * 100) : 0;
    const neuPct = ratedCount > 0 ? Math.round((neuCount / ratedCount) * 100) : 0;
    const negPct = ratedCount > 0 ? Math.max(0, 100 - posPct - neuPct) : 0;

    let sumHtml = '';
    if (ratedCount > 0) {
      sumHtml = `
        <div class="ov-rating-bar">
          ${posCount > 0 ? `<div class="ov-rating-seg pos" style="width:${posPct}%"></div>` : ''}
          ${neuCount > 0 ? `<div class="ov-rating-seg neu" style="width:${neuPct}%"></div>` : ''}
          ${negCount > 0 ? `<div class="ov-rating-seg neg" style="width:${negPct}%"></div>` : ''}
        </div>
        <div class="ov-rating-row">
          <div class="ov-rating-item" title="${escAttr(t('rating_positive'))}: ${posCount}">
            <span class="ov-rating-dot pos"></span>
            <span class="ov-rating-lbl">${escHtml(t('rating_positive'))}</span>
            <span class="ov-rating-pct">${posPct}%</span>
          </div>
          <div class="ov-rating-item" title="${escAttr(t('rating_neutral'))}: ${neuCount}">
            <span class="ov-rating-dot neu"></span>
            <span class="ov-rating-lbl">${escHtml(t('rating_neutral'))}</span>
            <span class="ov-rating-pct">${neuPct}%</span>
          </div>
          <div class="ov-rating-item" title="${escAttr(t('rating_negative'))}: ${negCount}">
            <span class="ov-rating-dot neg"></span>
            <span class="ov-rating-lbl">${escHtml(t('rating_negative'))}</span>
            <span class="ov-rating-pct">${negPct}%</span>
          </div>
        </div>`;
    } else {
      sumHtml = `
        <div class="ov-rating-empty" data-i18n="stats_no_ratings">${t('stats_no_ratings')}</div>`;
    }

    ratingSumEl.innerHTML = sumHtml;
  }
}

function _renderOvBarChart(days) {
  const el = document.getElementById('ov-bar-chart');
  if (!el) return;

  const maxMins = Math.max(30, ...days.map(d => {
    const ds = fmtDate(d);
    return (S.focusHistory || [])
      .filter(s => s.date && s.date.startsWith(ds))
      .reduce((a, s) => a + (s.duration || 0), 0);
  }));

  const todayStr = today();
  let html = '';
  days.forEach(d => {
    const ds      = fmtDate(d);
    const tasks   = activeTasksForDate(d);
    const done    = tasks.filter(tk => isCompleted(tk, ds)).length;
    const total   = tasks.length;
    const focMs   = (S.focusHistory || [])
      .filter(s => s.date && s.date.startsWith(ds))
      .reduce((a, s) => a + (s.duration || 0), 0);
    const pct     = Math.round((focMs / maxMins) * 100);
    const dayName = d.toLocaleDateString(t('misc_locale'), { weekday: days.length > 14 ? 'narrow' : 'short' });
    const isToday = ds === todayStr;
    const taskPct = total > 0 ? Math.round((done / total) * 100) : 0;

    html += `
      <div class="ov-bar-col">
        <div class="ov-bar-wrap">
          <div class="ov-bar-inner" title="${ds}: ${focMs}m foco • ${done}/${total} tarefas">
            <div class="ov-bar-task" style="height:${taskPct}%"></div>
            <div class="ov-bar-focus${isToday ? ' today' : ''}" style="height:${pct}%"></div>
          </div>
        </div>
        <span class="ov-bar-label${isToday ? ' today' : ''}">${dayName}</span>
        ${total > 0 && days.length <= 14 ? `<span class="ov-bar-sub">${done}/${total}</span>` : ''}
      </div>`;
  });
  el.innerHTML = html;
}

function _renderOvHourlyHeatmap(sessions) {
  const el = document.getElementById('ov-hourly-chart');
  if (!el) return;

  const hours = new Array(24).fill(0);
  sessions.forEach(s => {
    if (!s.date) return;
    try {
      const hour = new Date(s.date).getHours();
      if (!isNaN(hour) && hour >= 0 && hour < 24) {
        hours[hour] += (s.duration || 0);
      }
    } catch (_) {}
  });

  const maxHourMins = Math.max(15, ...hours);
  let html = '';

  for (let h = 0; h < 24; h++) {
    const mins = hours[h];
    const pct = Math.round((mins / maxHourMins) * 100);
    const isPeak = mins > 0 && mins === maxHourMins;
    const label = h % 4 === 0 ? `${h}h` : '';

    html += `
      <div class="ov-hour-col" title="${h}:00 - ${h + 1}:00: ${mins}m de foco">
        <div class="ov-hour-bar-wrap">
          <div class="ov-hour-fill${isPeak ? ' peak' : ''}" style="height:${pct}%"></div>
        </div>
        <span class="ov-hour-label">${label}</span>
      </div>`;
  }

  el.innerHTML = html;
}

function ovExportStatsReport() {
  const rangeDays = _getRangeDays(_ovStatsRange);
  const rangeStartStr = fmtDate(rangeDays[0]);
  const rangeEndStr   = fmtDate(rangeDays[rangeDays.length - 1]);

  let totalTasks = 0, doneTasks = 0;
  rangeDays.forEach(d => {
    const ds = fmtDate(d);
    const tasks = activeTasksForDate(d);
    totalTasks += tasks.length;
    doneTasks  += tasks.filter(tk => isCompleted(tk, ds)).length;
  });

  const rangeHistory = (S.focusHistory || []).filter(s => 
    s.date && s.date.slice(0, 10) >= rangeStartStr && s.date.slice(0, 10) <= rangeEndStr
  );
  const focusMins = rangeHistory.reduce((a, s) => a + (s.duration || 0), 0);

  const report = [
    `# Pace — Relatório de Produtividade (${rangeStartStr} a ${rangeEndStr})`,
    `- Tarefas Concluídas: ${doneTasks}/${totalTasks} (${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%)`,
    `- Tempo de Foco Total: ${Math.floor(focusMins / 60)}h ${focusMins % 60}m`,
    `- Sessões Realizadas: ${rangeHistory.length}`,
    `- Sequência Atual: ${document.getElementById('kpi-streak')?.textContent || '0 dias'}`,
    `Gerado por Pace Desktop.`
  ].join('\n');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(report).then(() => {
      showToast('success', t('stats_export_summary'), t('stats_copied_report'));
    }).catch(() => {
      showToast('info', t('stats_export_summary'), report);
    });
  } else {
    showToast('info', t('stats_export_summary'), report);
  }
}

function _renderOvFocusSummary() {
  const el = document.getElementById('ov-focus-summary');
  if (!el) return;

  const allSessions = S.focusHistory || [];
  const now         = new Date();
  const weekStart   = getWeekDays(S.weekOffset || 0)[0];
  const weekStartStr = fmtDate(weekStart);

  const weekSessions  = allSessions.filter(s => s.date && s.date >= weekStartStr);
  const totalSessions = allSessions.length;
  const weekFocusMins = weekSessions.reduce((a, s) => a + (s.duration || 0), 0);
  const totalFocusMins = allSessions.reduce((a, s) => a + (s.duration || 0), 0);
  const avgSession    = totalSessions > 0 ? Math.round(totalFocusMins / totalSessions) : 0;

  const fmtM = m => m < 60 ? m + 'm' : Math.floor(m/60) + 'h' + (m%60 ? ' '+(m%60)+'m' : '');

  el.innerHTML = `
    <div class="ov-focus-stat">
      <span class="ov-focus-stat-val">${totalSessions}</span>
      <span class="ov-focus-stat-lbl" data-i18n="stats_total_sessions">${t('stats_total_sessions')}</span>
    </div>
    <div class="ov-focus-stat">
      <span class="ov-focus-stat-val">${weekSessions.length}</span>
      <span class="ov-focus-stat-lbl" data-i18n="stats_this_week">${t('stats_this_week')}</span>
    </div>
    <div class="ov-focus-stat">
      <span class="ov-focus-stat-val">${totalFocusMins > 0 ? fmtM(totalFocusMins) : '—'}</span>
      <span class="ov-focus-stat-lbl" data-i18n="stats_total_focus">${t('stats_total_focus')}</span>
    </div>
    <div class="ov-focus-stat">
      <span class="ov-focus-stat-val">${avgSession > 0 ? fmtM(avgSession) : '—'}</span>
      <span class="ov-focus-stat-lbl" data-i18n="stats_avg_session">${t('stats_avg_session')}</span>
    </div>`;
}

function _renderOvCatBreakdown(rangeDays, rangeHistory) {
  const el = document.getElementById('ov-cat-breakdown');
  if (!el) return;

  const catMap = {};
  rangeDays.forEach(d => {
    const ds = fmtDate(d);
    activeTasksForDate(d).forEach(tk => {
      const cat = tk.category || '__none__';
      if (!catMap[cat]) catMap[cat] = { total: 0, done: 0, focusMins: 0 };
      catMap[cat].total++;
      if (isCompleted(tk, ds)) catMap[cat].done++;
    });
  });

  (rangeHistory || []).forEach(s => {
    const cat = s.category || '__none__';
    if (!catMap[cat]) catMap[cat] = { total: 0, done: 0, focusMins: 0 };
    catMap[cat].focusMins += (s.duration || 0);
  });

  const cats = Object.keys(catMap).sort((a, b) => (catMap[b].total + catMap[b].focusMins) - (catMap[a].total + catMap[a].focusMins));
  if (cats.length === 0) {
    el.innerHTML = `<div class="ov-empty-msg" data-i18n="stats_empty">${t('stats_empty')}</div>`;
    return;
  }

  let html = '';
  cats.forEach(cat => {
    const { total, done, focusMins } = catMap[cat];
    const pct = total > 0 ? Math.round((done / total) * 100) : (focusMins > 0 ? 100 : 0);
    const color = cat !== '__none__' && CATEGORY_COLORS ? (CATEGORY_COLORS[cat] || 'var(--accent)') : 'var(--accent)';
    const label = cat !== '__none__' ? (getCategoryLabel(cat) || cat) : t('task_cat_none');
    const focBadge = focusMins > 0 ? `<span class="ov-cat-foc">${focusMins}m</span>` : '';
    html += `
      <div class="ov-cat-row">
        <span class="ov-cat-dot" style="background:${color}"></span>
        <span class="ov-cat-name">${escHtml(label)}</span>
        <div class="ov-cat-bar"><div class="ov-cat-fill" style="width:${pct}%;background:${color}"></div></div>
        <span class="ov-cat-val">${done}/${total}</span>
        ${focBadge}
      </div>`;
  });
  el.innerHTML = html;
}

function _renderOvMonthSummaryCard() {
  const el = document.getElementById('ov-month-summary');
  if (!el) return;

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let totalTasks = 0, doneTasks = 0, totalFocusMins = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = fmtDate(dateObj);
    const tasks   = activeTasksForDate(dateObj);
    totalTasks   += tasks.length;
    doneTasks    += tasks.filter(tk => isCompleted(tk, dateStr)).length;
    totalFocusMins += (S.focusHistory || [])
      .filter(s => s.date && s.date.startsWith(dateStr))
      .reduce((a, s) => a + (s.duration || 0), 0);
  }

  const fmtM = m => m < 60 ? m + 'm' : Math.floor(m/60) + 'h' + (m%60 ? ' '+(m%60)+'m' : '');
  const monthName = now.toLocaleDateString(t('misc_locale'), { month: 'long' });
  const completionPct = totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0;

  el.innerHTML = `
    <div class="ov-month-sum-title">${monthName}</div>
    <div class="ov-month-sum-grid">
      <div class="ov-month-sum-item">
        <span class="ov-month-sum-val">${doneTasks}</span>
        <span class="ov-month-sum-lbl" data-i18n="stats_tasks_done">${t('stats_tasks_done')}</span>
      </div>
      <div class="ov-month-sum-item">
        <span class="ov-month-sum-val">${completionPct}%</span>
        <span class="ov-month-sum-lbl" data-i18n="month_global">${t('month_global')}</span>
      </div>
      <div class="ov-month-sum-item">
        <span class="ov-month-sum-val">${totalFocusMins > 0 ? fmtM(totalFocusMins) : '—'}</span>
        <span class="ov-month-sum-lbl" data-i18n="stats_focus_time">${t('stats_focus_time')}</span>
      </div>
    </div>
    <div class="ov-month-sum-bar-wrap">
      <div class="ov-month-sum-bar"><div class="ov-month-sum-fill" style="width:${completionPct}%"></div></div>
      <span class="ov-month-sum-pct">${completionPct}%</span>
    </div>`;
}

/* ── ALERTS BAR ────────────────────────────────────────────── */
function _renderOvAlerts(zone) {
  const el = document.getElementById('ov-alerts-' + zone);
  if (!el) return;

  const todayStr = today();
  const now = new Date();
  const alerts = [];

  const fmtDateLabel = dateStr => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString(t('misc_locale'), { weekday: 'short', day: 'numeric', month: 'short' });
  };

  S.tasks.forEach(task => {
    if (task.archived) return;
    if (task.recur === 'once' && task.date) {
      if (task.date < todayStr && !isCompleted(task, task.date)) {
        alerts.push({
          cls: 'alert-overdue',
          icon: '!',
          text: task.name,
          meta: fmtDateLabel(task.date),
          dateStr: task.date,
          sort: 0
        });
      } else if (task.date > todayStr) {
        const diffDays = Math.ceil((new Date(task.date + 'T12:00:00') - now) / 86400000);
        if (diffDays <= 3 && !isCompleted(task, task.date)) {
          const label = diffDays === 1 ? t('goal_deadline_tomorrow') : `${diffDays}d`;
          alerts.push({
            cls: 'alert-due-soon',
            icon: '◷',
            text: task.name,
            meta: label,
            dateStr: task.date,
            sort: 1
          });
        }
      }
    }
  });

  (S.goals || []).forEach(goal => {
    if (goal.done) return;
    if (!goal.deadline) return;
    const dl = new Date(goal.deadline + 'T23:59:59');
    const diff = dl - now;
    const days = Math.ceil(diff / 86400000);
    if (diff < 0) {
      alerts.push({ cls: 'alert-overdue', icon: '◉', text: goal.name, meta: t('goal_expired'), dateStr: null, sort: 0 });
    } else if (days <= 7) {
      const label = days === 0 ? t('goal_deadline_today') : days === 1 ? t('goal_deadline_tomorrow') : `${days}d`;
      alerts.push({ cls: 'alert-due-soon alert-goal', icon: '◉', text: goal.name, meta: label, dateStr: null, sort: 1 });
    }
  });

  if (!alerts.length) {
    el.classList.add('hidden');
    return;
  }

  alerts.sort((a, b) => a.sort - b.sort);

  el.classList.remove('hidden');
  el.innerHTML = alerts.map(a => {
    const clickAttr = a.dateStr ? `onclick="goToDay('${escAttr(a.dateStr)}')"` : '';
    return `
      <div class="ov-alert-item ${escHtml(a.cls)}" ${clickAttr}>
        <span class="ov-alert-icon">${escHtml(a.icon)}</span>
        <span class="ov-alert-text">${escHtml(a.text)}</span>
        <span class="ov-alert-meta">${escHtml(a.meta)}</span>
      </div>`;
  }).join('');
}

/* ── COMPAT ────────────────────────────────────────────────── */
function openMonthView()   { _ovTab = 'month'; openOverview(); }
function closeMonthView()  { closeOverview(); }
function resetMonthView()  { ovGoToToday(); }
function shiftMonthView(d) { ovShiftMonth(d); }
function shiftMonthViewYear(d) { _ovMonthOffset += d * 12; renderOverview(); }
