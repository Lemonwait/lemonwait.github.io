// The AFK card renderer (card U), shared by the live AFK page (x-afk-template.html) and, as a copy, the editor
// (proto/afk-editor.html). Drawn from the author's editor layout (window.AFK_LAYOUT, afk-layout.js); facts per unit in afk-aoe.js and
// afk-facts.js. Generated from the editor's code; keep the two in step (author, 2026-11-13: "implement them").
// It expects: CARDS (the page's units), window.AFK_LAYOUT, window.AFK_AOE, window.AFK_FACTS, window.AFK_CROWN.
let L = window.AFK_LAYOUT, sel = null, zoom = 1;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const IC = {
  clock: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 4v4.3l2.6 1.6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  play: '<svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
  bolt: '<svg viewBox="0 0 16 16"><path d="M9.5 1 3 9h4.5L6.5 15 13 7H8.5z" fill="#cfe062"/></svg>'};
const DT = {phys: 'PHYS', arts: 'ARTS', true: 'TRUE', necrosis: 'NECROSIS', burn: 'BURN', nervous: 'NERVOUS', corrosion: 'CORROSION'};
// the live tile's facts (x-afk-template.html, facts())
function facts(c) {
  const a = c.author.afk || {}, f = a.facts || {}, role = new Set((f.role || '').split(' ').filter(Boolean));
  const m = c.module, st = m && m.stages[((m.recommended || [])[0] || 1) - 1];
  const cost = c.base.cost + (c.pot_bonus.cost || 0) + ((st && st.stats.cost) || 0);
  const melee = a.position === 'MELEE', block = melee ? c.base.block + (f.blk || 0) : 0;
  const [sec] = f.ramp || [null], [cut1, cut2] = a.ramp_cut || [10, 30];
  const ramp = sec == null ? '' : sec <= cut1 ? 'none' : sec <= cut2 ? 'short' : 'long';
  return {lane: !!c.lane, melee, block, cost, ramp, sec, role, dts: (f.dt || '').split(' ').filter(Boolean),
          heal: role.has('gheal') ? 'gheal' : role.has('heal') ? 'heal' : '', ign: f.ign || '', range: c.skill.range || c.range};
}
// kind (afk-aoe.js): 'true' fills every tile in range; 'splash' a target (the farthest tile straight ahead) solid and the range tiles
// within r of it filled (r null: 1 tile, a stand-in)
function range(tiles, kind, rad, spin) {
  if (!tiles || !tiles.length) return '';
  const rs = tiles.map(t => t[0]), cs = tiles.map(t => t[1]);
  const on = new Set(tiles.map(t => t.join(',')));
  const ahead = tiles.filter(t => t[0] === 0 && t[1] > 0), tg = kind === 'splash' && (ahead.length ? [0, Math.max(...ahead.map(t => t[1]))] : tiles[0]);
  // a splash reaches every tile round its target, the 8 at radius 1, out of range too (author, 2026-11-07: "zima is splash so 8 tile
  // around her target too"); the grid grows to hold them
  const R = Math.ceil(rad || 1);
  const r0 = Math.min(...rs, 0, tg ? tg[0] - R : 0), r1 = Math.max(...rs, 0, tg ? tg[0] + R : 0);
  const c0 = Math.min(...cs, 0, tg ? tg[1] - R : 0), c1 = Math.max(...cs, 0, tg ? tg[1] + R : 0);
  const cls = (r, c) => { const k = r + ',' + c;
    if (r === 0 && c === 0) return 'op';
    if (tg && r === tg[0] && c === tg[1]) return 'tg';
    if (!on.has(k)) return 'no';
    if (kind === 'true') return 'hit';
    return ''; };
  let h = `<div class="g" style="grid-template-columns:repeat(${c1 - c0 + 1},10px)">`;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) h += `<i class="${cls(r, c)}"></i>`;
  // a splash: a dashed cyan ring round its one target, the blast's radius (author, 2026-11-07: "i loved zima's earliest highlight where
  // circled around one-target more"); r tiles = r x 12px from the target's centre, plus 3 so the ring clears the 8 tiles round it
  if (tg) { const x = (tg[1] - c0) * 12 + 5, y = (tg[0] - r0) * 12 + 5, rr = R * 12 + 3;
    h += `<svg class="ring" style="left:${x - rr - 1}px;top:${y - rr - 1}px;width:${2 * rr + 2}px;height:${2 * rr + 2}px"><circle cx="${rr + 1}" cy="${rr + 1}" r="${rr}" fill="none" stroke="#18d1ff" stroke-width="1.3" stroke-dasharray="3 2"/></svg>`; }
  // a spin round the unit: a cyan loop with an arrowhead round its own tile (10px tiles, 2px apart)
  // PRTS (stated, 2026-11-07): "投出的盾牌以自身前方1.2格为起点，逆时针旋转365°，角速度90°/s，碰撞半径1.0": the shield starts 1.2 tiles in front,
  // turns 365° anticlockwise at 90°/s, hits within 1.0 tile of itself; so the loop's radius is 1.2 tiles = 14.4px (a tile 12px apart)
  // it starts in front of her (a dot) and turns to her left, the top of the box when she faces right, round to the front again (author,
  // 2026-11-07: "does it not start in front of her then rotate to her left?")
  // its radius reaches 80% into the melee tile ahead (author, 2026-11-07: "radius reach 80% of her melee range"): that tile runs 7px to
  // 17px from her centre, so 7 + 0.8 x 10 = 15px; the 22-unit drawing (radius 8.5) scaled by 15 / 8.5, its line kept at 1.6px
  if (spin) { const x = -c0 * 12 + 5, y = -r0 * 12 + 5, k = 14.4 / 8.5, w = 1.6 / k;
    h += `<svg class="spin" style="left:${x - 11 * k}px;top:${y - 11 * k}px;width:${22 * k}px;height:${22 * k}px" viewBox="0 0 22 22"><circle cx="19.5" cy="11" r="1.3" fill="#18d1ff"/><path d="M19.5 11A8.5 8.5 0 1 0 17.51 16.46" fill="none" stroke="#18d1ff" stroke-width="${w}"/><path d="M19.05 14.62L18.81 18.33 15.43 15.51z" fill="#18d1ff"/></svg>`; }
  return h + '</div>';
}
// a chip part: lit or not, and whether a dim one is drawn at all
const chipP = (label, on, sub) => ({chip: true, html: (c, F) => { const o = on(F, c); return {on: o, h: `<div class="c${o ? ' on' : ''}">${typeof label === 'function' ? label(F, c) : label}${sub ? `<small>${sub(F, c) || ''}</small>` : ''}</div>`}; }});
// every part: its name and how it draws (h: html; on: lit, for chips)
const PARTS = {
  avatar: {name: 'Avatar', html: c => `<div class="p-img"><img src="${esc(c.avatar)}" alt=""></div>`},
  // King / Queen of AFK: Civilight Eterna's S3 crown, metallic gold, slanted on the portrait's top-left corner, a soft shadow; their
  // title band dropped (author, 2026-11-07: "we can also delete this and make it crown on op portrait left corner instead", "approve")
  crown: {name: 'Crown (U)', html: c => { const a = c.author.afk || {};
    return CROWNED(a) ? `<img class="p-crown" src="${window.AFK_CROWN}" alt="" title="${esc(String(a.title).trim())}">` : ''; }},
  name:   {name: 'Name', html: c => `<div class="p-name">${esc((c.author.afk || {}).name || c.name)}</div>`},
  fullname: {name: 'Full name', html: c => `<div class="p-name">${esc(c.name)}</div>`},
  // the whole icon, uncut, centred in its box (author, 2026-11-13: "center the icons"): a box not square no longer crops its sides
  skicon: {name: 'Skill icon', html: c => `<div class="p-img p-icon"><img src="${esc(c.skill_icon)}" alt=""></div>`},
  skname: {name: 'Skill name', html: c => `<div class="p-sk">S${c.skill.no} · ${esc(c.skill.name)}</div>`},
  timing: {name: 'SP lines', html: c => { const t = (c.author.afk || {}).timing || [];
    return `<div class="p-tm"><div>${IC.clock}${t[0] === '∞' ? '<svg class="inf" viewBox="0 0 24 12" aria-label="unlimited"><path d="M12 6C9.4 2.2 3.4 2 3.4 6s6 3.8 8.6 0 8.6-3.8 8.6 0-6 3.8-8.6 0z" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>' : esc(t[0] || '-')}</div><div>${IC.play}${esc(t[1] || '-')}</div><div>${IC.bolt}${esc(t[2] || '-')}</div></div>`; }},
  module: {name: 'Module', html: c => c.module ? `<div class="p-md"><div><div class="code">${esc(c.module.code)}</div><div class="lv">${esc((c.author.afk || {}).level || '')}</div></div><img src="${esc(c.module.icon)}" alt=""></div>` : ''},
  bar:    {name: 'Colour bar', html: c => `<div class="p-bar" style="background:${(c.author.afk || {}).bar || '#54575d'}"></div>`},
  sum:    {name: 'Summary', html: c => (c.author.afk || {}).summary ? `<div class="p-sum">${esc(c.author.afk.summary)}</div>` : ''},
  stats:  {name: 'Stat strip', html: (c, F) => `<div class="p-stats">${[['HP', c.base.hp], ['ATK', c.base.atk], ['DEF', c.base.def], ['BLOCK', F.block || '-', 1], ['DP', F.cost, 1], ['RAMP', F.ramp ? (F.ramp === 'none' ? 'NONE' : F.sec + 's') : '-', 1]]
      .map(([k, v, w]) => `<div><span class="k">${k}</span><b class="${w ? 'w' : ''}">${v}</b></div>`).join('')}</div>`},
  roletags: {name: 'Role tags (lit only)', html: (c, F) => `<div class="p-tags">${[[F.block > 0, 'BLOCK ' + F.block], [F.role.has('tank'), 'TANK'], [!!F.heal, F.heal === 'gheal' ? 'GROUND HEAL' : 'HEAL'],
      [F.role.has('dps'), 'DPS'], [F.role.has('aoe'), 'AOE'], [F.role.has('hits'), 'MULTI-HIT'], [F.role.has('dot'), 'DOT'], [F.role.has('reveal'), 'REVEAL'], [!!F.ign, 'IGNORES DODGE / DR']]
      .filter(x => x[0]).map(x => `<span>${x[1]}</span>`).join('')}</div>`},
  c_block: chipP((F) => F.block > 0 ? 'BLOCK ' + F.block : 'BLOCK', F => F.block > 0, (F) => F.block > 0 ? '' : F.melee ? 'NONE' : 'RANGED'),
  c_tank: chipP('TANK', F => F.role.has('tank')),
  c_heal: chipP('HEAL', F => !!F.heal, F => F.heal === 'gheal' ? 'GROUND' : ''),
  c_dps:  chipP('DPS', F => F.role.has('dps')),
  c_aoe:  chipP('AOE', F => F.role.has('aoe')),
  v_dt:   {name: 'Damage type', html: (c, F) => `<div class="c val">${F.dts.length ? F.dts.map(d => `<b class="dt-${d}">${DT[d]}</b>`).join(' + ') : '<b>-</b>'}</div>`},
  // its targets at the left, "-24 DP" at the right (author, 2026-11-07: "i meant dp can be on the right"); the targets, from afk-aoe.js: TRUE AOE, SPLASH AOE, or the number of
  // targets (1 for one) ("think this can be target: True AoE/Splash AoE/n , DP can be left")
  v_dp:   {name: 'DP + targets', html: (c, F) => { const k = (window.AFK_AOE || {})[c.name] || [];
    // a count of targets as one big cyan number spilling past its chip, the word small beside it (author, 2026-11-07: "try big thrree
    // like this")
    // crushers and centurions hit every enemy they block: the count is their block count, said under the word (author, 2026-11-08:
    // "for centurion and crusher, make it clear they're block count based", "targets / (block count)")
    const {n, blk} = COUNT(c, F);
    const t = n != null ? `${(L.numFont || '') === 'drawn' && DRAWN[n] ? `<svg class="bigd" viewBox="0 -1 60 82"><path d="${DRAWN[n]}" fill="none" stroke="#18d1ff" stroke-width="13" stroke-linecap="butt" stroke-miterlimit="6"/></svg>` : `<b class="big">${n}</b>`}`   /* the words are their own parts now (tword, bcount) */ : {true: 'TRUE AOE', splash: 'SPLASH AOE'}[k[0]] ? `<b class="aoew">${{true: 'TRUE AOE', splash: 'SPLASH AOE'}[k[0]]}</b>` : '';
    return `<div class="c val dpt">${t ? `<span class="${n != null ? 'num' : ''}">${t}</span>` : '<span></span>'}</div>`; }},   // DP moved to the tag row
  // TARGETS and (BLOCK COUNT) as parts of their own, each moved and sized on its own; the text's drawn capitals fill the box's height,
  // smaller only if the width runs out (author, 2026-11-08: "lemme move and resize the targets and block count separately")
  // the DP cost as a part of its own, moved and sized alone: Urbanist 800 with a true minus, its digits' drawn height filling the box; the
  // small DP on its baseline at GUIDE USAGE's size (author, 2026-11-08: "use urban", "let me resize -24 and move it around")
  dpcost: {name: 'DP cost (U)', html: (c, F) => `<div class="p-dpc"><b>&minus;${F.cost}</b><span>DP</span></div>`},
  tword:  {name: 'Targets word (U)', html: (c, F) => { const {n} = COUNT(c, F); return n == null ? '' : `<div class="p-fitw">${n === 1 ? 'TARGET' : 'TARGETS'}</div>`; }},
  // its brackets in Google Sans 400 at 85%, not the face's own (X-DESIGN, heal block: "better parentheses font"; author, 2026-11-08:
  // "didn't i ban that font for specifically parentheses?")
  bcount: {name: 'Block count note (U)', html: (c, F) => COUNT(c, F).blk ? '<div class="p-fitw"><span class="par">(</span>BLOCK COUNT<span class="par">)</span></div>' : ''},
  v_ramp: {name: 'Ramp', html: (c, F) => `<div class="c val"><span class="k">RAMP</span><b>${F.ramp ? F.ramp.toUpperCase() : '-'}</b>${F.ramp && F.ramp !== 'none' ? `<span class="ts">${F.sec}s</span>` : ''}</div>`},
  c_hits: chipP('MULTI-HIT', F => F.role.has('hits')),
  c_dot:  chipP('DOT', F => F.role.has('dot')),
  c_rev:  chipP('REVEAL', F => F.role.has('reveal')),
  c_ign:  chipP('IGNORES', F => !!F.ign, () => 'DODGE / DR'),
  range:  {name: 'Range', html: (c, F) => { const k = (window.AFK_AOE || {})[c.name] || [];
    return `<div class="p-rg" title="${esc(k[2] || '')}">${range(k[3] || F.range, k[0], k[1], /spin/.test(k[4] || ''))}</div>`; }},
  tag:    {name: 'Tag', html: c => { const a = c.author.afk || {}, t = a.tag || ''; return `<div class="p-tag${/[฀-๿]/.test(t) ? ' th' : ''}" style="background:${a.tag_bg || 'transparent'};color:${a.tag_fg || '#000'}">${esc(t)}</div>`; }},
  freq:   {name: 'Guide frequency', html: c => { const a = c.author.afk || {}; return a.freq ? `<div class="p-freq" style="background:${a.freq_bg || 'transparent'}">${esc(a.freq)}</div>` : ''; }},
  title:  {name: 'Title', html: c => { const a = c.author.afk || {}; return a.title && !CROWNED(a) ? `<div class="p-ttl" style="background:${a.title_bg || '#eee'}"><span>${esc(String(a.title).trim())}</span></div>` : ''; }},
  // the sheet's title, the title band removed, as the notes' first line; King / Queen of AFK stay the crown (author, 2026-11-13: "ive
  // removed title text, so put those into the first line of their own desc")
  notes:  {name: 'Notes', html: c => { const a = c.author.afk || {}, t = String(a.title || '').trim();
    const ls = [...(t && !CROWNED(a) ? [t] : []), ...(c.author.notes || [])];
    return `<ul class="p-notes">${ls.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`; }},
  src:    {name: 'Source', html: c => `<div class="p-src">${esc(c.author.source)}</div>`},
  // card U (author, 2026-11-07): the roles it has, LANE in place of AOE for a LANE-page unit; a long one takes the row. The DPS chip
  // first, at the upper left, as GROUND ATTACK (melee) or AERIAL ATTACK (ranged) ("fix melee chip to upper left, change its text to
  // ground attack / for ranged dps, aerial attack"); it keeps one cell
  uchips: {name: 'Chips, lit only (U)', html: (c, F) => `<div class="p-uc">${[F.role.has('dps') && (F.melee ? 'GROUND ATTACK' : 'AERIAL ATTACK'),
      F.block > 0 && 'BLOCK ' + F.block, F.role.has('tank') && 'TANK',
      F.heal === 'gheal' ? 'GROUND HEAL' : F.heal && 'HEAL', F.lane ? 'LANE' : F.role.has('aoe') && 'AOE',
      F.role.has('hits') && 'MULTI-HIT', F.role.has('dot') && 'DOT', F.role.has('reveal') && 'REVEAL', F.ign && 'IGNORES DODGE/DR'].filter(Boolean)
      .map(x => `<div class="${x.length > 10 && !/ ATTACK$/.test(x) ? 'w' : ''}"><span class="cap">${/ ATTACK$/.test(x) ? SWORDS + x.replace(/ ATTACK$/, '') : x}</span></div>`).join('')}</div>`, labels: (c, F) => [...PARTS.uchips.html(c, F).matchAll(/<div class="(w?)">([^<]*)</g)].map(m => [m[2], !!m[1]])},
  // two or more types: the X cards' split bar (x-card-template.html splitBar; author, 2026-11-07: "thorns' portions also look hidieous"):
  // one bar, each joint blended over 8%, full colour to 93%, then a short steep fade; the AFK data has no damage shares, so equal parts
  // the tag and the guide line as two filled labels on one row, each in a fixed half, the sheet's colours (author, 2026-11-07: "i like C
  // but พบบ่อยในไกด์ also deserves its own chip", "perhaps the two could be on the same row, fixed position unaffected by text size
  // changing"); each half's text one size for every unit, set by its longest (tagSize)
  // กึ่ง AFK shown as SEMI-AFK (author, 2026-11-07: "กึ่ง afk to semi-afk")
  // the DP cost right after the tag (author, 2026-11-07: "move -24 dp to behind true afk")
  tagrow: {name: 'Tag + DP (U)', html: (c, F) => { const a = c.author.afk || {}, t = (a.tag || '').replace(/^กึ่ง AFK$/, 'SEMI-AFK');
    // TRUE AFK in the target number's cyan #18d1ff, not the sheet's #58E3ED (author, 2026-11-08: "true afk chip, use 3's cyan")
    const bg = String(a.tag_bg).toUpperCase() === '#58E3ED' ? '#18d1ff' : a.tag_bg || '#54575d';
    return `<div class="p-tr"><div class="${/[฀-๿]/.test(t) ? 'th' : ''}" style="background:${bg};color:${a.tag_fg || '#000'}"><span class="cap">${esc(t)}</span></div>` +
      '</div>'; }},   // DP is its own part now (dpcost)
  // guide usage on a 5-step scale, its own row under the tag (author, 2026-11-07: "guide usage up to 5 instead, below true afk row");
  // the sheet's 4 words placed on it by Claude, to approve: frequent 5, frequent in old-gen guides 4 + OLD, sometimes 3, rarely 1
  usage: {name: 'Guide usage (U)', html: c => { const a = c.author.afk || {}, n = USAGE[a.freq];
    return n == null ? '' : `<div class="p-us" title="${esc(a.freq)}"><span class="ln"><span class="k">GUIDE USAGE</span>${a.freq === 'พบบ่อยในไกด์เจนเก่า' ? '<small> OLD</small>' : ''}</span></div>`; }},
  // the 5 squares as a part of their own, dragged and sized by hand (author, 2026-11-08: "let me drag it"): each square as tall as the
  // box, 2px apart, the level filled
  usq: {name: 'Guide usage squares (U)', html: c => { const a = c.author.afk || {}, n = USAGE[a.freq];
    return n == null ? '' : `<div class="p-usq" title="${esc(a.freq)}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`; }},
  // a 1px grey hairline between the SP lines and the tag / guide usage rows (author, 2026-11-07: "should there be an accent separating
  // them from skill cycle info", "1"): REFERENCE "Boundaries without a border", no accent
  // lighter, #6b6e75 (author, 2026-11-07: "the barracade is too invisible")
  vrule: {name: 'Hairline (U)', html: () => '<div style="width:1px;height:100%;background:#6b6e75;margin:0 auto"></div>'},
  // the class (branch) icon, big and ghostly, behind the empty right end of the tag / guide usage rows (author, 2026-11-07: "perfect for
  // class icon as bigass ghostly background")
  // the main class, not the branch (author, 2026-11-07: "sorry, main class"); the site's class icons
  classghost: {name: 'Class ghost (U)', html: c => c.cls ? `<img class="p-ghost" src="https://lemonwait.github.io/operator/class/class_${c.cls}.png" alt="" title="${esc(c.cls.toUpperCase())}">` : ''},
  udmg: {name: 'Damage bar (U)', html: (c, F) => { const n = F.dts.length;
    if (n < 2) return `<div class="p-dmg">${n ? `<div style="--dc:${DTC[F.dts[0]]}"><span${WHT.has(F.dts[0]) ? ' style="color:#fff"' : ''}>${DT[F.dts[0]]}</span></div>` : '<div class="none"><span>NO DAMAGE</span></div>'}</div>`;
    const w = 100 / n, st = F.dts.flatMap((d, i) => [`${DTC[d]} ${i ? (i * w + 4).toFixed(2) : 0}%`, `${DTC[d]} ${i < n - 1 ? ((i + 1) * w - 4).toFixed(2) : 100}%`]);
    return `<div class="p-dmg"><div class="split" style="background:linear-gradient(90deg,transparent 93%,rgba(32,33,36,.75) 97.5%,#202124 100%),linear-gradient(90deg,${st.join(',')})">` +
      F.dts.map((d, i) => `<span style="left:calc(${(i ? i * w + 4 : 0).toFixed(2)}% + 6px)${WHT.has(d) ? ';color:#fff' : ''}">${DT[d]}</span>`).join('') + '</div></div>'; }},
};
// white label on Mania only, as the X cards (author, 2026-11-07: "then dark is fine" for Nervous)
const WHT = new Set(['mania']);
const DTC = {phys: 'rgb(255,225,0)', arts: 'rgb(255,132,193)', true: '#ffffff', necrosis: 'rgb(170,157,210)', burn: 'rgb(255,104,56)', nervous: 'rgb(0,168,195)', corrosion: 'rgb(148,194,255)'};
for (const [k, l] of [['c_block', 'Chip BLOCK'], ['c_tank', 'Chip TANK'], ['c_heal', 'Chip HEAL'], ['c_dps', 'Chip DPS'], ['c_aoe', 'Chip AOE'],
  ['c_hits', 'Chip MULTI-HIT'], ['c_dot', 'Chip DOT'], ['c_rev', 'Chip REVEAL'], ['c_ign', 'Chip IGNORES']]) PARTS[k].name = l;
// the chips' one size for every unit: the largest that lets the longest chip of all 50 units fit its chip (author, 2026-11-07: "make
// text stay within its chips, calc longer text and use static size accordingly"); a two-wide chip has the row
const ucMeas = document.createElement('canvas').getContext('2d');
// it measured every chip label of all 50 units for every tile on every redraw: kept per width / size / padding now (author, 2026-11-08:
// "my pc lagging")
const ucMemo = {};
function ucSize(p) { const key = [p.w, p.fs, !!L.fade].join('|'); if (ucMemo[key] == null) ucMemo[key] = ucSizeRaw(p); return ucMemo[key]; }
function ucSizeRaw(p) {
  ucMeas.font = '100px "Bebas Neue"';
  const pad = L.fade ? 12 : 10, cell = (p.w - 2) / 2 - pad, row = p.w - pad;   // the chip's side padding (12 with the left accent)
  let fs = p.fs || 14;
  for (const c of CARDS) for (const [t, w] of PARTS.uchips.labels(c, facts(c))) {
    const per = (ucMeas.measureText(t).width + .03 * 100 * t.length) / 100;   // px of text per 1px of font size
    fs = Math.min(fs, (w ? row : cell) / per);
  }
  return Math.floor(fs * 2) / 2;
}
// a label's top so that its drawn capitals sit in the middle of its bar (as the X cards' inkRatio): line-height 1, canvas metrics
const inkMeas = document.createElement('canvas').getContext('2d');
function inkCentre(sp) {
  const cs = getComputedStyle(sp), box = sp.parentElement;
  // the capitals 87.5% of the bar (the X rule's 1.25 x the font's 0.7 cap height), so the gap above equals the gap below
  inkMeas.font = `${cs.fontWeight} 100px ${cs.fontFamily}`;
  const m0 = inkMeas.measureText(sp.textContent), fs = box.clientHeight * .875 / ((m0.actualBoundingBoxAscent + m0.actualBoundingBoxDescent) / 100);
  sp.style.fontSize = fs + 'px';
  inkMeas.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
  const m = inkMeas.measureText(sp.textContent), base = (fs - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent;
  const mid = base - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  sp.style.top = (box.clientHeight / 2 - mid) + 'px';
  if (!sp.style.left) sp.style.left = '6px';
}
// the guide line in English words for how often a unit shows in guides (author, 2026-11-07: "พบบ่อยในไกด์ can use english words that
// better represent the frequency"); the sheet's Thai stays as the label's tooltip. Claude's wording, to approve
// (author, 2026-11-07: "frequent / oldies??? / rare")
const FREQ_EN = {'พบบ่อยในไกด์': 'FREQUENT', 'พบบ้างในไกด์': 'OCCASIONAL', 'แทบไม่เห็นในไกด์': 'RARE', 'พบบ่อยในไกด์เจนเก่า': 'OLDIES'};
// the guide label's text colour by its fill, the tag's own rule from the sheet (TRUE AFK #58E3ED black; กึ่ง AFK #C65D0F / #C11212 white)
// (author, 2026-11-07: "said frequent can use afk's label rule")
const LABEL_FG = {'#58E3ED': '#000000', '#C65D0F': '#FFFFFF', '#C11212': '#FFFFFF'};
// the guide label in the tag's colours (author, 2026-11-07: "im not seeing frequent blue"): frequent = TRUE AFK's cyan, occasional = SEMI-AFK's
// orange, rare = the red; the sheet's lime is not used
// the guide frequency as the word and three squares, the level filled (author, 2026-11-07: "FREQUENT: ▮▮▮ ... this looks nice tho"); no fill,
// its own white, not the tag's colours ("the two aren't related"); OLDIES = FREQUENT with OLD
const USAGE = {'พบบ่อยในไกด์': 5, 'พบบ่อยในไกด์เจนเก่า': 4, 'พบบ้างในไกด์': 3, 'แทบไม่เห็นในไกด์': 1};
const FREQ_LV = {'FREQUENT': 3, 'OLDIES': 3, 'OCCASIONAL': 2, 'RARE': 1};
const FREQ_BG = {'FREQUENT': '#58E3ED', 'OLDIES': '#58E3ED', 'OCCASIONAL': '#C65D0F', 'RARE': '#C11212'};
// the drawn digits (afk-digit-drawn.html), one even stroke with slanted ends (author, 2026-11-07: "i also want to try waht you drew")
const DRAWN = {3: 'M11 27C15 11 41 7 46 23C49 33 41 41 29 41M29 41C44 41 51 52 47 63C42 77 19 78 11 65', 2: 'M10 28C13 12 40 7 46 22C51 36 38 46 12 72L50 72', 1: 'M22 18L34 9L34 74'};
// a unit's target count: crushers and centurions count their block (blk), and units marked 'block' in afk-aoe.js (Mountain, Hoshiguma2), else afk-aoe.js's N or 1 (null for AoE / no damage)
const COUNT = (c, F) => { const k = (window.AFK_AOE || {})[c.name] || [], blk = (/^(CRUSHER|CENTURION)$/i.test(c.branch || '') || /block/.test(k[4] || '')) && F.block > 0;
  return {blk, n: blk ? F.block : k[0] === 'nt' ? k[1] : k[0] === 'st' ? 1 : null}; };
// ATTACK drawn as crossed swords, angular blades and square guards, just before GROUND / AERIAL with no space (author, 2026-11-13:
// "change attack to crossed swords, ak style, in front of ground/aerial, no space"); our own drawing, in the text's colour, cap-high
const SWORDS = '<svg class="swd" viewBox="0 0 20 20" aria-label="attack"><g fill="currentColor"><path d="M1 1h4.2l9.3 9.3-1.6 1.6L3.6 2.6V4.9L1 2.3z"/><path d="M19 1h-4.2L5.5 10.3l1.6 1.6 9.3-9.3V4.9L19 2.3z"/><path d="M3.3 12.4l1.4-1.4 4.3 4.3-1.4 1.4zM16.7 12.4l-1.4-1.4-4.3 4.3 1.4 1.4zM1.2 17.4l2.6-2.6 1.4 1.4-2.6 2.6zM18.8 17.4l-2.6-2.6-1.4 1.4 2.6 2.6z"/></g></svg>';
const CROWNED = a => /^(King|Queen) of AFK$/i.test(String(a.title || '').trim());
// one size per half of the tag row for every unit: the largest that fits the longest word of all 50 (as ucSize)
function tagSize(p, i) {
  const words = [...new Set(CARDS.map(c => { const a = c.author.afk || {}; return i ? a.freq : a.tag; }).filter(w => w && w !== '-'))];
  const w = (p.w - 2) / 2 - 12; let fs = p.fs || 14;
  for (const t of words) { const th = /[฀-๿]/.test(t); ucMeas.font = th ? '700 100px Sarabun' : '100px "Bebas Neue"';
    fs = Math.min(fs, w / ((ucMeas.measureText(t).width + (th ? 0 : 4 * t.length)) / 100)); }
  return Math.floor(fs * 4) / 4;
}
function drawTile(el, c, edit) {
  const F = facts(c);
  // the big number's face, picked in the side panel (author, 2026-11-07: "kanit 700, add it", "to one of my choices for beeg number")
  // Urbanist 800 by default (author, 2026-11-07: "for our work, use urbanist 800 for the target number")
  { const [nf, nw] = ((L.numFont || '').includes('|') ? L.numFont : 'Urbanist|800').split('|'); el.style.setProperty('--nf', `"${nf}"`); el.style.setProperty('--nw', nw); }
  el.style.width = L.W + 'px'; el.style.height = L.H + 'px'; el.style.backgroundColor = L.bg || ''; el.classList.toggle('fd', !!L.fade);
  el.innerHTML = Object.entries(L.parts).map(([k, p]) => {
    if (!p.on && !edit) return '';
    const r = PARTS[k].html(c, F), h = typeof r === 'string' ? r : r.h, off = typeof r === 'object' && !r.on;
    if (off && !p.dim && !edit) return '';
    const ghost = edit && (!p.on || (off && !p.dim));
    if (edit && !p.on && k !== sel) return '';
    return `<div class="part${k === sel && edit ? ' sel' : ''}${ghost ? ' ghost' : ''}" data-k="${k}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px;font-size:${k === 'udmg' ? p.h * 1.25 : p.fs || 13}px">` +
      `<div class="in">${h}</div>${edit ? `<span class="lab">${PARTS[k].name}</span><i class="rz"></i>` : ''}</div>`;
  }).join('');
  el.querySelectorAll('.p-dmg span').forEach(inkCentre);
  // DP's label as big as GUIDE USAGE's, whatever either part's font size (author, 2026-11-08: "DP should be as big as GUIDE USAGE")
  el.querySelectorAll('.p-tr .dpx span').forEach(e => { const u = L.parts.usage; if (u) e.style.fontSize = (u.fs || 14) * .85 + 'px'; });
  // the drawn digit: its viewBox fitted to the stroke's own extent, then sized 3px past the chip at the top and the bottom
  el.querySelectorAll('.dpt svg.bigd').forEach(g => { const b = g.querySelector('path').getBBox(), w = 6.5, SPd = L.numSpill ?? 3, H = g.closest('.dpt').clientHeight + 2 * SPd;
    g.setAttribute('viewBox', `${b.x - w} ${b.y - w} ${b.width + 2 * w} ${b.height + 2 * w}`);
    g.style.height = H + 'px'; g.style.width = H * (b.width + 2 * w) / (b.height + 2 * w) + 'px'; g.style.margin = `${-SPd}px 0`; });
  // the big target number: its drawn digit runs past the chip by the same 3px at the top and the bottom, the word on its baseline
  // (author, 2026-11-07: "like this, just right amounts of fine top bottom edges aligned", a "5TH" logo)
  el.querySelectorAll('.dpt .big').forEach(b => { const box = b.closest('.dpt'), H = box.clientHeight, SP = L.numSpill ?? 3, cs = getComputedStyle(b);
    inkMeas.font = `${cs.fontWeight} 100px ${cs.fontFamily}`; const m0 = inkMeas.measureText(b.textContent), ink = (m0.actualBoundingBoxAscent + m0.actualBoundingBoxDescent) / 100;
    const fs = (H + 2 * SP) / ink; b.style.fontSize = fs + 'px';
    // ink read at 100px and scaled: at small sizes the canvas rounds a face's ink box to whole pixels (Kanit: 27 for 28)
    const m = {actualBoundingBoxAscent: m0.actualBoundingBoxAscent * fs / 100, actualBoundingBoxDescent: m0.actualBoundingBoxDescent * fs / 100};
    // the digit's ink bottom should sit SP below the chip's bottom; move the whole number (and the word on its baseline) to put it there
    // the baseline read from the page itself (a zero-size probe on it), not from the font's metrics, which differ per face (Kanit)
    let pr = b.querySelector('i.bl'); if (!pr) { pr = document.createElement('i'); pr.className = 'bl'; pr.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; b.appendChild(pr); }
    const bx = box.getBoundingClientRect(), z = bx.height / box.clientHeight || 1;
    const base = (pr.getBoundingClientRect().top - bx.top) / z - (parseFloat(b.parentElement.style.top) || 0);
    b.parentElement.style.top = (H + SP - m.actualBoundingBoxDescent - base) + 'px'; });
  // the digit's overflow is cut by its own chip: larger than the chip, cropped flat at its top and bottom edges (author, 2026-11-08:
  // "its bleeding still not cut", "cut by its area?", "like earlier?", "its designated area cut its overflow?")
  el.querySelectorAll('.dpt').forEach(d => { d.style.clipPath = 'inset(0 -40px)'; });
  // TRUE AOE / SPLASH AOE big like the digit, cropped by the chip, sized on their own (author, 2026-11-13: "bleed TRUE AOE and SPLASH AOE,
  // assign their own size"): the capitals' drawn height = chip + 2 x 'past the chip', in the big number's face; a word too wide for the
  // chip is shrunk to its width and stays centred
  el.querySelectorAll('.dpt .aoew').forEach(w => { const box = w.closest('.dpt'), H = box.clientHeight, W = box.clientWidth - 8, SP = L.aoeSpill ?? 0, cs = getComputedStyle(w);
    // one size for both words, the largest at which the longer, SPLASH AOE, still fits the chip: one line, the 3's face (author,
    // 2026-11-13: "a but make splash aoe has true aoe's size")
    inkMeas.font = `${cs.fontWeight} 100px ${cs.fontFamily}`; const m0 = inkMeas.measureText(w.textContent), cap = m0.actualBoundingBoxAscent / 100, wl = inkMeas.measureText('SPLASH AOE').width / 100;
    const fs = Math.min((H + 2 * SP) / cap, W / wl); w.style.fontSize = fs + 'px';
    const pr = document.createElement('i'); pr.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; w.appendChild(pr);
    const bx = box.getBoundingClientRect(), z = bx.height / H || 1; w.style.top = '0px'; const base = (pr.getBoundingClientRect().top - bx.top) / z; pr.remove();
    w.style.top = ((H + fs * cap) / 2 - base) + 'px'; });
  // the label beside the big digit: its lines' drawn capitals fill the digit's height, the first line's top on the digit's top, the
  // last line's bottom on its bottom; one size for both lines, the largest that also fits the chip's width
  // GUIDE USAGE centred under the tag's chip, unit by unit (TRUE AFK and SEMI-AFK are different widths) (author, 2026-11-08: "still not
  // width center to true afk's chip, pls fix")
  { const chip = el.querySelector('.p-tr > div'), ln = el.querySelector('.p-us .ln');
    if (chip && ln) { ln.style.position = 'relative'; ln.style.left = '0px'; const a = chip.getBoundingClientRect(), b = ln.getBoundingClientRect(), z = a.height / chip.offsetHeight || 1;
      ln.style.left = (((a.left + a.right) - (b.left + b.right)) / 2 / z) + 'px'; } }
  // the 5 squares span the tag chip's width exactly, unit by unit (author, 2026-11-08: "can we make 5 grids fit the chip above it's
  // width", "the 5 grids need to be equal and full"; 2026-11-13: "the tiles aren't exactly within the true afk's chips'widht"): the chip's
  // own width is rounded up to whole pixels that split evenly into 5 squares and 4 gaps of 2px (a few px more padding), so the chip and
  // the row share the same two edges exactly, at any zoom; the squares then sit at whole-pixel steps from the chip's left edge
  { const chip = el.querySelector('.p-tr > div'), q = el.querySelector('.p-usq');
    if (chip && q) { chip.style.width = ''; chip.style.justifyContent = 'center';
      const z = chip.getBoundingClientRect().height / chip.offsetHeight || 1, wN = chip.getBoundingClientRect().width / z;
      let W = Math.ceil(wN); while ((W - 8) % 5) W++; chip.style.width = W + 'px'; const side = (W - 8) / 5;
      q.style.position = 'relative'; q.style.display = 'block'; q.style.height = side + 'px'; q.style.left = '0px';
      const x0 = (chip.getBoundingClientRect().left - q.getBoundingClientRect().left) / z;
      q.querySelectorAll('i').forEach((sq, n) => Object.assign(sq.style, {position: 'absolute', top: '0px', left: x0 + n * (side + 2) + 'px', width: side + 'px', height: side + 'px'})); } }
  // each role tag sized in its own chip: its capitals 60% of the chip's height (20% clear above and below), smaller only for a word too
  // long for its chip, that word alone (author, 2026-11-13: "make the tags bigger, leaving about 20% margin on top and bottom each inside
  // its own chip", "can each individual tags that are longer than others get its own appropriate lowered size from the rest?")
  el.querySelectorAll('.p-uc > div').forEach(chip => { const t = chip.querySelector('.cap'); if (!t) return;
    const cs = getComputedStyle(chip), h = chip.clientHeight, w = chip.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 1;
    inkMeas.font = '100px "Bebas Neue"'; const m = inkMeas.measureText(t.textContent), cap = m.actualBoundingBoxAscent / 100, wid = (m.width + 3 * t.textContent.length) / 100 + (t.querySelector('.swd') ? .77 : 0);
    t.style.fontSize = Math.min(h * .6 / cap, w / wid) + 'px'; });
  el.querySelectorAll('.p-dpc').forEach(d => { const box = d.closest('.part'), h = box.clientHeight, w = box.clientWidth, b = d.querySelector('b'), sp = d.querySelector('span');
    sp.style.fontSize = (L.parts.usage ? (L.parts.usage.fs || 14) * .85 : 11.9) + 'px';
    inkMeas.font = '800 100px Urbanist'; const m = inkMeas.measureText(b.textContent.replace('−', '')), cap = m.actualBoundingBoxAscent / 100;
    inkMeas.font = '800 100px Urbanist'; const wid = inkMeas.measureText(b.textContent).width / 100;
    const fs = Math.min(h / cap, (w - sp.offsetWidth - 3) / wid); b.style.fontSize = fs + 'px';
    // the digits' foot on the box's foot: shift the row so the baseline sits at the bottom edge
    d.style.alignItems = 'baseline'; d.style.position = 'relative'; d.style.top = '0px';
    const pr = document.createElement('i'); pr.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; b.appendChild(pr);
    const bx = box.getBoundingClientRect(), z = bx.height / h || 1; d.style.top = (h - (pr.getBoundingClientRect().top - bx.top) / z) + 'px'; pr.remove(); });
  el.querySelectorAll('.p-fitw').forEach(t => { const box = t.closest('.part'), h = box.clientHeight, w = box.clientWidth;
    inkMeas.font = '100px "Bebas Neue"'; const m = inkMeas.measureText(t.textContent), cap = m.actualBoundingBoxAscent / 100, wid = (m.width + 5 * t.textContent.length) / 100;
    t.style.fontSize = Math.min(h / cap, w / wid) + 'px'; });
  el.querySelectorAll('.dpt .lbl').forEach(lb => { const box = lb.closest('.dpt'), H = box.clientHeight, SP = L.numSpill ?? 3, ln = [...lb.children], G = 2;
    const bx = box.getBoundingClientRect(), z = bx.height / H || 1, dg = lb.previousElementSibling.getBoundingClientRect();
    inkMeas.font = '100px "Bebas Neue"'; const cap = ln.reduce((a, e) => Math.max(a, inkMeas.measureText(e.textContent).actualBoundingBoxAscent / 100), 0);
    const avW = (bx.right - dg.right) / z - 4 - 6, wid = Math.max(...ln.map(e => (inkMeas.measureText(e.textContent).width + 5 * e.textContent.length) / 100));
    const fs = Math.min(((H + 2 * SP) - G * (ln.length - 1)) / ln.length / cap, avW / wid);
    ln.forEach(e => { e.style.fontSize = fs + 'px'; e.style.textBox = 'trim-both cap alphabetic'; });
    lb.style.height = (ln.length > 1 ? H + 2 * SP : fs * cap) + 'px'; lb.style.top = '0px';
    const want = ln.length > 1 ? -SP : H + SP - fs * cap;   // one line: its foot on the digit's foot
    lb.style.top = (want - (lb.getBoundingClientRect().top - bx.top) / z) + 'px'; });
  // a targets word longer than its half shrinks to fit (SPLASH AOE)
  el.querySelectorAll('.dpt .tgt').forEach(n => { const box = n.parentElement; let f = parseFloat(getComputedStyle(n).fontSize);
    while (box.scrollWidth > box.clientWidth + .5 && f > 6) { f -= .25; n.style.fontSize = f + 'px'; } });
  // a name longer than its box shrinks until it fits, that name only (author, 2026-11-07: "reduce text size until it's fixed, make
  // exceptional smaller size for hoshi if needed"); no ellipsis
  el.querySelectorAll('.p-name').forEach(n => { let f = parseFloat(getComputedStyle(n).fontSize);
    while (n.scrollWidth > n.clientWidth + .5 && f > 6) { f -= .25; n.style.fontSize = f + 'px'; } });
  // the range's squares shrink to keep a margin inside its box, 5px a side at least (author, 2026-11-07: "range chip may need some inner margin")
  el.querySelectorAll('.p-rg').forEach(b => { const g = b.querySelector('.g'); if (!g) return;
    const k = Math.min(1, (b.clientWidth - 10) / g.offsetWidth, (b.clientHeight - 10) / g.offsetHeight); g.style.transform = `scale(${k})`; });
}
