// Pace — Objetivos, sub-objetivos e progresso

let activeSubGoalId = null;

function getGoalTypeLabel(type) {
  const map = { week: 'goal_type_weekly', month: 'goal_type_monthly', quarter: 'goal_type_quarterly', year: 'goal_type_yearly', custom: 'goal_type_custom', none: 'goal_type_none' };
  return t(map[type] || type);
}

function openGoals() {
  renderGoals();
  document.getElementById('modal-goals')?.classList.remove('hidden');
  document.getElementById('goals-btn')?.classList.add('active');
  const goalTypeEl = document.getElementById('goal-type');
  if (goalTypeEl && !goalTypeEl.dataset.deadlineListener) {
    goalTypeEl.dataset.deadlineListener = '1';
    goalTypeEl.addEventListener('change', toggleGoalDeadline);
  }
  toggleGoalDeadline();
}

function closeGoals() {
  document.getElementById('modal-goals')?.classList.add('hidden');
  document.getElementById('goals-btn')?.classList.remove('active');
}

function addGoal() {
  const inp = document.getElementById('goal-input');
  const type = document.getElementById('goal-type').value;
  const category = document.getElementById('goal-category').value;
  const desc = document.getElementById('goal-desc').value.trim();
  const deadline = document.getElementById('goal-deadline').value;
  const name = inp.value.trim();
  if (!name) {
    inp.focus();
    inp.style.borderBottomColor = 'var(--danger)';
    setTimeout(() => { inp.style.borderBottomColor = ''; }, 900);
    return;
  }
  const goal = {
    id: 'g_' + Date.now().toString(),
    name,
    desc: desc || undefined,
    type,
    category: category || undefined,
    deadline: deadline || undefined,
    subGoals: [],
    createdAt: Date.now()
  };
  S.goals.push(goal);
  save();
  inp.value = '';
  document.getElementById('goal-desc').value = '';
  document.getElementById('goal-deadline').value = '';
  renderGoals();
  updateGoalsSelect();
  showToast('goal', t('goal_created'), t('goal_added_msg', {name}));
}

function deleteGoal(id) {
  const g = S.goals.find(g => g.id === id);
  if (!g) return;
  showConfirm({
    title: t('goal_delete_title'),
    msg: t('goal_delete_msg', {name: g.name}),
    okLabel: t('goal_delete_btn'),
    type: 'danger',
    onOk: () => {
      S.goals = S.goals.filter(x => x.id !== id);
      S.tasks.forEach(t => { if (t.goalId === id) delete t.goalId; });
      save();
      renderGoals();
      updateGoalsSelect();
      scheduleRender(renderToday, renderWeekGrid);
      showToast('info', t('goal_removed'), t('goal_deleted_msg', {name: g.name}));
    }
  });
}

function setGoalCompletion(goalId, value) {
  const g = S.goals.find(g => g.id === goalId);
  if (!g) return;
  if (value) {
    const tasks = S.tasks.filter(t => !t.archived && t.goalId === goalId);
    tasks.forEach(t => setCompleted(t, today(), true));
    (g.subGoals || []).forEach(sg => sg.done = true);
  } else {
    const tasks = S.tasks.filter(t => !t.archived && t.goalId === goalId);
    tasks.forEach(t => setCompleted(t, today(), false));
    (g.subGoals || []).forEach(sg => sg.done = false);
  }
  save();
  renderGoals();
  scheduleRender(renderToday, renderWeekGrid);
}

function openSubGoalModal(goalId) {
  activeSubGoalId = goalId;
  const g = S.goals.find(g => g.id === goalId);
  if (!g) return;
  document.getElementById('subgoal-modal-goal-name').textContent = g.name;
  document.getElementById('subgoal-input').value = '';
  renderSubGoalList();
  document.getElementById('modal-subgoal').classList.remove('hidden');
}

function closeSubGoalModal() {
  document.getElementById('modal-subgoal').classList.add('hidden');
  activeSubGoalId = null;
  renderGoals();
}

function addSubGoal() {
  if (!activeSubGoalId) return;
  const inp = document.getElementById('subgoal-input');
  const name = inp.value.trim();
  if (!name) { inp.focus(); return; }
  const g = S.goals.find(g => g.id === activeSubGoalId);
  if (!g) return;
  if (!g.subGoals) g.subGoals = [];
  g.subGoals.push({ id: 'sg_' + Date.now(), name, done: false });
  save();
  inp.value = '';
  renderSubGoalList();
  checkGoalSubGoalCompletion(g);
  showToast('success', t('goal_sub_added'), `"${name}"`);
}

function toggleSubGoal(goalId, subId) {
  const g = S.goals.find(g => g.id === goalId);
  if (!g || !g.subGoals) return;
  const sg = g.subGoals.find(s => s.id === subId);
  if (!sg) return;
  sg.done = !sg.done;
  save();
  if (activeSubGoalId === goalId) renderSubGoalList();
  else renderGoals();
  checkGoalSubGoalCompletion(g);
}

function deleteSubGoal(goalId, subId) {
  const g = S.goals.find(g => g.id === goalId);
  if (!g || !g.subGoals) return;
  g.subGoals = g.subGoals.filter(s => s.id !== subId);
  save();
  if (activeSubGoalId === goalId) renderSubGoalList();
  else renderGoals();
}

function checkGoalSubGoalCompletion(g) {
  if (!g.subGoals || !g.subGoals.length) return;
  const allDone = g.subGoals.every(s => s.done);
  if (allDone) {
    showToast('goal', t('goal_unlocked'), t('goal_unlocked_msg', {name: g.name}));
    notify('goal', t('goal_unlocked_notif'), t('goal_unlocked_notif_msg', {name: g.name}));
  }
}

function renderSubGoalList() {
  const list = document.getElementById('subgoal-list');
  if (!list || !activeSubGoalId) return;
  const g = S.goals.find(g => g.id === activeSubGoalId);
  if (!g) return;
  const subs = g.subGoals || [];
  if (!subs.length) {
    list.innerHTML = '<div class="empty-state" style="padding:24px 0">' + t('goal_empty_subs') + '</div>';
    return;
  }
  list.innerHTML = subs.map(sg => `
    <div class="subgoal-item ${sg.done ? 'done' : ''}">
      <button class="subgoal-check" onclick="toggleSubGoal('${escAttr(g.id)}','${escAttr(sg.id)}')"></button>
      <span class="subgoal-name">${escHtml(sg.name)}</span>
      <button class="subgoal-del" onclick="deleteSubGoal('${escAttr(g.id)}','${escAttr(sg.id)}')">×</button>
    </div>
  `).join('');
}

function getGoalPeriodDays(type) {
  const now = new Date();
  const days = [];
  if (type === 'week') {
    const monday = new Date(now);
    const dow = now.getDay();
    monday.setDate(now.getDate() - ((dow + 6) % 7));
    for(let i=0; i<7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
  } else if (type === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for(let i=1; i<=daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
  } else if (type === 'quarter') {
    const year = now.getFullYear();
    const qStart = Math.floor(now.getMonth() / 3) * 3;
    for(let m=qStart; m<qStart+3; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for(let i=1; i<=daysInMonth; i++) {
        days.push(new Date(year, m, i));
      }
    }
  } else if (type === 'none') {
    return [];
  } else if (type === 'year' || type === 'custom') {
    const year = now.getFullYear();
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const totalDays = isLeap ? 366 : 365;
    for(let i=1; i<=totalDays; i++) {
      days.push(new Date(year, 0, i));
    }
  }
  return days;
}

function calcGoalProgress(goal) {
  const tasks = S.tasks.filter(t => !t.archived && t.goalId === goal.id);

  const subs = goal.subGoals || [];
  const subDone = subs.filter(s => s.done).length;
  const subTotal = subs.length;

  if (!tasks.length && !subTotal) return { prog: 0, done: 0, total: 0, subDone, subTotal, taskProg: 0 };

  const days = getGoalPeriodDays(goal.type);
  let possible = 0;
  let doneCount = 0;

  const goalCreated = goal.createdAt || parseInt(goal.id.replace('g_','')) || 0;

  days.forEach(d => {
    const dateStr = fmtDate(d);
    tasks.forEach(t => {
      const taskCreated = parseInt(t.id) || 0;
      const startRef = Math.max(goalCreated, taskCreated);
      if (taskActiveOnDate(t, d)) {
        if (d.getTime() >= startRef - 43200000) {
          possible++;
          if (isCompleted(t, dateStr)) doneCount++;
        }
      }
    });
  });

  const taskProg = possible === 0 ? 0 : Math.min(100, Math.round((doneCount / possible) * 100));

  let prog;
  if (subTotal > 0 && possible > 0) {
    prog = Math.round((taskProg * 0.6) + ((subDone / subTotal) * 100 * 0.4));
  } else if (subTotal > 0) {
    prog = Math.round((subDone / subTotal) * 100);
  } else {
    prog = taskProg;
  }

  return { prog: Math.min(100, prog), done: doneCount, total: possible, subDone, subTotal, taskProg };
}

function getDeadlineStatus(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const dl = new Date(deadline + 'T23:59:59');
  const diff = dl - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: t('goal_expired'), cls: 'overdue' };
  if (days === 0) return { label: t('goal_deadline_today'), cls: 'overdue' };
  if (days === 1) return { label: t('goal_deadline_tomorrow'), cls: '' };
  if (days <= 7) return { label: `${days} ${t('goal_days_left')}`, cls: '' };
  return { label: new Date(deadline).toLocaleDateString(t('misc_locale'), { day: 'numeric', month: 'short' }), cls: '' };
}

let _goalFilter = 'all'; // 'all' | 'active' | 'completed'

function setGoalFilter(filter) {
  _goalFilter = filter;
  renderGoals();
}

function addQuickSubGoal(goalId) {
  const g = S.goals.find(x => x.id === goalId);
  if (!g) return;
  const inp = document.getElementById('sg-input-' + goalId);
  const name = inp ? inp.value.trim() : '';
  if (!name) return;
  if (!g.subGoals) g.subGoals = [];
  g.subGoals.push({ id: 'sg_' + Date.now().toString(), name, done: false });
  save();
  renderGoals();
}

function renderGoals() {
  const list = document.getElementById('goals-list');
  if (!list) return;

  if (!S.goals.length) {
    list.innerHTML = '<div class="empty-state">' + t('goal_empty') + '</div>';
    return;
  }

  const filteredGoals = S.goals.filter(g => {
    const st = calcGoalProgress(g);
    const isComplete = st.prog >= 100;
    if (_goalFilter === 'active') return !isComplete;
    if (_goalFilter === 'completed') return isComplete;
    return true;
  });

  const filterTabsHtml = `
    <div class="goal-filter-tabs" style="display:flex;gap:6px;margin-bottom:12px;">
      <button type="button" class="goal-filter-tab ${_goalFilter==='all'?'active':''}" onclick="setGoalFilter('all')">Todos (${S.goals.length})</button>
      <button type="button" class="goal-filter-tab ${_goalFilter==='active'?'active':''}" onclick="setGoalFilter('active')">Em Progresso</button>
      <button type="button" class="goal-filter-tab ${_goalFilter==='completed'?'active':''}" onclick="setGoalFilter('completed')">Concluídos</button>
    </div>
  `;

  if (!filteredGoals.length) {
    list.innerHTML = filterTabsHtml + '<div class="empty-state">' + t('goal_empty_subs', 'Sem objetivos nesta categoria.') + '</div>';
    return;
  }

  list.innerHTML = filterTabsHtml + filteredGoals.map(g => {
    const st = calcGoalProgress(g);
    const linkedTasks = S.tasks.filter(t => !t.archived && t.goalId === g.id).length;
    const subs = g.subGoals || [];
    const catColor = g.category ? CATEGORY_COLORS[g.category] || '#888' : null;
    const catLabel = g.category ? getCategoryLabel(g.category) : null;
    const dl = getDeadlineStatus(g.deadline);
    const isComplete = st.prog >= 100;

    const subGoalsHtml = `
      <div class="goal-subgoals">
        <div class="goal-subgoals-header">
          <span class="goal-subgoals-label">${t('goal_subs')}</span>
          <span class="goal-subgoals-count">${st.subDone}/${st.subTotal} ${t('goal_subs_done')}</span>
        </div>
        ${subs.map(sg => `
          <div class="subgoal-item ${sg.done ? 'done' : ''}">
            <button class="subgoal-check" onclick="toggleSubGoal('${escAttr(g.id)}','${escAttr(sg.id)}')"></button>
            <span class="subgoal-name">${escHtml(sg.name)}</span>
            <button class="subgoal-del" onclick="deleteSubGoal('${escAttr(g.id)}','${escAttr(sg.id)}')">×</button>
          </div>
        `).join('')}
        <div class="subgoal-quick-add" style="display:flex;gap:6px;margin-top:6px;">
          <input type="text" id="sg-input-${escAttr(g.id)}" class="field-input" style="font-size:0.7rem;padding:4px 8px;flex:1;border-radius:6px;" placeholder="${t('goal_sub_placeholder', 'Novo sub-objetivo...')}" onkeydown="if(event.key==='Enter')addQuickSubGoal('${escAttr(g.id)}')" />
          <button type="button" class="btn-goal-add" style="padding:4px 10px;font-size:0.7rem;" onclick="addQuickSubGoal('${escAttr(g.id)}')">+</button>
        </div>
      </div>
    `;

    return `
      <div class="goal-row ${isComplete ? 'goal-completed' : ''}">
        <div class="goal-row-header">
          <div class="goal-info">
            <div class="goal-info-top">
              <span class="goal-name">${escHtml(g.name)}</span>
              <span class="goal-type-badge">${getGoalTypeLabel(g.type)}</span>
              ${catLabel ? `<span class="goal-cat-badge" style="background:${catColor}22;color:${catColor};border:1px solid ${catColor}44">${catLabel}</span>` : ''}
              ${dl ? `<span class="goal-deadline-badge ${dl.cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="10" height="10"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${dl.label}</span>` : ''}
            </div>
            ${g.desc ? `<div class="goal-desc">${escHtml(g.desc)}</div>` : ''}
          </div>
          <div class="goal-row-actions">
            <button class="goal-del" onclick="deleteGoal('${escAttr(g.id)}')" title="${t('goal_delete_tooltip')}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill ${isComplete ? 'complete' : ''}" style="width: ${st.prog}%"></div>
        </div>
        <div class="goal-stats">
          <span>${linkedTasks} ${t('misc_subtasks')} · ${st.done}/${st.total} ${t('misc_instances')}${st.subTotal ? ` · ${st.subDone}/${st.subTotal} ${t('misc_sub_goals')}` : ''}</span>
          <span class="goal-stats-pct" style="font-weight:700;color:${isComplete ? 'var(--accent, #6366f1)' : 'var(--text)'}">${st.prog}%${isComplete ? ' ✓' : ''}</span>
        </div>
        ${subGoalsHtml}
      </div>
    `;
  }).join('');
}

function updateGoalsSelect() {
  const sel = document.getElementById('inp-goal');
  if (!sel) return;
  sel.innerHTML = '<option value="">' + t('task_no_goal') + '</option>' +
    S.goals.map(g => `<option value="${g.id}">${escHtml(g.name)}</option>`).join('');
  rebuildCustomSelect(sel);
}

function toggleGoalDeadline() {
  const type = document.getElementById('goal-type')?.value;
  const dl = document.getElementById('goal-deadline');
  if (!dl) return;
  if (type === 'custom') {
    dl.classList.remove('hidden');
  } else {
    dl.classList.add('hidden');
    dl.value = '';
  }
}
