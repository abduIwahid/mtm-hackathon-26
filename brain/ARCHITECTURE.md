# Architecture — message-pack event planner

One Python file (`main.py`), standard library only. Pipeline:

1. **Transport** — one chat-completion call per model use (Groq, OpenAI-compatible). Retries on 429/5xx; optional params dropped on a 400; token usage taken from the API response, never estimated.
2. **Reading (model)** — extraction prompt -> strict JSON facts (event, venues, food with dates, judging, committed costs, schedule requirements, requests, directives, other constraints). Classify prompt routes each update message (kind + areas) in <=400 tokens.
3. **Fact base** (`run/state.json`) — facts merged with date/arrival supersession; `find_key` word-set-containment matching so renamed items correct rather than duplicate; food prices resolved latest-per-item at plan time.
4. **Planners (code)** — teams, judges needed, people to feed, venue (cheapest fitting + required features), food (standard tier first, economize only for the cap), schedule (exact total, required breaks, judging block from judging math), budget lines.
5. **Validator (code)** — six checks after every build; a deterministic quantity scan (number+unit vs hard requirements) plus directive evaluation and a revert-on-broken-check rule for updates. Rejections are recorded with reasons.
6. **Outputs** — stdout plan + trace; `run/plan.txt`, `run/trace.txt` (session-cumulative), `run/index.html` (UI).
