# Prediction slip - ready answers (test run)

The system makes model calls in only two situations, so the prediction is
always the same shape:

- **Every new message: exactly 1 model call, area tag `reading`** (the
  routing/classify call).
- **If the message carries a fact** for an area: **+1 model call tagged
  with that area** (venue / schedule / food / judging / budget), then the
  plan is rebuilt in code.
- **If the message is wrong** (a quantity below what the event needs, or
  it would break a check): the code validator rejects it - **no area call**,
  plan unchanged, reason printed in the trace.
- **If the message is a request or irrelevant:** no area call, plan
  unchanged.

Write on the slip: "1 reading call; plus 1 call tagged <area> if the
message states a fact for that area; no area call if the validator
rejects it."
