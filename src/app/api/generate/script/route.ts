import { NextResponse } from "next/server";
import { readJson, requireStringField } from "@/lib/api/validation";
import { mockScriptProvider } from "@/lib/providers/mock";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const requirement = requireStringField(body, "requirement");
    const result = await mockScriptProvider.generateScript({ requirement });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Script generation failed.";
    const status = message === "Requirement is required." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
