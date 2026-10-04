/* ui.js ― ホーム・写真の取り込み・クリア演出・シール帳・保護者設定 */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const S = Store.settings;
  const LV = Engine.LEVELS;
  const LV_STARS = { easy: 1, normal: 2, hard: 3, expert: 4 };
  const COUNTS = [24, 48, 100, 150, 200, 300];
  PZ.muted = !S.sound; PZ.voice = S.voice !== 0;

  /* ------------------------------------------------------- シール帳の「育ち」 */
  const TIERS = [
    { min: 0,  name: 'はじめての シールちょう', page: '#fff6e0', cover: '#ffb74d' },
    { min: 5,  name: 'みならい シールちょう',   page: '#e6f6ff', cover: '#4fc3f7' },
    { min: 15, name: 'じょうず シールちょう',   page: '#eafbe6', cover: '#66bb6a' },
    { min: 30, name: 'めいじん シールちょう',   page: '#fff0fb', cover: '#ec6fbf' },
    { min: 60, name: 'でんせつの シールちょう', page: '#232766', cover: '#7e57c2', night: true },
  ];
  const tierOf = (count) => { let t = 0; TIERS.forEach((x, i) => { if (count >= x.min) t = i; }); return t; };
  const frameOf = (n) => (n >= 200 ? 3 : n >= 100 ? 2 : n >= 50 ? 1 : 0);

  /* ---------------------------------------------------------------- 共通 */
  const urls = {};
  function blobUrl(id, x) { return urls[id] || (urls[id] = URL.createObjectURL(x instanceof Blob ? x : Store.recBlob(x))); }
  /* 失敗の理由を、端末の中に最大8件 記録する（おとなの設定から見られる。原因調べ用） */
  function logErr(tag, err, extra) {
    try {
      console.error(tag, err);
      const d = new Date(), t = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
      S.log = (S.log || []).concat(`${t} ${tag} ${(err && (err.name || '')) || ''} ${(err && err.message) || ''} ${extra || ''}`.replace(/\s+/g, ' ').trim()).slice(-8);
      Store.saveSettings();
    } catch (e) { }
  }
  function flash(msg, ms) { const f = $('#flash'); f.textContent = msg; f.classList.add('on'); clearTimeout(flash.t); flash.t = setTimeout(() => f.classList.remove('on'), ms || 2200); }
  function loading(on, msg) { const l = $('#loading'); l.classList.toggle('on', on); if (msg) l.querySelector('span').textContent = msg; }
  function show(id) { document.querySelectorAll('.scr').forEach((s) => s.classList.toggle('on', s.id === id)); }
  function closeSheet() { $('#sheet').classList.remove('on'); $('#sheet').innerHTML = ''; }
  function openSheet(html, cls) { const s = $('#sheet'); s.innerHTML = `<div class="box ${cls || ''}">${html}</div>`; s.classList.add('on'); return s.firstChild; }
  $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
  function armedButton(btn, label, action) {
    let armed = false, t;
    btn.onclick = () => {
      if (!armed) { armed = true; btn.textContent = 'もういちど おすと けします'; btn.classList.add('armed'); t = setTimeout(() => { armed = false; btn.textContent = label; btn.classList.remove('armed'); }, 3000); }
      else { clearTimeout(t); armed = false; btn.classList.remove('armed'); btn.textContent = label; action(); }
    };
  }
  /* 写真のパズルの形：「きりとり」を決めていればその形、なければ写真の形（0.5〜2にそろえる） */
  const photoAspect = (p) => Math.min(2, Math.max(0.5, p.crop ? p.crop.w / p.crop.h : p.w / p.h));
  const thumbUrl = (p) => (p.tbuf ? (urls[p.id + '_t'] || (urls[p.id + '_t'] = URL.createObjectURL(new Blob([p.tbuf], { type: 'image/jpeg' })))) : blobUrl(p.id, p));
  const aspectOf = (src, photos) => {
    if (src.k === 'collage') return (src.id || 'animals') === 'vehicles' ? 1 : 4 / 3;
    if (src.k === 'photo') { const p = photos.find((x) => x.id === src.id); return p ? photoAspect(p) : 1; }
    return 1;
  };

  /* 保存された写真の中身が読めないとき（iPhone の保存の都合など）：「？」ではなく、分かる表示にして記録する */
  const brokenSeen = new Set();
  document.addEventListener('error', (e) => {
    const t = e.target; if (!(t instanceof HTMLImageElement) || t.dataset.ph === undefined) return;
    if (!brokenSeen.has(t.dataset.ph)) { brokenSeen.add(t.dataset.ph); logErr('保存した写真が読めない', { name: 'ImgError', message: t.dataset.ph }, ''); }
    const sp = document.createElement('span'); sp.className = 'brokenph'; sp.textContent = 'よみこめません'; t.replaceWith(sp);
  }, true);
  /* 古い保存形式(Blob)の写真・シールは、読めるうちに新しい形式へ移す */
  async function migrateLegacy() {
    for (const store of ['photos', 'stickers']) {
      for (const r of await Store.all(store)) {
        if (r.buf || !r.blob) continue;
        try { const buf = await Store.toBuf(r.blob); if (buf && buf.byteLength) { const n = Object.assign({}, r, { buf, type: r.blob.type || 'image/jpeg' }); delete n.blob; await Store.put(store, n); } } catch (e) { /* 読めないものは そのまま */ }
      }
    }
  }

  /* ---------------------------------------------------------------- ホーム */
  /* 写真のサムネイルは、パズルと同じ縦横比で見せる（縦長は縦長、横長は横長。横にとても長いものは2マス分） */
  function thumbHtml(p, on) {
    const a = photoAspect(p), wide = a >= 1.6;
    const iw = wide ? 100 : (a >= 1 ? 100 : 100 * a), ih = wide ? 100 : (a >= 1 ? 100 / a : 100);
    return `<button class="th photo${wide ? ' wide' : ''}${on}"${wide ? ` style="aspect-ratio:${a}"` : ''} data-k="photo" data-id="${p.id}"><img alt="わたしの しゃしん" style="width:${iw}%;height:${ih}%" data-ph="${p.id}" src="${thumbUrl(p)}"></button>`;
  }
  const collageUrls = {};
  async function getCollageUrl(id) {
    if (collageUrls[id]) return collageUrls[id];
    try {
      const info = await Engine.Sources.load({ k: 'collage', id });
      collageUrls[id] = await PZ.canvasUrl(PZ.coverCanvas(info.img, 240, Math.round(240 / info.aspect)), 'image/jpeg', 0.8);
    } catch (e) { logErr('ぜんぶパズルの絵', e); collageUrls[id] = ''; }          // 絵が読めなくても、ホームは出す
    return collageUrls[id];
  }
  const COLLAGE_NAME = { animals: 'どうぶつ・しぜん ぜんぶ', vehicles: 'のりもの ぜんぶ' };
  const srcName = (src, photos) => (src.k === 'art' ? (PZ.art.find((a) => a.id === src.id) || PZ.art[0]).name : src.k === 'collage' ? COLLAGE_NAME[src.id || 'animals'] : 'わたしの しゃしん');
  const tabOf = (src) => (src.k === 'photo' ? 'photo' : src.k === 'collage' ? ((src.id || 'animals') === 'vehicles' ? 'vehicle' : 'nature') : ((PZ.art.find((a) => a.id === src.id) || {}).cat === 'vehicle' ? 'vehicle' : 'nature'));
  /* おすすめ：さいごに あそんだ記録から「つぎは これ」を決める。
     かんたんに終われたら 1だん上げ（ピースの数→むずかしさ の順に、交互に）。たいへんそうなら 1だん下げる。まだ集めていない絵を すすめる */
  const LV_ORDER = ['easy', 'normal', 'hard', 'expert'];
  function recommend(stickers) {
    if (!stickers.length) return null;
    const last = stickers.slice().sort((a, b) => a.ts - b.ts).pop();
    let ci = COUNTS.reduce((b, c, i) => (Math.abs(c - last.n) < Math.abs(COUNTS[b] - last.n) ? i : b), 0), li = Math.max(0, LV_ORDER.indexOf(last.level));
    const easy = last.time <= last.n * 7 && last.misses <= last.n * 0.15, hard = last.time > last.n * 16 || last.misses > last.n * 0.5;
    let why; const prevCi = ci, prevLi = li;
    if (easy) {
      if ((ci <= li + 1 && ci < COUNTS.length - 1) || li >= LV_ORDER.length - 1) ci = Math.min(COUNTS.length - 1, ci + 1); else li++;
      why = (ci === COUNTS.length - 1 && li === LV_ORDER.length - 1 && ci === prevCi && li === prevLi) ? 'いちばん むずかしいのも クリア！ すごい！' : 'じょうずに できたね！ ちょっと むずかしく してみよう';
    } else if (hard) {
      if (li > 0 && li >= ci) li--; else ci = Math.max(0, ci - 1);
      why = 'ちょっと たいへん だったかな？ すこし やさしく しよう';
    } else why = 'ちょうどいい むずかしさ！ もういっかい あそぼう';
    const done = new Set(stickers.map((s) => s.key));
    const pool = PZ.art.filter((a) => !done.has('a:' + a.id)), lastArt = PZ.art.find((a) => 'a:' + a.id === last.key);
    const pick = pool.find((a) => lastArt && a.cat !== lastArt.cat) || pool[0] || null;        // 前と ちがう しゅるいの え を ひとつ
    return { target: COUNTS[ci], level: LV_ORDER[li], why, art: pick };
  }
  async function renderHome() {
    const home = $('#home'), scroll = home.scrollTop;
    const [photos, stickers, save] = await Promise.all([Store.all('photos'), Store.all('stickers'), Store.get('saves', 'current')]);
    photos.sort((a, b) => a.ts - b.ts);
    if (S.src.k === 'photo' && !photos.find((p) => p.id === S.src.id)) S.src = { k: 'art', id: 'shoubousha' };
    const asp = aspectOf(S.src, photos), tier = tierOf(stickers.length);
    const sel = (k, id) => (S.src.k === k && (id === undefined || S.src.id === id) ? ' on' : '');
    if (!S.tab) S.tab = tabOf(S.src);
    const artBtn = (a) => `<button class="th${sel('art', a.id)}" data-k="art" data-id="${a.id}"><img alt="${a.name}" src="${PZ.svgUrl(a)}"></button>`;
    const colBtn = async (id, aspect) => {
      const wide = aspect >= 1.6, iw = wide ? 100 : (aspect >= 1 ? 100 : 100 * aspect), ih = wide ? 100 : (aspect >= 1 ? 100 / aspect : 100);
      return `<button class="th photo${wide ? ' wide' : ''}${S.src.k === 'collage' && (S.src.id || 'animals') === id ? ' on' : ''}"${wide ? ` style="aspect-ratio:${aspect}"` : ''} data-k="collage" data-id="${id}"><img alt="${COLLAGE_NAME[id]}" style="width:${iw}%;height:${ih}%" src="${await getCollageUrl(id)}"></button>`;
    };
    let thumbs = '';
    if (S.tab === 'vehicle') thumbs = PZ.art.filter((a) => a.cat === 'vehicle').map(artBtn).join('') + await colBtn('vehicles', 1);
    else if (S.tab === 'nature') thumbs = PZ.art.filter((a) => a.cat === 'nature').map(artBtn).join('') + await colBtn('animals', 4 / 3);
    else thumbs = photos.map((p) => thumbHtml(p, sel('photo', p.id))).join('') + '<button class="th add" id="addPhoto"><span>＋</span><small>しゃしん</small></button>';

    const rec = recommend(stickers);
    const recHtml = rec ? `<button class="recbox" id="recBtn" type="button">${rec.art ? `<img alt="" src="${PZ.svgUrl(rec.art)}">` : '<span class="star">★</span>'}<span><b>つぎは これ！</b><small>${rec.art ? rec.art.name + ' ・ ' : ''}${rec.target}ピース ・ ${LV[rec.level].name}</small><small class="why">${rec.why}</small></span></button>` : '';
    let resume = '';
    if (save) {
      let valid = !(save.desc.k === 'photo' && !photos.find((p) => p.id === save.desc.id));
      if (valid) {
        const pct = Math.round(save.placed.length / (save.rows * save.cols) * 100);
        resume = `<button class="resume" id="resume"><b>つづきから あそぶ</b><span>${save.rows * save.cols}ピース ・ ${LV[save.level].name} ・ ${pct}% ・ ${Engine.fmt(save.elapsed || 0)}</span></button>`;
      }
    }
    home.innerHTML = `
    <div class="hwrap">
      <header class="hhead">
        <h1>ジグソー<br>シールちょう</h1>
        <button id="goBook" class="bookbtn" style="--cover:${TIERS[tier].cover}"><i class="bk"></i><b>シールちょう</b><small>${stickers.length}まい</small></button>
        <button id="goZukan" class="zkbtn" aria-label="ずかん"><b>ずかん</b></button>
        <button id="goSet" class="gear" aria-label="おとなの せってい">⚙</button>
      </header>
      <button id="goHelp" class="helpbtn" type="button">？ あそびかたを みる</button>
      ${PZ.imgMode === 'none' ? '<div class="warn"><b>この ひょうじでは がぞうが ひらけません。</b><br>ファイルの プレビューなど、せいげんのある がめんで ひらいている かもしれません。Safari や Chrome などの ブラウザで ひらいてください。</div>' : ''}
      ${resume}
      ${recHtml}
      <h2>えを えらぶ</h2>
      <div class="tabs" id="tabs">
        ${[['vehicle', 'のりもの'], ['nature', 'どうぶつ・しぜん'], ['photo', 'しゃしん']].map(([k, t]) => `<button type="button" data-tab="${k}" class="${S.tab === k ? 'on' : ''}">${t}</button>`).join('')}
      </div>
      <div class="thumbs" id="thumbs">${thumbs}</div>
      <p class="picked">えらんだ え：<b>${srcName(S.src, photos)}</b>${S.src.k === 'photo' ? ' <button id="cropBtn" class="mini" type="button">きりとりを なおす</button>' : ''}</p>
      <h2>ピースの かず</h2>
      <div class="cnts" id="cnts">
        ${COUNTS.map((t) => { const g = Engine.gridFor(t, asp); return `<button class="cn${S.target === t ? ' on' : ''}${rec && rec.target === t ? ' rec' : ''}" data-t="${t}"><b>${g.n}</b><small>${g.cols}×${g.rows}</small></button>`; }).join('')}
      </div>
      <h2>むずかしさ</h2>
      <div class="lvs" id="lvs">
        ${Object.entries(LV).map(([k, v]) => `<button class="lv${S.level === k ? ' on' : ''}${rec && rec.level === k ? ' rec' : ''}" data-l="${k}"><b>${v.name}</b><span class="st">${'★'.repeat(LV_STARS[k])}</span><small>${v.desc}</small></button>`).join('')}
      </div>
      <button id="startBtn" class="start">はじめる ▶</button>
      <footer class="hfoot"><a href="../prototypes/index.html">試作ギャラリーへ</a></footer>
    </div>`;
    home.scrollTop = scroll;

    $('#thumbs').onclick = (e) => {
      const b = e.target.closest('.th'); if (!b) return;
      if (b.id === 'addPhoto') return addPhoto();
      S.src = { k: b.dataset.k, id: b.dataset.id }; Store.saveSettings(); PZ.snd.pick(); renderHome();
    };
    const rb = $('#recBtn'); if (rb) rb.onclick = () => { S.target = rec.target; S.level = rec.level; if (rec.art) { S.src = { k: 'art', id: rec.art.id }; S.tab = rec.art.cat === 'vehicle' ? 'vehicle' : 'nature'; } Store.saveSettings(); PZ.snd.pick(); renderHome(); };
    const cb = $('#cropBtn'); if (cb) cb.onclick = () => openCrop(S.src.id);
    $('#tabs').onclick = (e) => { const b = e.target.closest('button[data-tab]'); if (!b) return; S.tab = b.dataset.tab; Store.saveSettings(); PZ.snd.pick(); renderHome(); };
    $('#cnts').onclick = (e) => { const b = e.target.closest('.cn'); if (!b) return; S.target = +b.dataset.t; Store.saveSettings(); PZ.snd.pick(); renderHome(); };
    $('#lvs').onclick = (e) => { const b = e.target.closest('.lv'); if (!b) return; S.level = b.dataset.l; Store.saveSettings(); PZ.snd.pick(); renderHome(); };
    $('#startBtn').onclick = () => play({ desc: S.src, target: S.target, level: S.level });
    const r = $('#resume'); if (r) r.onclick = () => play({ desc: save.desc, level: save.level, save });
    $('#goBook').onclick = () => openBook();
    $('#goZukan').onclick = openZukan;
    $('#goHelp').onclick = openHelp;
    $('#goSet').onclick = async () => { if (await PZ.parentGate('せっていは おとなの かた用です')) openSettings(); };
  }
  async function play(o) {
    $('#flash').classList.remove('on');
    try { await Engine.start(o); show('game'); }
    catch (e) { loading(false); logErr('パズルをはじめる', e, JSON.stringify(o.desc)); if (e && e.name === 'PhotoBroken') { flash('この しゃしんは こわれていて ひらけません。おとなの せっていで けして、もういちど ついかしてください', 9000); renderHome(); return; } flash('この えは ひらけませんでした（' + ((e && e.name) || '') + ' ' + ((e && e.message) || '') + '）', 8000); renderHome(); }
  }
  Engine.on.exit = () => { contMs = 0; show('home'); renderHome(); };

  /* ---------------------------------------------------- あそんだ記録と きゅうけい */
  const dayKey = (d) => { d = d || new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const BREAKS = [[0, 'なし'], [10, '10ぷん'], [15, '15ふん'], [20, '20ぷん'], [30, '30ぷん']];
  let contMs = 0, saveAcc = 0;
  Engine.on.tick = (d) => {
    const k = dayKey(); S.play = S.play || {}; S.play[k] = (S.play[k] || 0) + d; saveAcc += d;
    if (saveAcc > 10000) { saveAcc = 0; Store.saveSettings(); }
    contMs += d;
    const lim = (S.breakMin === undefined ? 15 : S.breakMin) * 60000;
    if (lim && contMs >= lim && !document.querySelector('#sheet.on')) { contMs = 0; breakTime(); }
  };
  function breakTime() {
    Store.saveSettings();
    const box = openSheet(`<div class="clear"><div class="rest">☕</div><h2>ちょっと きゅうけい しよう</h2>
      <p class="fact">めを やすめて、とおくを みてみよう。<br>おみずを のんでも いいね。</p>
      <div class="row"><button class="btn" id="bkEnd" type="button">ここで おわる</button><button class="btn go" id="bkGo" type="button">もうすこし あそぶ</button></div></div>`, 'clearbox');
    PZ.sayV('ちょっと きゅうけい しよう。おめめを やすめてね', true);
    $('#bkGo', box).onclick = closeSheet;
    $('#bkEnd', box).onclick = () => { closeSheet(); Engine.exit(); };
  }
  function playReport(stickers) {
    const play = S.play || {}, days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push({ k: dayKey(d), w: '日月火水木金土'[d.getDay()], m: (play[dayKey(d)] || 0) / 60000 }); }
    const max = Math.max(15, ...days.map((x) => x.m)), tot = days.reduce((a, x) => a + x.m, 0);
    const wk = stickers.filter((s) => s.ts > Date.now() - 7 * 864e5), byN = {};
    wk.forEach((s) => { byN[s.n] = (byN[s.n] || 0) + 1; });
    const top = Object.entries(byN).sort((a, b) => b[1] - a[1])[0];
    return `<div class="rep"><div class="bars">${days.map((x) => `<div class="b"><i style="height:${Math.round(x.m / max * 100)}%"></i><small>${Math.round(x.m)}</small><span>${x.w}</span></div>`).join('')}</div>
      <p class="note">さいきん7にち：あそんだ じかん ${Math.round(tot)}ふん ・ クリア ${wk.length}かい${top ? ` ・ よくあそぶ かず ${top[0]}ピース` : ''}<br>きょう：${Math.round(days[6].m)}ふん ／ ぜんぶで クリア ${stickers.length}かい</p></div>`;
  }

  /* -------------------------------------------------------------- 写真の追加 */
  async function addPhoto() {
    if (!(await PZ.parentGate('しゃしんを えらぶのは おとなの かたが してください'))) return;
    // ゲートのあとに「本物の」ファイル選択ボタンを出す。プログラムからの自動オープンは、iPhoneなどで無視されることがあるため。
    const box = openSheet(`<h2>しゃしんを えらぶ</h2>
      <p class="note">下の ボタンを おして、しゃしんを えらんでください（まとめて いくつでも えらべます）。<br>しゃしんは この たんまつの 中だけで つかいます。</p>
      <label class="filebtn">しゃしんを えらぶ<input type="file" id="file" accept="image/*" multiple></label>
      <div class="row"><button class="btn" id="fCancel" type="button">やめる</button></div>`, 'setbox');
    $('#fCancel', box).onclick = closeSheet;
    $('#file', box).onchange = (e) => { const fs = [...e.target.files]; if (fs.length) importPhotos(fs); };
  }
  /* 写真を読みこむ：いくつかの方法を順番に試す（機種・ブラウザによって、使える方法がちがうため） */
  async function decodePhoto(file) {
    const errs = [];
    const tries = [
      ['img', async () => { const u = URL.createObjectURL(file); try { return await PZ.loadImage(u); } finally { setTimeout(() => URL.revokeObjectURL(u), 8000); } }],   // 向きは ブラウザが自動で反映
      ['bitmap+向き', () => createImageBitmap(file, { imageOrientation: 'from-image' })],
      ['reader', () => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => PZ.loadImage(fr.result).then(res, rej); fr.onerror = () => rej(fr.error || new Error('read')); fr.readAsDataURL(file); })],
      ['bitmap', () => createImageBitmap(file)],
    ];
    for (const [name, t] of tries) {
      try { const img = await t(); if ((img.naturalWidth || img.width) > 0) return img; errs.push(name + ':0px'); }
      catch (e) { errs.push(name + ':' + ((e && e.name) || 'err')); }
    }
    throw Object.assign(new Error(errs.join(',')), { stage: 'ひらけません（しゃしんの かたちが ちがうかも）' });
  }
  async function toJpegBlob(cv) {
    const b = await new Promise((r) => { try { cv.toBlob(r, 'image/jpeg', 0.88); } catch (e) { r(null); } });
    if (b) return b;
    const d = cv.toDataURL('image/jpeg', 0.88).split(','), bin = atob(d[1]), arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: 'image/jpeg' });
  }
  async function importPhotos(files) {
    closeSheet(); let ok = 0, vol = false; const bad = [];
    for (let i = 0; i < files.length; i++) {
      loading(true, `しゃしんを とりこみ中… ${i + 1}/${files.length}`);
      try {
        const img = await decodePhoto(files[i]), iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
        const sc = Math.min(1, 1600 / Math.max(iw, ih)), w = Math.max(1, Math.round(iw * sc)), h = Math.max(1, Math.round(ih * sc));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, w, h);
        if (img.close) try { img.close(); } catch (e) { }
        let blob; try { blob = await toJpegBlob(cv); } catch (e) { throw Object.assign(e, { stage: 'ちいさくできません' }); }
        const rec = { id: 'p' + Date.now() + '_' + i, ts: Date.now() + i, w, h, type: 'image/jpeg', buf: await Store.toBuf(blob) };
        if ((await Store.put('photos', rec)) === 'mem') vol = true;
        S.src = { k: 'photo', id: rec.id }; ok++;
      } catch (err) {
        const f = files[i], info = `[${f.type || '?'} ${(f.size / 1048576).toFixed(1)}MB]`;
        logErr('しゃしん取りこみ', err, info); bad.push(((err && err.stage) || 'とりこめません') + ' ' + info);
      }
    }
    S.tab = 'photo'; Store.saveSettings(); loading(false);
    flash(!bad.length ? `しゃしんを ${ok}まい ついかしました${vol ? '（この たんまつでは ほぞんできないため、いまだけ つかえます）' : ''}`
      : ok ? `${ok}まい ついか、${bad.length}まいは ${bad[0]}` : `しゃしんを とりこめませんでした：${bad[0]}`, (!bad.length && !vol) ? 2200 : 7000);
    renderHome();
    if (ok === 1 && !bad.length && S.src.k === 'photo') openCrop(S.src.id);          // 1枚だけ追加したときは、そのまま きりとり画面へ
  }

  /* ---------------------------------------------------------- 写真の きりとり */
  async function openCrop(id) {
    const rec = await Store.get('photos', id); if (!rec) return;
    let img; const blob = Store.recBlob(rec);
    try { img = await createImageBitmap(blob); } catch (e) { try { const u0 = URL.createObjectURL(blob); img = await PZ.loadImage(u0); } catch (e2) { flash('この しゃしんは ひらけません'); return; } }
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, base = Math.min(2, Math.max(0.5, iw / ih));
    const ASP = { auto: base, sq: 1, land: 4 / 3, port: 3 / 4, wide: 2 };
    const box = openSheet(`<h2>きりとりを きめる</h2>
      <p class="note" style="text-align:center">ゆびで うごかして、パズルにしたい ところを あわせてね。<br>2ほんの ゆびで おおきく／ちいさく できます。</p>
      <div class="cropstage"><canvas id="cropCv"></canvas></div>
      <div class="aspects" id="cropAsp">${[['auto', 'そのまま'], ['sq', 'しかく'], ['land', 'よこ'], ['port', 'たて'], ['wide', 'ワイド']].map(([k, t]) => `<button type="button" data-a="${k}">${t}</button>`).join('')}</div>
      <label class="zoomrow"><span>ちいさく</span><input type="range" id="cropZoom" min="1" max="5" step="0.01" value="1"><span>おおきく</span></label>
      <div class="row"><button class="btn" id="cropCancel" type="button">やめる</button><button class="btn go" id="cropOk" type="button">これで きめた</button></div>`, 'cropbox');
    const cv = $('#cropCv', box), sw = Math.round(Math.min(innerWidth * 0.88 - 40, 340)), sh = Math.round(Math.min(sw * 1.1, innerHeight * 0.42)), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = sw * dpr; cv.height = sh * dpr; cv.style.width = sw + 'px'; cv.style.height = sh + 'px'; cv.style.touchAction = 'none';
    const x = cv.getContext('2d'); x.scale(dpr, dpr);
    let key = 'auto', F = null, z = 1, k = 1, ox = 0, oy = 0;
    if (rec.crop) { const a = rec.crop.w / rec.crop.h; key = Object.keys(ASP).reduce((b, c) => (Math.abs(ASP[c] / a - 1) < Math.abs(ASP[b] / a - 1) ? c : b), 'auto'); }
    const frame = () => { const A = ASP[key], m = 14, aw = sw - m * 2, ah = sh - m * 2; const fw = A >= aw / ah ? aw : ah * A, fh = A >= aw / ah ? aw / A : ah; return { x: (sw - fw) / 2, y: (sh - fh) / 2, w: fw, h: fh }; };
    const kmin = () => Math.max(F.w / iw, F.h / ih);
    const clampPos = () => { ox = Math.min(F.x, Math.max(F.x + F.w - iw * k, ox)); oy = Math.min(F.y, Math.max(F.y + F.h - ih * k, oy)); };
    const setAspect = (nk, keepCenter) => {
      const c = keepCenter ? { x: (F.x + F.w / 2 - ox) / k, y: (F.y + F.h / 2 - oy) / k } : null;
      key = nk; F = frame(); k = kmin() * z;
      if (c) { ox = F.x + F.w / 2 - c.x * k; oy = F.y + F.h / 2 - c.y * k; } else { ox = F.x + (F.w - iw * k) / 2; oy = F.y + (F.h - ih * k) / 2; }
      clampPos(); draw(); sync();
    };
    const draw = () => {
      x.clearRect(0, 0, sw, sh); x.fillStyle = '#222'; x.fillRect(0, 0, sw, sh);
      x.drawImage(img, ox, oy, iw * k, ih * k);
      x.fillStyle = 'rgba(0,0,0,.55)'; x.beginPath(); x.rect(0, 0, sw, sh); x.rect(F.x, F.y, F.w, F.h); x.fill('evenodd');
      x.strokeStyle = '#fff'; x.lineWidth = 3; x.strokeRect(F.x, F.y, F.w, F.h);
      x.strokeStyle = 'rgba(255,255,255,.4)'; x.lineWidth = 1; x.beginPath();
      for (let i = 1; i < 3; i++) { x.moveTo(F.x + F.w * i / 3, F.y); x.lineTo(F.x + F.w * i / 3, F.y + F.h); x.moveTo(F.x, F.y + F.h * i / 3); x.lineTo(F.x + F.w, F.y + F.h * i / 3); }
      x.stroke();
    };
    const sync = () => { $('#cropZoom', box).value = z; box.querySelectorAll('#cropAsp button').forEach((b) => b.classList.toggle('on', b.dataset.a === key)); };
    const setZoom = (nz, px, py) => {                                          // (px,py) の下の点が動かないように拡大
      nz = Math.min(5, Math.max(1, nz)); const wx = (px - ox) / k, wy = (py - oy) / k;
      z = nz; k = kmin() * z; ox = px - wx * k; oy = py - wy * k; clampPos(); draw(); sync();
    };
    F = frame(); k = kmin() * z;
    if (rec.crop) { z = Math.min(5, Math.max(1, (F.w / rec.crop.w) / kmin())); k = kmin() * z; ox = F.x - rec.crop.x * k; oy = F.y - rec.crop.y * k; } else { ox = F.x + (F.w - iw * k) / 2; oy = F.y + (F.h - ih * k) / 2; }
    clampPos(); draw(); sync();
    // 指の操作：1本=うごかす／2本=つまんで大きさ
    const ptrs = new Map(); let pinch = null;
    const lp = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.addEventListener('pointerdown', (e) => { try { cv.setPointerCapture(e.pointerId); } catch (_) { } ptrs.set(e.pointerId, lp(e)); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z }; } });
    cv.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return; const p = lp(e), q = ptrs.get(e.pointerId);
      if (ptrs.size === 1) { ox += p.x - q.x; oy += p.y - q.y; clampPos(); draw(); }
      else if (ptrs.size === 2 && pinch) { ptrs.set(e.pointerId, p); const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); setZoom(pinch.z * d / Math.max(1, pinch.d), (a.x + b.x) / 2, (a.y + b.y) / 2); }
      ptrs.set(e.pointerId, p);
    });
    const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); const p = lp(e); setZoom(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), p.x, p.y); }, { passive: false });
    $('#cropZoom', box).oninput = (e) => setZoom(+e.target.value, F.x + F.w / 2, F.y + F.h / 2);
    $('#cropAsp', box).onclick = (e) => { const b = e.target.closest('button[data-a]'); if (b) setAspect(b.dataset.a, true); };
    $('#cropCancel', box).onclick = () => { if (img.close) try { img.close(); } catch (e) { } closeSheet(); };
    $('#cropOk', box).onclick = async () => {
      const crop = { x: Math.max(0, Math.round((F.x - ox) / k)), y: Math.max(0, Math.round((F.y - oy) / k)), w: Math.round(F.w / k), h: Math.round(F.h / k) };
      crop.w = Math.min(crop.w, iw - crop.x); crop.h = Math.min(crop.h, ih - crop.y);
      const full = Math.abs(crop.x) < 2 && Math.abs(crop.y) < 2 && Math.abs(crop.w - iw) < 3 && Math.abs(crop.h - ih) < 3;     // 全体のままなら、きりとりなし
      const t = 240, sc = t / Math.max(crop.w, crop.h), tc = document.createElement('canvas'); tc.width = Math.max(1, Math.round(crop.w * sc)); tc.height = Math.max(1, Math.round(crop.h * sc));
      tc.getContext('2d').drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, tc.width, tc.height);
      const next = Object.assign({}, rec, { crop: full ? null : crop, tbuf: await Store.toBuf(await toJpegBlob(tc)) });
      if (full) { delete next.crop; }
      await Store.put('photos', next);
      if (urls[id + '_t']) { try { URL.revokeObjectURL(urls[id + '_t']); } catch (e) { } delete urls[id + '_t']; }
      if (img.close) try { img.close(); } catch (e) { }
      closeSheet(); S.src = { k: 'photo', id }; S.tab = 'photo'; Store.saveSettings(); flash('きりとりを きめました'); renderHome();
    };
  }

  /* ----------------------------------------------------------------- クリア */
  Engine.on.win = async (st) => {
    const before = (await Store.all('stickers')).length;
    // シールの絵：完成した絵の真ん中を正方形に切り抜く
    const side = Math.min(st.srcC.width, st.srcC.height), cv = document.createElement('canvas'); cv.width = cv.height = 240;
    cv.getContext('2d').drawImage(st.srcC, (st.srcC.width - side) / 2, (st.srcC.height - side) / 2, side, side, 0, 0, 240, 240);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.82));
    const rec = { id: 's' + Date.now(), ts: Date.now(), key: st.key, name: st.name, n: st.n, level: st.level, time: st.time, misses: st.misses, type: 'image/jpeg', buf: await Store.toBuf(blob) };
    try { await Store.put('stickers', rec); } catch (e) { }
    const bestKey = `${st.key}|${st.n}|${st.level}`, prev = S.best[bestKey], newBest = prev && st.time < prev;
    if (!prev || st.time < prev) { S.best[bestKey] = st.time; Store.saveSettings(); }
    const t0 = tierOf(before), t1 = tierOf(before + 1);
    const url = blobUrl(rec.id, blob);
    const box = openSheet(`
      <div class="clear">
        <h2>シール ゲット！</h2>
        <div class="stk big f${frameOf(st.n)}"><div class="ring"><img alt="" src="${url}"></div></div>
        <p class="meta">${st.n}ピース ・ ${LV[st.level].name} ・ ${Engine.fmt(st.time)}</p>
        <p class="meta sub">まちがい ${st.misses}かい${newBest ? ' ・ <b class="gold">ベストタイム こうしん！</b>' : ''}</p>
        ${t1 > t0 ? `<div class="grow">シールちょうが そだったよ！<br><b>${TIERS[t1].name}</b></div>` : `<p class="meta sub">${before + 1}まい あつまったよ${TIERS[t1 + 1] ? `（あと ${TIERS[t1 + 1].min - (before + 1)}まいで シールちょうが そだつよ）` : ''}</p>`}
        <div class="row"><button id="cBook" class="btn">シールちょう</button><button id="cNext" class="btn go">つぎへ ▶</button></div>
      </div>`, 'clearbox');
    $('#cBook', box).onclick = () => { closeSheet(); openBook(true); };
    $('#cNext', box).onclick = () => { closeSheet(); Engine.exit(); };
    PZ.snd.ok();
  };


  /* ------------------------------------------------------------- あそびかた */
  const IC = {
    pick:  '<svg viewBox="0 0 64 64"><rect x="12" y="12" width="32" height="32" rx="7" fill="#ffb066" stroke="#fff" stroke-width="3"/><rect x="12" y="12" width="32" height="32" rx="7" fill="none" stroke="#ffe14d" stroke-width="4"/><circle cx="46" cy="46" r="11" fill="rgba(255,138,60,.3)" stroke="#ff8a3c" stroke-width="3"/><circle cx="46" cy="46" r="3.5" fill="#ff8a3c"/></svg>',
    place: '<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="6" fill="#fdf1d8" stroke="#b9925a" stroke-width="2.5"/><path d="M8 24h48M8 40h48M24 8v48M40 8v48" stroke="#d7bb8a" stroke-width="1.5" stroke-dasharray="3 3"/><rect x="25" y="25" width="14" height="14" rx="3" fill="#ffb066" stroke="#fff" stroke-width="2"/><circle cx="46" cy="46" r="9" fill="rgba(255,138,60,.3)" stroke="#ff8a3c" stroke-width="3"/></svg>',
    join:  '<svg viewBox="0 0 64 64"><rect x="8" y="22" width="22" height="22" rx="5" fill="#ffb066" stroke="#fff" stroke-width="3"/><rect x="34" y="22" width="22" height="22" rx="5" fill="#8ed8ff" stroke="#fff" stroke-width="3"/><path d="M28 33h8" stroke="#3ec598" stroke-width="5" stroke-linecap="round"/><circle cx="19" cy="52" r="7" fill="rgba(255,138,60,.3)" stroke="#ff8a3c" stroke-width="3"/></svg>',
    table: '<svg viewBox="0 0 64 64"><rect x="6" y="6" width="52" height="52" rx="8" fill="none" stroke="#b9925a" stroke-width="3" stroke-dasharray="6 5"/><rect x="21" y="21" width="22" height="22" rx="3" fill="#fdf1d8" stroke="#b9925a" stroke-width="2"/><rect x="9" y="44" width="11" height="11" rx="3" fill="#ffb066" stroke="#fff" stroke-width="2"/><rect x="22" y="44" width="11" height="11" rx="3" fill="#8ed8ff" stroke="#fff" stroke-width="2"/></svg>',
    zoom:  '<svg viewBox="0 0 64 64"><path d="M14 50 26 38M50 14 38 26" stroke="#7a4b16" stroke-width="5" stroke-linecap="round"/><path d="M14 36v14h14M50 28V14H36" fill="none" stroke="#7a4b16" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="14" cy="50" r="5" fill="#ff8a3c"/><circle cx="50" cy="14" r="5" fill="#ff8a3c"/></svg>',
    ref:   '<svg viewBox="0 0 64 64"><rect x="26" y="8" width="30" height="22" rx="4" fill="#bfe6ff" stroke="#fff" stroke-width="3"/><circle cx="40" cy="19" r="5" fill="#ffd93d"/><path d="M26 30l10-8 8 6 12-8" fill="none" stroke="#3ec598" stroke-width="3"/><circle cx="46" cy="42" r="10" fill="rgba(255,138,60,.3)" stroke="#ff8a3c" stroke-width="3"/><circle cx="46" cy="42" r="3" fill="#ff8a3c"/></svg>',
    hint:  '<svg viewBox="0 0 64 64"><rect x="8" y="30" width="28" height="22" rx="11" fill="#ff8a3c"/><path d="M42 14l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ffd93d" stroke="#e8a100" stroke-width="2" stroke-linejoin="round"/><path d="M48 40l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#ffd93d"/></svg>',
    rot:   '<svg viewBox="0 0 64 64"><rect x="18" y="18" width="28" height="28" rx="6" fill="#ffb066" stroke="#fff" stroke-width="3"/><path d="M14 30a20 20 0 0 1 34-12" fill="none" stroke="#7e57c2" stroke-width="5" stroke-linecap="round"/><path d="M50 8v12H38" fill="none" stroke="#7e57c2" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const HELP = [
    ['pick',  'えらぶ',               '下の ピースを タップすると、左上に 大きく 出ます。もういちど タップすると やめられます。'],
    ['place', 'おく',                 '盤面の、そのピースが はまる ばしょを タップ。あっていれば ぱちっと はまります。まちがえても だいじょうぶ。'],
    ['join',  'くっつける',           'えらんだ ピースが つながる ピースを タップ。となりどうしなら、そこに くっつきます。'],
    ['table', 'テーブル',             '盤面の まわりの 点線の中の あいている ところを タップすると、ピースを いったん おいておけます。くっついた かたまりは、タップで もちあげて、盤面の あう ばしょを タップすると まとめて はまります。もちあげたあと「おきばへ もどす」で ピース置き場に もどせます。'],
    ['zoom',  '大きく・小さく',       '2本の ゆびで ひろげる／つまむ。1本の ゆびで うごかします。右上の ⤢ ボタンは、盤面ぜんたい → もう一度で テーブルぜんたい。'],
    ['ref',   'みほん',               '右上の 小さな 絵を タップすると 大きく 見えます。もう一度 タップで とじます。'],
    ['hint',  'ヒント・ふち・なか',   '「ヒント」は、つぎに おけるピースを ひからせます。「ふち」「なか」で ピース置き場を しぼれます。'],
    ['rot',   'ちょうむずかしい',     'ピースが まわっています。えらんだピース（左上の 大きな ピース）を タップして、むきを そろえてから おきます。'],
  ];
  function openHelp() {
    const box = openSheet(`<h2>あそびかた</h2>${HELP.map(([k, t, d]) => `<div class="hrow">${IC[k]}<div><b>${t}</b><p>${d}</p></div></div>`).join('')}
      <p class="note">とちゅうで やめても「つづきから」で つづけられます。写真は この たんまつの 中だけで つかいます。</p>
      <div class="row"><button class="btn go" id="hClose" type="button">わかった</button></div>`, 'helpbox');
    $('#hClose', box).onclick = closeSheet;
  }
  $('#gHelp').onclick = openHelp;

  /* --------------------------------------------------------------- シール帳 */
  /* ---------------------------------------------------------------- ずかん */
  const FACT = {
    neko: 'ねこは ひげで まわりを かんじるよ。ニャーと なくよ。', kuma: 'くまは はちみつが だいすき。ふゆは ほらあなで ねるよ。', sakana: 'さかなは みずの なかで ひれを うごかして およぐよ。',
    kuruma: 'くるまは タイヤが まわって はしるよ。ブッブー！', ie: 'おうちは わたしたちが ねたり ごはんを たべたりする ところ。', hana: 'おはなは たいようが だいすき。みつを すいに ちょうちょが くるよ。',
    roketto: 'ロケットは そらの たかい ところまで とんで いくよ。ごー、よん、さん、にー、いち、ゼロ！', pengin: 'ペンギンは とべないけれど、みずの なかを じょうずに およぐよ。',
    shoubousha: 'しょうぼうしゃは ひを けす くるま。ホースから みずが でるよ。ウーカンカン！', patoka: 'パトカーは まちを まもる くるま。ピーポー、ウーウー！', kyuukyuusha: 'きゅうきゅうしゃは びょうきや けがの ひとを びょういんに はこぶよ。ピーポーピーポー！',
    shoberu: 'ショベルカーは アームで つちを ほるよ。パワフル！', shinkansen: 'しんかんせんは とっても はやい でんしゃ。ビューン！', dump: 'ダンプカーは にだいを かたむけて、すなや いしを おろすよ。',
    basu: 'バスは たくさんの ひとを のせて はしるよ。しゅっぱつ しんこう！', hikouki: 'ひこうきは つばさで そらを とぶよ。ゴォー！', gomi: 'ごみしゅうしゅうしゃは まちを きれいに してくれる くるま。ごみを ぎゅーっと つぶすよ。',
    mixer: 'ミキサーしゃは ドラムが ぐるぐる まわって、コンクリートを まぜるよ。', crane: 'クレーンしゃは たかい ところまで おもい にもつを もちあげるよ。', tractor: 'トラクターは はたけを たがやす おおきな タイヤの くるま。',
    sl: 'SLは ほのおと けむりで はしる、むかしの きかんしゃ。ポッポー！', heli: 'ヘリコプターは プロペラを まわして、その ばで うかべるよ。バラバラバラ！',
    tyrano: 'ティラノサウルスは きょうりゅうの おうさま。おおきな くちと するどい はを もって いたよ。', tricera: 'トリケラトプスは かおに 3ぼんの つのが あるよ。くさを たべて いたんだって。',
    lion: 'ライオンは どうぶつの おうさま。おすには たてがみが あるよ。ガオー！', zou: 'ぞうは はなが とっても ながいよ。みずを すって シャワーも できるよ。', kirin: 'きりんは くびが ながくて、たかい きの はっぱを たべるよ。', panda: 'パンダは ささを もぐもぐ たべるよ。しろと くろの もようが かわいいね。',
  };
  async function openZukan() {
    const stickers = await Store.all('stickers'), done = new Set(stickers.map((s) => s.key));
    const arts = PZ.art.filter((a) => FACT[a.id] || a.cat), got = arts.filter((a) => done.has('a:' + a.id)).length;
    const cell = (a) => { const ok = done.has('a:' + a.id); return `<button type="button" class="zk${ok ? ' got' : ''}" data-id="${a.id}">${ok ? `<img alt="" src="${PZ.svgUrl(a)}">` : '<i class="qq">？</i>'}<span>${ok ? a.name.replace(/（.*/, '') : '？？？'}</span></button>`; };
    const sec = (cat, t) => `<h3>${t}</h3><div class="zgrid">${arts.filter((a) => (a.cat === 'vehicle') === (cat === 'vehicle')).map(cell).join('')}</div>`;
    const box = openSheet(`<h2>ずかん</h2><p class="note" style="text-align:center">パズルを クリアすると、えが ひらくよ（${got} / ${arts.length}）</p>
      ${sec('vehicle', 'のりもの')}${sec('nature', 'どうぶつ・しぜん')}
      <div class="row"><button class="btn" id="zClose" type="button">とじる</button></div>`, 'zukanbox');
    $('#zClose', box).onclick = closeSheet;
    box.querySelector('.zgrid').parentNode.onclick = (e) => {
      const b = e.target.closest('.zk'); if (!b) return;
      const a = PZ.art.find((x) => x.id === b.dataset.id), ok = done.has('a:' + a.id);
      if (!ok) { PZ.snd.soft(); flash('まだ あそんで いないよ。パズルを クリアすると ひらくよ'); return; }
      const d2 = openSheet(`<div class="clear"><div class="zbig"><img alt="" src="${PZ.svgUrl(a)}"></div><h2>${a.name}</h2><p class="fact">${FACT[a.id] || ''}</p>
        <div class="row"><button class="btn" id="zBack" type="button">もどる</button><button class="btn go" id="zSay" type="button">🔊 よんで</button></div></div>`, 'clearbox');
      PZ.sayV(a.name.replace(/（.*/, '') + '。' + (FACT[a.id] || ''), true);
      $('#zSay', d2).onclick = () => PZ.sayV(a.name.replace(/（.*/, '') + '。' + (FACT[a.id] || ''), true);
      $('#zBack', d2).onclick = () => { closeSheet(); openZukan(); };
    };
  }

  async function openBook(fromClear) {
    const stickers = (await Store.all('stickers')).sort((a, b) => a.ts - b.ts);
    const count = stickers.length, ti = tierOf(count), T = TIERS[ti], next = TIERS[ti + 1];
    const pages = Math.max(1, Math.ceil((count + 1) / 6));
    const book = $('#book');
    book.style.setProperty('--page', T.page); book.style.setProperty('--cover', T.cover); book.classList.toggle('night', !!T.night);
    let slots = '';
    for (let p = 0; p < pages; p++) {
      slots += `<div class="pg">`;
      for (let k = 0; k < 6; k++) {
        const i = p * 6 + k, s = stickers[i];
        if (s) slots += `<button class="slot" data-i="${i}"><div class="stk f${frameOf(s.n)}" style="--r:${((i * 37) % 11) - 5}deg"><div class="ring"><img alt="" src="${blobUrl(s.id, s)}"></div><span class="cap">${s.n}<small>${'★'.repeat(LV_STARS[s.level] || 1)}</small></span></div></button>`;
        else slots += `<div class="slot empty${i === count ? ' next' : ''}"><span>${i === count ? '?' : ''}</span></div>`;
      }
      slots += `</div>`;
    }
    const prog = next ? Math.round((count - T.min) / (next.min - T.min) * 100) : 100;
    book.innerHTML = `
      <header class="bkhead"><button id="bkBack" class="rb">←</button>
        <div class="bkt"><b>${T.name}</b><small>${count}まい${next ? ` ・ あと ${next.min - count}まいで そだつよ` : ' ・ いちばん そだったよ'}</small>
        <div class="bar"><i style="width:${prog}%"></i></div></div></header>
      <div class="pages" id="pages">${slots}</div>
      <div class="dots">${Array.from({ length: pages }, (_, i) => `<i data-i="${i}"></i>`).join('')}</div>`;
    show('book');
    const pg = $('#pages'); pg.scrollLeft = pg.clientWidth * (pages - 1);
    const dots = book.querySelectorAll('.dots i');
    const upd = () => { const i = Math.round(pg.scrollLeft / Math.max(1, pg.clientWidth)); dots.forEach((d, j) => d.classList.toggle('on', j === i)); };
    pg.addEventListener('scroll', upd); setTimeout(upd, 50);
    $('#bkBack').onclick = () => { if (Engine.active()) show('game'); else { show('home'); renderHome(); } };
    if (fromClear) { $('#bkBack').onclick = () => { Engine.exit(); }; }
    pg.onclick = (e) => {
      const b = e.target.closest('.slot[data-i]'); if (!b) return;
      const s = stickers[+b.dataset.i], d = new Date(s.ts);
      const box = openSheet(`<div class="clear"><div class="stk big f${frameOf(s.n)}"><div class="ring"><img alt="" src="${blobUrl(s.id, s)}"></div></div>
        <p class="meta">${s.name} ・ ${s.n}ピース</p><p class="meta sub">${LV[s.level] ? LV[s.level].name : ''} ・ ${Engine.fmt(s.time)} ・ まちがい ${s.misses}かい<br>${d.getFullYear()}ねん ${d.getMonth() + 1}がつ ${d.getDate()}にち</p>
        <div class="row"><button class="btn" id="sClose">とじる</button></div></div>`, 'clearbox');
      $('#sClose', box).onclick = closeSheet;
    };
  }

  /* ------------------------------------------------------------- 保護者設定 */
  async function openSettings() {
    const photos = (await Store.all('photos')).sort((a, b) => a.ts - b.ts), persistent = await Store.persistent(), allStickers = await Store.all('stickers');
    const box = openSheet(`
      <h2>おとなの せってい</h2>
      <h3>おと</h3>
      <div class="seg" id="sSound"><button data-s="1" class="${S.sound ? 'on' : ''}">あり</button><button data-s="0" class="${S.sound ? '' : 'on'}">なし</button></div>
      <h3>あそんだ きろく（おとな用）</h3>
      ${playReport(allStickers)}
      <h3>きゅうけいの おしらせ</h3>
      <div class="seg" id="sBreak">${BREAKS.map(([m, t]) => `<button data-m="${m}" class="${(S.breakMin === undefined ? 15 : S.breakMin) === m ? 'on' : ''}">${t}</button>`).join('')}</div>
      <p class="note">つづけて あそんだ じかんが たつと、「ちょっと きゅうけい しよう」と おしらせします。</p>
      <h3>こえの ガイド（ひらがなで はなしかけます）</h3>
      <div class="seg" id="sVoice"><button data-s="1" class="${S.voice !== 0 ? 'on' : ''}">あり</button><button data-s="0" class="${S.voice !== 0 ? '' : 'on'}">なし</button></div>
      <p class="note">「おと」を なしにすると、こえも でません。この たんまつの 読み上げ機能を つかいます。</p>
      <h3>とりこんだ しゃしん（${photos.length}まい）</h3>
      ${photos.length ? '<p class="note">「よみこめません」と出る しゃしんは、いったん「けす」で けして、もういちど ついかしてください。</p>' : ''}
      <div class="plist">${photos.length ? photos.map((p) => `<div class="pi"><img alt="" data-ph="${p.id}" src="${blobUrl(p.id, p)}"><button data-id="${p.id}" class="del">けす</button></div>`).join('') : '<p class="note">まだ ありません</p>'}</div>
      <h3>きろく</h3>
      <button class="dng" id="rBest">ベストタイムを けす</button>
      <button class="dng" id="rStk">シールを ぜんぶ けす</button>
      <h3>もんだいが あったとき</h3>
      ${(S.log && S.log.length) ? `<div class="logbox">${S.log.slice().reverse().map((l) => `<p>${l.replace(/</g, '&lt;')}</p>`).join('')}</div><button class="dng" id="rLog" type="button">きろくを けす</button>` : '<p class="note">エラーの きろくは ありません</p>'}
      <p class="note">写真・シール・きろくは、この たんまつの中だけに保存されます。インターネットには送りません。${persistent ? '' : '<br><b>いまは一時保存です（ブラウザを閉じると消えます）。</b>'}</p>
      <div class="row"><button class="btn" id="sClose">とじる</button></div>`, 'setbox');
    box.querySelectorAll('#sSound button').forEach((b) => b.onclick = () => {
      S.sound = +b.dataset.s; PZ.muted = !S.sound; Store.saveSettings();
      box.querySelectorAll('#sSound button').forEach((x) => x.classList.toggle('on', x === b)); PZ.snd.ok();
    });
    box.querySelectorAll('#sBreak button').forEach((b) => b.onclick = () => {
      S.breakMin = +b.dataset.m; contMs = 0; Store.saveSettings(); box.querySelectorAll('#sBreak button').forEach((x) => x.classList.toggle('on', x === b));
    });
    box.querySelectorAll('#sVoice button').forEach((b) => b.onclick = () => {
      S.voice = +b.dataset.s; PZ.voice = S.voice !== 0; Store.saveSettings();
      box.querySelectorAll('#sVoice button').forEach((x) => x.classList.toggle('on', x === b)); if (PZ.voice) PZ.sayV('こんにちは。いっしょに あそぼうね', true);
    });
    box.querySelectorAll('.del').forEach((b) => armedButton(b, 'けす', async () => { await Store.del('photos', b.dataset.id); const sv = await Store.get('saves', 'current'); if (sv && sv.desc.k === 'photo' && sv.desc.id === b.dataset.id) await Store.del('saves', 'current'); closeSheet(); openSettings(); }));
    const rl = $('#rLog', box); if (rl) rl.onclick = () => { S.log = []; Store.saveSettings(); closeSheet(); openSettings(); };
    armedButton($('#rBest', box), 'ベストタイムを けす', () => { S.best = {}; Store.saveSettings(); flash('けしました'); });
    armedButton($('#rStk', box), 'シールを ぜんぶ けす', async () => { await Store.clear('stickers'); flash('けしました'); });
    $('#sClose', box).onclick = () => { closeSheet(); renderHome(); };
  }

  /* ------------------------------------------------------------------ 起動 */
  Engine.init();
  PZ.probeImages().catch(() => { }).then(() => migrateLegacy().catch(() => { })).then(() => renderHome());
})();
