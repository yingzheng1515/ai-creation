import { NextResponse } from "next/server";
import { isNewCreationProject } from "@/lib/project-schema";
import { addProjectToStore, listProjects } from "@/lib/project-store";
import { applySessionCookie, AUTH_REQUIRED_MESSAGE, getVisitorSession, isAuthenticatedSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = getVisitorSession(request);
  if (!isAuthenticatedSession(session)) {
    return applySessionCookie(NextResponse.json({ error: AUTH_REQUIRED_MESSAGE }, { status: 401 }), session);
  }

  const projects = await listProjects(session.userId);

  return applySessionCookie(NextResponse.json({ projects }), session);
}

export async function POST(request: Request) {
  const session = getVisitorSession(request);
  if (!isAuthenticatedSession(session)) {
    return applySessionCookie(NextResponse.json({ error: AUTH_REQUIRED_MESSAGE }, { status: 401 }), session);
  }

  try {
    const body = await request.json();

    if (!isNewCreationProject(body)) {
      return applySessionCookie(NextResponse.json({ error: "Invalid project." }, { status: 400 }), session);
    }

    const saved = await addProjectToStore(session.userId, body);

    return applySessionCookie(NextResponse.json(saved, { status: 201 }), session);
  } catch {
    return applySessionCookie(NextResponse.json({ error: "Project save failed." }, { status: 500 }), session);
  }
}
