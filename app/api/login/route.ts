import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  buildAuthCookieValue,
  getDemoCredentials,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body?.username || "");
    const password = String(body?.password || "");

    const creds = getDemoCredentials();

    if (username !== creds.username || password !== creds.password) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });

    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: buildAuthCookieValue(username),
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Login request failed." },
      { status: 500 }
    );
  }
}