/* store.js ― 端末の中だけに保存する（写真・シール・途中経過・設定）。サーバーには何も送らない。
   写真やシールは大きいので IndexedDB、小さな設定は localStorage。どちらも使えない環境では、その場かぎりのメモリに保存する */
(function () {
  'use strict';
  const mem = { photos: [], stickers: [], saves: [] };
  let db = null;
  const ready = new Promise((res) => {
    try {
      const rq = indexedDB.open('jigsaw-app', 1);
      rq.onupgradeneeded = () => { ['photos', 'stickers', 'saves'].forEach((n) => rq.result.createObjectStore(n, { keyPath: 'id' })); };
      rq.onsuccess = () => { db = rq.result; res(true); };
      rq.onerror = rq.onblocked = () => res(false);
    } catch (e) { res(false); }
  });

  const Store = (window.Store = {});
  Store.persistent = () => ready.then(() => !!db);
  Store.put = async (store, obj) => {
    await ready;
    if (!db) { const a = mem[store], i = a.findIndex((x) => x.id === obj.id); if (i < 0) a.push(obj); else a[i] = obj; return; }
    return new Promise((res, rej) => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).put(obj); t.oncomplete = () => res(); t.onerror = t.onabort = () => rej(t.error); });
  };
  Store.all = async (store) => {
    await ready;
    if (!db) return mem[store].slice();
    return new Promise((res) => { const r = db.transaction(store).objectStore(store).getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); });
  };
  Store.get = async (store, id) => {
    await ready;
    if (!db) return mem[store].find((x) => x.id === id) || null;
    return new Promise((res) => { const r = db.transaction(store).objectStore(store).get(id); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); });
  };
  Store.del = async (store, id) => {
    await ready;
    if (!db) { mem[store] = mem[store].filter((x) => x.id !== id); return; }
    return new Promise((res) => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).delete(id); t.oncomplete = () => res(); t.onerror = t.onabort = () => res(); });
  };
  Store.clear = async (store) => {
    await ready;
    if (!db) { mem[store] = []; return; }
    return new Promise((res) => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).clear(); t.oncomplete = () => res(); t.onerror = t.onabort = () => res(); });
  };

  /* 設定（小さいもの） */
  const KEY = 'jigsaw-app-settings';
  let cache = { sound: 1, src: { k: 'art', id: 'shoubousha' }, target: 100, level: 'normal', best: {} };
  try { Object.assign(cache, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  Store.settings = cache;
  Store.saveSettings = () => { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { } };
})();
