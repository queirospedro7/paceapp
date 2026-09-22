// Pace — Internationalization
'use strict';

let _locale = 'en';
let _strings = {};

function getLocale() { return _locale; }

function t(key, fallbackOrVars, vars) {
  if (!key) return '';
  let str, replacements;

  if (fallbackOrVars !== null && typeof fallbackOrVars === 'object' && !Array.isArray(fallbackOrVars)) {
    // t('key', { n: 1 })
    str = (_strings && _strings[key]) || key;
    replacements = fallbackOrVars;
  } else {
    // t('key', 'fallback') ou t('key', 'fallback', { n: 1 })
    str = (_strings && _strings[key]) || (fallbackOrVars !== undefined ? String(fallbackOrVars) : key);
    replacements = vars || null;
  }

  if (replacements) {
    str = str.replace(/\{(\w+)\}/g, (_, k) => (replacements[k] !== undefined ? replacements[k] : `{${k}}`));
  }

  return str;
}

function loadLocale(lang, strings) {
  _strings = strings || {};
  _locale = lang || 'en';
}

function _refreshStaticTexts() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = t(key);
    if (translated && translated !== key) {
      if (el.hasAttribute('data-i18n-attr')) {
        const attr = el.getAttribute('data-i18n-attr');
        el.setAttribute(attr, translated);
      } else if (el.tagName === 'OPTION') {
        el.textContent = translated;
      } else if (el.tagName === 'OPTGROUP') {
        el.setAttribute('label', translated);
      } else if (el.hasAttribute('placeholder')) {
        el.setAttribute('placeholder', translated);
      } else {
        const txtNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
        if (txtNode) {
          txtNode.textContent = translated;
        } else {
          el.textContent = translated;
        }
      }
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const translated = t(key);
    if (translated && translated !== key) {
      el.title = translated;
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translated = t(key);
    if (translated && translated !== key) {
      if (el.hasAttribute('placeholder')) el.placeholder = translated;
      if (el.hasAttribute('data-placeholder')) el.setAttribute('data-placeholder', translated);
    }
  });

  if (typeof rebuildAllCustomSelects === 'function') {
    rebuildAllCustomSelects();
  }
}

window.t = t;
window.getLocale = getLocale;
window.loadLocale = loadLocale;
window._refreshStaticTexts = _refreshStaticTexts;
