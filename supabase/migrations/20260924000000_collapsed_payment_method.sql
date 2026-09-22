-- The checkout page now collapses GCash/card/GoTyme into a single "Secure
-- Payments via PayMongo" choice (the shopper picks the specific method on
-- PayMongo's own hosted page instead), plus a separate Cash on Delivery
-- choice. A payment therefore starts life with method = 'online' and gets
-- corrected to the real channel ('gcash' or 'card') once PayMongo's webhook
-- reports which one the shopper actually used.

alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments
  add constraint payments_method_check
  check (method in ('online', 'gcash', 'card', 'cod'));

create or replace function public.record_payment_result(
  p_ref text,                         -- PayMongo checkout session id (cs_...) or payment intent id (pi_...)
  p_outcome text,                     -- 'paid' | 'failed' | 'refunded'
  p_paymongo_payment_id text default null,
  p_payment_intent_id text default null,
  p_amount_centavos bigint default null,
  p_card_brand text default null,
  p_card_last4 text default null,
  p_failure text default null,
  p_method text default null          -- the real channel used ('gcash' | 'card'), once PayMongo reports it
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
        method = coalesce(p_method, method),
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

revoke all on function public.record_payment_result(text, text, text, text, bigint, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_payment_result(text, text, text, text, bigint, text, text, text, text)
  to service_role;
