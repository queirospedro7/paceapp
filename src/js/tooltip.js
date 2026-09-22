// Pace — Bespoke Global Tooltip Engine
(function() {
  'use strict';

  let _tooltipEl = null;
  let _currentTarget = null;
  let _showTimer = null;
  let _lastHideTime = 0;
  const WARM_THRESHOLD = 320; // ms to consider "warm" for quick transition

  function getTooltipEl() {
    if (!_tooltipEl) {
      _tooltipEl = document.createElement('div');
      _tooltipEl.className = 'pace-tooltip';
      _tooltipEl.setAttribute('role', 'tooltip');
      _tooltipEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(_tooltipEl);
    }
    return _tooltipEl;
  }

  function getTargetTooltipText(el) {
    if (!el || el === document.body || el === document.documentElement) return null;
    
    // Check title attribute first and capture it
    if (el.hasAttribute('title')) {
      const raw = el.getAttribute('title');
      if (raw && raw.trim()) {
        const text = raw.trim();
        el.setAttribute('data-tooltip', text);
        el.removeAttribute('title');
        el._paceTitle = text;
        return text;
      }
    }
    
    // Check data-tooltip
    if (el.hasAttribute('data-tooltip')) {
      const raw = el.getAttribute('data-tooltip');
      if (raw && raw.trim()) return raw.trim();
    }
    
    return null;
  }

  function positionTooltip(target, el) {
    const zoomScale = parseFloat(document.documentElement.style.zoom) || 1.0;
    const rect = target.getBoundingClientRect();

    const tLeft = rect.left / zoomScale;
    const tTop = rect.top / zoomScale;
    const tWidth = rect.width / zoomScale;
    const tHeight = rect.height / zoomScale;

    const winWidth = window.innerWidth / zoomScale;
    const winHeight = window.innerHeight / zoomScale;

    const ttWidth = el.offsetWidth;
    const ttHeight = el.offsetHeight;
    const margin = 8;
    const gap = 6;

    // Try placing ABOVE target first
    let top = tTop - ttHeight - gap;
    if (top < margin) {
      // If not enough room above, place BELOW target
      top = tTop + tHeight + gap;
    }

    // Ensure it doesn't push past bottom edge
    if (top + ttHeight > winHeight - margin) {
      top = Math.max(margin, winHeight - ttHeight - margin);
    }

    // Horizontal centering
    let left = tLeft + (tWidth - ttWidth) / 2;
    if (left < margin) {
      left = margin;
    } else if (left + ttWidth > winWidth - margin) {
      left = winWidth - ttWidth - margin;
    }

    el.style.left = Math.round(left) + 'px';
    el.style.top = Math.round(top) + 'px';
  }

  function showTooltip(target, text, immediate) {
    clearTimeout(_showTimer);
    _currentTarget = target;

    const delay = immediate ? 35 : 240;
    _showTimer = setTimeout(() => {
      if (!_currentTarget || _currentTarget !== target) return;
      if (!document.body.contains(target)) {
        hideTooltip(true);
        return;
      }

      const tt = getTooltipEl();
      tt.textContent = text;
      tt.classList.remove('visible');

      // Calculate position
      positionTooltip(target, tt);

      requestAnimationFrame(() => {
        if (_currentTarget === target) {
          tt.classList.add('visible');
        }
      });
    }, delay);
  }

  function hideTooltip(instant) {
    clearTimeout(_showTimer);
    _showTimer = null;
    
    if (_currentTarget) {
      // Restore title attribute if it was previously removed
      if (_currentTarget.hasAttribute('data-tooltip') && !_currentTarget.hasAttribute('title')) {
        _currentTarget.setAttribute('title', _currentTarget.getAttribute('data-tooltip'));
      }
      _currentTarget = null;
    }

    if (_tooltipEl) {
      _tooltipEl.classList.remove('visible');
      if (instant) {
        _tooltipEl.style.left = '-9999px';
        _tooltipEl.style.top = '-9999px';
      }
    }
    _lastHideTime = Date.now();
  }

  function onPointerOver(e) {
    // Ignore touch interactions (tooltips are for mouse/pen hovering)
    if (e.pointerType === 'touch') return;

    const target = e.target.closest('[title], [data-tooltip]');
    if (!target) return;

    const text = getTargetTooltipText(target);
    if (!text) return;

    const isWarm = (Date.now() - _lastHideTime) < WARM_THRESHOLD;
    showTooltip(target, text, isWarm);
  }

  function onPointerOut(e) {
    if (!_currentTarget) return;
    // Don't hide if moving between children of the current target
    if (e.relatedTarget && _currentTarget.contains(e.relatedTarget)) return;

    hideTooltip();
  }

  // Global listeners
  document.addEventListener('pointerover', onPointerOver, true);
  document.addEventListener('pointerout', onPointerOut, true);
  document.addEventListener('pointerdown', () => hideTooltip(true), true);
  window.addEventListener('scroll', () => hideTooltip(true), true);
  window.addEventListener('blur', () => hideTooltip(true));
  window.addEventListener('resize', () => hideTooltip(true));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideTooltip(true);
  }, true);

  window.paceHideTooltip = hideTooltip;
})();
