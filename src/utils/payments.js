// Payment "providers" shown at checkout -- collapsed to match how Shopify
// (and PayMongo's own Shopify plugin) present it: one row for PayMongo,
// which covers every card/wallet it's configured for, and a separate row for
// Cash on Delivery, which PayMongo has no part in.
//
// The specific method inside PayMongo (GCash vs card) is no longer chosen on
// our own page -- selecting "PayMongo" sends the shopper to PayMongo's own
// hosted checkout, which shows them every method enabled on the account and
// lets them pick there. A GoTyme payment rides the same card flow, since
// GoTyme issues a debit Mastercard rather than a separate payment rail.
export const PAYMENT_PROVIDERS = [
  {
    id: 'paymongo',
    value: 'online',
    label: 'Secure Payments via PayMongo',
    logos: [
      '/images/payments/mastercard.png',
      '/images/payments/visa.png',
      '/images/payments/gcash-icon.png',
    ],
    hint: "You'll be redirected to PayMongo's secure page to complete your purchase. We never see or store your card or wallet details.",
  },
  {
    id: 'cod',
    value: 'cod',
    label: 'Cash on Delivery',
    logos: [],
    hint: 'Pay in cash when your order arrives.',
  },
];
