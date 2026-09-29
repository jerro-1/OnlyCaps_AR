// Shipping options shown at checkout. These numbers only drive the display --
// the checkout edge function (supabase/functions/checkout/index.ts) has its
// own copy that actually decides what a customer is charged, so keep the two
// in sync if you change a price here.

export const ZONES = [
  { id: 'metro', label: 'Metro Manila & nearby' },
  { id: 'luzon', label: 'Luzon (outside Metro Manila)' },
  { id: 'visayas', label: 'Visayas' },
  { id: 'mindanao', label: 'Mindanao' },
];

export const ZONE_PRICES = { metro: 85, luzon: 110, visayas: 140, mindanao: 155 };

export const COURIERS = [
  { id: 'jnt', name: 'J&T Express', eta: '3–5 business days', logo: '/images/logos/jnt.png' },
  { id: 'lbc', name: 'LBC', eta: '3–5 business days', logo: '/images/logos/lbc.png' },
  { id: 'lalamove', name: 'Lalamove', eta: 'Same day — you book the rider', logo: '/images/logos/lalamove.png' },
];

export const LALAMOVE_PICKUP = {
  name: 'OnlyCaps',
  address: 'Block 8, Lot 17, Italy St., St. Bernice Estates, Brgy. San Jose, Antipolo City, Rizal',
  // TODO: still missing a contact number -- a Lalamove rider will need one to
  // call on arrival. Fill in a real number here once you have one to give out.
  phone: '',
};

export const shippingFeeFor = (courierId, zoneId) => {
  if (courierId === 'lalamove') return 0;
  if (!zoneId) return null;
  return ZONE_PRICES[zoneId] ?? null;
};
