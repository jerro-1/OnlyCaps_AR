import supabase from './supabase';

export async function fetchAIRecommendations({ limit = 6 } = {}) {
  try {
    const { data, error } = await supabase.functions.invoke('recommend-products', {
      body: { limit },
    });

    if (error) throw error;
    if (!data || !Array.isArray(data.recommendations)) return null;

    return data;
  } catch (error) {
    console.warn('AI recommendations unavailable, using local fallback.', error?.message ?? error);
    return null;
  }
}
