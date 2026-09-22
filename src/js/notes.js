// Pace — Notas mensais, editor e visualização mensal

let _noteSaveTimer = null;
let _noteSaveTarget = null; // 'main' | 'page' | null
let _pasteHandlersAttached = false;

function _attachPasteHandlers() {
  if (_pasteHandlersAttached) return;
  _pasteHandlersAttached = true;
  const editors = ['month-note-editor-main', 'month-note-editor'];
  editors.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('paste', e => {
      e.preventDefault();
      const html = e.clipboardData.getData('text/html');
      const text = e.clipboardData.getData('text/plain');
      const safe = html ? sanitizeNoteHtml(html) : escHtml(text);
      document.execCommand('insertHTML', false, safe);
    });
  });
}

function getMonthDate(offset) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + (offset || 0));
  return d;
}

function shiftMonth(dir) {
  flushNoteSave();
  S.monthOffset += dir;
  save();
  const month = getMonthDate(S.monthOffset);
  const selected = new Date(S.selectedNoteDate);
  if (selected.getMonth() !== month.getMonth() || selected.getFullYear() !== month.getFullYear()) {
    S.selectedNoteDate = fmtDate(month);
    save();
  }
  renderMonthNotes();
  renderMonthGridOnly();
}

function goToCurrentMonth() {
  flushNoteSave();
  S.monthOffset = 0;
  S.selectedNoteDate = today();
  save();
  renderMonthNotes();
  renderMonthGridOnly();
}

function jumpToMonthInNotes() {
  const month = parseInt(document.getElementById('notes-month-select')?.value);
  const year = parseInt(document.getElementById('notes-year-select')?.value);
  if (isNaN(month) || isNaN(year)) return;
  flushNoteSave();
  const now = new Date();
  S.monthOffset = (year - now.getFullYear()) * 12 + (month - now.getMonth());
  const m = getMonthDate(S.monthOffset);
  const selected = new Date(S.selectedNoteDate);
  if (selected.getMonth() !== m.getMonth() || selected.getFullYear() !== m.getFullYear()) {
    S.selectedNoteDate = fmtDate(m);
  }
  save();
  renderMonthNotes();
  renderMonthGridOnly();
  renderNotesDayTasks();
}

function syncMonthNotePicker() {
  const monthSelEl = document.getElementById('notes-month-select');
  const yearSelEl = document.getElementById('notes-year-select');
  if (!monthSelEl || !yearSelEl) return;
  const base = getMonthDate(S.monthOffset);
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(2024, i, 1).toLocaleDateString(t('misc_locale'), { month: 'long' })
  );
  monthSelEl.innerHTML = monthNames.map((name, i) =>
    `<option value="${i}" ${i === base.getMonth() ? 'selected' : ''}>${name}</option>`
  ).join('');
  const years = [];
  for (let y = base.getFullYear() - 5; y <= base.getFullYear() + 5; y++) years.push(y);
  yearSelEl.innerHTML = years.map(y =>
    `<option value="${y}" ${y === base.getFullYear() ? 'selected' : ''}>${y}</option>`
  ).join('');
  rebuildCustomSelect(monthSelEl);
  rebuildCustomSelect(yearSelEl);
}

function flushNoteSave() {
  if (_noteSaveTimer) {
    clearTimeout(_noteSaveTimer);
    _noteSaveTimer = null;
    _performNoteSave();
  }
}

function selectMonthNoteDay(dayEl, dateStr) {
  flushNoteSave();
  S.selectedNoteDate = dateStr;
  save();
  renderMonthNotes();
  renderMonthGridOnly();
  renderNotesDayTasks();
  const editor = document.getElementById('month-note-editor');
  if (editor) editor.focus();
}

function _setNoteStatus(target, text, saved) {
  const elId = target === 'main' ? 'month-note-status-main' : 'month-note-status';
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('saved', !!saved);
}

function _performNoteSave() {
  _noteSaveTimer = null;

  const mainEditor  = document.getElementById('month-note-editor-main');
  const notesEditor = document.getElementById('month-note-editor');

  const editor = (
    _noteSaveTarget === 'main'  ? mainEditor  :
    _noteSaveTarget === 'page'  ? notesEditor :
    (document.activeElement === mainEditor  ? mainEditor  :
     document.activeElement === notesEditor ? notesEditor : null)
  );
  if (!editor) return;
  if (!S.selectedNoteDate) return;

  const value = editor.innerHTML.trim();
  const safe = value ? sanitizeNoteHtml(value) : '';
  if (safe) S.monthNotes[S.selectedNoteDate] = safe;
  else        delete S.monthNotes[S.selectedNoteDate];

  save();
  renderMonthGridOnly();
  updateEditorToolbarState();

  const target = editor === mainEditor ? 'main' : 'page';
  _setNoteStatus(target, t('notes_saved'), true);
}

function saveSelectedNote() {
  const mainEditor  = document.getElementById('month-note-editor-main');
  const notesEditor = document.getElementById('month-note-editor');

  const focusedEditor = (
    document.activeElement === mainEditor  ? mainEditor  :
    document.activeElement === notesEditor ? notesEditor : null
  );

  if (!focusedEditor) return;
  if (!S.selectedNoteDate) return;

  const target = focusedEditor === mainEditor ? 'main' : 'page';
  _noteSaveTarget = target;
  _setNoteStatus(target, t('notes_saving'), false);

  if (_noteSaveTimer) clearTimeout(_noteSaveTimer);
  _noteSaveTimer = setTimeout(_performNoteSave, 600);
}

function clearSelectedNote() {
  if (!S.selectedNoteDate) return;
  const hasContent = (S.monthNotes[S.selectedNoteDate] || '').replace(/<[^>]*>/g, '').trim().length > 0;
  if (!hasContent) return;
  const dateLabel = new Date(S.selectedNoteDate).toLocaleDateString(t('misc_locale'), { day: 'numeric', month: 'long' });
  showConfirm({
    title: t('notes_clear'),
    msg: t('notes_clear_msg').replace('{date}', dateLabel),
    okLabel: t('notes_clear_btn'),
    type: 'danger',
    onOk: () => {
      const mainEditor  = document.getElementById('month-note-editor-main');
      const notesEditor = document.getElementById('month-note-editor');
      if (mainEditor)  mainEditor.innerHTML = '';
      if (notesEditor) notesEditor.innerHTML = '';
      delete S.monthNotes[S.selectedNoteDate];
      save();
      renderMonthNotes();
      renderMonthGridMain();
      renderMonthGridOnly();
      showToast('info', t('notes_deleted'), t('notes_deleted_msg').replace('{date}', dateLabel));
    }
  });
}

function confirmClearNote() { clearSelectedNote(); }

function exportCurrentNote() {
  const dateStr = S.selectedNoteDate;
  if (!dateStr) return;
  const html = S.monthNotes[dateStr] || '';
  const text = html.replace(/<[^>]*>/g, '').trim();
  if (!text) { showToast('info', t('notes_export_empty_title'), t('notes_export_empty_msg')); return; }
  const dateLabel = new Date(dateStr).toLocaleDateString(t('misc_locale'), { day: 'numeric', month: 'long', year: 'numeric' });
  const fullHtml = `<!DOCTYPE html><html lang="${settings.language || 'en'}"><head><meta charset="UTF-8"><title>${dateLabel} — Pace</title><style>body{font-family:system-ui;max-width:700px;margin:40px auto;padding:0 20px;color:#222;line-height:1.7}h1{font-size:1.4rem;border-bottom:1px solid #ddd;padding-bottom:8px}blockquote{border-left:3px solid #6366f1;padding:8px 0 8px 14px;color:#555;font-style:italic;margin:12px 0}ul,ol{padding-left:24px}code{background:#f0f0f0;padding:2px 5px;border-radius:3px;font-size:0.9em}</style></head><body><h1>${dateLabel}</h1>${html}</body></html>`;
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url; a.download = `pace-nota-${dateStr}.html`; a.click();
    showToast('ok', t('notes_export_ok'), t('notes_export_ok_msg').replace('{date}', dateLabel));
  } finally { setTimeout(() => URL.revokeObjectURL(url), 10000); }
}

function exportMonthNotes() {
  const month = getMonthDate(S.monthOffset);
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const monthName = month.toLocaleDateString(t('misc_locale'), { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  let sections = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = fmtDate(new Date(year, monthIdx, d));
    const html = S.monthNotes[ds];
    if (html && html.replace(/<[^>]*>/g, '').trim()) {
      const label = new Date(ds).toLocaleDateString(t('misc_locale'), { weekday: 'long', day: 'numeric', month: 'long' });
      sections.push(`<h2 style="margin-top:2em;border-bottom:1px solid #ddd;padding-bottom:4px">${label}</h2>${html}`);
    }
  }
  if (!sections.length) { showToast('info', t('notes_export_empty_title'), t('notes_export_empty_msg')); return; }
  const fullHtml = `<!DOCTYPE html><html lang="${settings.language || 'en'}"><head><meta charset="UTF-8"><title>${monthName} — Pace</title><style>body{font-family:system-ui;max-width:700px;margin:40px auto;padding:0 20px;color:#222;line-height:1.7}h1{font-size:1.6rem}h2{font-size:1.15rem}blockquote{border-left:3px solid #6366f1;padding:8px 0 8px 14px;color:#555;font-style:italic;margin:12px 0}ul,ol{padding-left:24px}code{background:#f0f0f0;padding:2px 5px;border-radius:3px;font-size:0.9em}</style></head><body><h1>${monthName}</h1>${sections.join('')}</body></html>`;
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url; a.download = `pace-notas-${year}-${String(monthIdx+1).padStart(2,'0')}.html`; a.click();
    showToast('ok', t('notes_export_ok'), t('notes_export_month_msg').replace('{count}', sections.length));
  } finally { setTimeout(() => URL.revokeObjectURL(url), 10000); }
}

function insertNoteBlockquote() {
  execNoteCommand('formatBlock', 'BLOCKQUOTE');
}

function insertNoteCode() {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const text = sel.toString();
  if (text) {
    execNoteCommand('insertHTML', `<code>${escHtml(text)}</code>`);
  }
}

function insertNoteDateTime() {
  const nowStr = new Date().toLocaleString(t('misc_locale'), { dateStyle: 'short', timeStyle: 'short' });
  execNoteCommand('insertText', nowStr + ' — ');
}

function setNoteCurrentDayRating(rating) {
  const activeDay = S.selectedNoteDate || today();
  if (!S.dayRatings || typeof S.dayRatings !== 'object') S.dayRatings = {};
  if (S.dayRatings[activeDay] === rating) {
    delete S.dayRatings[activeDay];
  } else {
    S.dayRatings[activeDay] = rating;
  }
  save();
  updateNotesDayRatingUI();
  renderMonthGridOnly();
  if (typeof _renderOvStatsMiniCalendar === 'function') _renderOvStatsMiniCalendar();
}

function updateNotesDayRatingUI() {
  const activeDay = S.selectedNoteDate || today();
  const currentRating = (S.dayRatings && S.dayRatings[activeDay]) || '';
  ['positive', 'neutral', 'negative'].forEach(r => {
    const pill = document.getElementById(`note-rate-pill-${r}`);
    if (pill) pill.classList.toggle('active', currentRating === r);
  });
}

function renderMonthGridOnly() {
  const grid = document.getElementById('month-notes-grid');
  if (!grid) return;
  const month = getMonthDate(S.monthOffset);
  const todayStr = today();
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push('<div class="month-note-cell empty"></div>');
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, monthIndex, day);
    const dateStr = fmtDate(dateObj);
    const noteRaw = S.monthNotes[dateStr] || '';
    const hasNote = noteRaw.replace(/<[^>]*>/g, '').trim().length > 0;
    const dayTasks = activeTasksForDate(dateObj);
    const doneTasks = dayTasks.filter(t => isCompleted(t, dateStr));
    const hasTasks = dayTasks.length > 0;
    const allDone = hasTasks && doneTasks.length === dayTasks.length;
    const taskCls = hasTasks ? (allDone ? 'has-tasks' : 'has-tasks-pending') : '';

    const rating = (S.dayRatings && S.dayRatings[dateStr]) || '';
    let ratingCls = '';
    if (rating === 'positive') ratingCls = ' rating-pos';
    else if (rating === 'neutral') ratingCls = ' rating-neu';
    else if (rating === 'negative') ratingCls = ' rating-neg';

    cells.push(`<button type="button" class="month-note-cell ${dateStr===todayStr?'today':''} ${dateStr===S.selectedNoteDate?'selected':''} ${hasNote?'has-note':''} ${taskCls}${ratingCls}" onclick="selectMonthNoteDay(this,'${escAttr(dateStr)}')"><span class="month-note-day">${day}</span><span class="month-note-dot"></span></button>`);
  }
  grid.innerHTML = cells.join('');
}

function renderMonthNotes() {
  _attachPasteHandlers();
  const title     = document.getElementById('month-notes-title');
  const editor    = document.getElementById('month-note-editor');
  const dateLabel = document.getElementById('month-note-date');
  if (!title || !editor || !dateLabel) return;

  const month = getMonthDate(S.monthOffset);
  title.textContent = month.toLocaleDateString(t('misc_locale'), { month: 'long', year: 'numeric' });
  syncMonthNotePicker();

  if (document.activeElement !== editor) {
    editor.innerHTML = sanitizeNoteHtml(S.monthNotes[S.selectedNoteDate] || '');
  }

  const selected = new Date(S.selectedNoteDate);
  dateLabel.textContent = selected.toLocaleDateString(t('misc_locale'), { weekday: 'long', day: 'numeric', month: 'long' });
  updateNotesDayRatingUI();
  renderNotesDayTasks();
}

function renderMonthGridMain() {
  const grid = document.getElementById('month-notes-grid-main');
  if (!grid) return;
  const month = getMonthDate(S.monthOffset);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const todayStr = today();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push('<div class="month-note-cell empty"></div>');
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = fmtDate(new Date(year, monthIndex, day));
    const hasNote = !!(S.monthNotes[dateStr] || '').replace(/<[^>]*>/g, '').trim();
    cells.push(`<button type="button" class="month-note-cell ${dateStr === todayStr ? 'today' : ''} ${dateStr === S.selectedNoteDate ? 'selected' : ''} ${hasNote ? 'has-note' : ''}" onclick="selectMonthNoteDay(this,'${escAttr(dateStr)}')"><span class="month-note-day">${day}</span><span class="month-note-dot"></span></button>`);
  }
  grid.innerHTML = cells.join('');
}

function execNoteCommand(command, value) {
  const editors = [
    document.getElementById('month-note-editor'),
    document.getElementById('month-note-editor-main')
  ].filter(Boolean);

  let editor = editors.find(ed => ed === document.activeElement || ed.contains(document.activeElement));
  if (!editor) {
    editor = editors.find(ed => {
      let el = ed;
      while (el) {
        if (el.classList && el.classList.contains('hidden')) return false;
        el = el.parentElement;
      }
      return true;
    });
  }
  if (!editor) return;

  editor.focus();
  // execCommand is deprecated but no standard replacement exists for contentEditable rich text
  document.execCommand(command, false, value || null);
  saveSelectedNote();
  updateEditorToolbarState();
}

function queryCmdState(cmd) {
  try { return document.queryCommandState(cmd); } catch { return false; }
}

function queryCmdValue(cmd) {
  try { return document.queryCommandValue(cmd); } catch { return ''; }
}

function updateEditorToolbarState() {
  const editors = [document.getElementById('month-note-editor'), document.getElementById('month-note-editor-main')].filter(Boolean);
  const activeEditor = editors.find(ed => ed.contains(document.activeElement));
  if (!activeEditor) return;

  const state = {
    bold: queryCmdState('bold'),
    italic: queryCmdState('italic'),
    underline: queryCmdState('underline'),
    insertUnorderedList: queryCmdState('insertUnorderedList'),
    insertOrderedList: queryCmdState('insertOrderedList'),
    justifyLeft: queryCmdState('justifyLeft'),
    justifyCenter: queryCmdState('justifyCenter'),
    justifyFull: queryCmdState('justifyFull')
  };

  let formatBlock = queryCmdValue('formatBlock');

  const buttons = document.querySelectorAll('.note-tool-btn');
  buttons.forEach(btn => {
    const cmd = btn.dataset.cmd;
    const arg = btn.dataset.arg;
    if (!cmd) return;

    if (cmd === 'formatBlock') {
      if (formatBlock && formatBlock.toLowerCase() === arg.toLowerCase()) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    } else {
      if (state[cmd]) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
}

function renderNotesDayTasks() {
  const container = document.getElementById('notes-day-tasks');
  const dateEl    = document.getElementById('notes-tasks-date');
  const progWrap  = document.getElementById('notes-tasks-progress');
  const progFill  = document.getElementById('notes-tasks-prog-fill');
  const countEl   = document.getElementById('notes-tasks-count');
  if (!container) return;

  const dateStr = S.selectedNoteDate;
  const dateObj = new Date(dateStr);

  if (dateEl) {
    dateEl.textContent = dateObj.toLocaleDateString(t('misc_locale'), { weekday: 'short', day: 'numeric', month: 'short' });
  }

  const tasks = activeTasksForDate(dateObj);
  const pending = tasks.filter(task => !isCompleted(task, dateStr));
  const done    = tasks.filter(task =>  isCompleted(task, dateStr));

  if (progWrap) {
    if (tasks.length > 0) {
      progWrap.classList.remove('hidden');
      const pct = Math.round((done.length / tasks.length) * 100);
      if (progFill) progFill.style.width = pct + '%';
      if (countEl)  countEl.textContent  = `${done.length}/${tasks.length}`;
    } else {
      progWrap.classList.add('hidden');
    }
  }

  if (!tasks.length) {
    container.innerHTML = `<div class="notes-tasks-empty">${t('notes_empty')}</div>`;
    return;
  }

  const renderRow = (task, isDone) => {
    const catLabel = task.category ? getCategoryLabel(task.category) || '' : '';
    const catColor = task.category ? CATEGORY_COLORS[task.category] || '' : '';
    const subtasksHtml = task.subtasks && task.subtasks.length
      ? `<div class="notes-subtasks-list">${task.subtasks.map(st => `
          <div class="notes-subtask-row ${st.done ? 'done' : ''}">
            <button class="notes-subtask-check ${st.done ? 'done' : ''}" onclick="event.stopPropagation();toggleSubtask('${escAttr(task.id)}','${escAttr(st.id)}','${escAttr(dateStr)}');renderNotesDayTasks();renderMonthGridOnly();"></button>
            <span class="notes-subtask-name ${st.done ? 'done' : ''}">${escHtml(st.name)}</span>
          </div>
        `).join('')}</div>`
      : '';
    return `
      <div class="notes-task-row ${isDone ? 'done' : ''}">
        <div class="notes-task-main">
          <button class="notes-task-check" onclick="toggleTaskDate('${escAttr(task.id)}','${escAttr(dateStr)}');renderNotesDayTasks();renderMonthGridOnly()"></button>
          <div class="notes-task-info">
            <span class="notes-task-name">${escHtml(task.name)}</span>
            <div class="notes-task-meta">
              ${catLabel ? `<span class="notes-task-cat" style="color:${catColor}">${catLabel}</span>` : ''}
              <span class="notes-task-dur">${fmtMins(task.mins)}</span>
            </div>
          </div>
          <button class="notes-task-del" onclick="deleteTask('${escAttr(task.id)}')" title="${t('task_delete')}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="11" height="11"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        ${subtasksHtml}
      </div>`;
  };

  let html = '';
  if (pending.length) {
    html += `<div class="notes-tasks-section-label">${t('notes_pending')} · ${pending.length}</div>`;
    html += pending.map(task => renderRow(task, false)).join('');
  }
  if (done.length) {
    html += `<div class="notes-tasks-section-label">${t('notes_done')} · ${done.length}</div>`;
    html += done.map(task => renderRow(task, true)).join('');
  }
  container.innerHTML = html;
}

function openMonthNotesView() {
  setView('notes');
  renderMonthGridOnly();
  renderMonthNotes();
  applyNoteLayout(settings.noteLayout || 'default');
}

function closeMonthNotesView() {
  flushNoteSave();
  openTasks();
}

function openNotes() {
  openMonthNotesView();
}

function closeNotes() {
  closeMonthNotesView();
}

// Aliases retrocompatíveis
window.selectNoteDate = selectMonthNoteDay;
window.openNotes = openNotes;
window.closeNotes = closeNotes;
window.openMonthNotesView = openMonthNotesView;
window.closeMonthNotesView = closeMonthNotesView;


