export type Product = Record<string, any>;
export type Order = Record<string, any>;

const CATEGORY_LABELS: Record<string, string> = {
  fitted: 'fitted',
  aframe: 'A-Frame',
  trucker: 'trucker',
  more: 'accessory',
};

const STOP_WORDS = new Set([
  'a',
  'aframe',
  'and',
  'angeles',
  'black',
  'blackout',
  'blue',
  'box',
  'bright',
  'brown',
  'camo',
  'camouflage',
  'cap',
  'city',
  'classic',
  'cream',
  'deep',
  'edition',
  'era',
  'fifty',
  'fitted',
  'frame',
  'gold',
  'gray',
  'green',
  'grey',
  'hat',
  'ice',
  'ivory',
  'logo',
  'los',
  'maroon',
  'midnight',
  'multi',
  'navy',
  'new',
  'of',
  'orange',
  'pink',
  'purple',
  'red',
  'rose',
  'royal',
  'rush',
  'sand',
  'silver',
  'sky',
  'space',
  'teal',
  'the',
  'vintage',
  'wave',
  'white',
  'yellow',
  'york',
]);

const COLOR_DEFINITIONS = [
  { key: 'blue', words: ['royal blue', 'sky blue', 'midnight blue', 'navy blue', 'navy', 'blue'] },
  { key: 'teal', words: ['teal', 'aqua'] },
  { key: 'orange', words: ['orange'] },
  { key: 'red', words: ['deep red', 'bright red', 'red', 'crimson'] },
  { key: 'black', words: ['blackout', 'black', 'noir'] },
  { key: 'white', words: ['white', 'ivory', 'cream'] },
  { key: 'brown', words: ['sand brown', 'brown', 'sand', 'tan', 'earth'] },
  { key: 'gold', words: ['gold', 'yellow'] },
  { key: 'green', words: ['forest green', 'olive', 'green'] },
  { key: 'purple', words: ['purple', 'violet'] },
  { key: 'pink', words: ['pink', 'rose'] },
  { key: 'grey', words: ['grey', 'gray', 'silver'] },
  { key: 'maroon', words: ['maroon', 'burgundy'] },
  { key: 'camo', words: ['camo', 'camouflage'] },
];

const normalize = (value: unknown) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const productText = (value: Product | string) => {
  if (typeof value === 'string') return value;
  return [value?.name, value?.full_name, value?.subtitle, value?.description]
    .filter(Boolean)
    .join(' ');
};

export const extractColors = (value: Product | string) => {
  const text = ` ${normalize(productText(value))} `;
  const colors: string[] = [];

  for (const definition of COLOR_DEFINITIONS) {
    if (definition.words.some(word => text.includes(` ${normalize(word)} `))) {
      colors.push(definition.key);
    }
  }

  return colors;
};

export const normalizeProductKey = (product: Product) =>
  String(product?.product_id ?? product?.id ?? '');

const normalizeIdentity = (value: unknown) => {
  if (!value) return '';
  return normalize(value)
    .split(' ')
    .filter(token => token && !STOP_WORDS.has(token))
    .join(' ');
};

const identityFor = (product: Product) =>
  normalizeIdentity(product?.name || product?.full_name || product?.subtitle || '');

const availableStock = (product: Product) => {
  const sizes = Object.keys(product?.sizes_stock || {});
  if (sizes.length > 0) {
    return sizes.reduce((sum, size) => sum + (Number(product.sizes_stock[size]) || 0), 0) > 0;
  }
  return Number(product?.stock_quantity || 0) > 0;
};

const hasPurchasedSize = (product: Product, sizes: Set<string>) => {
  const availableSizes = Object.keys(product?.sizes_stock || {});
  if (availableSizes.length === 0 || sizes.size === 0) return false;
  return Array.from(sizes).some(size => Number(product.sizes_stock[size] || 0) > 0);
};

const displayTeam = (product: Product) => product?.name || product?.full_name || 'this style';

const categoryLabel = (category: string) => CATEGORY_LABELS[category] || 'similar';

const tokenOverlap = (profileTokens: Set<string>, identity: string) => {
  const tokens = identity.split(' ').filter(Boolean);
  if (tokens.length === 0 || profileTokens.size === 0) return 0;
  const matches = tokens.filter(token => profileTokens.has(token)).length;
  return matches / tokens.length;
};

export function buildTasteProfile(orders: Order[], products: Product[]) {
  const productsByKey = new Map<string, Product>();
  for (const product of products) {
    productsByKey.set(String(product.id), product);
    if (product.product_id) productsByKey.set(String(product.product_id), product);
  }

  const profile = {
    purchasedKeys: new Set<string>(),
    identities: new Map<string, number>(),
    identityTokens: new Set<string>(),
    categories: new Map<string, number>(),
    colors: new Map<string, number>(),
    sizes: new Set<string>(),
    priceTotal: 0,
    priceCount: 0,
    priceAverage: 0,
  };

  orders.forEach((order, orderIndex) => {
    const recencyWeight = orderIndex === 0 ? 1.5 : orderIndex < 3 ? 1.25 : 1;

    for (const item of order.order_items || []) {
      const key = String(item.product_id ?? '');
      if (key) profile.purchasedKeys.add(key);

      const product = productsByKey.get(key);
      const identity = product ? identityFor(product) : normalizeIdentity(item.name);
      const category = product?.category;
      const price = Number(product?.price ?? item.price);

      if (product) {
        profile.purchasedKeys.add(String(product.id));
        if (product.product_id) profile.purchasedKeys.add(String(product.product_id));
      }

      if (identity) {
        profile.identities.set(identity, (profile.identities.get(identity) || 0) + recencyWeight);
        for (const token of identity.split(' ').filter(Boolean)) {
          profile.identityTokens.add(token);
        }
      }

      if (category) {
        profile.categories.set(category, (profile.categories.get(category) || 0) + recencyWeight);
      }

      for (const color of extractColors(product || item.name)) {
        profile.colors.set(color, (profile.colors.get(color) || 0) + recencyWeight);
      }

      if (item.size) profile.sizes.add(item.size);

      if (Number.isFinite(price) && price > 0) {
        profile.priceTotal += price;
        profile.priceCount += 1;
      }
    }
  });

  if (profile.priceCount > 0) {
    profile.priceAverage = profile.priceTotal / profile.priceCount;
  }

  return profile;
}

export function scoreProducts(profile: ReturnType<typeof buildTasteProfile>, products: Product[]) {
  return products
    .filter(availableStock)
    .filter(product => !profile.purchasedKeys.has(normalizeProductKey(product)))
    .map(product => {
      const identity = identityFor(product);
      const colors = extractColors(product);
      const category = product.category;
      const price = Number(product.price);
      let score = 1;
      let reasonPriority = 0;
      let reason = 'Picked for your collection';

      const teamAffinity = profile.identities.get(identity) || 0;
      const titleOverlap = teamAffinity ? 0 : tokenOverlap(profile.identityTokens, identity);
      const categoryAffinity = category ? profile.categories.get(category) || 0 : 0;
      const matchingColors = colors.filter(color => profile.colors.has(color));

      if (teamAffinity > 0) {
        score += 8;
        if (4 > reasonPriority) {
          reasonPriority = 4;
          reason = `More ${displayTeam(product)} caps`;
        }
      } else if (titleOverlap >= 0.5) {
        score += 3;
        if (3 > reasonPriority) {
          reasonPriority = 3;
          reason = 'Similar to a cap you bought';
        }
      }

      if (categoryAffinity > 0) {
        score += 3;
        if (2 > reasonPriority) {
          reasonPriority = 2;
          reason = `More ${categoryLabel(category)} caps`;
        }
      }

      if (matchingColors.length > 0) {
        const colorScore = Math.min(matchingColors.length, 2) * 2;
        score += colorScore;
        if (3 > reasonPriority) {
          reasonPriority = 3;
          reason = `Another ${matchingColors[0]} cap`;
        }
      }

      if (profile.priceAverage > 0 && Number.isFinite(price)) {
        const difference = Math.abs(price - profile.priceAverage) / profile.priceAverage;
        if (difference <= 0.1) {
          score += 2;
          if (1 > reasonPriority) {
            reasonPriority = 1;
            reason = 'Similar price to your past picks';
          }
        } else if (difference <= 0.25) {
          score += 1;
        }
      }

      if (hasPurchasedSize(product, profile.sizes)) score += 1;

      return { product, score, reason };
    })
    .sort((a, b) => b.score - a.score || Number(b.product.id) - Number(a.product.id));
}
