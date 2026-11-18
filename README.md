# MTM Hackathon '26 — Team AXIONS

**Event:** MTM Hackathon '26 (Mind-to-Machine), GDG On Campus CUI Wah — Wednesday 18 November 2026.
**Team:** AXIONS — GDG On Campus CUI Attock. Lead + presenter: Abdul Wahid.

## The task

Build an agent system that reads a pack of messages (emails, WhatsApp texts, notices — English, Urdu script and Roman Urdu; some irrelevant, some out of date) and plans a 4-hour physical hackathon across five areas: **venue, schedule, food, judging, budget**. At judging, the system runs on an unseen pack with different numbers, wording and senders.

## How it works

```
python3 main.py <messages.txt>
```

One command for everything. The first run (no `run/state.json`) treats the file as the full message pack. Later runs treat the file as new message(s) and update the existing plan. No flags, no hints, no facts typed into the code.

**Design — the model reads, the code decides:**

1. **Reading (model).** One extraction call turns the raw message text into structured facts (JSON): event numbers, venue options, food prices with dates, judging rules, committed costs, schedule requirements, requests, and directives (numbers a message tries to impose on the plan).
2. **Fact base.** Facts are stored with their dates and arrival order. A later price from the same sender supersedes the earlier one; item names are matched flexibly so a correction ("printing bill Rs 15,000") replaces the original entry instead of double-counting.
3. **Planning (plain code).** Teams, judges needed, people to feed, venue choice (cheapest that fits everyone and any stated requirement), food choice (standard offering first, cheaper tier only if the budget demands it), a schedule that sums exactly to the event length with every required break, and a full budget. Arithmetic is code, so figures are exact.
4. **Validation (plain code).** Six checks: budget within cap, venue fits, enough food, enough judges, schedule valid, all areas covered. On an update, if a message would break a check that previously passed — or imposes a quantity below a hard requirement (e.g. 100 food boxes for 177 people) — the message is **rejected**, the plan stays valid, and the reason is printed in the trace and shown in the UI.
5. **Trace.** Every model call is printed: number, model name, one area tag, full input, full output, and the token counts exactly as the API reports them, ending with the session total. Code steps are marked `[code]` and are never counted as model calls.

**Model:** `openai/gpt-oss-20b` via Groq for every call — a small model, chosen for the small-model bonus, speed (full run ≈ 5 seconds against a 2-minute limit) and a lean token count. Updates use at most 2 model calls (limit: 5).

## Tests

Offline regression suite (stub model, no network, no API key): `python3 run_tests.py` - unit tests for the deterministic defences (quantities in digits, words and Urdu digits; date parsing; fuzzy item matching) plus end-to-end runs: sample pack, budget change, the same change twice (no double-count), and the plausible-but-wrong message (rejected, plan unchanged). 23 checks.

## Run it

1. Python 3 only — no packages to install (standard library only).
2. Copy `.env.example` to `.env`, paste a Groq API key.
3. `python3 main.py sample_pack.txt` — builds the plan from the sample pack.
4. `python3 main.py practice_change.txt` — a budget update.
5. `python3 main.py practice_wrong.txt` — the plausible-but-wrong message; watch it get rejected.
6. Outputs land in `run/`: `plan.txt`, `trace.txt` (full session trace), `index.html` (the UI: plan, checks, trace, rejected messages). Delete `run/` to start fresh.

## Files

- `main.py` — the whole system (transport, extraction, fact base, planners, validator, trace, UI).
- `sample_pack.txt` — the 8 sample messages from the brief.
- `practice_change.txt`, `practice_wrong.txt` — the brief's two practice updates.
- `RUNBOOK.md` — the step-by-step for the day (freeze, test run, submission).
- `MEMBER_BRIEF.md` — how each member explains the system to the judges.
- `brain/` — the living project brain.

## License

MIT — see `LICENSE`.
