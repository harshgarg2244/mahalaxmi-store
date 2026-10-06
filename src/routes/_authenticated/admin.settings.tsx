import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery } from "@/lib/store";
import { sendTelegramTest, telegramStatus } from "@/lib/telegram.functions";
import { PageTitle, Panel, adminMeta, btn, btnGhost, field } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => adminMeta("Settings", "Store details, WhatsApp number and Telegram order alerts."),
  component: SettingsPage,
});

const FIELDS = [
  ["store_name", "Store name"], ["tagline", "Tagline"], ["phone", "Phone"], ["whatsapp", "WhatsApp number"],
  ["address", "Store address (for pickup)"], ["opening_hours", "Opening hours"], ["telegram_chat_id", "Telegram chat ID"],
] as const;
type Key = (typeof FIELDS)[number][0];

function SettingsPage() {
  const qc = useQueryClient();
  const { data: s } = useQuery(settingsQuery);
  const { data: tg } = useQuery({ queryKey: ["tg-status"], queryFn: () => telegramStatus() });
  const [form, setForm] = useState<Record<Key, string>>({} as Record<Key, string>);
  useEffect(() => {
    if (s) setForm(Object.fromEntries(FIELDS.map(([k]) => [k, (s[k] as string | null) ?? ""])) as Record<Key, string>);
  }, [s]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const patch = Object.fromEntries(FIELDS.map(([k]) => [k, form[k]?.trim() || null]));
    if (!patch["store_name"]) { toast.error("Store name is required"); return; }
    const { error } = await supabase.from("store_settings").update(patch as never).eq("id", 1);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }
  async function test() {
    if (!form.telegram_chat_id) { toast.error("Enter a Telegram chat ID first"); return; }
    const r = await sendTelegramTest({ data: { chatId: form.telegram_chat_id } });
    if (r.ok) toast.success("Test message sent"); else toast.error(r.error ?? "Could not send");
  }

  return (
    <div className="space-y-4">
      <PageTitle>Settings</PageTitle>
      <Panel title="Store details">
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map(([k, label]) => (
            <label key={k} className="text-sm"><span className="mb-1 block font-medium">{label}</span>
              <input className={field} value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
          ))}
          <div className="sm:col-span-2"><button className={btn}>Save settings</button></div>
        </form>
      </Panel>
      <Panel title="Telegram order alerts">
        <p className="text-sm">Bot connection: {tg?.tokenConfigured ? <b className="text-primary">Connected</b> : <b className="text-destructive">Not set up yet</b>}</p>
        <p className="mt-1 text-sm text-muted-foreground">Every new booking is sent to the chat ID above. Save it, then send a test.</p>
        <button onClick={test} className={`${btnGhost} mt-3`}>Send test message</button>
      </Panel>
    </div>
  );
}
