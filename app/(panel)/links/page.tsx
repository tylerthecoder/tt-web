'use client';

import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Folder,
  FolderOpen,
  FolderPlus,
  GripVertical,
  Link as LinkIcon,
  PanelLeft,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SavedLink = {
  id: string;
  title: string;
  url: string;
  folderId: string | null;
  createdAt: string;
};

type LinkFolder = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
};

type DragState =
  | {
      type: 'link';
      id: string;
    }
  | {
      type: 'folder';
      id: string;
    };

type VisibleRow =
  | {
      type: 'folder';
      folder: LinkFolder;
      depth: number;
    }
  | {
      type: 'link';
      link: SavedLink;
      depth: number;
      folderPath: string;
    };

const STORAGE_KEY = 'tt-links-view-v1';
const TOP_LEVEL_VALUE = '__top_level__';
const DEFAULT_STARTER_FOLDER_IDS = new Set(['inbox', 'reading', 'tools']);

const starterLinks: SavedLink[] = [];

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function titleFromUrl(url: string) {
  try {
    const host = new URL(normalizeUrl(url)).hostname.replace(/^www\./, '');
    return host || url;
  } catch {
    return url;
  }
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

function migrateSavedState(folders: LinkFolder[], links: SavedLink[]) {
  const migratedFolders = folders
    .map((folder) => ({
      ...folder,
      parentId: folder.parentId ?? null,
    }))
    .filter((folder) => !DEFAULT_STARTER_FOLDER_IDS.has(folder.id));

  const existingFolderIds = new Set(migratedFolders.map((folder) => folder.id));
  const migratedLinks = links.map((link) => ({
    ...link,
    folderId:
      link.folderId && existingFolderIds.has(link.folderId) && !DEFAULT_STARTER_FOLDER_IDS.has(link.folderId)
        ? link.folderId
        : null,
  }));

  return { folders: migratedFolders, links: migratedLinks };
}

export default function LinksPage() {
  const [folders, setFolders] = useState<LinkFolder[]>([]);
  const [links, setLinks] = useState<SavedLink[]>(starterLinks);
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved) as { folders?: LinkFolder[]; links?: SavedLink[] };
      const { folders: migratedFolders, links: migratedLinks } = migrateSavedState(
        Array.isArray(parsed.folders) ? parsed.folders : [],
        Array.isArray(parsed.links) ? parsed.links : [],
      );

      if (migratedFolders.length > 0) {
        setFolders(migratedFolders);
        setExpandedFolderIds(
          migratedFolders.filter((folder) => folder.parentId === null).map((folder) => folder.id),
        );
      }
      if (migratedLinks.length > 0) {
        setLinks(migratedLinks);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ folders, links }));
    } catch {}
  }, [folders, links]);

  const folderMap = useMemo(() => {
    return new Map(folders.map((folder) => [folder.id, folder]));
  }, [folders]);

  const childFoldersByParent = useMemo(() => {
    return folders.reduce<Record<string, LinkFolder[]>>((acc, folder) => {
      const parentId = folder.parentId || 'root';
      acc[parentId] = [...(acc[parentId] || []), folder];
      return acc;
    }, {});
  }, [folders]);

  const linksByFolder = useMemo(() => {
    return links.reduce<Record<string, SavedLink[]>>((acc, link) => {
      const folderId = link.folderId || 'root';
      acc[folderId] = [...(acc[folderId] || []), link];
      return acc;
    }, {});
  }, [links]);

  const folderCounts = useMemo(() => {
    return links.reduce<Record<string, number>>((acc, link) => {
      if (!link.folderId) return acc;
      acc[link.folderId] = (acc[link.folderId] || 0) + 1;
      return acc;
    }, {});
  }, [links]);

  const folderPath = useCallback(
    (folderId: string | null) => {
      if (!folderId) return 'Top level';

      const path: string[] = [];
      let current = folderMap.get(folderId);
      while (current) {
        path.unshift(current.name);
        current = current.parentId ? folderMap.get(current.parentId) : undefined;
      }
      return path.join(' / ');
    },
    [folderMap],
  );

  const visibleRows = useMemo(() => {
    const rows: VisibleRow[] = [];
    const query = search.trim().toLowerCase();
    const rootLinks = linksByFolder.root || [];

    rootLinks
      .filter((link) => {
        if (!query) return true;
        return [link.title, link.url, 'Top level'].some((value) =>
          value.toLowerCase().includes(query),
        );
      })
      .forEach((link) => {
        rows.push({ type: 'link', link, depth: 0, folderPath: 'Top level' });
      });

    const walkFolder = (folder: LinkFolder, depth: number) => {
      const childFolders = childFoldersByParent[folder.id] || [];
      const folderLinks = linksByFolder[folder.id] || [];
      const path = folderPath(folder.id);
      const folderMatches = !query || folder.name.toLowerCase().includes(query);
      const matchingLinks = folderLinks.filter((link) => {
        if (!query) return true;
        return [link.title, link.url, path].some((value) => value.toLowerCase().includes(query));
      });
      const childRowsBefore = rows.length;

      if (!query || folderMatches || matchingLinks.length > 0) {
        rows.push({ type: 'folder', folder, depth });
      }

      if (!query && !expandedFolderIds.includes(folder.id)) return;

      childFolders.forEach((child) => walkFolder(child, depth + 1));

      matchingLinks.forEach((link) => {
        rows.push({ type: 'link', link, depth: depth + 1, folderPath: path });
      });

      if (query && rows.length === childRowsBefore + (folderMatches || matchingLinks.length > 0 ? 1 : 0)) {
        const insertedFolderIndex = rows.findIndex(
          (row) => row.type === 'folder' && row.folder.id === folder.id,
        );
        if (!folderMatches && insertedFolderIndex >= 0) rows.splice(insertedFolderIndex, 1);
      }
    };

    (childFoldersByParent.root || []).forEach((folder) => walkFolder(folder, 0));
    return rows;
  }, [childFoldersByParent, expandedFolderIds, folderPath, linksByFolder, search]);

  const navigableLinks = useMemo(
    () => visibleRows.filter((row): row is Extract<VisibleRow, { type: 'link' }> => row.type === 'link'),
    [visibleRows],
  );

  useEffect(() => {
    if (navigableLinks.length === 0) {
      setSelectedLinkId(null);
      return;
    }

    if (!selectedLinkId || !navigableLinks.some((row) => row.link.id === selectedLinkId)) {
      setSelectedLinkId(navigableLinks[0].link.id);
    }
  }, [navigableLinks, selectedLinkId]);

  const openLink = useCallback((url: string) => {
    window.open(normalizeUrl(url), '_blank', 'noopener,noreferrer');
  }, []);

  const toggleFolder = (folderId: string) => {
    setExpandedFolderIds((current) =>
      current.includes(folderId) ? current.filter((id) => id !== folderId) : [...current, folderId],
    );
  };

  const addFolder = (name: string, parentId: string | null) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const folder = {
      id: createId('folder'),
      name: trimmedName,
      parentId,
      createdAt: new Date().toISOString(),
    };

    setFolders((current) => [...current, folder]);
    if (parentId) setExpandedFolderIds((current) => [...new Set([...current, parentId])]);
  };

  const addLink = (title: string, urlValue: string, folderId: string | null) => {
    const url = normalizeUrl(urlValue);
    if (!url) return;

    const link = {
      id: createId('link'),
      title: title.trim() || titleFromUrl(url),
      url,
      folderId,
      createdAt: new Date().toISOString(),
    };

    setLinks((current) => [...current, link]);
    if (folderId) setExpandedFolderIds((current) => [...new Set([...current, folderId])]);
    setSelectedLinkId(link.id);
  };

  const deleteLink = (linkId: string) => {
    setLinks((current) => current.filter((link) => link.id !== linkId));
  };

  const deleteFolder = (folderId: string) => {
    const collectDescendants = (id: string): string[] => {
      const children = folders.filter((folder) => folder.parentId === id);
      return children.flatMap((child) => [child.id, ...collectDescendants(child.id)]);
    };

    const folderIdsToDelete = [folderId, ...collectDescendants(folderId)];
    setFolders((current) => current.filter((folder) => !folderIdsToDelete.includes(folder.id)));
    setLinks((current) =>
      current.map((link) =>
        link.folderId && folderIdsToDelete.includes(link.folderId)
          ? { ...link, folderId: null }
          : link,
      ),
    );
    setExpandedFolderIds((current) => current.filter((id) => !folderIdsToDelete.includes(id)));
  };

  const moveLinkToFolder = (linkId: string, folderId: string | null) => {
    setLinks((current) =>
      current.map((link) => (link.id === linkId ? { ...link, folderId } : link)),
    );
    if (folderId) setExpandedFolderIds((current) => [...new Set([...current, folderId])]);
  };

  const moveFolderToFolder = (folderId: string, parentId: string | null) => {
    if (folderId === parentId) return;

    const descendants = new Set<string>();
    const collectDescendants = (id: string) => {
      folders
        .filter((folder) => folder.parentId === id)
        .forEach((folder) => {
          descendants.add(folder.id);
          collectDescendants(folder.id);
        });
    };
    collectDescendants(folderId);
    if (parentId && descendants.has(parentId)) return;

    setFolders((current) =>
      current.map((folder) => (folder.id === folderId ? { ...folder, parentId } : folder)),
    );
    if (parentId) setExpandedFolderIds((current) => [...new Set([...current, parentId])]);
  };

  const reorderLink = (linkId: string, targetLinkId: string, targetFolderId: string | null) => {
    if (linkId === targetLinkId) return;

    setLinks((current) => {
      const moving = current.find((link) => link.id === linkId);
      if (!moving) return current;

      const withoutMoving = current.filter((link) => link.id !== linkId);
      const targetIndex = withoutMoving.findIndex((link) => link.id === targetLinkId);
      if (targetIndex < 0) return current;

      const reordered = [...withoutMoving];
      reordered.splice(targetIndex, 0, { ...moving, folderId: targetFolderId });
      return reordered;
    });
  };

  const handleFolderDrop = (folderId: string) => {
    if (!dragState) return;

    if (dragState.type === 'link') moveLinkToFolder(dragState.id, folderId);
    if (dragState.type === 'folder') moveFolderToFolder(dragState.id, folderId);
    setDropTargetId(null);
    setDragState(null);
  };

  const handlePageKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isAddModalOpen) return;

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsAddModalOpen(true);
        return;
      }

      if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (isTypingTarget(event.target) && event.target !== searchInputRef.current) return;
      if (navigableLinks.length === 0) return;

      const selectedIndex = Math.max(
        0,
        navigableLinks.findIndex((row) => row.link.id === selectedLinkId),
      );

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedLinkId(navigableLinks[(selectedIndex + 1) % navigableLinks.length].link.id);
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedLinkId(
          navigableLinks[(selectedIndex - 1 + navigableLinks.length) % navigableLinks.length].link.id,
        );
      }

      if (event.key === 'Enter') {
        const selected = navigableLinks.find((row) => row.link.id === selectedLinkId);
        if (selected) {
          event.preventDefault();
          openLink(selected.link.url);
        }
      }
    },
    [isAddModalOpen, navigableLinks, openLink, selectedLinkId],
  );

  useEffect(() => {
    document.addEventListener('keydown', handlePageKeyDown);
    return () => document.removeEventListener('keydown', handlePageKeyDown);
  }, [handlePageKeyDown]);

  return (
    <div className="min-h-full bg-gray-950 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 md:px-5 md:py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold md:text-2xl">Links</h1>
            <p className="mt-0.5 text-xs text-gray-500">
              A fast file-system view for folders and saved pages.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setShowTree((current) => !current)}
              className={`inline-flex h-8 items-center justify-center gap-2 rounded-md border px-2.5 text-xs transition ${
                showTree
                  ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100'
                  : 'border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
              }`}
            >
              <PanelLeft className="h-3.5 w-3.5" />
              Tree
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-cyan-500 px-3 text-xs font-semibold text-gray-950 transition hover:bg-cyan-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Link
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search links, folders, urls...  /"
            className="h-9 w-full rounded-md border border-white/10 bg-gray-900/80 pl-8 pr-3 text-sm text-white outline-none transition focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
          />
        </div>

        <div className={`grid gap-3 ${showTree ? 'lg:grid-cols-[14rem_minmax(0,1fr)]' : ''}`}>
          {showTree && (
            <aside className="rounded-md border border-white/10 bg-gray-900/50 p-2">
              <div className="mb-1.5 px-1 text-[11px] font-semibold uppercase text-gray-500">
                Folders
              </div>
              <TreeList
                folders={folders}
                childFoldersByParent={childFoldersByParent}
                expandedFolderIds={expandedFolderIds}
                onToggleFolder={toggleFolder}
                onSelectFolder={(folderId) => {
                  setExpandedFolderIds((current) => [...new Set([...current, folderId])]);
                  setSearch('');
                }}
              />
            </aside>
          )}

          <main className="min-w-0 rounded-md border border-white/10 bg-gray-900/60">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <div className="text-xs text-gray-400">
                {links.length} links · {folders.length} folders
              </div>
              <div className="hidden text-xs text-gray-500 md:block">
                / search · ↑↓ move · Enter open · ⌘⇧K add
              </div>
            </div>

            <div
              className="min-h-[34rem] p-1.5"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragState?.type === 'link') moveLinkToFolder(dragState.id, null);
                if (dragState?.type === 'folder') moveFolderToFolder(dragState.id, null);
                setDragState(null);
                setDropTargetId(null);
              }}
            >
              {visibleRows.length > 0 ? (
                <div className="divide-y divide-white/[0.05]">
                  {visibleRows.map((row) =>
                    row.type === 'folder' ? (
                      <FolderRow
                        key={`folder-${row.folder.id}`}
                        folder={row.folder}
                        depth={row.depth}
                        count={folderCounts[row.folder.id] || 0}
                        expanded={expandedFolderIds.includes(row.folder.id) || !!search.trim()}
                        dropTarget={dropTargetId === row.folder.id}
                        onToggle={() => toggleFolder(row.folder.id)}
                        onDelete={() => deleteFolder(row.folder.id)}
                        onDragStart={() => setDragState({ type: 'folder', id: row.folder.id })}
                        onDragEnd={() => {
                          setDragState(null);
                          setDropTargetId(null);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDropTargetId(row.folder.id);
                        }}
                        onDrop={() => handleFolderDrop(row.folder.id)}
                      />
                    ) : (
                      <LinkRow
                        key={`link-${row.link.id}`}
                        link={row.link}
                        depth={row.depth}
                        folderPath={row.folderPath}
                        selected={selectedLinkId === row.link.id}
                        onSelect={() => setSelectedLinkId(row.link.id)}
                        onOpen={() => openLink(row.link.url)}
                        onDelete={() => deleteLink(row.link.id)}
                        onDragStart={() => setDragState({ type: 'link', id: row.link.id })}
                        onDragEnd={() => {
                          setDragState(null);
                          setDropTargetId(null);
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (dragState?.type === 'link') {
                            reorderLink(dragState.id, row.link.id, row.link.folderId);
                          }
                          setDragState(null);
                        }}
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="flex min-h-[28rem] flex-col items-center justify-center rounded-md border border-dashed border-white/10 bg-gray-950/40 px-6 text-center">
                  <LinkIcon className="mb-2 h-8 w-8 text-gray-600" />
                  <p className="text-sm font-medium text-gray-300">No links yet.</p>
                  <p className="mt-1 max-w-sm text-xs text-gray-500">
                    Press Cmd+Shift+K to add one at the top level, or create folders as needed.
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {isAddModalOpen && (
        <AddLinkModal
          folders={folders}
          onClose={() => setIsAddModalOpen(false)}
          onAddLink={addLink}
          onAddFolder={addFolder}
        />
      )}
    </div>
  );
}

function TreeList({
  folders,
  childFoldersByParent,
  expandedFolderIds,
  onToggleFolder,
  onSelectFolder,
}: {
  folders: LinkFolder[];
  childFoldersByParent: Record<string, LinkFolder[]>;
  expandedFolderIds: string[];
  onToggleFolder: (folderId: string) => void;
  onSelectFolder: (folderId: string) => void;
}) {
  const renderFolder = (folder: LinkFolder, depth: number) => {
    const children = childFoldersByParent[folder.id] || [];
    const expanded = expandedFolderIds.includes(folder.id);

    return (
      <React.Fragment key={folder.id}>
        <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: depth * 12 }}>
          <button
            type="button"
            onClick={() => onToggleFolder(folder.id)}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-gray-200"
          >
            {children.length > 0 && expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onSelectFolder(folder.id)}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white"
          >
            <Folder className="h-3 w-3 flex-shrink-0 text-cyan-300" />
            <span className="truncate">{folder.name}</span>
          </button>
        </div>
        {expanded && children.map((child) => renderFolder(child, depth + 1))}
      </React.Fragment>
    );
  };

  return <div>{(childFoldersByParent.root || folders.filter((folder) => !folder.parentId)).map((folder) => renderFolder(folder, 0))}</div>;
}

function FolderRow({
  folder,
  depth,
  count,
  expanded,
  dropTarget,
  onToggle,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  folder: LinkFolder;
  depth: number;
  count: number;
  expanded: boolean;
  dropTarget: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`group flex min-h-[2.35rem] items-center gap-2 rounded px-2 py-1 transition ${
        dropTarget ? 'bg-cyan-400/10 ring-1 ring-cyan-300/40' : 'hover:bg-white/[0.04]'
      }`}
      style={{ paddingLeft: 8 + depth * 20 }}
    >
      <button
        type="button"
        className="hidden h-6 w-4 cursor-grab items-center justify-center text-gray-600 group-hover:text-gray-400 md:inline-flex"
        title="Drag folder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-400 hover:bg-white/5 hover:text-white"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-cyan-400/10 text-cyan-200">
          {expanded ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />}
        </span>
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-sm font-medium text-gray-100">{folder.name}</span>
          <span className="flex-shrink-0 text-[11px] text-gray-500">{count}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
        title="Delete folder"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function LinkRow({
  link,
  depth,
  folderPath,
  selected,
  onSelect,
  onOpen,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  link: SavedLink;
  depth: number;
  folderPath: string;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: () => void;
}) {
  return (
    <div
      draggable
      onClick={onSelect}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`group flex min-h-[2.55rem] items-center gap-2 rounded px-2 py-1 transition ${
        selected
          ? 'bg-cyan-400/10 ring-1 ring-cyan-300/40'
          : 'hover:bg-white/[0.04]'
      }`}
      style={{ paddingLeft: 8 + depth * 20 }}
    >
      <button
        type="button"
        className="hidden h-6 w-4 cursor-grab items-center justify-center text-gray-600 group-hover:text-gray-400 md:inline-flex"
        title="Drag link"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-white/5 text-gray-300">
          <LinkIcon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium leading-5 text-white">{link.title}</span>
          <span className="block truncate text-[11px] leading-4 text-gray-500">
            {folderPath} · {link.url}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-500 transition hover:bg-white/5 hover:text-white"
        title="Open link"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
        title="Delete link"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AddLinkModal({
  folders,
  onClose,
  onAddLink,
  onAddFolder,
}: {
  folders: LinkFolder[];
  onClose: () => void;
  onAddLink: (title: string, url: string, folderId: string | null) => void;
  onAddFolder: (name: string, parentId: string | null) => void;
}) {
  const [mode, setMode] = useState<'link' | 'folder'>('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [folderName, setFolderName] = useState('');
  const [targetFolderId, setTargetFolderId] = useState(TOP_LEVEL_VALUE);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    if (mode === 'link') {
      onAddLink(title, url, targetFolderId === TOP_LEVEL_VALUE ? null : targetFolderId);
      setTitle('');
      setUrl('');
      onClose();
      return;
    }

    onAddFolder(folderName, targetFolderId === TOP_LEVEL_VALUE ? null : targetFolderId);
    setFolderName('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24"
      onMouseDown={onClose}
    >
      <form
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-lg border border-white/10 bg-gray-900 p-4 shadow-2xl shadow-black/40"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex rounded-md border border-white/10 bg-gray-950 p-1">
            <button
              type="button"
              onClick={() => setMode('link')}
              className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm ${
                mode === 'link' ? 'bg-cyan-500 text-gray-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              <LinkIcon className="h-4 w-4" />
              Link
            </button>
            <button
              type="button"
              onClick={() => setMode('folder')}
              className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm ${
                mode === 'folder' ? 'bg-cyan-500 text-gray-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              <FolderPlus className="h-4 w-4" />
              Folder
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {mode === 'link' ? (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase text-gray-500">URL</span>
                <input
                  ref={firstInputRef}
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="example.com"
                  className="h-10 w-full rounded-md border border-white/10 bg-gray-950 px-3 text-sm outline-none focus:border-cyan-400/70"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase text-gray-500">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Optional"
                  className="h-10 w-full rounded-md border border-white/10 bg-gray-950 px-3 text-sm outline-none focus:border-cyan-400/70"
                />
              </label>
            </>
          ) : (
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase text-gray-500">Folder</span>
              <input
                ref={firstInputRef}
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                placeholder="Folder name"
                className="h-10 w-full rounded-md border border-white/10 bg-gray-950 px-3 text-sm outline-none focus:border-cyan-400/70"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase text-gray-500">Put in</span>
            <select
              value={targetFolderId}
              onChange={(event) => setTargetFolderId(event.target.value)}
              className="h-10 w-full rounded-md border border-white/10 bg-gray-950 px-3 text-sm outline-none focus:border-cyan-400/70"
            >
              <option value={TOP_LEVEL_VALUE}>Top level</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          {mode === 'link' ? 'Add Link' : 'Add Folder'}
        </button>
      </form>
    </div>
  );
}
