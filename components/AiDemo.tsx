"use client";

import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "./States";

type Status = "idle" | "loading" | "done" | "error";

export default function AiDemo() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [answer, setAnswer] = useState("");
  const [provider, setProvider] = useState("");
  const [error, setError] = useState("");

  async function run() {
    if (!prompt.trim()) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setAnswer(data.text);
      setProvider(data.provider);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold">AI demo (fallback chain wired)</h2>
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask something…"
          className="h-11 flex-1 rounded-lg border border-border px-3 outline-none focus:border-accent"
        />
        <button
          onClick={run}
          disabled={status === "loading"}
          className="h-11 rounded-lg bg-accent px-5 font-medium text-white disabled:opacity-60"
        >
          {status === "loading" ? "Thinking…" : "Ask"}
        </button>
      </div>
      {status === "idle" && (
        <EmptyState
          title="Nothing asked yet"
          line="Type a question above. Answers try Gemini first, then Groq, then OpenRouter."
        />
      )}
      {status === "loading" && <Skeleton lines={3} />}
      {status === "error" && <ErrorState message={error} onRetry={run} />}
      {status === "done" && (
        <div className="space-y-2">
          <p className="whitespace-pre-wrap leading-relaxed">{answer}</p>
          <p className="text-xs text-muted">Answered by: {provider}</p>
        </div>
      )}
    </section>
  );
}
