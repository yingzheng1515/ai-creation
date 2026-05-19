import { NextResponse } from "next/server";
import { readJson, requireStringField } from "@/lib/api/validation";
import { mockVideoProvider } from "@/lib/providers/mock";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const prompt = requireStringField(body, "prompt");
    const result = await mockVideoProvider.generateVideo({ prompt });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video generation failed.";
    const status = message === "Prompt is required." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
