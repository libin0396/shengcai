(function (root) {
  'use strict';
  // The cache contains generated posters only. Game history remains separate.
  var DB_NAME = 'ainpe:poster-cache:v1', STORE = 'posters';
  var MAX_ITEMS = 20, MAX_TOTAL = 12 * 1024 * 1024, MAX_ITEM = 2 * 1024 * 1024;
  var ID = /^[a-zA-Z0-9_-]{1,80}$/;

  function openDb() {
    return new Promise(function (resolve) {
      if (!root.indexedDB) return resolve(null);
      var req;
      try { req = root.indexedDB.open(DB_NAME, 1); } catch (_) { return resolve(null); }
      var settled = false;
      function finish(db) { if (!settled) { settled = true; resolve(db); } else if (db) db.close(); }
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, {keyPath: 'id'});
      };
      req.onsuccess = function () { finish(req.result); };
      req.onerror = req.onblocked = function () { finish(null); };
    });
  }

  function toJpeg(value) {
    if (value instanceof Blob) return value.type === 'image/jpeg' && value.size > 0 && value.size <= MAX_ITEM ? value : null;
    if (typeof value !== 'string' || !/^data:image\/jpeg;base64,/i.test(value)) return null;
    var encoded = value.slice(value.indexOf(',') + 1);
    if (!encoded || encoded.length > Math.ceil(MAX_ITEM / 3) * 4 + 4) return null;
    try {
      var raw = root.atob(encoded), bytes = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      return bytes.length && bytes.length <= MAX_ITEM ? new Blob([bytes], {type: 'image/jpeg'}) : null;
    } catch (_) { return null; }
  }

  async function save(id, value) {
    if (typeof id !== 'string' || !ID.test(id)) return false;
    var blob = toJpeg(value); if (!blob) return false;
    var db = await openDb(); if (!db) return false;
    return new Promise(function (resolve) {
      var tx;
      try {
        tx = db.transaction(STORE, 'readwrite');
        var store = tx.objectStore(STORE), rows = [];
        var cursor = store.openCursor();
        cursor.onsuccess = function () {
          var current = cursor.result;
          if (current) {
            var item = current.value;
            if (item.id !== id) rows.push({id: item.id, size: Number(item.size) || 0, at: Number(item.at) || 0});
            current.continue(); return;
          }
          rows.sort(function (a, b) { return a.at - b.at; });
          var total = blob.size + rows.reduce(function (sum, item) { return sum + item.size; }, 0);
          while (rows.length >= MAX_ITEMS || total > MAX_TOTAL) {
            var oldest = rows.shift(); if (!oldest) break;
            total -= oldest.size; store.delete(oldest.id);
          }
          store.put({id: id, blob: blob, size: blob.size, at: Date.now()});
        };
        tx.oncomplete = function () { db.close(); resolve(true); };
        tx.onerror = tx.onabort = function () { db.close(); resolve(false); };
      } catch (_) { db.close(); resolve(false); }
    });
  }

  async function get(id) {
    if (typeof id !== 'string' || !ID.test(id)) return null;
    var db = await openDb(); if (!db) return null;
    return new Promise(function (resolve) {
      try {
        var tx = db.transaction(STORE, 'readonly'), req = tx.objectStore(STORE).get(id), value = null;
        req.onsuccess = function () { var item = req.result; if (item && item.blob instanceof Blob && item.blob.type === 'image/jpeg') value = item.blob; };
        tx.oncomplete = function () { db.close(); resolve(value); };
        tx.onerror = tx.onabort = function () { db.close(); resolve(null); };
      } catch (_) { db.close(); resolve(null); }
    });
  }

  root.AINPEPosterHistory = Object.freeze({save: save, get: get});
})(typeof window !== 'undefined' ? window : globalThis);
