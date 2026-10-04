/* art-vehicles.js ― のりものの絵（SVG）。背景まで描き込んで、どのピースにも手がかりがあるようにする。
   common.js の PZ.art に追加し、既存の絵にも「分類(cat)」をつける。 */
(function () {
  'use strict';
  const S = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${inner}</svg>`;
  const cloud = (x, y, s = 1, c = '#fff') => `<g transform="translate(${x},${y}) scale(${s})" fill="${c}"><ellipse cx="0" cy="0" rx="46" ry="18"/><ellipse cx="-22" cy="-12" rx="26" ry="18"/><ellipse cx="14" cy="-18" rx="28" ry="20"/></g>`;
  const wheel = (x, y, r = 30) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b2b2b"/><circle cx="${x}" cy="${y}" r="${r * 0.5}" fill="#cbd5e1"/><circle cx="${x}" cy="${y}" r="${r * 0.16}" fill="#64748b"/>`;
  const sun = (x, y, r = 28) => `<g stroke="#ffd93d" stroke-width="5" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M${x + Math.cos(a * Math.PI / 180) * (r + 8)} ${y + Math.sin(a * Math.PI / 180) * (r + 8)} L${x + Math.cos(a * Math.PI / 180) * (r + 18)} ${y + Math.sin(a * Math.PI / 180) * (r + 18)}"/>`).join('')}</g><circle cx="${x}" cy="${y}" r="${r}" fill="#ffd93d"/>`;
  const tree = (x, y, s = 1, c = '#2f9e44') => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-5" y="0" width="10" height="40" fill="#8b5a2b"/><circle cx="0" cy="-8" r="26" fill="${c}"/><circle cx="-17" cy="8" r="18" fill="#37b24d"/><circle cx="17" cy="8" r="18" fill="#37b24d"/></g>`;
  const cone = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><polygon points="-10,0 10,0 5,-26 -5,-26" fill="#ff7a1a"/><rect x="-7" y="-14" width="14" height="5" fill="#fff"/><rect x="-14" y="0" width="28" height="5" rx="2" fill="#333"/></g>`;
  const windows = (x, y, w, h, cols, rows, c = '#ffe9a8', gap = 8) => {
    const ww = (w - gap * (cols + 1)) / cols, hh = (h - gap * (rows + 1)) / rows; let o = '';
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) o += `<rect x="${(x + gap + k * (ww + gap)).toFixed(1)}" y="${(y + gap + r * (hh + gap)).toFixed(1)}" width="${ww.toFixed(1)}" height="${hh.toFixed(1)}" rx="2" fill="${(r + k) % 3 === 0 ? '#bfe6ff' : c}"/>`;
    return o;
  };
  const road = (y, c = '#5b6270') => `<rect y="${y}" width="400" height="${400 - y}" fill="${c}"/><rect y="${y - 6}" width="400" height="8" fill="#cbd5e1"/><path d="M0 ${y + (400 - y) * 0.55} H400" stroke="#fff" stroke-width="7" stroke-dasharray="38 26"/>`;
  const hills = (y) => `<ellipse cx="90" cy="${y}" rx="190" ry="70" fill="#86d36f"/><ellipse cx="330" cy="${y + 10}" rx="170" ry="60" fill="#5cbf5c"/>`;
  const sky = '<rect width="400" height="400" fill="#bfe6ff"/>';

  const add = [
    { id: 'shoubousha', name: 'しょうぼうしゃ', say: 'しょうぼうしゃ', cat: 'vehicle', svg: S(`${sky}${sun(340, 50, 26)}${cloud(90, 50, 1)}${cloud(230, 90, 0.7)}
      <rect x="0" y="100" width="150" height="205" fill="#d9534f"/><rect x="0" y="88" width="150" height="16" fill="#7f1d1d"/>${windows(8, 112, 134, 60, 4, 1, '#ffe9a8')}
      <path d="M22 305 V240 a53 53 0 0 1 106 0 V305Z" fill="#f1f5f9"/><path d="M22 262 H128 M22 284 H128" stroke="#cbd5e1" stroke-width="3"/>
      ${tree(360, 235, 0.9)}${tree(325, 250, 0.7, '#2b8a3e')}
      ${road(300)}
      <rect x="70" y="212" width="270" height="82" rx="10" fill="#e63946"/><path d="M262 172 H318 Q338 172 338 192 V294 H262Z" fill="#e63946"/>
      <rect x="270" y="180" width="54" height="42" rx="6" fill="#cfefff"/><rect x="266" y="150" width="62" height="14" rx="4" fill="#475569"/><rect x="272" y="140" width="22" height="12" rx="3" fill="#ef4444"/><rect x="300" y="140" width="22" height="12" rx="3" fill="#3b82f6"/>
      <rect x="70" y="226" width="190" height="9" fill="#fff"/><rect x="84" y="244" width="48" height="40" rx="4" fill="#cbd5e1"/><rect x="138" y="244" width="48" height="40" rx="4" fill="#cbd5e1"/><rect x="192" y="244" width="48" height="40" rx="4" fill="#cbd5e1"/>
      <path d="M84 244h48M138 244h48M192 244h48" stroke="#94a3b8" stroke-width="3"/>
      <path d="M78 207 L255 178 L255 164 L78 193Z" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/><g stroke="#64748b" stroke-width="3">${[100, 125, 150, 175, 200, 225].map((x) => `<path d="M${x} ${205 - (x - 78) * 0.165} v-14"/>`).join('')}</g>
      <circle cx="330" cy="262" r="8" fill="#fde68a"/>${wheel(125, 296)}${wheel(205, 296)}${wheel(295, 296)}`) },
    { id: 'patoka', name: 'パトカー', say: 'パトカー', cat: 'vehicle', svg: S(`<rect width="400" height="400" fill="#cfe8ff"/>${cloud(80, 45, 0.9)}${cloud(300, 70, 0.8)}
      <rect x="10" y="130" width="80" height="170" fill="#94a3b8"/>${windows(10, 130, 80, 170, 3, 5, '#e2e8f0', 7)}
      <rect x="100" y="80" width="70" height="220" fill="#64748b"/>${windows(100, 80, 70, 220, 3, 6, '#fde68a', 7)}
      <rect x="180" y="150" width="90" height="150" fill="#a8b5c7"/>${windows(180, 150, 90, 150, 4, 4, '#e2e8f0', 7)}
      <rect x="282" y="110" width="80" height="190" fill="#7c8da4"/>${windows(282, 110, 80, 190, 3, 5, '#fde68a', 7)}
      ${road(300, '#4b5563')}<g fill="#fff">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${i * 70 + 8}" y="318" width="38" height="16"/>`).join('')}</g>
      <rect x="72" y="222" width="256" height="76" rx="26" fill="#f8fafc"/><path d="M128 226 L158 176 H258 L292 226Z" fill="#f8fafc"/>
      <path d="M142 222 L164 184 H200 V222Z" fill="#bfe6ff"/><path d="M210 222 V184 H254 L276 222Z" fill="#bfe6ff"/>
      <rect x="72" y="256" width="256" height="40" rx="14" fill="#1f2937"/><rect x="190" y="152" width="28" height="22" rx="4" fill="#ef4444"/><rect x="218" y="152" width="28" height="22" rx="4" fill="#3b82f6"/>
      <circle cx="205" cy="146" r="14" fill="#ef4444" opacity=".25"/><circle cx="233" cy="146" r="14" fill="#3b82f6" opacity=".25"/>
      <polygon points="152,247 156,258 168,258 158,265 162,276 152,269 142,276 146,265 136,258 148,258" fill="#facc15"/>
      <rect x="318" y="238" width="14" height="14" rx="4" fill="#fde68a"/>${wheel(130, 298)}${wheel(272, 298)}${cone(362, 335, 1.1)}`) },
    { id: 'kyuukyuusha', name: 'きゅうきゅうしゃ', say: 'きゅうきゅうしゃ', cat: 'vehicle', svg: S(`${sky}${sun(60, 50, 24)}${cloud(240, 60, 0.9)}
      <rect x="205" y="90" width="195" height="210" fill="#f1f5f9"/><rect x="205" y="82" width="195" height="12" fill="#94a3b8"/>${windows(205, 100, 195, 100, 5, 2, '#bfe6ff', 8)}
      <rect x="282" y="210" width="40" height="90" rx="4" fill="#94a3b8"/><path d="M288 130 h28 v-22 h22 v-22 h-22 v-22 h-28 v22 h-22 v22 h22z" transform="translate(0 6)" fill="#ef4444"/>
      ${tree(40, 255, 0.9)}${tree(165, 262, 0.7)}${road(300)}
      <rect x="64" y="168" width="200" height="124" rx="14" fill="#f8fafc"/><path d="M264 200 H312 Q336 200 336 224 V292 H264Z" fill="#f8fafc"/>
      <path d="M274 208 H308 L326 232 H274Z" fill="#cfefff"/><rect x="64" y="236" width="200" height="14" fill="#ef4444"/><rect x="64" y="236" width="272" height="0" fill="#ef4444"/>
      <path d="M142 184 h24 v22 h22 v24 h-22 v22 h-24 v-22 h-22 v-24 h22z" fill="#ef4444" transform="translate(0 -4)"/>
      <rect x="150" y="150" width="60" height="20" rx="6" fill="#ef4444"/><rect x="156" y="142" width="18" height="10" rx="3" fill="#3b82f6"/><rect x="186" y="142" width="18" height="10" rx="3" fill="#ef4444"/>
      <circle cx="330" cy="268" r="8" fill="#fde68a"/>${wheel(118, 296)}${wheel(290, 296)}`) },
    { id: 'shoberu', name: 'ショベルカー', say: 'ショベルカー', cat: 'vehicle', svg: S(`${sky}${sun(340, 48, 24)}${cloud(100, 52, 1)}${cloud(250, 95, 0.7)}
      <path d="M0 300 Q70 210 160 262 Q230 300 300 245 Q350 215 400 262 V400 H0Z" fill="#c08a4a"/><path d="M0 330 Q120 300 240 336 T400 322 V400 H0Z" fill="#a8743a"/>
      <g fill="#8a5a28">${[[40, 340, 14], [120, 360, 10], [200, 345, 12], [300, 365, 16], [360, 338, 9], [250, 380, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
      <g transform="translate(10 30)">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${i * 62}" y="218" width="50" height="34" fill="${i % 2 ? '#fff' : '#ff7a1a'}" stroke="#555" stroke-width="2"/>`).join('')}</g>
      <rect x="60" y="298" width="210" height="46" rx="23" fill="#334155"/><circle cx="86" cy="321" r="16" fill="#64748b"/><circle cx="165" cy="321" r="16" fill="#64748b"/><circle cx="244" cy="321" r="16" fill="#64748b"/>
      <rect x="95" y="262" width="150" height="40" rx="8" fill="#f59e0b"/><rect x="170" y="212" width="82" height="56" rx="8" fill="#fbbf24"/><rect x="104" y="206" width="70" height="60" rx="8" fill="#fbbf24"/><rect x="112" y="214" width="54" height="36" rx="4" fill="#cfefff"/>
      <path d="M118 222 L70 150 L40 190" fill="none" stroke="#f59e0b" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><path d="M118 222 L70 150 L40 190" fill="none" stroke="#fbbf24" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M40 190 L22 232 L62 246 L74 214Z" fill="#6b7280" stroke="#374151" stroke-width="3" stroke-linejoin="round"/><circle cx="70" cy="150" r="7" fill="#374151"/><circle cx="118" cy="222" r="7" fill="#374151"/>
      ${cone(300, 300, 1.2)}${cone(330, 306, 1)}`) },
    { id: 'shinkansen', name: 'しんかんせん', say: 'しんかんせん', cat: 'vehicle', svg: S(`<rect width="400" height="400" fill="#a5d8ff"/>${sun(340, 52, 24)}${cloud(80, 56, 1)}${cloud(215, 100, 0.7)}
      <path d="M40 270 L160 90 Q200 38 240 90 L360 270Z" fill="#6b84b8"/><path d="M160 90 Q200 38 240 90 L226 108 L206 92 L190 112 L172 98Z" fill="#fff"/><path d="M110 270 L190 150 L230 220 L270 270Z" fill="#5b74a8" opacity=".55"/>
      <rect y="262" width="400" height="140" fill="#86d36f"/>
      ${[[40, 245], [110, 240], [300, 243], [365, 238]].map(([x, y], i) => `<g transform="translate(${x},${y})"><rect x="-4" y="6" width="8" height="26" fill="#8b5a2b"/><circle cx="0" cy="0" r="20" fill="${i % 2 ? '#fbcfe8' : '#f9a8d4'}"/><circle cx="-12" cy="8" r="13" fill="#fbcfe8"/><circle cx="12" cy="8" r="13" fill="#f9a8d4"/></g>`).join('')}
      <rect y="318" width="400" height="14" fill="#9ca3af"/><rect y="332" width="400" height="68" fill="#6b7280"/><g fill="#475569">${Array.from({ length: 14 }, (_, i) => `<rect x="${i * 30 - 6}" y="338" width="14" height="40"/>`).join('')}</g><path d="M0 346 H400 M0 366 H400" stroke="#e5e7eb" stroke-width="4"/>
      <path d="M26 234 H250 C310 234 352 262 372 300 H26Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/><path d="M26 276 H372 L360 290 H26Z" fill="#1d4ed8"/><path d="M26 268 H366" stroke="#60a5fa" stroke-width="4"/>
      ${Array.from({ length: 8 }, (_, i) => `<rect x="${40 + i * 30}" y="246" width="20" height="16" rx="3" fill="#1e3a8a"/>`).join('')}
      <path d="M268 244 C300 244 330 262 348 276 H270Z" fill="#1e3a8a"/><rect x="26" y="300" width="340" height="10" fill="#334155"/>${Array.from({ length: 6 }, (_, i) => `<circle cx="${60 + i * 56}" cy="312" r="7" fill="#1f2937"/>`).join('')}`) },
    { id: 'dump', name: 'ダンプカー', say: 'ダンプカー', cat: 'vehicle', svg: S(`${sky}${sun(60, 50, 24)}${cloud(250, 60, 1)}${cloud(330, 120, 0.6)}
      <path d="M0 260 Q90 190 190 250 Q280 300 400 220 V400 H0Z" fill="#d6a15a"/><path d="M0 310 Q150 270 400 320 V400 H0Z" fill="#b9843f"/>
      <g fill="#9a6a2c">${[[30, 350, 12], [110, 372, 10], [210, 358, 14], [330, 372, 11], [380, 340, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
      <path d="M96 270 L130 150 L282 150 L292 270Z" transform="rotate(-14 292 270)" fill="#f59e0b" stroke="#b45309" stroke-width="4" stroke-linejoin="round"/>
      <g transform="rotate(-14 292 270)"><path d="M118 156 Q140 112 175 128 Q200 100 230 125 Q262 106 278 152Z" fill="#8b6f47"/><g fill="#6b5233"><circle cx="150" cy="140" r="6"/><circle cx="206" cy="130" r="7"/><circle cx="248" cy="138" r="6"/></g></g>
      <rect x="86" y="268" width="260" height="30" rx="8" fill="#334155"/><path d="M290 214 H330 Q350 214 350 236 V288 H290Z" fill="#fbbf24" stroke="#b45309" stroke-width="3"/><path d="M298 222 H326 L340 244 H298Z" fill="#cfefff"/><circle cx="344" cy="268" r="7" fill="#fde68a"/>
      ${wheel(140, 300, 32)}${wheel(220, 300, 32)}${wheel(318, 300, 30)}${cone(46, 330, 1.3)}${cone(80, 342, 1)}`) },
    { id: 'basu', name: 'バス', say: 'バス', cat: 'vehicle', svg: S(`${sky}${sun(340, 46, 22)}${cloud(70, 56, 0.9)}${cloud(220, 38, 0.6)}
      <rect x="0" y="130" width="90" height="170" fill="#fbcfe8"/>${windows(0, 130, 90, 170, 3, 4, '#fff', 8)}<rect x="300" y="110" width="100" height="190" fill="#c7d2fe"/>${windows(300, 110, 100, 190, 3, 5, '#fff', 8)}
      ${tree(120, 250, 0.9)}${tree(280, 258, 0.8)}
      ${road(300)}
      <rect x="44" y="172" width="312" height="124" rx="22" fill="#22c55e"/><rect x="44" y="238" width="312" height="14" fill="#fde047"/>
      ${Array.from({ length: 5 }, (_, i) => `<rect x="${58 + i * 52}" y="186" width="42" height="44" rx="7" fill="#cfefff"/>${i % 2 === 0 ? `<circle cx="${79 + i * 52}" cy="208" r="9" fill="#fb923c"/>` : ''}`).join('')}
      <rect x="318" y="186" width="30" height="64" rx="6" fill="#cfefff"/><rect x="56" y="150" width="120" height="20" rx="5" fill="#16a34a"/><circle cx="346" cy="272" r="8" fill="#fde68a"/>${wheel(110, 298)}${wheel(280, 298)}`) },
    { id: 'hikouki', name: 'ひこうき', say: 'ひこうき', cat: 'vehicle', svg: S(`<defs><linearGradient id="hk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5eb3ff"/><stop offset="1" stop-color="#cdeaff"/></linearGradient></defs><rect width="400" height="400" fill="url(#hk)"/>${sun(70, 60, 26)}${cloud(300, 70, 1.1)}${cloud(60, 160, 0.8)}${cloud(330, 190, 0.7)}
      <g fill="#fff" opacity=".9"><ellipse cx="90" cy="302" rx="90" ry="24"/><ellipse cx="260" cy="312" rx="110" ry="26"/></g>
      <rect y="320" width="400" height="80" fill="#86d36f"/>${[[0, 326, 70, 34, '#fde68a'], [70, 326, 60, 34, '#86d36f'], [130, 326, 80, 34, '#fbbf24'], [210, 326, 70, 34, '#bbf7d0'], [280, 326, 120, 34, '#fde68a'], [0, 360, 120, 40, '#bbf7d0'], [120, 360, 90, 40, '#fbbf24'], [210, 360, 100, 40, '#86d36f'], [310, 360, 90, 40, '#fde68a']].map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" stroke="#4d9d4d" stroke-width="2"/>`).join('')}
      <path d="M60 170 L40 120 Q38 112 48 112 H70 L112 168Z" fill="#ef4444"/>
      <path d="M60 188 C60 168 120 168 270 172 C340 174 372 190 372 204 C372 220 340 232 270 234 C130 238 60 232 60 214Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
      <path d="M62 212 C120 218 300 220 370 208 L372 204 C372 210 340 224 270 226 C130 230 70 226 62 218Z" fill="#ef4444"/>
      <path d="M180 206 L250 292 L232 296 L130 210Z" fill="#94a3b8" stroke="#64748b" stroke-width="3" stroke-linejoin="round"/><path d="M190 186 L240 124 L254 126 L226 190Z" fill="#94a3b8" stroke="#64748b" stroke-width="3" stroke-linejoin="round"/>
      ${Array.from({ length: 9 }, (_, i) => `<circle cx="${100 + i * 22}" cy="194" r="5" fill="#1e3a8a"/>`).join('')}
      <path d="M326 184 C348 186 362 192 364 200 H322Z" fill="#1e3a8a"/><ellipse cx="226" cy="236" rx="18" ry="9" fill="#64748b"/>
      <path d="M312 70 q8-10 16 0 q8-10 16 0 M120 100 q6-8 12 0 q6-8 12 0" fill="none" stroke="#334155" stroke-width="3" stroke-linecap="round"/>`) },
  ];

  /* ---------------------------------------------------------------- 追加分（のりもの＋どうぶつ・きょうりゅう） */
  const bamboo = (x, h = 400) => `<g><rect x="${x}" y="0" width="22" height="${h}" fill="#7bc96f"/><g fill="#5aa84f">${Array.from({ length: 8 }, (_, i) => `<rect x="${x - 2}" y="${i * 52 + 20}" width="26" height="7" rx="3"/>`).join('')}</g></g>`;
  const grassTop = (y, c = '#86d36f') => `<path d="M0 ${y} Q50 ${y - 14} 100 ${y} T200 ${y} T300 ${y} T400 ${y} V400 H0Z" fill="${c}"/>`;
  const fern = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})" stroke="#2f9e44" stroke-width="5" stroke-linecap="round" fill="none"><path d="M0 0 Q-4 -30 6 -60"/>${[-48, -36, -24, -12].map((yy) => `<path d="M${(yy + 60) * 0.1 - 2} ${yy} l-16 -8 M${(yy + 60) * 0.1 - 2} ${yy} l16 -8"/>`).join('')}</g>`;
  const add2 = [
    { id: 'gomi', name: 'ごみしゅうしゅうしゃ', say: 'ごみしゅうしゅうしゃ', cat: 'vehicle', svg: S(`${sky}${sun(60, 48, 24)}${cloud(250, 55, 0.9)}
      <g>${[[10, 200, '#fda4af', '#be123c'], [100, 215, '#fde68a', '#b45309'], [320, 205, '#bbf7d0', '#15803d']].map(([x, y, w, r]) => `<rect x="${x}" y="${y}" width="70" height="95" fill="${w}"/><polygon points="${x - 6},${y} ${x + 35},${y - 38} ${x + 76},${y}" fill="${r}"/><rect x="${x + 24}" y="${y + 40}" width="22" height="55" fill="#8b5a2b"/>`).join('')}</g>
      ${tree(250, 245, 0.8)}${road(300)}
      <rect x="62" y="172" width="222" height="124" rx="12" fill="#22a14a"/><rect x="62" y="236" width="222" height="12" fill="#fde047"/>
      <path d="M284 196 H322 Q344 196 344 218 V296 H284Z" fill="#22a14a"/><path d="M292 204 H322 Q332 204 334 216 V240 H292Z" fill="#cfefff"/>
      <rect x="44" y="190" width="34" height="106" rx="8" fill="#15803d"/><rect x="50" y="248" width="22" height="40" rx="4" fill="#111827"/><path d="M60 166 H100 V190" fill="none" stroke="#475569" stroke-width="6" stroke-linecap="round"/>
      <circle cx="170" cy="204" r="22" fill="#fff"/><path d="M158 206 l8 -12 l6 8 M182 202 l-8 12 l-6 -8" fill="none" stroke="#22a14a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="338" cy="268" r="8" fill="#fde68a"/>
      <g><ellipse cx="22" cy="288" rx="22" ry="20" fill="#14532d"/><rect x="15" y="262" width="14" height="10" rx="4" fill="#14532d"/></g>${wheel(130, 298)}${wheel(310, 298)}`) },
    { id: 'mixer', name: 'ミキサーしゃ', say: 'ミキサーしゃ', cat: 'vehicle', svg: S(`${sky}${sun(340, 50, 24)}${cloud(100, 50, 1)}
      <g stroke="#475569" stroke-width="5" fill="none"><rect x="10" y="90" width="120" height="210"/>${[0, 1, 2, 3].map((i) => `<path d="M10 ${90 + i * 52} H130"/>`).join('')}<path d="M10 90 L130 142 M130 90 L10 142 M10 194 L130 246 M130 194 L10 246"/><path d="M70 90 V300"/></g>
      <rect x="0" y="80" width="140" height="12" fill="#f59e0b"/>
      <path d="M0 300 Q120 270 400 310 V400 H0Z" fill="#c9a36a"/>${road(310, '#6b7280')}
      <rect x="64" y="270" width="272" height="26" rx="6" fill="#334155"/>
      <g transform="rotate(-16 170 215)"><ellipse cx="170" cy="215" rx="100" ry="55" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/><path d="M78 190 Q130 160 175 214 T270 240" fill="none" stroke="#f97316" stroke-width="14"/><path d="M92 236 Q140 200 190 258" fill="none" stroke="#f97316" stroke-width="12"/><path d="M270 195 L295 215 L270 238Z" fill="#94a3b8"/><ellipse cx="82" cy="215" rx="10" ry="26" fill="#94a3b8"/></g>
      <path d="M276 214 H320 Q342 214 342 236 V296 H276Z" fill="#2563eb"/><path d="M284 222 H316 L330 244 H284Z" fill="#cfefff"/><rect x="266" y="204" width="10" height="92" fill="#1d4ed8"/>${wheel(110, 300, 30)}${wheel(190, 300, 30)}${wheel(310, 300, 28)}${cone(380, 340, 1.2)}`) },
    { id: 'crane', name: 'クレーンしゃ', say: 'クレーンしゃ', cat: 'vehicle', svg: S(`${sky}${sun(60, 54, 24)}${cloud(250, 40, 0.9)}${cloud(120, 140, 0.6)}
      <g><rect x="250" y="150" width="120" height="150" fill="#94a3b8"/>${windows(250, 150, 120, 150, 4, 5, '#e2e8f0', 7)}<rect x="300" y="100" width="70" height="52" fill="#a8b5c7"/>${windows(300, 100, 70, 52, 3, 2, '#e2e8f0', 6)}<path d="M360 100 V40 M345 40 H395" stroke="#f59e0b" stroke-width="5"/></g>
      ${road(300)}
      <rect x="40" y="252" width="270" height="44" rx="8" fill="#f59e0b"/><g fill="#111827">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${52 + i * 42}" y="278" width="22" height="6" opacity=".7"/>`).join('')}</g>
      <path d="M262 214 H294 Q314 214 314 234 V296 H262Z" fill="#f59e0b"/><path d="M268 222 H292 L304 242 H268Z" fill="#cfefff"/>
      <path d="M100 252 L310 56 L322 70 L118 262Z" fill="#ef4444" stroke="#991b1b" stroke-width="3" stroke-linejoin="round"/><path d="M180 188 L312 62 L322 72 L192 196Z" fill="#fbbf24" stroke="#b45309" stroke-width="2"/><circle cx="108" cy="256" r="12" fill="#475569"/>
      <path d="M316 66 V164" stroke="#334155" stroke-width="3"/><path d="M310 164 h14 v12 a7 7 0 1 1 -14 0z" fill="#475569"/><rect x="296" y="176" width="40" height="22" fill="#fb923c" stroke="#9a3412" stroke-width="2"/>
      <path d="M60 296 V318 M290 296 V318" stroke="#475569" stroke-width="8"/><rect x="40" y="318" width="40" height="8" rx="3" fill="#475569"/><rect x="270" y="318" width="40" height="8" rx="3" fill="#475569"/>${wheel(100, 296, 24)}${wheel(170, 296, 24)}${wheel(240, 296, 24)}`) },
    { id: 'tractor', name: 'トラクター', say: 'トラクター', cat: 'vehicle', svg: S(`${sky}${sun(340, 50, 26)}${cloud(80, 56, 1)}${cloud(230, 100, 0.7)}
      <path d="M0 210 Q100 150 200 205 T400 190 V400 H0Z" fill="#86d36f"/>
      <g><rect x="270" y="150" width="110" height="100" fill="#dc2626"/><polygon points="262,150 325,100 388,150" fill="#7f1d1d"/><rect x="305" y="190" width="40" height="60" fill="#fff"/><path d="M305 190 L345 250 M345 190 L305 250" stroke="#dc2626" stroke-width="5"/></g>
      <path d="M0 255 L400 255" stroke="#a16207" stroke-width="3"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 30 - 10} 255 v-22 M${i * 30 + 6} 255 v-22" stroke="#a16207" stroke-width="4"/>`).join('')}
      <rect y="262" width="400" height="140" fill="#a16207"/>${[280, 310, 340, 370].map((y, i) => `<path d="M0 ${y} Q100 ${y - 14} 200 ${y} T400 ${y}" fill="none" stroke="${i % 2 ? '#854d0e' : '#c28a35'}" stroke-width="12"/>`).join('')}
      <g transform="translate(40 250)">${[0, 1, 2].map((i) => `<g transform="translate(${i * 30} 0)"><rect x="-2" y="0" width="4" height="30" fill="#2e9b4f"/><circle cx="0" cy="-4" r="11" fill="#facc15"/><circle cx="0" cy="-4" r="5" fill="#92400e"/></g>`).join('')}</g>
      <rect x="205" y="214" width="112" height="56" rx="10" fill="#dc2626"/><rect x="128" y="168" width="82" height="100" rx="8" fill="#ef4444"/><rect x="138" y="178" width="62" height="48" rx="6" fill="#cfefff"/><rect x="124" y="160" width="90" height="12" rx="4" fill="#991b1b"/>
      <rect x="296" y="180" width="10" height="42" fill="#475569"/><circle cx="318" cy="242" r="8" fill="#fde68a"/>
      <circle cx="160" cy="288" r="62" fill="#1f2937"/><circle cx="160" cy="288" r="30" fill="#facc15"/><circle cx="160" cy="288" r="8" fill="#92400e"/><circle cx="270" cy="312" r="36" fill="#1f2937"/><circle cx="270" cy="312" r="16" fill="#facc15"/>`) },
    { id: 'sl', name: 'SL（じょうききかんしゃ）', say: 'しゅっしゅっぽっぽ', cat: 'vehicle', svg: S(`<rect width="400" height="400" fill="#b9e3ff"/>${sun(70, 56, 26)}${cloud(250, 46, 0.8)}
      <path d="M0 250 L90 130 L150 210 L220 110 L320 250Z" fill="#7c93bd"/><path d="M200 138 L220 110 L240 140 L222 130Z" fill="#fff"/><path d="M80 150 L90 130 L102 150 L92 144Z" fill="#fff"/>
      <rect y="246" width="400" height="154" fill="#86d36f"/>${tree(40, 250, 0.8)}${tree(370, 246, 0.7)}
      <rect y="336" width="400" height="14" fill="#9ca3af"/><g fill="#6b4a2b">${Array.from({ length: 14 }, (_, i) => `<rect x="${i * 30 - 6}" y="344" width="16" height="48"/>`).join('')}</g><path d="M0 354 H400 M0 378 H400" stroke="#d1d5db" stroke-width="5"/>
      <g fill="#e5e7eb" opacity=".95"><circle cx="318" cy="118" r="20"/><circle cx="342" cy="88" r="26"/><circle cx="376" cy="58" r="30"/><circle cx="300" cy="140" r="14"/></g>
      <rect x="60" y="156" width="100" height="136" rx="8" fill="#1f2937"/><rect x="50" y="146" width="120" height="14" rx="4" fill="#111827"/><rect x="76" y="172" width="56" height="48" rx="4" fill="#fde68a"/>
      <rect x="150" y="200" width="150" height="70" rx="20" fill="#2d3748"/><rect x="290" y="206" width="52" height="64" rx="8" fill="#374151"/><path d="M304 150 h26 l8 -12 h-42 z" fill="#111827"/><rect x="310" y="150" width="14" height="60" fill="#111827"/>
      <ellipse cx="205" cy="196" rx="20" ry="14" fill="#374151"/><rect x="120" y="262" width="220" height="16" fill="#991b1b"/><polygon points="340,268 372,300 340,300" fill="#111827"/><circle cx="342" cy="236" r="9" fill="#fde68a"/>
      <g><circle cx="120" cy="300" r="40" fill="#dc2626"/><circle cx="215" cy="304" r="34" fill="#dc2626"/><circle cx="290" cy="304" r="34" fill="#dc2626"/><g stroke="#fff" stroke-width="3">${[[120, 300, 40], [215, 304, 34], [290, 304, 34]].map(([x, y, r]) => `<path d="M${x - r * 0.9} ${y} H${x + r * 0.9} M${x} ${y - r * 0.9} V${y + r * 0.9}"/>`).join('')}</g><circle cx="120" cy="300" r="8" fill="#fbbf24"/><circle cx="215" cy="304" r="7" fill="#fbbf24"/><circle cx="290" cy="304" r="7" fill="#fbbf24"/></g>`) },
    { id: 'heli', name: 'ヘリコプター', say: 'ヘリコプター', cat: 'vehicle', svg: S(`<defs><linearGradient id="hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5eb3ff"/><stop offset="1" stop-color="#d6efff"/></linearGradient></defs><rect width="400" height="400" fill="url(#hl)"/>${sun(330, 60, 26)}${cloud(80, 70, 1)}${cloud(290, 150, 0.7)}${cloud(60, 330, 0.9)}
      <path d="M0 330 L70 250 L130 310 L210 230 L300 320 L360 270 L400 310 V400 H0Z" fill="#7c93bd"/><path d="M200 240 L210 230 L222 244 L212 240Z M62 262 L70 250 L80 264Z" fill="#fff"/>
      <rect y="338" width="400" height="62" fill="#86d36f"/>${tree(60, 350, 0.6)}${tree(330, 352, 0.6)}${tree(220, 356, 0.5)}
      <path d="M52 188 L190 214 L190 244 L52 222Z" fill="#dc2626"/><path d="M44 164 L72 164 L66 222 L44 214Z" fill="#b91c1c"/><circle cx="58" cy="192" r="14" fill="#94a3b8"/><path d="M58 178 V206 M44 192 H72" stroke="#475569" stroke-width="3"/>
      <ellipse cx="228" cy="236" rx="96" ry="54" fill="#ef4444"/><path d="M262 202 Q320 206 322 240 Q290 262 258 262Z" fill="#cfefff" stroke="#fff" stroke-width="3"/><path d="M160 230 H258" stroke="#fff" stroke-width="8"/><path d="M150 250 H230" stroke="#fff" stroke-width="4" opacity=".8"/>
      <rect x="216" y="170" width="24" height="26" fill="#475569"/><ellipse cx="228" cy="168" rx="150" ry="10" fill="#334155" opacity=".35"/><rect x="80" y="160" width="296" height="8" rx="4" fill="#334155"/>
      <path d="M170 296 H320 M196 282 V296 M280 282 V296" stroke="#475569" stroke-width="7" stroke-linecap="round"/><path d="M160 296 Q150 296 150 304 M326 296 Q336 296 336 304" stroke="#475569" stroke-width="7" fill="none" stroke-linecap="round"/>`) },
    { id: 'tyrano', name: 'ティラノサウルス', say: 'がおー', cat: 'nature', svg: S(`<defs><linearGradient id="ty" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd48a"/><stop offset="1" stop-color="#ffa45b"/></linearGradient></defs><rect width="400" height="400" fill="url(#ty)"/>${sun(70, 70, 30)}${cloud(250, 50, 0.9, '#fff3d6')}
      <path d="M170 280 L250 110 Q280 60 320 110 L400 280Z" fill="#6b4a3a"/><path d="M262 92 Q285 62 310 92 Q290 100 280 118 Q270 100 262 92Z" fill="#ef4444"/><path d="M280 118 Q276 150 262 176 M280 118 Q290 150 300 180" stroke="#f97316" stroke-width="6" fill="none" stroke-linecap="round"/>
      <g fill="#fff3d6" opacity=".9"><circle cx="330" cy="70" r="16"/><circle cx="352" cy="46" r="20"/></g>
      <rect y="300" width="400" height="100" fill="#7bbf5a"/>${fern(30, 330, 1.1)}${fern(370, 330, 1)}${fern(120, 360, 0.8)}
      <g transform="translate(14 -10)"><path d="M20 276 Q70 262 120 240 L130 210 L220 190 L230 270 Z" fill="#43a047"/><path d="M20 276 Q-10 290 -20 296 Q40 300 130 280Z" fill="#43a047" transform="translate(16 0)"/>
      <ellipse cx="190" cy="236" rx="96" ry="64" fill="#4caf50"/><ellipse cx="200" cy="258" rx="72" ry="40" fill="#c5e1a5"/>
      <path d="M118 176 l12 -22 l12 20 l14 -24 l12 22 l16 -22 l8 24" fill="#2e7d32"/>
      <rect x="150" y="270" width="44" height="52" rx="16" fill="#43a047"/><ellipse cx="170" cy="322" rx="30" ry="9" fill="#2e7d32"/><rect x="210" y="270" width="38" height="48" rx="15" fill="#388e3c"/><ellipse cx="232" cy="318" rx="28" ry="8" fill="#2e7d32"/>
      <path d="M240 210 Q250 200 262 210 M252 206 l8 6" stroke="#2e7d32" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M226 160 Q236 100 290 96 Q352 96 368 128 Q372 150 340 156 L300 160 Q262 168 244 200Z" fill="#4caf50"/>
      <path d="M296 148 Q340 152 370 142 L366 162 Q330 178 296 166Z" fill="#388e3c"/><path d="M302 150 l6 14 l6 -12 l8 13 l6 -12 l8 11 l6 -10 l8 8" fill="#fff"/>
      <circle cx="298" cy="116" r="11" fill="#fff"/><circle cx="302" cy="117" r="6" fill="#222"/><circle cx="355" cy="122" r="4" fill="#1b5e20"/></g>`) },
    { id: 'tricera', name: 'トリケラトプス', say: 'トリケラトプス', cat: 'nature', svg: S(`${sky}${sun(330, 56, 28)}${cloud(80, 56, 1)}${cloud(220, 100, 0.7)}
      <path d="M0 250 Q80 200 180 245 T400 230 V400 H0Z" fill="#9bdc7b"/><rect y="300" width="400" height="100" fill="#7bbf5a"/>${fern(40, 340, 1)}${fern(370, 336, 1.1)}${fern(150, 372, 0.8)}
      <g>${[[60, 316], [330, 360], [200, 380]].map(([x, y]) => `<g transform="translate(${x},${y})"><rect x="-2" y="0" width="4" height="16" fill="#2e9b4f"/><circle cx="0" cy="-3" r="8" fill="#f9a8d4"/><circle cx="0" cy="-3" r="3" fill="#facc15"/></g>`).join('')}</g>
      <path d="M40 270 Q10 250 8 232 Q60 236 100 252Z" fill="#c2763a"/>
      <ellipse cx="170" cy="244" rx="98" ry="62" fill="#d98a4a"/><ellipse cx="176" cy="268" rx="74" ry="36" fill="#f3d3a4"/>
      <rect x="110" y="272" width="36" height="52" rx="14" fill="#c2763a"/><rect x="190" y="276" width="36" height="48" rx="14" fill="#b8692d"/><g fill="#7c4a1e"><ellipse cx="128" cy="324" rx="26" ry="8"/><ellipse cx="208" cy="322" rx="26" ry="8"/></g>
      <circle cx="288" cy="200" r="74" fill="#ef6c47"/><circle cx="288" cy="200" r="74" fill="none" stroke="#b83b1e" stroke-width="6"/><g fill="#fde68a">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = -2.6 + i * 0.45; return `<circle cx="${(288 + Math.cos(a) * 62).toFixed(0)}" cy="${(200 + Math.sin(a) * 62).toFixed(0)}" r="7"/>`; }).join('')}</g>
      <ellipse cx="300" cy="224" rx="58" ry="42" fill="#d98a4a"/><path d="M340 232 Q372 232 378 252 Q360 268 336 258Z" fill="#c2763a"/>
      <path d="M300 168 L312 112 L322 166Z" fill="#fff7ed" stroke="#d6c3a8" stroke-width="2"/><path d="M270 186 L250 142 L286 176Z" fill="#fff7ed" stroke="#d6c3a8" stroke-width="2"/><path d="M356 218 L388 196 L370 232Z" fill="#fff7ed" stroke="#d6c3a8" stroke-width="2"/>
      <circle cx="310" cy="212" r="10" fill="#fff"/><circle cx="313" cy="213" r="5" fill="#222"/><path d="M320 244 Q340 252 356 244" stroke="#7c4a1e" stroke-width="4" fill="none" stroke-linecap="round"/>`) },
    { id: 'lion', name: 'ライオン', say: 'がおー', cat: 'nature', svg: S(`<defs><linearGradient id="ln" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#ffc977"/></linearGradient></defs><rect width="400" height="400" fill="url(#ln)"/>${sun(330, 60, 34)}${cloud(80, 56, 0.8, '#fff7e0')}
      <path d="M0 270 Q100 240 200 262 T400 250 V400 H0Z" fill="#c9b458"/><rect y="320" width="400" height="80" fill="#b0a040"/>
      <g><rect x="22" y="170" width="8" height="110" fill="#6b4a2b"/><path d="M0 180 Q30 130 60 180 Q80 140 56 120 Q20 100 0 130Z" fill="#4d7c3a"/></g>
      <g><rect x="352" y="196" width="8" height="90" fill="#6b4a2b"/><path d="M326 204 Q356 150 388 204 Q404 170 380 150 Q350 130 326 160Z" fill="#4d7c3a"/></g>
      <g fill="#9a7b2e">${[[60, 350], [150, 372], [260, 356], [330, 380], [30, 384]].map(([x, y]) => `<path d="M${x} ${y} l-6 -16 M${x} ${y} l0 -20 M${x} ${y} l6 -16" stroke="#8a6d25" stroke-width="3" stroke-linecap="round"/>`).join('')}</g>
      <g fill="#c2410c">${Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return `<polygon points="${(200 + Math.cos(a - 0.2) * 110).toFixed(1)},${(220 + Math.sin(a - 0.2) * 110).toFixed(1)} ${(200 + Math.cos(a) * 150).toFixed(1)},${(220 + Math.sin(a) * 150).toFixed(1)} ${(200 + Math.cos(a + 0.2) * 110).toFixed(1)},${(220 + Math.sin(a + 0.2) * 110).toFixed(1)}"/>`; }).join('')}</g>
      <circle cx="200" cy="220" r="124" fill="#d97706"/><circle cx="200" cy="224" r="98" fill="#f59e0b"/>
      <circle cx="118" cy="146" r="26" fill="#f59e0b"/><circle cx="118" cy="146" r="14" fill="#fbcfe8"/><circle cx="282" cy="146" r="26" fill="#f59e0b"/><circle cx="282" cy="146" r="14" fill="#fbcfe8"/>
      <ellipse cx="200" cy="248" rx="54" ry="42" fill="#fde7b0"/><circle cx="166" cy="206" r="13" fill="#fff"/><circle cx="234" cy="206" r="13" fill="#fff"/><circle cx="168" cy="208" r="7" fill="#222"/><circle cx="236" cy="208" r="7" fill="#222"/>
      <path d="M184 232 L216 232 L200 248Z" fill="#7c2d12"/><path d="M200 248 V262 M176 266 Q200 284 224 266" stroke="#7c2d12" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M150 244 L112 236 M150 256 L112 262 M250 244 L288 236 M250 256 L288 262" stroke="#7c2d12" stroke-width="3" stroke-linecap="round"/>`) },
    { id: 'zou', name: 'ぞう', say: 'ぱおーん', cat: 'nature', svg: S(`${sky}${sun(70, 56, 28)}${cloud(250, 50, 0.9)}${cloud(330, 120, 0.6)}
      <path d="M0 240 Q100 200 200 236 T400 226 V400 H0Z" fill="#c9d67a"/><rect y="310" width="400" height="90" fill="#a9b95a"/>
      <g><rect x="334" y="170" width="8" height="90" fill="#6b4a2b"/><path d="M306 180 Q340 126 380 180 Q398 146 372 124 Q336 104 306 140Z" fill="#4d7c3a"/></g>
      <path d="M60 290 Q40 270 50 246" stroke="#7b8794" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="170" cy="240" rx="110" ry="74" fill="#94a3b8"/><rect x="92" y="268" width="46" height="70" rx="18" fill="#8391a5"/><rect x="154" y="274" width="44" height="66" rx="18" fill="#94a3b8"/><rect x="214" y="268" width="46" height="70" rx="18" fill="#8391a5"/>
      <g fill="#64748b"><ellipse cx="115" cy="338" rx="26" ry="9"/><ellipse cx="176" cy="340" rx="24" ry="8"/><ellipse cx="237" cy="338" rx="26" ry="9"/></g>
      <circle cx="268" cy="188" r="62" fill="#a3b0c2"/><path d="M226 160 Q172 128 168 196 Q172 252 226 232Z" fill="#8c9bb0" stroke="#7b8794" stroke-width="3"/><path d="M226 172 Q192 166 190 198 Q192 226 222 218Z" fill="#c9a0a8"/>
      <path d="M296 210 Q352 214 356 268 Q358 306 332 318 Q316 320 322 304 Q332 286 322 262 Q312 244 290 238Z" fill="#a3b0c2" stroke="#8c9bb0" stroke-width="3"/><path d="M308 236 Q330 244 334 270" stroke="#8c9bb0" stroke-width="3" fill="none"/>
      <path d="M290 222 Q316 236 318 262 Q316 276 306 270" fill="#fff" stroke="#e5e7eb" stroke-width="3"/><circle cx="282" cy="178" r="9" fill="#fff"/><circle cx="285" cy="179" r="5" fill="#222"/>
      <path d="M310 316 q8 8 16 0 M340 304 q6 10 14 4" stroke="#7ac7ff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M120 120 q8 -8 16 0 q8 -8 16 0 M290 100 q6 -8 12 0 q6 -8 12 0" stroke="#334155" stroke-width="3" fill="none" stroke-linecap="round"/>`) },
    { id: 'kirin', name: 'きりん', say: 'きりん', cat: 'nature', svg: S(`${sky}${sun(340, 56, 26)}${cloud(70, 90, 0.9)}${cloud(300, 150, 0.6)}
      <path d="M0 290 Q100 260 200 284 T400 272 V400 H0Z" fill="#a3d977"/><rect y="340" width="400" height="60" fill="#8cc85a"/>
      <g><rect x="14" y="170" width="10" height="130" fill="#6b4a2b"/><circle cx="19" cy="150" r="44" fill="#3f9b4f"/><circle cx="-6" cy="176" r="28" fill="#4aaa5a"/><circle cx="46" cy="178" r="28" fill="#4aaa5a"/></g>
      <g><rect x="364" y="196" width="10" height="110" fill="#6b4a2b"/><circle cx="369" cy="180" r="40" fill="#3f9b4f"/><circle cx="346" cy="204" r="26" fill="#4aaa5a"/></g>
      <rect x="118" y="270" width="16" height="80" rx="6" fill="#f2c14e"/><rect x="154" y="274" width="16" height="78" rx="6" fill="#e6b343"/><rect x="214" y="272" width="16" height="80" rx="6" fill="#f2c14e"/><rect x="246" y="270" width="16" height="78" rx="6" fill="#e6b343"/>
      <g fill="#5a3a1a"><rect x="116" y="346" width="20" height="10" rx="3"/><rect x="152" y="348" width="20" height="10" rx="3"/><rect x="212" y="346" width="20" height="10" rx="3"/><rect x="244" y="346" width="20" height="10" rx="3"/></g>
      <path d="M262 258 Q280 270 276 296" stroke="#8a5a2a" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M150 210 L200 70 L238 78 L220 218Z" fill="#f2c14e"/><ellipse cx="192" cy="250" rx="86" ry="46" fill="#f6c95a"/>
      <ellipse cx="238" cy="62" rx="40" ry="30" fill="#f6c95a" transform="rotate(-18 238 62)"/><ellipse cx="262" cy="74" rx="22" ry="17" fill="#f8d98a" transform="rotate(-18 262 74)"/>
      <rect x="214" y="22" width="6" height="22" rx="3" fill="#8a5a2a"/><circle cx="217" cy="20" r="6" fill="#5a3a1a"/><rect x="238" y="26" width="6" height="20" rx="3" fill="#8a5a2a"/><circle cx="241" cy="24" r="6" fill="#5a3a1a"/>
      <circle cx="238" cy="58" r="7" fill="#222"/><circle cx="240" cy="56" r="2" fill="#fff"/><circle cx="270" cy="72" r="2.6" fill="#8a5a2a"/><path d="M252 82 Q262 84 270 80" stroke="#8a5a2a" stroke-width="2.6" fill="none"/>
      <g fill="#b9772e">${[[176, 232, 18], [212, 246, 16], [150, 258, 14], [236, 268, 14], [180, 270, 15], [196, 170, 13], [186, 120, 12], [206, 100, 11], [200, 144, 12], [170, 196, 11], [142, 232, 10]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}"/>`).join('')}</g>`) },
    { id: 'panda', name: 'パンダ', say: 'パンダ', cat: 'nature', svg: S(`<rect width="400" height="400" fill="#dff5d5"/>${bamboo(18)}${bamboo(70, 400)}${bamboo(330)}${bamboo(372)}
      <g fill="#5aa84f"><path d="M40 90 q-40 -10 -50 20 q30 10 50 -20z"/><path d="M92 150 q40 -20 60 6 q-36 14 -60 -6z"/><path d="M350 120 q-40 -16 -64 6 q36 20 64 -6z"/><path d="M394 190 q-30 -20 -56 -6 q28 18 56 6z"/></g>
      <rect y="320" width="400" height="80" fill="#8cc85a"/>
      <ellipse cx="200" cy="270" rx="92" ry="86" fill="#fff" stroke="#e5e7eb" stroke-width="3"/>
      <ellipse cx="126" cy="240" rx="28" ry="44" fill="#1f2937" transform="rotate(20 126 240)"/><ellipse cx="274" cy="240" rx="28" ry="44" fill="#1f2937" transform="rotate(-20 274 240)"/>
      <ellipse cx="154" cy="342" rx="34" ry="22" fill="#1f2937"/><ellipse cx="246" cy="342" rx="34" ry="22" fill="#1f2937"/>
      <rect x="276" y="150" width="22" height="200" rx="6" fill="#7bc96f"/><rect x="274" y="214" width="26" height="7" rx="3" fill="#5aa84f"/><path d="M298 164 q34 -10 40 14 q-26 8 -40 -14z" fill="#5aa84f"/><ellipse cx="262" cy="244" rx="20" ry="16" fill="#1f2937"/>
      <circle cx="200" cy="146" r="68" fill="#fff" stroke="#e5e7eb" stroke-width="3"/><circle cx="150" cy="92" r="26" fill="#1f2937"/><circle cx="250" cy="92" r="26" fill="#1f2937"/>
      <ellipse cx="170" cy="148" rx="19" ry="25" fill="#1f2937" transform="rotate(25 170 148)"/><ellipse cx="230" cy="148" rx="19" ry="25" fill="#1f2937" transform="rotate(-25 230 148)"/>
      <circle cx="172" cy="146" r="7" fill="#fff"/><circle cx="228" cy="146" r="7" fill="#fff"/><circle cx="173" cy="147" r="3.4" fill="#111"/><circle cx="227" cy="147" r="3.4" fill="#111"/>
      <ellipse cx="200" cy="172" rx="13" ry="9" fill="#1f2937"/><path d="M200 181 V190 M186 192 Q200 204 214 192" stroke="#1f2937" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="158" cy="180" r="12" fill="#fda4af" opacity=".6"/><circle cx="242" cy="180" r="12" fill="#fda4af" opacity=".6"/>`) },
  ];
  add.push(...add2);
  PZ.art.push(...add);
  const CATS = { kuruma: 'vehicle', roketto: 'vehicle' };
  PZ.art.forEach((a) => { if (!a.cat) a.cat = CATS[a.id] || 'nature'; });
})();
