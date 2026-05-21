import { NextResponse } from "next/server";
import { readJson, requireStringField } from "@/lib/api/validation";
import { getProviders } from "@/lib/providers";
import { persistGeneratedAsset } from "@/lib/storage/assets";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const prompt = requireStringField(body, "prompt");
    const result = await getProviders().video.generateVideo({ prompt });
    const persistedResult = await persistGeneratedAsset(result);

    return NextResponse.json(persistedResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video generation failed.";
    const status = message === "Prompt is required." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
