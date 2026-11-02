# Mahalaxmi General Store — online order booking

A mobile-first web app for a local Indian kirana store. Customers browse the catalog, add items to a cart, and book a **store-pickup order** — there is no delivery and no online payment; the order is paid at the counter when collected. The store owner manages everything from a protected admin workspace.

## Features

**Customer store**
- Home, category browsing, search, product pages with size/weight variants
- Cart and checkout that collects name, phone, WhatsApp contact, address and landmark (contact details only — orders are picked up at the store)
- Order confirmation with a shareable code, plus order lookup/tracking by code + phone

**Owner workspace** (email/password sign-in; first account created becomes the owner)
- Dashboard: today's orders and sales, pending and ready-for-pickup counts, low stock
- Orders and order details: status updates (Pending → Confirmed → Packed → Ready for Pickup → Picked Up), WhatsApp/call customer
- Products, categories, sizes/variants: add products, add sizes, edit prices/MRP, toggle visibility
- Inventory: inline stock editing, on-sale flag, low-stock filter
- Customers with per-customer order history
- Settings: store details and Telegram order alerts (optional)

## Tech stack

- **React 19 + TypeScript**, built with **Vite** on **TanStack Start** (file-based routing, server functions)
- **Tailwind CSS v4** for styling, **lucide-react** icons
- **Supabase** for the database, row-level security and email/password auth (configured via `.env`, works with any Supabase project)

## Project layout

```
src/
  routes/            # one file per page (index, shop, cart, checkout, order/$code, auth, _authenticated/admin.*)
  components/store/  # storefront UI (layout, product cards, order view)
  components/admin/  # owner workspace helpers
  lib/               # cart state, store queries, server functions (order placement, Telegram)
  integrations/supabase/  # Supabase clients (browser, server, auth middleware)
supabase/            # Supabase project config
drizzle/migrations/  # database schema migrations (0000–0005)
```

## Setup with your own Supabase project

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In its **SQL Editor**, run the schema and data scripts from the `mahalaxmi-supabase-setup` folder (see `00_SETUP_GUIDE.md` there for the full walkthrough): `01_store_schema.sql` first, then `02_store_data.sql`.
3. Enable **Email** sign-in (Authentication → Providers) and turn **"Confirm email" off**.
4. Copy `.env.example` to `.env` and fill in the values from **Project Settings → API**:

   ```
   VITE_SUPABASE_URL=...        # browser-visible, protected by RLS
   VITE_SUPABASE_ANON_KEY=...
   SUPABASE_URL=...             # server-only
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...  # server-only secret, never expose
   ```

5. Install and run:

   ```sh
   npm install
   npm run dev
   ```

6. Open the app → footer → **Owner login** → create the owner account. The first account automatically becomes the owner.

## Optional: Telegram order alerts

Create a bot with [@BotFather](https://t.me/BotFather), set its token as `TELEGRAM_BOT_TOKEN` in the server environment, then enter your chat ID on the owner **Settings** page and send a test message. New orders are then pinged to your Telegram.

## Deployment

Build with `npm run build` and host anywhere that runs Vite/Node. Set the same environment variables on your host — the browser ones (`VITE_*`) are public by design; `SUPABASE_SERVICE_ROLE_KEY` and `TELEGRAM_BOT_TOKEN` must stay server-side.
