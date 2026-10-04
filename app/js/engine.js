/* engine.js ― ジグソー本体
   操作は「タップ＆タップ」: ピース置き場でピースをタップ → 盤面の置きたい場所をタップ。
   100枚をこえても遊べるよう、盤面は つまんで拡大／ゆびで移動できる。 */
(function () {
  'use strict';
  const CELL = 60;            // 盤面の1マス（ワールド座標）
  const TS = 0.88;            // ピース置き場での表示倍率
  const LEVELS = {
    easy:   { name: 'やさしい',         desc: 'うすい見本と、ヒントのひかり', ghost: 0.38, grid: true,  assist: true,  rot: false },
    normal: { name: 'ふつう',           desc: 'うすい見本あり',               ghost: 0.14, grid: true,  assist: false, rot: false },
    hard:   { name: 'むずかしい',       desc: '盤面に見本なし（右上の見本だけ）', ghost: 0,    grid: false, assist: false, rot: false },
    expert: { name: 'ちょうむずかしい', desc: 'さらに、ピースがまわっている', ghost: 0,  grid: false, assist: false, rot: true },
  };
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

  /* ------------------------------------------------------------ 絵の読み込み */
  const Sources = {
    cache: {},
    key: (d) => (d.k === 'art' ? 'a:' + d.id : d.k === 'collage' ? 'c' : 'p:' + d.id),
    async load(desc) {
      const key = Sources.key(desc);
      if (Sources.cache[key]) return Sources.cache[key];
      let info;
      if (desc.k === 'art') {
        const a = PZ.art.find((x) => x.id === desc.id) || PZ.art[0];
        info = { img: await PZ.artImage(a), aspect: 1, name: a.name, say: a.say };
      } else if (desc.k === 'collage') {
        const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 800;
        const x = cv.getContext('2d');
        for (let i = 0; i < 8; i++) x.drawImage(await PZ.artImage(PZ.art[i]), (i % 4) * 400, Math.floor(i / 4) * 400, 400, 400);
        info = { img: cv, aspect: 2, name: 'どうぶつ ぜんいん', say: 'みんな いるね' };
      } else {
        const rec = await Store.get('photos', desc.id);
        if (!rec) throw new Error('photo-missing');
        let img;
        try { img = await createImageBitmap(rec.blob); }
        catch (e) { const u = URL.createObjectURL(rec.blob); img = await PZ.loadImage(u); }
        info = { img, aspect: clamp(rec.w / rec.h, 0.5, 2), name: 'わたしの しゃしん', say: 'できたね' };
      }
      if (desc.k !== 'photo') Sources.cache[key] = info;
      return info;
    },
    /* 画像を W×H にぴったり「cover」で切り抜く */
    cover(img, W, H) {
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      const c = document.createElement('canvas'); c.width = Math.round(W); c.height = Math.round(H);
      const s = Math.max(c.width / iw, c.height / ih), dw = iw * s, dh = ih * s;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      x.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
      return c;
    },
  };
  /* 目標のピース数と絵の縦横比から、いちばん近い 行×列 を決める */
  function gridFor(target, aspect) {
    let best = null;
    for (let r = 2; r <= 40; r++) {
      const c = Math.max(2, Math.round(target / r)), n = r * c;
      const score = Math.abs(n - target) / target + Math.abs(Math.log((c / r) / aspect)) * 0.9;
      if (!best || score < best.score) best = { rows: r, cols: c, n, score };
    }
    return best;
  }

  /* ---------------------------------------------------------------- 状態 */
  let G = null, ui = null;
  const cam = { x: 0, y: 0, s: 1 };
  const E = (window.Engine = { LEVELS, Sources, gridFor, CELL, on: {} });

  function refs() {
    if (ui) return ui;
    ui = {
      game: $('#game'), view: $('#view'), world: $('#world'), board: $('#board'), ring: $('#ring'),
      tray: $('#tray'), filters: $('#filters'), timer: $('#timer'), left: $('#left'),
      hand: $('#hand'), ref: $('#ref'), refImg: $('#ref img'), peek: $('#peek'), peekImg: $('#peek img'), loading: $('#loading'), toast: $('#toast'),
    };
    return ui;
  }
  const landscape = () => innerWidth > innerHeight;

  /* ------------------------------------------------------------- カメラ */
  function applyCam(anim) {
    ui.world.style.transition = anim ? 'transform .45s ease' : 'none';
    ui.world.style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.s})`;
    ui.world.style.setProperty('--inv', 1 / cam.s);               // 拡大しても枠線の太さが変わらないように
  }
  function viewSize() { const r = ui.view.getBoundingClientRect(); return { w: r.width, h: r.height, l: r.left, t: r.top }; }
  function fitCam(anim) {
    const v = viewSize(), rr = ui.ref.getBoundingClientRect();
    const hs = landscape() ? 92 : 112;                          // 左上=いま持っているピース / 右上=見本。盤面はそれらにかぶらない場所に置く
    let top = 0, left = 0, right = 0;
    if (landscape()) { left = hs + 16; right = Math.max(0, v.l + v.w - rr.left + 6); }
    else top = Math.max(hs + 16, rr.bottom - v.t + 6);
    const aw = v.w - left - right, ah = v.h - top;
    const s = Math.min(aw * 0.96 / G.W, ah * 0.96 / G.H);
    G.fit = s; G.sMin = s * 0.8; G.sMax = Math.max(160 / CELL, s * 3);
    cam.s = s; cam.x = left + (aw - G.W * s) / 2; cam.y = top + (ah - G.H * s) / 2; applyCam(anim);
  }
  function clampCam() { const v = viewSize(), m = 80; cam.x = clamp(cam.x, m - G.W * cam.s, v.w - m); cam.y = clamp(cam.y, m - G.H * cam.s, v.h - m); }
  function zoomAt(px, py, s2, anim) {
    s2 = clamp(s2, G.sMin, G.sMax);
    const wx = (px - cam.x) / cam.s, wy = (py - cam.y) / cam.s;
    cam.s = s2; cam.x = px - wx * s2; cam.y = py - wy * s2; clampCam(); applyCam(anim);
  }
  function focusCell(r, c, anim) {          // 指定のマスが画面の真ん中に来るように
    const v = viewSize(), s = clamp(Math.max(cam.s, 110 / CELL), G.sMin, G.sMax);
    cam.s = s; cam.x = v.w / 2 - (c + 0.5) * CELL * s; cam.y = v.h / 2 - (r + 0.5) * CELL * s; clampCam(); applyCam(anim);
  }

  /* 盤面の指操作：1本=移動 / 2本=拡大縮小 / ちょん=置く */
  function bindView() {
    const v = ui.view, ptrs = new Map();
    let pinch = null, multi = false;
    const local = (e) => { const r = v.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    v.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#hand,#peek,#ref,.zoom')) return;
      try { v.setPointerCapture(e.pointerId); } catch (_) { }
      const p = local(e); ptrs.set(e.pointerId, { ...p, sx: p.x, sy: p.y, moved: false });
      if (ptrs.size === 2) {
        multi = true; const [a, b] = [...ptrs.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, s: cam.s, wx: ((a.x + b.x) / 2 - cam.x) / cam.s, wy: ((a.y + b.y) / 2 - cam.y) / cam.s };
      }
    });
    v.addEventListener('pointermove', (e) => {
      const q = ptrs.get(e.pointerId); if (!q || !G) return;
      const p = local(e), dx = p.x - q.x, dy = p.y - q.y;
      q.x = p.x; q.y = p.y;
      if (Math.hypot(p.x - q.sx, p.y - q.sy) > 9) q.moved = true;
      if (ptrs.size === 1 && q.moved) { cam.x += dx; cam.y += dy; clampCam(); applyCam(); }
      else if (ptrs.size === 2 && pinch) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        const s2 = clamp(pinch.s * d / Math.max(1, pinch.d), G.sMin, G.sMax);
        cam.s = s2; cam.x = cx - pinch.wx * s2; cam.y = cy - pinch.wy * s2; clampCam(); applyCam();
      }
    });
    const up = (e) => {
      const q = ptrs.get(e.pointerId); if (!q) return;
      ptrs.delete(e.pointerId);
      if (e.type === 'pointerup' && !q.moved && !multi && G) onTapBoard(q.x, q.y);
      if (ptrs.size < 2) pinch = null;
      if (ptrs.size === 0) multi = false;
    };
    v.addEventListener('pointerup', up); v.addEventListener('pointercancel', up);
    v.addEventListener('wheel', (e) => {
      if (!G) return; e.preventDefault(); const p = local(e);
      zoomAt(p.x, p.y, cam.s * (e.deltaY < 0 ? 1.18 : 1 / 1.18));
    }, { passive: false });
  }

  /* ------------------------------------------------------------ 組み立て */
  async function start(o) {
    refs(); destroy();
    const L = LEVELS[o.level] || LEVELS.normal;
    ui.loading.classList.add('on'); ui.loading.querySelector('span').textContent = 'じゅんび中…';
    let info;
    try { info = await Sources.load(o.desc); }
    catch (e) { ui.loading.classList.remove('on'); throw e; }
    const grid = o.save ? { rows: o.save.rows, cols: o.save.cols } : gridFor(o.target, info.aspect);
    const rows = grid.rows, cols = grid.cols, n = rows * cols, W = cols * CELL, H = rows * CELL;
    const RES = Math.max(1, Math.min(2, 4096 / Math.max(W, H)));
    const pad = Math.ceil(CELL * 0.3), S = CELL + pad * 2;
    const seed = o.save ? o.save.seed : (Math.random() * 1e9) | 0;
    const rnd = PZ.rng(seed), edges = PZ.edges(rows, cols, seed);
    const order = shuffleSeed([...Array(n).keys()], rnd);
    const rots = Array.from({ length: n }, () => (L.rot ? 1 + Math.floor(rnd() * 3) : 0));
    const srcC = Sources.cover(info.img, W * RES, H * RES);
    G = {
      desc: o.desc, key: Sources.key(o.desc), info, level: o.level, L, rows, cols, n, W, H, RES, pad, S, seed,
      srcC, pieces: [], placed: 0, sel: null, misses: o.save ? o.save.misses || 0 : 0, elapsed: o.save ? o.save.elapsed || 0 : 0,
      started: !!(o.save && o.save.placed && o.save.placed.length), over: false, filter: 'all', fit: 1, sMin: 0.2, sMax: 3, order, timerId: 0, lastTick: 0, destroyed: false,
    };
    // 盤面
    const b = ui.board; b.width = Math.ceil(W * RES); b.height = Math.ceil(H * RES); b.style.width = W + 'px'; b.style.height = H + 'px';
    ui.world.style.width = W + 'px'; ui.world.style.height = H + 'px';
    drawBoardBase();
    // 見本（みほんボタン用）
    const refUrl = PZ.coverCanvas(srcC, Math.min(900, srcC.width), Math.min(900, srcC.width) * H / W).toDataURL('image/jpeg', 0.85);
    ui.peekImg.src = refUrl; ui.refImg.src = refUrl;                    // 右上の見本（小）と、タップで出る大きな見本
    ui.ref.style.aspectRatio = `${W} / ${H}`;
    // ピース
    const placedSet = new Set(o.save ? o.save.placed : []);
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const cv = document.createElement('canvas'); cv.width = cv.height = Math.ceil(S * RES);
      cv.style.width = cv.style.height = S * TS + 'px';
      const x = cv.getContext('2d'); x.scale(RES, RES); x.translate(pad, pad);
      const path = PZ.piecePath(r, c, rows, cols, CELL, CELL, edges, false);
      x.save(); x.clip(path); x.drawImage(srcC, -c * CELL, -r * CELL, W, H); x.restore();
      x.lineJoin = 'round'; x.strokeStyle = 'rgba(0,0,0,.30)'; x.lineWidth = 2.2; x.stroke(path);
      x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.1; x.stroke(path);
      G.pieces.push({ i, r, c, cv, rot: rots[i], deg: rots[i] * 90, placed: false, tp: null, edge: r === 0 || c === 0 || r === rows - 1 || c === cols - 1 });
      if (i % 25 === 24) { ui.loading.querySelector('span').textContent = `ピースを つくっています ${Math.round(i / n * 100)}%`; await nextFrame(); if (G.destroyed) return; }
    }
    // 置き場に並べる／保存分は盤面へ
    G.pieces.forEach((p) => { if (placedSet.has(p.i)) { p.placed = true; G.placed++; drawPiece(p); } });
    order.forEach((i) => { const p = G.pieces[i]; if (!p.placed) buildTp(p); });
    updateLabels(); setFilter('all'); showTimer();
    ui.game.classList.add('on'); ui.loading.classList.remove('on');
    await nextFrame(); fitCam(false);
    G.lastTick = performance.now(); G.timerId = setInterval(tick, 500);
    if (G.placed === G.n) win(true);
  }
  function shuffleSeed(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function drawBoardBase() {
    const x = ui.board.getContext('2d'), { W, H, RES, L, rows, cols } = G;
    x.setTransform(RES, 0, 0, RES, 0, 0); x.clearRect(0, 0, W, H);
    x.fillStyle = '#fdf1d8'; x.fillRect(0, 0, W, H);
    if (L.ghost) { x.globalAlpha = L.ghost; x.drawImage(G.srcC, 0, 0, W, H); x.globalAlpha = 1; }
    if (L.grid) {
      x.strokeStyle = 'rgba(122,75,22,.28)'; x.lineWidth = 1; x.setLineDash([4, 4]); x.beginPath();
      for (let r = 1; r < rows; r++) { x.moveTo(0, r * CELL); x.lineTo(W, r * CELL); }
      for (let c = 1; c < cols; c++) { x.moveTo(c * CELL, 0); x.lineTo(c * CELL, H); }
      x.stroke(); x.setLineDash([]);
    }
    x.strokeStyle = 'rgba(122,75,22,.55)'; x.lineWidth = 3; x.strokeRect(0, 0, W, H);
  }
  function drawPiece(p) {
    const x = ui.board.getContext('2d');
    x.setTransform(G.RES, 0, 0, G.RES, 0, 0);
    x.drawImage(p.cv, p.c * CELL - G.pad, p.r * CELL - G.pad, G.S, G.S);
  }
  function buildTp(p) {
    const tp = document.createElement('div'); tp.className = 'tp'; tp.dataset.i = p.i;
    tp.style.width = tp.style.height = G.S * TS + 8 + 'px';
    p.cv.style.transform = `rotate(${p.deg}deg)`; tp.appendChild(p.cv); p.tp = tp; ui.tray.appendChild(tp);
  }

  /* ----------------------------------------------------- ピースの選択と配置 */
  function toast(msg) {
    ui.toast.textContent = msg; ui.toast.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => ui.toast.classList.remove('on'), 1600);
  }
  function selectPiece(p) {
    if (!G || G.over || p.placed) return;
    if (G.sel === p) { if (G.L.rot) { rotate(p); return; } deselect(); return; }
    deselect(); G.sel = p; p.tp.classList.add('sel'); PZ.snd.pick();
    showHand(p);
    if (!G.started) G.started = true;
    if (G.L.assist) pulse(p.r, p.c, 0);
  }
  function deselect() {
    if (!G || !G.sel) return;
    G.sel.tp && G.sel.tp.classList.remove('sel'); G.sel = null; ui.hand.classList.remove('on'); ui.ring.classList.remove('on');
  }
  function showHand(p) {
    const h = ui.hand; h.innerHTML = ''; const c = document.createElement('canvas');
    c.width = p.cv.width; c.height = p.cv.height; c.getContext('2d').drawImage(p.cv, 0, 0);
    c.style.transform = `rotate(${p.deg}deg)`; h.appendChild(c);
    h.classList.toggle('rot', G.L.rot); h.classList.add('on');
  }
  function rotate(p) {
    p.rot = (p.rot + 1) % 4; p.deg += 90; PZ.snd.pick();
    p.cv.style.transform = `rotate(${p.deg}deg)`;
    const hc = ui.hand.querySelector('canvas'); if (hc) hc.style.transform = `rotate(${p.deg}deg)`;
  }
  function pulse(r, c, ms) {
    const ring = ui.ring; ring.style.left = c * CELL + 'px'; ring.style.top = r * CELL + 'px'; ring.style.width = ring.style.height = CELL + 'px';
    ring.classList.remove('on'); void ring.offsetWidth; ring.classList.add('on');
    clearTimeout(pulse.t); if (ms) pulse.t = setTimeout(() => ring.classList.remove('on'), ms);
  }
  function wobbleHand() { ui.hand.classList.remove('wob'); void ui.hand.offsetWidth; ui.hand.classList.add('wob'); }

  function onTapBoard(x, y) {
    if (!G || G.over || !G.sel) return;
    const wx = (x - cam.x) / cam.s, wy = (y - cam.y) / cam.s;
    if (wx < 0 || wy < 0 || wx >= G.W || wy >= G.H) return;
    const c = Math.floor(wx / CELL), r = Math.floor(wy / CELL), t = G.pieces[r * G.cols + c], p = G.sel;
    if (t.placed) return;                                  // もうはまっているマスは、何も起きない
    if (t === p) {
      if (G.L.rot && p.rot % 4 !== 0) { PZ.snd.soft(); wobbleHand(); toast('むきを そろえてね'); return; }
      place(p);
    } else { G.misses++; PZ.snd.soft(); wobbleHand(); }
  }
  function place(p) {
    drawPiece(p); p.placed = true; G.placed++;
    p.tp.remove(); p.tp = null; G.sel = null; ui.hand.classList.remove('on'); ui.ring.classList.remove('on');
    // 置いた瞬間の「ぽん」
    const pop = document.createElement('canvas'); pop.width = p.cv.width; pop.height = p.cv.height; pop.getContext('2d').drawImage(p.cv, 0, 0);
    pop.className = 'pop'; Object.assign(pop.style, { left: p.c * CELL - G.pad + 'px', top: p.r * CELL - G.pad + 'px', width: G.S + 'px', height: G.S + 'px' });
    ui.world.appendChild(pop); setTimeout(() => pop.remove(), 520);
    PZ.snd.ok(); updateLabels(); persist();
    if (G.placed === G.n) win(false);
  }

  /* ---------------------------------------------------- 絞りこみ・ヒント・表示 */
  function setFilter(f) {
    G.filter = f; ui.filters.querySelectorAll('button[data-f]').forEach((b) => b.classList.toggle('on', b.dataset.f === f));
    G.pieces.forEach((p) => { if (p.tp) p.tp.classList.toggle('hide', !(f === 'all' || (f === 'edge' ? p.edge : !p.edge))); });
    if (G.sel && G.sel.tp && G.sel.tp.classList.contains('hide')) deselect();
  }
  function updateLabels() {
    ui.left.textContent = `あと ${G.n - G.placed}`;
    const e = G.pieces.filter((p) => !p.placed && p.edge).length, m = G.pieces.filter((p) => !p.placed && !p.edge).length;
    ui.filters.querySelector('[data-f="edge"]').textContent = `ふち ${e}`;
    ui.filters.querySelector('[data-f="mid"]').textContent = `なか ${m}`;
    ui.filters.querySelector('[data-f="all"]').textContent = `ぜんぶ ${G.n - G.placed}`;
  }
  function hint() {
    if (!G || G.over) return;
    const left = G.pieces.filter((p) => !p.placed); if (!left.length) return;
    const has = (r, c) => r >= 0 && c >= 0 && r < G.rows && c < G.cols && G.pieces[r * G.cols + c].placed;
    let cand = left.filter((p) => has(p.r - 1, p.c) || has(p.r + 1, p.c) || has(p.r, p.c - 1) || has(p.r, p.c + 1));
    if (!cand.length) cand = left.filter((p) => (p.r === 0 || p.r === G.rows - 1) && (p.c === 0 || p.c === G.cols - 1));
    if (!cand.length) cand = left;
    const p = PZ.pick(cand);
    if (G.filter !== 'all') setFilter('all');
    selectPiece(p);
    const t = ui.tray;
    if (landscape()) t.scrollTo({ top: p.tp.offsetTop - t.clientHeight / 2 + p.tp.offsetHeight / 2, behavior: 'smooth' });
    else t.scrollTo({ left: p.tp.offsetLeft - t.clientWidth / 2 + p.tp.offsetWidth / 2, behavior: 'smooth' });
    focusCell(p.r, p.c, true); pulse(p.r, p.c, 4000);
  }
  function setPeek(on) { ui.peek.classList.toggle('on', on); }

  /* ------------------------------------------------------------ 時間と保存 */
  function fmt(ms) { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  function showTimer() { ui.timer.textContent = fmt(G.elapsed); }
  function tick() {
    if (!G) return; const now = performance.now(), dt = now - G.lastTick; G.lastTick = now;
    if (G.started && !G.over && !document.hidden) { G.elapsed += Math.min(dt, 2000); showTimer(); }
  }
  let saveT = 0;
  function persist(now) {
    if (!G || G.over) return;
    clearTimeout(saveT);
    const go = () => {
      if (!G || G.over) return;
      Store.put('saves', { id: 'current', desc: G.desc, rows: G.rows, cols: G.cols, level: G.level, seed: G.seed, placed: G.pieces.filter((p) => p.placed).map((p) => p.i), elapsed: G.elapsed, misses: G.misses, ts: Date.now() }).catch(() => { });
    };
    if (now) go(); else saveT = setTimeout(go, 400);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(true); });
  addEventListener('pagehide', () => persist(true));

  /* ---------------------------------------------------------------- クリア */
  function win(restoredAlreadyDone) {
    G.over = true; clearInterval(G.timerId); deselect();
    Store.del('saves', 'current').catch(() => { });
    // 完成した絵を、線なしできれいに重ねる
    const fin = document.createElement('canvas'); fin.width = G.srcC.width; fin.height = G.srcC.height; fin.getContext('2d').drawImage(G.srcC, 0, 0);
    fin.className = 'final'; fin.style.width = G.W + 'px'; fin.style.height = G.H + 'px'; ui.world.appendChild(fin);
    requestAnimationFrame(() => requestAnimationFrame(() => fin.classList.add('on')));
    fitCam(true);
    PZ.confetti(90); PZ.snd.win();
    const stats = { time: G.elapsed, misses: G.misses, n: G.n, level: G.level, key: G.key, desc: G.desc, name: G.info.name, say: G.info.say, srcC: G.srcC, W: G.W, H: G.H };
    setTimeout(() => PZ.say(G.info.say), 600);
    if (E.on.win) setTimeout(() => E.on.win(stats), 2400);
  }

  function destroy() {
    if (!G) return;
    G.destroyed = true; clearInterval(G.timerId); clearTimeout(saveT);
    ui.tray.innerHTML = ''; ui.hand.classList.remove('on'); ui.ring.classList.remove('on'); ui.peek.classList.remove('on');
    ui.world.querySelectorAll('.final,.pop').forEach((e) => e.remove());
    ui.game.classList.remove('on'); G = null;
  }
  function exit() { persist(true); destroy(); E.on.exit && E.on.exit(); }

  /* ----------------------------------------------------------- ボタンの配線 */
  function init() {
    refs(); bindView();
    ui.tray.addEventListener('click', (e) => {
      const tp = e.target.closest('.tp'); if (!tp || !G) return; selectPiece(G.pieces[+tp.dataset.i]);
    });
    ui.hand.addEventListener('click', () => { if (!G || !G.sel) return; if (G.L.rot) rotate(G.sel); else deselect(); });
    ui.filters.addEventListener('click', (e) => { const b = e.target.closest('button[data-f]'); if (b && G) setFilter(b.dataset.f); });
    $('#gBack').onclick = exit;
    $('#gHint').onclick = hint;
    $('#zIn').onclick = () => { const v = viewSize(); G && zoomAt(v.w / 2, v.h / 2, cam.s * 1.35, true); };
    $('#zOut').onclick = () => { const v = viewSize(); G && zoomAt(v.w / 2, v.h / 2, cam.s / 1.35, true); };
    $('#zFit').onclick = () => G && fitCam(true);
    ui.ref.addEventListener('click', () => setPeek(!ui.peek.classList.contains('on')));      // 右上の見本：タップで大きく／もう一度で閉じる
    ui.peek.addEventListener('click', () => setPeek(false));
    let rt = 0;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (G) { fitCam(false); } }, 200); });
  }
  E.init = init; E.start = start; E.exit = exit; E.fmt = fmt;
  E.active = () => !!G;
})();
