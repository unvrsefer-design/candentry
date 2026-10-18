import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();

  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const user = await verifySessionToken(token);

  if (!user) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      user,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}