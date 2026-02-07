import { useQuery } from '@tanstack/react-query';
import { updateWeather } from '../services/weatherService';

/**
 * Weather monitoring hook powered by TanStack Query.
 * Provides caching, automatic retries, and synchronized state across the app.
 */
export const useWeather = (currentDay: number) => {
  const { 
    data: weather, 
    isLoading: loading, 
    error: queryError 
  } = useQuery({
    queryKey: ['weather', currentDay],
    queryFn: () => updateWeather(currentDay),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const error = queryError ? (queryError as Error).message : null;

  return { 
    weather: weather || null, 
    loading, 
    error 
  };
};