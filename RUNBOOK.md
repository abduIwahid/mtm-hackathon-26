# RUNBOOK — the day, step by step (Team AXIONS)

## Before the 1:25 PM code freeze

1. On the laptop: `git clone https://github.com/abduIwahid/mtm-hackathon-26` (or `git pull` inside it).
2. Copy `.env.example` to `.env` and paste the Groq API key (console.groq.com → API Keys).
3. Test the full flow once:
   - `python3 main.py sample_pack.txt` → plan total should be **Rs 547,400**, all six checks PASS.
   - `python3 main.py practice_change.txt` → total becomes **Rs 552,400** (printing corrected).
   - `python3 main.py practice_wrong.txt` → message **REJECTED**, reason printed, total stays 552,400.
   - Open `run/index.html` — plan, checks, rejected message, trace all visible.
4. **Delete the `run/` folder** so the test run starts from a clean state.
5. Confirm `git status` shows no changes and note `git log -1` — that hash is what gets submitted at the freeze.

## At the 1:30 PM test run

1. Download the unseen pack, save it as `pack.txt` in the repo folder.
2. Run: `python3 main.py pack.txt` — read the plan and checks out to the volunteer.
3. Open `run/index.html` and keep it on screen for the judges.
4. Each new message: save it as `msg.txt` (overwrite each time), run the SAME command: `python3 main.py msg.txt`.
5. **Prediction slip** (before one message, the volunteer asks which areas will make model calls). Our system, for any single new message:
   - Always: **1 model call tagged `reading`** (classification).
   - If the message carries a fact: **+1 model call tagged with that message's area** (e.g. `budget` for a cost change, `food` for a menu change).
   - If the message is wrong (breaks the plan): the code validator rejects it after the reading call — **no area call**.
   Write exactly that, naming the area you expect from the message's topic.
6. If a run ever errors on rate limits (HTTP 429): wait 30 seconds and run the same command again — the app also retries on its own. Nothing is lost; state is saved after every successful run.
7. At the end: the files to upload on the form are `run/plan.txt` and `run/trace.txt`.

## Rules that protect us

- Never edit code after the freeze. Never type pack facts into code (disqualification).
- The trace reports tokens exactly as the API returns them — never restate different numbers.
- All three members stay at the table during judge visits; any member may be drawn to answer.
