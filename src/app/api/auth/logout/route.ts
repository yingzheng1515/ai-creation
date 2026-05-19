import { NextResponse } from "next/server";
import { applySessionCookie, createVisitorSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = createVisitorSession(request);
  const response = NextResponse.json({
    user: {
      id: session.userId,
      label: session.label,
      isAuthenticated: false,
    },
  });

  return applySessionCookie(response, session);
}
