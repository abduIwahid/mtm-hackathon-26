# Build plan (as executed, 18 Nov 2026)

- [x] 10:00-10:15 Problem analysis; scoring map (Output 30 / Wrong-message 20 / Understanding 20 / Change 10 / UI 10 / Prediction 5 / Tokens 5 / small-model bonus 10)
- [x] Model verified first: openai/gpt-oss-20b extraction tested on the sample pack (all facts, Roman Urdu, DJ = request)
- [x] main.py built: transport, extraction, fact base, planners, validator, trace, HTML UI
- [x] Tested three ways: local stub transport (token plumbing), live model full run (Rs 547,400, all checks PASS, ~5s), live updates (change -> 552,400 budget-only; wrong message -> rejected with reason)
- [x] Bugs found in testing and fixed: HTML % formatting crash; Hall A/B/C name-matching collapse; phantom venue requirement from an availability statement (prompt hardened); Groq 8,000 TPM free-tier limit (max_tokens tuned + 429 backoff)
- [x] Repo: Next.js scaffold removed; system + README + RUNBOOK + MEMBER_BRIEF pushed; read-back SHAs verified
- [ ] Freeze 13:25: submit repo link + head hash; laptop test by Wadi before freeze
- [ ] 13:30 test run; 14:30-16:30 judge visits (MEMBER_BRIEF)
