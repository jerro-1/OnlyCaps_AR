# Courier logos

- `jnt.webp` — J&T Express
- `lbc.webp` — LBC
- `lalamove.webp` — Lalamove

Fetched from public search-result thumbnails, so they're low-resolution (~474px) and not
official brand assets. Swap in higher-quality files from each courier's own press/brand
page when you get the chance, keeping the same filenames (or update the `logo` paths in
[src/utils/shipping.js](../../../src/utils/shipping.js) if you rename them).

If a file here goes missing, the checkout page falls back to showing the courier's name
as text instead of a broken image (same pattern as the site header's own logo), so it's
safe to delete or replace any of these.
