let _mvOffset = 0;

function openMonthView() {
  _mvOffset = 0;
  renderMonthView();
  document.getElementById('modal-month-view')?.classList.remove('hidden');
}

function closeMonthView() {
  _mvOffset = 0;
  document.getElementById('modal-month-view')?.classList.add('hidden');
}

function shiftMonthView(dir) {
  _mvOffset += dir;
  renderMonthView();
}

function shiftMonthViewYear(dir) {
  _mvOffset += dir * 12;
  renderMonthView();
}

function jumpToMonthFromPicker() {
  const month = parseInt(document.getElementById('mv-month-select')?.value);
  const year = parseInt(document.getElementById('mv-year-select')?.value);
  if (isNaN(month) || isNaN(year)) return;
  
  const now = new Date();
  const diffMonths = (year - now.getFullYear()) * 12 + (month - now.getMonth());
  _mvOffset = diffMonths;
  renderMonthView();
}

function resetMonthView() {
  _mvOffset = 0;
  renderMonthView();
}

function renderMonthView() {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + _mvOffset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();
  const todayStr = today();

  const titleEl = document.getElementById('mv-title');
  if (titleEl) titleEl.textContent = base.toLocaleDateString(t('misc_locale'), { month: 'long', year: 'numeric' });

  const monthSelEl = document.getElementById('mv-month-select');
  const yearSelEl = document.getElementById('mv-year-select');
  if (monthSelEl && yearSelEl) {
    const monthNames = Array.from({length: 12}, (_, i) => new Date(2024, i, 1).toLocaleDateString(t('misc_locale'), { month: 'long' }));
    monthSelEl.innerHTML = monthNames.map((name, i) => 
      `<option value="${i}" ${i === month ? 'selected' : ''}>${name}</option>`
    ).join('');
    const years = [];
    for (let y = year - 5; y <= year + 5; y++) years.push(y);
    yearSelEl.innerHTML = years.map(y => 
      `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`
    ).join('');
    rebuildCustomSelect(monthSelEl);
    rebuildCustomSelect(yearSelEl);
  }

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = document.getElementById('mv-grid');
  if (!grid) return;

  let totalTasks = 0, totalDone = 0, totalRoutines = 0, totalRoutinesDone = 0, totalFocusMins = 0;

  let html = '';
  for (let i = 0; i < firstDow; i++) {
    html += '<div class="mv-cell mv-empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = fmtDate(dateObj);
    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;

    const tasks = activeTasksForDate(dateObj);
    const done = tasks.filter(t => isCompleted(t, dateStr));
    const allDone = tasks.length > 0 && done.length === tasks.length;
    totalTasks += tasks.length;
    totalDone += done.length;

    const dow = dateObj.getDay();
    const activeRoutines = (S.routines || []).filter(r => {
      if (!r.tasks || !r.tasks.length) return false;
      return !r.days || !r.days.length || r.days.includes(dow);
    });
    const routinesDone = activeRoutines.filter(r => {
      const comps = (r.completions && r.completions[dateStr]) || {};
      return r.tasks.every(t => comps[t.id]);
    });
    totalRoutines += activeRoutines.length;
    totalRoutinesDone += routinesDone.length;

    const hasNote = !!(S.monthNotes && S.monthNotes[dateStr] &&
      S.monthNotes[dateStr].replace(/<[^>]*>/g, '').trim());

    const sessions = (S.focusHistory || []).filter(s => s.date && s.date.startsWith(dateStr));
    const focusMins = sessions.reduce((a, s) => a + (s.duration || 0), 0);
    totalFocusMins += focusMins;

    const totalItems = tasks.length + activeRoutines.length;
    const doneItems = done.length + routinesDone.length;
    const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    const catDots = [...new Set(done.map(t => t.category).filter(Boolean))].slice(0, 4);

    const notePreview = hasNote ? S.monthNotes[dateStr].replace(/<[^>]*>/g, '').trim().slice(0, 35) : '';

    html += `
      <div class="mv-cell ${isToday ? 'mv-today' : ''} ${isPast && !isToday ? 'mv-past' : ''} ${allDone && tasks.length ? 'mv-all-done' : ''}"
           onclick="openDayFromMonth('${dateStr}')" title="${isToday ? t('month_today') : dateObj.toLocaleDateString(t('misc_locale'), { weekday: 'long' })}">
        <div class="mv-day-num">${d}${focusMins > 0 ? `<span class="mv-focus-dot" title="${t('month_focus_session')}"></span>` : ''}</div>
        ${totalItems > 0 ? `
          <div class="mv-progress-bar">
            <div class="mv-progress-fill" style="width:${pct}%"></div>
          </div>
        ` : ''}
        <div class="mv-indicators">
          ${tasks.length > 0 ? `<span class="mv-ind mv-ind-tasks ${allDone ? 'done' : ''}">${done.length}/${tasks.length}</span>` : ''}
          ${activeRoutines.length > 0 ? `<span class="mv-ind mv-ind-routines ${routinesDone.length === activeRoutines.length ? 'done' : ''}">${routinesDone.length}/${activeRoutines.length}</span>` : ''}
          ${focusMins >= 30 ? `<span class="mv-ind mv-ind-focus">${focusMins >= 60 ? Math.floor(focusMins/60)+'h' : focusMins+'m'}</span>` : ''}
          ${hasNote && !notePreview ? `<span class="mv-dot-note" title="${t('month_has_note')}">\u25CF</span>` : ''}
        </div>
        ${notePreview ? `<div class="mv-note-preview" title="${escHtml(notePreview)}">${escHtml(notePreview)}${S.monthNotes[dateStr].replace(/<[^>]*>/g, '').trim().length > 35 ? '...' : ''}</div>` : ''}
        ${catDots.length ? `<div class="mv-cat-dots">${catDots.map(c => `<span class="mv-cat-dot" style="background:${CATEGORY_COLORS[c] || '#888'}"></span>`).join('')}</div>` : ''}
      </div>`;
  }

  grid.innerHTML = html;
  _renderMonthSummary(totalTasks, totalDone, totalRoutines, totalRoutinesDone, totalFocusMins);
}

function _renderMonthSummary(taskCount, doneCount, routineCount, routinesDoneCount, focusMins) {
  const bar = document.getElementById('mv-summary-bar');
  if (!bar) return;
  const totalItems = taskCount + routineCount;
  const doneItems = doneCount + routinesDoneCount;
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  bar.innerHTML = `
    <div class="mv-summary-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="11" height="11"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      <span class="mv-summary-label">${t('month_tasks')}</span>
      <span class="mv-summary-value">${doneCount}/${taskCount}</span>
    </div>
    <div class="mv-summary-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="11" height="11"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
      <span class="mv-summary-label">${t('month_routines')}</span>
      <span class="mv-summary-value">${routinesDoneCount}/${routineCount}</span>
    </div>
    <div class="mv-summary-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="11" height="11"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span class="mv-summary-label">${t('month_focus')}</span>
      <span class="mv-summary-value">${focusMins >= 60 ? Math.floor(focusMins/60)+'h' + (focusMins%60 ? ' '+focusMins%60+'m' : '') : focusMins+'m'}</span>
    </div>
    <div class="mv-summary-item mv-summary-overall">
      <span class="mv-summary-label">${t('month_global')}</span>
      <span class="mv-summary-value">${overallPct}%</span>
    </div>
    <div class="mv-summary-progress"><div class="mv-summary-progress-fill" style="width:${overallPct}%"></div></div>
  `;
}

// ── DAY DETAIL MODAL ─────────────────────────────────────────────────────────
let _ddDateStr = null;

function openDayDetail(dateStr) {
  if (typeof openMonthDayModal === 'function') {
    openMonthDayModal(dateStr);
  }
}

function setMonthDayRating(dateStr, ratingVal) {
  if (!S.dayRatings) S.dayRatings = {};
  if (S.dayRatings[dateStr] === ratingVal) {
    delete S.dayRatings[dateStr];
  } else {
    S.dayRatings[dateStr] = ratingVal;
  }
  save();
  if (typeof openMonthDayModal === 'function') openMonthDayModal(dateStr);
  if (typeof renderMonthView === 'function') renderMonthView();
  if (typeof renderOverview === 'function') renderOverview();
}
window.setMonthDayRating = setMonthDayRating;

function closeDayDetail() {
  if (typeof closeMonthDayModal === 'function') {
    closeMonthDayModal();
  }
}

function goToDayFromDetail() {
  if (!_ddDateStr) return;
  const dateStr = _ddDateStr;
  closeDayDetail();
  closeMonthView();
  S.selectedNoteDate = dateStr;
  save();
  openNotes();
  selectMonthNoteDay(null, dateStr);
}

function openDayFromMonth(dateStr) {
  if (typeof openMonthDayModal === 'function') openMonthDayModal(dateStr);
}

function renderDayDetail(dateStr, dateObj) {
  const tasks = activeTasksForDate(dateObj);
  const done = tasks.filter(t => isCompleted(t, dateStr));

  const dow = dateObj.getDay();
  const activeRoutines = (S.routines || []).filter(r => {
    if (!r.tasks || !r.tasks.length) return false;
    return !r.days || !r.days.length || r.days.includes(dow);
  });

  const note = S.monthNotes && S.monthNotes[dateStr] || '';
  const noteText = note.replace(/<[^>]*>/g, '').trim();

  const sessions = (S.focusHistory || []).filter(s => s.date && s.date.startsWith(dateStr));
  const focusMins = sessions.reduce((a, s) => a + (s.duration || 0), 0);

  // Overall progress
  const totalItems = tasks.length + activeRoutines.length;
  const doneItems = done.length + activeRoutines.filter(r => {
    const comps = (r.completions && r.completions[dateStr]) || {};
    return r.tasks.every(t => comps[t.id]);
  }).length;
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : -1;

  let html = '';

  // Progress header
  if (overallPct >= 0) {
    html += `<div class="dd-progress-header">
      <div class="dd-progress-bar"><div class="dd-progress-fill" style="width:${overallPct}%"></div></div>
      <span class="dd-progress-label">${doneItems}/${totalItems} ${t('month_progress')}</span>
    </div>`;
  }

  // Group tasks by category
  const grouped = {};
  tasks.forEach(t => {
    const cat = t.category || '__none__';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  });

  const catOrder = Object.keys(grouped).sort((a, b) => {
    if (a === '__none__') return 1;
    if (b === '__none__') return -1;
    return 0;
  });

  if (tasks.length > 0) {
    html += `<div class="dd-section">
      <div class="dd-section-head">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="12" height="12"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        ${t('month_tasks')}
        <span class="dd-section-count">${done.length}/${tasks.length}</span>
      </div>`;
    catOrder.forEach(cat => {
      const items = grouped[cat];
      if (cat !== '__none__') {
        const catDone = items.filter(task => isCompleted(task, dateStr)).length;
        html += `<div class="dd-category-group">
          <div class="dd-category-head">
            <span class="dd-cat-dot" style="background:${CATEGORY_COLORS[cat] || '#888'}"></span>
            <span class="dd-category-label">${getCategoryLabel(cat) || t('task_cat_none')}</span>
            <span class="dd-category-count">${catDone}/${items.length}</span>
          </div>`;
      }
      items.forEach(task => {
        const isDone = isCompleted(task, dateStr);
        const catColor = task.category ? CATEGORY_COLORS[task.category] || '' : '';
        html += `<div class="dd-task-row ${isDone ? 'done' : ''}" onclick="toggleTaskDate('${escAttr(task.id)}','${escAttr(dateStr)}');renderDayDetail('${escAttr(dateStr)}',new Date('${escAttr(dateStr)}T12:00:00'));renderMonthView()">
          <div class="dd-check ${isDone ? 'checked' : ''}"></div>
          ${task.category && cat === '__none__' ? `<span class="dd-cat" style="color:${catColor}">${getCategoryLabel(task.category) || ''}</span>` : ''}
          <span class="dd-task-name">${escHtml(task.name)}</span>
          ${task.scheduledTime ? `<span class="dd-time">${task.scheduledTime}</span>` : ''}
          ${task.mins ? `<span class="dd-dur">${fmtMins(task.mins)}</span>` : ''}
        </div>`;
      });
      if (cat !== '__none__') html += `</div>`;
    });
    html += `</div>`;
  }

  // Routines section
  if (activeRoutines.length > 0) {
    html += `<div class="dd-section">
      <div class="dd-section-head">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="12" height="12"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        ${t('month_routines')}
      </div>`;
    activeRoutines.forEach(r => {
      const comps = (r.completions && r.completions[dateStr]) || {};
      const doneCount = (r.tasks || []).filter(t => comps[t.id]).length;
      const total = (r.tasks || []).length;
      const allDone = doneCount === total;
      html += `<div class="dd-routine-row ${allDone ? 'done' : ''}">
        <span class="dd-routine-dot" style="background:${r.color || '#6366f1'}"></span>
        <span class="dd-routine-name">${escHtml(r.name)}</span>
        <span class="dd-routine-prog">${doneCount}/${total}</span>
      </div>`;
    });
    html += `</div>`;
  }

  // Focus sessions
  if (sessions.length > 0) {
    html += `<div class="dd-section">
      <div class="dd-section-head">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${t('month_focus_total').replace('{total}', focusMins >= 60 ? Math.floor(focusMins/60)+'h' + (focusMins%60 ? ' '+focusMins%60+'m' : '') : focusMins+'m')}
      </div>`;
    sessions.forEach(s => {
      html += `<div class="dd-session-row">
        <span class="dd-session-dot"></span>
        <span class="dd-session-name">${escHtml(s.taskName || t('stats_free'))}</span>
        <span class="dd-session-dur">${fmtMins(s.duration || 0)}</span>
      </div>`;
    });
    html += `</div>`;
  }

  // Note (formatted)
  if (noteText) {
    html += `<div class="dd-section">
      <div class="dd-section-head">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="12" height="12"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>
        ${t('month_note')}
        <button class="dd-edit-note-btn" onclick="closeDayDetail();closeMonthView();openNotes();selectMonthNoteDay(null,'${dateStr}')" title="${t('month_edit_note')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="11" height="11"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </button>
      </div>
      <div class="dd-note-html">${note ? sanitizeNoteHtml(note) : ''}</div>
    </div>`;
  }

  if (!html) {
    html = `<div class="dd-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" width="28" height="28"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <p>${t('month_empty')}</p>
    </div>`;
  }

  document.getElementById('dd-content').innerHTML = html;
}

function addTaskForDay(dateStr) {
  closeDayDetail();
  closeMonthView();
  S.selectedDay = dateStr === today() ? null : dateStr;
  save();
  setView('main');
  scheduleRender(renderToday, renderWeekGrid);
}
