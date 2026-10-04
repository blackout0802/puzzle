/* ui.js ― ホーム・写真の取り込み・クリア演出・シール帳・保護者設定 */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const S = Store.settings;
  const LV = Engine.LEVELS;
  const LV_STARS = { easy: 1, normal: 2, hard: 3, expert: 4 };
  const COUNTS = [24, 48, 100, 150, 200, 300];
  PZ.muted = !S.sound;

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
  function blobUrl(id, blob) { return urls[id] || (urls[id] = URL.createObjectURL(blob)); }
  function flash(msg) { const f = $('#flash'); f.textContent = msg; f.classList.add('on'); clearTimeout(flash.t); flash.t = setTimeout(() => f.classList.remove('on'), 2200); }
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
  const aspectOf = (src, photos) => {
    if (src.k === 'collage') return 2;
    if (src.k === 'photo') { const p = photos.find((x) => x.id === src.id); return p ? Math.min(2, Math.max(0.5, p.w / p.h)) : 1; }
    return 1;
  };

  /* ---------------------------------------------------------------- ホーム */
  let collageUrl = null;
  async function getCollageUrl() {
    if (collageUrl) return collageUrl;
    const info = await Engine.Sources.load({ k: 'collage' });
    collageUrl = PZ.coverCanvas(info.img, 240, 120).toDataURL('image/jpeg', 0.8); return collageUrl;
  }
  async function renderHome() {
    const home = $('#home'), scroll = home.scrollTop;
    const [photos, stickers, save] = await Promise.all([Store.all('photos'), Store.all('stickers'), Store.get('saves', 'current')]);
    photos.sort((a, b) => a.ts - b.ts);
    if (S.src.k === 'photo' && !photos.find((p) => p.id === S.src.id)) S.src = { k: 'art', id: 'neko' };
    const asp = aspectOf(S.src, photos), tier = tierOf(stickers.length);
    const sel = (k, id) => (S.src.k === k && (id === undefined || S.src.id === id) ? ' on' : '');
    const cUrl = await getCollageUrl();

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
        <button id="goSet" class="gear" aria-label="おとなの せってい">⚙</button>
      </header>
      ${resume}
      <h2>えを えらぶ</h2>
      <div class="thumbs" id="thumbs">
        ${PZ.art.map((a) => `<button class="th${sel('art', a.id)}" data-k="art" data-id="${a.id}"><img alt="${a.name}" src="${PZ.svgUrl(a)}"></button>`).join('')}
        <button class="th wide${sel('collage')}" data-k="collage"><img alt="どうぶつ ぜんいん" src="${cUrl}"></button>
        ${photos.map((p) => `<button class="th${sel('photo', p.id)}" data-k="photo" data-id="${p.id}"><img alt="わたしの しゃしん" src="${blobUrl(p.id, p.blob)}"></button>`).join('')}
        <button class="th add" id="addPhoto"><span>＋</span><small>しゃしん</small></button>
      </div>
      <h2>ピースの かず</h2>
      <div class="cnts" id="cnts">
        ${COUNTS.map((t) => { const g = Engine.gridFor(t, asp); return `<button class="cn${S.target === t ? ' on' : ''}" data-t="${t}"><b>${g.n}</b><small>${g.cols}×${g.rows}</small></button>`; }).join('')}
      </div>
      <h2>むずかしさ</h2>
      <div class="lvs" id="lvs">
        ${Object.entries(LV).map(([k, v]) => `<button class="lv${S.level === k ? ' on' : ''}" data-l="${k}"><b>${v.name}</b><span class="st">${'★'.repeat(LV_STARS[k])}</span><small>${v.desc}</small></button>`).join('')}
      </div>
      <button id="startBtn" class="start">はじめる ▶</button>
      <footer class="hfoot"><a href="../prototypes/index.html">試作ギャラリーへ</a></footer>
    </div>`;
    home.scrollTop = scroll;

    $('#thumbs').onclick = (e) => {
      const b = e.target.closest('.th'); if (!b) return;
      if (b.id === 'addPhoto') return addPhoto();
      S.src = b.dataset.k === 'collage' ? { k: 'collage' } : { k: b.dataset.k, id: b.dataset.id }; Store.saveSettings(); PZ.snd.pick(); renderHome();
    };
    $('#cnts').onclick = (e) => { const b = e.target.closest('.cn'); if (!b) return; S.target = +b.dataset.t; Store.saveSettings(); PZ.snd.pick(); renderHome(); };
    $('#lvs').onclick = (e) => { const b = e.target.closest('.lv'); if (!b) return; S.level = b.dataset.l; Store.saveSettings(); PZ.snd.pick(); renderHome(); };
    $('#startBtn').onclick = () => play({ desc: S.src, target: S.target, level: S.level });
    const r = $('#resume'); if (r) r.onclick = () => play({ desc: save.desc, level: save.level, save });
    $('#goBook').onclick = () => openBook();
    $('#goSet').onclick = async () => { if (await PZ.parentGate('せっていは おとなの かた用です')) openSettings(); };
  }
  async function play(o) {
    $('#flash').classList.remove('on');
    try { await Engine.start(o); show('game'); }
    catch (e) { loading(false); flash('この えは ひらけませんでした'); renderHome(); }
  }
  Engine.on.exit = () => { show('home'); renderHome(); };

  /* -------------------------------------------------------------- 写真の追加 */
  async function addPhoto() {
    if (!(await PZ.parentGate('しゃしんを えらぶのは おとなの かたが してください'))) return;
    $('#file').click();
  }
  $('#file').onchange = async (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    loading(true, 'しゃしんを とりこみ中…');
    try {
      const img = await PZ.fileImage(f), iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      const sc = Math.min(1, 1600 / Math.max(iw, ih)), w = Math.round(iw * sc), h = Math.round(ih * sc);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h);
      const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.88));
      if (!blob) throw new Error('blob');
      const rec = { id: 'p' + Date.now(), ts: Date.now(), w, h, blob };
      await Store.put('photos', rec);
      S.src = { k: 'photo', id: rec.id }; Store.saveSettings();
      flash('しゃしんを ついかしました');
    } catch (err) { flash('この しゃしんは よみこめませんでした'); }
    loading(false); renderHome();
  };

  /* ----------------------------------------------------------------- クリア */
  Engine.on.win = async (st) => {
    const before = (await Store.all('stickers')).length;
    // シールの絵：完成した絵の真ん中を正方形に切り抜く
    const side = Math.min(st.srcC.width, st.srcC.height), cv = document.createElement('canvas'); cv.width = cv.height = 240;
    cv.getContext('2d').drawImage(st.srcC, (st.srcC.width - side) / 2, (st.srcC.height - side) / 2, side, side, 0, 0, 240, 240);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.82));
    const rec = { id: 's' + Date.now(), ts: Date.now(), key: st.key, name: st.name, n: st.n, level: st.level, time: st.time, misses: st.misses, blob };
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

  /* --------------------------------------------------------------- シール帳 */
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
        if (s) slots += `<button class="slot" data-i="${i}"><div class="stk f${frameOf(s.n)}" style="--r:${((i * 37) % 11) - 5}deg"><div class="ring"><img alt="" src="${blobUrl(s.id, s.blob)}"></div><span class="cap">${s.n}<small>${'★'.repeat(LV_STARS[s.level] || 1)}</small></span></div></button>`;
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
      const box = openSheet(`<div class="clear"><div class="stk big f${frameOf(s.n)}"><div class="ring"><img alt="" src="${blobUrl(s.id, s.blob)}"></div></div>
        <p class="meta">${s.name} ・ ${s.n}ピース</p><p class="meta sub">${LV[s.level] ? LV[s.level].name : ''} ・ ${Engine.fmt(s.time)} ・ まちがい ${s.misses}かい<br>${d.getFullYear()}ねん ${d.getMonth() + 1}がつ ${d.getDate()}にち</p>
        <div class="row"><button class="btn" id="sClose">とじる</button></div></div>`, 'clearbox');
      $('#sClose', box).onclick = closeSheet;
    };
  }

  /* ------------------------------------------------------------- 保護者設定 */
  async function openSettings() {
    const photos = (await Store.all('photos')).sort((a, b) => a.ts - b.ts), persistent = await Store.persistent();
    const box = openSheet(`
      <h2>おとなの せってい</h2>
      <h3>おと・こえ</h3>
      <div class="seg" id="sSound"><button data-s="1" class="${S.sound ? 'on' : ''}">あり</button><button data-s="0" class="${S.sound ? '' : 'on'}">なし</button></div>
      <h3>とりこんだ しゃしん（${photos.length}まい）</h3>
      <div class="plist">${photos.length ? photos.map((p) => `<div class="pi"><img alt="" src="${blobUrl(p.id, p.blob)}"><button data-id="${p.id}" class="del">けす</button></div>`).join('') : '<p class="note">まだ ありません</p>'}</div>
      <h3>きろく</h3>
      <button class="dng" id="rBest">ベストタイムを けす</button>
      <button class="dng" id="rStk">シールを ぜんぶ けす</button>
      <p class="note">写真・シール・きろくは、この たんまつの中だけに保存されます。インターネットには送りません。${persistent ? '' : '<br><b>いまは一時保存です（ブラウザを閉じると消えます）。</b>'}</p>
      <div class="row"><button class="btn" id="sClose">とじる</button></div>`, 'setbox');
    box.querySelectorAll('#sSound button').forEach((b) => b.onclick = () => {
      S.sound = +b.dataset.s; PZ.muted = !S.sound; Store.saveSettings();
      box.querySelectorAll('#sSound button').forEach((x) => x.classList.toggle('on', x === b)); PZ.snd.ok();
    });
    box.querySelectorAll('.del').forEach((b) => armedButton(b, 'けす', async () => { await Store.del('photos', b.dataset.id); const sv = await Store.get('saves', 'current'); if (sv && sv.desc.k === 'photo' && sv.desc.id === b.dataset.id) await Store.del('saves', 'current'); closeSheet(); openSettings(); }));
    armedButton($('#rBest', box), 'ベストタイムを けす', () => { S.best = {}; Store.saveSettings(); flash('けしました'); });
    armedButton($('#rStk', box), 'シールを ぜんぶ けす', async () => { await Store.clear('stickers'); flash('けしました'); });
    $('#sClose', box).onclick = () => { closeSheet(); renderHome(); };
  }

  /* ------------------------------------------------------------------ 起動 */
  Engine.init();
  renderHome();
})();
