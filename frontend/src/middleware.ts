import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const actionId = request.headers.get("next-action");
  if (actionId !== null && actionId.length !== 42) {
    return new NextResponse("Invalid Server Action request.", { status: 400 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
