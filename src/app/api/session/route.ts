import { NextResponse } from "next/server";
import { applySessionCookie, getVisitorSession } from "@/lib/session";
import { getAccountById } from "@/lib/auth-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = getVisitorSession(request);
  const account = session.isAuthenticated ? await getAccountById(session.userId) : null;
  const user = account ?? {
    id: session.userId,
    label: session.label,
    isAuthenticated: false,
  };
  const response = NextResponse.json({
    user,
  });

  return applySessionCookie(response, session);
}
