# Decisions

1. **Model only reads; code plans and validates.** The brief's own hint ("a model where language needs reading, plain code where arithmetic will do") + exactness of figures + the wrong-message catch must be provable, not vibes.
2. **One small model for every call: openai/gpt-oss-20b (Groq).** Small-model bonus (+10) requires every call on the list; 20B is the laptop class. One extraction call for the full pack keeps tokens lean and the run at ~5s of a 120s limit.
3. **Updates: classify (reading) -> quantity scan -> one area extraction.** At most 2 model calls per update (limit 5); only affected areas recomputed; the prediction slip can state this exactly.
4. **Judges used = judges needed (17), not confirmed (20).** The brief's own practice note says 177 people to feed = 150 students + 10 staff + 17 judges; honorarium and food follow the needed count.
5. **Food: standard tier first.** The standard box is the default offering; the basic tier is used only if the budget cannot fit the standard plan.
6. **Standard library only.** No installs at the venue; python3 is enough. State in run/ (git-ignored) so the volunteer's git-status check stays clean.
