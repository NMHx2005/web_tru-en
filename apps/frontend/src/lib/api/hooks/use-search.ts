import { useQuery } from '@tanstack/react-query';
import { searchService, SearchResult, SearchSuggestion } from '../search.service';

export function useSearch(
  query: string,
  options?: {
    page?: number;
    limit?: number;
    categories?: string[];
    status?: string;
    sortBy?: string;
  },
  enabled: boolean = true
) {
  return useQuery<SearchResult>({
    queryKey: ['search', query, options],
    queryFn: () => searchService.search(query, options),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30000, // 30 seconds
  });
}

export function useSearchSuggestions(query: string, limit: number = 10) {
  return useQuery<SearchSuggestion[]>({
    queryKey: ['search', 'suggestions', query, limit],
    queryFn: () => searchService.getSuggestions(query, limit),
    enabled: query.trim().length >= 2,
    staleTime: 10000, // 10 seconds
  });
}

