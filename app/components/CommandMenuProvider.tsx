'use client';

import React, { useEffect, useState } from 'react';
import { CommandMenu } from './CommandMenu';

interface Note {
    id: string;
    title: string;
    modifiedTime: string;
}

interface CommandMenuProviderProps {
    children?: React.ReactNode;
}

async function fetchNotesForCommandMenu(): Promise<Note[]> {
    try {
        const response = await fetch('/api/command-menu/notes');
        if (!response.ok) {
            throw new Error('Failed to fetch notes');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching notes for command menu:', error);
        return [];
    }
}

export function CommandMenuProvider({ children }: CommandMenuProviderProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotesForCommandMenu()
            .then(setNotes)
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            {children}
            <CommandMenu notes={loading ? [] : notes} />
        </>
    );
}