import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (session?.user) redirect("/applications");
  const { error } = await searchParams;

  return <div className="login-page">
    <section className="login-card panel">
      <div className="login-brand"><span className="brand-mark">A</span><strong>ApplyFlow</strong></div>
      <div><span className="eyebrow">Welcome</span><h1>Your job search,<br />under control.</h1><p>Sign in to access your private application pipeline.</p></div>
      {error ? <p className="form-error" role="alert">Sign-in failed. Please try again.</p> : null}
      <form action={async () => { "use server"; await signIn("github", { redirectTo: "/applications" }); }}>
        <button className="button button-primary login-button" type="submit">Continue with GitHub</button>
      </form>
    </section>
  </div>;
}
