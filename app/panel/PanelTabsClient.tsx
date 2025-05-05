'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WeeklyTodos } from './weekly-todos';
import { MilkdownEditorWrapper } from "./markdown-editor";
import { JotsViewer } from './JotsViewer';
import { Week } from 'tt-services/src/services/WeeklyService';
import { Jot } from 'tt-services/src/services/JotsService';
import { FaListAlt, FaEdit, FaStickyNote, FaCalendarDay } from 'react-icons/fa';
import { DailyNote } from 'tt-services/src/services/DailyNoteService';
import { NoteMetadata } from 'tt-services/src/services/NotesService';
import { DailyNoteViewer } from './DailyNoteViewer';

type Tab = 'todos' | 'editor' | 'jots' | 'daily';

interface PanelTabsClientProps {
    week: Week;
    initialJots: Jot[];
    initialDailyNote: DailyNote;
    allDailyNotesMetadata: NoteMetadata[];
}

export function PanelTabsClient({ week, initialJots, initialDailyNote, allDailyNotesMetadata }: PanelTabsClientProps) {
    const [activeTab, setActiveTab] = useState<Tab>('daily');

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'daily', label: 'Daily Note (d)', icon: <FaCalendarDay /> },
        { id: 'todos', label: 'Weekly Todos (t)', icon: <FaListAlt /> },
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
        <div className="flex flex-col flex-grow h-full">
            {/* Tab Buttons */}
            <div className="flex border-b border-gray-700">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ease-in-out \
                            ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex-grow overflow-hidden">
                <div className={`h-full ${activeTab !== 'todos' ? 'hidden' : ''}`}>
                    <WeeklyTodos />
                </div>

                <div className={`h-full ${activeTab !== 'editor' ? 'hidden' : ''}`}>
                    <MilkdownEditorWrapper noteId={week.noteId} hideTitle={true} />
                </div>

                <div className={`h-full ${activeTab !== 'jots' ? 'hidden' : ''}`}>
                    <JotsViewer initialJots={initialJots} />
                </div>

                <div className={`h-full ${activeTab !== 'daily' ? 'hidden' : ''}`}>
                    <DailyNoteViewer
                        initialNote={initialDailyNote}
                        allNotesMetadata={allDailyNotesMetadata}
                    />
                </div>
            </div>
        </div>
    );
}