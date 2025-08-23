'use client';

import React, { useEffect, useCallback } from 'react';
import WeeklyTodos from './views/weekly-todos';
import { MilkdownEditor } from '@/components/milkdown-note-editor';
import JotsViewer from './views/jots-viewer';
import ListsViewer from './views/lists-viewer';
import { FaListAlt, FaEdit, FaStickyNote, FaCalendarDay, FaList, FaFileAlt } from 'react-icons/fa';
import DailyNoteViewer from './views/daily-note-viewer';
import { usePathname, useRouter } from 'next/navigation';
import { usePanelData } from './hooks';
import NotesView from './views/notes';
import NoteView from './views/note-view';
import ListDetail from './views/list-detail';
import { AgeCounter } from '@/components/age-counter';
import { WeeklyProgress } from './weekly-progress';
import { CountdownTimer } from '@/components/countdown-timer';

type Tab = 'todos' | 'jots' | 'daily' | 'lists' | 'notes' | 'note-view' | 'note-edit' | 'list-view';

export function PanelTabsClient() {
    const pathname = usePathname();
    const router = useRouter();
    const { weekQuery } = usePanelData();

    const pathToTab = useCallback((): Tab => {
        if (!pathname) return 'daily';
        if (pathname.startsWith('/panel/todos')) return 'todos';
        // editor removed
        if (pathname.startsWith('/panel/jots')) return 'jots';
        if (pathname.startsWith('/panel/lists')) return 'lists';
        if (pathname.startsWith('/panel/notes')) return 'notes';
        if (pathname.startsWith('/panel/note/') && pathname.endsWith('/view')) return 'note-view';
        if (pathname.startsWith('/panel/note/') && pathname.endsWith('/edit')) return 'note-edit';
        if (pathname.startsWith('/panel/list/')) return 'list-view';
        return 'daily';
    }, [pathname]);

    const activeTab = pathToTab();
    const extractId = useCallback(() => {
        if (!pathname) return '';
        const parts = pathname.split('/');
        const idx = parts.findIndex(p => p === 'note' || p === 'list');
        if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1];
        return '';
    }, [pathname]);
    const dynamicId = extractId();

    const tabs: { id: Exclude<Tab, 'note-view' | 'note-edit' | 'list-view'>; label: string; icon: React.ReactNode; href: string }[] = [
        { id: 'daily', label: 'Daily Note (d)', icon: <FaCalendarDay />, href: '/panel/daily' },
        { id: 'todos', label: 'Weekly Todos (t)', icon: <FaListAlt />, href: '/panel/todos' },
        { id: 'lists', label: 'Lists (l)', icon: <FaList />, href: '/panel/lists' },
        { id: 'jots', label: 'Jots (j)', icon: <FaStickyNote />, href: '/panel/jots' },
        { id: 'notes', label: 'Notes', icon: <FaFileAlt />, href: '/panel/notes' },
    ];

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        switch (event.key) {
            case 'n':
                router.push('/panel/editor');
                break;
            case 't':
                router.push('/panel/todos');
                break;
            case 'j':
                router.push('/panel/jots');
                break;
            case 'd':
                router.push('/panel/daily');
                break;
            case 'l':
                router.push('/panel/lists');
                break;
            default:
                break;
        }
    }, [router]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="flex flex-col h-full overflow-hidden">

            <div className="p-4 bg-gray-800 bg-opacity-50 flex-shrink-0 hidden md:block">
                <div className="flex justify-between items-center">
                    <WeeklyProgress />
                    <div className="flex flex-col items-end">
                        <AgeCounter />
                        <CountdownTimer />
                    </div>
                </div>
            </div>
            <div className="border-b border-gray-700 overflow-x-auto flex-shrink-0">
                <div className="flex min-w-max md:min-w-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => router.push(tab.href)}
                            className={`flex items-center gap-2 px-3 md:px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ease-in-out whitespace-nowrap \
                                ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                }`}
                        >
                            <span className="hidden md:inline">{tab.icon}</span>
                            <span className="md:hidden">{tab.label.split(' ')[0]}</span>
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative min-h-0">
                <div className={`absolute inset-0 ${activeTab !== 'todos' ? 'hidden' : ''}`}>
                    <WeeklyTodos />
                </div>

                {/* editor removed */}

                <div className={`absolute inset-0 ${activeTab !== 'jots' ? 'hidden' : ''}`}>
                    <JotsViewer />
                </div>

                <div className={`absolute inset-0 ${activeTab !== 'daily' ? 'hidden' : ''}`}>
                    <DailyNoteViewer />
                </div>

                <div className={`absolute inset-0 ${activeTab !== 'lists' ? 'hidden' : ''}`}>
                    <ListsViewer />
                </div>

                <div className={`absolute inset-0 ${activeTab !== 'notes' ? 'hidden' : ''}`}>
                    <NotesView />
                </div>

                <div className={`absolute inset-0 ${activeTab !== 'note-view' ? 'hidden' : ''}`}>
                    {dynamicId && <NoteView noteId={dynamicId} />}
                </div>

                <div className={`absolute inset-0 ${activeTab !== 'note-edit' ? 'hidden' : ''}`}>
                    {dynamicId && <MilkdownEditor noteId={dynamicId} />}
                </div>

                <div className={`absolute inset-0 ${activeTab !== 'list-view' ? 'hidden' : ''}`}>
                    {dynamicId && <ListDetail listId={dynamicId} />}
                </div>
            </div>
        </div>
    );
}