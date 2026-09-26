-- Grocery store schema
create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('admin','staff');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid())
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  image_url text,
  parent_id uuid references public.categories(id) on delete cascade,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select to anon, authenticated using (true);
create policy "categories staff write" on public.categories for all to authenticated using (public.is_staff()) with check (public.is_staff());

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  brand text,
  description text,
  image_url text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select to anon, authenticated using (true);
create policy "products staff write" on public.products for all to authenticated using (public.is_staff()) with check (public.is_staff());
create index on public.products (category_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_name text not null,
  weight_value numeric,
  weight_unit text,
  price numeric(10,2) not null,
  mrp numeric(10,2),
  stock_quantity int not null default 0,
  sku text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;
create policy "variants public read" on public.product_variants for select to anon, authenticated using (true);
create policy "variants staff write" on public.product_variants for all to authenticated using (public.is_staff()) with check (public.is_staff());
create index on public.product_variants (product_id);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  address text not null,
  landmark text,
  created_at timestamptz not null default now()
);
grant select on public.customers to authenticated;
grant all on public.customers to service_role;
alter table public.customers enable row level security;
create policy "customers staff read" on public.customers for select to authenticated using (public.is_staff());
create index on public.customers (phone);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  address text not null,
  landmark text,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment_method text not null default 'cod',
  status text not null default 'Pending',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders staff read" on public.orders for select to authenticated using (public.is_staff());
create policy "orders staff update" on public.orders for update to authenticated using (public.is_staff()) with check (public.is_staff());

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  variant_id uuid,
  product_name text not null,
  brand text,
  variant_name text not null,
  quantity int not null,
  unit_price numeric(10,2) not null,
  mrp numeric(10,2),
  total_price numeric(10,2) not null
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order items staff read" on public.order_items for select to authenticated using (public.is_staff());
create index on public.order_items (order_id);

create table public.store_settings (
  id int primary key default 1,
  store_name text not null default 'Mahalaxmi General Store',
  tagline text not null default 'Your Everyday Grocery Store',
  logo_url text,
  phone text default '+91 98765 43210',
  whatsapp text default '+91 98765 43210',
  address text default 'Main Market, Rishikesh, Uttarakhand',
  opening_hours text default 'Mon - Sun, 8:00 AM - 9:30 PM',
  telegram_chat_id text,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
grant select on public.store_settings to anon, authenticated;
grant insert, update on public.store_settings to authenticated;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;
create policy "settings public read" on public.store_settings for select to anon, authenticated using (true);
create policy "settings staff write" on public.store_settings for all to authenticated using (public.is_staff()) with check (public.is_staff());
insert into public.store_settings (id) values (1) on conflict do nothing;

create or replace function public.get_order_public(p_code text, p_phone text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'order_code', o.order_code,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'address', o.address,
    'landmark', o.landmark,
    'subtotal', o.subtotal,
    'discount', o.discount,
    'total', o.total,
    'payment_method', o.payment_method,
    'status', o.status,
    'created_at', o.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'product_name', i.product_name, 'brand', i.brand, 'variant_name', i.variant_name,
        'quantity', i.quantity, 'unit_price', i.unit_price, 'total_price', i.total_price
      ) order by i.product_name) from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where upper(o.order_code) = upper(trim(p_code)) and o.customer_phone = regexp_replace(p_phone, '\D', '', 'g')
$$;

create or replace function public.place_order(
  p_name text, p_phone text, p_address text, p_landmark text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_variant record;
  v_qty int;
  v_subtotal numeric(10,2) := 0;
  v_mrp_total numeric(10,2) := 0;
  v_customer_id uuid;
  v_order_id uuid;
  v_code text;
begin
  if coalesce(trim(p_name),'') = '' then raise exception 'Please enter your name.'; end if;
  if p_phone !~ '^[0-9]{10}$' then raise exception 'Please enter a valid 10-digit phone number.'; end if;
  if coalesce(trim(p_address),'') = '' then raise exception 'Please enter your delivery address.'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Your cart is empty.'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 then raise exception 'Invalid quantity in cart.'; end if;
    select v.*, p.name as product_name, p.brand as brand, p.is_active as product_active
      into v_variant
      from public.product_variants v join public.products p on p.id = v.product_id
      where v.id = (v_item->>'variant_id')::uuid for update of v;
    if not found or not v_variant.is_available or not v_variant.product_active then
      raise exception 'Some items in your cart are no longer available. Please review your cart.';
    end if;
    if v_variant.stock_quantity < v_qty then
      raise exception '% (%) is out of stock.', v_variant.product_name, v_variant.variant_name;
    end if;
    v_subtotal := v_subtotal + v_variant.price * v_qty;
    v_mrp_total := v_mrp_total + coalesce(v_variant.mrp, v_variant.price) * v_qty;
  end loop;

  insert into public.customers (name, phone, address, landmark)
  values (trim(p_name), p_phone, trim(p_address), nullif(trim(coalesce(p_landmark,'')),''))
  returning id into v_customer_id;

  v_code := 'GR-' || to_char(now(),'YYYY') || '-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6));

  insert into public.orders (order_code, customer_id, customer_name, customer_phone, address, landmark, subtotal, discount, total)
  values (v_code, v_customer_id, trim(p_name), p_phone, trim(p_address), nullif(trim(coalesce(p_landmark,'')),''),
          v_mrp_total, v_mrp_total - v_subtotal, v_subtotal)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    select v.*, p.name as product_name, p.brand as brand
      into v_variant
      from public.product_variants v join public.products p on p.id = v.product_id
      where v.id = (v_item->>'variant_id')::uuid;

    insert into public.order_items (order_id, product_id, variant_id, product_name, brand, variant_name, quantity, unit_price, mrp, total_price)
    values (v_order_id, v_variant.product_id, v_variant.id, v_variant.product_name, v_variant.brand, v_variant.variant_name,
            v_qty, v_variant.price, v_variant.mrp, v_variant.price * v_qty);

    update public.product_variants set stock_quantity = stock_quantity - v_qty where id = v_variant.id;
  end loop;

  return public.get_order_public(v_code, p_phone);
end $$;

grant execute on function public.place_order(text,text,text,text,jsonb) to anon, authenticated, service_role;
grant execute on function public.get_order_public(text,text) to anon, authenticated, service_role;