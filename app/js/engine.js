/* engine.js ― ジグソー本体
   操作は「タップ＆タップ」: ピース置き場でピースをタップ → 盤面の置きたい場所をタップ。
   100枚をこえても遊べるよう、盤面は つまんで拡大／ゆびで移動できる。 */
(function () {
  'use strict';
  const CELL = 60;            // 盤面の1マス（ワールド座標）
  const TS = 0.88;            // ピース置き場での表示倍率
  const LEVELS = {
    easy:   { name: 'やさしい',         desc: 'うすい見本と、ヒントのひかり', ghost: 0.38, grid: true,  assist: true,  rot: false, snap: 0.8 },
    normal: { name: 'ふつう',           desc: 'うすい見本あり',               ghost: 0.14, grid: true,  assist: false, rot: false, snap: 0.55 },
    hard:   { name: 'むずかしい',       desc: '盤面に見本なし（右上の見本だけ）', ghost: 0,    grid: false, assist: false, rot: false, snap: 0.42 },
    expert: { name: 'ちょうむずかしい', desc: 'さらに、ピースがまわっている', ghost: 0,  grid: false, assist: false, rot: true, snap: 0.35 },
  };
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

  /* 複数の絵をタイル状にならべた「ぜんぶ」パズル */
  const COLLAGES = {
    animals:  { name: 'どうぶつ・しぜん ぜんぶ', say: 'みんな いるね', cols: 4, ids: () => PZ.art.filter((a) => a.cat === 'nature').map((a) => a.id) },
    vehicles: { name: 'のりもの ぜんぶ',         say: 'ぶーぶー',     cols: 4, ids: () => PZ.art.filter((a) => a.cat === 'vehicle').map((a) => a.id) },
  };

  /* ------------------------------------------------------------ 絵の読み込み */
  const Sources = {
    cache: {},
    key: (d) => (d.k === 'art' ? 'a:' + d.id : d.k === 'collage' ? 'c:' + (d.id || 'animals') : 'p:' + d.id),
    async load(desc) {
      const key = Sources.key(desc);
      if (Sources.cache[key]) return Sources.cache[key];
      let info;
      if (desc.k === 'art') {
        const a = PZ.art.find((x) => x.id === desc.id) || PZ.art[0];
        info = { img: await PZ.artImage(a), aspect: 1, name: a.name, say: a.say };
      } else if (desc.k === 'collage') {
        const def = COLLAGES[desc.id || 'animals'] || COLLAGES.animals, ids = def.ids(), cols = def.cols, rows = Math.ceil(ids.length / cols);
        const cv = document.createElement('canvas'); cv.width = cols * 400; cv.height = rows * 400;
        const x = cv.getContext('2d');
        for (let i = 0; i < ids.length; i++) x.drawImage(await PZ.artImage(PZ.art.find((a) => a.id === ids[i])), (i % cols) * 400, Math.floor(i / cols) * 400, 400, 400);
        info = { img: cv, aspect: cols / rows, name: def.name, say: def.say, tiles: { cols, rows, ids } };
      } else {
        const rec = await Store.get('photos', desc.id);
        if (!rec) throw new Error('photo-missing');
        let img; const blob = Store.recBlob(rec);
        try { img = await createImageBitmap(blob); }
        catch (e1) {
          try { const u = URL.createObjectURL(blob); img = await PZ.loadImage(u); }
          catch (e2) { throw Object.assign(new Error('photo-broken'), { name: 'PhotoBroken' }); }       // 保存された写真の中身が読めない
        }
        let aspect = clamp(rec.w / rec.h, 0.5, 2);
        if (rec.crop && rec.crop.w > 4 && rec.crop.h > 4) {                       // 「きりとり」で決めた範囲だけをパズルにする
          const k = Math.min(1, 1600 / Math.max(rec.crop.w, rec.crop.h)), cc = document.createElement('canvas');
          cc.width = Math.max(1, Math.round(rec.crop.w * k)); cc.height = Math.max(1, Math.round(rec.crop.h * k));
          cc.getContext('2d').drawImage(img, rec.crop.x, rec.crop.y, rec.crop.w, rec.crop.h, 0, 0, cc.width, cc.height);
          if (img.close) try { img.close(); } catch (e3) { }
          img = cc; aspect = clamp(cc.width / cc.height, 0.5, 2);
        }
        info = { img, aspect, name: rec.drawn ? 'わたしの え' : 'わたしの しゃしん', say: 'できたね' };
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


  /* ---------------------------------------------------- 「特徴のないピース」をなくす
     空・水・地面・道路などの「のっぺり」したマスを見つけて、絵に合う小さな絵柄（雲・鳥・泡・花など）を足す。
     どのピースにも見分ける手がかりがあるようにするため。同じ番号(seed)なら毎回同じ絵柄になる（再開しても同じ）。 */
  const PAL = {
    cloud: [['#ffffff']], bird: [['#334155']], balloon: [['#ff6b6b'], ['#ffd93d'], ['#a78bfa'], ['#34d399']],
    star: [['#ffd93d'], ['#fff3a0'], ['#ffb3d1']], heart: [['#ff6b8b'], ['#ff9fb5']],
    flower: [['#ff7eb6', '#ffd93d'], ['#ffffff', '#ffb703'], ['#a78bfa', '#fff3a0']],
    butterfly: [['#ff9f43', '#ffd39a'], ['#7c5cff', '#c4b5fd'], ['#f43f5e', '#fda4af']], ladybug: [['#ef4444']],
    bubble: [['#ffffff']], fish: [['#ff9f43'], ['#a78bfa'], ['#34d399'], ['#f472b6']], starfish: [['#ff6b8a'], ['#fb923c']],
    snow: [['#7dd3fc']], planet: [['#a78bfa', '#f5d0fe'], ['#fb923c', '#fde68a']], comet: [['#fff3a0']],
    crack: [['#000000']], pebble: [['#000000']], dots: [['#ffffff']],
  };
  const THEMES = {
    sky: ['cloud', 'bird', 'balloon', 'cloud', 'bird'], water: ['bubble', 'fish', 'starfish', 'bubble'], grass: ['flower', 'butterfly', 'ladybug', 'flower'],
    road: ['crack', 'pebble', 'crack', 'dots'], dirt: ['pebble', 'crack', 'pebble'], space: ['star', 'planet', 'comet', 'star'],
    snow: ['snow', 'star'], party: ['star', 'heart', 'balloon', 'dots'],
  };
  const star5 = (x, R, r) => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; x[i ? 'lineTo' : 'moveTo'](Math.cos(a) * q, Math.sin(a) * q); } x.closePath(); };
  const ell = (x, cx, cy, rx, ry, rot = 0) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, 6.3); x.fill(); };
  const MOTIF = {
    cloud(x, c) { x.fillStyle = c[0]; ell(x, 0, 0, 13, 6); ell(x, -7, -4, 8, 6); ell(x, 5, -6, 9, 7); },
    bird(x, c) { x.strokeStyle = c[0]; x.lineWidth = 2.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(-10, 0); x.quadraticCurveTo(-5, -8, 0, 0); x.quadraticCurveTo(5, -8, 10, 0); x.stroke(); },
    balloon(x, c) { x.fillStyle = c[0]; ell(x, 0, -3, 7, 9); x.strokeStyle = 'rgba(60,60,60,.6)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, 6); x.quadraticCurveTo(-3, 11, 0, 15); x.stroke(); x.fillStyle = 'rgba(255,255,255,.5)'; ell(x, -2.5, -6, 1.8, 3, 0.4); },
    star(x, c) { x.fillStyle = c[0]; star5(x, 9, 4); x.fill(); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1; x.stroke(); },
    heart(x, c) { x.fillStyle = c[0]; x.beginPath(); x.moveTo(0, 8); x.bezierCurveTo(-14, -2, -8, -12, 0, -5); x.bezierCurveTo(8, -12, 14, -2, 0, 8); x.fill(); },
    flower(x, c) { x.fillStyle = c[0]; for (let i = 0; i < 5; i++) { const a = i * 1.2566; ell(x, Math.cos(a) * 5.5, Math.sin(a) * 5.5, 4.2, 4.2); } x.fillStyle = c[1]; ell(x, 0, 0, 3.4, 3.4); },
    butterfly(x, c) { x.fillStyle = c[0]; ell(x, -6, -3, 6, 4.5, -0.4); ell(x, 6, -3, 6, 4.5, 0.4); x.fillStyle = c[1]; ell(x, -5, 4, 4, 3, 0.4); ell(x, 5, 4, 4, 3, -0.4); x.fillStyle = '#4a2c17'; ell(x, 0, 0, 1.4, 6); },
    ladybug(x, c) { x.fillStyle = '#222'; ell(x, 0, -6, 3.4, 3); x.fillStyle = c[0]; ell(x, 0, 1, 7, 7); x.fillStyle = '#222'; ell(x, -3, -1, 1.5, 1.5); ell(x, 3, 3, 1.5, 1.5); ell(x, -2, 5, 1.2, 1.2); x.fillRect(-0.4, -5, 0.8, 12); },
    bubble(x, c) { x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.8; x.beginPath(); x.arc(0, 0, 6, 0, 6.3); x.stroke(); x.fillStyle = 'rgba(255,255,255,.25)'; ell(x, 0, 0, 6, 6); x.fillStyle = 'rgba(255,255,255,.9)'; ell(x, -2, -2.5, 1.6, 1); x.strokeStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(9, -7, 2.4, 0, 6.3); x.stroke(); },
    fish(x, c) { x.fillStyle = c[0]; ell(x, 0, 0, 9, 5.5); x.beginPath(); x.moveTo(-7, 0); x.lineTo(-14, -5); x.lineTo(-14, 5); x.closePath(); x.fill(); x.fillStyle = '#fff'; ell(x, 4, -1.4, 1.8, 1.8); x.fillStyle = '#222'; ell(x, 4.4, -1.4, 0.9, 0.9); },
    starfish(x, c) { x.fillStyle = c[0]; star5(x, 10, 4.4); x.fill(); x.fillStyle = 'rgba(255,255,255,.55)'; ell(x, 0, 0, 1.2, 1.2); },
    snow(x, c) { x.strokeStyle = c[0]; x.lineWidth = 1.8; x.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = i * 1.0472; x.beginPath(); x.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); x.lineTo(-Math.cos(a) * 9, -Math.sin(a) * 9); x.stroke(); } },
    planet(x, c) { x.fillStyle = c[0]; ell(x, 0, 0, 6.5, 6.5); x.strokeStyle = c[1]; x.lineWidth = 1.8; x.beginPath(); x.ellipse(0, 0, 11, 3.2, -0.4, 0, 6.3); x.stroke(); },
    comet(x, c) { x.fillStyle = c[0]; ell(x, 4, 0, 4, 4); x.strokeStyle = 'rgba(255,243,160,.7)'; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(1, -1); x.lineTo(-12, -6); x.moveTo(1, 1); x.lineTo(-12, 5); x.stroke(); },
    crack(x) { x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = 1.8; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(-10, -4); x.lineTo(-3, 0); x.lineTo(-5, 5); x.moveTo(-3, 0); x.lineTo(5, -2); x.lineTo(10, 4); x.stroke(); },
    pebble(x) { x.fillStyle = 'rgba(0,0,0,.22)'; ell(x, -5, 2, 4.5, 3); ell(x, 4, -3, 3.4, 2.5); x.fillStyle = 'rgba(255,255,255,.18)'; ell(x, 6, 5, 2.6, 2); },
    dots(x, c) { x.fillStyle = c[0]; x.globalAlpha = 0.55; ell(x, -6, 2, 2.4, 2.4); ell(x, 2, -4, 2.8, 2.8); ell(x, 7, 5, 2, 2); x.globalAlpha = 1; },
  };
  const THEME_FORCE = { lion: { party: 'sky' }, tyrano: { party: 'sky' }, tricera: { party: 'sky' } };
  function themeOf(r, g, b, artId) {
    const t = themeOf0(r, g, b, artId); return (THEME_FORCE[artId] && THEME_FORCE[artId][t]) || t;
  }
  function themeOf0(r, g, b, artId) {
    const L = 0.299 * r + 0.587 * g + 0.114 * b, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (L < 75 && b >= r) return 'space';
    if (L > 238 && mx - mn < 14) return 'snow';
    if (b > r + 22 && b >= g - 12) return artId === 'sakana' ? 'water' : 'sky';
    if (g > r + 14 && g > b + 14) return 'grass';
    if (mx - mn < 34) return L > 215 ? 'snow' : 'road';
    if (r > g && g > b && L < 175) return 'dirt';
    return 'party';
  }
  function enrichSource(srcC, rows, cols, seed, info, desc) {
    let cx; try { cx = srcC.getContext('2d'); cx.getImageData(0, 0, 1, 1); } catch (e) { return; }
    const u = srcC.width / cols, uh = srcC.height / rows, rnd = PZ.rng((seed ^ 0x5bd1e995) | 0);
    const artAt = (fx, fy) => (desc.k === 'collage' ? info.tiles.ids[Math.floor(fy * info.tiles.rows) * info.tiles.cols + Math.floor(fx * info.tiles.cols)] : desc.id);
    const jobs = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const px = Math.floor(c * u), py = Math.floor(r * uh), w = Math.floor(u), h = Math.floor(uh);
      let d; try { d = cx.getImageData(px, py, w, h).data; } catch (e) { return; }
      const step = Math.max(1, Math.floor(w / 12)); let n = 0, sr = 0, sg = 0, sb = 0;
      for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) { const i = (y * w + x) * 4; sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++; }
      const mr = sr / n, mg = sg / n, mb = sb / n; let mad = 0;
      for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) { const i = (y * w + x) * 4; mad += (Math.abs(d[i] - mr) + Math.abs(d[i + 1] - mg) + Math.abs(d[i + 2] - mb)) / 3; }
      mad /= n;
      if (mad < 5.5) jobs.push({ r, c, theme: themeOf(mr, mg, mb, artAt((c + 0.5) / cols, (r + 0.5) / rows)) });
    }
    const m = u / 60;
    jobs.forEach((j) => {
      const list = THEMES[j.theme], count = rnd() < 0.3 ? 2 : 1;
      for (let k = 0; k < count; k++) {
        const name = list[(j.r * 7 + j.c * 3 + k * 2 + Math.floor(rnd() * 2)) % list.length], pals = PAL[name], col = pals[(j.r * 5 + j.c * 11 + k) % pals.length];
        const fx = k ? (rnd() < 0.5 ? 0.25 : 0.75) : 0.35 + rnd() * 0.3, fy = k ? (rnd() < 0.5 ? 0.25 : 0.75) : 0.35 + rnd() * 0.3;
        cx.save(); cx.translate((j.c + fx) * u, (j.r + fy) * uh); cx.rotate((rnd() - 0.5) * 0.5);
        const s = m * (k ? 0.85 : 1.15 + rnd() * 0.3); cx.scale(s, s); MOTIF[name](cx, col); cx.restore();
      }
    });
  }

  /* ---------------------------------------------------------------- 状態
     ピースは3つの場所のどれかにある:  'tray' ピース置き場 / 'table' 盤面の外のテーブル / 'board' 盤面（固定）
     テーブルのピースは「グループ」にまとまる。グループの位置は (ax, ay) = 盤面の左上(0,0)に相当する点。
     つまり ピース(r,c) は (ax + c*CELL, ay + r*CELL) にいる。ax=ay=0 なら盤面とぴったり重なる。 */
  let G = null, ui = null;
  const cam = { x: 0, y: 0, s: 1 };
  const E = (window.Engine = { LEVELS, Sources, gridFor, CELL, on: {} });

  function refs() {
    if (ui) return ui;
    ui = {
      game: $('#game'), view: $('#view'), world: $('#world'), board: $('#board'), ring: $('#ring'), table: $('#table'),
      tray: $('#tray'), filters: $('#filters'), timer: $('#timer'), left: $('#left'),
      hand: $('#hand'), back: $('#back2tray'), ref: $('#ref'), refImg: $('#ref img'), peek: $('#peek'), peekImg: $('#peek img'), loading: $('#loading'), toast: $('#toast'),
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
  /* 右上の見本は、パズルとまったく同じ縦横比にする（縦長なら縦長、横長なら横長。切り抜かない） */
  function setRefSize() {
    const box = landscape() ? 78 : (innerWidth <= 380 ? 80 : 92), a = G.W / G.H;
    const w = a >= 1 ? box : box * a, h = a >= 1 ? box / a : box;
    Object.assign(ui.ref.querySelector('.pic').style, { width: w + 'px', height: h + 'px' });
  }
  function fitCam(anim) {
    const v = viewSize(), rr = ui.ref.getBoundingClientRect();
    const hs = landscape() ? 92 : 112;                          // 左上=いま持っているピース / 右上=見本。盤面はそれらにかぶらない場所に置く
    let top = 0, left = 0, right = 0;
    if (landscape()) { left = hs + 16; right = Math.max(0, v.l + v.w - rr.left + 6); }
    else top = Math.max(hs + 16, rr.bottom - v.t + 6);
    const aw = v.w - left - right, ah = v.h - top;
    const s = Math.min(aw * 0.96 / G.W, ah * 0.96 / G.H);
    G.fit = s; G.sTable = Math.min(v.w / (G.W + 2 * G.M), v.h / (G.H + 2 * G.M)) * 0.94;
    G.sMin = Math.min(G.sTable, s * 0.8); G.sMax = Math.max(160 / CELL, s * 3);
    cam.s = s; cam.x = left + (aw - G.W * s) / 2; cam.y = top + (ah - G.H * s) / 2; applyCam(anim);
  }
  function fitTable(anim) {                                      // テーブル全体が見えるところまで引く
    const v = viewSize(); cam.s = G.sTable; cam.x = v.w / 2 - (G.W / 2) * cam.s; cam.y = v.h / 2 - (G.H / 2) * cam.s; applyCam(anim);
  }
  function clampCam() {
    const v = viewSize(), m = 80, M = G.M;
    cam.x = clamp(cam.x, m - (G.W + M) * cam.s, v.w - m + M * cam.s);
    cam.y = clamp(cam.y, m - (G.H + M) * cam.s, v.h - m + M * cam.s);
  }
  function zoomAt(px, py, s2, anim) {
    s2 = clamp(s2, G.sMin, G.sMax);
    const wx = (px - cam.x) / cam.s, wy = (py - cam.y) / cam.s;
    cam.s = s2; cam.x = px - wx * s2; cam.y = py - wy * s2; clampCam(); applyCam(anim);
  }
  function focusWorld(wx, wy, anim) {                            // 指定の場所が画面の真ん中に来るように
    const v = viewSize(), s = clamp(Math.max(cam.s, 110 / CELL), G.sMin, G.sMax);
    cam.s = s; cam.x = v.w / 2 - wx * s; cam.y = v.h / 2 - wy * s; clampCam(); applyCam(anim);
  }

  /* 盤面の指操作：1本=移動 / 2本=拡大縮小 / ちょん=タップ */
  function bindView() {
    const v = ui.view, ptrs = new Map();
    let pinch = null, multi = false;
    const local = (e) => { const r = v.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    v.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#hand,#back2tray,#peek,#ref,.zoom')) return;
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
      if (e.type === 'pointerup' && !q.moved && !multi && G) onTap(q.x, q.y);
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
    const pad = Math.ceil(CELL * 0.3), S = CELL + pad * 2, M = Math.round(Math.max(W, H) * 0.5);
    const seed = o.save ? o.save.seed : (Math.random() * 1e9) | 0;
    const rnd = PZ.rng(seed), edges = PZ.edges(rows, cols, seed);
    const order = shuffleSeed([...Array(n).keys()], rnd);
    const rots = Array.from({ length: n }, () => (L.rot ? 1 + Math.floor(rnd() * 3) : 0));
    const srcC = Sources.cover(info.img, W * RES, H * RES);
    if (o.desc.k !== 'photo') enrichSource(srcC, rows, cols, seed, info, o.desc);      // 写真は そのまま（絵だけ、手がかりを足す）
    G = {
      desc: o.desc, key: Sources.key(o.desc), info, level: o.level, L, rows, cols, n, W, H, M, RES, pad, S, seed,
      srcC, edges, pieces: [], groups: [], gid: 0, z: 10, placed: 0, sel: null, misses: o.save ? o.save.misses || 0 : 0, elapsed: o.save ? o.save.elapsed || 0 : 0,
      started: !!(o.save && ((o.save.placed && o.save.placed.length) || (o.save.groups && o.save.groups.length))), over: false, filter: 'all',
      fit: 1, sTable: 0.2, sMin: 0.2, sMax: 3, order, opos: new Map(order.map((i, k) => [i, k])), timerId: 0, lastTick: 0, destroyed: false, cheerN: 0, joinN: 0, say: {},
    };
    // 盤面とテーブル
    const b = ui.board; b.width = Math.ceil(W * RES); b.height = Math.ceil(H * RES); b.style.width = W + 'px'; b.style.height = H + 'px';
    ui.world.style.width = W + 'px'; ui.world.style.height = H + 'px';
    Object.assign(ui.table.style, { left: -M + 'px', top: -M + 'px', width: W + 2 * M + 'px', height: H + 2 * M + 'px' });
    drawBoardBase();
    // 見本（右上の小さな見本と、タップで出る大きな見本）
    try {
      const refUrl = await PZ.canvasUrl(PZ.coverCanvas(srcC, Math.min(900, srcC.width), Math.min(900, srcC.width) * H / W), 'image/jpeg', 0.85);
      ui.peekImg.src = refUrl; ui.refImg.src = refUrl; ui.ref.style.display = '';
    } catch (err) { ui.ref.style.display = 'none'; }                // 画像の書き出しが禁止されている表示場所：見本だけあきらめて、パズルは続ける
    setRefSize();
    // ピース
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const cv = document.createElement('canvas'); cv.width = cv.height = Math.ceil(S * RES);
      cv.style.width = cv.style.height = S * TS + 'px';
      const x = cv.getContext('2d'); x.scale(RES, RES); x.translate(pad, pad);
      const path = PZ.piecePath(r, c, rows, cols, CELL, CELL, edges, false);
      x.save(); x.clip(path); x.drawImage(srcC, -c * CELL, -r * CELL, W, H); x.restore();
      x.lineJoin = 'round'; x.strokeStyle = 'rgba(0,0,0,.30)'; x.lineWidth = 2.2; x.stroke(path);
      x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.1; x.stroke(path);
      G.pieces.push({ i, r, c, cv, rot: rots[i], deg: rots[i] * 90, state: 'tray', tp: null, g: null, edge: r === 0 || c === 0 || r === rows - 1 || c === cols - 1 });
      if (i % 25 === 24) { ui.loading.querySelector('span').textContent = `ピースを つくっています ${Math.round(i / n * 100)}%`; await nextFrame(); if (G.destroyed) return; }
    }
    // 保存分の復元：盤面 → テーブルのグループ → 残りはピース置き場へ
    if (o.save) {
      (o.save.placed || []).forEach((i) => { const p = G.pieces[i]; if (p) { p.state = 'board'; G.placed++; drawPiece(p); } });
      (o.save.groups || []).forEach((sg) => { const ms = sg.m.filter((i) => G.pieces[i] && G.pieces[i].state === 'tray'); if (ms.length) newGroup(ms, sg.ax, sg.ay); });
    }
    order.forEach((i) => { const p = G.pieces[i]; if (p.state === 'tray') buildTp(p); });
    updateLabels(); setFilter('all'); showTimer();
    // ふちガイド：やさしい・ふつうでは、まず まわりの「ふち」から。盤面のまわりを光らせ、置き場も「ふち」だけにする
    G.guide = (o.level === 'easy' || o.level === 'normal') && n >= 40 && !G.pieces.filter((p) => p.edge).every((p) => p.state === 'board');
    if (G.guide) {
      const el = document.createElement('div'); el.className = 'edgeguide'; el.style.width = W + 'px'; el.style.height = H + 'px'; ui.world.appendChild(el); G.guideEl = el;
      if (!o.save) setFilter('edge');
    }
    ui.game.classList.add('on'); ui.loading.classList.remove('on');
    await nextFrame(); fitCam(false);
    G.lastTick = performance.now(); G.timerId = setInterval(tick, 500);
    if (G.placed === G.n) win(true);
    else setTimeout(() => G && PZ.sayV(o.save ? 'つづきから はじめよう' : G.guide ? 'まずは、まわりの ふちの ピースから あつめよう' : (G.info.name === 'わたしの しゃしん' ? 'わたしの しゃしんの パズルだよ' : G.info.name + 'の パズルだよ。ピースを えらんでね'), true), 700);
  }
  function shuffleSeed(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function drawBoardBase() {
    const x = ui.board.getContext('2d'), { W, H, RES, L, rows, cols } = G;
    x.setTransform(RES, 0, 0, RES, 0, 0); x.clearRect(0, 0, W, H);
    x.fillStyle = '#fdf1d8'; x.fillRect(0, 0, W, H);
    if (L.ghost) { x.globalAlpha = L.ghost; x.drawImage(G.srcC, 0, 0, W, H); x.globalAlpha = 1; }
    if (L.grid) {                                                // 空のマスは、本物のピースの形の線で見せる
      x.strokeStyle = 'rgba(122,75,22,.34)'; x.lineWidth = 1.2; x.lineJoin = 'round';
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        x.save(); x.translate(c * CELL, r * CELL); x.stroke(PZ.piecePath(r, c, rows, cols, CELL, CELL, G.edges, false)); x.restore();
      }
    }
    x.strokeStyle = 'rgba(122,75,22,.55)'; x.lineWidth = 3; x.strokeRect(0, 0, W, H);
  }
  function drawPiece(p) {
    const x = ui.board.getContext('2d');
    x.setTransform(G.RES, 0, 0, G.RES, 0, 0);
    x.drawImage(p.cv, p.c * CELL - G.pad, p.r * CELL - G.pad, G.S, G.S);
  }
  /* ピース置き場の「もとの並び順」の位置に、ピースを戻す */
  function insertTp(p) {
    const tp = document.createElement('div'); tp.className = 'tp'; tp.dataset.i = p.i;
    tp.style.width = tp.style.height = G.S * TS + 8 + 'px';
    p.cv.style.transform = `rotate(${p.deg}deg)`; tp.appendChild(p.cv); p.tp = tp;
    const next = [...ui.tray.children].find((t) => G.opos.get(+t.dataset.i) > G.opos.get(p.i));
    ui.tray.insertBefore(tp, next || null);
  }
  function returnToTray(g) {                                                  // テーブルのかたまりを、ピース置き場へ戻す
    const ms = [...g.ms]; removeGroup(g);
    ms.forEach((i) => { const p = G.pieces[i]; p.g = null; p.state = 'tray'; insertTp(p); });
    G.sel = null; ui.hand.classList.remove('on'); ui.back.classList.remove('on'); ui.ring.classList.remove('on');
    PZ.snd.drop(); updateLabels(); setFilter(G.filter); persist();
  }
  function buildTp(p) {
    const tp = document.createElement('div'); tp.className = 'tp'; tp.dataset.i = p.i;
    tp.style.width = tp.style.height = G.S * TS + 8 + 'px';
    p.cv.style.transform = `rotate(${p.deg}deg)`; tp.appendChild(p.cv); p.tp = tp; ui.tray.appendChild(tp);
  }

  /* ----------------------------------------------------------- グループ（テーブルのかたまり） */
  function newGroup(ms, ax, ay) {
    const g = { id: ++G.gid, ms: new Set(ms), ax, ay, el: null, z: ++G.z, box: null };
    ms.forEach((i) => { const p = G.pieces[i]; p.g = g; p.state = 'table'; if (p.tp) { p.tp.remove(); p.tp = null; } });
    G.groups.push(g); compose(g); return g;
  }
  function removeGroup(g) { if (g.el) g.el.remove(); G.groups = G.groups.filter((x) => x !== g); }
  /* メンバーを1枚のcanvasに描く（かたまりが大きくても、画面の部品は1つ） */
  function compose(g) {
    let rmin = 1e9, rmax = -1, cmin = 1e9, cmax = -1;
    g.ms.forEach((i) => { const p = G.pieces[i]; rmin = Math.min(rmin, p.r); rmax = Math.max(rmax, p.r); cmin = Math.min(cmin, p.c); cmax = Math.max(cmax, p.c); });
    g.box = { rmin, rmax, cmin, cmax };
    const w = (cmax - cmin + 1) * CELL + 2 * G.pad, h = (rmax - rmin + 1) * CELL + 2 * G.pad;
    if (!g.el) { g.el = document.createElement('canvas'); g.el.className = 'grp'; ui.world.appendChild(g.el); }
    const cv = g.el; cv.width = Math.ceil(w * G.RES); cv.height = Math.ceil(h * G.RES); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const x = cv.getContext('2d'); x.setTransform(G.RES, 0, 0, G.RES, 0, 0);
    g.ms.forEach((i) => { const p = G.pieces[i]; x.drawImage(p.cv, (p.c - cmin) * CELL, (p.r - rmin) * CELL, G.S, G.S); });
    placeGroupEl(g);
  }
  function placeGroupEl(g) {
    g.el.style.left = g.ax + g.box.cmin * CELL - G.pad + 'px'; g.el.style.top = g.ay + g.box.rmin * CELL - G.pad + 'px'; g.el.style.zIndex = g.z;
  }
  function hitGroup(wx, wy) {                                      // 指の下にある、いちばん上のグループとピース
    const gs = G.groups.slice().sort((a, b) => b.z - a.z);
    for (const g of gs) {
      const c = Math.floor((wx - g.ax) / CELL), r = Math.floor((wy - g.ay) / CELL);
      if (r < 0 || c < 0 || r >= G.rows || c >= G.cols) continue;
      const idx = r * G.cols + c; if (g.ms.has(idx)) return { g, idx };
    }
    return null;
  }
  function nbrs(i) {
    const p = G.pieces[i], out = [];
    if (p.r > 0) out.push(i - G.cols); if (p.r < G.rows - 1) out.push(i + G.cols); if (p.c > 0) out.push(i - 1); if (p.c < G.cols - 1) out.push(i + 1);
    return out;
  }
  const members = (U) => (U.from === 'tray' ? [U.p.i] : [...U.g.ms]);
  const touches = (U, idx) => members(U).some((i) => nbrs(i).includes(idx));     // 選んだものの誰かが、idx のピースと本当にとなりあっているか
  const upright = (U) => U.from !== 'tray' || U.p.rot % 4 === 0;

  /* ----------------------------------------------------- 選ぶ・置く・くっつける */
  function toast(msg, say) {
    if (say) PZ.sayV(say);
    ui.toast.textContent = msg; ui.toast.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => ui.toast.classList.remove('on'), 2200);
  }
  function startSelect() {
    if (!G.started) G.started = true;
    const s = Store.settings; if ((s.tipJoin || 0) < 3) { s.tipJoin = (s.tipJoin || 0) + 1; Store.saveSettings(); toast('つなげたい ピースを タップ。あいている ばしょを タップで おけるよ', 'ピースを タップして、あいている ばしょを タップしてね'); }
  }
  function selectTray(p) {
    if (!G || G.over || p.state !== 'tray') return;
    if (G.sel && G.sel.from === 'tray' && G.sel.p === p) { if (G.L.rot) { rotate(p); return; } deselect(); return; }
    deselect(); G.sel = { from: 'tray', p }; p.tp.classList.add('sel'); PZ.snd.pick();
    showHand(); startSelect();
    if (G.L.assist) pulseCell(p.r, p.c, 0);
  }
  function selectGroup(g) {
    deselect(); G.sel = { from: 'table', g }; g.el.classList.add('sel'); PZ.snd.pick();
    showHand(); startSelect(); ui.back.classList.add('on');
    if (G.L.assist) { const p = G.pieces[[...g.ms][0]]; pulseCell(p.r, p.c, 0); }
  }
  function deselect() {
    if (!G || !G.sel) return;
    const U = G.sel; if (U.from === 'tray') U.p.tp && U.p.tp.classList.remove('sel'); else U.g.el && U.g.el.classList.remove('sel');
    G.sel = null; ui.hand.classList.remove('on'); ui.back.classList.remove('on'); ui.ring.classList.remove('on');
  }
  function showHand() {
    const U = G.sel, h = ui.hand; h.innerHTML = ''; const c = document.createElement('canvas');
    const src = U.from === 'tray' ? U.p.cv : U.g.el;
    c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0);
    if (U.from === 'tray') c.style.transform = `rotate(${U.p.deg}deg)`;
    h.appendChild(c); h.classList.toggle('rot', U.from === 'tray' && G.L.rot); h.classList.add('on');
  }
  function rotate(p) {
    p.rot = (p.rot + 1) % 4; p.deg += 90; PZ.snd.pick();
    p.cv.style.transform = `rotate(${p.deg}deg)`;
    const hc = ui.hand.querySelector('canvas'); if (hc) hc.style.transform = `rotate(${p.deg}deg)`;
  }
  function pulseAt(wx, wy, ms) {
    const ring = ui.ring; ring.style.left = wx + 'px'; ring.style.top = wy + 'px'; ring.style.width = ring.style.height = CELL + 'px';
    ring.classList.remove('on'); void ring.offsetWidth; ring.classList.add('on');
    clearTimeout(pulseAt.t); if (ms) pulseAt.t = setTimeout(() => ring.classList.remove('on'), ms);
  }
  const pulseCell = (r, c, ms) => pulseAt(c * CELL, r * CELL, ms);
  function wobbleHand() { ui.hand.classList.remove('wob'); void ui.hand.offsetWidth; ui.hand.classList.add('wob'); }
  function miss() { G.misses++; PZ.snd.soft(); wobbleHand(); }
  const tol = () => G.L.snap * CELL;

  function onTap(x, y) {
    if (!G || G.over) return;
    const wx = (x - cam.x) / cam.s, wy = (y - cam.y) / cam.s, hit = hitGroup(wx, wy);
    const U = G.sel;
    if (!U) { if (hit) selectGroup(hit.g); return; }                         // 何も持っていない時：テーブルのかたまりを持ち上げる
    if (!upright(U)) { PZ.snd.soft(); wobbleHand(); toast('むきを そろえてね', 'ピースを タップして、むきを そろえてね'); return; }
    const inBoard = wx >= 0 && wy >= 0 && wx < G.W && wy < G.H;
    const bidx = inBoard ? Math.floor(wy / CELL) * G.cols + Math.floor(wx / CELL) : -1;
    if (inBoard && members(U).includes(bidx)) { toBoard(U); return; }        // 正しいマスをタップ：はまる（上にテーブルのかたまりが重なっていても）
    if (U.from === 'table' && hit && hit.g === U.g) { deselect(); return; }  // 自分をもう一度タップ：やめる
    if (hit) {                                                               // ほかのかたまりをタップ：その中のピースととなりあっていればくっつく
      if (touches(U, hit.idx)) attach(U, hit.g); else miss();
      return;
    }
    if (inBoard) {
      if (G.pieces[bidx].state === 'board' && touches(U, bidx)) toBoard(U);  // 置いてあるピースをタップ：となりなら、そこにはまる
      else miss();
      return;
    }
    if (wx >= -G.M && wy >= -G.M && wx < G.W + G.M && wy < G.H + G.M) putDown(U, wx, wy);   // テーブルの空いている所：仮置き
  }

  function popAt(src, left, top, w, h) {
    const pop = document.createElement('canvas'); pop.width = src.width; pop.height = src.height; pop.getContext('2d').drawImage(src, 0, 0);
    pop.className = 'pop'; Object.assign(pop.style, { left: left + 'px', top: top + 'px', width: w + 'px', height: h + 'px' });
    ui.world.appendChild(pop); setTimeout(() => pop.remove(), 520);
  }
  /* 声のガイド：ほめる・おしえる（多すぎないよう、きりのいい所とときどきだけ） */
  const PRAISE = ['ぴったり！', 'いいね！', 'すごい！', 'じょうず！', 'できたね！'];
  function checkGuide() {                                                     // ふちが ぜんぶ そろったら、ガイドを消して「なか」へ
    if (!G || !G.guide || !G.guideEl) return;
    if (!G.pieces.filter((p) => p.edge).every((p) => p.state === 'board')) return;
    G.guideEl.classList.add('gone'); const el = G.guideEl; G.guideEl = null; setTimeout(() => el.remove(), 700);
    if (G.filter === 'edge') setFilter('mid');
  }
  function cheer(kind) {
    if (!G || G.over) return;
    const left = G.n - G.placed, edges = G.pieces.filter((p) => p.edge), edgeDone = edges.length && edges.every((p) => p.state === 'board');
    if (kind === 'board') {
      G.say = G.say || {};
      if (!G.say.half && G.placed * 2 >= G.n) { G.say.half = 1; return PZ.sayV('はんぶん できたよ！ すごいね', true); }
      if (!G.say.edge && edgeDone && G.n > 30) { G.say.edge = 1; return PZ.sayV('まわりの ふちが できたよ！', true); }
      if (!G.say.ten && left === 10) { G.say.ten = 1; return PZ.sayV('あと ちょっとだよ！ がんばれ', true); }
      if (++G.cheerN % 6 === 0) PZ.sayV(PZ.pick(PRAISE));
    } else if (kind === 'join') {
      if (++G.joinN === 1 || G.joinN % 8 === 0) PZ.sayV('くっついたね！');
    }
  }
  function finishMove() { deselect(); updateLabels(); persist(); }

  function toBoard(U) {                                                       // 盤面に固定する
    const ms = members(U);
    if (U.from === 'tray') { const p = U.p; popAt(p.cv, p.c * CELL - G.pad, p.r * CELL - G.pad, G.S, G.S); }
    else { const g = U.g; popAt(g.el, g.box.cmin * CELL - G.pad, g.box.rmin * CELL - G.pad, parseFloat(g.el.style.width), parseFloat(g.el.style.height)); removeGroup(g); }
    ms.forEach((i) => { const p = G.pieces[i]; if (p.tp) { p.tp.remove(); p.tp = null; } p.g = null; p.state = 'board'; G.placed++; drawPiece(p); });
    PZ.snd.ok(); finishMove();
    if (G.placed === G.n) win(false); else { checkGuide(); cheer('board'); }
  }
  function attach(U, T) {                                                     // となりあうかたまりにくっつく（位置はTにそろう）
    const ms = members(U);
    if (U.from === 'table') removeGroup(U.g);
    ms.forEach((i) => { const p = G.pieces[i]; if (p.tp) { p.tp.remove(); p.tp = null; } p.g = T; p.state = 'table'; T.ms.add(i); });
    T.z = ++G.z; compose(T);
    T.el.classList.remove('joined'); void T.el.offsetWidth; T.el.classList.add('joined');
    PZ.snd.ok(); finishMove(); cheer('join');
  }
  function putDown(U, wx, wy) {                                               // テーブルに置く／動かす（近くのとなりに合えば、そのままくっつく）
    const ms = members(U).map((i) => G.pieces[i]);
    const rmin = Math.min(...ms.map((p) => p.r)), rmax = Math.max(...ms.map((p) => p.r)), cmin = Math.min(...ms.map((p) => p.c)), cmax = Math.max(...ms.map((p) => p.c));
    const ax = wx - (cmin + cmax + 1) / 2 * CELL, ay = wy - (rmin + rmax + 1) / 2 * CELL;
    if (Math.abs(ax) <= tol() && Math.abs(ay) <= tol()) { toBoard(U); return; }          // 盤面のふちにぴったり近い
    const set = new Set(members(U));
    for (const T of G.groups) {
      if (U.from === 'table' && T === U.g) continue;
      if (Math.abs(ax - T.ax) <= tol() && Math.abs(ay - T.ay) <= tol() && [...set].some((i) => nbrs(i).some((j) => T.ms.has(j)))) { attach(U, T); return; }
    }
    if (U.from === 'tray') newGroup([U.p.i], ax, ay);
    else { U.g.ax = ax; U.g.ay = ay; U.g.z = ++G.z; placeGroupEl(U.g); }
    PZ.snd.drop(); finishMove();
  }

  /* ---------------------------------------------------- 絞りこみ・ヒント・表示 */
  function setFilter(f) {
    G.filter = f; ui.filters.querySelectorAll('button[data-f]').forEach((b) => b.classList.toggle('on', b.dataset.f === f));
    G.pieces.forEach((p) => { if (p.tp) p.tp.classList.toggle('hide', !(f === 'all' || (f === 'edge' ? p.edge : !p.edge))); });
    if (G.sel && G.sel.from === 'tray' && G.sel.p.tp.classList.contains('hide')) deselect();
  }
  function updateLabels() {
    const tray = G.pieces.filter((p) => p.state === 'tray'), onTable = G.pieces.filter((p) => p.state === 'table').length;
    ui.left.textContent = `あと ${G.n - G.placed}`;
    ui.filters.querySelector('[data-f="edge"]').textContent = `ふち ${tray.filter((p) => p.edge).length}`;
    ui.filters.querySelector('[data-f="mid"]').textContent = `なか ${tray.filter((p) => !p.edge).length}`;
    ui.filters.querySelector('[data-f="all"]').textContent = `ぜんぶ ${tray.length}`;
    ui.game.classList.toggle('hasTable', onTable > 0);
  }
  function hint() {
    if (!G || G.over) return;
    const tray = G.pieces.filter((p) => p.state === 'tray'), st = (j) => G.pieces[j].state;
    if (!tray.length) {                                                      // 置き場が空：テーブルのかたまりを盤面へ
      const g = G.groups[0]; if (!g) return; const p = G.pieces[[...g.ms][0]];
      selectGroup(g); pulseCell(p.r, p.c, 4000); focusWorld((p.c + 0.5) * CELL, (p.r + 0.5) * CELL, true); return;
    }
    let cand = tray.filter((p) => nbrs(p.i).some((j) => st(j) === 'board')), mode = 'cell';
    if (!cand.length) { cand = tray.filter((p) => nbrs(p.i).some((j) => st(j) === 'table')); mode = 'table'; }
    if (!cand.length) { mode = 'cell'; cand = tray.filter((p) => (p.r === 0 || p.r === G.rows - 1) && (p.c === 0 || p.c === G.cols - 1)); }
    if (!cand.length) cand = tray;
    const p = PZ.pick(cand); PZ.sayV('ひかっている ピースを さがしてね', true);
    if (G.filter !== 'all') setFilter('all');
    selectTray(p);
    const t = ui.tray;
    if (landscape()) t.scrollTo({ top: p.tp.offsetTop - t.clientHeight / 2 + p.tp.offsetHeight / 2, behavior: 'smooth' });
    else t.scrollTo({ left: p.tp.offsetLeft - t.clientWidth / 2 + p.tp.offsetWidth / 2, behavior: 'smooth' });
    if (mode === 'table') {                                                  // となりのピースが、テーブルのかたまりにある → そのピースを光らせる
      const q = G.pieces[nbrs(p.i).find((j) => st(j) === 'table')], g = q.g, wx = g.ax + q.c * CELL, wy = g.ay + q.r * CELL;
      pulseAt(wx, wy, 4000); focusWorld(wx + CELL / 2, wy + CELL / 2, true);
    } else { pulseCell(p.r, p.c, 4000); focusWorld((p.c + 0.5) * CELL, (p.r + 0.5) * CELL, true); }
  }
  function setPeek(on) { ui.peek.classList.toggle('on', on); }

  /* ------------------------------------------------------------ 時間と保存 */
  function fmt(ms) { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  function showTimer() { ui.timer.textContent = fmt(G.elapsed); }
  function tick() {
    if (!G) return; const now = performance.now(), dt = now - G.lastTick; G.lastTick = now;
    if (G.started && !G.over && !document.hidden && !document.querySelector('#sheet.on')) { const d = Math.min(dt, 2000); G.elapsed += d; showTimer(); E.on.tick && E.on.tick(d); }
  }
  let saveT = 0;
  function persist(now) {
    if (!G || G.over) return;
    clearTimeout(saveT);
    const go = () => {
      if (!G || G.over) return;
      Store.put('saves', {
        id: E.saveId(), desc: G.desc, rows: G.rows, cols: G.cols, level: G.level, seed: G.seed,
        placed: G.pieces.filter((p) => p.state === 'board').map((p) => p.i),
        groups: G.groups.map((g) => ({ m: [...g.ms], ax: g.ax, ay: g.ay })),
        elapsed: G.elapsed, misses: G.misses, ts: Date.now(),
      }).catch(() => { });
    };
    if (now) go(); else saveT = setTimeout(go, 400);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(true); });
  addEventListener('pagehide', () => persist(true));

  /* ---------------------------------------------------------------- クリア */
  function win(restoredAlreadyDone) {
    G.over = true; clearInterval(G.timerId); deselect();
    Store.del('saves', E.saveId()).catch(() => { });
    // 完成した絵を、線なしできれいに重ねる
    const fin = document.createElement('canvas'); fin.width = G.srcC.width; fin.height = G.srcC.height; fin.getContext('2d').drawImage(G.srcC, 0, 0);
    fin.className = 'final'; fin.style.width = G.W + 'px'; fin.style.height = G.H + 'px'; ui.world.appendChild(fin);
    requestAnimationFrame(() => requestAnimationFrame(() => fin.classList.add('on')));
    fitCam(true);
    PZ.confetti(90); PZ.snd.win();
    const stats = { time: G.elapsed, misses: G.misses, n: G.n, level: G.level, key: G.key, desc: G.desc, name: G.info.name, say: G.info.say, srcC: G.srcC, W: G.W, H: G.H };
    setTimeout(() => G && PZ.sayV(G.info.say, true), 600);
    if (E.on.win) setTimeout(() => E.on.win(stats), 2400);
  }

  function destroy() {
    if (!G) return;
    G.destroyed = true; clearInterval(G.timerId); clearTimeout(saveT);
    ui.tray.innerHTML = ''; ui.hand.classList.remove('on'); ui.ring.classList.remove('on'); ui.peek.classList.remove('on');
    ui.world.querySelectorAll('.final,.pop,.grp,.edgeguide').forEach((e) => e.remove());
    ui.game.classList.remove('on', 'hasTable'); ui.back.classList.remove('on'); G = null;
  }
  function exit() { persist(true); destroy(); E.on.exit && E.on.exit(); }

  /* ----------------------------------------------------------- ボタンの配線 */
  function init() {
    refs(); bindView();
    ui.tray.addEventListener('click', (e) => {
      const tp = e.target.closest('.tp'); if (!tp || !G) return; selectTray(G.pieces[+tp.dataset.i]);
    });
    ui.hand.addEventListener('click', () => { if (!G || !G.sel) return; if (G.sel.from === 'tray' && G.L.rot) rotate(G.sel.p); else deselect(); });
    ui.back.addEventListener('click', () => { if (G && G.sel && G.sel.from === 'table') returnToTray(G.sel.g); });
    ui.filters.addEventListener('click', (e) => { const b = e.target.closest('button[data-f]'); if (b && G) setFilter(b.dataset.f); });
    $('#gBack').onclick = exit;
    $('#gHint').onclick = hint;
    $('#zIn').onclick = () => { const v = viewSize(); G && zoomAt(v.w / 2, v.h / 2, cam.s * 1.35, true); };
    $('#zOut').onclick = () => { const v = viewSize(); G && zoomAt(v.w / 2, v.h / 2, cam.s / 1.35, true); };
    $('#zFit').onclick = () => { if (!G) return; if (Math.abs(cam.s - G.fit) < G.fit * 0.04) fitTable(true); else fitCam(true); };   // 盤面ぜんたい → もう一度でテーブルぜんたい
    ui.ref.addEventListener('click', () => setPeek(!ui.peek.classList.contains('on')));      // 右上の見本：タップで大きく／もう一度で閉じる
    ui.peek.addEventListener('click', () => setPeek(false));
    let rt = 0;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (G) { setRefSize(); fitCam(false); } }, 200); });
  }
  E.saveId = () => 'current'; E.init = init; E.start = start; E.exit = exit; E.fmt = fmt;
  E.active = () => !!G;
  E.debug = () => G;                                              // テスト用：内部状態を覗く
})();
