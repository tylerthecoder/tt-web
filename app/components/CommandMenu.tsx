'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Calendar, Edit, FileText, Home, List, Search, StickyNote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useNotesIndex } from '../(panel)/hooks';

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  type: 'navigation' | 'note' | 'search';
}

export function CommandMenu() {
  const { data } = useNotesIndex();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Create navigation commands
  const navigationCommands: Command[] = [
    {
      id: 'notes',
      title: 'Notes',
      description: 'Browse all notes',
      icon: <FileText className="w-4 h-4" />,
      action: () => {
        router.push('/notes');
        handleClose();
      },
      type: 'navigation',
    },
    {
      id: 'create-note',
      title: 'Create Note',
      description: 'Create a new note',
      icon: <Edit className="w-4 h-4" />,
      action: () => {
        router.push('/notes');
        handleClose();
      },
      type: 'navigation',
    },
    {
      id: 'panel',
      title: 'Panel',
      description: 'Main dashboard',
      icon: <Home className="w-4 h-4" />,
      action: () => {
        router.push('/daily');
        handleClose();
      },
      type: 'navigation',
    },
    {
      id: 'lists',
      title: 'Lists',
      description: 'Manage your lists',
      icon: <List className="w-4 h-4" />,
      action: () => {
        router.push('/lists');
        handleClose();
      },
      type: 'navigation',
    },
  ];

  const filteredNotes = data?.notes.filter((note) =>
    note.title.toLowerCase().includes(search.toLowerCase()),
  ) || [];

  // Create note commands
  const noteCommands: Command[] = filteredNotes.slice(0, 5).flatMap((note) => [
    {
      id: `note-view-${note.id}`,
      title: `View: ${note.title}`,
      description: `View note`,
      icon: <FileText className="w-4 h-4" />,
      action: () => {
        router.push(`/note/${note.id}`);
        handleClose();
      },
      type: 'note',
    },
    {
      id: `note-edit-${note.id}`,
      title: `Edit: ${note.title}`,
      description: `Edit note`,
      icon: <Edit className="w-4 h-4" />,
      action: () => {
        router.push(`/note/${note.id}/edit`);
        handleClose();
      },
      type: 'note',
    },
  ]);

  // Combine all commands and filter by search
  const allCommands = [...navigationCommands, ...noteCommands]
    .filter((command) => {
      if (!search) return command.type === 'navigation';
      return (
        command.title.toLowerCase().includes(search.toLowerCase()) ||
        command.description.toLowerCase().includes(search.toLowerCase())
      );
    })
    .slice(0, 10); // Limit to 10 results for performance

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearch('');
    setSelectedIndex(0);
  }, []);

  // Handle Ctrl+K to open menu
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or contenteditable element (except our own input)
      const target = event.target as HTMLElement;
      const isOurInput = target === inputRef.current;

      if (
        !isOurInput &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      } else if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        handleClose();
      }
    },
    [isOpen, handleClose],
  );

  // Handle navigation within the menu
  const handleMenuKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % allCommands.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + allCommands.length) % allCommands.length);
          break;
        case 'Enter':
          event.preventDefault();
          if (allCommands[selectedIndex]) {
            allCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          event.preventDefault();
          handleClose();
          break;
      }
    },
    [isOpen, allCommands, selectedIndex, handleClose],
  );

  // Add global event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleMenuKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleMenuKeyDown);
    };
  }, [handleKeyDown, handleMenuKeyDown]);

  // Focus input when menu opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-20"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center px-4 py-3 border-b border-gray-700">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for commands, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
              />
              <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-700 rounded">⌘K</kbd>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {allCommands.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400">No results found</div>
              ) : (
                <div className="py-2">
                  {/* Group by type */}
                  {!search && (
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Quick Navigation
                      </h3>
                    </div>
                  )}

                  {search && noteCommands.length > 0 && (
                    <div className="px-4 py-2">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Notes
                      </h3>
                    </div>
                  )}

                  {allCommands.map((command, index) => (
                    <div
                      key={command.id}
                      className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      onClick={command.action}
                    >
                      <div className="flex items-center flex-1">
                        {command.icon}
                        <div className="ml-3">
                          <div className="text-sm font-medium">{command.title}</div>
                          <div className="text-xs text-gray-400">{command.description}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
              <span>Use ↑↓ to navigate, ↵ to select, esc to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
