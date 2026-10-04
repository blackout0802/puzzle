/* store/icon.svg から、ストア用の PNG を作る（Playwright / Chromium を使用）
   使い方: node tools/render_icons.js   （Playwright の場所は環境に合わせて require の行を変更） */
const fs = require('fs'), path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const root = path.join(__dirname, '..', 'store');
(async () => {
  const svg = fs.readFileSync(path.join(root, 'icon.svg'), 'utf8');
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
  const out = [[1024, 'icon-1024.png'], [512, 'icon-512.png'], [192, 'icon-192.png'], [180, 'icon-180.png']];
  for (const [s, name] of out) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0">${svg.replace('width="1024" height="1024"', `width="${s}" height="${s}"`)}</body>`);
    await p.screenshot({ path: path.join(root, name), clip: { x: 0, y: 0, width: s, height: s } }); await p.close();
    console.log('wrote', name);
  }
  await b.close();
})();
