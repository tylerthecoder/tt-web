'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { FaCalendarDay, FaClock, FaFileAlt, FaList, FaListAlt, FaRobot, FaStickyNote, FaTree } from 'react-icons/fa';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  hotkey?: string;
  isActive: (pathname: string) => boolean;
}

const tabs: Tab[] = [
  { id: 'daily', label: 'Daily', icon: <FaCalendarDay />, href: '/daily', hotkey: 'd', isActive: (pathname) => pathname.startsWith('/daily') },
  { id: 'todos', label: 'Todos', icon: <FaListAlt />, href: '/todos', hotkey: 't', isActive: (pathname) => pathname.startsWith('/todos') },
  { id: 'lists', label: 'Lists', icon: <FaList />, href: '/lists', hotkey: 'l', isActive: (pathname) => pathname.startsWith('/lists') || pathname.startsWith('/list/') },
  { id: 'jots', label: 'Jots', icon: <FaStickyNote />, href: '/jots', hotkey: 'j', isActive: (pathname) => pathname.startsWith('/jots') },
  { id: 'notes', label: 'Notes', icon: <FaFileAlt />, href: '/notes', hotkey: 'n', isActive: (pathname) => pathname.startsWith('/notes') || pathname.startsWith('/note/') },
  { id: 'time', label: 'Time', icon: <FaClock />, href: '/time', hotkey: 'm', isActive: (pathname) => pathname.startsWith('/time') },
  { id: 'redwood', label: 'Redwood', icon: <FaTree />, href: '/b/redwood', hotkey: 'r', isActive: (pathname) => pathname.startsWith('/b/redwood') },
  { id: 'ai', label: 'AI Chat', icon: <FaRobot />, href: '/ai', hotkey: 'a', isActive: (pathname) => pathname.startsWith('/ai') },
];

type TabId = Tab['id'];

export function TabsNav() {
  const pathname = usePathname() || '/daily';
  const router = useRouter();

  const activeId: TabId = useMemo(() => {
    return tabs.find((t) => t.isActive(pathname))?.id || 'daily';
  }, [pathname]);

  useEffect(() => {
    tabs.forEach((t) => router.prefetch?.(t.href));
  }, [router]);

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
    [router],
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
                            ${activeId === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              }
                        `}
            prefetch
          >
            <span className="hidden md:inline">{tab.icon}</span>
            <span className="md:hidden">{tab.label.split(' ')[0]}</span>
            <span className="hidden md:inline">{tab.label} {tab.hotkey ? `(${tab.hotkey})` : ''}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
