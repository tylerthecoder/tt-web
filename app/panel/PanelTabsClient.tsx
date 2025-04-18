'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WeeklyTodos } from './weekly-todos';
import { MilkdownEditorWrapper } from "./markdown-editor";
import { JotsViewer } from './JotsViewer'; // Corrected import name
import { Week } from 'tt-services/src/services/WeeklyService';
import { Jot } from 'tt-services/src/services/JotsService';
import { FaListAlt, FaEdit, FaStickyNote } from 'react-icons/fa'; // Added FaStickyNote

type Tab = 'todos' | 'editor' | 'jots';

interface PanelTabsClientProps {
    week: Week;
    initialJots: Jot[];
}

export function PanelTabsClient({ week, initialJots }: PanelTabsClientProps) {
    const [activeTab, setActiveTab] = useState<Tab>('editor');

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'editor', label: 'Weekly Note (n)', icon: <FaEdit /> },
        { id: 'todos', label: 'Weekly Todos (t)', icon: <FaListAlt /> },
        { id: 'jots', label: 'Jots (j)', icon: <FaStickyNote /> }, // Added Jots tab
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

            {/* Tab Content Area */}
            <div className="flex-grow overflow-hidden">
                {/* Weekly Todos Tab - Hidden if not active */}
                <div className={`h-full ${activeTab !== 'todos' ? 'hidden' : ''}`}>
                    <WeeklyTodos />
                </div>

                {/* Weekly Note Editor Tab - Hidden if not active */}
                <div className={`h-full ${activeTab !== 'editor' ? 'hidden' : ''}`}>
                    {/* Ensure editor has enough height to function correctly */}
                    <MilkdownEditorWrapper noteId={week.noteId} hideTitle={true} />
                </div>

                {/* Jots Tab - Hidden if not active */}
                <div className={`h-full ${activeTab !== 'jots' ? 'hidden' : ''}`}>
                    <JotsViewer initialJots={initialJots} />
                </div>
            </div>
        </div>
    );
}