import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  const isPublicRoute = pathname === "/login" || pathname.startsWith("/api/auth");

  if (isPublicRoute) {
    // Redirect authenticated users away from /login to the app
    if (isLoggedIn && pathname === "/login") {
      return Response.redirect(new URL("/", req.url));
    }
    return;
  }

  // Protect all other routes
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
