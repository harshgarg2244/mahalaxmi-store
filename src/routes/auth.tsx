import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Owner Sign In — Mahalaxmi General Store" },
      { name: "description", content: "Store owner sign in to manage pickup orders, products and stock." },
      { property: "og:title", content: "Owner Sign In — Mahalaxmi General Store" },
      { property: "og:description", content: "Manage pickup orders, products and stock." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth` } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) { toast.success("Check your email to confirm your account, then sign in."); setMode("in"); return; }
    await supabase.rpc("claim_owner");
    nav({ to: "/admin" });
  }

  const input = "w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Store className="h-5 w-5" /></span>
          <div><h1 className="font-display text-lg font-bold">Owner {mode === "in" ? "sign in" : "sign up"}</h1>
            <p className="text-xs text-muted-foreground">Mahalaxmi General Store</p></div>
        </div>
        <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create owner account"}
        </button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-xs text-muted-foreground underline">
          {mode === "in" ? "First time? Create the owner account" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
