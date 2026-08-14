"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNav() {
  const pathname = usePathname();
  const boardActive = pathname.startsWith("/applications/board");
  const applicationsActive = pathname.startsWith("/applications") && !boardActive;
  const analyticsActive = pathname.startsWith("/analytics");

  return <nav className="nav">
    <Link className={applicationsActive ? "nav-active" : undefined} href="/applications" aria-current={applicationsActive ? "page" : undefined}>Applications</Link>
    <Link className={boardActive ? "nav-active" : undefined} href="/applications/board" aria-current={boardActive ? "page" : undefined}>Board</Link>
    <Link className={analyticsActive ? "nav-active" : undefined} href="/analytics" aria-current={analyticsActive ? "page" : undefined}>Analytics</Link>
  </nav>;
}
