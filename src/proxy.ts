export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/applications/:path*", "/companies/:path*", "/analytics/:path*", "/settings/:path*"]
};
