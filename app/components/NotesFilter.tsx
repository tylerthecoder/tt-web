'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaSearch, FaTimes, FaCheck, FaBan } from 'react-icons/fa';
import { Note } from 'tt-services/src/services/NotesService';
import { GoogleNote } from 'tt-services/src/services/GoogleNoteService';

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
    availableTags: string[];
    items: DisplayItem[];
    setFilteredItems: (items: DisplayItem[]) => void;
}

export function NotesFilter({ availableTags, items, setFilteredItems }: NotesFilterProps) {
    const router = useRouter();
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
            shownTags.forEach(tag => {
                initialTagFilters[tag] = 'shown';
            });
        }

        // Get "hidden" tags from URL
        const hiddenTagsParam = searchParams.get('hiddenTags');
        if (hiddenTagsParam) {
            const hiddenTags = hiddenTagsParam.split(',').filter(Boolean);
            hiddenTags.forEach(tag => {
                initialTagFilters[tag] = 'hidden';
            });
        }

        setTagFilters(initialTagFilters);
        setIsInitialized(true);
    }, [searchParams, isInitialized]);

    // Filter items locally
    const filterItems = useCallback((items: DisplayItem[], searchText: string, tagFiltersMap: Record<string, TagFilterState>) => {
        return items.filter(item => {
            // Get the tags from the item
            let itemTags: string[] = [];

            if (item.type === 'note') {
                itemTags = item.originalItem.tags || [];
            } else if (item.type === 'google-doc' && item.originalItem.syncedDoc) {
                itemTags = item.originalItem.syncedDoc.tags || [];
            }

            // Apply search filter
            if (searchText && searchText.trim() !== '') {
                const searchLower = searchText.toLowerCase();
                const titleMatches = item.title.toLowerCase().includes(searchLower);

                // For notes, also search in content
                const contentMatches = item.type === 'note' && item.originalItem.content
                    ? item.originalItem.content.toLowerCase().includes(searchLower)
                    : false;

                // For tags, check if any tag matches the search
                const tagMatches = itemTags.some(tag =>
                    tag.toLowerCase().includes(searchLower)
                );

                if (!(titleMatches || contentMatches || tagMatches)) {
                    return false;
                }
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
                    const hasShownTag = shownTags.some(tag => itemTags.includes(tag));
                    if (!hasShownTag) return false;
                }

                // If there are hidden tags, the item must not have any of them
                if (hiddenTags.length > 0) {
                    const hasHiddenTag = hiddenTags.some(tag => itemTags.includes(tag));
                    if (hasHiddenTag) return false;
                }
            }

            return true;
        });
    }, []);

    // Apply filtering whenever search or tagFilters change
    useEffect(() => {
        if (isInitialized) {
            const filtered = filterItems(items, search, tagFilters);
            setFilteredItems(filtered);
        }
    }, [items, search, tagFilters, filterItems, setFilteredItems, isInitialized]);

    // Memoize the URL update function
    const updateUrl = useCallback((newSearch: string, newTagFilters: Record<string, TagFilterState>) => {
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
    }, []);

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
            'none': 'shown',
            'shown': 'hidden',
            'hidden': 'none'
        };

        if (nextState[currentState] === 'none') {
            // Remove the tag from the filters object
            const newFilters = { ...tagFilters };
            delete newFilters[tag];
            setTagFilters(newFilters);
        } else {
            // Update the tag state
            setTagFilters(prev => ({
                ...prev,
                [tag]: nextState[currentState]
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
                        type="text"
                        value={search}
                        onChange={handleSearchChange}
                        placeholder="Search notes..."
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
                                <button
                                    onClick={resetFilters}
                                    className="text-xs text-gray-400 hover:text-white"
                                >
                                    Reset all filters
                                </button>
                            )}
                        </div>
                    </h3>

                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => {
                            const state = tagFilters[tag] || 'none';

                            // Define styles based on state
                            let tagClasses = "px-2 py-1 rounded-full text-xs flex items-center ";
                            let icon = null;

                            if (state === 'none') {
                                tagClasses += "bg-gray-700 text-gray-300 hover:bg-gray-600";
                            } else if (state === 'shown') {
                                tagClasses += "bg-green-900 text-green-200 border border-green-500";
                                icon = <FaCheck className="mr-1" size={8} />;
                            } else {
                                tagClasses += "bg-red-900 text-red-200 border border-red-500";
                                icon = <FaBan className="mr-1" size={8} />;
                            }

                            return (
                                <button
                                    key={tag}
                                    onClick={() => toggleTagFilter(tag)}
                                    className={tagClasses}
                                >
                                    {icon}
                                    {tag}
                                </button>
                            );
                        })}

                        {availableTags.length === 0 && (
                            <span className="text-gray-500 text-xs">No tags available</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}