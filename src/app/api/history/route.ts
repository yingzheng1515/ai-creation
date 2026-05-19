import { NextResponse } from "next/server";
import { isNewHistoryEntry } from "@/lib/history-schema";
import { addHistoryEntryToStore, clearHistoryEntries, listHistoryEntries } from "@/lib/history-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await listHistoryEntries();

  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isNewHistoryEntry(body)) {
      return NextResponse.json({ error: "Invalid history entry." }, { status: 400 });
    }

    const saved = await addHistoryEntryToStore(body);

    return NextResponse.json(saved, { status: 201 });
  } catch {
    return NextResponse.json({ error: "History save failed." }, { status: 500 });
  }
}

export async function DELETE() {
  await clearHistoryEntries();

  return NextResponse.json({ entries: [] });
}
