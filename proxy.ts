export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    // Match all paths except:
    "/((?!sign-in|api/auth|_next/static|_next/image|favicon.ico|manifest.json|icons).*)",
  ],
};
