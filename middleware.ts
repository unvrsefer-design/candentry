import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");

  const USERNAME = "demo";
  const PASSWORD = "candentry123";

  if (auth) {
    const base64 = auth.split(" ")[1];
    const [user, pass] = atob(base64).split(":");

    if (user === USERNAME && pass === PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};