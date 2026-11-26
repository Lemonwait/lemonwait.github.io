// Saileach vs Myrtle on DP: the stage second by second, as the author's DP sheet steps it (shared by x-dp-compare*.html;
// author, 2026-10-19: "second by second, right? no decimals"). Second 1 is the stage's start: the starting DP, the
// first deployments; each later second +1 natural DP, the skill's DP for that second, then whoever can deploy.
// Rules (PRTS, 部署费用, read 2026-10-19): natural DP 1 a second unless the stage changes it; DP stops at 99; every
// departure adds a redeploy penalty layer (x1.5, then x2.0 at most, floored); retreat refunds floor(50% of what this
// deployment cost), at most the base cost; "the next Operator -2 DP" is added after the penalty.
// Skills: SP 1 a second from the second after deployment, none during the skill; the skill runs from the second after
// its SP is full (the sheet: Saileach deployed at 1, SP 11 at 12, her DP from 13 to 20).
const DPC = (() => {
  const DT = 1, CAP = 99, STOP = {};
  const at = (o, e) => o.phases[Math.min(e, o.phases.length - 1)];

  // cfg: {op, e, s, sl (1-10), mod (0-3, BEA-Y on Saileach), start, rate (natural DP a second), spDown (% slower SP),
  //       layers (0-2: her deploy cost x1 / x1.5 / x2.0, as if retreated before), penalty (truthy: retreat after each
  //       skill and come back), lastRetreat, team: [{cost, ground}] x 11, horizon}
  // choices (author, 2026-10-24, "exact optimizer"): cfg.decisions answers the run's choice points in order (0 = now,
  // 1 = wait / hold); cfg.stopAt stops the run at that choice (the search); cfg.lean skips the records the page draws
  function run(cfg) {
    const lean = !!cfg.lean, D = cfg.decisions || [], stopAt = cfg.stopAt ?? Infinity;
    let ci = 0;
    const log = [];
    const o = cfg.op, sk = o.skills[cfg.s], L = sk.levels[cfg.sl - 1];
    // cost and redeploy at the potential picked (Saileach selectable, author 2026-10-19), else the author's set one
    const ph = cfg.pot && o.base ? (b => ({...at(o, cfg.e), cost: b.cost + o.potDP[cfg.pot - 1][0], redeploy: b.redeploy + o.potDP[cfg.pot - 1][1]}))(o.base[Math.min(cfg.e, o.base.length - 1)])
                                 : at(o, cfg.e);
    // talents that touch DP, the last candidate her elite and potential reach: Saileach's "next Operator -2" (next);
    // Elysium's "all [Sniper] Operators -1 / -2 while she is deployed" (cls)
    const tal = kind => o.talents.filter(t => (t.kind || 'next') === kind && t.e <= cfg.e && (t.pot || 1) <= (cfg.pot || o.pot || 1)).pop();
    const next = (tal('next') || {}).next || 0;
    const clsT = tal('cls'), clsOff = clsT ? -clsT.value : 0, clsName = clsT ? clsT.cls : null;
    const beaY = o.mods.find(m => m.code === 'BEA-Y');
    const gGain = beaY && cfg.e === 2 && cfg.mod > 0 ? beaY.stages[cfg.mod - 1].groundGain : 0;
    const spRate = 1 - (cfg.spDown || 0) / 100;
    const H = cfg.horizon || 120;

    let t = 1, dp = cfg.start;
    const tally = {start: cfg.start, natural: 0, skill: 0, refund: 0, module: 0, helper: 0, boost: 0, spent: 0, lost: 0, slow: 0};
    const ev = [], series = [], lanes = [];
    // every team member's cost multiplied too (author, 2026-10-19: "need a triggle for another deploy penalty but for
    // every team member"): x1 / x1.5 / x2.0, floored; Saileach's -2 still comes off after it
    const tMult = [1, 1.5, 2][Math.min(2, cfg.teamLayers || 0)];
    const queue = cfg.team.map((m, i) => ({...m, slot: i + 1, cost: Math.floor(m.cost * tMult), listed: m.cost}));      // 1st-11th after the vanguard
    let discount = 0, gainNext = 0, fieldAll = null, deployedTeam = 0;
    // members picked to go first (author, 2026-10-24: "deploy the x member as fast as possible while going through every
    // member before x"): the team order stays; the search puts their landing times first, then the 12th's
    const firsts = cfg.firsts || [], pickT = {};
    let picked = 0, vAfter = 0;                       // vAfter: picks deployed before the vanguard's first deployment
    // landSum: every member's landing second added up, the tie-break when the 12th lands at the same second (author,
    // 2026-11-05: "Lowest total": the team on the field sooner on average)
    let landSum = 0;
    const landed = m => { landSum += t; if (firsts.includes(m.slot)) { pickT[m.slot] = t; picked++; } };
    // the vanguard
    // her cost multiplied (author, 2026-10-19: "saileach and myrtle deploy costs multiplied by 1.5 or 2.0"): the stage
    // starts with that many penalty layers on her; a later return adds one, up to x2.0
    const V = {on: false, layers: Math.min(2, cfg.layers || 0), paid: 0, sp: 0, ready: false, inSkill: false, secIn: 0, given: 0, readyAt: 1,
               casts: 0, deploys: 0, at: 0};
    const MULT = [1, 1.5, 2], vCost = () => Math.floor(ph.cost * MULT[V.layers]);
    // Closure in the squad lowers the DP lower limit (author, 2026-11-05: "clo module allows dp debt"; game data: E2 talent
    // -3, TAC-X 2 -4, TAC-X 3 -5, P3 one more): a unit may be paid for down to -cfg.debt, and below 0 natural DP comes
    // in at half speed until it is back to 0 (PRTS 术语释义). can(c): the DP is there, debt included
    const floor = -(cfg.helper && cfg.debt || 0);
    const can = c => dp - floor >= c - 1e-9;
    // DP in, capped at 99. Each source is counted in full (what it makes); what the cap eats is "lost", and by source
    // in capped (author, 2026-10-19: "you're kidding, only 2 activations?": her skill DP had shrunk by what went past 99)
    const capped = {natural: 0, skill: 0, refund: 0, module: 0, helper: 0, boost: 0};
    const gain = (n, k) => {
      const room = Math.max(0, CAP - dp), got = Math.min(n, room);
      dp += got; tally[k] += n; tally.lost += n - got; capped[k] += n - got;
    };
    // a skill's DP a second, as the sheet counts it: its total spread evenly over its seconds (Support γ 18 over 8s:
    // 2.25 a second); an instant one (Saileach S3) all in its first second
    const dur = Math.max(1, Math.round(L.dur)), perSec = L.dp.every > 0 ? L.dp.total / dur : 0;
    // the 2nd vanguard (Closure, team slot hp.slot): her skill runs whenever either switch is on; cfg.helperDP counts its DP,
    // cfg.helperRefund the 40% back on every deployment while it runs (the page passes both together: her S2 is both,
    // author 2026-10-24). cfg.noHold: nobody waits for her S2 and it is never held. Same second-by-second rules as hers
    const hp = cfg.helper, HV = {on: false, at: 0, sp: 0, ready: false, inSkill: false, secIn: 0, casts: 0, given: 0};
    const hpOn = hp && (cfg.helperDP || cfg.helperRefund), hpDur = hp ? Math.round(hp.dur) : 0;
    const boost = c => {                             // a deployment while her S2 runs: 40% of what it cost back
      if (!(hpOn && cfg.helperRefund && rec.hpIn)) return 0;   // her S2 running this second, its last second included
      const back = Math.ceil(c * hp.refund - 1e-9); gain(back, 'boost'); return back;   // always rounded up (author: "clo s2 's dp refund always round up no matter the decimals")
    };
    const hpLanes = [];
    let lane = null, rec = null, hpLane = null;
    const secs = [];                                 // one record a second, for the sheet view (mock D)
    // the next member's cost right now (Saileach's -2, Elysium's Snipers -2 on it)
    const nextCost = () => { const m = queue[0]; return Math.max(0, m.cost - discount - (V.on && clsOff && m.role === clsName ? clsOff : 0)); };
    const deployV = () => {                          // the vanguard goes down, if the DP is there
      const c = vCost();
      if (!can(c)) return false;
      dp -= c; tally.spent += c; V.on = true; V.at = t; V.paid = c; V.sp = L.init; V.base = L.init; V.deploys++;
      const b = boost(c); if (b) rec.vBoost = b;
      ev.push({t, who: 'v', k: 'deploy', n: c, mult: MULT[V.layers], layers: V.layers, boost: b});
      discount = -next; gainNext = gGain;            // the next operator after her
      if (V.sp >= L.sp) V.ready = true;
      return true;
    };
    // the choices, only before the 12th lands: while Closure's 40% back is on, a unit that can pay outside her S2 goes
    // now or waits for the next S2 (a wait lasts until an S2 starts); her S2, ready while the next one in line cannot
    // pay, is cast now or held until it can; with members picked first, where the vanguard goes among them
    const refundOn = hpOn && cfg.helperRefund;
    let s2Need = null, stopOpts = 2;
    const held = new Set();   // who chose to wait for her next S2 (each asked once per wait)
    const choose = (kind, who, n = 2) => {          // n answers: 0 .. n-1
      if (fieldAll != null) return 0;                // after the 12th nothing matters to the race
      if (ci >= stopAt) { stopOpts = n; throw STOP; }
      // past the given answers, a warm-start run answers by rule of thumb (cfg.auto); otherwise "now"
      const a = ci < D.length ? D[ci++] : (ci++, cfg.auto ? autoAnswer(kind, who, n) : 0);
      if (!lean) log.push({kind, who, t, a});
      return a;
    };
    // the rules of thumb, for the warm start: wait when her next S2 starts before DP would reach 99; hold her S2 for the
    // next holdK in line (0 = cast at once)
    const s2In = () => HV.ready ? 1 : Math.ceil((hp.sp - HV.sp) / spRate - 1e-9) + 1;
    const vSkillIn = n => {
      if (!V.on) return 0;
      const a = L.dp.every > 0 ? perSec : 0;
      if (V.inSkill) return a * Math.min(n, dur - V.secIn);
      const k = V.ready ? 1 : Math.ceil((L.sp - V.sp) / spRate - 1e-9) + 1;
      return k > n ? 0 : a ? a * Math.min(dur, n - k + 1) : L.dp.total;
    };
    const autoAnswer = (kind, who, n) => {
      if (kind === 'vpos') return Math.min(cfg.auto.vpos || 0, n - 1);
      if (kind === 'debt') return cfg.auto.debtWait ? 1 : 0;
      if (kind === 'hold') {
        if (cfg.auto.holdOld) {                        // the old plans' rule: hold until the member in line can pay
          const tg = holdTargets(), want = queue.length ? (V.deploys > 0 ? nextCost() : queue[0].cost) : null;
          const i = tg.indexOf(want);
          return i < 0 ? 0 : i + 1;
        }
        return Math.min(cfg.auto.holdK || 0, n - 1);   // 1.. = the hold targets in order
      }
      if (who === 'v' && !cfg.auto.vWait) return 0;
      const k = s2In();
      return dp + k * (cfg.rate ?? 1) + vSkillIn(k) <= CAP ? 1 : 0;
    };
    // the earliest the 12th could land from here, safely: every unit left at 60% of its cost less 1 (all with 40% back),
    // against the most DP that could come in: natural, every skill as often as SP allows, her refund and BEA-Y
    const lowerBound = () => {
      let need = queue.reduce((a, m) => a + Math.max(0, 0.6 * Math.max(0, m.cost - 2 - (clsOff || 0)) - 1), 0);
      // her own cost not counted: with 40% back and a 50% retreat refund almost all of it can return
      need -= dp - floor + (V.on ? Math.min(Math.floor(V.paid * 0.5), ph.cost) : 0) + gGain * queue.length;
      if (need <= 0) return t;
      const cycV = dur + L.sp / spRate, cycC = hp ? hpDur + hp.sp / spRate : Infinity;
      const inc = d => d * (cfg.rate ?? 1) + (Math.ceil(d / cycV) + 1) * L.dp.total
        + (hpOn && cfg.helperDP ? (Math.ceil(d / cycC) + 1) * (hp.instant + hp.over) : 0);
      let lo = 0, hi = 1;
      while (inc(hi) < need && hi < 4096) hi *= 2;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (inc(mid) >= need) hi = mid; else lo = mid + 1; }
      return t + lo;
    };
    // going into debt is a choice (the search): pay now below 0, or wait until the DP is there without it; never for the
    // 12th, and not with HOLD OPS off (everyone goes the moment they can pay)
    const debtHeld = new Set();
    const payNow = (who, c, last) => {
      if (dp - c >= -1e-9 || last || cfg.noHold) { debtHeld.delete(who); return true; }
      // an ordinary member outside her S2 never goes into debt: landing early helps nobody, and the debt costs half of
      // itself in slow natural DP. Only the vanguard (her skill sooner), Closure (her S2 sooner) or a member during
      // Closure's S2 (its 40% back) may gain from it
      if (who !== 'v' && !(hp && who === hp.slot) && !rec.hpIn) return false;
      // during her S2, a member whose 40% back pays off the debt at once goes now: the same DP afterwards, landed sooner
      if (who !== 'v' && rec.hpIn && refundOn && dp - c + Math.ceil(c * hp.refund - 1e-9) >= -1e-9) { debtHeld.delete(who); return true; }
      if (debtHeld.has(who)) return false;
      if (choose('debt', who)) { debtHeld.add(who); return false; }
      return true;
    };
    // can(c), less the debt an ordinary member outside her S2 never takes (see payNow): checked before any choice
    const canPay = (who, c, last) => can(c) && (dp - c >= -1e-9 || last || cfg.noHold || who === 'v' || !!(hp && who === hp.slot) || !!rec.hpIn);
    const goNow = (who, last) => {
      if (!refundOn || cfg.noHold || !HV.on || rec.hpIn || last) return true;
      if (cfg.noWait && cfg.noWait.includes(who)) return true;   // pinned: goes the moment it can pay
      if (firsts.includes(who)) return true;          // a pick goes the moment it can pay (author, 2026-10-24: "yes")
      if (held.has(who)) return false;
      if (choose('wait', who)) { held.add(who); return false; }
      return true;
    };
    const nextUnitCost = () => !V.on && V.deploys === 0 ? vCost() : queue.length ? nextCost() : null;
    // how long her S2 may be held: until the next 1, 2, 3 or 4 in line can be paid one after another inside it, each
    // one's 40% back helping pay the next (author, 2026-10-24: a longer hold beat "until the next can pay" by 2s)
    const holdTargets = () => {
      const costs = [];
      if (!V.on && V.deploys === 0) costs.push(vCost());
      queue.forEach((m, i) => costs.push(i === 0 && V.deploys > 0 ? nextCost() : m.cost));
      const out = [];
      let need = 0;
      for (let k = 0; k < Math.min(4, costs.length); k++) {
        need = k === 0 ? costs[0] : need - Math.ceil(costs[k - 1] * hp.refund - 1e-9) + costs[k];
        if (need > dp - floor + 1e-9 && need <= CAP && !out.includes(need)) out.push(need);
      }
      for (let k = 1; k < Math.min(4, costs.length); k++)        // ...or until one of the next units alone can pay
        if (costs[k] > dp - floor + 1e-9 && costs[k] <= CAP && !out.includes(costs[k])) out.push(costs[k]);
      return out;
    };
    const second = () => {
      if (t > 1) {                                    // below 0: half speed until back to 0, then full
        const r = cfg.rate ?? 1, half = r / 2;
        const n = dp >= 0 ? r : half >= -dp ? -dp + (1 + dp / half) * r : half;
        if (n < r) tally.slow += r - n;
        gain(n, 'natural');
      }
      if (hpOn && HV.on && t > HV.at) {
        let cast = HV.ready;
        if (cast && !cfg.noHold) {                   // (her S2 DP alone too: holding it can save DP from the 99 cap)
          if (s2Need != null) cast = dp - floor >= s2Need - 1e-9 || dp >= CAP - 1e-9;   // held: until the amount is there
          else {
            const tg = holdTargets();
            if (tg.length) {                               // the next one in line cannot pay yet: cast now, or hold
              const a = choose('hold', 's2', tg.length + 1);
              if (a) { s2Need = tg[a - 1]; cast = false; if (!lean) log[log.length - 1].need = s2Need; }
            }
          }
        }
        if (cast) { s2Need = null; HV.ready = false; HV.inSkill = true; HV.secIn = 0; HV.casts++; HV.given = 0; rec.hpCast = true;
                        hpLane = {t0: t, end: null}; hpLanes.push(hpLane); ev.push({t, who: 'h', k: 'cast'}); }
        if (HV.inSkill) {
          const g = (HV.secIn === 0 ? hp.instant : 0) + hp.over / hpDur;
          rec.hpSkill = g;
          if (cfg.helperDP) { gain(g, 'helper'); HV.given += g; }
          if (++HV.secIn >= hpDur) { HV.inSkill = false; HV.sp = 0; hpLane.end = t; hpLane = null; ev.push({t, who: 'h', k: 'end', n: HV.given}); }
        } else { HV.sp += spRate; if (HV.sp >= hp.sp - 1e-9) HV.ready = true; }
      }
      rec.hpIn = HV.inSkill || !!rec.hpSkill;
      if (rec.hpIn) held.clear();                       // her S2 running: whoever waited for it may go
      if (V.on && t > V.at) {
        if (V.ready) {                               // SP filled last second: the skill runs from this second
          V.ready = false; V.inSkill = true; V.secIn = 0; V.given = 0; V.casts++;
          ev.push({t, who: 'v', k: 'cast'}); lane = {t0: t, end: null}; lanes.push(lane);
        }
        if (V.inSkill) {
          const g = L.dp.every > 0 ? perSec : V.secIn === 0 ? L.dp.total : 0;
          rec.inSkill = true; rec.skill = g;
          if (g) { V.given += g; gain(g, 'skill'); }
          if (++V.secIn >= dur) {
            V.inSkill = false; V.sp = 0; V.base = 0;
            ev.push({t, who: 'v', k: 'end', n: V.given});
            if (lane) { lane.end = t; lane = null; }
            if (cfg.penalty) {                         // retreat at the skill's end: refund, a penalty layer, the timer
              const back = Math.min(Math.floor(V.paid * 0.5), ph.cost);
              gain(back, 'refund'); rec.refund = back; V.on = false; V.layers = Math.min(V.layers + 1, 2); V.readyAt = t + ph.redeploy;
              ev.push({t, who: 'v', k: 'retreat', n: back, paid: V.paid});
            }
          }
        } else {
          V.sp += spRate;
          if (V.sp >= L.sp - 1e-9) V.ready = true;
        }
      }
      // Closure before the vanguard while her switches are on (author, 2026-10-19: "closure before both of them"): the
      // stage's first deployment; nobody goes before her
      if (!cfg.closureAfter && hpOn && queue.length && queue[0].slot === hp.slot && V.deploys === 0) {
        const m = queue[0], c = m.cost;
        if (!canPay(m.slot, c, false) || !payNow(m.slot, c, false)) return;
        dp -= c; tally.spent += c; queue.shift(); deployedTeam++; landed(m);
        ev.push({t, who: 'team', k: 'deploy', slot: m.slot, n: c, base: m.cost, off: 0, boost: 0});
        HV.on = true; HV.at = t; HV.sp = hp.init; if (HV.sp >= hp.sp) HV.ready = true;
      }
      // deployments: the vanguard first (or right after the picks the search chose), then the team in order; her return
      // (RETURN on) after the team, with what is left
      const vFirst = () => { if (!canPay('v', vCost(), false) || !goNow('v', false) || !payNow('v', vCost(), false)) return false; deployV(); return true; };
      while (queue.length) {
        if (V.deploys === 0 && picked >= vAfter && !vFirst()) break;   // nobody else goes before her first deployment
        const m = queue[0], cls = V.on && clsOff && m.role === clsName ? clsOff : 0;   // Elysium on the field: Snipers -2
        const c = Math.max(0, m.cost - discount - cls);
        // the last member short of DP: retreat her when her refund covers the rest (author, 2026-10-19: "retreat
        // saileach and myrtle to reach the last member's cost"); mid-skill, the skill's remaining DP is given up
        if (!can(c) && cfg.lastRetreat && queue.length === 1 && V.on) {
          const back = Math.min(Math.floor(V.paid * 0.5), ph.cost);
          if (dp - floor + back >= c - 1e-9) {
            if (V.inSkill) { V.inSkill = false; ev.push({t, who: 'v', k: 'end', n: V.given}); if (lane) { lane.end = t; lane = null; } }
            V.ready = false; gain(back, 'refund'); rec.refund = back; rec.lastRetreat = true;
            V.on = false; V.layers = Math.min(V.layers + 1, 2); V.readyAt = t + ph.redeploy;
            ev.push({t, who: 'v', k: 'retreat', n: back, paid: V.paid, last: true});
          }
        }
        if (!canPay(m.slot, c, queue.length === 1)) break;
        if (!goNow(m.slot, queue.length === 1) || !payNow(m.slot, c, queue.length === 1)) break;   // the 12th never waits
        dp -= c; tally.spent += c; queue.shift(); deployedTeam++; landed(m);
        const b = boost(c);
        ev.push({t, who: 'team', k: 'deploy', slot: m.slot, n: c, base: m.cost, off: discount, cls, boost: b});
        if (hp && m.slot === hp.slot) { HV.on = true; HV.at = t; HV.sp = hp.init; if (HV.sp >= hp.sp) HV.ready = true; }
        discount = 0;
        if (gainNext && m.ground) { gain(gainNext, 'module'); ev.push({t, who: 'team', k: 'module', n: gainNext}); }
        gainNext = 0;
        if (!queue.length) fieldAll = t;
      }
      // her return after the team, never holding it back (deep-scan fix, author 2026-10-24: "RETURN order"): she comes back
      // when the DP left after this second's team deployments covers her cost
      if (cfg.penalty && !V.on && V.deploys > 0 && t >= V.readyAt && can(vCost()) && goNow('v', false) && payNow('v', vCost(), false)) deployV();
    };
    try {
    // (cfg.vBefore, author 2026-10-24: "what if sail before chen3 and shu?": she stays before the picks)
    if (firsts.length && !cfg.vBefore) vAfter = choose('vpos', 'v', firsts.length + (firsts.includes(cfg.team.length) ? 0 : 1));
    for (t = 1; t <= H; t++) {
      rec = {t, inSkill: false, skill: 0, refund: 0, hpSkill: 0};
      second();
      if (lean) continue;
      series.push([t, dp, tally.natural + tally.skill + tally.refund + tally.module]);
      Object.assign(rec, {dp, on: V.on, deployed: V.on && V.at === t ? V.paid : 0, sp: V.on && !V.inSkill && !rec.inSkill ? V.sp : null,
                          charged: V.on && !V.inSkill && !rec.inSkill ? V.sp - V.base : null,   // the sheet's count: SP since deployment / the last skill
                          off: !V.on && V.deploys > 0 && cfg.penalty ? Math.max(0, V.readyAt - t) : null,
                          gone: !V.on && V.deploys > 0 && !cfg.penalty,     // retreated for good
                          hpSp: hpOn && HV.on && !HV.inSkill && !rec.hpSkill && t > HV.at ? HV.sp - (HV.casts ? 0 : hp.init) : null,
                          team: ev.filter(e => e.t === t && e.who === 'team' && e.k === 'deploy')});
      secs.push(rec);
    }
    } catch (e) {
      if (e !== STOP) throw e;
      // the earliest each could still land: a pick not down yet, this second at the soonest
      let m = 0;
      const lbKey = firsts.map(sl => (m = Math.max(m, pickT[sl] ?? t)));
      const lb12 = Math.max(m, lowerBound());
      // the total's lower bound: each member not down yet lands this second at the soonest, the 12th at lb12
      const sumLb = landSum + (queue.length ? (queue.length - 1) * t + lb12 : 0);
      return {stopped: t, fieldAll: null, choices: ci, options: stopOpts, lbKey: lbKey.concat(lb12, sumLb)};
    }
    const key = firsts.map(sl => pickT[sl] ?? Infinity).concat(fieldAll ?? Infinity, fieldAll == null ? Infinity : landSum);
    return {cfg, o, log, key, pickT, vAfter, choices: ci, ph, sk, L, next, clsT, gGain, ev, series, secs, lanes, hpLanes, hpCasts: HV.casts, tally, capped, fieldAll, deployedTeam, H};
  }

  // the money at a moment: what came in and went out up to t (the step tables)
  function ledger(r, T) {
    const s = {start: r.cfg.start, natural: 0, skill: 0, refund: 0, module: 0, spent: 0};
    // re-run to T is exact and cheap enough
    const q = run({...r.cfg, horizon: T});
    Object.assign(s, q.tally);
    return {...s, left: s.start + s.natural + s.skill + s.refund + s.module + s.helper + s.boost - s.spent - s.lost};
  }
  // the exact search (author, 2026-10-24: "yep" to an exact optimizer): every answer at every choice point is tried,
  // depth first, "now" before "wait"; a branch is cut once it reaches a choice no earlier than the best 12th found;
  // a tie keeps the first found (fewer waits). Safety cap on the tries: SEARCH_CAP
  const SEARCH_CAP = 1500;
  // keys compared in order: the picks' landing times, the 12th's, then the total of all landing seconds (lower first
  // wins; a full tie is not better)
  const cmp = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; return 0; };
  function search(cfg, seed) {
    const n = (cfg.firsts || []).length + 2;
    let bestK = seed ? seed.k : Array(n).fill(Infinity), bestD = seed ? seed.d : [], nodes = 0, cut = false;
    const go = prefix => {
      if (++nodes > SEARCH_CAP) { cut = true; return; }
      const r = run({...cfg, lean: 1, decisions: prefix, stopAt: prefix.length});
      if (r.stopped == null) { if (cmp(r.key, bestK) < 0) { bestK = r.key; bestD = prefix.slice(); } return; }
      if (cmp(r.lbKey, bestK) >= 0) return;         // this branch cannot beat the best found
      // the warm start's answer first while still on its path, then the others
      const onSeed = seed && prefix.length < seed.d.length && prefix.every((a, i) => a === seed.d[i]);
      const order = [...Array(r.options).keys()];
      if (onSeed && seed.d[prefix.length] < r.options) { order.splice(order.indexOf(seed.d[prefix.length]), 1); order.unshift(seed.d[prefix.length]); }
      for (const a of order) { if (cut) break; go(prefix.concat(a)); }
    };
    go([]);
    return {decisions: bestD, k: bestK, nodes, cut};
  }
  // each vanguard's best: Closure first or after her, each with its best answers; a tie keeps Closure first
  function best(cfg) {
    const firsts = cfg.firsts || [], helperOn = cfg.helper && (cfg.helperDP || cfg.helperRefund);
    const debtOn = !!(cfg.helper && cfg.debt && !cfg.noHold);   // the debt choice exists
    if (!helperOn && !firsts.length && !debtOn) return run(cfg);
    const searching = helperOn || firsts.length || debtOn;
    let top = null, nodes = 0, cut = false;
    for (const after of helperOn ? [0, 1] : [0]) {
      const c = {...cfg, closureAfter: after};
      // warm start: the rules of thumb (she goes before the picks or after them all; she waits or not; her S2 held for
      // the next 0-5 or as the old plans did), the best as the one to beat
      let seed = null, warm = 0;
      if (searching) for (const vpos of firsts.length && !cfg.vBefore ? [0, firsts.length] : [0])
        for (const vWait of cfg.helperRefund && !cfg.noHold ? [1, 0] : [0]) for (const holdK of helperOn && !cfg.noHold ? [0, 1, 2, 3, 4, 5, 'old'] : [0])
        for (const debtWait of debtOn ? [0, 1] : [0]) {
          const w = run({...c, auto: holdK === 'old' ? {vpos, vWait, debtWait, holdOld: 1} : {vpos, vWait, debtWait, holdK}}); warm++;
          if (!seed || cmp(w.key, seed.k) < 0) seed = {k: w.key, d: w.log.map(x => x.a)};
        }
      // quick (a slider being dragged): the warm start alone; the full search when it stops
      const sr = !searching ? {decisions: [], nodes: 1, cut: false}
               : cfg.quick ? {decisions: seed.d, nodes: warm, cut: true} : search(c, seed);
      nodes += sr.nodes; cut = cut || sr.cut;
      const r = run({...c, decisions: sr.decisions});
      if (!top || cmp(r.key, top.key) < 0) top = r;
    }
    top.searched = nodes; top.searchCut = cut;
    top.plan = {after: !!top.cfg.closureAfter, closure: !!helperOn, vAfter: top.vAfter,
                waits: top.log.filter(x => x.kind === 'wait' && x.a).map(x => x.who),
                holds: top.log.filter(x => x.kind === 'hold' && x.a).length,
                holdFor: top.log.filter(x => x.kind === 'hold' && x.a).map(x => x.need)};
    return top;
  }
  return {run, best, search, ledger, DT, CAP};
})();
