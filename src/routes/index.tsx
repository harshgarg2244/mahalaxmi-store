import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, MapPin, ShoppingBasket } from "lucide-react";
import { categoriesQuery, productsQuery, productIcon } from "@/lib/store";
import { ProductCard } from "@/components/store/ProductCard";
import heroImage from "@/assets/kirana-counter.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mahalaxmi General Store — Order Ahead for Pickup" },
      { name: "description", content: "Book daily groceries, daal, atta, masala and household essentials online, then collect and pay at the store." },
      { property: "og:title", content: "Mahalaxmi General Store — Order Ahead for Pickup" },
      { property: "og:description", content: "Book your groceries online and collect them from the store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(productsQuery),
    ]),
  component: Home,
});

function Home() {
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const top = cats.filter((c) => !c.parent_id);
  const featured = products.filter((p) => p.is_featured).slice(0, 12);
  const list = featured.length ? featured : products.slice(0, 12);

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="relative mt-5 min-h-[440px] overflow-hidden rounded-lg bg-foreground text-primary-foreground sm:min-h-[500px]">
        <img src={heroImage} alt="Grains, pulses and spices at Mahalaxmi General Store" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 via-foreground/70 to-transparent" />
        <div className="relative flex min-h-[440px] max-w-2xl flex-col justify-center p-6 sm:min-h-[500px] sm:p-10">
          <span className="w-fit rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
            Order ahead · Pay at the counter
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">
            Fresh groceries, packed and ready when you arrive.
          </h1>
          <p className="mt-3 text-base opacity-90 sm:text-lg">
            Book your everyday essentials online. We prepare the order for pickup at our store.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/shop" search={{ q: "", cat: "" }} className="inline-flex items-center gap-2 rounded-xl bg-card px-5 py-3 font-bold text-foreground">
              Start your order <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/categories" className="rounded-xl border-2 border-primary-foreground/40 px-5 py-3 font-bold">
              Browse Categories
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
        {[
          { Icon: ShoppingBasket, t: "Packed for pickup" },
          { Icon: MapPin, t: "Collect at the store" },
          { Icon: Clock, t: "Open daily" },
        ].map(({ Icon, t }) => (
          <div key={t} className="flex flex-col items-center gap-1 rounded-2xl border bg-card p-3 sm:flex-row sm:justify-center">
            <Icon className="h-5 w-5 text-primary" /> <span className="font-medium">{t}</span>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-bold">Shop by category</h2>
          <Link to="/categories" className="text-sm font-semibold text-primary">See all</Link>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {top.slice(0, 16).map((c) => (
            <Link key={c.id} to="/shop" search={{ q: "", cat: c.slug }} className="flex flex-col items-center gap-1 rounded-2xl bg-secondary p-2 text-center transition hover:bg-accent/60">
              <span className="text-3xl">{c.icon}</span>
              <span className="line-clamp-2 text-[11px] font-semibold leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold">Popular picks</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((p) => <ProductCard key={p.id} product={p} icon={productIcon(p, cats)} />)}
        </div>
      </section>
    </div>
  );
}
