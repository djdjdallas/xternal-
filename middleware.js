import { NextResponse } from "next/server";

export function middleware(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Twitter Poster"' },
    });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = atob(base64Credentials);
  const [user, password] = credentials.split(":");

  const validUser = process.env.ADMIN_USER;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (user !== validUser || password !== validPassword) {
    return new NextResponse("Invalid credentials", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Twitter Poster"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
