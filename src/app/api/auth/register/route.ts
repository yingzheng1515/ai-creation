import { NextResponse } from "next/server";
import { AccountAlreadyExistsError, AuthValidationError, registerAccount } from "@/lib/auth-store";
import { createAccountSessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRegisterBody(value: unknown): value is { accountName: string; accessCode: string } {
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

    if (!isRegisterBody(body)) {
      return NextResponse.json({ error: "请输入账号和访问码。" }, { status: 400 });
    }

    const result = await registerAccount(body.accountName, body.accessCode);
    const response = NextResponse.json(result, { status: 201 });

    response.headers.set("set-cookie", createAccountSessionCookie(result.user.id, request));

    return response;
  } catch (error) {
    if (error instanceof AuthValidationError) {
      return NextResponse.json({ error: "请输入 2-64 位账号名和至少 6 位访问码。" }, { status: 400 });
    }

    if (error instanceof AccountAlreadyExistsError) {
      return NextResponse.json({ error: "账号已存在，请直接登录。" }, { status: 409 });
    }

    return NextResponse.json({ error: "注册失败。" }, { status: 500 });
  }
}
