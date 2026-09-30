-- Try It On now renders a real 3D model per product (Three.js + GLTFLoader),
-- picked via products.model_filename -- a column that already exists on the
-- live database (added directly through the dashboard while building the
-- feature) but was never captured in a tracked migration. Adding it here
-- with `if not exists` so a fresh environment ends up with the same schema
-- instead of silently missing this column.
alter table public.products
  add column if not exists model_filename text;

comment on column public.products.model_filename is
  'Filename (not full path) of this product''s .glb model in public/models/CapModels/, used by Try It On. Null falls back to a default model.';
