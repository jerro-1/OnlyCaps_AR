-- Admin product editor supports multiple photos stored in Supabase Storage,
-- kept in products.images as an ordered JSON array (first entry = main image).
-- Backfilled from the single products.image column so existing products keep
-- working. The dashboard-only column was never captured in a tracked migration.
alter table public.products
  add column if not exists images jsonb;
-- Backfill: one-element array from image where images is still null
update public.products
set images = jsonb_build_array(image)
where images is null
  and image is not null
  and image <> '';
comment on column public.products.images is
  'Ordered array of image URLs for the product gallery. First entry is the main image. Falls back to products.image when empty.';
