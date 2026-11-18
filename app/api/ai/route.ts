import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 2) {
      return NextResponse.json(
        { error: "Please send a prompt with at least 2 characters." },
        { status: 400 }
      );
    }
    const result = await askAI(prompt.slice(0, 12000));
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          "The AI service is unavailable right now. Please try again in a moment.",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 }
    );
  }
}
