// Shared by the x-dp-compare mockups: the settings, the team of 12, the figures and their Step | Value tables.
// Each mockup draws its own layout from UI.state / UI.results() and calls UI.on(render).
const UI = (() => {
  const OPS = DPC_DATA.ops;            // [the left vanguard (Saileach or a 5* Standard Bearer picked in her place), Myrtle]
  const LEFT = DPC_DATA.left || [OPS[0]];
  // the left side keeps Saileach's amber whoever stands there
  const COL = new Proxy({Myrtle: 'var(--myr)'}, {get: (c, k) => c[k] || 'var(--sail)'});
  // the team after the vanguard: the author's squad (2026-10-19 screenshot), baked by the build with its icons;
  // each member numbered 1ST-11TH in deployment order, and flagged with the vanguard who gets it on the field first
  // (author, 2026-10-19: "need to flag 1st member all the way to 11th member", "flag as in declaring who gets that
  // member deployed first, sail or myrtle"); EVEN when both land it in the same tenth of a second
  const AV = id => `https://lemonwait.github.io/operator/avatars/${id}.png`;
  const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH');
  const flag = n => `<span class="flag">${n === 'V' ? 'V' : ord(n)}</span>`;
  const winFlag = j => `<span class="win" data-win="${j}"></span>`;
  // who lands each member first: [{t: [Saileach's, Myrtle's], win: 0 | 1 | null}] for members 1-11
  function landings(R) {
    return state.team.map((m, j) => {
      const land = R.map(r => r.ev.find(e => e.who === 'team' && e.k === 'deploy' && e.slot === j + 1));
      const t = land.map(e => e ? Math.round(e.t * 10) / 10 : null);
      // how many of each vanguard's skills had started by then (the skill-th it landed on)
      const n = land.map((e, i) => e ? R[i].ev.filter(c => c.who === 'v' && c.k === 'cast' && c.t <= e.t).length : null);
      const win = t[0] == null && t[1] == null ? null : t[1] == null ? 0 : t[0] == null ? 1 : t[0] < t[1] ? 0 : t[1] < t[0] ? 1 : -1;
      return {t, n, win};
    });
  }
  function paintFlags(R) {
    const L = landings(R);
    document.querySelectorAll('[data-win]').forEach(el => {
      const w = L[+el.dataset.win].win;
      // with the margin (author, 2026-10-19: "show win by how many seconds")
      const gap = w >= 0 && L[+el.dataset.win].t.every(x => x != null) ? Math.abs(L[+el.dataset.win].t[0] - L[+el.dataset.win].t[1]) : null;
      el.innerHTML = w == null ? '—' : w < 0 ? 'EVEN' : OPS[w].short.toUpperCase() + (gap != null ? ` · <span class="wgap">${sec(gap)}</span>` : '');   // "3s", not "3S" (author)
      el.style.background = w == null || w < 0 ? 'var(--band)' : COL[OPS[w].short];
      el.style.color = w == null || w < 0 ? 'var(--dim)' : '#121212';
      el.title = w == null ? 'not on the field in the time shown' : w < 0 ? 'both land it at the same time' : `${OPS[w].short} gets it on the field first`;
    });
    // under the flag, each vanguard's skill-th when the member lands (author, 2026-10-24: "A for skill positional disclosure,
    // but use filled highlight as the way to declare the winner"): the winner's number filled in her colour
    document.querySelectorAll('[data-skn]').forEach(el => {
      const x = L[+el.dataset.skn];
      // written 1st with the suffix raised (author, 2026-10-24: "1^st it")
      const sup = n => `${n}<sup>${ord(n).slice(String(n).length).toLowerCase()}</sup>`;
      el.innerHTML = OPS.map((o, i) => { const v = x.n[i] == null ? '—' : x.n[i] ? sup(x.n[i]) : '0';
        // the winner underlined in her colour (author, 2026-10-24: "underline instead" of filled)
        return `<b style="color:${COL[o.short]};${x.win === i ? `box-shadow:inset 0 -2px 0 ${COL[o.short]}` : ''}" title="${o.short}: ${x.n[i] ? ord(x.n[i]) + ' skill started' : 'no skill yet'} when it lands">${v}</b>`; }).join('');
    });
    return L;
  }
  // at E2 Saileach starts on BEA-Y 3 (author, 2026-10-19: "saileach y3 as default for e2 pls")
  const modE2 = o => o.mods.some(m => m.code === 'BEA-Y') ? 3 : 0;
  const state = {
    start: 10, rate: 1, spDown: 0, layers: 0, penalty: 0, horizon: 180, lastRetreat: 1, helperDP: 1, hold: 1, debt: 5, teamLayers: 0, vBefore: 1,   // RACERS: before the picks by default (author, 2026-10-24)
    team: DPC_DATA.team.map((m, home) => ({...m, home})),
    ops: OPS.map(o => ({e: 2, s: 0, sl: 10, mod: modE2(o), pot: o.pot})),
  };
  const subs = [];
  const on = f => subs.push(f);
  const fire = kind => subs.forEach(f => f(kind));   // 'input' (a slider, a cost: redraw figures only) or 'click'
  const fix = (o, st) => {
    st.e = Math.min(st.e, o.phases.length - 1);
    if (o.skills[st.s].e > st.e) st.s = 0;
    if (st.e < 2) st.sl = Math.min(st.sl, 7);
    if (st.e < 1) st.sl = Math.min(st.sl, 4);
    if (st.e < 2) st.mod = 0;
  };
  // her deploy cost on this stage: the base cost x the multiplier picked (floored)
  const baseCost = i => { const o = OPS[i], st = state.ops[i]; return o.base[Math.min(st.e, o.base.length - 1)].cost + o.potDP[st.pot - 1][0]; };
  const redeployOf = i => { const o = OPS[i], st = state.ops[i]; return o.base[Math.min(st.e, o.base.length - 1)].redeploy + o.potDP[st.pot - 1][1]; };
  const vcost = i => Math.floor(baseCost(i) * [1, 1.5, 2][state.layers]);
  // Closure goes 1st while either of her switches is on, back to her own place when both are off (author, 2026-10-19:
  // "like closure first if shes on")
  const arrange = () => {
    const on = state.helperDP, id = DPC_DATA.helper.id;
    state.team.sort((a, b) => on ? (b.id === id) - (a.id === id) || a.home - b.home : a.home - b.home);
  };
  arrange();
  // Closure's place in the team (the switches do nothing when she is not in it)
  const helperAt = () => { const j = state.team.findIndex(m => m.id === DPC_DATA.helper.id); return j < 0 ? null : {...DPC_DATA.helper, slot: j + 1}; };
  // while a slider or a cost is being changed, the quick answer (the warm start); the full search 250 ms after it stops
  let quickUntil = 0, settle = null;
  function results() {
    return OPS.map((o, i) => {
      const st = state.ops[i];
      fix(o, st);
      return DPC.best({quick: performance.now() < quickUntil, op: o, e: st.e, s: st.s, sl: st.sl, mod: st.mod, pot: st.pot, start: state.start, rate: state.rate,
                      spDown: state.spDown, layers: state.layers, penalty: state.penalty, lastRetreat: state.lastRetreat, team: state.team, horizon: state.horizon,
                      helper: helperAt(), helperDP: state.helperDP, helperRefund: state.helperDP, noHold: !state.hold, debt: state.debt, teamLayers: state.teamLayers,
                      firsts: state.team.map((m, j) => m.first ? j + 1 : 0).filter(Boolean), vBefore: state.vBefore});
    });
  }

  // ---- numbers ----
  const n0 = x => Math.round(x).toLocaleString('en-US');
  const secT = x => x == null ? '—' : Math.round(x) + 's';   // whole seconds (the sheet's steps); "20s" (AUTHOR-DECISIONS #15)
  // in HTML the "s" keeps its lower case: Bebas Neue has capitals only
  const sec = x => x == null ? '—' : secT(x).slice(0, -1) + '<span class="sx">s</span>';
  // the headline times as a clock, minutes:seconds (author, 2026-10-19: "shouldn't first skill be something like 0:13",
  // headline figures only): 13s -> 0:13, 136s -> 2:16
  const clock = x => { if (x == null) return '—'; const s = Math.round(x); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const lvName = l => l > 7 ? 'M' + (l - 7) : 'Lv ' + l;
  const first = (r, k) => r.ev.find(e => e.who === 'v' && e.k === k);
  // DP SHE ADDS counts up to the second the 12th lands (author, 2026-10-19: "yes" to stopping it there); the time shown
  // when the 12th has not landed by then
  const upTo12 = r => r.fieldAll != null ? DPC.run({...r.cfg, horizon: r.fieldAll}) : r;
  // what she saves the others (deep-scan fix, author 2026-10-24: "count what she saves others in DP SHE ADDS"): Saileach's
  // "next Operator -2" and Elysium's "Snipers -2 while she is on the field", as they came off team members' costs
  const savedNext = q => q.ev.filter(e => e.who === 'team' && e.k === 'deploy').reduce((a, e) => a + (e.off || 0), 0);
  const savedCls = q => q.ev.filter(e => e.who === 'team' && e.k === 'deploy').reduce((a, e) => a + (e.cls || 0), 0);
  const netOf = q => q.tally.skill + q.tally.refund + q.tally.module + savedNext(q) + savedCls(q)
    + q.ev.filter(e => e.who === 'v' && e.boost).reduce((a, e) => a + e.boost, 0)
    - q.ev.filter(e => e.who === 'v' && e.k === 'deploy').reduce((a, e) => a + e.n, 0);
  function figures(r) {
    const casts = r.ev.filter(e => e.who === 'v' && e.k === 'cast');
    const T = r.fieldAll;
    const atT = T != null ? DPC.ledger(r, T) : null;
    const byH = r.tally, q12 = upTo12(r);
    const own = r.ev.filter(e => e.who === 'v' && e.k === 'deploy').reduce((a, e) => a + e.n, 0);
    // skills started before the last (12th) member lands (author, 2026-10-19: "need to disclose skill activation before
    // the last member"): what she gave while the team was still deploying
    const before = T != null ? casts.filter(c => c.t <= T) : casts;   // a skill starting in the 12th's own second counts: its DP comes first
    return {
      fieldAll: T, atT, casts: casts.length, firstCast: casts[0] ? casts[0].t : null, before: before.map(c => c.t),
      // one time window for the whole row (deep-scan fix, author 2026-10-24): every figure up to the second the 12th
      // lands (the time shown when it has not); FIRST SKILL is a moment, not a window
      skillDP: q12.tally.skill, refund: q12.tally.refund, module: q12.tally.module, own, capSkill: q12.capped.skill, capAll: byH.lost,
      casts12: q12.ev.filter(e => e.who === 'v' && e.k === 'cast').length,
      net: netOf(q12),               // what she adds up to the 12th, her own costs paid and what she saves the others
    };
  }

  // ---- Step | Value tables (X-DESIGN, "Calculation popups as step tables", author 2026-10-17) ----
  // the schedule the search found, in words: where Closure goes, who waited for her S2, how often her S2 was held
  const UI_n0 = x => Math.round(x).toLocaleString('en-US');
  function planText(r) {
    const p = r.plan, who = w => w === 'v' ? r.o.short : `${ord(w)} ${state.team[w - 1].name}`;
    const fs = r.cfg.firsts || [];
    return [fs.length ? (p.vAfter ? `${r.o.short} after ${who(fs[p.vAfter - 1])}` : `${r.o.short} before the members picked first`) : '',
            p.closure ? `Closure ${p.after ? 'after her' : 'first'}` : '',
            !r.cfg.helperRefund || r.cfg.noHold ? '' : p.waits.length ? `waited for her S2: ${p.waits.map(who).join(', ')}` : 'nobody waited for her S2',
            p.holds ? `her S2 held until ${p.holdFor.join(', ')} DP` : ''].filter(Boolean).join(' · ');
  }
  function steps(r, key) {
    const o = r.o, L = r.L, f = figures(r), st = state;
    const spRate = 1 - st.spDown / 100;
    const vDep = r.ev.filter(e => e.who === 'v' && e.k === 'deploy');
    const teamDep = r.ev.filter(e => e.who === 'team' && e.k === 'deploy');
    if (key === 'fieldAll') {
      if (f.fieldAll == null) return {title: '12TH LANDS', rows: [['The 12th not by ' + sec(r.H), '—']], notes: 'Raise the time shown or lower the team\'s costs.'};
      const a = f.atT, sumTeam = teamDep.reduce((x, e) => x + e.n, 0), sumV = r.ev.filter(e => e.who === 'v' && e.k === 'deploy' && e.t <= f.fieldAll + 1e-9).reduce((x, e) => x + e.n, 0);
      const offs = teamDep.filter(e => e.off), disc = offs.reduce((x, e) => x + e.off, 0);   // every -2 (one after each of her deployments)
      const clsN = teamDep.filter(e => e.cls).length, clsSum = teamDep.reduce((x, e) => x + (e.cls || 0), 0);   // Elysium: Snipers -2
      return {title: '12TH LANDS · ' + o.short.toUpperCase(), rows: [
        // the Closure plan this vanguard does best with (the best of the plans tried; author, 2026-10-24)
        ...(r.plan ? [[`${r.plan.closure ? 'Closure plan' : 'Plan'} (the best of ${UI_n0(r.searched)} schedules tried${r.searchCut ? ', search capped' : ''})`, planText(r)]] : []),
        [`${o.short}'s deployments (${vDep.filter(e => e.t <= f.fieldAll + 1e-9).length})`, sumV],
        [`+ the 11 others' costs${st.teamLayers ? ` (each ×${[1, 1.5, 2][st.teamLayers]}, rounded down)` : ''}`, teamDep.reduce((x, e) => x + e.base, 0)],
        ...(disc ? [[`− T2 ${(o.talents.find(t => (t.kind || 'next') === 'next') || {}).name}: next Operator${offs.length > 1 ? ` (×${offs.length})` : ''}`, -disc]] : []),
        ...(clsSum ? [[`− ${r.clsT.name}: ${r.clsT.cls}s while ${o.short} is on the field (×${clsN})`, -clsSum]] : []),
        ['= DP spent', a.spent],
        ['− starting DP', -a.start],
        [`− ${o.short}'s skill DP (${r.sk.name})`, -a.skill],
        ...(a.refund ? [[r.ev.some(e => e.last) ? `− refund: ${o.short} retreats so the 12th can land` : '− retreat refunds', -a.refund]] : []),
        ...(a.module ? [['− BEA-Y: a ground Operator after her', -a.module]] : []),
        ...(a.helper ? [[`− Closure's ${DPC_DATA.helper.skill} DP (${r.hpCasts ? 'her S2' : ''})`, -a.helper]] : []),
        ...(a.boost ? [[`− Closure S2: 40% back on deployments during it (${r.ev.filter(e => e.boost && e.t <= f.fieldAll).length})`, -a.boost]] : []),
        ['+ DP left over at the last deployment', a.left],
        ...(a.lost ? [['+ DP past the 99 cap (wasted)', a.lost]] : []),
        [`= natural DP needed (${st.rate} a second)`, a.natural],
        // below 0 natural DP comes in at half speed (Closure's DP lower limit): what that cost, so the seconds add up
        ...(a.slow > 1e-9 ? [['+ natural DP not received while below 0 (half speed)', a.slow], [`= natural DP at the full ${st.rate} a second`, a.natural + a.slow]] : []),
        ['12TH LANDS', `<b>${sec(f.fieldAll)}</b>`]],
        notes: `Deployments in team order${r.plan ? ` (${r.plan.closure ? 'Closure placed and her S2 timed' : `${o.short} placed`} by the plan above${(r.cfg.firsts || []).length ? '; the members picked first land as early as they can, then the 12th' : ''}; the 12th never waits; a tie on the 12th goes to the plan whose landing seconds add up lower)` : `, ${o.short} first`}; her return after the team when she is retreated. DP stops at 99.`};
    }
    if (key === 'firstCast') {
      const d = vDep[0];
      if (!d || f.firstCast == null) return {title: 'FIRST SKILL', rows: [['No cast by ' + sec(r.H), '—']]};
      return {title: 'FIRST SKILL · ' + o.short.toUpperCase(), rows: [
        // when she goes down, and why then (author, 2026-10-19: "wdym deploy in second"): the stage starts at 1s with the
        // starting DP; she waits for her cost
        [`Deployed at (her cost ${d.n} DP${d.t > 1 ? `: ${st.start} starting + ${+((d.t - 1) * st.rate).toFixed(2)} natural` : `, ${st.start} starting DP covers it`})`, sec(d.t)],
        [`SP cost (${r.sk.name}, ${lvName(st.ops[OPS.indexOf(o)].sl)})`, L.sp],
        ['− initial SP', -L.init],
        ['= SP to charge', L.sp - L.init],
        [`÷ SP a second${st.spDown ? ` (−${st.spDown}%)` : ''}`, +spRate.toFixed(2)],
        ['= seconds charging (whole seconds, up)', Math.ceil((L.sp - L.init) / spRate - 1e-9)],
        ['+ 1: the skill runs from the next second', 1],
        ['FIRST SKILL', `<b>${sec(f.firstCast)}</b>`]],
        notes: 'Second by second, as the sheet: SP charges from the second after deployment, not during the skill.'};
    }
    if (key === 'before') {
      const ends = r.ev.filter(e => e.who === 'v' && e.k === 'end');
      const per = L.dp.total;
      return {title: 'SKILLS BEFORE THE 12TH · ' + o.short.toUpperCase(), rows: [
        ...f.before.map((t, k) => {
          const e = ends.find(x => x.t >= t), cut = f.fieldAll != null && e && e.t >= f.fieldAll;
          return [`Skill ${k + 1} (${r.sk.name})`, `${sec(t)} → ${e ? sec(e.t) : '…'}${cut ? ' (still running)' : ''}`];
        }),
        [`12th member lands`, f.fieldAll != null ? sec(f.fieldAll) : 'not by ' + sec(r.H)],
        ['SKILLS BEFORE THE 12TH', `<b>${f.before.length}</b>`],
        ['their DP (up to the 12th)', n0(f.atT ? f.atT.skill : r.tally.skill)]],
        notes: `A skill counts when it starts before the 12th member lands, or in the same second (its DP comes first); one still running then gives only the DP up to that second. ${per} DP a full skill.`};
    }
    if (key === 'skillDP') {
      const per = L.dp.total, n = f.casts12;
      const when = r.fieldAll != null ? 'UP TO THE 12TH (' + sec(r.fieldAll) + ')' : 'BY ' + sec(r.H) + ' (THE 12TH NOT YET)';
      return {title: 'SKILL DP · ' + o.short.toUpperCase() + ' · ' + when, rows: [
        [`DP a cast (${r.sk.name})`, L.dp.every ? `${per} (${+(per / Math.round(L.dur)).toFixed(2)} a second for ${Math.round(L.dur)}s)` : `${per} at once`],
        ['× casts up to the 12th', n],
        ...(f.skillDP < per * n - 1e-9 ? [['− not given by then (a cast still running, or cut by her retreat)', f.skillDP - per * n]] : []),
        ['SKILL DP', `<b>${n0(f.skillDP)}</b>`],
        ...(f.capSkill ? [['of which past the 99 cap (wasted)', n0(f.capSkill)]] : [])],
        notes: `SP cycle: ${L.sp - L.init} SP to the first cast, then ${L.sp} SP after each ${Math.round(L.dur)}s skill. Natural DP comes first each second, so once DP sits at 99 the skill's DP is what spills.`};
    }
    if (key === 'net') {
      const q = upTo12(r), qDep = q.ev.filter(e => e.who === 'v' && e.k === 'deploy');
      const when = r.fieldAll != null ? 'UP TO THE 12TH (' + sec(r.fieldAll) + ')' : 'BY ' + sec(r.H) + ' (THE 12TH NOT YET)';
      return {title: 'DP SHE ADDS · ' + o.short.toUpperCase() + ' · ' + when, rows: [
        ['Skill DP', q.tally.skill],
        ...(q.tally.refund ? [['+ retreat refunds', q.tally.refund]] : []),
        ...(qDep.some(e => e.boost) ? [['+ Closure S2: 40% back on her own deployment', qDep.reduce((a, e) => a + (e.boost || 0), 0)]] : []),
        ...(q.tally.module ? [['+ BEA-Y', q.tally.module]] : []),
        ...qDep.map((e, i) => [(i === 0 ? '− her deployment' : `− her return ${i}`) + (e.mult > 1 ? ` (${r.ph.cost} ×${e.mult.toFixed(1)})` : ''), -e.n]),
        ...(savedNext(q) ? [[`+ T2 ${(o.talents.find(t => (t.kind || 'next') === 'next') || {}).name}: the next Operator −${-r.next} (×${q.ev.filter(e => e.off).length})`, savedNext(q)]] : []),
        ...(savedCls(q) ? [[`+ ${r.clsT.name}: ${r.clsT.cls}s −${-r.clsT.value} while she is on the field (×${q.ev.filter(e => e.cls).length})`, savedCls(q)]] : []),
        ['DP SHE ADDS', `<b>${n0(f.net)}</b>`],
        ...(q.capped.skill ? [['of which past the 99 cap (wasted)', n0(q.capped.skill)]] : [])],
        notes: 'Counted up to the second the 12th member lands. What she takes off other operators’ costs counts as DP she adds. Natural DP left out: it is the same with either vanguard. Counted in full: DP that spills past 99 is shown, not taken off.'};
    }
  }
  // a step value as it is: whole numbers plain, the sheet's quarters (2.25 a second) to two places, so the rows add up
  const num = v => Math.abs(v - Math.round(v)) < 1e-9 ? n0(v) : (+v.toFixed(2)).toLocaleString('en-US');
  function table(t) {
    return `<div class="stp-t">${t.title}</div><table class="stp"><thead><tr><th>Step</th><th>Value</th></tr></thead><tbody>${
      t.rows.map(([k, v]) => `<tr><td>${k}</td><td>${typeof v === 'number' ? num(v) : v}</td></tr>`).join('')}</tbody></table>${
      t.notes ? `<p class="stp-n">${t.notes}</p>` : ''}`;
  }
  // one popup for the page: a figure with data-step="<op index>:<key>" opens it
  function popups(root) {
    const pop = document.createElement('div'); pop.className = 'stp-pop'; pop.hidden = true; document.body.appendChild(pop);
    root.addEventListener('click', e => {
      const f = e.target.closest('[data-step]');
      if (!f) return;
      const [i, k] = f.dataset.step.split(':'), r = results()[+i];
      pop.innerHTML = table(steps(r, k)) + '<button class="stp-x" type="button">CLOSE</button>';
      pop.hidden = false;
      const b = f.getBoundingClientRect(), w = Math.min(420, innerWidth - 32);
      pop.style.width = w + 'px';
      pop.style.left = Math.max(16, Math.min(b.left + scrollX, scrollX + innerWidth - w - 16)) + 'px';
      pop.style.top = (b.bottom + scrollY + 8) + 'px';
      e.stopPropagation();
    });
    document.addEventListener('click', e => { if (!pop.contains(e.target) || e.target.closest('.stp-x')) pop.hidden = true; });
  }

  // the page's tooltips drawn above what they explain, never under the pointer (author, 2026-10-24: "my mouse clogging
  // tooltip"): each title moves to data-tip on the first hover
  function tips() {
    const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; document.body.appendChild(tip);
    let cur = null;
    const hide = () => { tip.hidden = true; cur = null; };
    document.addEventListener('mouseover', e => {
      const el = e.target.closest('[title], [data-tip]');
      if (!el) return hide();
      if (el.title) { el.dataset.tip = el.title; el.removeAttribute('title'); }   // (a redraw may set a new title)
      if (el === cur && !tip.hidden) return;
      // 2ND -> 2 with "nd" raised, as on the cards (author, 2026-10-24: "^those th rd")
      cur = el; tip.hidden = false;
      tip.innerHTML = el.dataset.tip.replace(/[&<>]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'})[c])
        .replace(/\b(\d+)(st|nd|rd|th)\b/gi, (m, n, x) => `${n}<sup>${x.toLowerCase()}</sup>`);
      const b = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = Math.max(8, Math.min(b.left + b.width / 2 - w / 2, innerWidth - w - 8)) + scrollX + 'px';
      tip.style.top = (b.top - h - 6 >= 4 ? b.top - h - 6 : b.bottom + 6) + scrollY + 'px';
    });
    document.addEventListener('mouseleave', hide);
    addEventListener('scroll', hide, true);
  }

  // ---- controls ----
  const seg = (k, opts, cur, i) => `<div class="seg" data-k="${k}"${i != null ? ` data-op="${i}"` : ''}>${opts.map(([v, l, dis]) =>
    `<button type="button" data-v="${v}" aria-pressed="${v === cur}"${dis ? ' disabled' : ''}>${l}</button>`).join('')}</div>`;
  function stageControls() {
    const s = state;
    return `
      <label class="ctl"><span class="lab">STARTING DP</span><input type="range" data-k="start" min="0" max="99" step="1" value="${s.start}"><output>${s.start}</output></label>
      <label class="ctl"><span class="lab">NATURAL DP</span><input type="range" data-k="rate" min="0" max="2" step="0.05" value="${s.rate}"><output>${s.rate}<span class="sx">/s</span></output></label>
      <label class="ctl"><span class="lab">SP DOWN</span><input type="range" data-k="spDown" min="0" max="90" step="5" value="${s.spDown}"><output>${s.spDown ? '−' + s.spDown + '%' : '0'}</output></label>
      <div class="ctl"><span class="lab">THEIR DEPLOY COST</span>${seg('layers', [[0, '×1'], [1, '×1.5'], [2, '×2.0']], s.layers)}</div>
      <div class="ctl"><span class="lab">TEAM DEPLOY COST</span>${seg('teamLayers', [[0, '×1'], [1, '×1.5'], [2, '×2.0']], s.teamLayers)}</div>
      <div class="ctl"><span class="lab">RETREAT &amp; RETURN</span>${seg('penalty', [[0, 'NEVER'], [1, 'AFTER EACH SKILL']], s.penalty)}</div>
      <div class="ctl"><span class="lab">RETREAT FOR THE 12TH</span>${seg('lastRetreat', [[0, 'OFF'], [1, 'ON']], s.lastRetreat)}</div>
      <div class="ctl"><span class="lab">CLOSURE AS 2ND VANGUARD</span>${seg('helperDP', [[0, 'OFF'], [1, 'S2']], s.helperDP)}</div>
      <div class="ctl"><span class="lab">CLOSURE S2: HOLD OPS</span>${seg('hold', [[0, 'OFF', !s.helperDP], [1, 'ON', !s.helperDP]], s.hold)}</div>
      <div class="ctl"><span class="lab">CLOSURE: DP LOWER LIMIT</span>${seg('debt', [[0, '0'], [3, '−3'], [4, '−4'], [5, '−5'], [6, '−6']], s.debt)}</div>
      <label class="ctl"><span class="lab">TIME SHOWN</span><input type="range" data-k="horizon" min="30" max="300" step="10" value="${s.horizon}"><output>${sec(s.horizon)}</output></label>`;
  }
  function opControls(i) {
    const o = OPS[i], st = state.ops[i];
    fix(o, st);
    const beaY = o.mods.find(m => m.code === 'BEA-Y');
    return `${i === 0 ? `
      <div class="ctl"><span class="lab">POTENTIAL</span>${seg('pot', [1, 2, 3, 4, 5, 6].map(p => [p, 'P' + p]), st.pot, i)}</div>` : ''}
      <div class="ctl"><span class="lab">ELITE</span>${seg('e', [0, 1, 2].map(e => [e, 'E' + e]), st.e, i)}</div>
      <div class="ctl"><span class="lab">SKILL</span>${seg('s', o.skills.map((s, j) => [j, 'S' + (j + 1), s.e > st.e]), st.s, i)}</div>
      <div class="ctl"><span class="lab">SKILL LV</span>${seg('sl', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => [l, l > 7 ? 'M' + (l - 7) : l, (l > 7 && st.e < 2) || (l > 4 && st.e < 1)]), st.sl, i)}</div>
      ${beaY ? `<div class="ctl"><span class="lab">MODULE</span>${seg('mod', [[0, '—'], [1, 'BEA-Y 1', st.e < 2], [2, 'BEA-Y 2', st.e < 2], [3, 'BEA-Y 3', st.e < 2]], st.mod, i)}</div>` : ''}`;
  }
  // the cost box as wide as its number, so "15→30" reads as one (author, 2026-10-19: "no gap between the cost pls")
  const fitCtx = document.createElement('canvas').getContext('2d');
  const fitW = v => { fitCtx.font = '400 17px "Bebas Neue"'; return Math.ceil(fitCtx.measureText(String(v)).width) + 1 + 'px'; };
  document.fonts && document.fonts.ready.then(() => document.querySelectorAll('.team .cv input').forEach(i => { i.style.width = fitW(i.value); }));
  // beside THE TEAM OF 12 (author, 2026-10-24: "add it here since its team thingy"): where the racers go among the
  // members picked first; only with a pick
  function teamOptions() {
    const none = !state.team.some(m => m.first);
    return `<div class="ctl"><span class="lab">RACERS</span>${seg('vBefore', [[0, 'BEST PLACE', none], [1, 'BEFORE THE PICKS', none]], state.vBefore)}</div>`;
  }
  function teamControls(compact) {
    return `<div class="team${compact ? ' compact' : ''}">
      ${state.team.map((m, j) => `<div class="slot${m.first ? ' first' : ''}">
        <span class="tvi" data-pick="${j}" title="${m.name}: click to ${m.first ? 'stop deploying first' : 'deploy as early as possible (team order kept)'}"><img src="${AV(m.id)}" alt=""><span class="tband">${flag(j + 1)}<span class="tnm" title="${m.name}">${m.name}</span></span>
          <span class="cvbar"><span class="cv"><input type="number" min="0" max="99" value="${m.cost}" data-team="${j}" aria-label="${ord(j + 1)}: ${m.name}, DP cost" style="width:${fitW(m.cost)}">${
            state.teamLayers ? `<span class="tx" title="this stage: ×${[1, 1.5, 2][state.teamLayers]}">→${Math.floor(m.cost * [1, 1.5, 2][state.teamLayers])}</span>` : ''}</span>
          </span></span>
        ${winFlag(j)}<span class="skn" data-skn="${j}"></span></div>`).join('')}</div>`;
  }
  function bind(root) {
    root.addEventListener('input', e => {
      const k = e.target.dataset.k, j = e.target.dataset.team;
      if (k) {
        state[k] = +e.target.value;
        const out = e.target.parentNode.querySelector('output'), v = state[k];
        if (out) out.innerHTML = k === 'rate' ? v + '<span class="sx">/s</span>' : k === 'spDown' ? (v ? '−' + v + '%' : '0') : k === 'horizon' ? sec(v) : v;
        quickUntil = performance.now() + 240; clearTimeout(settle); settle = setTimeout(() => fire('input'), 250);
        fire('input');
      }
      else if (j != null) {
        quickUntil = performance.now() + 240; clearTimeout(settle); settle = setTimeout(() => fire('input'), 250);
        state.team[+j].cost = Math.max(0, Math.min(99, +e.target.value || 0));
        if (e.target.closest('.cv')) {
          e.target.style.width = fitW(e.target.value || 0);
          const tx = e.target.parentNode.querySelector('.tx'), k = [1, 1.5, 2][state.teamLayers];
          if (tx) tx.textContent = '→' + Math.floor(state.team[+j].cost * k);
        }
        fire('input');
      }
    });
    root.addEventListener('click', e => {
      // a member picked to go first (author, 2026-10-24): click the portrait; the cost box keeps its own clicks
      const pk = e.target.closest('[data-pick]');
      if (pk && !e.target.closest('input')) { const m = state.team[+pk.dataset.pick]; m.first = !m.first; fire('click'); return; }
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      const g = b.closest('.seg');
      if (g) {
        // a two-button switch flips when its pressed button is clicked again (author, 2026-10-24: "for 2 switches,
        // reclick switches")
        const bs = g.querySelectorAll('button'), other = bs.length === 2 && b.getAttribute('aria-pressed') === 'true' ? [...bs].find(x => x !== b) : null;
        if (other && other.disabled) return;
        const v = +(other || b).dataset.v, i = g.dataset.op;
        if (i != null) { state.ops[+i][g.dataset.k] = v; if (g.dataset.k === 'e') { state.ops[+i].sl = v === 2 ? 10 : 7; state.ops[+i].mod = v === 2 ? modE2(OPS[+i]) : 0; } }
        else { state[g.dataset.k] = v; if (g.dataset.k === 'helperDP') arrange(); }
        fire('click'); return;
      }
      if (b.dataset.ground != null) { const m = state.team[+b.dataset.ground]; m.ground = !m.ground; fire('click'); }
    });
  }
  // the stage bar folds away once the page has scrolled past it (author, 2026-10-19: "auto fold this when no mouse at
  // the top edge"): it floats over the page (a placeholder keeps its room, so nothing below moves) as one slim summary
  // line; the mouse at the top edge, or on the bar, or a slider being dragged opens it; on a touch screen, tap the line
  function autoFold(bar) {
    const ph = document.createElement('div'), sum = document.createElement('div');
    bar.before(ph); sum.className = 'fold-sum'; sum.hidden = true; document.body.appendChild(sum);
    let y = -1, drag = false, tapped = false, natural = 0;
    const text = () => {
      const s = state;
      sum.innerHTML = `<span>START <b>${s.start}</b> DP</span><span>NATURAL <b>${s.rate}</b><span class="sx">/s</span></span><span>SP DOWN <b>${s.spDown ? '−' + s.spDown + '%' : '0'}</b></span>` +
        `<span>COST <b>×${[1, 1.5, 2][s.layers]}</b></span><span>TEAM COST <b>×${[1, 1.5, 2][s.teamLayers]}</b></span><span>RETURN <b>${s.penalty ? 'AFTER EACH SKILL' : 'NEVER'}</b></span>` +
        `<span>RETREAT FOR 12TH <b>${s.lastRetreat ? 'ON' : 'OFF'}</b></span>` +
        // Closure's switches too (author, 2026-10-24: "same setting got me differently now": they were missing here)
        `<span>CLOSURE S2 <b>${s.helperDP ? 'ON' : 'OFF'}</b></span><span>HOLD OPS <b>${s.helperDP && s.hold ? 'ON' : 'OFF'}</b></span><span>DP LOWER LIMIT <b>${s.debt ? '−' + s.debt : '0'}</b></span>` +
        `<span>TIME <b>${sec(s.horizon)}</b></span>` +
        (s.team.some(m => m.first) ? `<span>FIRST <b>${s.team.filter(m => m.first).map(m => m.name).join(', ')}</b></span>` +
          (s.vBefore ? `<span>RACERS <b>BEFORE THE PICKS</b></span>` : '') : '') + `<i>▾</i>`;
    };
    const update = () => {
      const r = ph.getBoundingClientRect(), stuck = r.top < 0;
      if (!stuck) { bar.classList.remove('fixed', 'folded'); bar.style.left = bar.style.width = ''; ph.style.height = '0px'; sum.hidden = true; return; }
      if (!bar.classList.contains('fixed')) { natural = bar.offsetHeight; ph.style.height = natural + 'px'; }
      bar.classList.add('fixed');
      for (const el of [bar, sum]) { el.style.left = r.left + 'px'; el.style.width = r.width + 'px'; }
      const open = drag || tapped || (y >= 0 && y <= (bar.classList.contains('folded') ? 30 : bar.offsetHeight + 8));
      bar.classList.toggle('folded', !open); sum.hidden = open;
    };
    addEventListener('scroll', update, {passive: true}); addEventListener('resize', update);
    addEventListener('mousemove', e => { y = e.clientY; update(); });
    document.addEventListener('mouseleave', () => { y = -1; update(); });
    bar.addEventListener('pointerdown', () => { drag = true; });
    addEventListener('pointerup', () => { drag = false; setTimeout(update, 0); });
    sum.addEventListener('click', () => { tapped = true; update(); });
    document.addEventListener('click', e => { if (tapped && !bar.contains(e.target) && !sum.contains(e.target)) { tapped = false; update(); } });
    on(() => { text(); requestAnimationFrame(update); }); text(); update();
  }
  // the left vanguard's picker (author, 2026-10-24: "add 5* flags as selectable competitors when clicked on saileach
  // portraits"): a row of Saileach and the 5* Standard Bearers on her name line, always showing ("here for portraits no
  // need to fold"); a pick takes her place, at E2, S1, M3, P1 (welfare P6)
  let pickOpen = false;
  function pickerHTML() {
    // mini icons, no name or rarity (author, 2026-10-24); the name on hover
    return `<div class="pick">${LEFT.map((o, k) => `<button type="button" data-left="${k}" aria-pressed="${o.id === OPS[0].id}" title="${o.short}" aria-label="${o.short}">
      <img src="${AV(o.id)}" alt=""></button>`).join('')}</div>`;
  }
  function pickLeft(k) {
    const o = LEFT[k];
    OPS[0] = o; state.ops[0] = {e: 2, s: 0, sl: 10, mod: modE2(o), pot: o.pot};
    pickOpen = false; fire('click');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-left]');
    if (b) { pickLeft(+b.dataset.left); return; }
    if (e.target.closest('[data-pickleft]')) { pickOpen = !pickOpen; fire('click'); }
  });
  return {OPS, COL, LEFT, pickerHTML, clock, vcost, baseCost, redeployOf, AV, autoFold, ord, flag, winFlag, landings, paintFlags, state, on, fire, results, figures, steps, table, popups, stageControls, opControls, teamControls, teamOptions, bind, tips,
          n0, sec, secT, lvName, first};
})();
