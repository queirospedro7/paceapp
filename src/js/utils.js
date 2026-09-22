// Pace — Utilitários

function getDaysShort() {
  return [t('day_dom_short'), t('day_seg_short'), t('day_ter_short'), t('day_qua_short'), t('day_qui_short'), t('day_sex_short'), t('day_sab_short')];
}
const CIRC = 678.58;
const COOKIE_DURATION_DAYS = 90;
const NOTIF_ICON = 'data:image/x-icon;base64,AAABAAEAAAAAAAEAIAC5FQAAFgAAAIlQTkcNChoKAAAADUlIRFIAAAEAAAABAAgGAAAAXHKoZgAAAAFvck5UAc+id5oAABVzSURBVHja7Z15jBXVtsYLGoV7L6BNMzTzIImYCzJ0nBgUnBlinog3QoOAio8GTN4VngpEIbERiIqCyRU1QNSE5kUh+Id6L0RAZZBBiFyDhlmaFhGeAgq0Cr1ffdWFDxSk+1Sdc6pq/1bySzpN06fPt/f6TtWutdd2nGhGrksnl4Euk13mu6xw+dyl1OWoS7nLaRcDkEVO+3PxqD83NUc/8Oes5u7fXLq65LnUcIjzxp9dOrqMcJnr8rHLfpfjLhVMMogpmrsnXL52WevP7Qf8D7e/2J70tX1nfNTlny4H+EQHS64YvnFZ5vKYS4FLHZsSv7HLEJfFLgeZECD517oscSl0aZLkxG/lf9pvcPmZgQc4B+XEJpfxLq2TlPhN/cTfyv08QJXQQuIEP3divbCnS/1PSHyAlBYQN/i3BrFbMOziUuJykoEECIRy6H/8BfNYfOqPdtnDwAGEinKqyM+xSEYblwV+UQQDBhA+5X6OtYla8vfwCx0YJID0o3W1XlFIfJU23sslP0DG2etUlhlnrbw4x78nOcxgAGSF//VzMCfTyV/Lf7Z/jEEAyCo/+MVDl2Tyk//vTuVGHQYAIPsc900g7VcCNfxLDj75AaJ3JVCU7jWBe/37DgQHiOaawL3pSv6erPYDxOLpQM90FPnwnB8gHqwLs1joT371EcICxIcFYZUNj6a8FyCWZcNFQZO/K/f9ALHeQNQl1eTX5cMiRASINSWp3gqoEQH7+QHi30+gsLrJr1ZE6xEPIBGsd6rZXkxlhbTxAkgGFf7enSpFa5d/IxpAolBOt6rqpz+CAVh4FaCDCTYiFkAiUW43vtjKP4d2ACQT5faQCyW/zidbgkgAiUZH8tU+nwF0czirDyDpHHQucMbAfyMOgBVM+G3y6+ihZQgDYAX/+m15cCen8sxyxAFIPgdcOp5tACNdTiOMgBUo10ecSX41EZyLKABW8fIZA2jgsgZBAKxitUuuDKCzSxmCAFjFfperZQD3OBzykXguueQSU7duXZOXl2fy8/NNs2bNTIsWLTz0tb6nf9PP6GfRLPEo5wfKACaz9Tc5KIHbtGljevbsae6//34zadIk8/LLL5ulS5ealStXmk2bNplt27aZHTt2mD179njoa31P/6afeeedd8xrr71mnnrqKTNy5EjTu3dv07ZtW+93o3GiNgdNkgEsQIx4J3znzp3N8OHDzYsvvuglsJL66NGjpqKiwgQN/Y4ffvjB7N2716xatcq89NJLZsSIEd5r1qtXjzGIN/NkAB8gRLy4/PLLvU/l4uJiL+G/+eYbc/r0aZOp0Gt9++23niHob7j55ptNgwYNGJv4odx3PkeI6FO7dm1TUFBgpkyZYtauXet9wkcljh07ZtatW2emTp1qrrnmGlOnTh3GLB6oSYhTihDR/rS/++67zVtvvWUOHjxooh6HDh0yb7/9thk0aBBXBdFHue8cRYjooRX5Bx54wLvMPnnypIlblJeXm48++sg89NBDplGjRoxpNDkiA+DUnwhRv359b/X+448/Nr/88ouJe+g96JZFC4eXXXYZYxwt1DKcPQBRoFatWua2224z7777rvnpp59M0kLv6f333zd33HGH910Z80hwykGE7KNn7HPmzDHff/+9SXocOXLEe5R4xRVXMPbRABGyWZ133303ePDhb9u2bcZ933/XXbIAAAAASUVORK5CYII=';

const RECUR_DAY_MAP = { mon:1, tue:2, wed:3, thu:4, fri:5, sat:6, sun:0 };

function getRecurLabel(key) {
  const map = { once: '', daily: 'recur_daily', weekdays: 'recur_weekdays', weekend: 'recur_weekend', monthly: 'recur_monthly', yearly: 'recur_yearly', custom: 'recur_custom', mon: 'recur_mon', tue: 'recur_tue', wed: 'recur_wed', thu: 'recur_thu', fri: 'recur_fri', sat: 'recur_sat', sun: 'recur_sun' };
  const k = map[key];
  return k ? t(k) : '';
}

const _customCategoryLabels = {};

function getCategoryLabel(key) {
  if (!key) return '';
  const map = { work: 'task_cat_work', study: 'task_cat_study', personal: 'task_cat_personal' };
  if (_customCategoryLabels[key]) return _customCategoryLabels[key];
  const k = map[key];
  if (k) return t(k);
  const all = typeof getAllCategories === 'function' ? getAllCategories() : [];
  const found = all.find(c => c.id === key);
  if (found) return found.name;
  return '';
}

const CATEGORY_COLORS = {
  work: '#3b82f6', study: '#8b5cf6', personal: '#f59e0b'
};

function getSystemTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function getAppTimezone() {
  return getSystemTimezone();
}

function today() {
  return fmtDate(new Date());
}

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function escHtml(s) {
  const str = String(s || '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s) {
  return escHtml(s).replace(/'/g, '&#39;');
}

/* ── HTML sanitizer ─────────────────────────────────────────── */
const _SAFE_TAGS = /^(b|i|u|em|strong|br|p|ul|ol|li|h[1-6]|blockquote|code|pre|span|sup|sub|mark|s|del)$/i;
const _SAFE_ATTRS = /^(href|src|alt|title|style|class|target)$/i;
const _DANGEROUS_STYLE = /(position\s*:|expression\s*\(|javascript\s*:|data\s*:|@import)/i;

function sanitizeNoteHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  function clean(el) {
    for (let i = el.childNodes.length - 1; i >= 0; i--) {
      const node = el.childNodes[i];
      if (node.nodeType === 1) {
        const tag = node.tagName.toLowerCase();
        if (!_SAFE_TAGS.test(tag)) { node.remove(); continue; }
        for (let j = node.attributes.length - 1; j >= 0; j--) {
          const attr = node.attributes[j];
          if (!_SAFE_ATTRS.test(attr.name)) { node.removeAttribute(attr.name); }
          else if (attr.name === 'style' && _DANGEROUS_STYLE.test(attr.value)) { node.removeAttribute('style'); }
          else if (attr.name === 'href' && /^\s*javascript\s*:/i.test(attr.value)) { node.removeAttribute('href'); }
          else if (attr.name === 'src' && /^\s*(javascript|data)\s*:/i.test(attr.value)) { node.removeAttribute('src'); }
        }
        clean(node);
      }
    }
  }
  clean(tmp);
  return tmp.innerHTML;
}

/* ── Date / week utilities ──────────────────────────────────── */
function getWeekDays(offset = 0) {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dow + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getCustomRecurLabel(rule) {
  if (!rule) return getRecurLabel('custom');
  if (rule.range) {
    const start = rule.start ? rule.start.slice(5).replace('-', '/') : '';
    const end = rule.end ? rule.end.slice(5).replace('-', '/') : '';
    if (start && end) return `${t('recur_range')} ${start}-${end}`;
    return t('recur_range');
  }
  const days = Array.isArray(rule.days) ? rule.days : [];
  const dayNames = [t('recur_sun'), t('recur_mon'), t('recur_tue'), t('recur_wed'), t('recur_thu'), t('recur_fri'), t('recur_sat')];
  const dayText = days.length ? days.map(d => dayNames[Number(d)]).filter(Boolean).join('/') : t('recur_all');
  const start = rule.start ? rule.start.slice(5).replace('-', '/') : '';
  const end = rule.end ? rule.end.slice(5).replace('-', '/') : '';
  if (start && end) return `${dayText} ${start}-${end}`;
  if (start) return `${dayText} ${t('recur_from')} ${start}`;
  if (end) return `${dayText} ${t('recur_until')} ${end}`;
  return dayText;
}

function getCustomRecurFromForm() {
  const start = document.getElementById('custom-recur-start')?.value || '';
  const end = document.getElementById('custom-recur-end')?.value || '';
  const days = Array.from(document.querySelectorAll('#custom-recur-panel input[type="checkbox"]:checked'))
    .map(input => Number(input.value));
  return { start, end, days };
}

function resetCustomRecurForm() {
  const start = document.getElementById('custom-recur-start');
  const end = document.getElementById('custom-recur-end');
  if (start) start.value = '';
  if (end) end.value = '';
  document.querySelectorAll('#custom-recur-panel input[type="checkbox"]').forEach(input => {
    input.checked = false;
  });
  const rStart = document.getElementById('range-recur-start');
  const rEnd = document.getElementById('range-recur-end');
  if (rStart) rStart.value = '';
  if (rEnd) rEnd.value = '';
  toggleCustomRecurPanel();
}

function dateInCustomRecur(rule, dateObj) {
  if (!rule) return false;
  const date = fmtDate(dateObj);
  if (rule.start && rule.end && rule.start > rule.end) return false;
  if (rule.start && date < rule.start) return false;
  if (rule.end && date > rule.end) return false;
  const days = Array.isArray(rule.days) ? rule.days.map(Number) : [];
  if (!days.length) return true;
  return days.includes(dateObj.getDay());
}

/* ── Task active/completion helpers ────────────────────────── */
function getTaskCreatedDateStr(task) {
  if (!task.createdAt) return today();
  if (typeof task.createdAt === 'string' && task.createdAt.length >= 10) {
    return task.createdAt.slice(0, 10);
  }
  if (typeof task.createdAt === 'number') {
    return fmtDate(new Date(task.createdAt));
  }
  return today();
}

function taskActiveOnDate(task, dateObj) {
  const r = task.recur;
  const dateStr = fmtDate(dateObj);
  const createdDateStr = getTaskCreatedDateStr(task);

  if (!r || r === 'once') return (task.date || createdDateStr) === dateStr;
  if (r === 'custom') return task.customRecur ? dateInCustomRecur(task.customRecur, dateObj) : false;
  if (createdDateStr && dateStr < createdDateStr) return false;
  if (r === 'daily') return true;
  if (r === 'weekdays') { const d = dateObj.getDay(); return d >= 1 && d <= 5; }
  if (r === 'weekend')  { const d = dateObj.getDay(); return d === 0 || d === 6; }
  if (r === 'monthly') {
    const day = dateObj.getDate();
    const baseDay = task.monthlyDay || (task.date ? parseInt(task.date.slice(8, 10), 10) : parseInt(createdDateStr.slice(8, 10), 10));
    const lastDayOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
    return day === Math.min(baseDay, lastDayOfMonth);
  }
  if (r === 'yearly') {
    const m = dateObj.getMonth() + 1;
    const d = dateObj.getDate();
    let baseM = task.yearlyMonth;
    let baseD = task.yearlyDay;
    if (!baseM || !baseD) {
      const parts = (task.date || createdDateStr).split('-').map(Number);
      baseM = parts[1];
      baseD = parts[2];
    }
    return m === baseM && d === baseD;
  }
  if (RECUR_DAY_MAP[r] !== undefined) return dateObj.getDay() === RECUR_DAY_MAP[r];
  return false;
}

function activeTasksForDate(dateObj) {
  return S.tasks.filter(task => {
    if (task.archived) return false;
    return taskActiveOnDate(task, dateObj);
  });
}

function isRangeTask(task) {
  return task && task.recur === 'custom' && task.customRecur && task.customRecur.range;
}

function isCompleted(task, dateStr) {
  if (isRangeTask(task)) return !!task.rangeDone;
  return !!(task.completions && task.completions[dateStr]);
}

function setCompleted(task, dateStr, val) {
  if (isRangeTask(task)) {
    task.rangeDone = !!val;
    return;
  }
  if (!task.completions) task.completions = {};
  if (val) task.completions[dateStr] = true;
  else delete task.completions[dateStr];
}

/* ── Formatting helpers ─────────────────────────────────────── */
function fmtMins(mins) {
  if (mins === 0) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function fmtDurationFromSecs(secs) {
  const total = Math.max(0, Math.round(secs));
  if (total < 60) return `${total} ${t('time_secs')}`;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    const parts = [`${h} ${h === 1 ? t('time_hour') : t('time_hours')}`];
    if (m) parts.push(`${m} ${t('time_mins')}`);
    else if (s) parts.push(`${s} ${t('time_secs')}`);
    return parts.join(' ');
  }
  if (m > 0 && s > 0) return `${m} ${t('time_mins')} ${s} ${t('time_secs')}`;
  if (m > 0) return `${m} ${t('time_mins')}`;
  return `${s} ${t('time_secs')}`;
}

function parseColorToRgb(color) {
  if (!color || typeof color !== 'string') return { r: 99, g: 102, b: 241 };
  let str = color.trim().toLowerCase();

  // Handle rgb / rgba format
  if (str.startsWith('rgb')) {
    const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return { r: parseInt(match[1], 10), g: parseInt(match[2], 10), b: parseInt(match[3], 10) };
    }
  }

  // Handle Hex
  let hex = str.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  } else if (hex.length === 4) {
    hex = hex.slice(0, 3).split('').map(c => c + c).join('');
  } else if (hex.length > 6) {
    hex = hex.slice(0, 6);
  }

  if (hex.length === 6) {
    const num = parseInt(hex, 16);
    if (!isNaN(num)) {
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
      };
    }
  }

  return { r: 99, g: 102, b: 241 };
}

function getLuminance(color) {
  const { r, g, b } = parseColorToRgb(color);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function getContrastColor(color) {
  return getLuminance(color) > 135 ? '#09090b' : '#ffffff';
}

function getReadableAccentColor(color) {
  const { r, g, b } = parseColorToRgb(color);
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  // If too dark on dark background (lum < 60), brighten it for text readability
  if (lum < 60) {
    const boost = Math.min(255, Math.round(lum * 1.5 + 90));
    return `rgb(${Math.max(r, boost)}, ${Math.max(g, boost)}, ${Math.max(b, boost)})`;
  }
  return color;
}

window.parseColorToRgb = parseColorToRgb;
window.getLuminance = getLuminance;
window.getContrastColor = getContrastColor;
window.getReadableAccentColor = getReadableAccentColor;

/* ── UI helpers ─────────────────────────────────────────────── */
function toggleCustomRecurPanel() {
  const recur = document.getElementById('inp-recur')?.value;
  document.getElementById('custom-recur-panel')?.classList.toggle('hidden', recur !== 'custom');
  document.getElementById('range-recur-panel')?.classList.toggle('hidden', recur !== 'range');
}

/* ── Notifications ──────────────────────────────────────────── */
function nativeNotify(title, body) {
  if (window.appNotify) window.appNotify.send(title, body);
}

function pushNotification(type, title, msg) {
  if (!S.notifications) S.notifications = [];
  S.notifications.unshift({ type, title, msg, ts: Date.now() });
  if (S.notifications.length > 50) S.notifications.length = 50;
  save();
  if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
}
