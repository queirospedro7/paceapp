// Pace — Notification centre
// Keeps a local history for alerts emitted by the app and exposes the modal UI.

function notificationTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(t('misc_locale'), {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

function notificationIcon(type) {
  const icons = {
    schedule: '◷',
    routine:  '↻',
    focus:    '◎',
    goal:     '◉',
    success:  '✓',
    warn:     '!',
    error:    '×',
    info:     'i',
    pause:    '⏸',
  };
  return icons[type] || '•';
}

function _getOverdueTasks() {
  const todayStr = today();
  const result = [];
  (S.tasks || []).forEach(task => {
    if (task.archived) return;

    // Range tasks: only overdue if range end is in the past and task was not completed
    if (isRangeTask(task)) {
      const end = task.customRecur?.end;
      if (end && end < todayStr && !task.rangeDone) {
        result.push({ task, date: end });
      }
      return;
    }

    // Only non-recurring (one-off) tasks with a specific past due date that are not completed
    const isOnce = !task.recur || task.recur === 'once' || task.recur === 'specific';
    if (isOnce && task.date && task.date < todayStr) {
      if (!isCompleted(task, task.date)) {
        result.push({ task, date: task.date });
      }
      return;
    }
  });
  // Sort by date descending (most recent overdue first)
  result.sort((a, b) => b.date.localeCompare(a.date));
  return result;
}

function renderNotifications() {
  const content = document.getElementById('notifications-content');
  if (!content) return;

  const overdue = _getOverdueTasks();
  const history = Array.isArray(S.notifications) ? [...S.notifications] : [];

  // ── Overdue section ───────────────────────────────────────────────────────
  let overdueHtml;
  if (overdue.length) {
    overdueHtml = `<div class="notification-list">
      ${overdue.map(({ task, date }) => {
        const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString(t('misc_locale'), { weekday: 'short', day: 'numeric', month: 'short' });
        const catLabel = task.category ? (getCategoryLabel(task.category) || '') : '';
        return `
        <div class="notification-item overdue notification-clickable" onclick="goToDay('${escAttr(date)}')" title="${escAttr(dateLabel)}">
          <span class="notification-symbol">!</span>
          <div class="notification-copy">
            <strong>${escHtml(task.name)}</strong>
            <span>${catLabel ? escHtml(catLabel) + ' · ' : ''}${t('notif_panel_duedate')}: ${escHtml(dateLabel)}</span>
          </div>
          <button class="notification-done" onclick="event.stopPropagation(); completeNotificationTask('${escAttr(task.id)}','${escAttr(date)}')">${t('notif_panel_done')}</button>
        </div>`;
      }).join('')}
    </div>`;
  } else {
    overdueHtml = `<div class="notification-empty">${t('notif_panel_overdue_none')}</div>`;
  }

  // ── History section ───────────────────────────────────────────────────────
  let historyHtml;
  if (history.length) {
    historyHtml = `<div class="notification-list">
      ${history.map(item => `
        <div class="notification-item">
          <span class="notification-symbol">${notificationIcon(item.type)}</span>
          <div class="notification-copy">
            <strong>${escHtml(item.title || '')}</strong>
            <span>${escHtml(item.msg || '')}</span>
          </div>
          <time>${notificationTime(item.ts)}</time>
        </div>`).join('')}
    </div>`;
  } else {
    historyHtml = `<div class="notification-empty">${t('notif_panel_history_none')}</div>`;
  }

  content.innerHTML = `
    <section class="notification-section">
      <div class="notification-section-head">
        <h3>${t('notif_panel_overdue')}</h3>
      </div>
      ${overdueHtml}
    </section>
    <section class="notification-section">
      <div class="notification-section-head">
        <h3>${t('notif_panel_history')}</h3>
        ${history.length ? `<button class="notification-clear" onclick="clearNotifications()">${t('notif_panel_clear')}</button>` : ''}
      </div>
      ${historyHtml}
    </section>`;
}

function clearNotifications() {
  S.notifications = [];
  save();
  renderNotifications();
  updateNotificationBadge();
}

function completeNotificationTask(id, dateStr) {
  const task = S.tasks.find(item => item.id === id);
  if (!task) return;
  if (isRangeTask(task)) {
    task.rangeDone = true;
  } else {
    const targetDate = dateStr || (task.recur === 'once' || !task.recur ? task.date : today()) || today();
    setCompleted(task, targetDate, true);
  }
  save();
  renderAll();
  renderNotifications();
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const badge = document.getElementById('notif-badge');
  const btn = document.getElementById('notifs-btn');
  if (!badge) return;

  const overdue = _getOverdueTasks();
  const history = Array.isArray(S.notifications) ? S.notifications : [];
  const overdueCount = overdue.length;
  const historyCount = history.length;
  const totalCount = overdueCount + historyCount;

  if (totalCount > 0) {
    badge.textContent = totalCount > 99 ? '99+' : String(totalCount);
    badge.classList.remove('hidden');
    badge.classList.toggle('overdue', overdueCount > 0);
    badge.classList.toggle('recent', overdueCount === 0);
  } else {
    badge.classList.add('hidden');
    badge.classList.remove('overdue', 'recent');
  }

  if (btn) {
    const overdueLabel = t('notif_badge_overdue', 'em atraso');
    const recentLabel = t('notif_badge_recent', 'recentes');
    if (overdueCount > 0 && historyCount > 0) {
      btn.title = `${t('nav_notifications', 'Notificações')} (${overdueCount} ${overdueLabel}, ${historyCount} ${recentLabel})`;
    } else if (overdueCount > 0) {
      btn.title = `${t('nav_notifications', 'Notificações')} (${overdueCount} ${overdueLabel})`;
    } else if (historyCount > 0) {
      btn.title = `${t('nav_notifications', 'Notificações')} (${historyCount} ${recentLabel})`;
    } else {
      btn.title = t('nav_notifications', 'Notificações');
    }
  }
}

// Navigate to a specific date: switch to main view, jump to the right week, select the day
function goToDay(dateStr) {
  if (!dateStr) return;
  closeNotifications();

  // Calculate weekOffset: difference in weeks from current week's Monday to target date's Monday
  const now = new Date();
  const todayMonday = new Date(now);
  todayMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  todayMonday.setHours(0, 0, 0, 0);

  const target = new Date(dateStr + 'T12:00:00');
  const targetMonday = new Date(target);
  targetMonday.setDate(target.getDate() - ((target.getDay() + 6) % 7));
  targetMonday.setHours(0, 0, 0, 0);

  const diffMs = targetMonday - todayMonday;
  S.weekOffset = Math.round(diffMs / (7 * 24 * 3600 * 1000));

  // Select the day (null means "today", so only set if it's not today)
  S.selectedDay = dateStr === today() ? null : dateStr;

  save();
  setView('main');
  scheduleRender(renderWeekGrid, renderToday);
}
