// Pace — Gestão de tarefas, templates, subtasks e filtros

// ----- SEARCH / FILTER -----
let _taskSearchQuery = '';
let _filterDebounceTimer = null;

function filterTasks(query) {
  _taskSearchQuery = (query || '').trim().toLowerCase();
  clearTimeout(_filterDebounceTimer);
  _filterDebounceTimer = setTimeout(() => scheduleRender(renderToday, renderWeekGrid), 50);
}

// ----- DATE PICKER (Dia específico) -----
function toggleDatePicker() {
  const recur = document.getElementById('inp-recur')?.value;
  const dateInput = document.getElementById('inp-date');
  if (!dateInput) return;
  if (recur === 'specific' || recur === 'monthly' || recur === 'yearly') {
    dateInput.classList.remove('hidden');
    // Default para hoje se não tiver valor
    if (!dateInput.value) dateInput.value = S.selectedDay || today();
  } else {
    dateInput.classList.add('hidden');
    dateInput.value = '';
  }
}

// ----- COLLAPSE (usado por renderWeekGrid) -----
let collapsedDays = new Set();

function toggleDayCollapse(dateStr) {
  if (collapsedDays.has(dateStr)) collapsedDays.delete(dateStr);
  else collapsedDays.add(dateStr);
  const card = document.getElementById('dc-' + dateStr);
  if (card) card.classList.toggle('collapsed');
}

function goToToday() {
  // Close any open modals
  if (typeof closeMonthDayModal === 'function') closeMonthDayModal();
  if (typeof closeStatsDayModal === 'function') closeStatsDayModal();
  if (typeof closeDayInspector === 'function') closeDayInspector();
  if (typeof closeMonthView === 'function') closeMonthView();
  if (typeof closeRoutines === 'function') closeRoutines();
  if (typeof closeSettings === 'function') closeSettings();

  ['modal-month-day', 'modal-stats-day', 'modal-day-inspector', 'modal-routines', 'modal-settings'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // Clear selected day to return to today
  S.selectedDay = null;
  save();

  // Switch to main view
  if (typeof setView === 'function') setView('main');
  else if (typeof openTasks === 'function') openTasks();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  scheduleRender(renderToday, renderWeekGrid);
}
window.goToToday = goToToday;

function selectDayFromWeek(dateStr) {
  // Se clicar em hoje, tratar como "sem seleção"
  S.selectedDay = dateStr === today() ? null : dateStr;
  save();
  scheduleRender(renderToday, renderWeekGrid);
}

function setTasksCurrentDayRating(rating) {
  const activeDay = S.selectedDay || today();
  if (!S.dayRatings || typeof S.dayRatings !== 'object') S.dayRatings = {};
  if (S.dayRatings[activeDay] === rating) {
    delete S.dayRatings[activeDay];
  } else {
    S.dayRatings[activeDay] = rating;
  }
  save();
  updateTasksDayRatingUI();
  if (typeof _renderOvStatsMiniCalendar === 'function') _renderOvStatsMiniCalendar();
}

function updateTasksDayRatingUI() {
  const activeDay = S.selectedDay || today();
  const currentRating = (S.dayRatings && S.dayRatings[activeDay]) || '';
  ['positive', 'neutral', 'negative'].forEach(r => {
    const pill = document.getElementById(`rate-pill-${r}`);
    if (pill) pill.classList.toggle('active', currentRating === r);
  });
}

// ----- CRUD -----
function addTask() {
  const inp = document.getElementById('task-input');
  const name = inp.value.trim();
  if (!name) {
    inp.focus();
    inp.style.borderBottomColor = 'var(--danger)';
    inp.style.animation = 'none';
    setTimeout(() => { inp.style.borderBottomColor = ''; }, 900);
    return;
  }
  const recur    = document.getElementById('inp-recur')?.value || 'once';
  const mins     = parseInt(document.getElementById('inp-duration')?.value) || 0;
  const priority = document.getElementById('inp-priority')?.value || 'normal';
  const category = document.getElementById('inp-category')?.value || '';
  const goalId   = document.getElementById('inp-goal')?.value || '';
  const notes    = document.getElementById('task-notes')?.value.trim() || '';

  // Data: "specific", "monthly" ou "yearly" usa o date picker ou o dia ativo
  const baseDate = S.selectedDay || today();
  const inputDateVal = document.getElementById('inp-date')?.value || baseDate;
  const chosenDate = (recur === 'specific' || recur === 'monthly' || recur === 'yearly')
    ? inputDateVal
    : baseDate;
  // Normalizar: "specific" é tratado como "once" internamente
  let taskRecur = recur === 'specific' ? 'once' : recur;
  let customRecur = null;
  if (recur === 'custom') customRecur = getCustomRecurFromForm();
  else if (recur === 'range') {
    const rStart = document.getElementById('range-recur-start')?.value || '';
    const rEnd = document.getElementById('range-recur-end')?.value || '';
    if (!rStart || !rEnd) {
      showToast('warn', t('task_empty_custom'), t('task_range_empty_msg'));
      return;
    }
    if (rStart > rEnd) {
      showToast('warn', t('task_invalid_dates'), t('task_invalid_dates_msg'));
      return;
    }
    customRecur = { start: rStart, end: rEnd, days: [], range: true };
    taskRecur = 'custom';
  }

  let monthlyDay = undefined;
  let yearlyMonth = undefined;
  let yearlyDay = undefined;

  if (taskRecur === 'monthly') {
    const parts = (chosenDate || baseDate).split('-').map(Number);
    monthlyDay = parts[2] || 1;
  } else if (taskRecur === 'yearly') {
    const parts = (chosenDate || baseDate).split('-').map(Number);
    yearlyMonth = parts[1] || 1;
    yearlyDay = parts[2] || 1;
  }

  const scheduledTime = document.getElementById('inp-time')?.value || undefined;
  const task = {
    id: Date.now().toString(),
    name, recur: taskRecur, mins, priority, category, goalId,
    notes: notes || undefined,
    customRecur: customRecur || undefined,
    scheduledTime,
    completions: {},
    date: (taskRecur === 'once' || taskRecur === 'monthly' || taskRecur === 'yearly') ? chosenDate : undefined,
    monthlyDay,
    yearlyMonth,
    yearlyDay,
    createdAt: today(),
  };
  S.tasks.unshift(task);
  save();
  inp.value = '';
  const taskNotesInput = document.getElementById('task-notes');
  if (taskNotesInput) { taskNotesInput.value = ''; taskNotesInput.classList.add('hidden'); }
  const toggleNotesEl = document.getElementById('toggle-notes-btn');
  if (toggleNotesEl) toggleNotesEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="10" height="10"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> ' + t('task_add_notes');
  const timeEl = document.getElementById('inp-time');
  if (timeEl) timeEl.value = '';
  resetCustomRecurForm();
  scheduleRender(renderToday, renderWeekGrid);
  renderTemplatePicker();
  const durText = mins === 0 ? t('task_indefinite') : fmtMins(mins);
  showToast('success', t('task_added'), `"${name}" — ${durText}`);
}

function deleteTask(id) {
  const task = S.tasks.find(x => x.id === id);
  if (!task) return;
  if (task.archived) {
    S.tasks = S.tasks.filter(x => x.id !== id);
    save();
    scheduleRender(renderToday, renderWeekGrid);
    showToast('info', window.t('task_removed'), `"${task.name}"`);
    return;
  }
  const hasHistory = (task.completions && Object.keys(task.completions).length > 0) || !!task.rangeDone;
  showConfirm({
    title: window.t('task_archive_title'),
    msg: hasHistory
      ? window.t('task_archive_msg_done').replace('{name}', task.name)
      : window.t('task_archive_msg').replace('{name}', task.name),
    okLabel: window.t('task_archive_btn'),
    type: 'danger',
    onOk: () => {
      task.archived = true;
      save();
      scheduleRender(renderToday, renderWeekGrid);
      showToast('info', window.t('task_archived'), `"${task.name}"`);
    }
  });
}

function toggleTaskDate(id, dateStr) {
  const task = S.tasks.find(x => x.id === id);
  if (!task) return;
  const was = isCompleted(task, dateStr);
  const willBe = !was;
  setCompleted(task, dateStr, willBe);
  if (task.subtasks && task.subtasks.length > 0) {
    task.subtasks.forEach(st => { st.done = willBe; });
  }
  save();
  scheduleRender(renderToday, renderWeekGrid);
  if (typeof renderOverview === 'function') renderOverview();
  if (typeof renderNotesDayTasks === 'function') renderNotesDayTasks();
  if (willBe) showToast('success', window.t('task_completed'), `"${task.name}"`);
}

// ----- RENDER TODAY -----
function renderToday() {
  const activeDay = S.selectedDay || today();
  const todayStr = today();
  const dateObj = S.selectedDay ? new Date(S.selectedDay + 'T12:00:00') : new Date();
  const list = document.getElementById('today-list');
  if (!list) return;

  // Day selector bar
  const daySelector = document.getElementById('day-selector');
  if (daySelector) {
    const isToday = !S.selectedDay;
    daySelector.innerHTML = isToday ? '' : `
      <div class="day-selector-bar">
        <button class="day-selector-back" onclick="goToToday()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="10" height="10"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${new Date(S.selectedDay + 'T12:00:00').toLocaleDateString(window.t('misc_locale'), { weekday: 'short', day: 'numeric', month: 'short' })} · ${window.t('tasks_back_today')}
        </button>
      </div>
    `;
  }

  const tasks = S.tasks.filter(t => !t.archived && taskActiveOnDate(t, dateObj));
  const routineTasks = getActiveRoutineTasksForDate(dateObj, activeDay);
  let allTasks = [...routineTasks, ...tasks];

  // Filter by search query across name, notes, category, and subtasks
  if (_taskSearchQuery) {
    allTasks = allTasks.filter(t =>
      (t.name || '').toLowerCase().includes(_taskSearchQuery) ||
      (t.notes || '').toLowerCase().includes(_taskSearchQuery) ||
      (t.category || '').toLowerCase().includes(_taskSearchQuery) ||
      (t.subtasks && t.subtasks.some(st => (st.name || '').toLowerCase().includes(_taskSearchQuery)))
    );
  }

  const pending = allTasks.filter(tk => tk._isRoutine ? !tk._done : !isCompleted(tk, activeDay));
  const done    = allTasks.filter(tk => tk._isRoutine ? tk._done : isCompleted(tk, activeDay));
  const countEl = document.getElementById('today-count');
  if (countEl) countEl.textContent = allTasks.length ? `${done.length}/${allTasks.length}` : '';

  updateTasksDayRatingUI();
  updateTaskSortLabel();

  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = allTasks.length ? `${(done.length / allTasks.length) * 100}%` : '0%';

  if (!allTasks.length) {
    list.innerHTML = `<div class="empty-state">${t('task_empty_today')}</div>`;
    return;
  }

  const sortMode = settings.taskSort || 'default';
  function sortTaskList(items) {
    const arr = [...items];
    if (sortMode === 'top_to_bottom') {
      return arr;
    } else if (sortMode === 'bottom_to_top') {
      return arr.reverse();
    } else if (sortMode === 'priority') {
      const pWeights = { high: 3, normal: 2, low: 1 };
      return arr.sort((a, b) => {
        const pa = pWeights[a.priority] || 2;
        const pb = pWeights[b.priority] || 2;
        return pb - pa;
      });
    } else if (sortMode === 'time') {
      return arr.sort((a, b) => {
        if (a.scheduledTime && b.scheduledTime) return a.scheduledTime.localeCompare(b.scheduledTime);
        if (a.scheduledTime) return -1;
        if (b.scheduledTime) return 1;
        return 0;
      });
    } else if (sortMode === 'duration') {
      return arr.sort((a, b) => {
        const ma = Number.isFinite(a.mins) && a.mins > 0 ? a.mins : 9999;
        const mb = Number.isFinite(b.mins) && b.mins > 0 ? b.mins : 9999;
        return ma - mb;
      });
    } else if (sortMode === 'alpha') {
      return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return arr;
  }

  const sortedPending = sortTaskList(pending);
  const sortedDone    = sortTaskList(done);

  list.innerHTML = [...sortedPending, ...sortedDone].map(task => {
    if (task._isRoutine) {
      const isDone = task._done;
      const timeBadge = task.scheduledTime ? `<span class="task-time-badge">${escHtml(task.scheduledTime)}</span>` : '';
      return `
        <div class="task-row ${isDone ? 'done' : ''}">
          <button class="task-check" onclick="toggleRoutineTask('${escAttr(task.routineId)}','${escAttr(task.routineTaskId)}','${escAttr(activeDay)}')"></button>
          <div class="task-content">
            <div class="task-name-row">
              <span class="task-routine-badge" style="background:${task.routineColor || '#6366f1'};color:${window.getContrastColor ? window.getContrastColor(task.routineColor || '#6366f1') : '#fff'}">${escHtml(task.routineName)}</span>
              <span class="task-name">${escHtml(task.name)}</span>
            </div>
            ${task.notes ? `<div class="task-notes-preview">${escHtml(task.notes)}</div>` : ''}
          </div>
          <div class="task-badges">
            ${timeBadge}
            <span class="badge-recur">${window.t('task_routine_badge')}</span>
            <span class="task-mins">${fmtMins(task.mins)}</span>
          </div>
        </div>`;
    }

    const isDone = isCompleted(task, activeDay);
    const label  = task.recur === 'custom' ? getCustomRecurLabel(task.customRecur) : (getRecurLabel(task.recur) || '');
    const prio   = task.priority || 'normal';
    const catLabel = task.category ? getCategoryLabel(task.category) || '' : '';
    const catColor = task.category ? CATEGORY_COLORS[task.category] || '' : '';
    const catContrast = catColor && window.getContrastColor ? window.getContrastColor(catColor) : '#fff';
    const prioHtml = prio === 'high'
      ? `<span class="badge-priority-high">${window.t('task_priority_urgente')}</span>`
      : prio === 'low'
      ? `<span class="badge-priority-low">${window.t('task_priority_baixa')}</span>`
      : '';
    const timeBadge = task.scheduledTime
      ? `<span class="task-time-badge">${escHtml(task.scheduledTime)}</span>`
      : '';
    const subtasksHtml = task.subtasks && task.subtasks.length
      ? `<div class="subtask-list">${task.subtasks.map(st =>
          `<div class="subtask-row">
            <button class="subtask-check ${st.done ? 'done' : ''}" onclick="toggleSubtask('${escAttr(task.id)}','${escAttr(st.id)}')"></button>
            <span class="subtask-name ${st.done ? 'done' : ''}">${escHtml(st.name)}</span>
            <button class="subtask-del" onclick="deleteSubtask('${escAttr(task.id)}','${escAttr(st.id)}')">×</button>
          </div>`
        ).join('')}</div>`
      : '';
    return `
      <div class="task-row ${isDone ? 'done' : ''} priority-${prio}" data-task-id="${escAttr(task.id)}" onpointerdown="onPointerDownTask(event,'${escAttr(task.id)}')" title="${task.notes ? escAttr(task.notes) : ''}">
        <span class="drag-handle" onpointerdown="onPointerDownTask(event,'${escAttr(task.id)}')">⠿</span>
        <button class="task-check" onclick="toggleTaskDate('${escAttr(task.id)}','${escAttr(activeDay)}')"></button>
        <div class="task-content">
          <div class="task-name-row">
            ${catLabel ? `<span class="task-cat-badge" style="background: ${catColor}; color: ${catContrast}">${catLabel}</span>` : ''}
            <span class="task-name">${escHtml(task.name)}</span>
          </div>
          ${task.notes ? `<div class="task-notes-preview">${escHtml(task.notes)}</div>` : ''}
          ${subtasksHtml}
          <div class="subtask-add-form">
            <input class="subtask-add-input" id="st-input-${escAttr(task.id)}" placeholder="${window.t('task_subtask_placeholder')}" autocomplete="off" onkeydown="if(event.key==='Enter')addSubtask('${escAttr(task.id)}',this.value)"/>
            <button class="subtask-add-btn" onclick="addSubtask('${escAttr(task.id)}',document.getElementById('st-input-${escAttr(task.id)}').value)">+</button>
          </div>
        </div>
        <div class="task-badges">
          ${timeBadge}
          ${prioHtml}
          ${label ? `<span class="badge-recur">${label}</span>` : ''}
          <span class="task-mins">${fmtMins(task.mins)}</span>
        </div>
        <div class="task-actions">
          <button class="task-action-btn" onclick="saveTaskAsTemplate('${escAttr(task.id)}')" title="${window.t('task_save_template')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="10" height="10"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </button>
          <button class="task-del" onclick="deleteTask('${escAttr(task.id)}')">×</button>
        </div>
      </div>`;
  }).join('');
  _initDragDrop();
}

// ----- RENDER WEEK GRID -----
function renderWeekGrid() {
  const days = getWeekDays(S.weekOffset);
  const todayStr = today();
  const grid = document.getElementById('week-grid');
  if (!grid) return;
  const mode = settings.weekView || 'stats';

  grid.className = 'week-grid week-mode-' + mode;

  grid.innerHTML = days.map(dateObj => {
    const dateStr = fmtDate(dateObj);
    const isToday = dateStr === todayStr;
    const dow = dateObj.getDay();
    let dayTasks = activeTasksForDate(dateObj);
    if (_taskSearchQuery) {
      dayTasks = dayTasks.filter(tk =>
        (tk.name || '').toLowerCase().includes(_taskSearchQuery) ||
        (tk.notes || '').toLowerCase().includes(_taskSearchQuery) ||
        (tk.category || '').toLowerCase().includes(_taskSearchQuery) ||
        (tk.subtasks && tk.subtasks.some(st => (st.name || '').toLowerCase().includes(_taskSearchQuery)))
      );
    }
    const doneCount = dayTasks.filter(tk => isCompleted(tk, dateStr)).length;
    const collapsed = collapsedDays.has(dateStr) && !isToday && dateStr !== (S.selectedDay || todayStr);

    const activeRoutines = (S.routines || []).filter(r => {
      if (!r.tasks || !r.tasks.length) return false;
      return !r.days || !r.days.length || r.days.includes(dow);
    });

    const totalCount = dayTasks.length + activeRoutines.length;
    const doneRoutines = activeRoutines.filter(r => {
      const comps = (r.completions && r.completions[dateStr]) || {};
      return r.tasks.length > 0 && r.tasks.every(rt => comps[rt.id]);
    }).length;
    const totalDone = doneCount + doneRoutines;

    const dayMins = dayTasks.reduce((a, tk) => a + (tk.mins || 0), 0);
    const avgMins = dayTasks.length > 0 ? Math.round(dayMins / dayTasks.length) : 0;
    const pct = totalCount > 0 ? Math.round((totalDone / totalCount) * 100) : 0;

    // --- Build inner content based on mode ---
    let innerHtml = '';

    if (mode === 'stats') {
      if (totalCount > 0) {
        const statsItems = [];
        statsItems.push(`<span class="day-stat-num">${totalDone}/${totalCount}</span>`);
        if (dayMins > 0) statsItems.push(`<span class="day-stat-sep">·</span><span class="day-stat-dur">${fmtMins(dayMins)}</span>`);
        if (dayTasks.length > 1 && avgMins > 0) statsItems.push(`<span class="day-stat-sep">·</span><span class="day-stat-avg">~${fmtMins(avgMins)}/t</span>`);
        const routinesPills = activeRoutines.map(r => {
          const tasks = r.tasks || [];
          const completions = (r.completions && r.completions[dateStr]) || {};
          const doneAll = tasks.length > 0 && tasks.every(rt => completions[rt.id]);
          return `<span class="day-routine-pill ${doneAll ? 'done' : ''}" style="--rc:${r.color || '#6366f1'}" title="${escHtml(r.name)}">${escHtml(r.name)}</span>`;
        }).join('');
        innerHtml = `<div class="day-stats-row">${statsItems.join('')}</div>${routinesPills ? `<div class="day-routines-row">${routinesPills}</div>` : ''}`;
      }
    } else if (mode === 'compact') {
      const routinesHtml = activeRoutines.map(r => {
        const tasks = r.tasks || [];
        const completions = (r.completions && r.completions[dateStr]) || {};
        const doneAll = tasks.length > 0 && tasks.every(rt => completions[rt.id]);
        return `<span class="day-routine-pill ${doneAll ? 'done' : ''}" style="--rc:${r.color || '#6366f1'}" title="${escHtml(r.name)}">${escHtml(r.name)}</span>`;
      }).join('');
      const tasksHtml = dayTasks.map(tk => {
        const done = isCompleted(tk, dateStr);
        const catColor = tk.category ? CATEGORY_COLORS[tk.category] || '' : '';
        return `<div class="day-task-compact ${done ? 'done' : ''}" data-task-id="${escAttr(tk.id)}" onpointerdown="onPointerDownTask(event,'${escAttr(tk.id)}')" onclick="toggleTaskDate('${escAttr(tk.id)}','${escAttr(dateStr)}')">
          <span class="day-task-cdot" style="background:${done ? 'var(--success)' : catColor || 'var(--border2)'}"></span>
          <span class="day-task-cname">${escHtml(tk.name)}</span>
          ${tk.mins ? `<span class="day-task-cdur">${fmtMins(tk.mins)}</span>` : ''}
        </div>`;
      }).join('');
      innerHtml = routinesHtml ? `<div class="day-routines-row">${routinesHtml}</div>` : '';
      innerHtml += tasksHtml;
    } else {
      // full
      const routinesHtml = activeRoutines.map(r => {
        const tasks = r.tasks || [];
        const completions = (r.completions && r.completions[dateStr]) || {};
        const doneAll = tasks.length > 0 && tasks.every(rt => completions[rt.id]);
        return `
          <div class="day-routine-row ${doneAll ? 'done' : ''}">
            <span class="day-routine-dot" style="background:${r.color || '#6366f1'}"></span>
            <span class="day-routine-name">${escHtml(r.name)}</span>
            ${doneAll ? '<span class="day-routine-badge">✓</span>' : `<span class="day-routine-count">${tasks.filter(rt => completions[rt.id]).length}/${tasks.length}</span>`}
          </div>`;
      }).join('');
      const tasksHtml = dayTasks.map(tk => {
        const done = isCompleted(tk, dateStr);
        const label = tk.recur === 'custom' ? getCustomRecurLabel(tk.customRecur) : (getRecurLabel(tk.recur) || '');
        const catLabel = tk.category ? getCategoryLabel(tk.category) || '' : '';
        const catColor = tk.category ? CATEGORY_COLORS[tk.category] || '' : '';
        return `
          <div class="day-task-row ${done ? 'done' : ''}" data-task-id="${escAttr(tk.id)}" onpointerdown="onPointerDownTask(event,'${escAttr(tk.id)}')" title="${tk.notes ? escAttr(tk.notes) : ''}">
            <button class="day-task-check" onclick="toggleTaskDate('${escAttr(tk.id)}','${escAttr(dateStr)}')"></button>
            ${catLabel ? `<span class="day-task-cat" style="color: ${catColor}">${catLabel}</span>` : ''}
            <span class="day-task-name">${escHtml(tk.name)}</span>
            ${label ? `<span class="day-task-recur">${label}</span>` : ''}
            <button class="day-task-del" onclick="deleteTask('${escAttr(tk.id)}')">×</button>
          </div>`;
      }).join('');
      innerHtml = routinesHtml + tasksHtml;
    }

    // --- Header dots (full mode only) ---
    const dotsHtml = mode === 'full'
      ? `<div class="day-dots">${dayTasks.slice(0, 6).map(tk =>
          `<div class="day-dot ${isCompleted(tk, dateStr) ? 'done' : 'pending'}"></div>`
        ).join('')}</div>`
      : (totalCount > 0 ? `<div class="day-mini-bar"><div class="day-mini-fill" style="width:${pct}%"></div></div>` : '');

    const countLabel = mode === 'stats'
      ? (totalCount > 0 ? '' : '<span class="day-stat-empty">—</span>')
      : `${totalDone}/${totalCount}`;

    return `
      <div class="day-card ${isToday ? 'today' : ''} ${collapsed ? 'collapsed' : ''}" id="dc-${dateStr}" data-date="${dateStr}"
           ondragover="onDayDragOver(event,'${escAttr(dateStr)}')"
           ondragenter="onDayDragOver(event,'${escAttr(dateStr)}')"
           ondragleave="onDayDragLeave(event,'${escAttr(dateStr)}')"
           ondrop="onDayDrop(event,'${escAttr(dateStr)}')">
        <div class="day-head" onclick="selectDayFromWeek('${escAttr(dateStr)}')">
          <div class="day-head-left">
            <span class="day-name">${getDaysShort()[dow]}${isToday ? ' · ' + t('week_today') : ''}</span>
            <span class="day-date">${dateObj.getDate()} ${dateObj.toLocaleDateString(t('misc_locale'),{month:'short'})}</span>
          </div>
          <div class="day-progress">
            ${dotsHtml}
            <span class="day-count">${countLabel}</span>
          </div>
        </div>
        <div class="day-tasks">
          ${innerHtml || `<div class="day-empty">${t('task_empty_day')}</div>`}
        </div>
      </div>`;
  }).join('');
  renderWeekDatePicker();
}

// ----- FOCUS PICKER -----
function openFocusPicker() {
  const todayStr  = today();
  const todayDate = new Date();
  const pending   = S.tasks.filter(t => !t.archived && taskActiveOnDate(t, todayDate) && !isCompleted(t, todayStr));
  const sel = document.getElementById('fp-task');
  sel.innerHTML = `<option value="">${t('task_focus_free')}</option>` +
    (pending.length
      ? pending.map(task => {
          const catLabel = task.category ? (getCategoryLabel(task.category) || task.category) + ' — ' : '';
          const durText = task.mins === 0 ? window.t('task_dur_indef') : fmtMins(task.mins);
          return `<option value="${task.id}">${catLabel}${escHtml(task.name)} (${durText})</option>`;
        }).join('')
      : '');

  const task = pending[0];
  if (task && task.mins > 0) {
    const hours = Math.floor(task.mins / 60);
    const mins = task.mins % 60;
    document.getElementById('fp-hours').value = hours;
    document.getElementById('fp-minutes').value = mins;
    document.getElementById('fp-seconds').value = 0;
  }

  sel.removeEventListener('change', updateDurationFromTask);
  sel.addEventListener('change', updateDurationFromTask);
  rebuildCustomSelect(sel);
  document.getElementById('modal-focus').classList.remove('hidden');
}

function openFocusWithTask(taskId) {
  openFocusPicker();
  const sel = document.getElementById('fp-task');
  if (sel && taskId) {
    sel.value = taskId;
    updateDurationFromTask();
    if (typeof rebuildCustomSelect === 'function') rebuildCustomSelect(sel);
  }
}
window.openFocusWithTask = openFocusWithTask;

function updateDurationFromTask() {
  const taskId = document.getElementById('fp-task').value;
  const task = S.tasks.find(t => t.id === taskId);
  if (task && task.mins > 0) {
    const hours = Math.floor(task.mins / 60);
    const mins = task.mins % 60;
    document.getElementById('fp-hours').value = hours;
    document.getElementById('fp-minutes').value = mins;
    document.getElementById('fp-seconds').value = 0;
  }
}

function adjustDuration(fieldId, delta) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  const max = fieldId === 'fp-hours' ? 23 : 59;
  let val = (parseInt(el.value) || 0) + delta;
  if (val < 0) val = max;
  if (val > max) val = 0;
  el.value = val;
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
}

function setDuration(hours, mins, btn) {
  document.getElementById('fp-hours').value = hours;
  document.getElementById('fp-minutes').value = mins;
  document.getElementById('fp-seconds').value = 0;
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ----- GOALS SELECT -----
function updateGoalsSelect() {
  const sel = document.getElementById('inp-goal');
  if (!sel) return;
  sel.innerHTML = `<option value="">${t('task_no_goal')}</option>` +
    S.goals.map(g => `<option value="${g.id}">${escHtml(g.name)}</option>`).join('');
  rebuildCustomSelect(sel);
}

// ----- WEEK DATE PICKER -----
function renderWeekDatePicker() {
  const monthEl = document.getElementById('week-month-select');
  const yearEl = document.getElementById('week-year-select');
  if (!monthEl || !yearEl) return;
  
  const currentWeek = getWeekDays(S.weekOffset);
  const weekStart = currentWeek[0];
  
  const monthNames = Array.from({length: 12}, (_, i) => new Date(2024, i, 1).toLocaleDateString(t('misc_locale'), { month: 'short' }));
  
  monthEl.innerHTML = monthNames.map((name, i) => 
    `<option value="${i}" ${i === weekStart.getMonth() ? 'selected' : ''}>${name}</option>`
  ).join('');
  
  const year = weekStart.getFullYear();
  const years = [];
  for (let y = year - 5; y <= year + 5; y++) years.push(y);
  yearEl.innerHTML = years.map(y => 
    `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`
  ).join('');

  rebuildCustomSelect(monthEl);
  rebuildCustomSelect(yearEl);
}

function jumpToWeekFromPicker() {
  const month = parseInt(document.getElementById('week-month-select')?.value);
  const year = parseInt(document.getElementById('week-year-select')?.value);
  if (isNaN(month) || isNaN(year)) return;
  
  const target = new Date(year, month, 1);
  const todayDate = new Date();
  const todayMonday = new Date(todayDate);
  todayMonday.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
  
  const targetMonday = new Date(target);
  targetMonday.setDate(target.getDate() - ((target.getDay() + 6) % 7));
  
  const diffWeeks = Math.round((targetMonday - todayMonday) / (7 * 86400000));
  S.weekOffset = diffWeeks;
  save();
  scheduleRender(renderWeekGrid, renderWeekDatePicker);
}

// ----- DRAG & DROP ENGINE (POINTER & HTML5) -----
let _dragSrcId = null;
let _ptrDrag = {
  active: false,
  taskId: null,
  startX: 0,
  startY: 0,
  ghostEl: null,
  sourceEl: null,
  pointerId: null
};

function onPointerDownTask(e, taskId) {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  if (e.target.closest('button, input, textarea, select, .task-check, .subtask-check, .subtask-del, .task-del, .task-action-btn')) {
    return;
  }
  
  _ptrDrag.taskId = taskId;
  _ptrDrag.startX = e.clientX;
  _ptrDrag.startY = e.clientY;
  _ptrDrag.active = false;
  _ptrDrag.pointerId = e.pointerId;
  _ptrDrag.sourceEl = e.currentTarget || (e.target && e.target.closest('.task-row')) || (e.target && e.target.closest('.day-task-row')) || (e.target && e.target.closest('.day-task-compact'));

  try {
    if (e.target && typeof e.target.setPointerCapture === 'function') {
      e.target.setPointerCapture(e.pointerId);
    }
  } catch {}

  window.addEventListener('pointermove', onPointerMoveTask);
  window.addEventListener('pointerup', onPointerUpTask);
  window.addEventListener('pointercancel', onPointerUpTask);
}

function onPointerMoveTask(e) {
  if (!_ptrDrag.taskId) return;
  const dx = e.clientX - _ptrDrag.startX;
  const dy = e.clientY - _ptrDrag.startY;
  
  if (!_ptrDrag.active) {
    if (Math.hypot(dx, dy) < 4) return;
    _ptrDrag.active = true;
    
    const task = S.tasks.find(t => t.id === _ptrDrag.taskId);
    if (!task) return;
    
    const ghost = document.createElement('div');
    ghost.className = 'pace-drag-ghost';
    ghost.style.pointerEvents = 'none';
    ghost.innerHTML = `<span class="pace-ghost-dot"></span><span>${escHtml(task.name)}</span>`;
    document.body.appendChild(ghost);
    _ptrDrag.ghostEl = ghost;
    
    if (_ptrDrag.sourceEl) {
      _ptrDrag.sourceEl.classList.add('dragging');
      _ptrDrag.sourceEl.style.pointerEvents = 'none';
    }
  }
  
  if (_ptrDrag.ghostEl) {
    _ptrDrag.ghostEl.style.left = (e.clientX + 14) + 'px';
    _ptrDrag.ghostEl.style.top = (e.clientY + 14) + 'px';
  }
  
  const target = document.elementFromPoint(e.clientX, e.clientY);
  document.querySelectorAll('.task-row.drag-over, .task-row.drag-over-bottom, .day-card.day-drag-hover').forEach(el => {
    el.classList.remove('drag-over', 'drag-over-bottom', 'day-drag-hover');
  });
  
  if (!target) return;
  
  const dayCard = target.closest('.day-card');
  if (dayCard) {
    dayCard.classList.add('day-drag-hover');
    return;
  }
  
  const taskRow = target.closest('.task-row');
  if (taskRow && taskRow !== _ptrDrag.sourceEl) {
    const rect = taskRow.getBoundingClientRect();
    if (e.clientY < rect.top + rect.height / 2) {
      taskRow.classList.add('drag-over');
    } else {
      taskRow.classList.add('drag-over-bottom');
    }
  }
}

function onPointerUpTask(e) {
  window.removeEventListener('pointermove', onPointerMoveTask);
  window.removeEventListener('pointerup', onPointerUpTask);
  window.removeEventListener('pointercancel', onPointerUpTask);
  
  if (_ptrDrag.pointerId !== null && e.target && typeof e.target.releasePointerCapture === 'function') {
    try { e.target.releasePointerCapture(_ptrDrag.pointerId); } catch {}
  }

  if (!_ptrDrag.active || !_ptrDrag.taskId) {
    if (_ptrDrag.sourceEl) _ptrDrag.sourceEl.style.pointerEvents = '';
    _ptrDrag.taskId = null;
    _ptrDrag.pointerId = null;
    return;
  }
  
  const taskId = _ptrDrag.taskId;
  
  if (_ptrDrag.sourceEl) {
    _ptrDrag.sourceEl.style.pointerEvents = '';
  }

  const target = document.elementFromPoint(e.clientX, e.clientY);
  
  if (_ptrDrag.ghostEl) {
    _ptrDrag.ghostEl.remove();
    _ptrDrag.ghostEl = null;
  }
  
  document.querySelectorAll('.task-row.drag-over, .task-row.drag-over-bottom, .day-card.day-drag-hover').forEach(el => {
    el.classList.remove('drag-over', 'drag-over-bottom', 'day-drag-hover');
  });
  if (_ptrDrag.sourceEl) _ptrDrag.sourceEl.classList.remove('dragging');
  _ptrDrag.active = false;
  _ptrDrag.taskId = null;
  _ptrDrag.pointerId = null;
  
  if (!target) return;
  
  // Dropped on a day card on the sidebar
  const dayCard = target.closest('.day-card');
  if (dayCard) {
    const dateStr = dayCard.id ? dayCard.id.replace('dc-', '') : dayCard.dataset.date;
    if (dateStr) {
      const task = S.tasks.find(t => t.id === taskId);
      if (task) {
        task.date = dateStr;
        task.recur = 'once';
        save();
        scheduleRender(renderToday, renderWeekGrid);
        const targetDateObj = new Date(dateStr + 'T12:00:00');
        const formattedDay = targetDateObj.toLocaleDateString(t('misc_locale'), { weekday: 'long', day: 'numeric', month: 'short' });
        showToast('success', t('task_moved_day', 'Tarefa movida'), `"${task.name}" ➔ ${formattedDay}`);
      }
    }
    return;
  }
  
  // Dropped on a task row in the daily list
  const targetRow = target.closest('.task-row');
  if (targetRow && targetRow.dataset.taskId) {
    const targetId = targetRow.dataset.taskId;
    if (targetId && targetId !== taskId) {
      const rect = targetRow.getBoundingClientRect();
      const isBottom = e.clientY >= rect.top + rect.height / 2;
      
      const srcIdx = S.tasks.findIndex(t => t.id === taskId);
      const tgtIdx = S.tasks.findIndex(t => t.id === targetId);
      if (srcIdx !== -1 && tgtIdx !== -1) {
        const [moved] = S.tasks.splice(srcIdx, 1);
        let newTgtIdx = S.tasks.findIndex(t => t.id === targetId);
        if (newTgtIdx === -1) {
          S.tasks.push(moved);
        } else {
          if (isBottom) newTgtIdx++;
          S.tasks.splice(newTgtIdx, 0, moved);
        }
        settings.taskSort = 'default';
        localStorage.setItem('li_settings', JSON.stringify(settings));
        save();
        scheduleRender(renderToday, renderWeekGrid);
      }
    }
  }
}

function onDragStart(e, id) {
  _dragSrcId = id;
  window._dragSrcTaskId = id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.setData('application/x-pace-task', id);
    } catch {}
  }
  const el = (e.target && e.target.closest('.task-row')) || (e.currentTarget && e.currentTarget.closest('.task-row')) || e.currentTarget || e.target;
  if (el) {
    setTimeout(() => { if (el) el.classList.add('dragging'); }, 0);
  }
}

function onDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  const row = e.currentTarget;
  if (!row) return;
  const rect = row.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  row.classList.remove('drag-over', 'drag-over-bottom');
  if (e.clientY < midY) row.classList.add('drag-over');
  else row.classList.add('drag-over-bottom');
}

function onDragLeave(e) {
  if (e.currentTarget && (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget))) {
    e.currentTarget.classList.remove('drag-over', 'drag-over-bottom');
  }
}

function onDragEnd(e) {
  window._dragSrcTaskId = null;
  _dragSrcId = null;
  document.querySelectorAll('.task-row.drag-over, .task-row.drag-over-bottom, .day-card.day-drag-hover').forEach(el => {
    el.classList.remove('drag-over', 'drag-over-bottom', 'day-drag-hover');
  });
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
}

function onDrop(e, targetId) {
  e.preventDefault();
  e.stopPropagation();
  const row = e.currentTarget;
  const isBottom = row && row.classList.contains('drag-over-bottom');
  
  onDragEnd(e);

  const id = _dragSrcId || window._dragSrcTaskId || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
  _dragSrcId = null;
  window._dragSrcTaskId = null;
  if (!id || id === targetId) return;

  const srcIdx = S.tasks.findIndex(t => t.id === id);
  const tgtIdx = S.tasks.findIndex(t => t.id === targetId);
  if (srcIdx === -1 || tgtIdx === -1) return;

  const [moved] = S.tasks.splice(srcIdx, 1);
  let newTgtIdx = S.tasks.findIndex(t => t.id === targetId);
  if (newTgtIdx === -1) {
    S.tasks.push(moved);
  } else {
    if (isBottom) newTgtIdx++;
    S.tasks.splice(newTgtIdx, 0, moved);
  }

  // Switch to default manual sort mode so manual reordering is preserved
  settings.taskSort = 'default';
  localStorage.setItem('li_settings', JSON.stringify(settings));

  save();
  scheduleRender(renderToday, renderWeekGrid);
}

function onTodayListDragOver(e) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
}

function onTodayListDrop(e) {
  e.preventDefault();
  const id = _dragSrcId || window._dragSrcTaskId || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
  onDragEnd(e);
  if (!id) return;
  const task = S.tasks.find(t => t.id === id);
  if (!task) return;
  const activeDay = S.selectedDay || today();
  task.date = activeDay;
  task.recur = 'once';
  save();
  scheduleRender(renderToday, renderWeekGrid);
}

function onDayDragOver(e, dateStr) {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  const card = document.getElementById('dc-' + dateStr);
  if (card) card.classList.add('day-drag-hover');
}

function onDayDragLeave(e, dateStr) {
  const card = document.getElementById('dc-' + dateStr);
  if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
    card.classList.remove('day-drag-hover');
  }
}

function onDayDrop(e, dateStr) {
  e.preventDefault();
  e.stopPropagation();
  const card = document.getElementById('dc-' + dateStr);
  if (card) card.classList.remove('day-drag-hover');
  
  const id = _dragSrcId || window._dragSrcTaskId || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
  onDragEnd(e);
  if (!id || !dateStr) return;

  const task = S.tasks.find(t => t.id === id);
  if (!task) return;

  const oldDate = task.date || today();
  if (oldDate === dateStr && (task.recur === 'once' || !task.recur)) return;

  // Move task to target date
  task.date = dateStr;
  task.recur = 'once';
  save();
  scheduleRender(renderToday, renderWeekGrid);

  const targetDateObj = new Date(dateStr + 'T12:00:00');
  const formattedDay = targetDateObj.toLocaleDateString(t('misc_locale'), { weekday: 'long', day: 'numeric', month: 'short' });
  showToast('success', t('task_moved_day', 'Tarefa movida'), `"${task.name}" ➔ ${formattedDay}`);
}

function _initDragDrop() {
  document.querySelectorAll('.task-row.drag-over, .task-row.drag-over-bottom, .day-card.day-drag-hover').forEach(el => {
    el.classList.remove('drag-over', 'drag-over-bottom', 'day-drag-hover');
  });
}

// Global dragover preventDefault
window.addEventListener('dragover', function(e) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
}, true);

window.addEventListener('dragenter', function(e) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
}, true);

window.onPointerDownTask = onPointerDownTask;
window.onDragStart = onDragStart;
window.onDragOver = onDragOver;
window.onDragLeave = onDragLeave;
window.onDragEnd = onDragEnd;
window.onDrop = onDrop;
window.onTodayListDragOver = onTodayListDragOver;
window.onTodayListDrop = onTodayListDrop;
window.onDayDragOver = onDayDragOver;
window.onDayDragLeave = onDayDragLeave;
window.onDayDrop = onDayDrop;
window.toggleSubtask = toggleSubtask;

// ----- SUBTASKS -----
function addSubtask(taskId, name) {
  const task = S.tasks.find(x => x.id === taskId);
  if (!task || !name || !name.trim()) return;
  if (!task.subtasks) task.subtasks = [];
  task.subtasks.push({ id: 'st_' + Date.now(), name: name.trim(), done: false });
  save();
  scheduleRender(renderToday);
}

function toggleSubtask(taskId, subtaskId, dateStr) {
  const task = S.tasks.find(x => x.id === taskId);
  if (!task || !task.subtasks) return;
  const st = task.subtasks.find(x => x.id === subtaskId);
  if (!st) return;
  st.done = !st.done;
  const activeDay = dateStr || S.selectedDay || today();

  // If a subtask is unchecked while the parent task is marked completed,
  // uncheck the parent task (cannot remain completed with incomplete subtasks).
  // Completing subtasks never automatically checks the parent task (user controls main task completion manually).
  if (!st.done && isCompleted(task, activeDay)) {
    setCompleted(task, activeDay, false);
  }

  save();
  scheduleRender(renderToday, renderWeekGrid);
  if (typeof renderOverview === 'function') renderOverview();
  if (typeof renderNotesDayTasks === 'function') renderNotesDayTasks();
  if (typeof renderMonthGridOnly === 'function') renderMonthGridOnly();
  if (typeof openDayInspector === 'function' && document.getElementById('modal-day-inspector') && !document.getElementById('modal-day-inspector').classList.contains('hidden')) {
    openDayInspector(activeDay);
  }
}

function deleteSubtask(taskId, subtaskId) {
  const task = S.tasks.find(x => x.id === taskId);
  if (!task || !task.subtasks) return;
  task.subtasks = task.subtasks.filter(x => x.id !== subtaskId);
  const activeDay = S.selectedDay || today();
  if (task.subtasks.length > 0) {
    const hasIncomplete = task.subtasks.some(s => !s.done);
    if (hasIncomplete && isCompleted(task, activeDay)) {
      setCompleted(task, activeDay, false);
    }
  }
  save();
  scheduleRender(renderToday, renderWeekGrid);
}

// ----- TASK TEMPLATES -----
function saveTaskAsTemplate(taskId) {
  const task = S.tasks.find(x => x.id === taskId);
  if (!task) return;
  const tpl = {
    id: 'tpl_' + Date.now(),
    name: task.name,
    mins: task.mins,
    category: task.category,
    priority: task.priority,
    recur: task.recur,
    goalId: task.goalId,
    notes: task.notes,
    createdAt: Date.now(),
  };
  S.templates.push(tpl);
  save();
  renderTemplatePicker();
  showToast('success', window.t('task_template_saved'), window.t('task_template_saved_msg').replace('{name}', task.name));
}

function setSelectValue(selectEl, val) {
  if (!selectEl) return;
  selectEl.value = val;
  const wrapper = selectEl.closest('.custom-dropdown');
  if (!wrapper) return;
  const trigger = wrapper.querySelector('.cd-trigger');
  const menu = wrapper.querySelector('.cd-menu');
  if (trigger) {
    const opt = selectEl.options[selectEl.selectedIndex];
    trigger.textContent = opt ? opt.textContent : val;
  }
  if (menu) {
    menu.querySelectorAll('.cd-option').forEach(o => {
      o.classList.toggle('cd-selected', o.dataset.value === val);
    });
  }
}

function loadTaskTemplate(tplId) {
  const tpl = S.templates.find(x => x.id === tplId);
  if (!tpl) return;
  const inp = document.getElementById('task-input');
  if (inp) inp.value = tpl.name;
  setSelectValue(document.getElementById('inp-duration'), tpl.mins || 25);
  if (tpl.category) setSelectValue(document.getElementById('inp-category'), tpl.category);
  if (tpl.priority) setSelectValue(document.getElementById('inp-priority'), tpl.priority);
  if (tpl.recur) setSelectValue(document.getElementById('inp-recur'), tpl.recur);
  if (tpl.goalId) setSelectValue(document.getElementById('inp-goal'), tpl.goalId);
  const notesEl = document.getElementById('task-notes');
  if (notesEl && tpl.notes) { notesEl.value = tpl.notes; notesEl.classList.remove('hidden'); }
  inp?.focus();
  showToast('info', t('task_template_loaded'), t('task_template_loaded_msg'));
}

function deleteTaskTemplate(tplId) {
  S.templates = S.templates.filter(x => x.id !== tplId);
  save();
  renderTemplatePicker();
}

function renderTemplatePicker() {
  const el = document.getElementById('template-picker');
  if (!el) return;
  const templates = S.templates;
  if (!templates.length) { el.innerHTML = ''; el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.innerHTML = `<span class="template-label">${t('task_templates_label')}</span>` +
    templates.map(tpl =>
      `<button class="template-btn" onclick="loadTaskTemplate('${tpl.id}')" title="${window.t('task_template_load')}">${escHtml(tpl.name)}</button>
      <button class="template-del-btn" onclick="deleteTaskTemplate('${tpl.id}')">×</button>`
    ).join('');
}

function toggleTaskSortMenu(e) {
  if (e) e.stopPropagation();
  const container = document.querySelector('.task-sort-container');
  const menu = document.getElementById('task-sort-menu');
  if (!menu) return;
  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    container?.classList.add('open');
    updateTaskSortMenuState();
  } else {
    menu.classList.add('hidden');
    container?.classList.remove('open');
  }
}

function setTaskSort(mode) {
  settings.taskSort = mode || 'default';
  localStorage.setItem('li_settings', JSON.stringify(settings));
  if (typeof saveSettings === 'function') saveSettings();
  updateTaskSortLabel();
  const menu = document.getElementById('task-sort-menu');
  const container = document.querySelector('.task-sort-container');
  if (menu) menu.classList.add('hidden');
  if (container) container.classList.remove('open');
  scheduleRender(renderToday, renderWeekGrid);
}

function updateTaskSortLabel() {
  const lbl = document.getElementById('task-sort-label');
  if (!lbl) return;
  const mode = settings.taskSort || 'default';
  const labels = {
    default: t('task_sort_default', 'Ordem Padrão'),
    top_to_bottom: t('task_sort_top_bottom', 'Cima para Baixo'),
    bottom_to_top: t('task_sort_bottom_top', 'Baixo para Cima'),
    priority: t('task_sort_priority', 'Por Prioridade'),
    time: t('task_sort_time', 'Por Horário'),
    duration: t('task_sort_duration', 'Por Duração'),
    alpha: t('task_sort_alpha', 'Nome (A–Z)')
  };
  lbl.textContent = labels[mode] || labels.default;
  updateTaskSortMenuState();
}

function updateTaskSortMenuState() {
  const mode = settings.taskSort || 'default';
  document.querySelectorAll('.task-sort-opt').forEach(btn => {
    if (btn.getAttribute('data-sort') === mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

document.addEventListener('click', (e) => {
  const container = document.querySelector('.task-sort-container');
  const menu = document.getElementById('task-sort-menu');
  if (menu && !menu.classList.contains('hidden') && container && !container.contains(e.target)) {
    menu.classList.add('hidden');
    container.classList.remove('open');
  }
});
