import { useContext, useEffect, useState } from 'react';
import { SessionContext } from '../context/SessionContext';
import ProductCard from './ProductCard';
import { getLocalRecommendations } from '../utils/recommendations';
import { fetchAIRecommendations } from '../utils/recommendationsApi';

const LIMIT = 6;
const CACHE_PREFIX = 'onlycaps:recommendations:';
const CACHE_TTL = 10 * 60 * 1000;
const AI_ENABLED = import.meta.env.VITE_ENABLE_AI_RECOMMENDER === 'true';

const readCache = userId => {
  try {
    const raw = window.sessionStorage.getItem(`${CACHE_PREFIX}${userId}`);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.savedAt || Date.now() - cached.savedAt > CACHE_TTL) return null;
    if (!Array.isArray(cached.recommendations)) return null;
    return cached;
  } catch {
    return null;
  }
};

const writeCache = (userId, value) => {
  try {
    window.sessionStorage.setItem(
      `${CACHE_PREFIX}${userId}`,
      JSON.stringify({ ...value, savedAt: Date.now() }),
    );
  } catch {
    return;
  }
};

const Skeleton = () => (
  <section className="section">
    <div className="container">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-64 loading-skeleton rounded" />
        <div className="h-4 w-80 loading-skeleton rounded" />
      </div>
      <div className="product-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="card overflow-hidden">
            <div className="aspect-square loading-skeleton" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 loading-skeleton" />
              <div className="h-4 w-1/2 loading-skeleton" />
              <div className="h-5 w-24 loading-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default function RecommendedProducts() {
  const session = useContext(SessionContext);
  const [items, setItems] = useState([]);
  const [hasHistory, setHasHistory] = useState(false);
  const [source, setSource] = useState('local');
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setHasHistory(false);
      setSource('local');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const cached = readCache(userId);

    if (cached) {
      setItems(cached.recommendations);
      setHasHistory(Boolean(cached.hasHistory));
      setSource(cached.source === 'ai' ? 'ai' : 'local');
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);

      let result = null;
      if (AI_ENABLED) {
        result = await fetchAIRecommendations({ limit: LIMIT });
      }

      if (
        !result ||
        !Array.isArray(result.recommendations) ||
        result.recommendations.length === 0
      ) {
        try {
          result = await getLocalRecommendations({ userId, limit: LIMIT });
        } catch (error) {
          console.error('Could not load recommendations:', error);
          result = null;
        }
      }

      if (cancelled) return;

      const next = result
        ? {
            hasHistory: Boolean(result.hasHistory ?? result.has_history),
            recommendations: result.recommendations || [],
            source: result.source === 'ai' ? 'ai' : 'local',
          }
        : { hasHistory: false, recommendations: [], source: 'local' };

      setItems(next.recommendations);
      setHasHistory(next.hasHistory);
      setSource(next.source);
      setLoading(false);

      if (next.recommendations.length > 0) writeCache(userId, next);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!session) return null;
  if (loading) return <Skeleton />;
  if (items.length === 0) return null;

  return (
    <section className="section">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-3xl md:text-4xl font-bold text-base-content">
                {hasHistory ? 'Recommended For You' : 'Popular Right Now'}
              </h2>
              {source === 'ai' && <span className="badge badge-primary text-xs">AI</span>}
            </div>
            <p className="text-base-content/60">
              {hasHistory
                ? source === 'ai'
                  ? 'AI-picked from your order history'
                  : 'Based on your order history'
                : 'Customer favorites to get you started'}
            </p>
          </div>
        </div>

        <div className="product-grid">
          {items.map(item => {
            const product = item.product;
            const key = product.product_id ?? product.id;
            return (
              <div key={key} className="flex flex-col">
                <ProductCard product={product} />
                <p className="mt-2 text-sm text-base-content/60">{item.reason}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
