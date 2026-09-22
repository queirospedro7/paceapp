// Pace — Rotinas

let _routineDays = [];

function openRoutines() {
  renderRoutines();
  document.getElementById('modal-routines').classList.remove('hidden');
  document.getElementById('routines-btn')?.classList.add('active');
}

function closeRoutines() {
  document.getElementById('modal-routines')?.classList.add('hidden');
  document.getElementById('routines-btn')?.classList.remove('active');
}

function handleRoutinesOverlayClick(e) {
  if (e.target === e.currentTarget) closeRoutines();
}

function setRoutineDaysPreset(preset) {
  if (preset === 'all') {
    _routineDays = [1, 2, 3, 4, 5, 6, 0];
  } else if (preset === 'weekdays') {
    _routineDays = [1, 2, 3, 4, 5];
  } else if (preset === 'weekend') {
    _routineDays = [6, 0];
  }
  document.querySelectorAll('#routine-days .day-pill').forEach(b => {
    const d = parseInt(b.dataset.day);
    b.classList.toggle('active', _routineDays.includes(d));
  });
}

function selectRoutineColor(color, btn) {
  const colorInput = document.getElementById('routine-color');
  if (colorInput) colorInput.value = color;
  document.querySelectorAll('#routine-swatches .routine-color-swatch').forEach(s => s.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function onRoutineCustomColorChange(color) {
  document.querySelectorAll('#routine-swatches .routine-color-swatch').forEach(s => {
    s.classList.toggle('active', s.style.background === color);
  });
}

function toggleRoutineFormDay(btn) {
  const day = parseInt(btn.dataset.day);
  const idx = _routineDays.indexOf(day);
  if (idx >= 0) _routineDays.splice(idx, 1);
  else _routineDays.push(day);
  btn.classList.toggle('active');
  document.querySelectorAll('#routine-days .day-pill').forEach(b => {
    const d = parseInt(b.dataset.day);
    b.classList.toggle('active', _routineDays.includes(d));
  });
}

function addRoutine() {
  const inp = document.getElementById('routine-input');
  const name = inp.value.trim();
  if (!name) {
    inp.focus();
    inp.style.borderBottomColor = 'var(--danger)';
    setTimeout(() => { inp.style.borderBottomColor = ''; }, 900);
    return;
  }
  const color = document.getElementById('routine-color')?.value || '#6366f1';
  const routine = {
    id: 'r_' + Date.now(),
    name,
    days: [..._routineDays],
    color,
    tasks: [],
    completions: {},
    createdAt: Date.now(),
  };
  S.routines.push(routine);
  save();
  inp.value = '';
  _routineDays = [];
  document.querySelectorAll('#routine-days .day-pill').forEach(b => b.classList.remove('active'));
  renderRoutines();
  scheduleRender(renderToday, renderWeekGrid);
  showToast('success', t('routine_created'), t('routine_created_msg').replace('{name}', name));
}

function deleteRoutine(id) {
  const r = S.routines.find(x => x.id === id);
  if (!r) return;
  showConfirm({
    title: t('routine_delete_title'),
    msg: t('routine_delete_msg').replace('{name}', r.name),
    okLabel: t('routine_delete_btn'),
    type: 'danger',
    onOk: () => {
      S.routines = S.routines.filter(x => x.id !== id);
      save();
      renderRoutines();
      scheduleRender(renderToday, renderWeekGrid);
      showToast('info', t('routine_removed'), t('routine_removed_msg').replace('{name}', r.name));
    }
  });
}

function addRoutineTask(routineId) {
  const r = S.routines.find(x => x.id === routineId);
  if (!r) return;
  const inp = document.getElementById('rt-input-' + routineId);
  const name = inp ? inp.value.trim() : '';
  if (!name) { if (inp) inp.focus(); return; }
  const durEl = document.getElementById('rt-dur-' + routineId);
  const duration = durEl ? (parseInt(durEl.value) || 0) : 0;
  const timeEl = document.getElementById('rt-time-' + routineId);
  const scheduledTime = timeEl?.value || undefined;
  if (!r.tasks) r.tasks = [];
  r.tasks.push({ id: 'rt_' + Date.now(), name, duration, scheduledTime, notes: '' });
  save();
  if (inp) inp.value = '';
  if (durEl) durEl.value = '';
  if (timeEl) timeEl.value = '';
  renderRoutines();
  scheduleRender(renderToday, renderWeekGrid);
}

function deleteRoutineTask(routineId, taskId) {
  const r = S.routines.find(x => x.id === routineId);
  if (!r) return;
  r.tasks = (r.tasks || []).filter(t => t.id !== taskId);
  if (r.completions) {
    Object.keys(r.completions).forEach(date => {
      delete r.completions[date][taskId];
      if (!Object.keys(r.completions[date]).length) delete r.completions[date];
    });
  }
  save();
  renderRoutines();
  scheduleRender(renderToday, renderWeekGrid);
}

function toggleRoutineTask(routineId, taskId, dateStr) {
  const r = S.routines.find(x => x.id === routineId);
  if (!r) return;
  if (!r.completions) r.completions = {};
  if (!r.completions[dateStr]) r.completions[dateStr] = {};
  r.completions[dateStr][taskId] = !r.completions[dateStr][taskId];
  save();
  scheduleRender(renderToday, renderWeekGrid);
  const task = (r.tasks || []).find(t => t.id === taskId);
  if (r.completions[dateStr][taskId] && task) {
    showToast('success', t('routine_completed'), `"${task.name}"`);
  }
}

function getActiveRoutineTasksForDate(dateObj, dateStr) {
  const dow = dateObj.getDay();
  const result = [];
  const activeRoutines = S.routines.filter(r => {
    if (!r.tasks || !r.tasks.length) return false;
    if (r.days && r.days.length) return r.days.includes(dow);
    return true;
  });
  activeRoutines.forEach(r => {
    (r.tasks || []).forEach(t => {
      const done = r.completions && r.completions[dateStr] && r.completions[dateStr][t.id];
      result.push({
        _isRoutine: true,
        _done: !!done,
        routineId: r.id,
        routineTaskId: t.id,
        routineName: r.name,
        routineColor: r.color || '#6366f1',
        id: 'r:' + r.id + ':' + t.id,
        name: t.name,
        notes: t.notes || '',
        mins: t.duration || 0,
        priority: 'normal',
        scheduledTime: t.scheduledTime || undefined,
      });
    });
  });
  return result;
}

function toggleAllRoutineTasks(routineId) {
  const r = S.routines.find(x => x.id === routineId);
  if (!r || !r.tasks || !r.tasks.length) return;
  const todayStr = today();
  if (!r.completions) r.completions = {};
  if (!r.completions[todayStr]) r.completions[todayStr] = {};

  const allDone = r.tasks.every(t => r.completions[todayStr][t.id]);
  r.tasks.forEach(t => {
    r.completions[todayStr][t.id] = !allDone;
  });
  save();
  renderRoutines();
  scheduleRender(renderToday, renderWeekGrid);
  showToast('success', t('routine_updated', 'Rotina atualizada'), `"${r.name}"`);
}

function renderRoutines() {
  const list = document.getElementById('routines-list');
  if (!list) return;

  if (!S.routines.length) {
    list.innerHTML = `<div class="empty-state">${t('routine_empty')}</div>`;
    return;
  }

  const daysAbbr = getDaysShort();

  list.innerHTML = S.routines.map(r => {
    const tasks = r.tasks || [];
    const todayStr = today();
    const todayDow = new Date().getDay();
    const activeToday = !r.days || !r.days.length || r.days.includes(todayDow);
    const todayDone = tasks.filter(t => r.completions && r.completions[todayStr] && r.completions[todayStr][t.id]).length;
    const pct = tasks.length ? Math.round((todayDone / tasks.length) * 100) : 0;

    return `
      <div class="routine-card">
        <div class="routine-header">
          <div class="routine-title-row">
            <span class="routine-color-dot" style="background:${r.color || '#6366f1'}"></span>
            <span class="routine-name">${escHtml(r.name)}</span>
            <span class="routine-today-badge">${tasks.length} ${t('routine_steps', 'passos')}</span>
          </div>
          <div class="routine-header-actions">
            <button class="routine-action-btn" onclick="deleteRoutine('${escAttr(r.id)}')" title="${t('routine_delete_tooltip')}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="routine-days-row">
          ${daysAbbr.map((d, i) => `<span class="routine-day-pill ${(!r.days || !r.days.length || r.days.includes(i)) ? 'on' : ''}">${d}</span>`).join('')}
        </div>
        <div class="routine-tasks">
          ${tasks.map(task => {
            const timeBadge = task.scheduledTime ? `<span class="task-time-badge" style="margin-left:auto;margin-right:6px;">${escHtml(task.scheduledTime)}</span>` : '';
            return `
              <div class="routine-task-row">
                <span class="routine-task-bullet" style="background:${r.color || '#6366f1'}"></span>
                <span class="routine-task-name">${escHtml(task.name)}</span>
                ${timeBadge}
                ${task.duration ? `<span class="routine-task-dur">${task.duration}m</span>` : ''}
                <button class="routine-task-del" onclick="deleteRoutineTask('${escAttr(r.id)}','${escAttr(task.id)}')" title="${t('routine_remove')}">×</button>
              </div>`;
          }).join('')}
          <div class="routine-task-add">
            <input type="text" id="rt-input-${escAttr(r.id)}" placeholder="${t('routine_task_placeholder')}" autocomplete="off" onkeydown="if(event.key==='Enter')addRoutineTask('${escAttr(r.id)}')"/>
            <input type="number" id="rt-dur-${escAttr(r.id)}" class="rt-dur-input" placeholder="${t('routine_dur_placeholder')}" min="0" max="480" title="${t('routine_dur_title')}"/>
            <input type="time" id="rt-time-${escAttr(r.id)}" class="rt-time-input" title="${t('routine_time_title')}"/>
            <button class="routine-add-task-btn" onclick="addRoutineTask('${escAttr(r.id)}')" title="${t('routine_add_task')}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="10" height="10"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}
