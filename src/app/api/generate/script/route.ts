import { NextResponse } from "next/server";
import { readJson, requireStringField } from "@/lib/api/validation";
import { getProviders } from "@/lib/providers";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const requirement = requireStringField(body, "requirement");
    const result = await getProviders().script.generateScript({ requirement });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Script generation failed.";
    const status = message === "Requirement is required." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
