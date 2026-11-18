// AI fallback chain: Gemini -> Groq -> OpenRouter.
// One dead API never kills the demo. Each provider returns plain text.

type Result = { provider: string; text: string };

async function tryGemini(prompt: string): Promise<Result> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
  if (!text) throw new Error("Gemini empty response");
  return { provider: `gemini/${model}`, text };
}

async function openAiCompatible(
  name: string,
  url: string,
  key: string | undefined,
  model: string,
  prompt: string
): Promise<Result> {
  if (!key) throw new Error(`${name} key missing`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`${name} ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  if (!text) throw new Error(`${name} empty response`);
  return { provider: `${name}/${model}`, text };
}

export async function askAI(prompt: string): Promise<Result> {
  const attempts: Array<() => Promise<Result>> = [
    () => tryGemini(prompt),
    () =>
      openAiCompatible(
        "groq",
        "https://api.groq.com/openai/v1/chat/completions",
        process.env.GROQ_API_KEY,
        process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        prompt
      ),
    () =>
      openAiCompatible(
        "openrouter",
        "https://openrouter.ai/api/v1/chat/completions",
        process.env.OPENROUTER_API_KEY,
        process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
        prompt
      ),
  ];
  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(`All AI providers failed: ${errors.join(" · ")}`);
}
