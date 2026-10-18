import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  authenticateUser,
  createSessionToken,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const username = String(body?.username || "");
    const password = String(body?.password || "");

    const user = authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid username or password.",
        },
        {
          status: 401,
        }
      );
    }

    const token = await createSessionToken(user);

    const response = NextResponse.json({
      ok: true,
      user,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        error: "Login request failed.",
      },
      {
        status: 500,
      }
    );
  }
}