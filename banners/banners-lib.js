// BANNERS model + look, built by banners/build_page.py from banners/proto/model.js and look.js. Do not edit.
window.BannersLib = (() => {
// Proto only: turns design/grid/BANNERS.json into families -> banners -> fields, keeping the sheet's merges.
// Every text comes from the sheet as is. Colours: family = row 3 bar, banner stripe = row 7, verdict = row 19.
// A field value is a list of sheet cells; a cell that spans several banners carries `span` and `of` (its banners).
const LABELS = { name: 'A5', when: 'A8', featured: 'A9', guarantee: 'A15', verdict: 'A20' };
const TAGS = { when: 'WHEN', featured: 'FEATURED', pity: 'PITY', guarantee: 'GUARANTEE', verdict: 'PULL?' }; // proposed English tags
const EDITS = {
  family: { RECOLLECTION: 'ตู้เก็บตก/ตู้ปีใหม่ของเซิร์ฟจีน',             // sheet AI2: "ตู้เก็บตก"
            COLLAB: 'ตู้คอลแลป' },                                 // sheet Z2: "COLLAB" (no Thai; author 2026-10-12)
  bannerTh: { 'Standard Recollection': 'เก็บตก Standard',            // sheet AI6: "ตู้ปีใหม่ของเซิร์ฟจีน/ตู้เก็บตก"
              'Kernel Recollection': 'เก็บตก Kernel',
              Orienteering: 'ตู้ไตร / ตู้โอเรียน / ตู้ 3 คน',
              Summer: 'ลิมิตซัมเมอร์ (ครบรอบปีเซิร์ฟ GB)' },          // sheet N6: "ลิมิตซัมเมอร์" (author 2026-10-14)
  bannerEn: { Sui: 'Festival (Sui)' },                                // sheet T5: "Sui" (author 2026-10-14)
  // A small line under a banner's name, by the sheet cell of its Thai name (author 2026-10-14; not in the sheet).
  note: { N6: 'รีเซ็ตโบนัสแพค Originite Prime คูณสองเซิร์ฟโกลบอล',
          W6: 'รีเซ็ตโบนัสแพค Originite Prime คูณสองเซิร์ฟจีน' },  // sheet AL6: same; Orienteering, sheet H6: "ตู้ไตร / ตู้โอเรียน / ....ตู้โอเลี้ยง" (author: meme out)
  // LIMITED guarantee, tightened at the author's request ("identify and reduce redundant words"). Sheet text after //.
  cell: {
    N12: 'ครบ 300 โรล รับตัวลิมิตหน้าตู้ฟรี 1 ตัว แม้สุ่มได้แล้ว (กดรับเองที่ตู้)', // author's pick of two proposals, 2026-10-11
    // การันตีตัวลิมิตหน้าตู้ 1 ครั้งเมื่อเปิดตู้นี้ครบ 300 โรล (มีผลแม้จะได้ลิมิตหน้าตู้ไปแล้ว แต่อย่าลืมกดรับที่ตัวตู้)
    N14: 'ทุกโรลได้ 1 Spark ไว้แลกใน Store',
    // การเปิดตู้ลิมิตแต่ละโรลจะให้แต้มที่เรียกกันว่าแต้ม "Spark" 1 แต้ม นำไปแลกในร้านค้า (Store)
    N15: '300 Spark แลกตัวหน้าตู้ หรือลิมิตหมวดเดียวกันอายุ 1 ปีขึ้นไป',
    // 300 Spark แลกตัวหน้าตู้หรือตัวลิมิตในหมวดเดียวกันที่อายุ 1 ปีขึ้นไป
    N16: '200 Spark แลกลิมิตเก่าหมวดเดียวกัน',
    // 200 Spark แลกตัวลิมิตเก่า ๆ ในหมวดเดียวกัน
    N18: 'การันตีและ Spark ไม่สะสมข้ามตู้',
    // การันตีตัวลิมิตหน้าตู้และแต้ม Spark สะสมข้ามไม่ได้
    // COLLAB guarantee (author 2026-10-11): each follow-on line folded into the line above it. '' = the line is gone.
    B11: 'Pity นับข้ามแค่กับตู้ STANDARD 5 ประเภทนี้: 6★ STANDARD คนใดก็ได้ใน ~60-70 โรล (ถึง 99 โรลถ้าซวย)', // author 2026-10-12; 4 -> 5 with Stronghold (2026-11-10)
    // sheet: "Pity (ออก 6★ STANDARD คนใดก็ได้) อยู่ที่ ~60-70 โรล (90 โรลถ้าซวย) แชร์แค่ตู้ STANDARD 4 ประเภทนี้"
    AC11: 'Pity นับข้ามแค่กับตู้ KERNEL 2 ประเภทนี้', // author 2026-10-12; sheet: "Pity แชร์ในตู้ KERNEL 2 ประเภทนี้ แต่ไม่แชร์กับตู้ประเภทอื่น"
    N11: [{ text: 'Pity กับการันตีเริ่มนับจาก 0 เสมอและไม่นับต่อตู้ใด ๆ', bold: true }, // author 2026-10-12 (a list = text with bold parts)
          { text: ' // Pity (ออก 6★ คนใดก็ได้) อยู่ที่ ~60-70 โรล (99 โรลถ้าซวย)' }],
    // sheet: "Pity (ออก 6★ คนใดก็ได้) อยู่ที่ ~60-70 โรล (90 โรลถ้าซวย) Pity กับการันตีเริ่มนับจาก 0 เสมอและไม่นับต่อตู้อื่น"
    AI11: 'Pity เริ่มนับจาก 0 เสมอและไม่นับต่อตู้ใด ๆ', // author 2026-10-12; sheet: "Pity เริ่มนับจาก 0 เสมอและไม่นับข้ามตู้"
    Z11: 'Pity กับการันตีเริ่มนับจาก 0 เสมอและไม่นับต่อตู้ใด ๆ', // COLLAB pity (author 2026-10-12); sheet: "Pity และการันตีเริ่มนับจาก 0 เสมอ"
    Z13: 'การันตี 6★ หน้าตู้ที่ 120 โรล (ไม่จำกัดครั้ง)', // การันตี 6★ หน้าตู้ที่ 120 โรล
    Z14: '',                                             // วนได้เรื่อยๆ
    Z15: 'การันตี 5★ หน้าตู้หลัง 50 โรลหากยังไม่ได้',    // การันตี 5★ หน้าตู้หลัง 50 โรล
    Z16: '',                                             // หากยังไม่ได้
    // Kernel Locating guarantee, my proposal at the author's request ("more coherent"), four lines into three
    AF13: 'เกมเลือก 6★ ฟ้า 12 ตัว + 5★ 24 ตัว',            // เกมเลือก 6★ ฟ้ามา 12 ตัว
    AF14: 'ให้เราตั้งเป็นเรตอัพได้ ดาวละ 3 ตัว',           // และ 5★ ฟ้า 24 ตัวมาให้เราตั้ง
    AF15: '',                                            // จะตั้งดาวละ 3 ตัวเป็นเรตอัพได้
  },
};
// Word fixes inside a cell that keep its bold parts (author 2026-10-12: hard pity is 99 rolls, the sheet says 90).
const FIX = { N11: [['90 โรลถ้าซวย', '99 โรลถ้าซวย']] };
const fix = (ref, t) => (FIX[ref] || []).reduce((s, [a, b]) => s.replace(a, b), t);
// A cell's text after the author's edits: EDITS.cell is a string, or a list of { text, bold } parts.
const edited = c => { const e = EDITS.cell[c.ref];
  if (Array.isArray(e)) return { text: e.map(r => r.text).join(''), runs: e };
  if (e != null) return { text: e, runs: null };
  return { text: fix(c.ref, c.text || ''), runs: c.runs ? c.runs.map(r => ({ ...r, text: fix(c.ref, r.text) })) : null }; };
// Banners the sheet does not have yet, added on the page first (author 2026-11-10: "note in my sheet, but you can
// add to our html now"). Each is a new column after an existing one; later columns move right by 291, and the
// category's title, bar and shared cells widen with it. Text is mine, from the in-game screenshots; the sheet's
// column replaces it once the author adds it.
const ADDED = [{
  after: 'K', widen: ['B2', 'B3', 'B11'],                 // STANDARD: title, bar, shared pity (it is a 【标准寻访】)
  like: { 4: 'H4', 5: 'H5', 6: 'H6', 7: 'H7', 8: 'H8', 9: 'B9', 10: 'H10', 12: 'H12', 19: 'H19', 20: 'H20' },
  text: {
    5: 'Stronghold',                                      // CN 卫戍寻访; banner art: "Stronghold Protocol Regulation"
    6: 'ตู้สตรองโฮลด์',                                     // author 2026-11-10 (CN 特选干员定向寻访)
    8: 'เซิร์ฟจีนเปิดครั้งแรก 8 Nov - 2 Dec',              // wiki.gg Headhunting/Banners/Upcoming
    9: '6★ 10 ตัวที่เกมคัดมา (ไม่มีเรตอัพ)',
    10: 'ออกแค่ 1 ใน 10 ตัว (แต่ออกซ้ำได้)',
    12: 'ไม่มีการันตีตัวไหน',
    20: 'ส่วนมากไม่มีโรลเปิด',                             // author 2026-11-10
  },
}];
const COL = 291;
function withAdded(cells) {
  let out = cells.map(c => ({ ...c }));
  for (const a of ADDED) {
    const at = out.find(c => c.ref === a.after + '4').x + COL;
    for (const c of out) { if (c.x >= at) c.x += COL; else if (a.widen.includes(c.ref)) c.w += COL; }
    for (const [row, like] of Object.entries(a.like)) {
      const src = cells.find(c => c.ref === like);
      out.push({ ...src, ref: 'ADD' + a.after + row, x: at, w: COL, text: a.text[row] || '', runs: null });
    }
  }
  return out;
}
const PASTEL = ['#ffffff', '#ffdabe', '#fff5ab', '#d9e9fd', '#ffd3e9', '#ddd9ff'];

function load() {
  const d = window.BANNERS_GRID;
  const cells = withAdded(d.cells);
  const S = d.styles, at = ref => cells.find(c => c.ref === ref);
  const BX = Array.from({ length: 13 + ADDED.length }, (_, i) => 143 + 291 * i);
  const cover = (bx, y0, y1, any) => cells.filter(c => c.x <= bx && bx < c.x + c.w && c.y >= y0 && c.y < y1 && (any || c.img || edited(c).text.trim()));
  const one = (bx, y) => cover(bx, y, y + 1, true)[0];
  const cell = c => c && ({
    ref: c.ref, ...edited(c), span: Math.round(c.w / 291), x: c.x,
    bold: !!S[c.s].bold, hl: PASTEL.includes(S[c.s].bg) && c.row >= 9, // the sheet's tinted "remember this" rows
  });
  const label = ref => (at(ref).text || '').replace(/\n/g, ' ');

  const families = cells.filter(c => c.row === 2).map(c => {
    const [en, ...th] = c.text.split(' ');
    return { ref: c.ref, en, th: th.join(' '), x: c.x, w: c.w, color: S[one(c.x, 45).s].bg, banners: [] };
  });
  const banners = BX.map((bx, i) => {
    const fam = families.find(f => f.x <= bx && bx < f.x + f.w);
    const b = {
      i, fam, img: one(bx, 58).ref,
      en: one(bx, 217).text, th: one(bx, 247).text, thRef: one(bx, 247).ref,
      stripe: S[one(bx, 282).s].bg, verdictColor: S[one(bx, 645).s].bg,
      when: cover(bx, 290, 328).map(cell),
      featured: cover(bx, 328, 404).map(cell),
      pity: cover(bx, 404, 439).map(cell), // row 11: no label in column A
      guarantee: cover(bx, 439, 645).map(cell),
      verdict: cover(bx, 656, 691).map(cell),
    };
    fam.banners.push(b);
    return b;
  });
  // For each spanning cell, which banners it covers.
  for (const b of banners) for (const k of ['when', 'featured', 'pity', 'guarantee', 'verdict'])
    for (const c of b[k]) c.of = banners.filter(o => c.x <= BX[o.i] && BX[o.i] < c.x + c.span * 291);
  // The author's edits on top of the sheet's text (2026-10-11). The sheet keeps its own text; the page shows these.
  for (const f of families) if (EDITS.family[f.en]) f.th = EDITS.family[f.en];
  for (const b of banners) if (EDITS.bannerTh[b.en]) b.th = EDITS.bannerTh[b.en];
  for (const b of banners) b.note = EDITS.note[b.thRef] || '';
  for (const b of banners) if (b.thRef === 'ADDK6') b.note = 'เซิร์ฟจีนเท่านั้น ยังไม่มาโกลบอล';
  for (const b of banners) if (EDITS.bannerEn[b.en]) b.en = EDITS.bannerEn[b.en];
  // Both Celebrations: drop "ของ" (author 2026-10-12; sheet Q6, W6: "ลิมิตครบรอบ(ครึ่ง)ปีของเซิร์ฟจีน").
  for (const b of banners) if (b.en === 'Celebration') b.th = b.th.replace('ปีของเซิร์ฟจีน', 'ปีเซิร์ฟจีน');
  return { families, banners, labels: { pity: '', ...Object.fromEntries(Object.entries(LABELS).map(([k, r]) => [k, label(r)])) } };
}

// Text of a cell as HTML, keeping the bold runs (N11, AC11).
function html(c) {
  const esc = s => s.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
  // One wrapping span: inside a flex cell, loose runs would become separate items and lose their spaces.
  if (c.runs) return `<span>${c.runs.map(r => r.bold ? `<b>${esc(r.text)}</b>` : esc(r.text)).join('')}</span>`;
  return `<span>${c.bold ? `<b>${esc(c.text)}</b>` : esc(c.text).replace(/\n/g, '<br>')}</span>`;
}

// Places one field of one family on a grid: one column per banner, sheet merges become column spans.
// Row = the cell's position in its banner's list (a shared cell takes the lowest slot it can share);
// a single-banner cell stretches down to the next filled slot, so gaps close the way the sheet's merges do.
function layoutField(fam, key) {
  const cols = fam.banners, seen = new Map(), items = [];
  cols.forEach((b, ci) => b[key].forEach((c, idx) => {
    if (seen.has(c.ref)) { const it = seen.get(c.ref); it.row = Math.max(it.row, idx); return; }
    const it = { cell: c, col: ci, span: c.of.filter(o => o.fam === fam).length, row: idx };
    seen.set(c.ref, it); items.push(it);
  }));
  const rows = Math.max(1, ...items.map(it => it.row + 1));
  for (const it of items) {
    if (it.span > 1) { it.rowSpan = 1; continue; }
    const below = items.filter(o => o !== it && o.row > it.row && o.col <= it.col && it.col < o.col + o.span).map(o => o.row);
    it.rowSpan = (below.length ? Math.min(...below) : rows) - it.row;
  }
  return { items, rows };
}

// The chosen look ("V26", author 2026-10-10), shared by the desktop rail and the phone layouts so they cannot drift.
// Colours, big numbers, category terms, and the two cells laid out for clarity. Style only: the sheet's text is
// unchanged, except Q9/W9, reworded with the author's approval.

// Category colours in the sheet's order (STANDARD, LIMITED, COLLAB, KERNEL, RECOLLECTION), muted like gauges on a
// console; the sheet's banner marks (row 7) and verdict colours (row 19) redrawn in the same tones. Then the author's
// two adjustments: saturation x1.2 ("20% livelier"), lightness x1.1 ("10% brighter").
const CATEGORY = ['#c9a94e', '#c46a42', '#b8698b', '#4d9cbe', '#7f77b6'];
const TONE = { '#ada256': '#c9a94e', '#58e3ed': '#5aaeb8', '#ff0000': '#c24a3f', '#ffc159': '#cf9f52', '#ff6eb6': '#b8698b',
  '#37b3f8': '#4d9cbe', '#8c82d7': '#7f77b6', '#ff9424': '#c98843', '#ffe100': '#c9a94e', '#a2d959': '#8fae5c' };
const SATURATION = 1.2, LIGHTNESS = 1.1;
// Per-category extra lightness on top (author 2026-10-11: LIMITED's orange "20% lighter", then "10% darker": 1.2 x .9).
const CATEGORY_LIGHT = [1, 1.08, 1, 1, 1];

function adjust(hex, extraLight = 1) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l0 = (mx + mn) / 2, d = mx - mn;
  if (!d) return hex;
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  const s = Math.min(1, d / (1 - Math.abs(2 * l0 - 1)) * SATURATION), l = Math.min(.95, l0 * LIGHTNESS * extraLight);
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [R, G, B] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [R, G, B].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
const tone = c => adjust(TONE[c] || c);
const categoryColour = i => adjust(CATEGORY[i], CATEGORY_LIGHT[i]);

// Banner images, one per banner type, in the sheet's order (row 4): the most recent EN banner of each type, fetched
// by banners/sync_banner_images.py into the author's site. On localhost or the home network the preview uses the
// local copy in proto/.img/.
const SLUGS = ['special', 'duo', 'orienteering', 'joint-operation', 'stronghold' /* CN only so far: wiki.gg's CN banner, copied by hand (2026-11-10) */, 'summer', 'celebration-half-year', 'sui',
  'celebration', 'collab', 'kernel', 'kernel-locating', 'standard-recollection', 'kernel-recollection'];
const IMG_BASE = 'https://lemonwait.github.io/doc/banners/'; // the author's site (AUTHOR-DECISIONS #6)
// Kernel Locating's art is wider (1560 x 500): it fills the box's height and keeps its left edge (rook icon and
// title), the right side cut (author 2026-10-11: "fit height, align left", option B).
const FIT = { 'kernel-locating': 'cover;object-position:left center', stronghold: 'cover;object-position:left center' }; // Stronghold: 1560 x 500 too
const bannerImg = b => `<img src="${IMG_BASE}${SLUGS[b.i]}.webp" alt="${b.en} banner" decoding="async"${FIT[SLUGS[b.i]] ? ` style="object-fit:${FIT[SLUGS[b.i]]}"` : ''}>`;

// Big numbers: two digits or more in PITY and GUARANTEE.
const lit = h => h.replace(/~?\d{2,}(?:[~-]\d+)?%?/g, m => `<span class="num">${m}</span>`);

const TERMS = /\b(?:Focused Selection|Standard Selection|Kernel Selection|Spark|STANDARD|Standard|LIMITED|KERNEL)\b|\d+%|1 ใน \d+/g;
const TERM_FAM = { 'Focused Selection': 'STANDARD', 'Standard Selection': 'STANDARD', 'Kernel Selection': 'KERNEL', Spark: 'LIMITED',
  STANDARD: 'STANDARD', LIMITED: 'LIMITED', KERNEL: 'KERNEL' };

// Everything that needs the category list.
function makeLook(families) {
  const famColour = en => categoryColour(families.findIndex(f => f.en === en));
  // Terms: a category's own words take that category's colour; a rate or "1 ใน 3" takes the colour of its group.
  const mark = (h, fc) => h.replace(TERMS, m => {
    const fam = TERM_FAM[m] || TERM_FAM[m.toUpperCase()];
    return `<span class="term${/^\d+%$/.test(m) ? ' rate' : ''}" style="--tc:${fam ? famColour(fam) : fc}">${m}</span>`;
  });
  // Two cells laid out for clarity (author: "less confusing", "too mouthy").
  //  Q9, W9: the 6★ line, reworded with the author's approval (sheet: "6★ ใหม่ 3 ตัว (แจกฟรี 1, ไม่อยู่ในตู้)").
  //  N10: "ลิมิตหน้าตู้ 35%, STANDARD หน้าตู้ 35%, โอกาสหลุดเรต (...) 30%" as a three-part bar, each % over its own words.
  function special(cell, fc) {
    if (cell.ref === 'Q9' || cell.ref === 'W9')
      return `<span class="two"><span>6★ ใหม่ 2 ตัวในตู้</span><span class="sub">+ แจกฟรีอีก 1 ตัว (ไม่อยู่ในตู้)</span></span>`;
    if (cell.ref === 'N10') {
      const segCol = [famColour('LIMITED'), famColour('STANDARD'), 'rgba(230, 232, 240, .8)']; // the 30 % part: as bright as the Thai labels (author)
      return '<span class="split">' + cell.text.split(/,\s*(?![^()]*\))/).map((part, i) => {
        const m = part.match(/^(.*?)\s*(\d+%)$/);
        return `<span class="seg" style="flex:${parseInt(m[2])};--sc:${segCol[i]}"><b>${m[2]}</b><small>${mark(m[1], fc)}</small></span>`;
      }).join('') + '</span>';
    }
    return null;
  }
  // A cell's content as the chosen look renders it; `big` for PITY and GUARANTEE.
  // A side note set smaller so its line does not wrap (author: COLLAB's "(ไม่จำกัดครั้ง)").
  const NOTE = '(ไม่จำกัดครั้ง)';
  // Each pity row leads with a word set like the big numbers (author 2026-10-12): RESET // where it starts again at 0
  // on every banner, the category's name where it carries over between that category's banners.
  const RESET = { N11: 'RESET', Z11: 'RESET', AI11: 'RESET', B11: 'STANDARD', AC11: 'KERNEL' };
  const reset = (cell, h) => { const w = RESET[cell.ref]; if (!w) return h; const tag = `<span class="num reset">${w} //</span> `;
    h = h.replace(' // ', ' <span class="num reset">//</span> '); // a // inside the line, set the same way (author)
    return h.startsWith('<span>') ? '<span>' + tag + h.slice(6) : tag + h; };
  const render = (cell, fc, big, html) => reset(cell, (special(cell, fc) || mark(big ? lit(html(cell)) : html(cell), fc)).replace(NOTE, `<span class="note">${NOTE}</span>`));
  return { famColour, mark, special, render };
}

return { EDITS, LABELS, TAGS, adjust, bannerImg, categoryColour, html, layoutField, lit, load, makeLook, tone };
})();
