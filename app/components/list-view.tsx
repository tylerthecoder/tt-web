'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import type { List, ListItem as ListItemType } from 'tt-services';

import { NoteModal } from '@/components/note-modal';

import {
  addItemToList,
  addNoteToItem,
  archiveListItem,
  createNote,
  deleteListItem,
  getListById,
  toggleItemCheck,
  unarchiveListItem,
} from '../(panel)/actions';

interface ListViewProps {
  listId: string;
  showTitle?: boolean;
  showBackButton?: boolean;
  backButtonUrl?: string;
}

export function ListView({
  listId,
  showTitle = true,
  showBackButton = false,
  backButtonUrl = '/',
}: ListViewProps) {
  const queryClient = useQueryClient();
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  // Unified list hook colocated in this file
  const { data, isLoading, error } = useQuery({
    queryKey: ['list', listId],
    queryFn: () => getListById(listId),
    enabled: !!listId,
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: async (newContent: string) => addItemToList(listId, newContent),
    onMutate: async (newContent: string) => {
      await queryClient.cancelQueries({ queryKey: ['list', listId] });
      const previousList = queryClient.getQueryData<List>(['list', listId]);

      const optimisticItem: ListItemType & { isOptimistic: boolean } = {
        id: `temp-${Date.now()}`,
        content: newContent,
        checked: false,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOptimistic: true,
      };

      if (previousList) {
        queryClient.setQueryData<List>(['list', listId], {
          ...previousList,
          items: [...previousList.items, optimisticItem],
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousList } as { previousList: List | undefined };
    },
    onError: (_err, _newContent, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(['list', listId], context.previousList);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['list', listId] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (itemId: string) => toggleItemCheck(listId, itemId),
    onMutate: async (itemId: string) => {
      await queryClient.cancelQueries({ queryKey: ['list', listId] });
      const previousList = queryClient.getQueryData<List>(['list', listId]);
      if (previousList) {
        const updated: List = {
          ...previousList,
          items: previousList.items.map((it) =>
            it.id === itemId
              ? { ...it, checked: !it.checked, updatedAt: new Date().toISOString() }
              : it,
          ),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(['list', listId], updated);
      }
      return { previousList } as { previousList: List | undefined };
    },
    onError: (_err, _id, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(['list', listId], context.previousList);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['list', listId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => deleteListItem(listId, itemId),
    onMutate: async (itemId: string) => {
      await queryClient.cancelQueries({ queryKey: ['list', listId] });
      const previousList = queryClient.getQueryData<List>(['list', listId]);
      if (previousList) {
        const updated: List = {
          ...previousList,
          items: previousList.items.filter((it) => it.id !== itemId),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(['list', listId], updated);
      }
      return { previousList } as { previousList: List | undefined };
    },
    onError: (_err, _id, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(['list', listId], context.previousList);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['list', listId] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ itemId, content }: { itemId: string; content: string }) => {
      const note = await createNote(content);
      await addNoteToItem(listId, itemId, note.id);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['list', listId] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (itemId: string) => archiveListItem(listId, itemId),
    onMutate: async (itemId: string) => {
      await queryClient.cancelQueries({ queryKey: ['list', listId] });
      const previousList = queryClient.getQueryData<List>(['list', listId]);
      if (previousList) {
        const updated: List = {
          ...previousList,
          items: previousList.items.map((it) =>
            it.id === itemId ? { ...it, archived: true, updatedAt: new Date().toISOString() } : it,
          ),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(['list', listId], updated);
      }
      return { previousList } as { previousList: List | undefined };
    },
    onError: (_err, _id, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(['list', listId], context.previousList);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['list', listId] });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (itemId: string) => unarchiveListItem(listId, itemId),
    onMutate: async (itemId: string) => {
      await queryClient.cancelQueries({ queryKey: ['list', listId] });
      const previousList = queryClient.getQueryData<List>(['list', listId]);
      if (previousList) {
        const updated: List = {
          ...previousList,
          items: previousList.items.map((it) =>
            it.id === itemId ? { ...it, archived: false, updatedAt: new Date().toISOString() } : it,
          ),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(['list', listId], updated);
      }
      return { previousList } as { previousList: List | undefined };
    },
    onError: (_err, _id, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(['list', listId], context.previousList);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['list', listId] });
    },
  });

  const list = data;

  const [newItemContent, setNewItemContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [hideCompletedArchived, setHideCompletedArchived] = useState<boolean>(true);
  const [collapsedHidden, setCollapsedHidden] = useState<boolean>(true);

  React.useEffect(() => {
    try {
      const val = localStorage.getItem('tt-hide-completed-archived');
      if (val !== null) setHideCompletedArchived(val === '1');
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem('tt-hide-completed-archived', hideCompletedArchived ? '1' : '0');
    } catch {}
  }, [hideCompletedArchived]);

  const addItem = (content: string) => {
    if (!content.trim()) return;
    setFormError(null);
    addMutation.mutate(content.trim(), {
      onError: () => setFormError('Failed to add item. Please try again.'),
      onSuccess: () => setNewItemContent(''),
    });
  };

  const toggleItem = (itemId: string) => {
    // Prevent toggling if item is optimistic (no-op handled in ListItem too)
    toggleMutation.mutate(itemId);
  };

  const removeItem = (itemId: string) => {
    removeMutation.mutate(itemId);
  };

  const isAdding = addMutation.isPending;

  // Compose items (already may include optimistic entries from cache)
  const itemsWithFlags = useMemo(
    () => (data?.items ?? []).map((it) => it as ListItemType & { isOptimistic?: boolean }),
    [data],
  );

  if (isLoading) return <div className="text-gray-300">Loading…</div>;
  if (error) return <div className="text-red-400">Failed to load list.</div>;
  if (!list) return <div className="text-gray-400">List not found</div>;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Link href={backButtonUrl} className="text-gray-400 hover:text-gray-200">
            <FaArrowLeft />
          </Link>
        )}
        {showTitle && <h1 className="text-2xl font-bold">{list.name}</h1>}
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={hideCompletedArchived}
              onChange={(e) => setHideCompletedArchived(e.target.checked)}
              className="w-4 h-4"
            />
            Hide completed/archived
          </label>
        </div>
      </div>

      <div className="mt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addItem(newItemContent);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            className="flex-grow px-3 py-2 text-white bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            placeholder="Add new item"
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={isAdding}
            className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Adding…' : 'Add'}
          </button>
        </form>
        {formError && <p className="text-red-400 text-sm mt-2">{formError}</p>}
      </div>

      {(() => {
        const activeItems = itemsWithFlags.filter((it) => !it.checked && !it.archived);
        const hiddenItems = itemsWithFlags.filter((it) => it.checked || it.archived);
        const visibleList = hideCompletedArchived ? activeItems : [...activeItems, ...hiddenItems];
        return (
          <>
            <div className="mt-6 space-y-3">
              {visibleList.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  listId={list.id}
                  onToggle={() => toggleItem(item.id)}
                  onDelete={() => removeItem(item.id)}
                  onArchive={() => archiveMutation.mutate(item.id)}
                  onUnarchive={() => unarchiveMutation.mutate(item.id)}
                  isCreatingNote={addNoteMutation.isPending}
                  onCreateNote={() =>
                    addNoteMutation.mutate({ itemId: item.id, content: item.content })
                  }
                  onOpenNote={(nid) => setOpenNoteId(nid)}
                />
              ))}
            </div>
            {hideCompletedArchived && hiddenItems.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setCollapsedHidden((v) => !v)}
                  className="text-sm text-gray-300 hover:text-gray-100"
                >
                  {collapsedHidden
                    ? `Show ${hiddenItems.length} completed/archived`
                    : `Hide ${hiddenItems.length} completed/archived`}
                </button>
                {!collapsedHidden && (
                  <div className="mt-3 space-y-3">
                    {hiddenItems.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        listId={list.id}
                        onToggle={() => toggleItem(item.id)}
                        onDelete={() => removeItem(item.id)}
                        onArchive={() => archiveMutation.mutate(item.id)}
                        onUnarchive={() => unarchiveMutation.mutate(item.id)}
                        isCreatingNote={addNoteMutation.isPending}
                        onCreateNote={() =>
                          addNoteMutation.mutate({ itemId: item.id, content: item.content })
                        }
                        onOpenNote={(nid) => setOpenNoteId(nid)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        );
      })()}

      {itemsWithFlags.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No items in this list yet.</p>
          <p className="text-gray-500 text-sm mt-2">Add your first item above.</p>
        </div>
      )}

      <NoteModal
        noteId={openNoteId}
        onClose={() => setOpenNoteId(null)}
        hideTitle
        title="List Item Note"
      />
    </div>
  );
}

function ItemRow({
  item,
  listId,
  onToggle,
  onDelete,
  onCreateNote,
  isCreatingNote,
  onArchive,
  onUnarchive,
  onOpenNote,
}: {
  item: ListItemType & { isOptimistic?: boolean };
  listId: string;
  onToggle: () => void;
  onDelete: () => void;
  onCreateNote: () => void;
  isCreatingNote: boolean;
  onArchive: () => void;
  onUnarchive: () => void;
  onOpenNote: (noteId: string) => void;
}) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={() => !item.isOptimistic && onToggle()}
          className="w-5 h-5 rounded"
          disabled={item.isOptimistic}
        />
        <span className={item.checked ? 'line-through text-gray-500' : 'text-white'}>
          {item.content}
        </span>
        {item.archived && (
          <span className="ml-2 text-xs text-yellow-400 border border-yellow-500/40 px-2 py-0.5 rounded">
            Archived
          </span>
        )}
        {item.isOptimistic && (
          <span className="ml-2 text-gray-400 flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
            <span className="text-xs">Saving…</span>
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {!item.noteId && (
            <button
              onClick={onCreateNote}
              disabled={item.isOptimistic || isCreatingNote}
              className="text-blue-500 hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isCreatingNote ? 'Creating...' : 'Add Note'}
            </button>
          )}
          {item.noteId && (
            <button
              onClick={() => onOpenNote(item.noteId!)}
              className="text-blue-500 hover:text-blue-400"
            >
              Open Note
            </button>
          )}
          {!item.archived && (
            <button
              onClick={onArchive}
              disabled={item.isOptimistic}
              className="text-yellow-500 hover:text-yellow-400 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              Archive
            </button>
          )}
          {item.archived && (
            <button
              onClick={onUnarchive}
              disabled={item.isOptimistic}
              className="text-green-500 hover:text-green-400 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              Unarchive
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={item.isOptimistic}
            className="text-red-500 hover:text-red-400 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
