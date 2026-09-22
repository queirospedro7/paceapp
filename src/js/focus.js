// Pace — Modo foco e temporizador

let timer = null;
let totalSecs = 0;
let remainSecs = 0;
let remainMs = 0;
let isPaused = false;
let _currentFocusTask = null;
let _focusCachedTask = null;
let _pomodoroMode = false;
let _pomodoroCycle = 0;
let _pomodoroPhase = 'work';
const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;
const POMODORO_LONG_BREAK = 15 * 60;


let focusStartTime = 0;
let lastTickTime = 0;
let focusActionsHidden = false;

const PAUSE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><polygon points="8,5 19,12 8,19"/></svg>';

function updateFocusBanner() {
  const chip = document.getElementById('focus-bg-chip');
  const timeEl = document.getElementById('focus-bg-time');
  if (!chip) return;

  const isOutsideFocus = document.getElementById('view-focus')?.classList.contains('hidden');

  if (timer && isOutsideFocus) {
    chip.classList.remove('hidden');
    chip.classList.toggle('paused', isPaused);
    const mins = Math.floor(remainSecs / 60);
    const secs = remainSecs % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (timeEl) timeEl.textContent = timeStr;
    const task = _currentFocusTask ? S.tasks.find(t => t.id === _currentFocusTask) : _focusCachedTask;
    const taskName = task?.name || t('focus_free_task', 'Sessão livre');
    chip.title = `${taskName} (${timeStr}${isPaused ? ' · ' + t('focus_paused', 'Pausado') : ''}) — Clica para voltar`;
  } else {
    chip.classList.add('hidden');
  }
}

function returnToFocus() {
  setView('focus');
  switchFocusTab('focus');
  updateFocusBanner();
}

function applyFocusElementVisibility() {
  const badgeEl = document.getElementById('focus-meta-badge');
  const clockDateEl = document.getElementById('clock-fs-date');

  if (badgeEl) badgeEl.style.display = 'none';
  if (clockDateEl) clockDateEl.style.display = settings.clockShowDate === false ? 'none' : '';
}

function updatePauseUI() {
  const btn = document.getElementById('pause-btn');
  const icon = document.getElementById('pause-btn-icon');
  const label = document.getElementById('pause-label');
  const pill = document.getElementById('focus-phase-pill');
  const ringLabel = document.getElementById('ring-label');
  const wrap = document.querySelector('.focus-wrap');
  applyFocusElementVisibility();
  if (!btn) return;

  if (isPaused) {
    btn.classList.add('paused');
    if (icon) icon.innerHTML = PLAY_ICON;
    if (label) label.textContent = t('focus_resume');
    btn.title = t('focus_resume_title');
    if (pill) pill.textContent = t('focus_pomodoro_break');
    if (ringLabel) ringLabel.textContent = t('focus_paused');
    wrap?.classList.add('session-paused');
  } else {
    btn.classList.remove('paused');
    if (icon) icon.innerHTML = PAUSE_ICON;
    if (label) label.textContent = t('focus_pause');
    btn.title = t('focus_pause_title');
    if (pill && timer) {
      if (_pomodoroMode) {
        const maxCycles = parseInt(settings.focusCycles, 10) || 4;
        pill.textContent = _pomodoroPhase === 'work' ? t('focus_pomodoro_cycle', 'POMODORO {n}/' + maxCycles).replace('{n}', _pomodoroCycle) : t('focus_pomodoro_break');
      } else {
        pill.textContent = t('focus_phase');
      }
    }
    if (ringLabel) ringLabel.textContent = t('focus_remaining');
    wrap?.classList.remove('session-paused');
  }
  updateFocusBanner();
}

function startFocus(taskId, hours, mins, secs) {
  let totalSecsVal;
  if (_pomodoroMode) {
    totalSecsVal = (parseInt(settings.focusWorkMins, 10) || 25) * 60;
  } else {
    totalSecsVal = hours * 3600 + mins * 60 + secs;
  }

  if (totalSecsVal <= 0) {
    showToast('warn', t('focus_invalid_dur'), t('focus_invalid_dur_msg'));
    return;
  }

  const task = taskId ? S.tasks.find(t => t.id === taskId) : null;

  closeModal();
  _currentFocusTask = taskId || null;
  _focusCachedTask = task;
  totalSecs = totalSecsVal;
  remainSecs = totalSecs;
  remainMs = totalSecs * 1000;
  focusStartTime = Date.now();
  lastTickTime = Date.now();
  isPaused = false;

  _updateFocusMetaBadge(task);

  applyFocusElementVisibility();
  updateSessionCount();
  updatePauseUI();
  updateRing('ring-fg', remainSecs, totalSecs);
  updateRing('ring-glow', remainSecs, totalSecs);
  updateFocusTime();
  setView('focus');
  switchFocusTab('focus');
  applyFocusStyleToView(settings.focusStyle || 'minimal');
  applyClockStyleToView(settings.clockStyle || 'minimal');
  const ringFg = document.getElementById('ring-fg');
  if (ringFg) {
    const palette = THEME_PALETTES[settings.theme] || THEME_PALETTES.dark;
    ringFg.style.stroke = palette.text;
  }

  clearInterval(timer);
  timer = setInterval(focusTick, 1000);
  startSoundViz();
}

function startPomodoro(taskId) {
  _pomodoroMode = true;
  _pomodoroCycle = 1;
  _pomodoroPhase = 'work';
  const workMins = parseInt(settings.focusWorkMins, 10) || 25;
  startFocus(taskId, 0, workMins, 0);
}

function _logPomodoroWorkSession() {
  const workMins = parseInt(settings.focusWorkMins, 10) || 25;
  const workSecs = workMins * 60;
  S.sessionCount++;
  S.sessions++;
  const focusDurationMins = Math.max(1, Math.round(workSecs / 60));
  S.totalFocusTime += focusDurationMins;
  const task = _currentFocusTask ? S.tasks.find(t => t.id === _currentFocusTask) : null;
  S.focusHistory.push({
    taskName: task?.name || 'Pomodoro',
    duration: focusDurationMins,
    durationSecs: workSecs,
    date: new Date().toISOString(),
    category: task?.category || ''
  });
  save();
  if (task) { setCompleted(task, today(), true); save(); scheduleRender(renderToday, renderWeekGrid); }
}

function _nextPomodoroPhase() {
  const maxCycles = parseInt(settings.focusCycles, 10) || 4;
  const workSecs = (parseInt(settings.focusWorkMins, 10) || 25) * 60;
  const breakSecs = (parseInt(settings.focusBreakMins, 10) || 5) * 60;
  const longBreakSecs = (parseInt(settings.focusLongBreakMins, 10) || 15) * 60;

  if (_pomodoroPhase === 'work') {
    _logPomodoroWorkSession();
    _pomodoroCycle++;
    const isLongBreak = _pomodoroCycle > maxCycles;
    if (isLongBreak) _pomodoroCycle = 1;
    _pomodoroPhase = 'break';
    const breakDuration = isLongBreak ? longBreakSecs : breakSecs;
    totalSecs = breakDuration;
    remainSecs = breakDuration;
    remainMs = breakDuration * 1000;
    updatePauseUI();
    const pill = document.getElementById('focus-phase-pill');
    if (pill) pill.textContent = isLongBreak ? t('focus_pomodoro_long_break') : t('focus_pomodoro_break');
    notify('pause', isLongBreak ? t('focus_pause_long_notif') : t('focus_pause_short_notif'), isLongBreak ? t('focus_pause_long_rest') : t('focus_pause_short_rest'));
    if (typeof playAlarmSound === 'function') playAlarmSound(settings.alarmSound || 'bell');

    if (settings.focusAutoBreaks === false) {
      isPaused = true;
      updatePauseUI();
    }
  } else {
    _pomodoroPhase = 'work';
    totalSecs = workSecs;
    remainSecs = workSecs;
    remainMs = workSecs * 1000;
    updatePauseUI();
    const pill = document.getElementById('focus-phase-pill');
    if (pill) pill.textContent = t('focus_pomodoro_cycle', 'POMODORO {n}/' + maxCycles).replace('{n}', _pomodoroCycle);
    notify('focus', t('focus_pomodoro_notif'), t('focus_pomodoro_cycle', 'POMODORO {n}/' + maxCycles).replace('{n}', _pomodoroCycle) + '.');
    if (typeof playAlarmSound === 'function') playAlarmSound(settings.alarmSound || 'bell');

    if (settings.focusAutoStart === false) {
      isPaused = true;
      updatePauseUI();
    }
  }
  updateRing('ring-fg', remainSecs, totalSecs);
  updateRing('ring-glow', remainSecs, totalSecs);
  updateSessionCount();
}

function focusTick() {
  if (isPaused) return;

  const now = Date.now();
  const delta = now - lastTickTime;
  lastTickTime = now;

  remainMs -= delta;

  if (remainMs <= 0) {
    remainMs = 0;
    remainSecs = 0;
    clearInterval(timer);
    timer = null;
    updateFocusTime();
    updateRing('ring-fg', 0, totalSecs);
    updateRing('ring-glow', 0, totalSecs);
    if (_pomodoroMode) {
      _nextPomodoroPhase();
      timer = setInterval(focusTick, 1000);
    } else {
      sessionDone();
    }
    return;
  }

  const newRemainSecs = Math.ceil(remainMs / 1000);
  if (newRemainSecs !== remainSecs) {
    remainSecs = newRemainSecs;
    if (settings.tickingSound && settings.tickingSound !== 'off' && !isPaused) {
      if (typeof playTick === 'function') playTick(settings.tickingSound);
    }
    updateFocusTime();
    updateRing('ring-fg', remainSecs, totalSecs);
    updateRing('ring-glow', remainSecs, totalSecs);
  }
}

function updateFocusTime() {
  const totalMins = Math.floor(remainSecs / 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const secs = remainSecs % 60;
  const hasHours = hours > 0;

  const focusTimeEl = document.getElementById('focus-time');
  const focusWrap = document.querySelector('.focus-wrap');
  const ringWrap = document.querySelector('.ring-wrap');

  if (focusWrap) focusWrap.classList.toggle('has-hours', hasHours);
  if (ringWrap) ringWrap.classList.toggle('has-hours', hasHours);

  if (focusTimeEl) {
    if (hasHours) {
      focusTimeEl.textContent =
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else if (settings.showSeconds === false) {
      focusTimeEl.textContent =
        `${String(mins).padStart(2, '0')}`;
    } else {
      focusTimeEl.textContent =
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  if (totalSecs > 0) {
    const pct = ((totalSecs - remainSecs) / totalSecs * 100).toFixed(2);
    focusWrap?.style.setProperty('--zen-progress', pct + '%');
  }

  updateFocusBanner();
}

function updateRing(elId, remain, total) {
  const el = document.getElementById(elId);
  if (el && total > 0) el.style.strokeDashoffset = CIRC * (1 - remain / total);
}

function endFocus() {
  _pomodoroMode = false;
  _pomodoroCycle = 0;
  _pomodoroPhase = 'work';
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  clearNudges();
  stopSoundViz();
  const task = _currentFocusTask ? S.tasks.find(t => t.id === _currentFocusTask) : null;
  const elapsed = totalSecs - remainSecs;
  if (elapsed > 30) {
    const elapsedLabel = fmtDurationFromSecs(elapsed);
    showToast('focus', t('focus_interrupted'), `${task?.name ?? t('focus_free_task')} — ${t('focus_interrupted_msg', {mins: elapsedLabel})}`);
  }
  if (focusZenHidden) toggleFocusZenHideAll();
  isPaused = false;
  remainSecs = 0;
  remainMs = 0;
  totalSecs = 0;
  focusActionsHidden = false;
  updatePauseUI();
  const actions2 = document.getElementById('focus-actions');
  if (actions2) { actions2.style.opacity = ''; actions2.style.pointerEvents = ''; actions2.style.transform = ''; }
  document.getElementById('ring-fg')?.classList.remove('ring-break');
  document.getElementById('timesup-overlay')?.classList.add('hidden');
  setView('main');
}

function abortFocus() {
  _pomodoroMode = false;
  _pomodoroCycle = 0;
  _pomodoroPhase = 'work';
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  clearNudges();
  stopSoundViz();
  if (focusZenHidden) toggleFocusZenHideAll();
  isPaused = false;
  _currentFocusTask = null;
  remainSecs = 0;
  remainMs = 0;
  totalSecs = 0;
  focusActionsHidden = false;
  updatePauseUI();
  const actions = document.getElementById('focus-actions');
  if (actions) { actions.style.opacity = ''; actions.style.pointerEvents = ''; actions.style.transform = ''; }
  document.getElementById('ring-fg')?.classList.remove('ring-break');
  document.getElementById('timesup-overlay')?.classList.add('hidden');
  setView('main');
}

function togglePause() {
  if (!timer) return;

  isPaused = !isPaused;
  if (isPaused) {
    stopSoundViz();
  } else {
    lastTickTime = Date.now();
    startSoundViz();
  }
  updatePauseUI();
  updateFocusBanner();
}

function toggleFocusActions() {
  // Bottom bar removed per user request
}

function addFocusMinutes(mins) {
  if (!timer && remainSecs <= 0) return;
  const addSecs = (mins || 5) * 60;
  remainSecs += addSecs;
  totalSecs += addSecs;
  remainMs += addSecs * 1000;
  updateFocusTime();
  updateRing('ring-fg', remainSecs, totalSecs);
  updateRing('ring-glow', remainSecs, totalSecs);
  const remaining = fmtMins(Math.ceil(remainSecs / 60));
  showToast('info', `+${mins} min`, t('focus_resumed_msg', {mins: remaining}), 2000);
}

function _updateFocusMetaBadge(task) {
  // During focus session, task name and session are completely hidden per user request:
  // "nem a tarefa, a tarefa só no fim ao acabar"
  const badgeEl = document.getElementById('focus-meta-badge');
  if (badgeEl) badgeEl.classList.add('hidden');
  const taskNameEl = document.getElementById('focus-task-name');
  if (taskNameEl) {
    taskNameEl.textContent = '';
    taskNameEl.classList.add('hidden');
  }
  const notesEl = document.getElementById('focus-task-notes');
  if (notesEl) {
    notesEl.textContent = '';
    notesEl.classList.add('hidden');
  }
}

function updateSessionCount() {
  const task = _currentFocusTask ? S.tasks.find(t => t.id === _currentFocusTask) : _focusCachedTask;
  _updateFocusMetaBadge(task);
}

function sessionDone() {
  clearNudges();
  stopSoundViz();
  S.sessionCount++;
  S.sessions++;
  const focusDurationMins = Math.max(1, Math.round(totalSecs / 60));
  S.totalFocusTime += focusDurationMins;
  const task = _currentFocusTask ? S.tasks.find(t => t.id === _currentFocusTask) : null;
  S.focusHistory.push({
    taskName: task?.name || t('focus_free_task'),
    duration: focusDurationMins,
    durationSecs: totalSecs,
    date: new Date().toISOString(),
    category: task?.category || ''
  });
  save();
  const durationLabel = fmtDurationFromSecs(totalSecs);
  notify('success', t('focus_completed'), `${task?.name ?? t('focus_free_task')} — ${durationLabel}`);

  playAlarmSound(settings.alarmSound || 'digital');
  renderTimesUpSummary(task);

  // Mostrar botões de conclusão apenas se há tarefa associada
  const completeBtn = document.getElementById('timesup-complete-btn');
  const skipBtn = document.getElementById('timesup-skip-btn');
  const backBtn = document.getElementById('timesup-back-btn');
  if (task) {
    if (completeBtn) completeBtn.classList.remove('hidden');
    if (skipBtn) skipBtn.classList.remove('hidden');
    if (backBtn) backBtn.classList.add('hidden');
  } else {
    if (completeBtn) completeBtn.classList.add('hidden');
    if (skipBtn) skipBtn.classList.add('hidden');
    if (backBtn) backBtn.classList.remove('hidden');
  }

  document.getElementById('timesup-overlay')?.classList.remove('hidden');
}

function confirmTaskComplete(markDone) {
  const task = _currentFocusTask ? S.tasks.find(t => t.id === _currentFocusTask) : null;
  if (task && markDone) {
    setCompleted(task, today(), true);
    scheduleRender(renderToday, renderWeekGrid);
    if (task.goalId) {
      const g = S.goals.find(g => g.id === task.goalId);
      if (g) {
        const st = calcGoalProgress(g);
        if (st.prog >= 100) {
          setTimeout(() => notify('goal', t('focus_goal_done'), `"${g.name}" — ${t('focus_goal_done_msg')}`), 1500);
        } else if (st.prog >= 75 && st.prog < 100) {
          setTimeout(() => showToast('goal', t('focus_goal_almost'), `"${g.name}" — ${t('focus_goal_almost_msg', {pct: st.prog})}`), 1500);
        }
      }
    }
  } else if (task && !markDone) {
    scheduleRender(renderToday, renderWeekGrid);
  }
  dismissTimesUp();
}

function dismissTimesUp() {
  document.getElementById('timesup-overlay')?.classList.add('hidden');
  remainSecs = 0;
  remainMs = 0;
  totalSecs = 0;
  isPaused = false;
  focusActionsHidden = false;
  const actions = document.getElementById('focus-actions');
  if (actions) { actions.style.opacity = ''; actions.style.pointerEvents = ''; actions.style.transform = ''; }
  document.getElementById('ring-fg')?.classList.remove('ring-break');
  updatePauseUI();
  setView('main');
}

function getActiveTaskName() {
  if (!_currentFocusTask) return t('focus_free_task');
  const task = S.tasks.find(t => t.id === _currentFocusTask);
  return task ? task.name : t('focus_free_task');
}

// ---- TimesUp Summary ----

function renderTimesUpSummary(task) {
  const activityEl = document.getElementById('timesup-activity');
  const durationEl = document.getElementById('timesup-duration');
  const taskEl = document.getElementById('timesup-task');
  const notesEl = document.getElementById('timesup-notes');
  if (!activityEl || !durationEl || !taskEl) return;

  const durationText = fmtDurationFromSecs(totalSecs);

  if (task) {
    activityEl.textContent = task.name;
    durationEl.textContent = durationText;
    if (task.category) {
      const cat = getCategoryLabel(task.category) || task.category;
      const color = CATEGORY_COLORS[task.category] || 'var(--soft)';
      taskEl.innerHTML = `<span class="timesup-cat" style="color:${color}">${escHtml(cat)}</span><span class="timesup-task-name">${escHtml(task.name)}</span>`;
    } else {
      taskEl.textContent = task.name;
    }
    if (notesEl) {
      if (task.notes) {
        notesEl.textContent = task.notes;
        notesEl.classList.remove('hidden');
      } else {
        notesEl.textContent = '';
        notesEl.classList.add('hidden');
      }
    }
  } else {
    activityEl.textContent = t('focus_free_session');
    durationEl.textContent = durationText;
    taskEl.textContent = t('focus_no_task');
    if (notesEl) {
      notesEl.textContent = '';
      notesEl.classList.add('hidden');
    }
  }
}

const _origRenderTimesUp = renderTimesUpSummary;
renderTimesUpSummary = function(task) {
  _origRenderTimesUp(task);
  const durationEl = document.getElementById('timesup-duration');
  if (task && task.mins > 0 && durationEl) {
    const estimated = task.mins * 60;
    const diff = totalSecs - estimated;
    const sign = diff >= 0 ? '+' : '';
    const diffText = fmtDurationFromSecs(Math.abs(diff));
    durationEl.textContent += ` (${t('focus_estimated')}: ${fmtDurationFromSecs(estimated)}, ${sign}${diffText})`;
  }
};

// ---- Sound Visualization (Disabled per user request) ----

function startSoundViz() {
  stopSoundViz();
}

let _vizRAF = null;

function startFakeSoundViz(bars) {
  // Disabled
}

function stopSoundViz() {
  if (_vizRAF) { cancelAnimationFrame(_vizRAF); _vizRAF = null; }
  if (soundVizInterval) { clearInterval(soundVizInterval); soundVizInterval = null; }
  const viz = document.getElementById('sound-viz');
  if (viz) viz.classList.add('hidden');
}

// ---- Nudge System (disabled) ----
function clearNudges() { /* nudges removed */ }
function onNudgeSettingChanged() { /* nudges removed */ }

// ---- Idle Timer (desativado para manter o foco silencioso e sem interrupções) ----
let idleTimer = null;
function _onUserActivity() {
  clearTimeout(idleTimer);
}
function resetIdleTimer() {
  clearTimeout(idleTimer);
}
function stopIdleTimer() {
  clearTimeout(idleTimer);
}

// ---- Notification Scheduler ----

let _notifiedToday = new Set();
let _notifiedTodayDate = '';
let _lastCheckedMinute = '';
function checkScheduledNotifications() {
  if (settings.notifsEnabled === false) return;
  const now = new Date();
  const todayStr = today();
  const todayDateObj = now;
  if (_notifiedTodayDate && _notifiedTodayDate !== todayStr) {
    const prevDateStr = _notifiedTodayDate;
    const prevDateObj = new Date(prevDateStr + 'T12:00:00');
    const prevDayTasks = activeTasksForDate(prevDateObj);
    const prevDoneCount = prevDayTasks.filter(tk => isCompleted(tk, prevDateStr)).length;
    
    const rawTodayLabel = todayDateObj.toLocaleDateString(t('misc_locale', 'pt-PT'), { weekday: 'long', day: 'numeric', month: 'long' });
    const todayLabel = rawTodayLabel.charAt(0).toUpperCase() + rawTodayLabel.slice(1);
    const todayTasks = activeTasksForDate(todayDateObj);
    
    const historyMsg = t('notif_day_transition_msg', {
      day: todayLabel,
      count: todayTasks.length,
      done: prevDoneCount,
      total: prevDayTasks.length
    });
    const nativeMsg = t('notif_day_transition_native', {
      day: todayLabel,
      count: todayTasks.length
    });
    
    pushNotification('info', t('notif_day_started', 'Transição de Dia'), historyMsg);
    nativeNotify(t('notif_day_started', 'Transição de Dia'), nativeMsg);
    
    S._lastDayNotifDate = todayStr;
    save();
    renderAll();
    _notifiedToday = new Set();
    _lastCheckedMinute = '';
  } else if (!_notifiedTodayDate) {
    if (!S._lastDayNotifDate || S._lastDayNotifDate !== todayStr) {
      S._lastDayNotifDate = todayStr;
      const todayDateObj = new Date();
      const rawTodayLabel = todayDateObj.toLocaleDateString(t('misc_locale', 'pt-PT'), { weekday: 'long', day: 'numeric', month: 'long' });
      const todayLabel = rawTodayLabel.charAt(0).toUpperCase() + rawTodayLabel.slice(1);
      const todayTasks = activeTasksForDate(todayDateObj);
      
      const startMsg = t('notif_day_start_msg', {
        day: todayLabel,
        count: todayTasks.length
      });
      const startNativeMsg = t('notif_day_transition_native', {
        day: todayLabel,
        count: todayTasks.length
      });
      
      pushNotification('info', t('notif_day_start_title', 'Início do Dia'), startMsg);
      nativeNotify(t('notif_day_start_title', 'Início do Dia'), startNativeMsg);
      save();
    }
  }
  _notifiedTodayDate = todayStr;
  const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  // Evita disparar duas vezes no mesmo minuto
  if (timeStr === _lastCheckedMinute) return;
  _lastCheckedMinute = timeStr;

  S.tasks.filter(task => !task.archived && taskActiveOnDate(task, now) && !isCompleted(task, todayStr) && task.scheduledTime === timeStr).forEach(task => {
    const key = task.id + '_' + timeStr;
    if (_notifiedToday.has(key)) return;
    _notifiedToday.add(key);
    pushNotification('schedule', t('misc_scheduled_task'), `"${task.name}" ${t('misc_at_time')} ${timeStr}`);
    nativeNotify(t('misc_scheduled_task'), `"${task.name}" ${t('misc_at_time')} ${timeStr}`);
  });

  S.routines.forEach(r => {
    const todayDow = now.getDay();
    if (r.days && r.days.length && !r.days.includes(todayDow)) return;
    (r.tasks || []).forEach(rt => {
      if (rt.scheduledTime && rt.scheduledTime === timeStr) {
        if (r.completions && r.completions[todayStr] && r.completions[todayStr][rt.id]) return;
        const key = r.id + '_' + rt.id + '_' + timeStr;
        if (_notifiedToday.has(key)) return;
        _notifiedToday.add(key);
        pushNotification('routine', t('misc_routine_notif'), `"${rt.name}" (${r.name}) ${t('misc_at_time')} ${timeStr}`);
        nativeNotify(t('misc_routine_notif'), `"${rt.name}" (${r.name}) ${t('misc_at_time')} ${timeStr}`);
      }
    });
  });
}

// ---- Focus & Clock Tabs & Styles ----

let activeFocusTab = 'focus';

function switchFocusTab(tab) {
  activeFocusTab = tab || 'focus';
  const focusPane = document.getElementById('focus-session-pane');
  const clockPane = document.getElementById('focus-clock-pane');
  const btnFocus = document.getElementById('focus-tab-btn-focus');
  const btnClock = document.getElementById('focus-tab-btn-clock');

  if (tab === 'clock') {
    focusPane?.classList.add('hidden');
    clockPane?.classList.remove('hidden');
    btnFocus?.classList.remove('active');
    btnClock?.classList.add('active');
    applyClockStyleToView(settings.clockStyle || 'minimal');
    tickFullscreenClock();
  } else {
    focusPane?.classList.remove('hidden');
    clockPane?.classList.add('hidden');
    btnFocus?.classList.add('active');
    btnClock?.classList.remove('active');
    applyFocusStyleToView(settings.focusStyle || 'minimal');
  }
}

function openFocusClock() {
  setView('focus');
  switchFocusTab('clock');
  updateFocusBanner();
}

let focusZenHidden = false;

function toggleFocusZenHideAll() {
  focusZenHidden = !focusZenHidden;
  const viewFocus = document.getElementById('view-focus');
  const btn = document.getElementById('focus-zen-toggle');
  const icon = document.getElementById('focus-zen-icon');

  if (viewFocus) {
    viewFocus.classList.toggle('focus-all-hidden', focusZenHidden);
  }

  if (btn) {
    btn.title = focusZenHidden ? t('focus_show_all', 'Mostrar tudo') : t('focus_hide_all', 'Ocultar tudo');
  }

  if (icon) {
    if (focusZenHidden) {
      icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    } else {
      icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    }
  }
}

document.addEventListener('keydown', (e) => {
  const isFocus = !document.getElementById('view-focus')?.classList.contains('hidden');
  if (!isFocus) return;

  if (e.key === 'Escape') {
    if (focusZenHidden) {
      toggleFocusZenHideAll();
    } else {
      exitFocusView();
    }
  } else if ((e.key === 'z' || e.key === 'Z') && !e.ctrlKey && !e.metaKey && !e.altKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    toggleFocusZenHideAll();
  }
});

function exitFocusView() {
  if (focusZenHidden) toggleFocusZenHideAll();
  setView('main');
  updateFocusBanner();
  if (timer) {
    const task = _currentFocusTask ? S.tasks.find(t => t.id === _currentFocusTask) : _focusCachedTask;
    const taskName = task ? task.name : t('focus_free_task');
    showToast('info', t('focus_tab_focus', 'Foco'), `"${taskName}" continua em segundo plano.`, 3000);
  }
}

let activeFocusMainTab = 'visual';
let activeFocusSubTab = 'focus';

function switchFocusModalMainTab(tab) {
  activeFocusMainTab = tab || 'visual';
  const panes = {
    visual: document.getElementById('fmodal-pane-visual'),
    times: document.getElementById('fmodal-pane-times'),
    sound: document.getElementById('fmodal-pane-sound')
  };
  const btns = {
    visual: document.getElementById('fmodal-tab-btn-visual'),
    times: document.getElementById('fmodal-tab-btn-times'),
    sound: document.getElementById('fmodal-tab-btn-sound')
  };

  Object.keys(panes).forEach(k => {
    if (panes[k]) panes[k].classList.toggle('hidden', k !== activeFocusMainTab);
    if (btns[k]) btns[k].classList.toggle('active', k === activeFocusMainTab);
  });
}

function switchFocusModalSubTab(sub) {
  activeFocusSubTab = sub || 'focus';
  const panes = {
    focus: document.getElementById('fmodal-subpane-focus'),
    clock: document.getElementById('fmodal-subpane-clock')
  };
  const btns = {
    focus: document.getElementById('fmodal-subtab-btn-focus'),
    clock: document.getElementById('fmodal-subtab-btn-clock')
  };

  Object.keys(panes).forEach(k => {
    if (panes[k]) panes[k].classList.toggle('hidden', k !== activeFocusSubTab);
    if (btns[k]) btns[k].classList.toggle('active', k === activeFocusSubTab);
  });
}

// Backward compatibility alias
function switchFocusModalTab(tab) {
  switchFocusModalSubTab(tab);
}

function toggleFocusShowSeconds(checked) {
  settings.showSeconds = !!checked;
  localStorage.setItem('li_settings', JSON.stringify(settings));
  const mainToggle = document.getElementById('setting-show-seconds');
  if (mainToggle) mainToggle.checked = settings.showSeconds;
  const fmodalFocusToggle = document.getElementById('fmodal-show-seconds');
  if (fmodalFocusToggle) fmodalFocusToggle.checked = settings.showSeconds;
  const fmodalClockToggle = document.getElementById('fmodal-clock-show-seconds');
  if (fmodalClockToggle) fmodalClockToggle.checked = settings.showSeconds;
  
  updateFocusTime();
  tickFullscreenClock();
}

function toggleFocusCustomOption(key, checked) {
  settings[key] = !!checked;
  localStorage.setItem('li_settings', JSON.stringify(settings));
  applyFocusElementVisibility();
  tickFullscreenClock();
  updatePauseUI();
}

function setFocusDurationVal(key, val) {
  const num = Math.max(1, parseInt(val, 10) || 1);
  settings[key] = num;
  localStorage.setItem('li_settings', JSON.stringify(settings));
  const el = document.getElementById(
    key === 'focusWorkMins' ? 'fmodal-work-mins' :
    key === 'focusBreakMins' ? 'fmodal-break-mins' :
    key === 'focusLongBreakMins' ? 'fmodal-long-break-mins' :
    'fmodal-cycles-val'
  );
  if (el) el.value = num;
}

function setFocusDurationPreset(key, val) {
  setFocusDurationVal(key, val);
}

function onFocusAlarmSelect(val) {
  settings.alarmSound = val;
  localStorage.setItem('li_settings', JSON.stringify(settings));
  const mainSel = document.getElementById('alarm-sound-select');
  if (mainSel) mainSel.value = val;
}

function testFocusAlarmSound() {
  if (typeof playAlarmSound === 'function') {
    playAlarmSound(settings.alarmSound || 'bell');
  }
}

function onFocusVolumeSlider(val) {
  const num = parseInt(val, 10);
  settings.volume = num;
  localStorage.setItem('li_settings', JSON.stringify(settings));
  const volNum = document.getElementById('fmodal-volume-num');
  if (volNum) volNum.textContent = num + '%';
  const mainSlider = document.getElementById('volume-slider');
  if (mainSlider) mainSlider.value = num;
  if (typeof updateVolumeLabel === 'function') updateVolumeLabel();
}

function _updateTickingPillsUI(type) {
  const pills = {
    off: document.getElementById('fmodal-tick-off'),
    soft: document.getElementById('fmodal-tick-soft'),
    mechanical: document.getElementById('fmodal-tick-mechanical')
  };
  Object.keys(pills).forEach(k => {
    if (pills[k]) pills[k].classList.toggle('active', k === type);
  });
}

function setFocusTicking(type) {
  settings.tickingSound = type;
  localStorage.setItem('li_settings', JSON.stringify(settings));
  _updateTickingPillsUI(type);
  if (typeof playTick === 'function') playTick(type);
}

function openFocusStylesModal() {
  const modal = document.getElementById('modal-focus-styles');
  if (!modal) return;
  if (typeof renderFocusStyleGrid === 'function') renderFocusStyleGrid();

  // Toggles
  const isSec = settings.showSeconds !== false;
  const fmodalFocusToggle = document.getElementById('fmodal-show-seconds');
  if (fmodalFocusToggle) fmodalFocusToggle.checked = isSec;
  const fmodalClockToggle = document.getElementById('fmodal-clock-show-seconds');
  if (fmodalClockToggle) fmodalClockToggle.checked = isSec;

  const fmodalTask = document.getElementById('fmodal-show-task');
  if (fmodalTask) fmodalTask.checked = settings.focusShowTask !== false;
  const fmodalCount = document.getElementById('fmodal-show-count');
  if (fmodalCount) fmodalCount.checked = settings.focusShowCount !== false;
  const fmodalPhase = document.getElementById('fmodal-show-phase');
  if (fmodalPhase) fmodalPhase.checked = settings.focusShowPhase !== false;
  const fmodalClock24h = document.getElementById('fmodal-clock-24h');
  if (fmodalClock24h) fmodalClock24h.checked = settings.clock24h !== false;
  const fmodalClockDate = document.getElementById('fmodal-clock-show-date');
  if (fmodalClockDate) fmodalClockDate.checked = settings.clockShowDate !== false;

  // Times
  const workInp = document.getElementById('fmodal-work-mins');
  if (workInp) workInp.value = settings.focusWorkMins || 25;
  const breakInp = document.getElementById('fmodal-break-mins');
  if (breakInp) breakInp.value = settings.focusBreakMins || 5;
  const longBreakInp = document.getElementById('fmodal-long-break-mins');
  if (longBreakInp) longBreakInp.value = settings.focusLongBreakMins || 15;
  const cyclesInp = document.getElementById('fmodal-cycles-val');
  if (cyclesInp) cyclesInp.value = settings.focusCycles || 4;

  const autoBreaks = document.getElementById('fmodal-auto-breaks');
  if (autoBreaks) autoBreaks.checked = !!settings.focusAutoBreaks;
  const autoStart = document.getElementById('fmodal-auto-start');
  if (autoStart) autoStart.checked = !!settings.focusAutoStart;

  // Sound & Volume
  const alarmSelect = document.getElementById('fmodal-alarm-select');
  if (alarmSelect) alarmSelect.value = settings.alarmSound || 'bell';
  const volSlider = document.getElementById('fmodal-volume-slider');
  const volNum = document.getElementById('fmodal-volume-num');
  const vol = settings.volume != null ? settings.volume : 70;
  if (volSlider) volSlider.value = vol;
  if (volNum) volNum.textContent = vol + '%';

  // Ticking
  _updateTickingPillsUI(settings.tickingSound || 'off');

  switchFocusModalMainTab(activeFocusMainTab || 'visual');
  switchFocusModalSubTab(activeFocusTab === 'clock' ? 'clock' : 'focus');
  applyFocusElementVisibility();
  modal.classList.remove('hidden');
}

function closeFocusStylesModal() {
  document.getElementById('modal-focus-styles')?.classList.add('hidden');
}

function handleFocusStylesOverlayClick(e) {
  if (e && e.target && e.target.id === 'modal-focus-styles') {
    closeFocusStylesModal();
  }
}

function applyFocusStyleToView(style) {
  const focusPane = document.getElementById('focus-session-pane') || document.querySelector('.focus-wrap');
  if (!focusPane) return;
  focusPane.classList.remove(...ALL_FOCUS_STYLES.map(s => 'style-' + s));
  focusPane.classList.add('style-' + style);
  const ringFg = document.getElementById('ring-fg');
  if (ringFg) {
    ringFg.style.stroke = 'var(--text)';
  }
}

function applyClockStyleToView(style) {
  const clockPane = document.getElementById('focus-clock-pane');
  if (!clockPane) return;
  clockPane.classList.remove(...ALL_CLOCK_STYLES.map(s => 'clock-style-' + s));
  clockPane.classList.add('clock-style-' + style);
  const ringFg = document.getElementById('clock-ring-fg');
  if (ringFg) {
    ringFg.style.stroke = 'var(--text)';
  }
}

// ---- Clock & Date ----

function tickFullscreenClock() {
  const timeEl = document.getElementById('clock-fs-time');
  const secEl = document.getElementById('clock-fs-sec');
  const dateEl = document.getElementById('clock-fs-date');
  const ringFg = document.getElementById('clock-ring-fg');
  if (!timeEl && !dateEl) return;

  const now = new Date();
  const tz = (typeof settings !== 'undefined' && settings.timezone && settings.timezone !== 'auto') ? settings.timezone : undefined;

  let timeStr = '';
  let secStr = '';
  const is24h = settings.clock24h !== false;
  const timeOpts = { hour: '2-digit', minute: '2-digit', hour12: !is24h };
  if (tz) timeOpts.timeZone = tz;

  try {
    timeStr = now.toLocaleTimeString(t('misc_locale', 'pt-PT'), timeOpts);
  } catch {
    timeStr = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', hour12: !is24h });
  }

  const seconds = now.getSeconds();
  secStr = String(seconds).padStart(2, '0');

  if (timeEl) timeEl.textContent = timeStr;
  if (secEl) {
    if (settings.showSeconds === false) {
      secEl.style.display = 'none';
    } else {
      secEl.style.display = '';
      secEl.textContent = secStr;
    }
  }

  if (dateEl) {
    if (settings.clockShowDate === false) {
      dateEl.style.display = 'none';
    } else {
      dateEl.style.display = '';
      const dateOpts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      if (tz) dateOpts.timeZone = tz;
      try {
        const rawDate = now.toLocaleDateString(t('misc_locale', 'pt-PT'), dateOpts);
        dateEl.textContent = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
      } catch {
        dateEl.textContent = now.toLocaleDateString('pt-PT', dateOpts);
      }
    }
  }

  if (ringFg) {
    const fract = (seconds + (now.getMilliseconds() / 1000)) / 60;
    const circ = 678.58;
    ringFg.style.strokeDashoffset = circ * (1 - fract);
  }
}

function tickClock() {
  const el = document.getElementById('clock');
  if (el) {
    const tz = (typeof settings !== 'undefined' && settings.timezone && settings.timezone !== 'auto') ? settings.timezone : undefined;
    const options = { hour: '2-digit', minute: '2-digit', hour12: false };
    if (tz) options.timeZone = tz;
    try {
      el.textContent = new Date().toLocaleTimeString(t('misc_locale', 'pt-PT'), options);
    } catch {
      el.textContent = new Date().toLocaleTimeString(t('misc_locale', 'pt-PT'), { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  }

  tickFullscreenClock();
}

function updateDateLabel() {
  const el = document.getElementById('date-label');
  if (!el) return;
  const tz = (typeof settings !== 'undefined' && settings.timezone && settings.timezone !== 'auto') ? settings.timezone : undefined;
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  if (tz) options.timeZone = tz;
  try {
    el.textContent = new Date().toLocaleDateString(t('misc_locale', 'pt-PT'), options);
  } catch {
    el.textContent = new Date().toLocaleDateString(t('misc_locale', 'pt-PT'), { weekday: 'long', day: 'numeric', month: 'long' });
  }
}

// Window exports for Focus mode state & actions
window.isFocusZenHidden = () => typeof focusZenHidden !== 'undefined' && focusZenHidden;
window.isFocusTimerActive = () => typeof timer !== 'undefined' && (!!timer || remainSecs > 0);
window.isFocusPaused = () => typeof isPaused !== 'undefined' && isPaused;
window.getFocusCurrentTask = () => (typeof _currentFocusTask !== 'undefined' && _currentFocusTask) ? (S.tasks && S.tasks.find(t => t.id === _currentFocusTask)) : (typeof _focusCachedTask !== 'undefined' ? _focusCachedTask : null);
window.togglePause = togglePause;
window.endFocus = endFocus;
window.addFocusMinutes = addFocusMinutes;
window.toggleFocusZenHideAll = toggleFocusZenHideAll;
window.switchFocusTab = switchFocusTab;
window.exitFocusView = exitFocusView;

