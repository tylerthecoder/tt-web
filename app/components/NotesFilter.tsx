'use client';

import { useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaBan, FaCheck, FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import { GoogleNote, Note } from 'tt-services/src/client-index.ts';

import { useTags } from '@/(panel)/hooks';

// Type for tag filter states
type TagFilterState = 'none' | 'shown' | 'hidden';

type DisplayItem = {
  id: string;
  title: string;
  modifiedTime: string;
  type: 'note' | 'google-doc';
  originalItem: Note | GoogleNote | any;
};

interface NotesFilterProps {
  items: DisplayItem[];
  setFilteredItems: (items: DisplayItem[]) => void;
}

const MAX_CONTENT_WORDS = 600;

const normalizeSearchText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getSearchTokens = (text: string) => normalizeSearchText(text).split(/\s+/).filter(Boolean);

const isSubsequence = (needle: string, haystack: string) => {
  let needleIndex = 0;

  for (let haystackIndex = 0; haystackIndex < haystack.length; haystackIndex += 1) {
    if (needle[needleIndex] === haystack[haystackIndex]) {
      needleIndex += 1;
      if (needleIndex === needle.length) return true;
    }
  }

  return false;
};

const getEditDistance = (left: string, right: string, maxDistance: number) => {
  if (Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    let rowMin = current[0];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
      rowMin = Math.min(rowMin, current[rightIndex]);
    }

    if (rowMin > maxDistance) return maxDistance + 1;

    for (let index = 0; index < previous.length; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[right.length];
};

const getMaxEditDistance = (token: string) => {
  if (token.length <= 2) return 0;
  if (token.length <= 5) return 1;
  if (token.length <= 10) return 2;
  return 3;
};

const getWordMatchScore = (queryToken: string, word: string) => {
  if (!queryToken || !word) return 0;
  if (word === queryToken) return 1;
  if (word.startsWith(queryToken)) return 0.94;
  if (word.includes(queryToken)) return 0.88;

  if (queryToken.length >= 3 && isSubsequence(queryToken, word)) {
    return 0.72;
  }

  const maxDistance = getMaxEditDistance(queryToken);
  if (maxDistance === 0) return 0;

  const distance = getEditDistance(queryToken, word, maxDistance);
  if (distance > maxDistance) return 0;

  return 0.82 - distance * 0.1;
};

const scoreTokenAgainstWords = (queryToken: string, words: string[]) => {
  let bestScore = 0;

  for (const word of words) {
    bestScore = Math.max(bestScore, getWordMatchScore(queryToken, word));
    if (bestScore === 1) break;
  }

  return bestScore;
};

const getItemSearchScore = (item: DisplayItem, queryTokens: string[], itemTags: string[]) => {
  if (queryTokens.length === 0) return 1;

  const titleWords = getSearchTokens(item.title);
  const tagWords = itemTags.flatMap(getSearchTokens);
  const contentWords =
    item.type === 'note' && item.originalItem.content
      ? getSearchTokens(item.originalItem.content).slice(0, MAX_CONTENT_WORDS)
      : [];
  const normalizedQuery = queryTokens.join(' ');
  const normalizedTitle = titleWords.join(' ');
  const normalizedTags = tagWords.join(' ');
  const normalizedContent = contentWords.join(' ');

  let totalScore = 0;

  for (const token of queryTokens) {
    const titleScore = scoreTokenAgainstWords(token, titleWords) * 8;
    const tagScore = scoreTokenAgainstWords(token, tagWords) * 6;
    const contentScore = scoreTokenAgainstWords(token, contentWords) * 3;
    const bestTokenScore = Math.max(titleScore, tagScore, contentScore);

    if (bestTokenScore === 0) return 0;

    totalScore += bestTokenScore;
  }

  if (normalizedTitle.includes(normalizedQuery)) totalScore += 6;
  if (normalizedTags.includes(normalizedQuery)) totalScore += 4;
  if (normalizedContent.includes(normalizedQuery)) totalScore += 2;

  return totalScore;
};

export function NotesFilter({ items, setFilteredItems }: NotesFilterProps) {
  const { tags: availableTags, loading: tagsLoading, error: tagsError } = useTags();
  const searchParams = useSearchParams();

  // Initialize state with proper null checks
  const [search, setSearch] = useState(() => searchParams?.get('search') || '');
  const [tagFilters, setTagFilters] = useState<Record<string, TagFilterState>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Extract search params once on mount
  useEffect(() => {
    if (!searchParams || isInitialized) return;

    const initialTagFilters: Record<string, TagFilterState> = {};

    // Get "shown" tags from URL
    const shownTagsParam = searchParams.get('shownTags');
    if (shownTagsParam) {
      const shownTags = shownTagsParam.split(',').filter(Boolean);
      shownTags.forEach((tag) => {
        initialTagFilters[tag] = 'shown';
      });
    }

    // Get "hidden" tags from URL
    const hiddenTagsParam = searchParams.get('hiddenTags');
    if (hiddenTagsParam) {
      const hiddenTags = hiddenTagsParam.split(',').filter(Boolean);
      hiddenTags.forEach((tag) => {
        initialTagFilters[tag] = 'hidden';
      });
    }

    setTagFilters(initialTagFilters);
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  // Filter items locally
  const filterItems = useCallback(
    (items: DisplayItem[], searchText: string, tagFiltersMap: Record<string, TagFilterState>) => {
      const queryTokens = getSearchTokens(searchText);
      const isSearching = queryTokens.length > 0;

      return items
        .map((item) => {
          // Get the tags from the item
          let itemTags: string[] = [];

          if (item.type === 'note') {
            itemTags = item.originalItem.tags || [];
          } else if (item.type === 'google-doc' && item.originalItem.syncedDoc) {
            itemTags = item.originalItem.syncedDoc.tags || [];
          }

          // Apply search filter
          const searchScore = getItemSearchScore(item, queryTokens, itemTags);
          if (isSearching && searchScore === 0) {
            return null;
          }

          // Apply tag filters if there are any
          if (tagFiltersMap && Object.keys(tagFiltersMap).length > 0) {
            const shownTags = Object.entries(tagFiltersMap)
              .filter(([_, state]) => state === 'shown')
              .map(([tag]) => tag);

            const hiddenTags = Object.entries(tagFiltersMap)
              .filter(([_, state]) => state === 'hidden')
              .map(([tag]) => tag);

            // If there are shown tags, the item must have at least one of them
            if (shownTags.length > 0) {
              const hasShownTag = shownTags.some((tag) => itemTags.includes(tag));
              if (!hasShownTag) return null;
            }

            // If there are hidden tags, the item must not have any of them
            if (hiddenTags.length > 0) {
              const hasHiddenTag = hiddenTags.some((tag) => itemTags.includes(tag));
              if (hasHiddenTag) return null;
            }
          }

          return { item, searchScore };
        })
        .filter((result): result is { item: DisplayItem; searchScore: number } => result !== null)
        .sort((left, right) => {
          if (!isSearching) return 0;

          const scoreDelta = right.searchScore - left.searchScore;
          if (scoreDelta !== 0) return scoreDelta;

          return (
            new Date(right.item.modifiedTime).getTime() - new Date(left.item.modifiedTime).getTime()
          );
        })
        .map(({ item }) => item);
    },
    [],
  );

  // Apply filtering whenever search or tagFilters change
  useEffect(() => {
    if (isInitialized) {
      const filtered = filterItems(items, search, tagFilters);
      setFilteredItems(filtered);
    }
  }, [items, search, tagFilters, filterItems, setFilteredItems, isInitialized]);

  // Memoize the URL update function
  const updateUrl = useCallback(
    (newSearch: string, newTagFilters: Record<string, TagFilterState>) => {
      const params = new URLSearchParams();

      // Add search parameter if it exists
      if (newSearch) {
        params.set('search', newSearch);
      }

      // Add shown tags
      const shownTags = Object.entries(newTagFilters)
        .filter(([_, state]) => state === 'shown')
        .map(([tag]) => tag);

      if (shownTags.length > 0) {
        params.set('shownTags', shownTags.join(','));
      }

      // Add hidden tags
      const hiddenTags = Object.entries(newTagFilters)
        .filter(([_, state]) => state === 'hidden')
        .map(([tag]) => tag);

      if (hiddenTags.length > 0) {
        params.set('hiddenTags', hiddenTags.join(','));
      }

      // Update the URL without causing a navigation/page refresh
      window.history.replaceState(null, '', `?${params.toString()}`);
    },
    [],
  );

  // Debounced URL update
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      updateUrl(search, tagFilters);
    }, 500); // Debounce URL updates for 500ms

    return () => clearTimeout(timeoutId);
  }, [search, tagFilters, updateUrl, isInitialized]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
  };

  // Handle clearing the search
  const handleClearSearch = () => {
    setSearch('');
  };

  // Handle tag filter change
  const toggleTagFilter = (tag: string) => {
    const currentState = tagFilters[tag] || 'none';
    const nextState: Record<TagFilterState, TagFilterState> = {
      none: 'shown',
      shown: 'hidden',
      hidden: 'none',
    };

    if (nextState[currentState] === 'none') {
      // Remove the tag from the filters object
      const newFilters = { ...tagFilters };
      delete newFilters[tag];
      setTagFilters(newFilters);
    } else {
      // Update the tag state
      setTagFilters((prev) => ({
        ...prev,
        [tag]: nextState[currentState],
      }));
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearch('');
    setTagFilters({});
    window.history.replaceState(null, '', '/notes');
  };

  // Calculate stats for filtered items
  const filteredCount = useMemo(() => {
    if (!isInitialized) return items.length;
    return filterItems(items, search, tagFilters).length;
  }, [items, search, tagFilters, filterItems, isInitialized]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex flex-col space-y-4">
        {/* Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            id="notes-search-input"
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search notes..."
            aria-keyshortcuts="/"
            className="bg-gray-700 text-white pl-10 pr-10 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <FaTimes className="text-gray-400 hover:text-white" />
            </button>
          )}
        </div>

        {/* Tag filters */}
        <div>
          <h3 className="text-gray-300 text-sm mb-2 flex justify-between items-center">
            <span>Filter by tags</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                Showing {filteredCount} of {items.length} items
              </span>
              {(search || Object.keys(tagFilters).length > 0) && (
                <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-white">
                  Reset all filters
                </button>
              )}
            </div>
          </h3>

          <div className="flex flex-wrap gap-2">
            {tagsLoading && (
              <div className="flex items-center text-xs text-gray-400">
                <FaSpinner className="animate-spin mr-2" />
                Loading tags...
              </div>
            )}

            {tagsError && (
              <div className="text-xs text-red-400">Error loading tags: {tagsError}</div>
            )}

            {!tagsLoading &&
              !tagsError &&
              availableTags.map((tag) => {
                const state = tagFilters[tag] || 'none';

                // Define styles based on state
                let tagClasses = 'px-2 py-1 rounded-full text-xs flex items-center ';
                let icon = null;

                if (state === 'none') {
                  tagClasses += 'bg-gray-700 text-gray-300 hover:bg-gray-600';
                } else if (state === 'shown') {
                  tagClasses += 'bg-green-900 text-green-200 border border-green-500';
                  icon = <FaCheck className="mr-1" size={8} />;
                } else {
                  tagClasses += 'bg-red-900 text-red-200 border border-red-500';
                  icon = <FaBan className="mr-1" size={8} />;
                }

                return (
                  <button key={tag} onClick={() => toggleTagFilter(tag)} className={tagClasses}>
                    {icon}
                    {tag}
                  </button>
                );
              })}

            {!tagsLoading && !tagsError && availableTags.length === 0 && (
              <span className="text-gray-500 text-xs">No tags available</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
