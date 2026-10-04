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
  PZ.art.push(...add);
  const CATS = { kuruma: 'vehicle', roketto: 'vehicle' };
  PZ.art.forEach((a) => { if (!a.cat) a.cat = CATS[a.id] || 'nature'; });
})();
