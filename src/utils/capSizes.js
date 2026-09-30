// New Era's own fitted-cap size chart -- the industry-standard sizes and
// measurements, not a geometric approximation (a hat's real head-circumference
// isn't simply size * pi, so these are the actual reference numbers, not
// computed ones). Every place in this project that lists, filters, or
// measures fitted-cap sizes should import from here rather than keep its own
// copy -- four separate hardcoded lists is exactly how three of them ended up
// missing the largest three sizes (7 5/8, 7 3/4, 7 7/8) in the first place.
export const CAP_SIZE_CHART = [
  { size: '6 7/8', inches: '21 5/8', cm: 54.9 },
  { size: '7', inches: '22', cm: 55.8 },
  { size: '7 1/8', inches: '22 3/8', cm: 56.8 },
  { size: '7 1/4', inches: '22 3/4', cm: 57.7 },
  { size: '7 3/8', inches: '23 1/8', cm: 58.7 },
  { size: '7 1/2', inches: '23 1/2', cm: 59.6 },
  { size: '7 5/8', inches: '23 7/8', cm: 60.6 },
  { size: '7 3/4', inches: '24 1/4', cm: 61.5 },
  { size: '7 7/8', inches: '24 5/8', cm: 62.5 },
];

// Just the size labels, in order -- for size pickers/filters that don't need
// the circumference data (product forms, Quick View, search filters).
export const CAP_SIZES = CAP_SIZE_CHART.map(s => s.size);
