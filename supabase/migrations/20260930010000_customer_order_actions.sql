-- Lets a signed-in customer cancel their own order or edit its delivery
-- details -- neither was possible before this: orders' RLS update policy
-- only lets admins pass (see 20260922000000_paymongo_payments.sql), and the
-- column-level grant to `authenticated` only covers status/courier_name/
-- tracking_number (fulfilment fields an admin sets), not the shipping
-- columns at all. Both actions go through SECURITY DEFINER functions,
-- matching every other sensitive write in this project (record_payment_result,
-- adjust_stock, mark_cod_collected) rather than widening the table grant --
-- the function checks ownership and the order's current status itself, so a
-- customer can never touch a row that isn't theirs or a status that's moved
-- past pending/confirmed.

create or replace function public.cancel_own_order(p_order_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ord public.orders%rowtype;
begin
  select * into ord from public.orders where id = p_order_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'Order not found.';
  end if;

  if ord.status not in ('pending', 'confirmed') then
    raise exception 'This order can no longer be cancelled -- it''s already being prepared.';
  end if;

  -- Fires trg_restock_on_order_failure (20260930000000_atomic_stock.sql),
  -- which gives the reserved stock back automatically.
  update public.orders set status = 'cancelled' where id = ord.id;
end;
$$;

revoke all on function public.cancel_own_order(bigint) from public, anon;
grant execute on function public.cancel_own_order(bigint) to authenticated;

create or replace function public.update_own_order_address(
  p_order_id bigint,
  p_full_name text,
  p_phone text,
  p_address_line1 text,
  p_address_line2 text,
  p_city text,
  p_province text,
  p_postal_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ord public.orders%rowtype;
  v_full_name text := left(trim(coalesce(p_full_name, '')), 120);
  v_phone text := left(trim(coalesce(p_phone, '')), 30);
  v_line1 text := left(trim(coalesce(p_address_line1, '')), 200);
  v_line2 text := left(trim(coalesce(p_address_line2, '')), 200);
  v_city text := left(trim(coalesce(p_city, '')), 100);
  v_province text := left(trim(coalesce(p_province, '')), 100);
  v_postal text := left(trim(coalesce(p_postal_code, '')), 12);
begin
  select * into ord from public.orders where id = p_order_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'Order not found.';
  end if;

  if ord.status not in ('pending', 'confirmed') then
    raise exception 'This order has already moved to fulfilment -- contact us to change the address.';
  end if;

  if v_full_name = '' or v_line1 = '' or v_city = '' or v_province = '' or v_postal = '' then
    raise exception 'Please complete your delivery information.';
  end if;
  if v_phone !~ '^[0-9+()\-\s]{7,20}$' then
    raise exception 'Please enter a valid phone number.';
  end if;

  update public.orders set
    full_name = v_full_name,
    phone = v_phone,
    address_line1 = v_line1,
    address_line2 = v_line2,
    city = v_city,
    province = v_province,
    postal_code = v_postal
  where id = ord.id;
end;
$$;

revoke all on function public.update_own_order_address(bigint, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.update_own_order_address(bigint, text, text, text, text, text, text, text) to authenticated;
