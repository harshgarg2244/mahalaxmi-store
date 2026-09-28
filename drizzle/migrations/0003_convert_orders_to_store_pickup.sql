CREATE OR REPLACE FUNCTION public.place_order(
  p_name text, p_phone text, p_address text, p_landmark text, p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item jsonb;
  v_variant record;
  v_qty int;
  v_subtotal numeric(10,2) := 0;
  v_mrp_total numeric(10,2) := 0;
  v_customer_id uuid;
  v_order_id uuid;
  v_code text;
BEGIN
  IF coalesce(trim(p_name),'') = '' THEN RAISE EXCEPTION 'Please enter your name.'; END IF;
  IF p_phone !~ '^[0-9]{10}$' THEN RAISE EXCEPTION 'Please enter a valid 10-digit phone number.'; END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Your cart is empty.'; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::int;
    IF v_qty IS NULL OR v_qty < 1 THEN RAISE EXCEPTION 'Invalid quantity in cart.'; END IF;
    SELECT v.*, p.name AS product_name, p.brand AS brand, p.is_active AS product_active
      INTO v_variant
      FROM public.product_variants v JOIN public.products p ON p.id = v.product_id
      WHERE v.id = (v_item->>'variant_id')::uuid FOR UPDATE OF v;
    IF NOT FOUND OR NOT v_variant.is_available OR NOT v_variant.product_active THEN
      RAISE EXCEPTION 'Some items in your cart are no longer available. Please review your cart.';
    END IF;
    IF v_variant.stock_quantity < v_qty THEN
      RAISE EXCEPTION '% (%) is out of stock.', v_variant.product_name, v_variant.variant_name;
    END IF;
    v_subtotal := v_subtotal + v_variant.price * v_qty;
    v_mrp_total := v_mrp_total + coalesce(v_variant.mrp, v_variant.price) * v_qty;
  END LOOP;

  INSERT INTO public.customers (name, phone, address, landmark)
  VALUES (trim(p_name), p_phone, 'Store pickup', nullif(trim(coalesce(p_landmark,'')),''))
  RETURNING id INTO v_customer_id;

  v_code := 'GR-' || to_char(now(),'YYYY') || '-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6));

  INSERT INTO public.orders (order_code, customer_id, customer_name, customer_phone, address, landmark, subtotal, discount, total, payment_method)
  VALUES (v_code, v_customer_id, trim(p_name), p_phone, 'Store pickup', nullif(trim(coalesce(p_landmark,'')),''),
          v_mrp_total, v_mrp_total - v_subtotal, v_subtotal, 'counter')
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::int;
    SELECT v.*, p.name AS product_name, p.brand AS brand
      INTO v_variant
      FROM public.product_variants v JOIN public.products p ON p.id = v.product_id
      WHERE v.id = (v_item->>'variant_id')::uuid;

    INSERT INTO public.order_items (order_id, product_id, variant_id, product_name, brand, variant_name, quantity, unit_price, mrp, total_price)
    VALUES (v_order_id, v_variant.product_id, v_variant.id, v_variant.product_name, v_variant.brand, v_variant.variant_name,
            v_qty, v_variant.price, v_variant.mrp, v_variant.price * v_qty);

    UPDATE public.product_variants SET stock_quantity = stock_quantity - v_qty WHERE id = v_variant.id;
  END LOOP;

  RETURN public.get_order_public(v_code, p_phone);
END $$;

GRANT EXECUTE ON FUNCTION public.place_order(text,text,text,text,jsonb) TO anon, authenticated, service_role;