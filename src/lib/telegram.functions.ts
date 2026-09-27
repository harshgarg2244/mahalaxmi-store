import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function send(chatId: string, text: string) {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) return { ok: false, error: "Telegram bot token is not set up yet." };
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const body = (await res.json()) as { ok: boolean; description?: string };
  return body.ok ? { ok: true } : { ok: false, error: body.description ?? "Telegram error" };
}

type PublicOrder = {
  order_code: string; customer_name: string; customer_phone: string; address: string;
  landmark: string | null; total: number;
  items: { product_name: string; variant_name: string; quantity: number; total_price: number }[];
};

/** Called after a successful checkout. Verifies the order exists (code+phone) before notifying. */
export const notifyNewOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: z.string().max(40), phone: z.string().max(20) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const sb = publicClient();
      const { data: order } = await sb.rpc("get_order_public", { p_code: data.code, p_phone: data.phone });
      const o = order as PublicOrder | null;
      if (!o) return { ok: false };
      const { data: s } = await sb.from("store_settings").select("telegram_chat_id").eq("id", 1).single();
      if (!s?.telegram_chat_id) return { ok: false };
      const lines = o.items.map((i) => `• ${i.product_name} (${i.variant_name}) × ${i.quantity} = ₹${i.total_price}`);
      const text = `🛒 New order ${o.order_code}\n\n👤 ${o.customer_name}\n📞 ${o.customer_phone}\n📍 ${o.address}${o.landmark ? ` (near ${o.landmark})` : ""}\n\n${lines.join("\n")}\n\n💰 Total: ₹${o.total} — Cash on delivery`;
      return await send(s.telegram_chat_id, text);
    } catch (e) {
      console.error(e);
      return { ok: false };
    }
  });

export const telegramStatus = createServerFn({ method: "GET" }).handler(async () => ({
  tokenConfigured: !!process.env["TELEGRAM_BOT_TOKEN"],
}));

export const sendTelegramTest = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ chatId: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ data }) => send(data.chatId, "✅ Test message from your store. Order alerts will arrive here."));
