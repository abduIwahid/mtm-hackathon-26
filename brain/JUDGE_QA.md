# Judge Q&A

Full answers live in MEMBER_BRIEF.md (repo root). Core lines:

- Model reads language -> JSON facts; code does arithmetic + validation, so figures are exact.
- Supersession: latest dated fact from the same sender wins (Rs 1,200 on 12 Nov beats Rs 1,000 on 20 Oct).
- Wrong message: validator rejects quantities below hard requirements (100 boxes < 177 people) and any update that would break a passing check; reason printed in the trace; plan untouched.
- Requests (DJ) are recorded, never budgeted - nobody approved them.
- Tokens: reported per call exactly as the API returns them; session total at the end of the trace.
- Why so few calls: tokens are scored; one reading call + code is the leanest correct design.
