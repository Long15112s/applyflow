import type { Metadata } from "next";
import Link from "next/link";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserMenu } from "@/components/user-menu";
import { auth } from "@/auth";
import { signOut } from "@/auth";
import { MobileNavigation } from "@/components/mobile-navigation";
import "./globals.css";

export const metadata: Metadata = { title: { default: "ApplyFlow – Job Application Tracker", template: "%s | ApplyFlow" }, description: "Track job applications, manage your hiring pipeline and understand your job search." };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) return <html lang="de"><body><main className="auth-main">{children}</main></body></html>;

  return <html lang="de"><body><div className="app-shell">
    <aside className="sidebar">
      <Link className="brand" href="/applications"><span className="brand-mark">A</span><span>ApplyFlow</span></Link>
      <MobileNavigation label={session.user.name ?? session.user.email ?? "ApplyFlow user"} signOutAction={async () => { "use server"; await signOut({ redirectTo: "/login" }); }} />
      <SidebarNav />
      <UserMenu name={session.user.name} email={session.user.email} image={session.user.image} />
    </aside>
    <main className="main">{children}</main>
  </div></body></html>;
}
