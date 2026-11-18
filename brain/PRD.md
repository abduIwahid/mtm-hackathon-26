# PRD

Core feature: <one sentence>
Problem: <from the revealed statement, quoted>
Target users: <>
MUST: <>
SHOULD: <>
COULD: <>
Wow factor: <>
Success criteria (map to judging criteria): <>
Cut list (in order): <>

---
## MTM '26 ACTUAL PROBLEM (revealed 18 Nov 2026, brief: Hackathon_Students_Brief_Final.pdf)
Build an AGENT SYSTEM that reads a pack of ~10 messages (English + Roman Urdu, some irrelevant/outdated) and plans a 4-hour hackathon for 150 students / 50 teams across venue, schedule, food, judging, budget. Judging uses an UNSEEN pack. One command for every message; printed trace of every model call (number, model, ONE area tag, input, output, token counts, total at end); updates after new messages; conflicts rejected with reason in trace. Full run < 2 min; update < 1 min and <= 5 model calls. UI scored (plan + trace + rejected shown). FREEZE 13:25 (push + submit repo link + commit hash); test run 13:30; judges 14:30-16:30, lot-drawn member answers 2 questions. Points: Output 30, Catching wrong message 20, Understanding 20, Handling change 10, UI 10, Prediction 5, Tokens 5, Bonus +10 if EVERY call is a small-list model and all checks pass. Design: model (openai/gpt-oss-20b via Groq, small) ONLY reads/extracts; all arithmetic + validation in plain code (per the brief's own hint). Extraction verified on sample pack 18 Nov (all facts correct, DJ = request, Roman Urdu prices handled).
