-- Storefront code (Home, ProductDetail, ProductCard, cart, stock RPCs) reads
-- products.full_name as the display name, and AdminProducts writes it on
-- insert/update. Like model_filename, the column existed (or was assumed)
-- on the dashboard but was never tracked in a migration.
alter table public.products
  add column if not exists full_name text;
comment on column public.products.full_name is
  'Display name shown on the storefront; falls back to name when null.';
-- SearchResults filters on products.subtitle as well
alter table public.products
  add column if not exists subtitle text;
comment on column public.products.subtitle is
  'Optional short subtitle shown under the product name.';
