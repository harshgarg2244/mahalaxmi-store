import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Owner Sign In — Mahalaxmi General Store" },
      {
        name: "description",
        content: "Authorized store owner sign in.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.session) {
        toast.error("Unable to establish a login session.");
        return;
      }

      const { data: isOwner, error: ownerError } =
        await supabase.rpc("claim_owner");

      if (ownerError || isOwner !== true) {
        await supabase.auth.signOut();
        toast.error("This account is not authorized to access the owner dashboard.");
        return;
      }

      toast.success("Welcome to Mahalaxmi Store!");
      await nav({ to: "/admin" });
    } catch {
      await supabase.auth.signOut();
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </span>

          <div>
            <h1 className="font-display text-lg font-bold">
              Owner Sign In
            </h1>
            <p className="text-xs text-muted-foreground">
              Mahalaxmi General Store
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="owner-email" className="text-sm font-medium">
            Owner Email
          </label>
          <input
            id="owner-email"
            className={input}
            type="email"
            autoComplete="username"
            required
            placeholder="Enter owner email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="owner-password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="owner-password"
            className={input}
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Please wait..." : "Sign In"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Authorized store owners only.
        </p>
      </form>
    </div>
  );
}