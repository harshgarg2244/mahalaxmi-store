import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OrderView, type PublicOrder } from "@/components/store/OrderView";

export const Route = createFileRoute("/order/$code")({
  validateSearch: (s: Record<string, unknown>) => ({
    phone: typeof s.phone === "string" ? s.phone : String(s.phone ?? ""),
    new: s.new === true || s.new === "true" ? true : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.code} — Mahalaxmi General Store` },
      { name: "description", content: "Track the status of your grocery order." },
      { property: "og:title", content: "Track your order — Mahalaxmi General Store" },
      { property: "og:description", content: "See your order status and items." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { code } = Route.useParams();
  const { phone, new: isNew } = Route.useSearch();
  const { data, isLoading } = useQuery({
    queryKey: ["order", code, phone],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_order_public", { p_code: code, p_phone: phone });
      if (error) throw error;
      return data as unknown as PublicOrder | null;
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {isNew && (
        <div className="mb-4 rounded-2xl bg-primary p-5 text-center text-primary-foreground">
          <CheckCircle2 className="mx-auto h-12 w-12" />
          <h1 className="mt-2 text-2xl font-bold">Order placed!</h1>
          <p className="opacity-90">Thank you. We'll confirm your order shortly. Save your order code to track it.</p>
        </div>
      )}
      {isLoading ? (
        <p className="text-center text-muted-foreground">Loading order…</p>
      ) : data ? (
        <OrderView o={data} />
      ) : (
        <div className="text-center">
          <p>We couldn't find that order.</p>
          <Link to="/orders" className="font-semibold text-primary">Look up an order</Link>
        </div>
      )}
      <div className="mt-6 text-center">
        <Link to="/shop" search={{ q: "", cat: "" }} className="font-semibold text-primary">Continue shopping</Link>
      </div>
    </div>
  );
}
