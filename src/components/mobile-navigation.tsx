"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
export function MobileNavigation({ label, signOutAction }: { label: string; signOutAction: () => Promise<void> }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false);
  const links = [{ href: "/applications", label: "Applications", active: pathname.startsWith("/applications") && !pathname.startsWith("/applications/board") }, { href: "/applications/board", label: "Board", active: pathname.startsWith("/applications/board") }, { href: "/analytics", label: "Analytics", active: pathname.startsWith("/analytics") }];
  return <div className="mobile-navigation"><button className="mobile-menu-button" type="button" aria-label="Toggle navigation" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(current => !current)}><span /><span /><span /></button>{open ? <div className="mobile-menu panel" id="mobile-menu"><nav aria-label="Mobile navigation">{links.map(link => <Link className={link.active ? "nav-active" : undefined} href={link.href} key={link.href} aria-current={link.active ? "page" : undefined} onClick={() => setOpen(false)}>{link.label}</Link>)}</nav><div className="mobile-user"><span>{label}</span><form action={signOutAction}><button className="sign-out-button" type="submit">Sign out</button></form></div></div> : null}</div>;
}
