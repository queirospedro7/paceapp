// Pace — Tauri Bridge
// Carregado como ÚLTIMO script — todos os listeners (state.js, app.js) já estão registados.

(function () {
  'use strict';

  function getInvokeFn() {
    if (window.__TAURI__) {
      if (window.__TAURI__.core && typeof window.__TAURI__.core.invoke === 'function') {
        return window.__TAURI__.core.invoke;
      }
      if (typeof window.__TAURI__.invoke === 'function') {
        return window.__TAURI__.invoke;
      }
    }
    return null;
  }

  // Sobrescreve os stubs definidos no <head>
  window.store = {
    initialData: null,
    setAll: function (data) {
      const invoke = getInvokeFn();
      if (invoke) {
        return invoke('store_set_all', { data: data }).catch(function (e) {
          console.warn('[Pace] store_set_all error:', e);
          return false;
        });
      }
      return Promise.resolve(false);
    },
    clear: function () {
      const invoke = getInvokeFn();
      if (invoke) {
        return invoke('store_clear').catch(function (e) {
          console.warn('[Pace] store_clear error:', e);
          return false;
        });
      }
      return Promise.resolve(false);
    },
    getPath: function () {
      const invoke = getInvokeFn();
      if (invoke) {
        return invoke('store_get_path').catch(function (e) {
          console.warn('[Pace] store_get_path error:', e);
          return '';
        });
      }
      return Promise.resolve('');
    },
  };

  window.appNotify = {
    send: function (title, body) {
      const invoke = getInvokeFn();
      if (invoke) {
        return invoke('send_notification', { title: title, body: body }).catch(function (e) {
          console.warn('[Pace] send_notification error:', e);
          return false;
        });
      }
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(title, { body: body });
        } catch (_) {}
      }
      return Promise.resolve(false);
    },
  };

  window.autostartBridge = {
    isEnabled: function () {
      const invoke = getInvokeFn();
      return invoke ? invoke('autostart_is_enabled').catch(() => false) : Promise.resolve(false);
    },
    set: function (enable) {
      const invoke = getInvokeFn();
      if (!invoke) return Promise.resolve(false);
      return invoke('autostart_set', { enable: !!enable }).catch(() => false);
    },
  };

  window.appWindow = {
    setSize: function (width, height, center) {
      const invoke = getInvokeFn();
      if (invoke) {
        return invoke('set_window_size', { width: width, height: height, center: center !== false }).catch(function (e) {
          console.warn('[Pace] set_window_size error:', e);
          return false;
        });
      }
      return Promise.resolve(false);
    },
  };



  let _dispatched = false;
  function _dispatch() {
    if (_dispatched) return;
    _dispatched = true;
    document.dispatchEvent(new Event('tauri-bridge-ready'));
  }

  // Timer de segurança: garante que o evento dispara no máximo após 1.5s mesmo se o backend falhar
  setTimeout(_dispatch, 1500);

  const invoke = getInvokeFn();
  if (invoke) {
    try {
      invoke('store_get_all')
        .then(function (data) {
          window.store.initialData = data || {};
          _dispatch();
        })
        .catch(function (err) {
          console.warn('[Pace] store_get_all failed:', err);
          window.store.initialData = {};
          _dispatch();
        });
    } catch (err) {
      console.warn('[Pace] Synchronous invoke error:', err);
      window.store.initialData = {};
      _dispatch();
    }
  } else {
    // Fallback: browser sem Tauri
    window.store.initialData = {};
    _dispatch();
  }
})();

