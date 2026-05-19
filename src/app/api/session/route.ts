import { NextResponse } from "next/server";
import { applySessionCookie, getVisitorSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = getVisitorSession(request);
  const response = NextResponse.json({
    user: {
      id: session.userId,
      label: session.label,
    },
  });

  return applySessionCookie(response, session);
}
