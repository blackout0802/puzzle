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
  const toMem = (store, obj) => { const a = mem[store], i = a.findIndex((x) => x.id === obj.id); if (i < 0) a.push(obj); else a[i] = obj; };
  Store.volatile = false;               // true なら、いま保存できず「このページを開いている間だけ」の保存になっている
  Store.put = async (store, obj) => {
    await ready;
    if (!db) { toMem(store, obj); Store.volatile = true; return 'mem'; }
    try {
      await new Promise((res, rej) => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).put(obj); t.oncomplete = () => res(); t.onerror = t.onabort = () => rej(t.error); });
      return 'db';
    } catch (e) { toMem(store, obj); Store.volatile = true; return 'mem'; }       // 容量不足・プライベートモードなど
  };
  Store.all = async (store) => {
    await ready;
    const m = mem[store].slice(); if (!db) return m;
    const d = await new Promise((res) => { const r = db.transaction(store).objectStore(store).getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); });
    const ids = new Set(d.map((x) => x.id)); return d.concat(m.filter((x) => !ids.has(x.id)));
  };
  Store.get = async (store, id) => {
    await ready;
    const m = mem[store].find((x) => x.id === id); if (m || !db) return m || null;
    return new Promise((res) => { const r = db.transaction(store).objectStore(store).get(id); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); });
  };
  Store.del = async (store, id) => {
    await ready; mem[store] = mem[store].filter((x) => x.id !== id);
    if (!db) return;
    return new Promise((res) => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).delete(id); t.oncomplete = () => res(); t.onerror = t.onabort = () => res(); });
  };
  Store.clear = async (store) => {
    await ready; mem[store] = [];
    if (!db) return;
    return new Promise((res) => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).clear(); t.oncomplete = () => res(); t.onerror = t.onabort = () => res(); });
  };

  /* 画像の保存形式：Blob のままだと、iPhone では あとで中身が読めなくなることがある。
     そのため「バイト列(ArrayBuffer)＋種類」で保存し、使うときに Blob にもどす。 */
  Store.recBlob = (rec) => (rec.buf ? new Blob([rec.buf], { type: rec.type || 'image/jpeg' }) : rec.blob);
  Store.toBuf = (blob) => (blob.arrayBuffer ? blob.arrayBuffer() : new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsArrayBuffer(blob); }));
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }   // iOS に勝手に消されにくくする（お願いするだけ）

  /* 設定（小さいもの） */
  const KEY = 'jigsaw-app-settings';
  let cache = { sound: 1, src: { k: 'art', id: 'shoubousha' }, target: 100, level: 'normal', best: {} };
  try { Object.assign(cache, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  Store.settings = cache;
  Store.saveSettings = () => { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { } };
})();
