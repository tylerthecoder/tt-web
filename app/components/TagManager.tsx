'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPlus, FaTags } from 'react-icons/fa';
import { addTagToNote, removeTagFromNote } from '../notes/actions';

interface TagManagerProps {
    itemId: string;
    tags?: string[];
    availableTags: string[];
    className?: string;
    onTagsChange?: (newTags: string[]) => void;
}

export function TagManager({
    itemId,
    tags = [],
    availableTags = [],
    className = '',
    onTagsChange
}: TagManagerProps) {
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [filteredTags, setFilteredTags] = useState<string[]>([]);
    const [currentTags, setCurrentTags] = useState<string[]>(tags);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentTags(tags);
    }, []);

    useEffect(() => {
        if (isAddingTag && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAddingTag]);

    useEffect(() => {
        // Filter available tags that aren't already applied
        if (newTag.trim()) {
            const filtered = availableTags
                .filter(tag => !currentTags.includes(tag))
                .filter(tag => tag.toLowerCase().includes(newTag.toLowerCase()))
                .slice(0, 5); // Limit to 5 suggestions
            setFilteredTags(filtered);
        } else {
            setFilteredTags([]);
        }
    }, [newTag, availableTags, currentTags]);

    const handleAddTag = async (tag: string) => {
        const tagToAdd = tag.trim();
        if (!tagToAdd || currentTags.includes(tagToAdd)) return;

        try {
            await addTagToNote(itemId, tagToAdd);

            // Update local state
            const updatedTags = [...currentTags, tagToAdd];
            setCurrentTags(updatedTags);
            if (onTagsChange) onTagsChange(updatedTags);

            // Reset input
            setNewTag('');
            setIsAddingTag(false);
        } catch (error) {
            console.error('Failed to add tag:', error);
        }
    };

    const handleRemoveTag = async (tag: string) => {
        try {
            await removeTagFromNote(itemId, tag);

            // Update local state
            const updatedTags = currentTags.filter(t => t !== tag);
            setCurrentTags(updatedTags);
            if (onTagsChange) onTagsChange(updatedTags);
        } catch (error) {
            console.error('Failed to remove tag:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            handleAddTag(newTag);
        } else if (e.key === 'Escape') {
            setIsAddingTag(false);
            setNewTag('');
        }
    };

    return (
        <div className={`${className}`}>
            <div className="flex flex-wrap gap-1 items-center">
                {currentTags.length > 0 ? (
                    currentTags.map(tag => (
                        <div
                            key={tag}
                            className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full group flex items-center"
                        >
                            <span className="mr-1">{tag}</span>
                            <button
                                onClick={() => handleRemoveTag(tag)}
                                className="opacity-70 hover:opacity-100 rounded-full hover:bg-gray-600 p-0.5"
                                aria-label={`Remove tag ${tag}`}
                            >
                                <FaTimes size={8} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-xs text-gray-500 flex items-center">
                        <FaTags className="mr-1" size={10} />
                        <span>No tags</span>
                    </div>
                )}

                {!isAddingTag ? (
                    <button
                        onClick={() => setIsAddingTag(true)}
                        className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full hover:bg-gray-600 flex items-center"
                        aria-label="Add tag"
                    >
                        <FaPlus size={8} className="mr-1" />
                        <span>Add</span>
                    </button>
                ) : (
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={() => setTimeout(() => setIsAddingTag(false), 200)}
                            placeholder="Enter tag..."
                            className="px-2 py-0.5 text-xs bg-gray-700 text-white rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
                        />

                        {filteredTags.length > 0 && (
                            <div className="absolute top-full mt-1 left-0 z-10 bg-gray-800 border border-gray-700 rounded-md shadow-lg p-1 w-48">
                                {filteredTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => handleAddTag(tag)}
                                        className="block w-full text-left text-xs text-gray-300 p-1.5 hover:bg-gray-700 rounded"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}