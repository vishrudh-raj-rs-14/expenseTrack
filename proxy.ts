export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    // Match all paths except static assets, auth routes, and PWA files
    "/((?!sign-in|api/auth|_next/static|_next/image|favicon.ico|manifest.json|icons|apple-touch-icon).*)",
  ],
};
