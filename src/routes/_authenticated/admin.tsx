import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, ClipboardList, LayoutDashboard, LogOut, Package, Settings, Store, Tags, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", Icon: LayoutDashboard },
  { to: "/admin/orders", label: "Orders", Icon: ClipboardList },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/categories", label: "Categories", Icon: Tags },
  { to: "/admin/inventory", label: "Stock", Icon: Boxes },
  { to: "/admin/customers", label: "Customers", Icon: Users },
  { to: "/admin/settings", label: "Settings", Icon: Settings },
] as const;

function AdminLayout() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: isStaff, isLoading } = useQuery({
    queryKey: ["is-staff"],
    queryFn: async () => {
      await supabase.rpc("claim_owner");
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id);
      return (data ?? []).length > 0;
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    qc.clear();
    nav({ to: "/auth" });
  }

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!isStaff)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="font-display text-xl font-bold">No owner access</h1>
        <p className="max-w-sm text-sm text-muted-foreground">This account isn't the store owner. Sign in with the owner account.</p>
        <button onClick={signOut} className="rounded-lg border px-3 py-2 text-sm">Sign out</button>
      </div>
    );

  return (
    <div className="min-h-screen bg-muted pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Store className="h-4 w-4" /></span>
          <span className="font-display font-bold">Owner workspace</span>
          <Link to="/" className="ml-auto text-sm text-muted-foreground hover:text-foreground">View store</Link>
          <button onClick={signOut} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map(({ to, label, Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/admin" }}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              activeProps={{ className: "bg-primary/10 font-semibold text-primary" }}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6"><Outlet /></main>
    </div>
  );
}
