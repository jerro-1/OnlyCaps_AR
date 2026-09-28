import CategoryShop from '../components/CategoryShop';

export default function FittedCaps() {
  return (
    <CategoryShop
      category="fitted"
      heading="FITTED CAPS"
      bgImage="/images/FITTED CAPS.png"
      emptyText="No fitted caps available right now."
      sizeGuideLink
      features={['Authentic 59FIFTY Fitted', 'Official MLB Licensed', 'Free Shipping on Orders ₱2000+', '30-Day Returns']}
    />
  );
}
