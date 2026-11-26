/* The clip popup on the X cards (author, 2026-11-03: "grand plan would be lazy load popup that display bilibili searched
   with op name in cn", "do it"). Moved here from the mock roles/proto/video-popup.html; its notes are
   roles/proto/video-popup-NOTES.md. A card's portrait carries a dial (ClipPopup.dial); nothing loads from Bilibili or
   from clips/ until a dial is pressed. Data: clips/video-popup-*.js, written by roles/proto/bake_video_popup.py. */
(function () {
  const BASE = 'clips/';
  // the dial's mark: a little TV (author, 2026-11-03: "A is fine"); ▶ clashed with the card's initial-SP ▶
  const MARK = '<svg class="mk" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="1.5" y="4" width="13" height="9.5" rx="1.5"/><path d="M5.5 1.5 8 4l2.5-2.5"/></svg>';
  const CSS = `
/* the dial: on the portrait's bottom-right corner, no text; a click opens, or the pointer rests and an AK cyan ring
   fills from the top centre, clockwise, and opens when whole (author: "ak loading circle", "0.5s") */
.clipbox{display:flex;align-items:flex-end;justify-content:flex-end;pointer-events:none;z-index:2}
.clipdial{--hold:.5s;pointer-events:auto;position:relative;width:calc(28*var(--u));height:calc(28*var(--u));margin:0 calc(-2*var(--u)) calc(-2*var(--u)) 0;
  border-radius:50%;background:var(--dark-sub);color:var(--text-main);border:0;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center}
.clipdial:hover,.clipdial:focus-visible{color:var(--accent-cyan);outline:0}
.clipdial svg.r{position:absolute;inset:calc(2*var(--u));width:calc(100% - 4*var(--u));height:calc(100% - 4*var(--u));transform:rotate(-90deg)}
.clipdial circle{fill:none;stroke-width:3}
.clipdial .track{stroke:var(--line-soft)}
.clipdial .ring{stroke:var(--accent-cyan);stroke-dasharray:113.1;stroke-dashoffset:113.1;transition:stroke-dashoffset .25s ease-out}
.clipdial.charging .ring{stroke-dashoffset:0;transition:stroke-dashoffset var(--hold) linear}
.clipdial .mk{width:calc(13*var(--u));height:calc(13*var(--u));position:relative}

.clipshade{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;padding:16px;z-index:1000;
  font:14px/1.45 "Google Sans",sans-serif;color:var(--text-body)}
.clipshade.on{display:flex}
.clipshade *{box-sizing:border-box}
.clipshade button,.clipshade input{font:inherit;color:inherit}
.clipshade button{cursor:pointer;background:none;border:0;padding:0}
.clipshade a{color:inherit}
.clippop{width:min(1120px,100%);max-height:100%;overflow:auto;overscroll-behavior:contain;background:var(--dark-sub);padding:14px 16px 16px;--gap:10px}
.clippop .top{display:flex;align-items:baseline;gap:10px;margin-bottom:10px}
.clippop .top h2{margin:0;font:400 28px/1 "Bebas Neue";color:var(--text-main);letter-spacing:.02em}
.clippop .top .cn{font-size:15px;color:var(--text-body)}
.clippop .mode{display:flex;gap:2px;margin-left:14px;align-self:center}
.clippop .mode button{font:400 15px/1 "Bebas Neue";letter-spacing:.04em;background:var(--dark-subsub);color:var(--text-body);padding:5px 8px 3px}
.clippop .mode button:hover{color:var(--text-main)}
.clippop .mode[hidden]{display:none}
.clippop .mode button.on{background:var(--accent-cyan);color:var(--dark-main)}
.clippop .top .x{margin-left:auto;font-size:24px;line-height:1;color:var(--text-muted);padding:0 4px}
.clippop .top .x:hover{color:var(--text-main)}
.clippop .bar{display:flex;gap:var(--gap);align-items:stretch}
.clippop .bar input{flex:0 1 330px;min-width:0;background:var(--dark-subsub);border:0;outline:0;padding:8px 10px}
.clippop .bar input::placeholder{color:var(--text-muted)}
.clippop .bar input:focus{box-shadow:inset 0 -2px 0 var(--accent-cyan)}
.clippop .q{flex:1;min-width:0;display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--text-body);padding:0 2px}
.clippop .q span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.clippop .q b{font:400 16px/1 "Bebas Neue","Sarabun";letter-spacing:.04em;color:var(--accent-cyan);white-space:nowrap;margin-left:auto;padding-top:2px}
.clippop .q:hover b{color:var(--white)}
.clippop .chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 10px;align-items:center}
.clippop .chip{margin:0;font:400 15px/1 "Bebas Neue";letter-spacing:.04em;background:var(--dark-subsub);color:var(--text-body);padding:5px 8px 3px}
.clippop .chip:hover{color:var(--text-main)}
.clippop .chip.on{background:var(--accent-cyan);color:var(--dark-main)}
.clippop .sep{width:1px;height:16px;background:var(--line-soft);margin:0 3px}
.clippop .pager{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-muted);white-space:nowrap}
.clippop .grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-auto-rows:min-content;gap:var(--gap);position:relative;
  height:var(--win,600px);overflow-y:auto;overscroll-behavior:contain;align-content:start;scrollbar-width:thin;scrollbar-color:var(--accent-cyan) transparent}
.clippop .grid::-webkit-scrollbar{width:4px}
.clippop .grid::-webkit-scrollbar-thumb{background:var(--accent-cyan)}
.clippop .t{display:block;width:100%;text-align:left;min-width:0;color:var(--text-body);text-decoration:none;outline:0}
.clippop .t .pic{position:relative;aspect-ratio:16/10;background:var(--dark-subsub);overflow:hidden}
.clippop .t img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .2s;will-change:transform}
.clippop .t:hover img{transform:scale(1.03)}
.clippop .t .d,.clippop .t .v{position:absolute;bottom:4px;background:rgba(0,0,0,.72);color:var(--white);font-size:11px;line-height:1;padding:3px 4px}
.clippop .t .d{right:4px}
.clippop .t .v{left:4px;display:flex;align-items:center;gap:3px}
.clippop .t .v svg{width:12px;height:8px;flex:none}
.clippop .t .n{font-size:12px;line-height:16px;height:32px;margin-top:5px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;color:var(--text-main)}
.clippop .t .by{font-size:11px;line-height:15px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.clippop .t:hover .pic,.clippop .t:focus-visible .pic{outline:1px solid var(--accent-cyan);outline-offset:-1px}
.clippop .t:hover .n,.clippop .t:focus-visible .n{color:var(--accent-cyan)}
.clippop .none{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-family:"Sarabun","Google Sans",sans-serif;color:var(--text-body)}
.clippop .none a{color:var(--accent-cyan)}
.clippop .body{position:relative}
.clippop .live{position:absolute;inset:0;display:none;flex-direction:column;gap:6px}
.clippop .live p{margin:0;font:13px/1.3 "Sarabun","Google Sans",sans-serif;color:var(--text-muted)}
.clippop .live .frame{flex:1;min-height:0;overflow:hidden}
.clippop .live iframe{width:100%;height:100%;border:0;display:block;transform-origin:0 0}
.clippop.is-live .grid,.clippop.is-live .pager{visibility:hidden}
.clippop.is-live .live{display:flex}
.clippop .fail{color:var(--text-body);font-family:"Sarabun","Google Sans",sans-serif;padding:40px 0;text-align:center}
/* AIDS (author, 2026-11-06: "a tab on one popup", "just icon and sn badge should be fine, make the percentage closer to the
   icon"): every buffer, shredder and amp ranked by what it adds to this card's TOTAL DMG, three fixed enemies side by side */
.clippop .tabs{display:flex;gap:2px;margin-left:14px;align-self:center}
.clippop .tabs button{font:400 15px/1 "Bebas Neue";letter-spacing:.04em;background:var(--dark-subsub);color:var(--text-body);padding:5px 8px 3px}
.clippop .tabs button:hover{color:var(--text-main)}
.clippop .tabs button.on{background:var(--accent-cyan);color:var(--dark-main)}
.clippop .aids{display:none}
.clippop.is-aids .aids{display:block;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--accent-cyan) transparent;padding-right:6px}
.clippop .aids::-webkit-scrollbar{width:4px}
.clippop .aids::-webkit-scrollbar-thumb{background:var(--accent-cyan)}
.clippop.is-aids .bar,.clippop.is-aids .chips,.clippop.is-aids .body,.clippop.is-aids .mode{display:none}
.clippop .amode{display:none}
.clippop.is-aids .amode{display:flex}   /* SINGLE / PAIRS in the header beside CLIPS / AIDS, as BAKED / LIVE on CLIPS (author, 2026-11-16: "single/pair should be on aids page's same level as aids chip") */
.clippop .aids .ah{display:flex;align-items:center;gap:10px;margin-bottom:12px;font:400 15px/1 "Bebas Neue";letter-spacing:.04em;color:var(--text-muted)}
.clippop .aids .ah .tabs{margin-left:0}
.clippop .aids .cols{display:grid;grid-template-columns:minmax(0,1fr);gap:18px}   /* sections one under another (author, 2026-11-06: the sketch) */
.clippop .aids h3{margin:0 0 8px;padding:5px 8px 3px;font:400 18px/1 "Bebas Neue";letter-spacing:.04em;color:var(--dark-main);
  background:linear-gradient(90deg,color-mix(in srgb,var(--tc,var(--accent-cyan)) 85%,var(--dark-sub)),var(--dark-sub))}   /* filled in its damage type's colour, fading to the dark (author, 2026-11-07: "fade filled", "topics' filled may use arts for res, true or the operator's element for dr") */
/* the ranking in 3 columns, read down each (author, 2026-11-06: "how about 3 stacks?", "not type, current tags are enough, just layout") */
.clippop .aids .rk{display:grid;grid-auto-flow:column;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 24px;max-width:720px}
.clippop .aids .it{display:flex;align-items:center;gap:6px;min-width:0}
/* its place: a cyan band, the number white on its left, the icon over its right end (author, 2026-11-06: "might need subtle
   blue number as ranked", the sketch "like this") */
.clippop .aids .rb{position:relative;display:flex;align-items:center;padding-left:30px;flex:none}
.clippop .aids .rb::before{content:"";position:absolute;left:0;right:-4px;top:50%;height:16px;transform:translateY(-50%);background:linear-gradient(90deg,color-mix(in srgb,var(--accent-cyan) 70%,var(--dark-sub)),var(--dark-sub))}   /* cyan on the left, fading to the dark (author, 2026-11-06) */
/* the number taller than the band, its top and bottom past it (author, 2026-11-06: "number big its edge overflow past the band") */
.clippop .aids .rb b.no{position:absolute;left:0;width:30px;top:50%;transform:translateY(-50%);text-align:center;font:700 28px/.74 "Google Sans";letter-spacing:-.04em;color:var(--dark-main);z-index:1}   /* past the band at the top and the bottom (author, 2026-11-07: "number need overflow both top edge and bottom") */
.clippop .aids .rb .ic{z-index:1}
.clippop .aids .rb .ic + .ic{z-index:0}   /* a pair: the first face's skill tag over the second face, not under it (author, 2026-11-16: "bug") */
.clippop .aids .ic{position:relative;width:34px;height:34px;flex:none}
.clippop .aids .ic img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;background:var(--dark-subsub)}
/* the skill tag: no box, Bebas, a heavy dark halo round the letters (author, 2026-11-16: "the filled bars are low-blow", "i
   like b but shadow more intense"); in a pair the first face's on its left, the second's on its right ("move the first op
   skill to the left for consistency and clarity"); Shu's Sui variant in the tag itself, SUI in cyan ("S3 SUI for shu") */
.clippop .aids .ic i{position:absolute;right:-4px;bottom:-4px;font:400 13px/1 "Bebas Neue";letter-spacing:.04em;font-style:normal;white-space:nowrap;
  color:var(--white);text-shadow:0 0 2px var(--black),0 0 2px var(--black),0 0 3px var(--black),0 0 4px var(--black),0 0 5px var(--black)}
.clippop .aids .ic i.l{right:auto;left:-4px}
.clippop .aids .ic i b{position:absolute;left:100%;top:0;margin-left:3px;font-weight:400;color:var(--white)}   /* SUI after S3, S3 where every tag sits (author, 2026-11-16: "same s3 position just make sui next to s3, white text") */
.clippop .aids .pc{font:400 20px/1 "Bebas Neue";letter-spacing:.02em;color:var(--text-main);padding-top:2px}
.clippop .aids .pr .ic + .ic{margin-left:-8px}
.clippop .aids .it .pc{margin-left:4px}
.clippop .aids .it.su .pc{margin-left:20px}
.clippop .aids .pc .hx{white-space:nowrap;margin-left:5px;font:700 10px/1 Roboto,sans-serif;letter-spacing:.03em;font-style:normal;color:var(--accent-cyan);vertical-align:2px}   /* Roboto, not Bebas (author, 2026-11-16: "the hits 2 need different font, roboto") */
/* a section's few words inside its band, in Google Sans (author, 2026-11-16: "shorter desc, put it inside the subheader band, keep desc text different font") */
.clippop .aids h3:has(small){display:flex;align-items:center}
.clippop .aids h3 small{margin:-2px 0 -1px 10px;padding:3px 6px;font:500 12px/1 "Google Sans",sans-serif;letter-spacing:0;color:var(--text-main);background:var(--dark-main)}   /* a dark snug chip, white text, in the band's middle (author, 2026-11-16: "height center the desc, dark snug filled white text") */   /* 2 BOSSES: the aids that bring both into the splash (author, 2026-11-16) */
.clippop .aids .note{font:13px/1.4 "Sarabun","Google Sans",sans-serif;color:var(--text-muted);margin:0}
@media(max-width:520px){.clippop .aids .rk{grid-auto-flow:row;grid-template-columns:repeat(2,minmax(0,1fr))}}
/* phones (author, 2026-11-16: "check the aids popup on phone"): the name on one line with × in the corner, the switches on
   the line under it; 2 BOSSES's words under its title inside the band; HITS 2 under its gain, never cut by the column */
@media(max-width:520px){
  .clippop .top{flex-wrap:wrap;row-gap:8px;position:relative;padding-right:28px}
  .clippop .top h2{font-size:24px}
  .clippop .top .cn{flex:1 1 auto}
  .clippop .top #ctabs{margin-left:0}
  .clippop .top .x{position:absolute;top:0;right:0}
  .clippop .aids h3:has(small){flex-wrap:wrap;row-gap:5px;padding-bottom:5px}
  .clippop .aids h3 small{margin:0;line-height:1.25}
  .clippop .aids .pc .hx{display:block;margin:2px 0 0;vertical-align:0}
  .clippop .aids .rk{column-gap:12px}
}
@media(min-width:1300px){.clippop{width:min(1440px,100%)}.clippop .t .n{font-size:14px;line-height:19px;height:38px}.clippop .t .by{font-size:12px;line-height:17px}.clippop .t .d,.clippop .t .v{font-size:12px}}
@media(max-width:800px){
  .clipshade{padding:0}
  .clippop{padding:12px 16px 16px}
  .clippop .bar{flex-wrap:wrap}
  .clippop .bar input{flex:1 1 100%}
  .clippop .grid{grid-template-columns:repeat(3,minmax(0,1fr))}
}`;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const CHIPS = [['S1', 'S2', 'S3'], ['CC'], ['IS', 'IS2', 'IS3', 'IS4', 'IS5', 'IS6', 'IS7']];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  let shade, pop, op, kw, opener, ops = {}, terms = new Map(), live = false, liveChoice = false, liveQ = '', liveTimer;
  let tab = 'clips', ci = null, aidsMode = 'single', aidsRow = null, aidsData;
  const $ = s => pop.querySelector(s);

  function build() {
    if (shade) return;
    shade = document.createElement('div');
    shade.className = 'clipshade';
    shade.setAttribute('role', 'dialog');
    shade.setAttribute('aria-modal', 'true');
    shade.setAttribute('aria-label', 'Clips');
    shade.innerHTML = '<div class="clippop"></div>';
    document.body.append(shade);
    pop = shade.firstChild;
    shade.addEventListener('click', e => { if (e.target === shade) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && shade.classList.contains('on')) close(); });
    addEventListener('resize', () => { if (op && $('#cgrid')) { if (tab === 'aids') setTab('aids'); else fit(); } fitLive(); });
  }

  function load(src) {
    return new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = () => no(new Error(src));
      document.head.append(s);
    });
  }

  // views: an eye, not ▶, which the card already uses for initial SP (author, 2026-11-03: "the eye watch icon instead")
  const EYE = '<svg viewBox="0 0 16 10" aria-hidden="true"><path d="M8 0C4.4 0 1.6 2.2 0 5c1.6 2.8 4.4 5 8 5s6.4-2.2 8-5C14.4 2.2 11.6 0 8 0zm0 8.2A3.2 3.2 0 1 1 8 1.8a3.2 3.2 0 0 1 0 6.4zm0-5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z" fill="currentColor"/></svg>';
  const views = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'm' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n);
  const clock = sec => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  function day(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return d + ' ' + MONTHS[m - 1] + (y === new Date().getFullYear() ? '' : ' ' + y);
  }

  // the bar's words, longest match first; each becomes the Hanzi for the Bilibili search and the spellings a title may use
  function read(text) {
    const words = text.trim().toLowerCase().split(/[\s,]+/).filter(Boolean), out = [];
    for (let i = 0; i < words.length;) {
      let hit = null;
      for (let n = Math.min(5, words.length - i); n && !hit; n--) {
        const w = words.slice(i, i + n).join(' ');
        if (terms.has(w)) hit = {t: terms.get(w), n};
        else if (kw.ops[w]) hit = {t: {q: kw.ops[w], find: [kw.ops[w]]}, n};
      }
      if (hit) { out.push(hit.t); i += hit.n; }
      else { out.push({q: words[i], find: [words[i]]}); i++; }
    }
    return out;
  }
  function matches(clip, wanted) {
    const hay = [clip.title, clip.en || '', ...clip.parts.map(p => p.name + ' ' + (p.en || '')), clip.desc].join(' ').toLowerCase();
    // the English titles lead with the term in brackets, [IS7 N16], [CC]: "[is" finds every IS theme
    return wanted.every(t => t.find.some(f => hay.includes(f.toLowerCase())) || (t.key || []).some(k => hay.includes('[' + k)));
  }
  // only the chips that find a clip on this operator's list; an operator with no picks (LIVE only) keeps them all
  // (author, 2026-11-03: "should also only shows available tags")
  function chipGroups() {
    if (!op.clips.length) return CHIPS;
    return CHIPS.map(g => g.filter(c => op.clips.some(cl => matches(cl, read(c))))).filter(g => g.length);
  }
  function searchUrl(wanted) {
    const q = [kw.base, op.cn, ...wanted.map(t => t.q).filter(q => q !== op.cn)].join(' ');
    return {q, url: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(q)};
  }

  function shell() {
    pop.innerHTML = `
      <div class="top"><h2>${esc(op.en)}</h2><span class="cn">${esc(op.cn)}</span>
        <div class="tabs" id="ctabs"><button data-t="clips">Clips</button><button data-t="aids">Aids</button></div>
        <div class="mode"><button data-m="baked" class="on">Baked</button><button data-m="live">Live</button></div>
        <div class="tabs amode" id="camode"><button data-a="single">Single</button><button data-a="pair">Pairs</button></div><button class="x" id="cclose" aria-label="ปิด">×</button></div>
      <div class="bar">
        <input id="cfind" type="search" placeholder="S3, CC, IS6, Surtr…" aria-label="ค้นหาคลิป" autocomplete="off" spellcheck="false">
        <a class="q" id="cq" target="_blank" rel="noopener"><span></span><b>ค้นต่อบน Bilibili ↗</b></a>
      </div>
      <div class="chips" id="cchips">
        ${chipGroups().map(g => g.map(c => `<button class="chip" data-c="${c}">${c}</button>`).join('')).join('<i class="sep"></i>')}
        <div class="pager"><span id="cpn"></span></div>
      </div>
      <div class="body">
      <div class="grid" id="cgrid"></div>
      <div class="live"><p>ผลค้นสดจาก Bilibili กดคลิปจะเปิดแท็บใหม่</p><div class="frame" id="clivebox"></div></div>
      </div>
      <div class="aids" id="caids"></div>`;
    // the tab already on, clicked again, flips to the other (author, 2026-11-06: "reclick switch"), as BAKED / LIVE
    $('#ctabs').onclick = e => { const t = e.target.dataset.t; if (t) setTab(t === tab ? (t === 'aids' ? 'clips' : 'aids') : t); };
    // the wheel over the two tabs switches them: down to AIDS, up to CLIPS; more ticks stay where they are (author,
    // 2026-11-06: "allow wheel scrolling", "sector change scrolling")
    $('#ctabs').addEventListener('wheel', e => { if (!e.deltaY) return; e.preventDefault(); const t = e.deltaY > 0 ? 'aids' : 'clips'; if (t !== tab) setTab(t); }, {passive: false});
    $('#cclose').onclick = close;
    $('#cfind').oninput = () => draw(false);
    // the wheel glides like the BANNERS rail: a mouse-wheel tick moves a target one row, a trackpad by its own pixels;
    // the list eases 10 % of the way each frame; no settle after stopping (author, 2026-11-03)
    const grid = $('#cgrid');
    let glideTo = null, gliding = false, pos = 0;
    const rowH = () => { const t = grid.querySelector('.t'); return t ? t.offsetHeight + (parseFloat(getComputedStyle(grid).rowGap) || 0) : 0; };
    const room = () => grid.scrollHeight - grid.clientHeight;
    const glide = () => {
      if (glideTo === null) return;
      if (Math.abs(grid.scrollTop - pos) > 2) pos = grid.scrollTop;
      const d = glideTo - pos;
      if (Math.abs(d) < .5) { grid.scrollTop = pos = glideTo; gliding = false; glideTo = null; return; }
      pos += d * .1;
      grid.scrollTop = pos;
      requestAnimationFrame(glide);
    };
    const glideTowards = to => {
      glideTo = Math.round(Math.max(0, Math.min(room(), to)));
      if (!gliding) { gliding = true; pos = grid.scrollTop; requestAnimationFrame(glide); }
    };
    grid.addEventListener('wheel', e => {
      const d = e.deltaY;
      if (!d || e.ctrlKey || room() <= 0) return;
      e.preventDefault();
      const tick = e.deltaMode !== 0 || Math.abs(d) >= 50;
      glideTowards((glideTo ?? grid.scrollTop) + (tick ? Math.sign(d) * rowH() : d));
    }, {passive: false});
    ['pointerdown', 'keydown'].forEach(t => grid.addEventListener(t, () => { glideTo = null; gliding = false; }));
    $('#cfind').onkeydown = e => { if (e.key === 'Enter' && live) liveLoad(); };
    // the view already on, clicked again, flips to the other (author, 2026-11-03: "baked live cycling when reclicked")
    pop.querySelector('.mode').onclick = e => { const m = e.target.dataset.m; if (m) { liveChoice = m === (live ? 'live' : 'baked') ? !live : m === 'live'; setMode(liveChoice); } };
    // no picked clips: LIVE only, no switch (author, 2026-11-03: "no-baked operators get only live page")
    pop.querySelector('.mode').hidden = !op.clips.length;
    // the wheel over BAKED / LIVE switches them too: down to LIVE, up to BAKED (author, 2026-11-06: "allow wheel to be switching")
    pop.querySelector('.mode').addEventListener('wheel', e => { if (!e.deltaY) return; e.preventDefault();
      const on = e.deltaY > 0; if (on !== live) { liveChoice = on; setMode(on); } }, {passive: false});
    setMode(liveChoice || !op.clips.length);
    $('#cchips').addEventListener('click', e => {
      const c = e.target.dataset.c;
      if (!c) return;
      const box = $('#cfind'), words = box.value.split(/[\s,]+/).filter(Boolean);
      const at = words.findIndex(w => w.toLowerCase() === c.toLowerCase());
      if (at < 0) words.push(c); else words.splice(at, 1);
      box.value = words.join(' ');
      draw(true);
    });
  }

  function draw(now = true) {
    const text = $('#cfind').value, wanted = read(text);
    const list = op.clips.filter(c => matches(c, wanted));
    const {q, url} = searchUrl(wanted);
    $('#cq span').textContent = q;
    $('#cq').href = url;
    const lower = text.toLowerCase().split(/[\s,]+/);
    pop.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', lower.includes(c.dataset.c.toLowerCase())));
    $('#cpn').textContent = list.length + (list.length === 1 ? ' clip' : ' clips');
    const grid = $('#cgrid');
    grid.innerHTML = list.map(c => `
      <a class="t" href="https://www.bilibili.com/video/${c.bvid}/" target="_blank" rel="noopener">
        <div class="pic"><img loading="lazy" referrerpolicy="no-referrer" alt="" src="${esc(c.pic)}@336w_210h_1c.webp"><span class="v">${EYE}${views(c.views)}</span><span class="d">${clock(c.sec)}</span></div>
        <div class="n" title="${esc(c.title)}">${esc(c.en || c.title)}</div>
        <div class="by">${esc(c.by)} · ${day(c.date)}</div>
      </a>`).join('') || `<div class="none"><span>ลิสต์นี้ยังไม่มีคลิปตรงคำค้น</span><a href="${esc(url)}" target="_blank" rel="noopener">ค้น “${esc(q)}” บน Bilibili ↗</a></div>`;
    grid.scrollTop = 0;
    fit();
    if (live) { clearTimeout(liveTimer); liveTimer = setTimeout(liveLoad, now ? 0 : 700); }
  }

  // up to four rows of whatever the thumbnails measure, less if the screen is short
  function fit() {
    const grid = $('#cgrid'), t = grid && grid.querySelector('.t');
    if (!t) return;
    const gap = parseFloat(getComputedStyle(grid).rowGap) || 0, row = t.offsetHeight;
    // the room from the popup's own parts, not from where it sits: the popup is centred, so its top moves with its height
    // and a measure from the screen shrank it a little on every tab switch (author, 2026-11-06: "why shrinked?")
    const room = innerHeight - 16 - (grid.getBoundingClientRect().top - pop.getBoundingClientRect().top) - 32;   // as before, with the popup at the shade's top
    grid.style.setProperty('--win', Math.max(2 * row + gap, Math.min(4 * row + 3 * gap, room)) + 'px');
  }

  // LIVE: Bilibili's search page, loaded only when chosen and again only when the query changes; drawn 1120 px wide and
  // shrunk to the box (its min-width 1100 + its own scrollbar); phones get Bilibili's mobile page, left alone
  function liveLoad() {
    clearTimeout(liveTimer);
    const {q, url} = searchUrl(read($('#cfind').value));
    if (q === liveQ) return;
    liveQ = q;
    $('#clivebox').innerHTML = `<iframe src="${esc(url)}" title="Bilibili search"></iframe>`;
    fitLive();
  }
  const LIVE_MIN = 1100 + 20;
  function fitLive() {
    const box = pop && $('#clivebox'), f = box && box.querySelector('iframe');
    if (!f) return;
    const w = box.clientWidth, k = w < LIVE_MIN && w >= 600 ? w / LIVE_MIN : 1;
    f.style.width = k < 1 ? LIVE_MIN + 'px' : '';
    f.style.height = k < 1 ? box.clientHeight / k + 'px' : '';
    f.style.transform = k < 1 ? `scale(${k})` : '';
  }
  function setMode(on) {
    live = on;
    pop.classList.toggle('is-live', on);
    pop.querySelectorAll('.mode button').forEach(b => b.classList.toggle('on', (b.dataset.m === 'live') === on));
    if (on) liveLoad();
    else { clearTimeout(liveTimer); liveQ = ''; $('#clivebox').innerHTML = ''; }
  }

  // ---- AIDS: the page's aids/x-<page>.js (roles/bake_aids.js), loaded on the first look; the card is the dial's
  // the popup keeps the size the clips give it on either tab (author, 2026-11-06: "ofc, the popup must retain its size"):
  // the clips are laid out and measured first, the AIDS view then takes that height
  function setTab(t) {
    tab = t;
    pop.classList.remove('is-aids');
    pop.style.height = '';
    pop.querySelectorAll('#ctabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    fit();
    if (t === 'aids') {
      const h = pop.offsetHeight;
      if (live) setMode(false);
      pop.classList.add('is-aids');
      pop.style.height = h + 'px';
      // the AIDS view fills the rest under the header and scrolls inside it, by the wheel too (author, 2026-11-06: "allow
      // wheel scrolling")
      const box = $('#caids');
      box.style.height = Math.max(120, h - (box.getBoundingClientRect().top - pop.getBoundingClientRect().top) - 16) + 'px';
      // over SINGLE / PAIRS the wheel switches them: down to PAIRS, up to SINGLE (author, 2026-11-06: "allow wheel to be switching")
      const am = $('#camode');
      if (!am.dataset.wheel) { am.dataset.wheel = '1';
        am.addEventListener('wheel', e => { if (!e.deltaY) return; e.preventDefault(); e.stopPropagation();
          const a = e.deltaY > 0 ? 'pair' : 'single'; if (a !== aidsMode) { aidsMode = a; aids(); } }, {passive: false});
        am.onclick = e => { const a = e.target.dataset.a; if (a) { aidsMode = a === aidsMode ? (a === 'pair' ? 'single' : 'pair') : a; aids(); } }; }
      if (!box.dataset.wheel) { box.dataset.wheel = '1';
        box.addEventListener('wheel', e => { if (!e.deltaY || e.ctrlKey) return; e.preventDefault(); e.stopPropagation();
          // over SINGLE / PAIRS the wheel switches them: down to PAIRS, up to SINGLE (author, 2026-11-06: "allow wheel to be switching")
          box.scrollTop += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY; }, {passive: false}); }
      aids();
    } else if (liveChoice || !op.clips.length) setMode(true);
  }
  async function aids() {
    const box = $('#caids');
    if (aidsData === undefined) {
      // ?v=: never an old copy from the cache
      try { await load('aids/' + (typeof PAGE === 'string' ? PAGE : '').replace(/\.html$/, '.js') + '?v=' + Date.now()); aidsData = window.X_AIDS || null; }
      catch (e) { aidsData = null; }
    }
    const card = aidsData && aidsData.cards.find(c => String(c.ci) === String(ci));
    if (!card) { box.innerHTML = '<p class="note">No aid changes this card.</p>'; return; }
    const keys = Object.keys(card.stages), now = window.X_CARD_STAGE && X_CARD_STAGE[ci] ? String(X_CARD_STAGE[ci]()) : null;
    const n = keys.includes(now) ? now : keys[keys.length - 1], A = aidsData.aids;
    // a matrix card ranks each of its rows (SOLO, + YU S3: author, 2026-11-06: "talulah no yu?"); the row picked stays
    const all = card.stages[n], st = all.find(e => e.row === aidsRow) || all[0];
    // the title names what the card's damage meets: RES for Arts, DEF for Physical, both for a card of both
    const m = st.meets.length ? st.meets : ['RES'];
    const t0 = m.map(k => k + ' 0').join(' / '), t1 = m.map(k => k === 'DEF' ? 'DEF 4K' : 'RES 80').join(' / ');
    // the 4th section's enemy, per card (bake_aids.js: where its partner comes first, or RES 60 / DR 60%)
    const kd = v => v >= 1000 ? v / 1000 + 'K' : String(v);
    // the titles' colours, as the card's damage bar: Arts pink, Physical yellow; DR in the card's element, else True
    const EL = {nervous: '0,168,195', burn: '255,104,56', corrosion: '148,194,255', necrosis: '170,157,210', mania: '200,48,80'};
    const cRes = m.includes('DEF') ? 'rgb(255,225,0)' : 'rgb(255,132,193)', cDr = st.el && EL[st.el] ? `rgb(${EL[st.el]})` : 'var(--text-main)';
    const h3 = (c, t) => `<h3 style="--tc:${c}">${esc(t)}</h3>`;
    const mix = E => { E = E || {def: 2000, res: 60, dr: 0.6}; return m.map(k => k === 'DEF' ? 'DEF ' + kd(E.def) : 'RES ' + E.res).join(' / ') + ' · DR ' + Math.round(E.dr * 100) + '%'; };
    const pc = v => (v > 0 ? '+' : '') + (Math.abs(v) >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')) + '%';
    const ic = (i, l) => { const a = A[i], sui = /:sui$/.test(a.id); return `<span class="ic" title="${esc(a.name)}"><img src="${esc(a.avatar)}" alt="${esc(a.name)}" loading="lazy">` +
      (a.sk || sui ? `<i${l ? ' class="l"' : ''}>${a.sk ? 'S' + a.sk : ''}${sui ? '<b>SUI</b>' : ''}</i>` : '') + '</span>'; };
    const list = s => {
      if (!s) return '<p class="note">Not worked out at this enemy.</p>';
      // 2 BOSSES: "HITS 2" beside a gain that brings both into her splash (Yu S2; bake_aids.js two.hits)
      // a last face with SUI after its S3: the gain moves over so SUI never runs into it (author, 2026-11-16, phone check)
      const su = i => /:sui$/.test(A[i].id) ? ' su' : '';
      const hx = (...ix) => s.hits && ix.some(i => s.hits[i]) ? '<em class="hx">HITS 2</em>' : '';
      const rows = aidsMode === 'single' ? s.single.filter(r => r[1] > 0.05).map(([i, v], k) => `<span class="it${su(i)}"><span class="rb"><b class="no">${k + 1}</b>${ic(i)}</span><span class="pc">${pc(v)}${hx(i)}</span></span>`)
        : s.pair.filter(r => r[2] > 0.05).map(([i, j, v], k) => `<span class="it pr${su(j)}"><span class="rb"><b class="no">${k + 1}</b>${ic(i, 1)}${ic(j)}</span><span class="pc">${pc(v)}${hx(i, j)}</span></span>`);
      return rows.length ? `<div class="rk" style="grid-template-rows:repeat(${Math.ceil(rows.length / 3)},auto)">${rows.join('')}</div>` : '<p class="note">No aid adds to this skill.</p>';
    };
    // DR that leaves the order as at 0 (every hit cut alike): its words only (author, 2026-11-06: "c unaffected DR show only
    // text but not ranked content")
    const drOf = (x, t) => !x ? list(null) : x.same ? `<p class="note">DR cuts every hit of this card alike: the same order as ${esc(t)}.</p>` : list(x);
    pop.querySelectorAll('#camode button').forEach(b => b.classList.toggle('on', b.dataset.a === aidsMode));
    box.innerHTML = `<div class="ah">` +
      (all.length > 1 ? `<span class="tabs" id="carow">${all.map(e => `<button data-r="${esc(e.row)}" class="${e === st ? 'on' : ''}">${esc(e.row === 'SOLO' ? 'Solo' : '+ ' + e.row)}</button>`).join('')}</span>` : '') +
      `<span>TOTAL DMG gain · S${card.skill || '?'}${n !== '0' ? ' · module stage ' + n : ''} · each aid's casts counted against the skill</span></div>` +
      `<div class="cols"><div>${h3(cRes, t0)}${list(st.zero)}</div><div>${h3(cRes, t1)}${list(st.high)}</div><div>${h3(cDr, 'DR 80%')}${drOf(st.dr, t0)}</div><div>${h3(cDr, mix(st.bothE))}${list(st.both)}</div>` +
      // 2 BOSSES apart (author, 2026-11-16: "AIDS 5th section"): only on a card with a grouping partner
      (st.two ? `<div><h3 style="--tc:${cRes}">${esc('2 BOSSES APART · ' + t0)}<small>gain over her hitting one · HITS 2: both in her splash</small></h3>${list(st.two)}</div>` : '') + `</div>`;
    if ($('#carow')) $('#carow').onclick = e => { const r = e.target.dataset.r; if (r !== undefined) { aidsRow = r; aids(); } };
  }

  // the map loads on the first open, an operator's clips on its first open, and only if the map lists it as baked
  async function open(name, button) {
    build();
    opener = button;
    shade.classList.add('on');
    const key = name.toLowerCase();
    try {
      if (!kw) {
        await load(BASE + 'video-popup-keywords.js');
        kw = window.VIDEO_KEYWORDS;
        kw.terms.forEach(t => t.key.forEach(k => terms.set(k, t)));
      }
      if (!ops[key]) {
        if (kw.baked.includes(key)) {
          await load(BASE + 'video-popup-' + key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.js');   // the bake's slug()
          ops[key] = window.VIDEO_OP;
        } else {
          ops[key] = {en: name, cn: kw.ops[key] || name, clips: []};
        }
      }
    } catch (e) {
      pop.innerHTML = '<div class="fail">โหลดลิสต์คลิปไม่ได้</div>';
      return;
    }
    ci = button && button.dataset.ci;
    if (op !== ops[key]) { op = ops[key]; shell(); }
    shade.setAttribute('aria-label', op.en + ' clips');
    draw();
    setTab(tab);
    $('#cfind').focus();
  }
  // closing removes the live page, so nothing loads behind the page; the view chosen stays
  function close() {
    shade.classList.remove('on');
    if (op) { clearTimeout(liveTimer); liveQ = ''; const b = $('#clivebox'); if (b) b.innerHTML = ''; }
    if (opener && opener.isConnected) opener.focus();
  }

  // the dial for a card: the page puts it over the portrait and calls wire() on it
  function dial(name, ci) {
    return `<button type="button" class="clipdial" data-clip="${esc(name)}"${ci === undefined ? '' : ` data-ci="${ci}"`} aria-haspopup="dialog" aria-label="${esc(name)} clips" title="Clips">` +
      `<svg class="r" viewBox="0 0 40 40" aria-hidden="true"><circle class="track" cx="20" cy="20" r="18"/><circle class="ring" cx="20" cy="20" r="18"/></svg>${MARK}</button>`;
  }
  // a click opens at once; resting the pointer fills the ring for --hold, then opens; leaving empties it. After an
  // open the pointer has to leave and come back first, so closing never reopens it
  function wire(root) {
    root.querySelectorAll('.clipdial:not([data-wired])').forEach(b => {
      b.dataset.wired = '1';
      let timer = null, armed = true;
      const stop = () => { clearTimeout(timer); timer = null; b.classList.remove('charging'); };
      const go = e => { if (e) e.stopPropagation(); stop(); armed = false; open(b.dataset.clip, b); };
      b.addEventListener('click', go);
      b.addEventListener('pointerenter', e => {
        if (e.pointerType !== 'mouse' || !armed || (shade && shade.classList.contains('on'))) return;
        const hold = parseFloat(getComputedStyle(b).getPropertyValue('--hold')) * 1000;
        b.classList.add('charging');
        timer = setTimeout(go, hold);
      });
      b.addEventListener('pointerleave', () => { stop(); armed = true; });
    });
  }
  window.ClipPopup = {dial, wire, open};
})();
