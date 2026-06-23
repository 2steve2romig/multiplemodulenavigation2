// iq-subscriptions.js
//
// Single source of truth for which IQ modules are subscribed (active).
// Backed by localStorage so the launcher, learn pages, the IQ Suite view, and
// the Module Subscription Management modal all agree and stay in sync.
//
// Plain JS (no JSX). Loaded after iq-catalog.js and after React, so both
// window.IQ_CATALOG and React are available.

(function () {
  var KEY = "iq-subs-v1";

  function defaults() {
    var m = {};
    (window.IQ_CATALOG || []).forEach(function (p) { m[p.id] = !!p.defaultOn; });
    return m;
  }

  function load() {
    var base = defaults();
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        Object.keys(base).forEach(function (id) {
          if (typeof saved[id] === "boolean") base[id] = saved[id];
        });
      }
    } catch (e) {}
    return base;
  }

  var state = load();
  var listeners = new Set();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function emit() {
    listeners.forEach(function (fn) { try { fn(state); } catch (e) {} });
  }

  var Subs = {
    get: function () { return Object.assign({}, state); },
    isOn: function (id) { return !!state[id]; },
    set: function (id, val) {
      state = Object.assign({}, state, {});
      state[id] = !!val;
      save(); emit();
    },
    setMany: function (obj) {
      state = Object.assign({}, state, obj);
      save(); emit();
    },
    activeCount: function () {
      return Object.keys(state).filter(function (id) { return state[id]; }).length;
    },
    subscribe: function (fn) {
      listeners.add(fn);
      return function () { listeners.delete(fn); };
    }
  };

  window.IQSubs = Subs;

  // React hook — re-renders the caller whenever subscription state changes.
  window.useIQSubs = function () {
    var ref = React.useState(Subs.get());
    var s = ref[0], setS = ref[1];
    React.useEffect(function () {
      return Subs.subscribe(function (next) { setS(Object.assign({}, next)); });
    }, []);
    return s;
  };
})();
