import { NextResponse } from "next/server";
import { isNewHistoryEntry } from "@/lib/history-schema";
import { addHistoryEntryToStore, clearHistoryEntries, listHistoryEntries } from "@/lib/history-store";
import { applySessionCookie, AUTH_REQUIRED_MESSAGE, getVisitorSession, isAuthenticatedSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = getVisitorSession(request);
  if (!isAuthenticatedSession(session)) {
    return applySessionCookie(NextResponse.json({ error: AUTH_REQUIRED_MESSAGE }, { status: 401 }), session);
  }

  const entries = await listHistoryEntries(session.userId);

  return applySessionCookie(NextResponse.json({ entries }), session);
}

export async function POST(request: Request) {
  const session = getVisitorSession(request);
  if (!isAuthenticatedSession(session)) {
    return applySessionCookie(NextResponse.json({ error: AUTH_REQUIRED_MESSAGE }, { status: 401 }), session);
  }

  try {
    const body = await request.json();

    if (!isNewHistoryEntry(body)) {
      return applySessionCookie(NextResponse.json({ error: "Invalid history entry." }, { status: 400 }), session);
    }

    const saved = await addHistoryEntryToStore(session.userId, body);

    return applySessionCookie(NextResponse.json(saved, { status: 201 }), session);
  } catch {
    return applySessionCookie(NextResponse.json({ error: "History save failed." }, { status: 500 }), session);
  }
}

export async function DELETE(request: Request) {
  const session = getVisitorSession(request);
  if (!isAuthenticatedSession(session)) {
    return applySessionCookie(NextResponse.json({ error: AUTH_REQUIRED_MESSAGE }, { status: 401 }), session);
  }

  await clearHistoryEntries(session.userId);

  return applySessionCookie(NextResponse.json({ entries: [] }), session);
}
