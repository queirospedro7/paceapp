// Pace — Bespoke Executive Context Menus
(function() {
  let _activeMenu = null;

  function closeContextMenu() {
    if (_activeMenu) {
      _activeMenu.remove();
      _activeMenu = null;
    }
  }

  const SVG_ICONS = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>',
    focus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>',
    priorityHigh: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    priorityNormal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"/></svg>',
    priorityLow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/></svg>',
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="15" r="1.5" fill="currentColor"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    bold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>',
    italic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>',
    heading: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M4 18V6"/><path d="M20 18V6"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    spell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 16 6-12 6 12"/><path d="M6.5 11h7"/><path d="m18 13 2 2 4-4"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    paste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><polygon points="7,5 19,12 7,19"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>'
  };

  function createMenuItem({ icon, label, shortcut, danger, onClick }) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ctx-item' + (danger ? ' danger' : '');
    const svgContent = SVG_ICONS[icon] || icon || '';
    btn.innerHTML = `
      <span class="ctx-icon">${svgContent}</span>
      <span class="ctx-label">${escHtml(label)}</span>
      ${shortcut ? `<span class="ctx-shortcut">${escHtml(shortcut)}</span>` : ''}
    `;
    btn.onclick = (e) => {
      e.stopPropagation();
      closeContextMenu();
      if (typeof onClick === 'function') onClick();
    };
    return btn;
  }

  function createSeparator() {
    const sep = document.createElement('div');
    sep.className = 'ctx-separator';
    return sep;
  }

  function createHeader(text) {
    const hdr = document.createElement('div');
    hdr.className = 'ctx-header';
    hdr.textContent = text;
    return hdr;
  }

  function openContextMenu(e, items) {
    e.preventDefault();
    e.stopPropagation();
    closeContextMenu();

    if (!items || !items.length) return;

    const menu = document.createElement('div');
    menu.className = 'pace-context-menu';

    items.forEach(item => {
      if (item === '---') {
        menu.appendChild(createSeparator());
      } else if (item.header) {
        menu.appendChild(createHeader(item.header));
      } else if (item.custom) {
        menu.appendChild(item.custom);
      } else if (item.label) {
        menu.appendChild(createMenuItem(item));
      }
    });

    document.body.appendChild(menu);
    _activeMenu = menu;

    const zoomScale = parseFloat(document.documentElement.style.zoom) || 1.0;
    const winWidth = window.innerWidth / zoomScale;
    const winHeight = window.innerHeight / zoomScale;

    const cursorX = e.clientX / zoomScale;
    const cursorY = e.clientY / zoomScale;

    const menuWidth = menu.offsetWidth || 210;
    const menuHeight = menu.offsetHeight || 200;
    const margin = 8 / zoomScale;

    let posX = cursorX;
    let posY = cursorY;

    // Flip left if near right edge
    if (posX + menuWidth > winWidth - margin) {
      posX = cursorX - menuWidth;
    }
    // Flip upward if near bottom edge
    if (posY + menuHeight > winHeight - margin) {
      posY = cursorY - menuHeight;
    }

    // Strict safety bounds so it never cuts off at viewport edges
    if (posX < margin) posX = margin;
    if (posY < margin) posY = margin;
    if (posX + menuWidth > winWidth - margin) posX = winWidth - menuWidth - margin;
    if (posY + menuHeight > winHeight - margin) posY = winHeight - menuHeight - margin;

    menu.style.left = posX + 'px';
    menu.style.top = posY + 'px';
    menu.style.transformOrigin = (posX < cursorX ? 'right' : 'left') + ' ' + (posY < cursorY ? 'bottom' : 'top');
  }

  window.addEventListener('contextmenu', function(e) {
    // 1. Check if clicked on a task row
    const taskRow = e.target.closest('.task-row, .day-task-row, .notes-task-row, [data-task-id]');
    if (taskRow) {
      const taskId = taskRow.dataset.taskId || taskRow.getAttribute('data-task-id');
      const task = S.tasks && S.tasks.find(t => t.id === taskId);
      if (task) {
        const activeDay = S.selectedDay || today();
        const isDone = isCompleted(task, activeDay);
        const prio = task.priority || 'normal';

        const items = [
          {
            header: task.name.length > 28 ? task.name.slice(0, 26) + '…' : task.name
          },
          {
            icon: isDone ? 'undo' : 'check',
            label: isDone ? t('ctx_reopen', 'Reabrir Tarefa') : t('ctx_complete', 'Concluir Tarefa'),
            onClick: () => toggleTaskDate(task.id, activeDay)
          },
          {
            icon: 'focus',
            label: t('ctx_focus', 'Iniciar Foco'),
            onClick: () => {
              if (typeof openFocusWithTask === 'function') openFocusWithTask(task.id);
              else if (typeof openFocusPicker === 'function') openFocusPicker();
            }
          },
          '---',
          {
            header: t('ctx_priority', 'Prioridade')
          },
          {
            icon: prio === 'high' ? 'priorityHigh' : 'priorityLow',
            label: t('ctx_priority_high', 'Urgente'),
            onClick: () => {
              task.priority = 'high';
              save();
              renderAll();
            }
          },
          {
            icon: prio === 'normal' ? 'priorityNormal' : 'priorityLow',
            label: t('ctx_priority_normal', 'Normal'),
            onClick: () => {
              task.priority = 'normal';
              save();
              renderAll();
            }
          },
          {
            icon: prio === 'low' ? 'priorityNormal' : 'priorityLow',
            label: t('ctx_priority_low', 'Baixa'),
            onClick: () => {
              task.priority = 'low';
              save();
              renderAll();
            }
          },
          '---',
          {
            icon: 'today',
            label: t('ctx_move_today', 'Mover para Hoje'),
            onClick: () => {
              task.date = today();
              task.recur = 'once';
              save();
              renderAll();
              showToast('success', t('task_moved_day', 'Tarefa movida'), `"${task.name}" ➔ Hoje`);
            }
          },
          {
            icon: 'arrowRight',
            label: t('ctx_move_tomorrow', 'Mover para Amanhã'),
            onClick: () => {
              const tmr = new Date();
              tmr.setDate(tmr.getDate() + 1);
              const tmrStr = fmtDate(tmr);
              task.date = tmrStr;
              task.recur = 'once';
              save();
              renderAll();
              showToast('success', t('task_moved_day', 'Tarefa movida'), `"${task.name}" ➔ Amanhã`);
            }
          },
          {
            icon: 'template',
            label: t('ctx_save_template', 'Guardar como Modelo'),
            onClick: () => saveTaskAsTemplate(task.id)
          },
          '---',
          {
            icon: 'trash',
            label: t('ctx_delete_task', 'Eliminar Tarefa'),
            danger: true,
            onClick: () => deleteTask(task.id)
          }
        ];
        openContextMenu(e, items);
        return;
      }
    }

    // 2. Check if clicked on a day card / calendar cell
    const dayCard = e.target.closest('.day-card, .month-note-cell, .ov-month-cell, .ov-week-day');
    if (dayCard) {
      let dateStr = dayCard.dataset.date || (dayCard.id && dayCard.id.startsWith('dc-') ? dayCard.id.replace('dc-', '') : null);
      if (!dateStr && dayCard.dataset.dateStr) dateStr = dayCard.dataset.dateStr;

      if (dateStr) {
        const dateObj = new Date(dateStr + 'T12:00:00');
        const formatted = dateObj.toLocaleDateString(t('misc_locale'), { weekday: 'long', day: 'numeric', month: 'short' });

        const moodRow = document.createElement('div');
        moodRow.className = 'ctx-mood-row';
        moodRow.innerHTML = `
          <button type="button" class="ctx-mood-btn pos" onclick="setContextRating('${dateStr}','positive')">
            <svg viewBox="0 0 24 24" width="8" height="8"><circle cx="12" cy="12" r="10" fill="#22c55e"/></svg>
            ${t('ctx_rating_positive', 'Positivo')}
          </button>
          <button type="button" class="ctx-mood-btn neu" onclick="setContextRating('${dateStr}','neutral')">
            <svg viewBox="0 0 24 24" width="8" height="8"><circle cx="12" cy="12" r="10" fill="#eab308"/></svg>
            ${t('ctx_rating_neutral', 'Neutro')}
          </button>
          <button type="button" class="ctx-mood-btn neg" onclick="setContextRating('${dateStr}','negative')">
            <svg viewBox="0 0 24 24" width="8" height="8"><circle cx="12" cy="12" r="10" fill="#ef4444"/></svg>
            ${t('ctx_rating_negative', 'Negativo')}
          </button>
        `;

        const items = [
          {
            header: formatted.charAt(0).toUpperCase() + formatted.slice(1)
          },
          {
            icon: 'search',
            label: t('ctx_day_details', 'Ver Detalhes do Dia'),
            onClick: () => {
              if (typeof openDayInspector === 'function') openDayInspector(dateStr);
              else if (typeof openDayDetail === 'function') openDayDetail(dateStr);
            }
          },
          {
            icon: 'plus',
            label: t('ctx_new_task_day', 'Nova Tarefa neste Dia'),
            onClick: () => {
              goToDay(dateStr);
              const inp = document.getElementById('task-input');
              if (inp) inp.focus();
            }
          },
          {
            icon: 'notes',
            label: t('ctx_open_notes_day', 'Abrir Notas deste Dia'),
            onClick: () => {
              S.selectedNoteDate = dateStr;
              save();
              openNotes();
              if (typeof selectMonthNoteDay === 'function') selectMonthNoteDay(null, dateStr);
            }
          },
          '---',
          {
            header: t('ctx_day_rating', 'Avaliação do Dia')
          },
          {
            custom: moodRow
          }
        ];
        openContextMenu(e, items);
        return;
      }
    }

    // 3. Check if in Notes Editor
    const noteEditor = e.target.closest('.note-editor, .month-note-editor');
    if (noteEditor) {
      // Se o utilizador segurar Shift, abre o menu nativo do sistema
      if (e.shiftKey) {
        return;
      }

      // Detetar palavra sob o cursor ou seleção
      let selectedText = window.getSelection() ? window.getSelection().toString().trim() : '';
      let targetRange = null;

      if (!selectedText) {
        // Tentar selecionar a palavra clicada com caretRangeFromPoint / caretPositionFromPoint
        let range = null;
        if (document.caretRangeFromPoint) {
          range = document.caretRangeFromPoint(e.clientX, e.clientY);
        } else if (document.caretPositionFromPoint) {
          const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
          if (pos) {
            range = document.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
          }
        }

        if (range && range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
          const text = range.startContainer.textContent;
          let offset = range.startOffset;
          // Encontrar limites exatos da palavra com caracteres portugueses
          let start = offset;
          while (start > 0 && /[\wáàãâéêíóôõúçÁÀÃÂÉÊÍÓÔÕÚÇ]/.test(text[start - 1])) {
            start--;
          }
          let end = offset;
          while (end < text.length && /[\wáàãâéêíóôõúçÁÀÃÂÉÊÍÓÔÕÚÇ]/.test(text[end])) {
            end++;
          }
          if (end > start) {
            const word = text.slice(start, end).trim();
            if (word.length >= 2) {
              selectedText = word;
              const wordRange = document.createRange();
              wordRange.setStart(range.startContainer, start);
              wordRange.setEnd(range.startContainer, end);
              targetRange = wordRange;
            }
          }
        }
      }

      const items = [];

      if (selectedText) {
        const spellResult = window.PaceSpell ? window.PaceSpell.getSuggestions(selectedText) : { isCorrect: true, suggestions: [] };
        const suggestions = spellResult.suggestions || [];

        items.push({ header: `${t('ctx_spelling_suggestions', 'Sugestões')}: "${selectedText}"` });

        if (suggestions.length > 0) {
          suggestions.forEach(sug => {
            items.push({
              icon: 'spell',
              label: sug,
              onClick: () => {
                if (targetRange) {
                  const sel = window.getSelection();
                  sel.removeAllRanges();
                  sel.addRange(targetRange);
                }
                document.execCommand('insertText', false, sug);
                if (typeof saveSelectedNote === 'function') saveSelectedNote();
              }
            });
          });

          items.push('---');
          items.push({
            icon: 'plus',
            label: t('ctx_add_dict', 'Adicionar ao dicionário'),
            onClick: () => {
              if (window.PaceSpell) window.PaceSpell.addUserWord(selectedText);
              showToast('success', t('ctx_dict_title', 'Dicionário'), `"${selectedText}" foi adicionada.`, 2500);
            }
          });
          items.push({
            icon: 'undo',
            label: t('ctx_ignore_word', 'Ignorar palavra'),
            onClick: () => {
              if (window.PaceSpell) window.PaceSpell.ignoreWord(selectedText);
            }
          });
        } else {
          items.push({
            icon: 'check',
            label: t('ctx_spelling_none', 'Palavra parece correta'),
            onClick: () => {}
          });
          items.push({
            icon: 'plus',
            label: t('ctx_add_dict', 'Adicionar ao dicionário'),
            onClick: () => {
              if (window.PaceSpell) window.PaceSpell.addUserWord(selectedText);
              showToast('success', t('ctx_dict_title', 'Dicionário'), `"${selectedText}" foi adicionada.`, 2500);
            }
          });
        }
        items.push('---');
      }

      // Ações de clipboard e formatação com o estilo bespoke do Pace
      items.push(
        {
          icon: 'copy',
          label: t('ctx_copy', 'Copiar'),
          shortcut: 'Ctrl+C',
          onClick: () => document.execCommand('copy')
        },
        {
          icon: 'paste',
          label: t('ctx_paste', 'Colar'),
          shortcut: 'Ctrl+V',
          onClick: async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (text) document.execCommand('insertText', false, text);
            } catch {
              document.execCommand('paste');
            }
          }
        },
        '---',
        {
          icon: 'bold',
          label: t('ctx_bold', 'Negrito'),
          shortcut: 'Ctrl+B',
          onClick: () => document.execCommand('bold')
        },
        {
          icon: 'italic',
          label: t('ctx_italic', 'Itálico'),
          shortcut: 'Ctrl+I',
          onClick: () => document.execCommand('italic')
        },
        {
          icon: 'heading',
          label: t('ctx_heading', 'Título'),
          onClick: () => document.execCommand('formatBlock', false, '<h2>')
        },
        {
          icon: 'list',
          label: t('ctx_bullet_list', 'Lista de Pontos'),
          onClick: () => document.execCommand('insertUnorderedList')
        },
        '---',
        {
          icon: 'clock',
          label: t('ctx_insert_datetime', 'Inserir Data e Hora'),
          onClick: () => {
            const nowStr = new Date().toLocaleString(t('misc_locale'), { dateStyle: 'short', timeStyle: 'short' });
            document.execCommand('insertText', false, nowStr + ' — ');
          }
        }
      );

      openContextMenu(e, items);
      return;
    }

    // 4. Focus Mode Specific Context Menu
    const focusView = document.getElementById('view-focus');
    const isFocusActive = focusView && !focusView.classList.contains('hidden') && (e.target.closest('#view-focus') || (typeof currentView !== 'undefined' && currentView === 'focus'));
    if (isFocusActive) {
      const isClockPane = document.getElementById('focus-session-pane')?.classList.contains('hidden');
      const task = typeof window.getFocusCurrentTask === 'function' ? window.getFocusCurrentTask() : null;
      const isTimerRunning = typeof window.isFocusTimerActive === 'function' ? window.isFocusTimerActive() : false;
      const isPaused = typeof window.isFocusPaused === 'function' ? window.isFocusPaused() : false;
      const isZen = typeof window.isFocusZenHidden === 'function' ? window.isFocusZenHidden() : false;

      const items = [];

      // Header
      if (isClockPane) {
        items.push({ header: t('focus_tab_clock', 'Relógio') });
      } else {
        items.push({ header: t('focus_tab_focus', 'Modo Foco') });
      }

      if (!isClockPane && isTimerRunning) {
        if (isPaused) {
          items.push({
            icon: 'play',
            label: t('focus_resume', 'Retomar Sessão'),
            shortcut: 'Espaço',
            onClick: () => { if (typeof togglePause === 'function') togglePause(); }
          });
        } else {
          items.push({
            icon: 'pause',
            label: t('focus_pause', 'Pausar Sessão'),
            shortcut: 'Espaço',
            onClick: () => { if (typeof togglePause === 'function') togglePause(); }
          });
        }

        items.push({
          icon: 'plus',
          label: t('ctx_focus_add_5m', '+5 Minutos'),
          onClick: () => { if (typeof addFocusMinutes === 'function') addFocusMinutes(5); }
        });

        items.push({
          icon: 'stop',
          label: t('focus_stop', 'Parar Sessão'),
          danger: true,
          onClick: () => { if (typeof endFocus === 'function') endFocus(); }
        });

        items.push('---');
      }

      // Ocultar / Mostrar Tudo (Modo Zen)
      items.push({
        icon: isZen ? 'eye' : 'eyeOff',
        label: isZen ? t('focus_show_all', 'Mostrar Tudo') : t('focus_hide_all', 'Ocultar Tudo'),
        shortcut: 'Z',
        onClick: () => { if (typeof toggleFocusZenHideAll === 'function') toggleFocusZenHideAll(); }
      });

      // Alternar entre Foco e Relógio
      if (isClockPane) {
        items.push({
          icon: 'focus',
          label: t('focus_tab_focus', 'Mudar para Foco'),
          onClick: () => { if (typeof switchFocusTab === 'function') switchFocusTab('focus'); }
        });
      } else {
        items.push({
          icon: 'clock',
          label: t('focus_tab_clock', 'Mudar para Relógio'),
          onClick: () => { if (typeof switchFocusTab === 'function') switchFocusTab('clock'); }
        });
      }

      items.push('---');

      // Sair do Modo Foco
      items.push({
        icon: 'arrowLeft',
        label: t('ctx_focus_exit', 'Sair do Modo Foco'),
        shortcut: 'Esc',
        onClick: () => { if (typeof exitFocusView === 'function') exitFocusView(); }
      });

      openContextMenu(e, items);
      return;
    }

    // 5. General App background
    const items = [
      {
        icon: 'today',
        label: t('ctx_go_today', 'Ir para Hoje'),
        onClick: () => {
          if (typeof goToToday === 'function') goToToday();
        }
      },
      {
        icon: 'plus',
        label: t('ctx_new_task', 'Nova Tarefa'),
        onClick: () => {
          setView('main');
          const inp = document.getElementById('task-input');
          if (inp) inp.focus();
        }
      },
      {
        icon: 'focus',
        label: t('ctx_focus_mode', 'Modo Foco'),
        onClick: () => openFocusPicker()
      },
      {
        icon: 'overview',
        label: t('ctx_overview', 'Visão Geral'),
        onClick: () => openOverview()
      },
      {
        icon: 'notes',
        label: t('ctx_month_notes', 'Notas do Mês'),
        onClick: () => openNotes()
      },
      '---',
      {
        icon: 'settings',
        label: t('ctx_settings', 'Definições'),
        onClick: () => openSettings()
      }
    ];
    openContextMenu(e, items);
  });

  window.setContextRating = function(dateStr, ratingVal) {
    if (!S.dayRatings) S.dayRatings = {};
    if (S.dayRatings[dateStr] === ratingVal) {
      delete S.dayRatings[dateStr];
    } else {
      S.dayRatings[dateStr] = ratingVal;
    }
    save();
    closeContextMenu();
    renderAll();
    if (typeof renderOverview === 'function') renderOverview();
  };

  window.addEventListener('click', closeContextMenu);
  window.addEventListener('scroll', closeContextMenu, true);
  window.addEventListener('resize', closeContextMenu);
  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeContextMenu();
  });
})();
