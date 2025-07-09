'use client';

import { Search } from 'lucide-react';
import { EmptyState } from './empty-state';

interface NoSearchResultsProps {
  query: string;
  onClearSearch: () => void;
}

export function NoSearchResults({ query, onClearSearch }: NoSearchResultsProps) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any notes matching "${query}". Try searching with different keywords.`}
      action={{
        label: "Clear search",
        onClick: onClearSearch,
      }}
    />
  );
}