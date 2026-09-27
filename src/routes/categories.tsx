import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQuery } from "@/lib/store";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All Categories — Mahalaxmi General Store" },
      { name: "description", content: "Browse rice, daal, atta, masala, snacks, personal care, pooja items, stationery and more." },
      { property: "og:title", content: "All Categories — Mahalaxmi General Store" },
      { property: "og:description", content: "Everything a kirana store stocks, organised by category." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQuery),
  component: Categories,
});

function Categories() {
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const top = cats.filter((c) => !c.parent_id);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">All categories</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((c) => {
          const subs = cats.filter((s) => s.parent_id === c.id);
          return (
            <div key={c.id} className="rounded-2xl border bg-card p-4">
              <Link to="/shop" search={{ q: "", cat: c.slug }} className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl">{c.icon}</span>
                <span className="font-display text-lg font-bold">{c.name}</span>
              </Link>
              {subs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {subs.map((s) => (
                    <Link key={s.id} to="/shop" search={{ q: "", cat: s.slug }} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium hover:bg-secondary">
                      {s.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
