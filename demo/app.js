"use strict";
/* app.js - AXIONS Hackathon Planner (browser edition).
   Same design as main.py: the model only reads, planner.js plans,
   validators guard. State lives in this page only. */
const $ = s => document.querySelector(s);
const esc = s => String(s === null || s === undefined ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");
let S = null;
let PROV = [];

function newState() {
  return {facts: emptyFacts(), plan: null, rejected: [], history: [],
    calls: 0, tokens: {prompt: 0, completion: 0, total: 0},
    trace: [], diffHtml: "", seq: 0};
}
function setStatus(msg, isErr) {
  const el = $("#status");
  el.textContent = msg || "";
  el.className = "status" + (isErr ? " err" : "");
}
function note(line) { S.trace.push("[code] " + line); }
function busy(b) {
  $("#runBtn").disabled = b;
  document.querySelectorAll("[data-break], #applyBtn")
    .forEach(x => x.disabled = b);
}

async function callModel(area, prompt, maxTokens) {
  const qp = new URLSearchParams(location.search);
  const override = qp.get("base");
  const url = override
    ? override.replace(/\/$/, "") + "/chat/completions" : "/api/chat";
  const headers = { "Content-Type": "application/json" };
  if (override) headers["Authorization"] = "Bearer " + (qp.get("key") || "");
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({model: MODEL_NAME, temperature: 0,
          max_tokens: maxTokens,
          response_format: {type: "json_object"},
          messages: [{role: "user", content: prompt}]})});
    } catch (e) {
      throw new Error("Could not reach the model API (" + e.message +
        "). Check the endpoint and your connection.");
    }
    if (res.status === 429 && attempt < 3) {
      setStatus("Rate limit reached - waiting 15 seconds, then retrying…");
      await new Promise(r => setTimeout(r, 15000));
      continue;
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error("Model API returned " + res.status + ": " +
        t.slice(0, 200));
    }
    const data = await res.json();
    const content = data.choices[0].message.content || "";
    const usage = data.usage || {};
    S.calls += 1;
    S.tokens.prompt += usage.prompt_tokens || 0;
    S.tokens.completion += usage.completion_tokens || 0;
    S.tokens.total += usage.total_tokens || 0;
    S.trace.push("--- MODEL CALL #" + S.calls + " ---");
    S.trace.push("Model: " + MODEL_NAME);
    S.trace.push("Area: " + area);
    S.trace.push("Input:\n" + prompt);
    S.trace.push("Output:\n" + content);
    S.trace.push("Tokens (as reported by the API): prompt " +
      (usage.prompt_tokens || 0) + ", completion " +
      (usage.completion_tokens || 0) + ", total " +
      (usage.total_tokens || 0));
    return parseJson(content);
  }
  throw lastErr || new Error("Model call failed.");
}
function parseJson(content) {
  try { return JSON.parse(content); } catch (e) { /* fall through */ }
  const a = content.indexOf("{"), b = content.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(content.slice(a, b + 1));
  throw new Error("The model did not return valid JSON.");
}

/* ---------------- chat ---------------- */
function bubble(text, who) {
  const th = $("#chatThread");
  if (!th) return;
  const d = document.createElement("div");
  d.className = "chatmsg " + who;
  d.textContent = text;
  th.appendChild(d);
  th.scrollTop = th.scrollHeight;
  persist();
}
function agentSay(text) { bubble(text, "agent"); }
function answerQuestion(raw) {
  if (!S || !S.plan) return null;
  const t = raw.toLowerCase();
  const isQ = t.includes("?") ||
    /^(kya|kitna|kitne|konsa|kaun|what|how|why|batao|show|tell)\b/
      .test(t.trim()) || t.includes(" batao");
  if (!isQ) return null;
  const p = S.plan, f = S.facts;
  if (/^(hi|hello|salam|aoa|hey)\b/.test(t.trim()))
    return "Hello. I am the planning agent. Send me update messages " +
      "and I will apply them safely, or ask me about the budget, " +
      "venue, food, judges, schedule, checks or risks.";
  if (t.includes("risk") || t.includes("recommend") ||
      t.includes("suggest") || t.includes("masla") ||
      t.includes("issue"))
    return "Risks and recommendations:\n" + recommendations(f, p)
      .map((r, i) => (i + 1) + ". [" + r[0].toUpperCase() + "] " + r[1])
      .join("\n");
  if (t.includes("bacha") || t.includes("remaining") ||
      t.includes("budget") || t.includes("total") ||
      t.includes("cost") || t.includes("kharcha"))
    return "Budget: total Rs " + fmt(p.budget_total) + " of Rs " +
      fmt(p.budget_cap) + " - Rs " + fmt(p.budget_remaining) +
      " remaining.";
  if (t.includes("venue") || t.includes("hall"))
    return "Venue: " + (p.venue ? p.venue.name : "none") + " - seats " +
      (p.venue ? p.venue.capacity : "-") + ", Rs " +
      fmt(p.venue ? p.venue.price : null) + ".";
  if (t.includes("food") || t.includes("khana") ||
      t.includes("lunch") || t.includes("boxes"))
    return "Food: " + (p.food ? p.food.name : "none") + " - Rs " +
      fmt(p.food ? p.food.price_per_head : null) + " per person x " +
      p.people_to_feed + " people = Rs " + fmt(p.food_total) + ".";
  if (t.includes("judge"))
    return "Judging: " + p.judges_used + " judges used (" +
      p.judges_needed + " needed, " + p.judges_confirmed +
      " confirmed), " + p.judging_minutes + " minutes, honorarium Rs " +
      fmt(p.honorarium_total) + ".";
  if (t.includes("schedule") || t.includes("program") ||
      t.includes("timing"))
    return "Schedule:\n" + p.schedule.map(b => b.start + "-" + b.end +
      "  " + b.item + " (" + b.minutes + " min)").join("\n");
  if (t.includes("check") || t.includes("valid") ||
      t.includes("pass"))
    return "Checks: " + p.checks.filter(c => c.ok).length + " of 6 " +
      "pass." + (p.checks.every(c => c.ok) ? "" : " Failing: " +
      p.checks.filter(c => !c.ok).map(c => c.name).join(", ") + ".");
  if (t.includes("kitne") || t.includes("kitna") ||
      t.includes("people") || t.includes("student") ||
      t.includes("team"))
    return "Counts: " + p.students + " students, " + p.teams +
      " teams, " + p.staff + " staff, " + p.judges_used + " judges - " +
      p.people_to_feed + " people to feed in total.";
  return null;
}
async function sendChat(raw) {
  const text = raw.trim();
  if (!text) return;
  bubble(text, "user");
  if (!S || !S.plan) {
    agentSay("Run a plan first - upload the message pack above. " +
      "Then you can send me updates and questions here.");
    return;
  }
  const ans = answerQuestion(text);
  if (ans) {
    agentSay(ans);
    note("chat question answered from the plan - no model call");
    return;
  }
  await runUpdate(text);
}

/* ---------------- full run ---------------- */
async function runFull(text) {
  S = newState();
  setStatus("Reading the messages with the model…");
  const ext = await callModel("reading",
    extractionPrompt(text, S.facts, false), 6000);
  S.seq = 1;
  mergeExtraction(S.facts, ext, 1);
  note("facts merged into the fact base; planning in code");
  S.plan = buildPlan(S.facts);
  S.history.push({seq: 1, type: "Full run",
    detail: "message pack read; plan built", total: S.plan.budget_total});
  S.diffHtml = "";
  note("plan built - total Rs " + fmt(S.plan.budget_total) + "; " +
    S.plan.checks.filter(c => c.ok).length + " of 6 checks pass");
  render();
  setStatus("Plan ready. Chat with the agent, send updates, or try " +
    "to break the plan - all in the Agent chat tab.");
  const okN = S.plan.checks.filter(c => c.ok).length;
  agentSay("Plan ready - total Rs " + fmt(S.plan.budget_total) +
    " of Rs " + fmt(S.plan.budget_cap) + ", " + okN + " of 6 checks " +
    "pass. Send me update messages here, or ask about the plan.");
  const recos = recommendations(S.facts, S.plan);
  if (recos.length)
    agentSay("My recommendations:\n" + recos.map((r, i) =>
      (i + 1) + ". [" + r[0].toUpperCase() + "] " + r[1]).join("\n"));
}

/* ---------------- update run ---------------- */
function checksPassed(plan) {
  return new Set(plan.checks.filter(c => c.ok).map(c => c.name));
}
function rejectUpdate(text, reason, areas) {
  S.rejected.push({message: text, reason: reason});
  S.history.push({seq: S.seq, type: "Update rejected",
    detail: reason, total: S.plan.budget_total});
  S.diffHtml = "<div class='diffbox bad'><p><b>Update rejected - the " +
    "plan did not change.</b></p><p>" + esc(reason) + "</p></div>";
  note("update REJECTED: " + reason);
  agentSay("I kept that message out: " + reason);
}
async function runUpdate(text) {
  if (!S || !S.plan) { setStatus("Run a plan first.", true); return; }
  busy(true);
  try {
    setStatus("Reading the new message…");
    S.seq += 1;
    const cls = await callModel("reading",
      classifyPrompt(text, planSummary(S.plan)), 400);
    const kind = cls.kind || "fact";
    const areas = (cls.areas || []).filter(a => AREAS.includes(a));
    const scan = scanConflictingDirective(text, S.plan);
    if (scan) {
      const reason = evaluateDirectives([scan], S.plan);
      if (reason) { rejectUpdate(text, reason, areas); render(); return; }
    }
    if (kind === "request") {
      S.facts.requests.push({summary: cls.summary || text,
        source: null, _seq: S.seq});
      S.history.push({seq: S.seq, type: "Request noted",
        detail: (cls.summary || text) +
          " - noted, not added to the plan or the budget",
        total: S.plan.budget_total});
      S.diffHtml = "<div class='diffbox'><p><b>Request noted.</b> " +
        "It is listed under Facts &amp; messages; the plan and the " +
        "budget did not change.</p></div>";
      note("request noted, plan unchanged");
      agentSay("Noted as a request - it is not in the plan or the " +
        "budget: " + (cls.summary || text));
      render(); return;
    }
    if (kind === "irrelevant") {
      S.history.push({seq: S.seq, type: "Update ignored",
        detail: "the message changes nothing about the event",
        total: S.plan.budget_total});
      S.diffHtml = "<div class='diffbox'><p><b>Nothing to update.</b> " +
        "The message does not change any figure in the plan.</p></div>";
      note("message irrelevant, plan unchanged");
      agentSay("That message does not change anything in the plan.");
      render(); return;
    }
    const tag = areas.length ? areas[0] : "reading";
    const ext = await callModel(tag,
      extractionPrompt(text, S.facts, true), 6000);
    const candidate = structuredClone(S.facts);
    const directives = mergeExtraction(candidate, ext, S.seq);
    const plan2 = buildPlan(candidate);
    const dirReason = evaluateDirectives(directives, plan2);
    if (dirReason) { rejectUpdate(text, dirReason, areas); render(); return; }
    const before = checksPassed(S.plan);
    const broken = plan2.checks.filter(c => !c.ok && before.has(c.name));
    if (broken.length) {
      rejectUpdate(text, "the update would break a check that " +
        "currently passes (" + broken[0].name.toLowerCase() +
        ") - the plan stays as it was.", areas);
      render(); return;
    }
    const prev = S.plan;
    S.facts = candidate; S.plan = plan2;
    S.history.push({seq: S.seq, type: "Update accepted",
      detail: "recomputed areas: " + (areas.join(", ") || "none"),
      total: plan2.budget_total});
    S.diffHtml = diffHtml(prev, plan2);
    note("update accepted - new total Rs " + fmt(plan2.budget_total));
    agentSay("Done - recomputed " + (areas.join(", ") || "the plan") +
      ". Total is now Rs " + fmt(plan2.budget_total) + " (was Rs " +
      fmt(prev.budget_total) + "); " +
      plan2.checks.filter(c => c.ok).length + " of 6 checks pass.");
    render();
  } catch (e) {
    setStatus(e.message, true);
  } finally {
    busy(false);
  }
}
function diffHtml(prev, next) {
  let h = "<div class='diffbox'><p><b>What changed</b></p>";
  h += "<p>Total: <s>Rs " + fmt(prev.budget_total) + "</s> → " +
    "<span class='new'>Rs " + fmt(next.budget_total) + "</span></p>";
  const pm = {}, nm = {};
  prev.budget_lines.forEach(l => pm[l.label] = l.amount);
  next.budget_lines.forEach(l => nm[l.label] = l.amount);
  let any = false;
  for (const l of next.budget_lines) {
    if (l.label in pm && pm[l.label] !== l.amount) {
      h += "<p>" + esc(l.label) + ": <s>Rs " + fmt(pm[l.label]) +
        "</s> → <span class='new'>Rs " + fmt(l.amount) + "</span></p>";
      any = true;
    } else if (!(l.label in pm)) {
      h += "<p>Added: " + esc(l.label) + " - <span class='new'>Rs " +
        fmt(l.amount) + "</span></p>"; any = true;
    }
  }
  for (const l of prev.budget_lines)
    if (!(l.label in nm)) {
      h += "<p>Removed: " + esc(l.label) + " - <s>Rs " +
        fmt(l.amount) + "</s></p>"; any = true;
    }
  if (!any) h += "<p>No figure changed.</p>";
  return h + "</div>";
}

/* ---------------- rendering ---------------- */
function prov(title, body) {
  PROV.push({t: title, b: body});
  return " data-prov='" + (PROV.length - 1) + "'";
}
function srcText(o) {
  let s = "";
  if (o && o.source) s += "message #" + o.source;
  if (o && o.date) s += (s ? ", " : "") + o.date;
  return s || "the messages";
}
function render() {
  PROV = [];
  const p = S.plan, f = S.facts;
  const allOk = p.checks.every(c => c.ok);
  const banner = "<div class='banner" + (allOk ? "" : " bad") + "'>" +
    (allOk ? "ALL CHECKS PASS" : "SOME CHECKS FAIL") + " · Total Rs " +
    fmt(p.budget_total) + " of Rs " + fmt(p.budget_cap) + " · Rs " +
    fmt(p.budget_remaining) + " remaining</div>";
  const figStr = p.students + " students · " + p.teams + " teams · " +
    (p.venue ? p.venue.name : "-") + " · " + p.people_to_feed +
    " people to feed · Rs " + fmt(p.budget_total) + " of Rs " +
    fmt(p.budget_cap) + " · " + (allOk ? "ALL CHECKS PASS" : "CHECK FAILING");
  const marquee = "<div class='marquee'><span class='track'>" +
    esc(figStr + " · " + figStr + " · " + figStr) + "</span></div>";
  const v = p.venue || {}, fd = p.food || {};
  const chips = (v.features || []).map(x =>
    "<span class='chip'>" + esc(x) + "</span>").join("");
  const pct = p.budget_cap
    ? Math.round(100 * p.budget_total / p.budget_cap) : 0;
  const cards = "<div class='cards'>" +
    "<div class='card'><h3>VENUE</h3><p>" + esc(v.name || "NOT FOUND") +
    "</p><p>Seats " + esc(v.capacity ?? "-") + " - Rs " + fmt(v.price) +
    "</p><div class='chips'>" + chips + "</div></div>" +
    "<div class='card'><h3>FOOD</h3><p>" + esc(fd.name || "NOT FOUND") +
    "</p><p>" + p.people_to_feed + " boxes - Rs " + fmt(p.food_total) +
    "</p><p class='capnote'>Rs " + fmt(fd.price_per_head) +
    " per person</p></div>" +
    "<div class='card'><h3>JUDGING</h3><p>" + p.judges_used + " judges (" +
    p.judges_confirmed + " confirmed)</p><p>" + p.judging_minutes +
    " minutes - Rs " + fmt(p.honorarium_total) + "</p></div>" +
    "<div class='card clickable' " +
    prov("Budget total", "The total is plain addition of the budget " +
      "lines below - no model arithmetic. Click any budget line to see " +
      "where its figure came from.") +
    "><h3>BUDGET</h3><p>Rs " + fmt(p.budget_total) + " of Rs " +
    fmt(p.budget_cap) + "</p><p>Remaining: Rs " +
    fmt(p.budget_remaining) + "</p><div class='meter'><div style='width:" +
    pct + "%'></div></div><p class='capnote'>" + pct +
    "% of the budget used</p></div></div>";
  const tlCols = ["b0", "b1", "b2", "b1", "b3", "b4"];
  let timeline = "<div class='tl'>";
  p.schedule.forEach((b, i) => {
    timeline += "<div class='" + tlCols[i % tlCols.length] +
      "' style='flex:" + Math.max(b.minutes, 1) + "'>" +
      (b.minutes >= 25 ? b.minutes + " min" : "") + "</div>";
  });
  timeline += "</div><p class='legend'>" + p.schedule.map(b =>
    esc(b.item) + " (" + b.minutes + " min)").join(" · ") + "</p>";
  const schedRows = p.schedule.map(b => "<tr><td class='n'>" + b.start +
    "-" + b.end + "</td><td>" + esc(b.item) + "</td><td class='n'>" +
    b.minutes + " min</td></tr>").join("");
  const lineProv = l => {
    let body = "Figure read from " + srcText(l) + ".";
    if (l.label.startsWith("Food -") && p.food)
      body += " Amount = Rs " + fmt(p.food.price_per_head) +
        " per person × " + p.people_to_feed + " people.";
    if (l.label.startsWith("Venue -"))
      body += " The cheapest venue that fits " + p.people_to_feed +
        " people and has every required feature.";
    if (l.label.startsWith("Judge honorarium"))
      body = "Judges used = " + p.judges_used + " (teams " + p.teams +
        " ÷ max " + f.judging.max_teams_per_judge + " per judge, " +
        "rounded up). Amount = " + p.judges_used + " × Rs " +
        fmt(f.judging.honorarium_each) + " honorarium.";
    return body;
  };
  const budgetRows = p.budget_lines.map(l =>
    "<tr class='clickable'" + prov(l.label, lineProv(l)) + "><td>" +
    esc(l.label) + "</td><td class='n'>Rs " + fmt(l.amount) +
    "</td></tr>").join("");
  const checks = "<ul>" + p.checks.map(c => "<li><span class='" +
    (c.ok ? "pass" : "fail") + "'>" + (c.ok ? "PASS" : "FAIL") +
    "</span> " + esc(c.name) + " - " + esc(c.detail) + "</li>")
    .join("") + "</ul>";
  $("#view-plan").innerHTML = banner + marquee + S.diffHtml + cards +
    "<h2>Schedule</h2>" + timeline + "<table>" + schedRows + "</table>" +
    "<h2>Budget detail</h2><p class='note'>Click any line to see where " +
    "the figure came from.</p><table>" + budgetRows +
    "<tr><td><b>TOTAL</b></td><td class='n'><b>Rs " +
    fmt(p.budget_total) + "</b></td></tr></table>" +
    "<h2>Checks</h2><p class='note'>Six deterministic checks, run in " +
    "code after every build. The plan counts as valid only while all " +
    "of them pass.</p>" + checks + recoHtml();
  /* facts view */
  const led = [];
  const ev = f.event;
  const addLed = (fact, value, o) => led.push([fact, value, o]);
  addLed("Students", ev.students, null);
  addLed("Team size", ev.team_size, null);
  addLed("Event duration (minutes)", ev.duration_minutes, null);
  addLed("Budget cap", "Rs " + fmt(ev.budget_cap), null);
  addLed("Staff on site", ev.staff, null);
  for (const x of f.venue_options)
    addLed("Venue option - " + x.name,
      "seats " + x.capacity + ", Rs " + fmt(x.price), x);
  for (const x of currentFoodOptions(f))
    addLed("Food - " + x.name, "Rs " + fmt(x.price_per_head) +
      " per person", x);
  addLed("Judges confirmed", f.judging.judges_confirmed, null);
  addLed("Judge honorarium each",
    "Rs " + fmt(f.judging.honorarium_each), null);
  addLed("Max teams per judge", f.judging.max_teams_per_judge, null);
  for (const c of Object.values(f.committed))
    addLed("Committed - " + c.item, "Rs " + fmt(c.amount), c);
  for (const r of f.schedule_requirements)
    addLed("Schedule requirement - " + r.item, r.minutes + " min", r);
  const ledRows = led.map(r => "<tr class='clickable'" +
    prov(r[0], "Read from " + srcText(r[2]) + ". The planner uses the " +
      "latest dated value when a message corrects an earlier one.") +
    "><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td>" +
    esc(srcText(r[2])) + "</td></tr>").join("");
  let factsHtml = "<h2>Fact ledger</h2><p class='note'>Every figure " +
    "the plan uses, with the message it was read from. Click a row " +
    "for the detail.</p><table><tr><th>Fact</th><th>Value</th>" +
    "<th>Source</th></tr>" + ledRows + "</table>";
  if (f.requests.length)
    factsHtml += "<h2>Requests noted (not in the plan)</h2><ul>" +
      f.requests.map(r => "<li>" + esc(r.summary) + "</li>").join("") +
      "</ul>";
  if (f.other_constraints.length)
    factsHtml += "<h2>Other constraints</h2><ul>" +
      f.other_constraints.map(o => "<li><span dir='auto'>" +
        esc(o.text) + "</span></li>").join("") + "</ul>";
  $("#view-facts").innerHTML = factsHtml;
  /* updates view */
  const histRows = S.history.map(h => "<tr><td class='n'>#" + h.seq +
    "</td><td>" + esc(h.type) + "</td><td>" + esc(h.detail) +
    "</td><td class='n'>Rs " + fmt(h.total) + "</td></tr>").join("");
  let rej;
  if (S.rejected.length)
    rej = "<div class='rejbox'><h2>Rejected messages</h2>" +
      "<p class='note'>Messages that would have broken the plan, kept " +
      "out - with the reason for each.</p><ul class='rej'>" +
      S.rejected.map(r => "<li><span class='msgq' dir='auto'>\"" +
        esc(r.message) + "\"</span><br><b>Reason:</b> " + esc(r.reason) +
        "</li>").join("") + "</ul></div>";
  else
    rej = "<div class='rejbox'><h2>Rejected messages</h2>" +
      "<p class='note'>None - every message so far could be used " +
      "without breaking the plan.</p></div>";
  $("#view-updates").innerHTML =
    "<h2>Update history</h2><p class='note'>Every message that arrived " +
    "after the first run, and what it did to the plan.</p><table>" +
    histRows + "</table>" + rej;
  $("#updBadge").innerHTML = S.rejected.length
    ? "<span class='cnt'>" + S.rejected.length + "</span>" : "";
  /* trace view */
  const stats = "<p class='note'>Model calls so far: " + S.calls +
    " · Tokens (as reported by the API): prompt " + fmt(S.tokens.prompt) +
    ", completion " + fmt(S.tokens.completion) + ", total " +
    fmt(S.tokens.total) + ". Every call used " + MODEL_NAME + ".</p>";
  $("#view-trace").innerHTML = "<h2>Full trace</h2>" + stats +
    "<pre class='tracebox'>" + esc(S.trace.join("\n\n")) + "</pre>";
  $("#results").style.display = "block";
  persist();
}
function recoHtml() {
  const recos = recommendations(S.facts, S.plan);
  if (!recos.length) return "";
  return "<h2>Risks and recommendations</h2><p class='note'>Generated " +
    "in code from the plan's own figures - each item names the " +
    "problem and the lever that fixes it.</p><ul class='reco'>" +
    recos.map(r => "<li class='" + (r[0] === "risk" ? "rk" : "ad") +
      "'><b>" + (r[0] === "risk" ? "RISK" : "ADVICE") + "</b> " +
      esc(r[1]) + "</li>").join("") + "</ul>";
}

/* ---------------- wiring ---------------- */
function activateTab(name) {
  document.querySelectorAll(".tab").forEach(x =>
    x.setAttribute("aria-selected",
      x.getAttribute("data-view") === name ? "true" : "false"));
  document.querySelectorAll(".view").forEach(x =>
    x.classList.toggle("active", x.id === name));
  const label = {["view-plan"]: "Plan", ["view-facts"]: "Facts & messages",
    ["view-updates"]: "Updates", ["view-chat"]: "Agent chat",
    ["view-trace"]: "Trace"}[name];
  if (label) $("#crumbNow").textContent = label;
}
document.addEventListener("click", e => {
  const tab = e.target.closest(".tab");
  if (tab) { activateTab(tab.getAttribute("data-view")); return; }
  const brk = e.target.closest("[data-break]");
  if (brk) {
    $("#updText").value = brk.getAttribute("data-break");
    runUpdate(brk.getAttribute("data-break"));
    activateTab("view-updates");
    return;
  }
  if (e.target.closest("#applyBtn")) {
    const t = $("#updText").value.trim();
    if (t) runUpdate(t);
    return;
  }
  const pv = e.target.closest("[data-prov]");
  if (pv) {
    const d = PROV[+pv.getAttribute("data-prov")];
    if (d) {
      $("#provTitle").textContent = d.t;
      $("#provBody").textContent = d.b;
      $("#provPanel").classList.add("show");
      $("#provPanel").scrollIntoView({behavior: "smooth",
        block: "nearest"});
    }
  }
});
$("#provClose").addEventListener("click", () =>
  $("#provPanel").classList.remove("show"));
$("#burger").addEventListener("click", () =>
  $("#mainnav").classList.toggle("open"));

const dz = $("#dropzone"), fi = $("#fileInput");
dz.addEventListener("click", () => fi.click());
dz.addEventListener("dragover", e => { e.preventDefault();
  dz.classList.add("drag"); });
dz.addEventListener("dragleave", () => dz.classList.remove("drag"));
dz.addEventListener("drop", e => {
  e.preventDefault(); dz.classList.remove("drag");
  if (e.dataTransfer.files.length) readFile(e.dataTransfer.files[0]);
});
fi.addEventListener("change", () => {
  if (fi.files.length) readFile(fi.files[0]);
});
function readFile(file) {
  const r = new FileReader();
  r.onload = () => {
    $("#msgText").value = String(r.result || "");
    setStatus("Loaded " + file.name + " - press Run the planner.");
  };
  r.readAsText(file);
}
$("#runBtn").addEventListener("click", async () => {
  const text = $("#msgText").value.trim();
  if (!text) { setStatus("Upload a messages file (or paste the " +
    "messages) first.", true); return; }
  busy(true);
  try { await runFull(text); }
  catch (e) { setStatus(e.message, true); }
  finally { busy(false); }
});
$("#chatSend").addEventListener("click", () => {
  const v = $("#chatText").value;
  $("#chatText").value = "";
  sendChat(v);
});
$("#chatText").addEventListener("keydown", e => {
  if (e.key === "Enter") $("#chatSend").click();
});
/* ---------------- session persistence ----------------
   The whole session (fact base, plan, history, trace, chat) is kept
   in this browser's local storage, so when a new message arrives -
   minutes or days later - the agent still has the full context of
   the earlier runs. Nothing is sent to any server. */
const LS_KEY = "axions-planner-v1";
function persist() {
  try {
    if (!S || !S.plan) return;
    localStorage.setItem(LS_KEY, JSON.stringify({
      facts: S.facts, plan: S.plan, rejected: S.rejected,
      history: S.history, calls: S.calls, tokens: S.tokens,
      trace: S.trace, seq: S.seq,
      chat: $("#chatThread") ? $("#chatThread").innerHTML : ""}));
  } catch (e) { /* storage full or blocked - session just won't persist */ }
}
function restore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (!d.plan || !d.facts) return;
    S = {facts: d.facts, plan: d.plan, rejected: d.rejected || [],
      history: d.history || [], calls: d.calls || 0,
      tokens: d.tokens || {prompt: 0, completion: 0, total: 0},
      trace: d.trace || [], diffHtml: "", seq: d.seq || 1};
    render();
    if (d.chat) $("#chatThread").innerHTML = d.chat;
    setStatus("Previous session restored - the agent remembers the " +
      "earlier messages and runs. Send the next update in Agent " +
      "chat, or start a new plan.");
    agentSay("Welcome back - I still have the current plan (total " +
      "Rs " + fmt(S.plan.budget_total) + ") and the history of " +
      S.history.length + " run(s). Send the next message whenever " +
      "it arrives; I will read it against everything so far.");
  } catch (e) { /* corrupted saved state - start clean */ }
}
$("#resetBtn").addEventListener("click", () => {
  try { localStorage.removeItem(LS_KEY); } catch (e) {}
  S = null;
  $("#results").style.display = "none";
  $("#chatThread").innerHTML = "";
  $("#crumbNow").textContent = "New plan";
  setStatus("Session cleared. Upload a new message pack to start " +
    "a fresh plan.");
});
restore();
window.runWithText = t =>
  runFull(t).catch(e => setStatus(e.message, true));
