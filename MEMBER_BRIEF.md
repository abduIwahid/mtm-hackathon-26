# MEMBER BRIEF — explain the system like you built it

Judges draw ONE member by lot and ask two questions. Everyone must be able to explain every part: what it is for, and what breaks without it.

## The system in one breath

"The system reads a pack of messages with one small AI model, turns them into structured facts, and then does all the planning and checking in plain code — so the figures are exact, and a message that would break the plan is rejected by code, with the reason printed in the trace."

## The five parts

1. **Reading (the model — gpt-oss-20b).** It reads English and Roman Urdu messages and extracts facts as JSON: numbers, prices with dates, venue options, judging rules, costs. *Without it:* nobody can turn free-text messages — some in Roman Urdu — into reliable figures. The model is used ONLY where language needs reading.
2. **Fact base (state).** Every fact is kept with its date and source. A newer price from the same sender replaces the older one — that is how the caterer's Rs 1,200 (12 Nov) beats Rs 1,000 (20 Oct). Item names are matched flexibly, so "printing bill" corrects "printing" instead of double-counting. *Without it:* updates would start from zero or double-count corrections.
3. **Planners (plain code).** Teams = students ÷ team size. Judges needed = teams ÷ max teams per judge, rounded up (50 ÷ 3 → 17). People to feed = students + staff + judges (177). Venue = cheapest hall that fits everyone. Schedule is built to sum to exactly 240 minutes including the 15-minute prayer break. *Without code planning:* the model would be doing arithmetic — slow, expensive in tokens, and sometimes wrong.
4. **Validator (plain code).** Six checks after every run: budget, venue capacity, food quantity, judge count, schedule sum, all areas covered. A new message that would break a passing check — or that imposes too small a quantity, like 100 boxes for 177 people — is rejected, the reason is printed, and the plan stays valid. *Without it:* the plausible-but-wrong message would silently starve 77 people. This part earns the "catching the wrong message" points.
5. **Trace + UI.** Every model call is printed with its number, model, area tag, input, output and the token counts the API reported, plus the session total. The web page (`run/index.html`) shows the plan, the checks, the rejected messages and the full trace. *Without it:* nothing can be verified — and a trace that misreports anything disqualifies the team.

## Likely questions, one-line answers

- **Why only one model call for the full pack?** Language needs reading once; everything after that is arithmetic, which code does exactly and for zero tokens. Fewer tokens also score points.
- **Why a small model?** The bonus requires every call to be a small-list model; 20B reads this pack perfectly, answers in seconds, and keeps the token total lean.
- **How do you handle a message in Roman Urdu?** The model reads it directly — the Rs 1,200 price and the basic Rs 800 tier both came from the Roman Urdu WhatsApp message.
- **What if two messages disagree?** The later dated one from the same sender wins for prices and figures; if accepting a message would break a hard rule, the validator rejects it instead and says why.
- **What if the model returns nonsense?** The reply must parse as JSON; if it does not, the call is retried once and the retry is shown honestly in the trace. No fact is ever typed into the code.
- **A request like the DJ (Rs 50,000)?** It is recorded as a request — not approved by anyone — so it never enters the budget.
- **What breaks if the validator is removed?** The wrong caterer message (100 boxes) would be accepted and 77 people would get no food, with no reason recorded anywhere.
- **How do updates stay cheap?** An update makes at most 2 model calls — one to classify the message, one to extract its area's facts — and only the affected areas are recomputed, in code.
