-- PayMongo payments + payment hardening
--
-- Goals
--   1. Every online payment is recorded in `payments` and can only be marked paid
--      by the server (PayMongo webhook / verified sync), never by the browser.
--   2. Browsers can no longer create orders directly (price, total and
--      payment_status were fully client-controlled). Orders are created by the
--      `checkout` edge function using prices read from the products table.
--   3. Customers can no longer promote themselves to admin.
--   4. The admin dashboard reads `payments` and updates live via Realtime.

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id bigint not null references public.orders(id),
  user_id uuid references public.profiles(id),
  provider text not null default 'paymongo' check (provider in ('paymongo', 'cod')),
  method text not null check (method in ('gcash', 'card', 'cod')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'PHP',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded', 'flagged')),
  paymongo_checkout_session_id text unique,
  paymongo_payment_intent_id text unique,
  paymongo_payment_id text unique,
  card_brand text,
  card_last4 text,
  failure_reason text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_status_created_idx on public.payments (status, created_at desc);

alter table public.payments enable row level security;

-- Read-only from the browser: admins see everything, customers see their own.
create policy payments_select on public.payments
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke insert, update, delete on public.payments from anon, authenticated;

-- ---------------------------------------------------------------------------
-- payment_events: webhook audit trail + idempotency (server-only, no policies)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null default false,
  summary jsonb,
  received_at timestamptz not null default now()
);

alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Orders: browsers may no longer insert, and may only update fulfilment fields
-- (and only admins pass the existing row-level policy for that).
-- ---------------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('unpaid', 'paid', 'failed', 'refunded'));

drop policy if exists "Users can insert their own orders" on public.orders;
drop policy if exists orders_insert_own on public.orders;
drop policy if exists "Users can insert order items for their orders" on public.order_items;
drop policy if exists order_items_insert_own on public.order_items;

revoke insert, update on public.orders from anon, authenticated;
revoke insert, update on public.order_items from anon, authenticated;
grant update (status, courier_name, tracking_number) on public.orders to authenticated;

-- ---------------------------------------------------------------------------
-- Privilege escalation fix: a user could set their own profiles.role = 'admin'
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Server-side contexts (service role, SQL editor) have no auth.uid(); admins may edit roles.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'customer';
  elsif new.role is distinct from old.role then
    raise exception 'You cannot change your own role' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role
  before insert or update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------------------------------------------------------------------------
-- record_payment_result: the ONLY way a payment becomes paid/failed/refunded.
-- Atomic + idempotent. Callable by the service role only (edge functions).
-- ---------------------------------------------------------------------------
create or replace function public.record_payment_result(
  p_ref text,                         -- PayMongo checkout session id (cs_...) or payment intent id (pi_...)
  p_outcome text,                     -- 'paid' | 'failed' | 'refunded'
  p_paymongo_payment_id text default null,
  p_payment_intent_id text default null,
  p_amount_centavos bigint default null,
  p_card_brand text default null,
  p_card_last4 text default null,
  p_failure text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  pay public.payments%rowtype;
begin
  select * into pay
  from public.payments
  where paymongo_checkout_session_id = p_ref or paymongo_payment_intent_id = p_ref
  order by created_at desc
  limit 1
  for update;

  if not found then
    return 'unknown_reference';
  end if;

  if p_outcome = 'paid' then
    if pay.status = 'paid' then
      return 'already_paid';
    end if;

    -- Never trust an amount that differs from what we asked PayMongo to charge.
    if p_amount_centavos is null or p_amount_centavos <> round(pay.amount * 100) then
      update public.payments
      set status = 'flagged',
          failure_reason = 'Amount mismatch: expected ' || round(pay.amount * 100)
                           || ' centavos, got ' || coalesce(p_amount_centavos::text, 'none'),
          updated_at = now()
      where id = pay.id;
      return 'flagged';
    end if;

    update public.payments
    set status = 'paid',
        paid_at = now(),
        paymongo_payment_id = coalesce(p_paymongo_payment_id, paymongo_payment_id),
        paymongo_payment_intent_id = coalesce(paymongo_payment_intent_id, p_payment_intent_id),
        card_brand = coalesce(p_card_brand, card_brand),
        card_last4 = coalesce(p_card_last4, card_last4),
        failure_reason = null,
        updated_at = now()
    where id = pay.id;

    update public.orders
    set payment_status = 'paid',
        status = case when status = 'pending' then 'confirmed' else status end
    where id = pay.order_id;

    return 'paid';

  elsif p_outcome = 'failed' then
    if pay.status in ('paid', 'refunded') then
      return 'ignored';
    end if;
    update public.payments
    set status = 'failed', failure_reason = left(p_failure, 200), updated_at = now()
    where id = pay.id;
    update public.orders set payment_status = 'failed'
    where id = pay.order_id and payment_status <> 'paid';
    return 'failed';

  elsif p_outcome = 'refunded' then
    update public.payments
    set status = 'refunded', updated_at = now()
    where id = pay.id;
    update public.orders set payment_status = 'refunded' where id = pay.order_id;
    return 'refunded';
  end if;

  raise exception 'Unknown outcome %', p_outcome;
end;
$$;

revoke all on function public.record_payment_result(text, text, text, text, bigint, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_payment_result(text, text, text, text, bigint, text, text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- mark_cod_collected: an admin confirms cash was received on delivery
-- ---------------------------------------------------------------------------
create or replace function public.mark_cod_collected(p_order_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;

  update public.payments
  set status = 'paid', paid_at = now(), updated_at = now()
  where order_id = p_order_id and method = 'cod' and status = 'pending';

  if not found then
    raise exception 'No pending cash-on-delivery payment for this order';
  end if;

  update public.orders set payment_status = 'paid' where id = p_order_id;
end;
$$;

revoke all on function public.mark_cod_collected(bigint) from public, anon;
grant execute on function public.mark_cod_collected(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- Live updates for the admin dashboard
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.payments;
