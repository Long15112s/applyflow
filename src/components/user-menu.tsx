import { signOut } from "@/auth";

type UserMenuProps = { name?: string | null; email?: string | null; image?: string | null };

export function UserMenu({ name, email, image }: UserMenuProps) {
  const label = name ?? email ?? "ApplyFlow user";
  return <div className="user-menu">
    <div className="user-identity">
      {image ? <img className="user-avatar" src={image} alt="" referrerPolicy="no-referrer" /> : <span className="user-avatar user-initial">{label.slice(0, 1).toUpperCase()}</span>}
      <div><strong>{label}</strong>{name && email ? <span>{email}</span> : null}</div>
    </div>
    <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
      <button className="sign-out-button" type="submit">Sign out</button>
    </form>
  </div>;
}
