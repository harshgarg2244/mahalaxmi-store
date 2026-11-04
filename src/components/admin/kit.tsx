import type { ReactNode } from "react";

export const field = "w-full rounded-lg border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary";
export const fieldSm = "rounded-lg border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary";
export const btn = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60";
export const btnGhost = "inline-flex items-center justify-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-muted";

export function Panel({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="font-display text-base font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h1 className="font-display text-2xl font-bold">{children}</h1>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Pending" ? "bg-accent text-accent-foreground"
    : status === "Cancelled" ? "bg-destructive/15 text-destructive"
    : isPaidStatus(status) ? "bg-primary text-primary-foreground"
    : status === "Picked Up" ? "bg-muted text-muted-foreground"
    : "bg-primary/15 text-primary";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{status}</span>;
}

export function adminMeta(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — Store Owner` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — Store Owner` },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  };
}
