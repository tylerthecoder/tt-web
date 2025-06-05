'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WeeklyTodos } from './weekly-todos';
import { MilkdownEditorWrapper } from "./markdown-editor";
import { JotsViewer } from './JotsViewer';
import { ListsViewer } from './ListsViewer';
import { Week } from 'tt-services/src/services/WeeklyService';
import { Jot } from 'tt-services/src/services/JotsService';
import { List } from 'tt-services/src/services/ListsService';
import { FaListAlt, FaEdit, FaStickyNote, FaCalendarDay, FaList } from 'react-icons/fa';
import { DailyNote } from 'tt-services/src/services/DailyNoteService';
import { NoteMetadata } from 'tt-services/src/services/NotesService';
import { DailyNoteViewer } from './DailyNoteViewer';

type Tab = 'todos' | 'editor' | 'jots' | 'daily' | 'lists';

interface PanelTabsClientProps {
    week: Week;
    initialJots: Jot[];
    initialDailyNote: DailyNote;
    allDailyNotesMetadata: NoteMetadata[];
    initialLists: List[];
}

export function PanelTabsClient({ week, initialJots, initialDailyNote, allDailyNotesMetadata, initialLists }: PanelTabsClientProps) {
    const [activeTab, setActiveTab] = useState<Tab>('daily');

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'daily', label: 'Daily Note (d)', icon: <FaCalendarDay /> },
        { id: 'todos', label: 'Weekly Todos (t)', icon: <FaListAlt /> },
        { id: 'lists', label: 'Lists (l)', icon: <FaList /> },
        { id: 'jots', label: 'Jots (j)', icon: <FaStickyNote /> },
        { id: 'editor', label: 'Weekly Note (n)', icon: <FaEdit /> },
    ];

    // Memoize the keydown handler
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Ignore if typing in an input, textarea, or contenteditable element
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        // Switch tab based on key press
        switch (event.key) {
            case 'n':
                setActiveTab('editor');
                break;
            case 't':
                setActiveTab('todos');
                break;
            case 'j':
                setActiveTab('jots');
                break;
            case 'd':
                setActiveTab('daily');
                break;
            case 'l':
                setActiveTab('lists');
                break;
            default:
                break;
        }
    }, []); // Empty dependency array as setActiveTab is stable

    // Add and remove event listener
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        // Cleanup listener on component unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]); // Re-run if handleKeyDown changes (it won't here, but good practice)

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Tab Buttons */}
            <div className="border-b border-gray-700 overflow-x-auto flex-shrink-0">
                <div className="flex min-w-max md:min-w-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-3 md:px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ease-in-out whitespace-nowrap \
                                ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                }`}
                        >
                            <span className="hidden md:inline">{tab.icon}</span>
                            <span className="md:hidden">
                                {tab.label.split(' ')[0]}
                            </span>
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative min-h-0">
                <div className={`absolute inset-0 ${activeTab !== 'todos' ? 'hidden' : ''}`}>
                    <WeeklyTodos />
                </div>

                <div className={`absolute inset-0 ${activeTab !== 'editor' ? 'hidden' : ''}`}>
                    <MilkdownEditorWrapper noteId={week.noteId} hideTitle={true} />
                </div>

                <div className={`absolute inset-0 ${activeTab !== 'jots' ? 'hidden' : ''}`}>
                    <JotsViewer initialJots={initialJots} />
                </div>

                <div className={`absolute inset-0 ${activeTab !== 'daily' ? 'hidden' : ''}`}>
                    <DailyNoteViewer
                        initialNote={initialDailyNote}
                        allNotesMetadata={allDailyNotesMetadata}
                    />
                </div>

                <div className={`absolute inset-0 ${activeTab !== 'lists' ? 'hidden' : ''}`}>
                    <ListsViewer initialLists={initialLists} />
                </div>
            </div>
        </div>
    );
}