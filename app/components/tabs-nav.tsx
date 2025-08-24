'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { FaCalendarDay, FaFileAlt, FaList, FaListAlt, FaStickyNote } from 'react-icons/fa';

type TabId = 'daily' | 'todos' | 'lists' | 'jots' | 'notes';

export function TabsNav() {
  const pathname = usePathname() || '/daily';
  const router = useRouter();

  const tabs: { id: TabId; label: string; icon: React.ReactNode; href: string; hotkey?: string }[] =
    useMemo(
      () => [
        { id: 'daily', label: 'Daily (d)', icon: <FaCalendarDay />, href: '/daily', hotkey: 'd' },
        { id: 'todos', label: 'Todos (t)', icon: <FaListAlt />, href: '/todos', hotkey: 't' },
        { id: 'lists', label: 'Lists (l)', icon: <FaList />, href: '/lists', hotkey: 'l' },
        { id: 'jots', label: 'Jots (j)', icon: <FaStickyNote />, href: '/jots', hotkey: 'j' },
        { id: 'notes', label: 'Notes (n)', icon: <FaFileAlt />, href: '/notes', hotkey: 'n' },
      ],
      [],
    );
  const activeId: TabId = useMemo(() => {
    if (pathname.startsWith('/todos')) return 'todos';
    if (pathname.startsWith('/lists')) return 'lists';
    if (pathname.startsWith('/jots')) return 'jots';
    if (pathname.startsWith('/notes') || pathname.startsWith('/note/')) return 'notes';
    return 'daily';
  }, [pathname]);

  useEffect(() => {
    tabs.forEach((t) => router.prefetch?.(t.href));
  }, [router, tabs]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return;
      const key = event.key.toLowerCase();
      const match = tabs.find((t) => t.hotkey === key);
      if (match) {
        event.preventDefault();
        router.push(match.href);
      }
    },
    [router, tabs],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="border-b border-gray-700 overflow-x-auto flex-shrink-0">
      <div className="flex min-w-max md:min-w-0">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex items-center gap-2 px-3 md:px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ease-in-out whitespace-nowrap \
                            ${
                              activeId === tab.id
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                            }
                        `}
            prefetch
          >
            <span className="hidden md:inline">{tab.icon}</span>
            <span className="md:hidden">{tab.label.split(' ')[0]}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
