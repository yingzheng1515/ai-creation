import { NextResponse } from "next/server";
import { AuthValidationError, createOrLoginAccount, InvalidAccessCodeError } from "@/lib/auth-store";
import { createAccountSessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isLoginBody(value: unknown): value is { accountName: string; accessCode: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "accountName" in value &&
    "accessCode" in value &&
    typeof value.accountName === "string" &&
    typeof value.accessCode === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isLoginBody(body)) {
      return NextResponse.json({ error: "请输入账号和访问码。" }, { status: 400 });
    }

    const result = await createOrLoginAccount(body.accountName, body.accessCode);
    const response = NextResponse.json(result);

    response.headers.set("set-cookie", createAccountSessionCookie(result.user.id, request));

    return response;
  } catch (error) {
    if (error instanceof AuthValidationError) {
      return NextResponse.json({ error: "请输入 2-64 位账号名和至少 6 位访问码。" }, { status: 400 });
    }

    if (error instanceof InvalidAccessCodeError) {
      return NextResponse.json({ error: "账号或访问码不正确。" }, { status: 401 });
    }

    return NextResponse.json({ error: "登录失败。" }, { status: 500 });
  }
}
