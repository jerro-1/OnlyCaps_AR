-- Stock was never actually written to anywhere: checkout only READ the
-- product's stock to check there was enough, then never subtracted it.
-- Inventory numbers never went down when an order was placed, and two
-- concurrent checkouts could both read the same "1 left" and both succeed --
-- a genuine oversell race, since nothing locked the row in between.
--
-- Fix: one function that both sells (negative delta) and restocks (positive
-- delta) a single product/size, using `select ... for update` to lock that
-- product's row first. Concurrent calls for the same product now queue up
-- instead of racing, and a call that would take stock negative is rejected.

alter table public.orders
  add column if not exists stock_deducted boolean not null default false;

comment on column public.orders.stock_deducted is
  'True once checkout has atomically subtracted this order''s items from product stock. '
  'Guards the restock trigger below against double-crediting stock back if an order is '
  'moved into cancelled/failed more than once.';

create or replace function public.adjust_stock(p_identifier text, p_size text, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  prod public.products%rowtype;
  has_sizes boolean;
  current_qty integer;
  new_qty integer;
begin
  -- p_identifier matches either the human product code (product_id) or the
  -- numeric primary key, same as the checkout function already accepts from
  -- the cart -- `for update` locks this one row so a concurrent call for the
  -- same product waits instead of reading a stale quantity.
  select * into prod
  from public.products
  where product_id = p_identifier or id::text = p_identifier
  order by (product_id = p_identifier) desc
  limit 1
  for update;

  if not found then
    raise exception 'Product % not found', p_identifier;
  end if;

  has_sizes := prod.sizes_stock is not null and prod.sizes_stock <> '{}'::jsonb;

  if has_sizes then
    current_qty := coalesce((prod.sizes_stock ->> p_size)::integer, 0);
    new_qty := current_qty + p_delta;
    if new_qty < 0 then
      raise exception '% (%) doesn''t have enough stock left.', coalesce(prod.full_name, prod.name), p_size;
    end if;
    update public.products
    set sizes_stock = jsonb_set(sizes_stock, array[p_size], to_jsonb(new_qty))
    where id = prod.id;
  else
    current_qty := coalesce(prod.stock_quantity, 0);
    new_qty := current_qty + p_delta;
    if new_qty < 0 then
      raise exception '% doesn''t have enough stock left.', coalesce(prod.full_name, prod.name);
    end if;
    update public.products set stock_quantity = new_qty where id = prod.id;
  end if;
end;
$$;

revoke all on function public.adjust_stock(text, text, integer) from public, anon, authenticated;
grant execute on function public.adjust_stock(text, text, integer) to service_role;

-- Give stock back automatically when an order is cancelled or its payment
-- fails -- but only once per order (stock_deducted guards a double restock
-- if the row later flips between these states more than once).
create or replace function public.restock_on_order_failure()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  if old.stock_deducted
     and ((new.status = 'cancelled' and old.status is distinct from 'cancelled')
       or (new.payment_status = 'failed' and old.payment_status is distinct from 'failed')) then
    for item in select product_id, size, quantity from public.order_items where order_id = new.id loop
      perform public.adjust_stock(item.product_id, item.size, item.quantity);
    end loop;
    new.stock_deducted := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_restock_on_order_failure on public.orders;
create trigger trg_restock_on_order_failure
before update on public.orders
for each row
execute function public.restock_on_order_failure();
