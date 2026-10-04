/* ====================================================================
   common.js  ― 10本の試作で共通に使う部品
   ・絵（SVGで描いた8枚）  ・効果音（Web Audioで生成。音声ファイル不要）
   ・ジグソー形状の生成   ・ドラッグ＆吸着   ・ごほうび   ・保護者ゲート
   ==================================================================== */
(function () {
  'use strict';
  const PZ = (window.PZ = {});
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  PZ.dpr = DPR;
  PZ.$ = (s, r) => (r || document).querySelector(s);
  PZ.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  PZ.el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
  PZ.rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  PZ.shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  PZ.pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------------------------------------------------------------- 絵 */
  const S = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${inner}</svg>`;
  const flower = (x, y, pc, cc, d, r) => {
    let s = `<g transform="translate(${x},${y})" fill="${pc}">`;
    for (let i = 0; i < 6; i++) s += `<circle cy="${-d}" r="${r}" transform="rotate(${i * 60})"/>`;
    return s + `</g><circle cx="${x}" cy="${y}" r="${r * 0.85}" fill="${cc}"/>`;
  };
  PZ.art = [
    { id: 'neko', name: 'ねこ', say: 'ねこ', svg: S(`
      <rect width="400" height="400" fill="#bfe6ff"/><circle cx="335" cy="65" r="38" fill="#ffe14d"/>
      <ellipse cx="90" cy="70" rx="48" ry="20" fill="#fff"/><ellipse cx="122" cy="58" rx="34" ry="20" fill="#fff"/><ellipse cx="62" cy="62" rx="26" ry="16" fill="#fff"/>
      <rect y="310" width="400" height="90" fill="#9be08a"/>
      <path d="M300 300 C372 285 384 220 346 198" stroke="#ff9a3c" stroke-width="26" fill="none" stroke-linecap="round"/>
      <ellipse cx="200" cy="295" rx="92" ry="78" fill="#ffb066"/><ellipse cx="200" cy="318" rx="52" ry="52" fill="#fff0d9"/>
      <polygon points="125,150 135,70 195,115" fill="#ffb066"/><polygon points="275,150 265,70 205,115" fill="#ffb066"/>
      <polygon points="140,128 143,92 172,114" fill="#ff9fb5"/><polygon points="260,128 257,92 228,114" fill="#ff9fb5"/>
      <circle cx="200" cy="185" r="86" fill="#ffb066"/>
      <path d="M185 112 L190 140 M200 108 L200 140 M215 112 L210 140" stroke="#e07d2e" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="165" cy="182" rx="17" ry="21" fill="#fff"/><ellipse cx="235" cy="182" rx="17" ry="21" fill="#fff"/>
      <circle cx="168" cy="186" r="11" fill="#2b2b2b"/><circle cx="232" cy="186" r="11" fill="#2b2b2b"/>
      <circle cx="172" cy="181" r="4" fill="#fff"/><circle cx="236" cy="181" r="4" fill="#fff"/>
      <polygon points="190,208 210,208 200,220" fill="#ff7a93"/>
      <path d="M200 220 Q190 238 175 232 M200 220 Q210 238 225 232" stroke="#6b3b1a" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M135 212 L95 205 M135 222 L96 228 M265 212 L305 205 M265 222 L304 228" stroke="#6b3b1a" stroke-width="3" stroke-linecap="round"/>
      <circle cx="70" cy="345" r="32" fill="#ff6b6b"/><path d="M48 335 Q70 350 92 332 M45 350 Q70 365 95 350" stroke="#d94a4a" stroke-width="4" fill="none"/>
      <circle cx="330" cy="350" r="9" fill="#fff"/><circle cx="330" cy="350" r="4" fill="#ffd54d"/><circle cx="300" cy="372" r="9" fill="#fff"/><circle cx="300" cy="372" r="4" fill="#ffd54d"/>`) },
    { id: 'kuma', name: 'くま', say: 'くま', svg: S(`
      <rect width="400" height="400" fill="#ffe9b8"/>
      <g fill="#ffd98a"><circle cx="30" cy="40" r="14"/><circle cx="150" cy="24" r="10"/><circle cx="250" cy="40" r="12"/><circle cx="385" cy="150" r="14"/><circle cx="20" cy="190" r="12"/><circle cx="380" cy="260" r="10"/><circle cx="40" cy="270" r="9"/></g>
      <path d="M55 118 L68 250" stroke="#999" stroke-width="2.5"/><ellipse cx="55" cy="80" rx="30" ry="38" fill="#ff6b6b"/><ellipse cx="45" cy="66" rx="7" ry="11" fill="#fff" opacity=".5"/>
      <path d="M350 106 L336 240" stroke="#999" stroke-width="2.5"/><ellipse cx="350" cy="70" rx="28" ry="36" fill="#5aa9ff"/><ellipse cx="341" cy="57" rx="6" ry="10" fill="#fff" opacity=".5"/>
      <circle cx="115" cy="120" r="42" fill="#a86a3c"/><circle cx="115" cy="120" r="22" fill="#e8b98a"/>
      <circle cx="285" cy="120" r="42" fill="#a86a3c"/><circle cx="285" cy="120" r="22" fill="#e8b98a"/>
      <circle cx="200" cy="205" r="108" fill="#b97a4a"/><ellipse cx="200" cy="242" rx="55" ry="42" fill="#efc9a0"/>
      <circle cx="160" cy="185" r="12" fill="#2b1a0e"/><circle cx="240" cy="185" r="12" fill="#2b1a0e"/>
      <circle cx="164" cy="180" r="4" fill="#fff"/><circle cx="244" cy="180" r="4" fill="#fff"/>
      <ellipse cx="200" cy="222" rx="17" ry="12" fill="#4a2c17"/>
      <path d="M200 234 L200 246 M180 252 Q200 270 220 252" stroke="#4a2c17" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="132" cy="228" r="16" fill="#ff9fb5" opacity=".6"/><circle cx="268" cy="228" r="16" fill="#ff9fb5" opacity=".6"/>
      <rect x="35" y="338" width="72" height="52" rx="18" fill="#e89a2c"/><rect x="40" y="326" width="62" height="18" rx="7" fill="#fff3c9"/><path d="M48 342 q0 24 11 24 q11 0 11 -24" fill="#ffd54d"/>
      <ellipse cx="330" cy="345" rx="24" ry="17" fill="#ffd54d"/><path d="M322 330 V360 M336 330 V360" stroke="#333" stroke-width="6"/>
      <ellipse cx="322" cy="324" rx="12" ry="8" fill="#fff" opacity=".8"/><ellipse cx="342" cy="324" rx="12" ry="8" fill="#fff" opacity=".8"/><circle cx="350" cy="342" r="3" fill="#222"/>`) },
    { id: 'sakana', name: 'さかな', say: 'さかな', svg: S(`
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fe0ff"/><stop offset="1" stop-color="#1f7fd6"/></linearGradient></defs>
      <rect width="400" height="400" fill="url(#g)"/>
      <polygon points="60,0 100,0 170,400 40,400" fill="#fff" opacity=".12"/><polygon points="250,0 300,0 390,400 270,400" fill="#fff" opacity=".1"/>
      <ellipse cx="200" cy="415" rx="270" ry="58" fill="#f3d9a0"/>
      <path d="M55 400 C25 340 90 320 60 262 C40 222 72 200 66 168" stroke="#2e9b4f" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M345 400 C375 350 320 330 350 290 C368 262 345 245 352 225" stroke="#2e9b4f" stroke-width="12" fill="none" stroke-linecap="round"/>
      <polygon points="115,200 50,138 50,262" fill="#ff8a3c"/>
      <ellipse cx="210" cy="200" rx="115" ry="72" fill="#ff9f43"/><ellipse cx="215" cy="228" rx="85" ry="33" fill="#ffd9a8"/>
      <path d="M175 138 Q158 200 172 262 M235 134 Q220 200 235 266" stroke="#fff" stroke-width="14" fill="none" opacity=".8"/>
      <path d="M170 135 Q220 78 275 142Z" fill="#ff7a1f"/>
      <circle cx="285" cy="185" r="17" fill="#fff"/><circle cx="289" cy="185" r="8" fill="#222"/><circle cx="292" cy="182" r="3" fill="#fff"/>
      <path d="M318 215 Q305 226 294 218" stroke="#a24b00" stroke-width="4" fill="none" stroke-linecap="round"/>
      <g fill="none" stroke="#fff" stroke-width="3" opacity=".85"><circle cx="335" cy="115" r="14"/><circle cx="358" cy="78" r="9"/><circle cx="318" cy="62" r="6"/></g>
      <g transform="translate(70,70)"><polygon points="-30,0 -52,-14 -52,14" fill="#7c5cff"/><ellipse rx="30" ry="17" fill="#9b82ff"/><circle cx="14" cy="-3" r="4" fill="#fff"/><circle cx="15" cy="-3" r="2" fill="#222"/></g>
      <polygon points="330,318 338,342 362,342 343,356 350,380 330,366 310,380 317,356 298,342 322,342" fill="#ff6b8a"/>`) },
    { id: 'kuruma', name: 'くるま', say: 'ぶーぶー', svg: S(`
      <rect width="400" height="400" fill="#a8e0ff"/>
      <g stroke="#ffd93d" stroke-width="6" stroke-linecap="round"><path d="M70 14V28M70 112V126M14 70H28M112 70H126M30 30L40 40M100 100L110 110M110 30L100 40M30 110L40 100"/></g>
      <circle cx="70" cy="70" r="34" fill="#ffd93d"/>
      <ellipse cx="300" cy="66" rx="46" ry="19" fill="#fff"/><ellipse cx="330" cy="54" rx="30" ry="18" fill="#fff"/>
      <ellipse cx="100" cy="300" rx="190" ry="95" fill="#7fd36b"/><ellipse cx="335" cy="312" rx="170" ry="82" fill="#5cbf5c"/>
      <rect x="345" y="215" width="14" height="70" fill="#8b5a2b"/><circle cx="352" cy="198" r="38" fill="#2f9e44"/><circle cx="330" cy="222" r="26" fill="#2f9e44"/>
      <rect y="296" width="400" height="104" fill="#5b6270"/><rect y="292" width="400" height="9" fill="#c9ced6"/>
      <path d="M0 358 H400" stroke="#fff" stroke-width="8" stroke-dasharray="40 26"/>
      <rect x="70" y="215" width="260" height="85" rx="26" fill="#ff4d4d"/>
      <path d="M125 218 L155 160 H265 L295 218Z" fill="#ff4d4d"/>
      <path d="M140 214 L162 170 H198 V214Z" fill="#cfefff"/><path d="M208 214 V170 H258 L278 214Z" fill="#cfefff"/>
      <rect x="70" y="250" width="260" height="10" fill="#fff" opacity=".55"/>
      <circle cx="322" cy="238" r="10" fill="#fff3a0"/><rect x="72" y="232" width="12" height="20" rx="4" fill="#ffb3b3"/>
      <circle cx="130" cy="300" r="34" fill="#2b2b2b"/><circle cx="130" cy="300" r="14" fill="#bbb"/>
      <circle cx="270" cy="300" r="34" fill="#2b2b2b"/><circle cx="270" cy="300" r="14" fill="#bbb"/>`) },
    { id: 'ie', name: 'おうち', say: 'おうち', svg: S(`
      <rect width="400" height="400" fill="#b8e6ff"/><circle cx="335" cy="58" r="34" fill="#ffd93d"/>
      <ellipse cx="90" cy="66" rx="46" ry="18" fill="#fff"/><ellipse cx="118" cy="54" rx="30" ry="17" fill="#fff"/>
      <rect y="290" width="400" height="110" fill="#8fd96b"/>
      <path d="M170 400 Q200 345 215 300 L255 300 Q250 352 305 400Z" fill="#f0d9a8"/>
      <rect x="250" y="92" width="26" height="62" fill="#a9442f"/>
      <rect x="110" y="170" width="190" height="135" fill="#ffe0b3"/>
      <polygon points="88,176 205,78 322,176" fill="#e5533d"/>
      <circle cx="205" cy="140" r="17" fill="#bfeaff" stroke="#fff" stroke-width="5"/>
      <rect x="185" y="225" width="46" height="80" rx="6" fill="#8b5a2b"/><circle cx="220" cy="268" r="4" fill="#ffd93d"/>
      <rect x="128" y="205" width="42" height="42" fill="#bfeaff" stroke="#fff" stroke-width="5"/><path d="M149 205V247M128 226H170" stroke="#fff" stroke-width="4"/>
      <rect x="244" y="205" width="42" height="42" fill="#bfeaff" stroke="#fff" stroke-width="5"/><path d="M265 205V247M244 226H286" stroke="#fff" stroke-width="4"/>
      <rect x="40" y="222" width="18" height="92" fill="#8b5a2b"/><circle cx="49" cy="200" r="46" fill="#34a853"/><circle cx="20" cy="228" r="30" fill="#34a853"/><circle cx="80" cy="228" r="30" fill="#34a853"/>
      <g stroke="#2e9b4f" stroke-width="3"><path d="M335 345V370M365 365V385M120 350V372"/></g>
      <circle cx="335" cy="342" r="9" fill="#ff7eb6"/><circle cx="365" cy="362" r="9" fill="#fff"/><circle cx="120" cy="347" r="9" fill="#ffd93d"/>`) },
    { id: 'hana', name: 'おはな', say: 'おはな', svg: S(`
      <rect width="400" height="400" fill="#d9f7c4"/><ellipse cx="200" cy="420" rx="300" ry="70" fill="#a5e07a"/>
      <g stroke="#2e9b4f" stroke-width="10" fill="none" stroke-linecap="round"><path d="M110 165 C100 250 122 320 115 400"/><path d="M290 200 C302 280 280 340 285 400"/><path d="M195 310 C190 350 200 380 196 400"/></g>
      <ellipse cx="85" cy="270" rx="30" ry="12" fill="#2e9b4f" transform="rotate(-30 85 270)"/><ellipse cx="315" cy="300" rx="30" ry="12" fill="#2e9b4f" transform="rotate(30 315 300)"/>
      ${flower(110, 125, '#ff7eb6', '#ffd93d', 42, 28)}
      ${flower(290, 165, '#ffd54d', '#ff9f43', 34, 24)}
      ${flower(195, 285, '#b388ff', '#fff3a0', 28, 20)}
      <g transform="translate(325,60)"><ellipse cx="-20" cy="-8" rx="24" ry="16" fill="#ff9f43" transform="rotate(-20 -20 -8)"/><ellipse cx="20" cy="-8" rx="24" ry="16" fill="#ff9f43" transform="rotate(20 20 -8)"/><ellipse cx="-14" cy="14" rx="14" ry="10" fill="#ffd39a"/><ellipse cx="14" cy="14" rx="14" ry="10" fill="#ffd39a"/><rect x="-3" y="-14" width="6" height="34" rx="3" fill="#4a2c17"/></g>
      <circle cx="58" cy="345" r="20" fill="#ff4d4d"/><path d="M58 325V365" stroke="#222" stroke-width="3"/><circle cx="50" cy="340" r="4" fill="#222"/><circle cx="66" cy="350" r="4" fill="#222"/><circle cx="58" cy="323" r="9" fill="#222"/>`) },
    { id: 'roketto', name: 'ロケット', say: 'ロケット', svg: S(`
      <rect width="400" height="400" fill="#1b2a6b"/>
      <g fill="#fff"><circle cx="30" cy="30" r="2.5"/><circle cx="160" cy="40" r="2"/><circle cx="250" cy="25" r="3"/><circle cx="360" cy="80" r="2.5"/><circle cx="20" cy="190" r="2"/><circle cx="55" cy="290" r="3"/><circle cx="340" cy="200" r="2"/><circle cx="130" cy="350" r="2"/><circle cx="380" cy="300" r="2"/><circle cx="300" cy="120" r="2"/></g>
      <g fill="#ffe14d"><polygon points="300,40 305,52 318,54 308,62 311,75 300,68 289,75 292,62 282,54 295,52"/><polygon points="40,240 44,249 54,251 46,257 49,267 40,262 31,267 34,257 26,251 36,249"/></g>
      <circle cx="85" cy="90" r="42" fill="#b388ff"/><ellipse cx="85" cy="90" rx="72" ry="14" fill="none" stroke="#ffd1ff" stroke-width="8" transform="rotate(-20 85 90)"/>
      <circle cx="335" cy="375" r="85" fill="#d9dbe8"/><circle cx="305" cy="345" r="15" fill="#b9bdd2"/><circle cx="355" cy="335" r="9" fill="#b9bdd2"/><circle cx="340" cy="385" r="13" fill="#b9bdd2"/>
      <path d="M175 300 Q200 385 225 300Z" fill="#ff9f1c"/><path d="M186 300 Q200 352 214 300Z" fill="#ffe14d"/>
      <path d="M158 250 L118 308 L166 292Z" fill="#ff4d4d"/><path d="M242 250 L282 308 L234 292Z" fill="#ff4d4d"/>
      <path d="M200 68 C252 110 246 220 236 302 H164 C154 220 148 110 200 68Z" fill="#f4f6ff"/>
      <path d="M200 68 C224 88 236 110 241 136 H159 C164 110 176 88 200 68Z" fill="#ff4d4d"/>
      <circle cx="200" cy="188" r="27" fill="#6ec6ff" stroke="#c9d3ff" stroke-width="8"/><circle cx="192" cy="180" r="7" fill="#fff" opacity=".7"/>
      <rect x="163" y="250" width="74" height="14" fill="#ff4d4d"/>`) },
    { id: 'pengin', name: 'ペンギン', say: 'ペンギン', svg: S(`
      <rect width="400" height="400" fill="#d6f1ff"/>
      <path d="M0 305 Q80 225 165 305Z" fill="#b9e4fa"/><path d="M225 305 Q320 205 400 305Z" fill="#b9e4fa"/>
      <ellipse cx="200" cy="410" rx="320" ry="100" fill="#fff"/>
      <g fill="#fff"><circle cx="40" cy="50" r="6"/><circle cx="120" cy="90" r="4"/><circle cx="300" cy="40" r="6"/><circle cx="360" cy="120" r="4"/><circle cx="60" cy="170" r="5"/><circle cx="350" cy="230" r="5"/></g>
      <ellipse cx="108" cy="250" rx="20" ry="58" fill="#1a2c52" transform="rotate(15 108 250)"/><ellipse cx="292" cy="250" rx="20" ry="58" fill="#1a2c52" transform="rotate(-15 292 250)"/>
      <ellipse cx="200" cy="240" rx="95" ry="122" fill="#243b6b"/><ellipse cx="200" cy="265" rx="62" ry="92" fill="#fff"/>
      <ellipse cx="170" cy="168" rx="19" ry="21" fill="#fff"/><ellipse cx="230" cy="168" rx="19" ry="21" fill="#fff"/>
      <circle cx="173" cy="171" r="9" fill="#111"/><circle cx="227" cy="171" r="9" fill="#111"/><circle cx="176" cy="167" r="3" fill="#fff"/><circle cx="230" cy="167" r="3" fill="#fff"/>
      <polygon points="180,192 220,192 200,220" fill="#ff9f1c"/>
      <circle cx="146" cy="196" r="12" fill="#ff9fb5" opacity=".7"/><circle cx="254" cy="196" r="12" fill="#ff9fb5" opacity=".7"/>
      <path d="M136 212 Q200 240 264 212 L261 234 Q200 260 139 234Z" fill="#ff4d4d"/><rect x="232" y="226" width="24" height="56" rx="7" fill="#ff4d4d"/>
      <ellipse cx="165" cy="364" rx="34" ry="12" fill="#ff9f1c"/><ellipse cx="235" cy="364" rx="34" ry="12" fill="#ff9f1c"/>
      <ellipse cx="62" cy="372" rx="30" ry="14" fill="#ff7a7a"/><polygon points="92,372 112,358 112,386" fill="#ff7a7a"/><circle cx="48" cy="368" r="3" fill="#222"/>`) },
  ];

  /* ------------------------------------------------------------ 画像 */
  /* 画像の出し方：普通は data: URL。それが禁止されている表示場所なら blob: URL。どちらもだめなら 'none' */
  PZ.imgMode = 'data';
  const svgBlobUrls = {};
  PZ.svgUrl = (a) => (PZ.imgMode === 'blob'
    ? (svgBlobUrls[a.id] || (svgBlobUrls[a.id] = URL.createObjectURL(new Blob([a.svg], { type: 'image/svg+xml' }))))
    : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(a.svg));
  /* canvas → 画像のURL。data: が使えない表示場所では blob: にする */
  PZ.canvasUrl = (cv, type = 'image/jpeg', q = 0.85) => new Promise((res, rej) => {
    try {
      if (PZ.imgMode !== 'blob') return res(cv.toDataURL(type, q));
      cv.toBlob((b) => (b ? res(URL.createObjectURL(b)) : rej(new Error('toBlob'))), type, q);
    } catch (e) { rej(e); }
  });
  PZ.probeImages = async () => {
    const t = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="red"/></svg>';
    const tryLoad = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(true); i.onerror = () => r(false); i.src = u; setTimeout(() => r(false), 3000); });
    if (await tryLoad('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(t))) return (PZ.imgMode = 'data');
    let bu = null; try { bu = URL.createObjectURL(new Blob([t], { type: 'image/svg+xml' })); } catch (e) { }
    if (bu && (await tryLoad(bu))) return (PZ.imgMode = 'blob');
    return (PZ.imgMode = 'none');
  };
  PZ.loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const imgCache = {};
  PZ.artImage = (a) => imgCache[a.id] || (imgCache[a.id] = PZ.loadImage(PZ.svgUrl(a)));
  /* 画像(Image/ImageBitmap)を W×H にぴったり「cover」で切り抜いたcanvasにする */
  PZ.coverCanvas = (img, W, H) => {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const c = document.createElement('canvas'); c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    c.style.width = W + 'px'; c.style.height = H + 'px';
    const s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(img, (W - dw) / 2 * DPR, (H - dh) / 2 * DPR, dw * DPR, dh * DPR);
    return c;
  };
  PZ.artCanvas = async (a, W, H) => PZ.coverCanvas(await PZ.artImage(a), W, H);
  /* 端末の写真ファイル → canvas（向き補正つき。サーバーには送らない） */
  PZ.fileImage = async (file) => {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (e) { const u = URL.createObjectURL(file); try { return await PZ.loadImage(u); } finally { setTimeout(() => URL.revokeObjectURL(u), 3000); } }
  };

  /* ----------------------------------------------------- グリッド計算 */
  const G = { 2: [1, 2], 3: [1, 3], 4: [2, 2], 6: [2, 3], 8: [2, 4], 9: [3, 3], 12: [3, 4], 16: [4, 4], 20: [4, 5] };
  PZ.grid = (n, portrait) => { const [a, b] = G[n]; return portrait ? [b, a] : [a, b]; }; // [rows, cols]
  PZ.fitCell = (rows, cols, maxW, maxH) => Math.max(20, Math.floor(Math.min(maxW / cols, maxH / rows)));
  PZ.isPortrait = () => innerHeight >= innerWidth;

  /* ------------------------------------------------ ジグソーの形を作る */
  PZ.edges = (rows, cols, seed) => {
    const r = PZ.rng(seed || 1);
    const h = [], v = [];
    for (let i = 0; i < rows; i++) { h.push([]); v.push([]); for (let j = 0; j < cols; j++) { h[i].push(r() < .5 ? 1 : -1); v[i].push(r() < .5 ? 1 : -1); } }
    return { h, v };
  };
  PZ.pad = (w, h, flat) => (flat ? 0 : Math.ceil(0.3 * Math.max(w, h)));
  function side(p, ax, ay, bx, by, nx, ny, s) {
    if (!s) { p.lineTo(bx, by); return; }
    const L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L, K = 0.85;
    const P = (t, hh) => [ax + ux * L * t + nx * L * hh * s * K, ay + uy * L * t + ny * L * hh * s * K];
    p.lineTo(...P(.34, 0));
    p.bezierCurveTo(...P(.34, .10), ...P(.26, .14), ...P(.28, .24));
    p.bezierCurveTo(...P(.30, .36), ...P(.70, .36), ...P(.72, .24));
    p.bezierCurveTo(...P(.74, .14), ...P(.66, .10), ...P(.66, 0));
    p.lineTo(bx, by);
  }
  PZ.piecePath = (r, c, rows, cols, w, h, E, flat) => {
    const p = new Path2D();
    if (flat || !E) { p.rect(0, 0, w, h); return p; }
    const top = r > 0 ? -E.h[r - 1][c] : 0, bottom = r < rows - 1 ? E.h[r][c] : 0;
    const left = c > 0 ? -E.v[r][c - 1] : 0, right = c < cols - 1 ? E.v[r][c] : 0;
    p.moveTo(0, 0);
    side(p, 0, 0, w, 0, 0, -1, top);
    side(p, w, 0, w, h, 1, 0, right);
    side(p, w, h, 0, h, 0, 1, bottom);
    side(p, 0, h, 0, 0, -1, 0, left);
    p.closePath();
    return p;
  };
  /* src(canvas, 盤面全体の絵) から、(r,c) のピースのcanvasを作る */
  PZ.pieceCanvas = (src, r, c, rows, cols, w, h, E, flat) => {
    const pad = PZ.pad(w, h, flat), W = w + pad * 2, H = h + pad * 2;
    const cv = document.createElement('canvas'); cv.width = Math.ceil(W * DPR); cv.height = Math.ceil(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.pad = pad;
    const x = cv.getContext('2d'); x.scale(DPR, DPR); x.translate(pad, pad);
    const path = PZ.piecePath(r, c, rows, cols, w, h, E, flat);
    x.save(); x.clip(path); x.drawImage(src, -c * w, -r * h, cols * w, rows * h); x.restore();
    x.lineJoin = 'round'; x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = 5; x.stroke(path);
    x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 2.5; x.stroke(path);
    return cv;
  };

  /* ---------------------------------------------------------------- 音 */
  let actx = null;
  PZ.muted = false;
  function ac() {
    try {
      if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (C) actx = new C(); }
      if (actx && actx.state === 'suspended') actx.resume();
    } catch (e) { /* 音が出なくても遊べる */ }
    return actx;
  }
  ['pointerdown', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, ac, { passive: true }));
  function tone(f, t = 0, d = .15, type = 'sine', v = .18) {
    if (PZ.muted) return; const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t1 = c.currentTime + t;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t1); g.gain.linearRampToValueAtTime(v, t1 + .012); g.gain.exponentialRampToValueAtTime(.0001, t1 + d);
    o.connect(g); g.connect(c.destination); o.start(t1); o.stop(t1 + d + .03);
  }
  function noise(d = .12, v = .25) {
    if (PZ.muted) return; const c = ac(); if (!c) return;
    const n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const s = c.createBufferSource(), g = c.createGain(); g.gain.value = v; s.buffer = b; s.connect(g); g.connect(c.destination); s.start();
  }
  PZ.snd = {
    pick() { tone(620, 0, .09); },
    drop() { tone(330, 0, .1, 'triangle', .14); },
    ok() { tone(784, 0, .1, 'triangle'); tone(1175, .08, .2, 'triangle'); },
    soft() { tone(260, 0, .16, 'sine', .09); },          // まちがい：やさしい音（叱らない）
    pop() { noise(.14, .3); tone(500, 0, .05, 'square', .06); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * .11, .3, 'triangle', .2)); },
  };
  PZ.say = (text) => {
    if (PZ.muted || !('speechSynthesis' in window)) return;
    try { const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; u.rate = .9; u.pitch = 1.35; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { }
  };
  /* 声のガイド：あそびの途中で、ひらがなで はなしかける（おとなの せっていで オフにできる）。
     ことばが かさならないよう、前に話してから すこしあいだを あける。 */
  PZ.voice = true; let lastV = 0;
  PZ.sayV = (text, force) => {
    if (!PZ.voice || PZ.muted) return;
    const now = Date.now(); if (!force && now - lastV < 2600) return; lastV = now;
    PZ.say(text);
  };

  /* ------------------------------------------------------ ごほうび演出 */
  PZ.confetti = (n = 70) => {
    const cols = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#ff9ff3', '#ff9f43'];
    for (let i = 0; i < n; i++) {
      const e = document.createElement('div'); e.className = 'confetti-piece';
      e.style.left = Math.random() * 100 + 'vw'; e.style.background = cols[i % cols.length];
      e.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); e.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
      e.style.animationDelay = Math.random() * .6 + 's'; e.style.animationDuration = 2 + Math.random() * 1.4 + 's';
      document.body.appendChild(e); setTimeout(() => e.remove(), 4200);
    }
  };
  PZ.win = (opt = {}) => {
    PZ.confetti(opt.n || 70); PZ.snd.win();
    const word = opt.text || PZ.pick(['できた！', 'すごい！', 'やったね！', 'じょうず！']);
    const b = document.createElement('div'); b.className = 'banner'; b.textContent = word; document.body.appendChild(b); setTimeout(() => b.remove(), 2300);
    if (opt.say) setTimeout(() => PZ.say(opt.say), 500);
  };

  /* ------------------------------------------------------- 保護者ゲート */
  PZ.parentGate = (why) => new Promise((resolve) => {
    const a = 3 + Math.floor(Math.random() * 6), b = 3 + Math.floor(Math.random() * 6), ans = a + b;
    const opts = PZ.shuffle([ans, ans + 2, ans - 3, ans + 5]);
    const back = PZ.el('div', 'gate-back', document.body), g = PZ.el('div', 'gate', back);
    g.innerHTML = `<h2>おとなの かたへ</h2><p>${why || 'この さきは ほごしゃの かた用です'}</p><div class="q">${a} + ${b} = ?</div><div class="ans"></div><button class="cancel">やめる</button>`;
    const done = (ok) => { back.remove(); resolve(ok); };
    opts.forEach((o) => { const bt = PZ.el('button', '', PZ.$('.ans', g)); bt.textContent = o; bt.onclick = () => done(o === ans); });
    PZ.$('.cancel', g).onclick = () => done(false);
  });

  /* ------------------------------------------- 画面の向き変更時に再開始 */
  PZ.onLayoutChange = (fn) => {
    let lw = innerWidth, lh = innerHeight, t;
    addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const flip = (innerWidth >= innerHeight) !== (lw >= lh), big = Math.abs(innerWidth - lw) / lw > .15;
        if (flip || big) { lw = innerWidth; lh = innerHeight; fn(); }
      }, 250);
    });
  };

  /* -------------------------------------------- ドラッグ（ポインタ共通） */
  PZ.drag = (el, h) => {
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => {
      if (h.canStart && !h.canStart(el, e)) return;
      e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (_) { }
      const sx = e.clientX, sy = e.clientY;
      h.start && h.start(el, e);
      const mv = (ev) => h.move && h.move(el, ev.clientX - sx, ev.clientY - sy, ev);
      const up = (ev) => {
        el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        h.end && h.end(el, ev.clientX - sx, ev.clientY - sy, ev);
      };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  };

  /* n個のピース(幅pw,高さph)を area 内に「ゆらぎつきグリッド」で散らす。重なりを最小にする */
  PZ.scatter = (n, area, pw, ph) => {
    const W = Math.max(1, area.x1 - area.x0), H = Math.max(1, area.y1 - area.y0);
    let best = null;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols), score = Math.min(W / cols / pw, H / rows / ph);
      if (!best || score > best.score) best = {cols, rows, score};
    }
    const cw = W / best.cols, rh = H / best.rows;
    return PZ.shuffle([...Array(best.cols * best.rows).keys()]).slice(0, n).map((k) => {
      const c = k % best.cols, r = Math.floor(k / best.cols);
      const jx = (Math.random() - .5) * Math.min(24, Math.abs(cw - pw) * .8), jy = (Math.random() - .5) * Math.min(24, Math.abs(rh - ph) * .8);
      const x = area.x0 + c * cw + (cw - pw) / 2 + jx, y = area.y0 + r * rh + (rh - ph) / 2 + jy;
      return {x: Math.min(Math.max(x, area.x0), Math.max(area.x0, area.x1 - pw)), y: Math.min(Math.max(y, area.y0), Math.max(area.y0, area.y1 - ph))};
    });
  };

  /* ----------------------------- 「ドラッグして、近づくと吸い付く」共通部品
     pieces: [{el, tx, ty}]  el は position:absolute。left/top(px) が現在位置、tx/ty が正解位置。
     opt.snap(p) 吸着距離 / opt.onPlace(p) / opt.onWin()                           */
  PZ.snapDrag = (pieces, opt) => {
    let z = 10, placed = 0;
    const api = {
      count: () => placed,
      place(p, quiet) {
        if (p.placed) return;
        p.placed = true; p.el.style.transition = 'left .18s ease-out, top .18s ease-out';
        p.el.style.left = p.tx + 'px'; p.el.style.top = p.ty + 'px';
        p.el.classList.add('placed'); p.el.style.zIndex = 1; p.el.style.pointerEvents = 'none';
        if (!quiet) PZ.snd.ok();
        opt.onPlace && opt.onPlace(p);
        if (++placed === pieces.length) opt.onWin && setTimeout(opt.onWin, 250);
      },
    };
    pieces.forEach((p) => PZ.drag(p.el, {
      canStart: () => !p.placed,
      start() { p.x0 = parseFloat(p.el.style.left); p.y0 = parseFloat(p.el.style.top); p.el.style.zIndex = ++z; p.el.style.transition = 'none'; p.el.classList.add('drag'); PZ.snd.pick(); },
      move(el, dx, dy) { el.style.left = p.x0 + dx + 'px'; el.style.top = p.y0 + dy + 'px'; },
      end(el, dx, dy) {
        el.classList.remove('drag');
        const x = p.x0 + dx, y = p.y0 + dy;
        if (Math.hypot(x - p.tx, y - p.ty) <= opt.snap(p)) { api.place(p); return; }
        const w = el.offsetWidth, h = el.offsetHeight, m = 8;                       // 画面の外に出ないよう戻す
        const cx = Math.min(Math.max(x, m - w * .35), innerWidth - w * .65 - m), cy = Math.min(Math.max(y, m - h * .35), innerHeight - h * .65 - m);
        el.style.transition = 'left .15s, top .15s'; el.style.left = cx + 'px'; el.style.top = cy + 'px'; PZ.snd.drop();
      },
    }));
    return api;
  };
})();
