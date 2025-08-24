'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  FaDownload,
  FaExternalLinkAlt,
  FaGoogle,
  FaSpinner,
  FaTimes,
  FaUpload,
} from 'react-icons/fa';
import { isGoogleNote, Note } from 'tt-services/src/client-index.ts';

import { getAllTags, pushNoteToGoogleDrive } from '@/(panel)/actions';
import { assignGoogleDocIdToNote, pullContentFromGoogleDoc } from '@/(panel)/actions';

// Hook for Google sync functionality
export const useGoogleSync = (noteId: string, note?: Note | null) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushSuccess, setPushSuccess] = useState<{ url: string; isNew: boolean } | null>(null);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (pushSuccess) {
      const timer = setTimeout(() => setPushSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [pushSuccess]);

  const pullFromGoogle = useCallback(async () => {
    setIsPulling(true);
    setError(null);
    setPushSuccess(null);

    try {
      const updatedNote = await pullContentFromGoogleDoc(noteId);
      // Refresh the page to show the updated content
      window.location.reload();
      return updatedNote;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to pull content from Google Doc';
      setError(errorMessage);
      throw err;
    } finally {
      setIsPulling(false);
    }
  }, [noteId]);

  const pushToGoogle = useCallback(
    async (
      options: {
        convertToGoogleNote?: boolean;
        tabName?: string;
      } = {},
    ) => {
      setIsPushing(true);
      setError(null);
      setPushSuccess(null);

      try {
        const isGoogle = note ? isGoogleNote(note) : false;
        const result = await pushNoteToGoogleDrive(noteId, {
          convertToGoogleNote: options.convertToGoogleNote ?? !isGoogle,
          tabName:
            options.tabName ||
            (isGoogle ? `Update - ${new Date().toLocaleDateString()}` : undefined),
        });

        if (result.success) {
          setPushSuccess({
            url: (result as any).googleDocUrl || '',
            isNew: (result as any).isNewDocument || false,
          });
          return {
            success: true,
            googleDocUrl: (result as any).googleDocUrl,
            isNewDocument: (result as any).isNewDocument,
          };
        } else {
          const errorMsg = result.error || 'Failed to push to Google Drive';
          setError(errorMsg);
          return {
            success: false,
            error: errorMsg,
          };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to push to Google Drive';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      } finally {
        setIsPushing(false);
      }
    },
    [noteId, note],
  );

  const assignGoogleDoc = useCallback(
    async (googleDocId: string) => {
      setIsPushing(true);
      setError(null);
      try {
        await assignGoogleDocIdToNote(noteId, googleDocId);
        window.location.reload(); // Refresh to show updated state
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to assign Google Doc';
        setError(errorMsg);
      } finally {
        setIsPushing(false);
      }
    },
    [noteId],
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setPushSuccess(null);
  }, []);

  const isSyncing = isPulling || isPushing;
  const isGoogleNoteFlag = note ? isGoogleNote(note) : false;

  return {
    // Actions
    pullFromGoogle,
    pushToGoogle,
    assignGoogleDoc,
    clearMessages,

    // State
    isPulling,
    isPushing,
    isSyncing,
    error,
    pushSuccess,
    isGoogleNote: isGoogleNoteFlag,

    // Computed helpers
    canPull: isGoogleNoteFlag,
    pushButtonText: isGoogleNoteFlag ? 'Add Tab to Google Doc' : 'Push to Google Drive',
    pullButtonText: isPulling ? 'Pulling...' : 'Pull from Google',
  };
};

// Combined Google Sync Modal (handles both create new and sync existing)
interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
}

function GoogleSyncModal({ isOpen, onClose, noteId }: GoogleSyncModalProps) {
  const googleSync = useGoogleSync(noteId);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [googleDocs, setGoogleDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Google Docs when switching to selector view
  useEffect(() => {
    if (showDocSelector && googleDocs.length === 0) {
      fetchGoogleDocs();
    }
  }, [showDocSelector, googleDocs.length]);

  const fetchGoogleDocs = async () => {
    setLoading(true);
    try {
      // This would need to be implemented as a server action
      // const docs = await getGoogleDocs();
      // setGoogleDocs(docs);

      // For now, mock some data
      setGoogleDocs([
        { id: '1', name: 'My Document 1', modifiedTime: '2024-01-15' },
        { id: '2', name: 'Project Notes', modifiedTime: '2024-01-14' },
        { id: '3', name: 'Meeting Notes', modifiedTime: '2024-01-13' },
      ]);
    } catch (err) {
      console.error('Failed to fetch Google Docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewDoc = async () => {
    const result = await googleSync.pushToGoogle({
      convertToGoogleNote: true,
    });

    if (result.success) {
      onClose();
    }
  };

  const handleAssignDoc = async (docId: string) => {
    await googleSync.assignGoogleDoc(docId);
    if (!googleSync.error) {
      onClose();
    }
  };

  const filteredDocs = googleDocs.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FaGoogle className="text-red-400" />
            {showDocSelector ? 'Select Google Doc' : 'Sync with Google Docs'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes />
          </button>
        </div>

        {!showDocSelector ? (
          // Initial choice screen
          <>
            <p className="text-gray-300 mb-6">
              Choose how you'd like to sync this note with Google Docs:
            </p>

            <div className="space-y-3">
              {/* Create new Google Doc */}
              <button
                onClick={handleCreateNewDoc}
                disabled={googleSync.isPushing}
                className="w-full p-4 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white flex items-center gap-3 transition-colors"
              >
                {googleSync.isPushing ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                <div className="text-left">
                  <div className="font-medium">Create New Google Doc</div>
                  <div className="text-sm text-green-200">
                    Push this note's content to a new Google Doc
                  </div>
                </div>
              </button>

              {/* Sync with existing Google Doc */}
              <button
                onClick={() => setShowDocSelector(true)}
                disabled={googleSync.isPushing}
                className="w-full p-4 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white flex items-center gap-3 transition-colors"
              >
                <FaGoogle />
                <div className="text-left">
                  <div className="font-medium">Sync with Existing Doc</div>
                  <div className="text-sm text-blue-200">
                    Connect this note to an existing Google Doc
                  </div>
                </div>
              </button>
            </div>
          </>
        ) : (
          // Google Doc selector screen
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <button
                onClick={() => setShowDocSelector(false)}
                className="text-blue-400 hover:text-blue-300 text-sm mb-3"
              >
                ← Back to options
              </button>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Google Docs..."
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin mr-2" />
                  Loading Google Docs...
                </div>
              ) : filteredDocs.length > 0 ? (
                <div className="space-y-2">
                  {filteredDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleAssignDoc(doc.id)}
                      disabled={googleSync.isPushing}
                      className="w-full p-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-left transition-colors"
                    >
                      <div className="font-medium text-white">{doc.name}</div>
                      <div className="text-sm text-gray-400">
                        Modified {new Date(doc.modifiedTime).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">No Google Docs found</div>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {googleSync.error && (
          <div className="mt-4 p-3 bg-red-900 border border-red-500 rounded text-red-200 text-sm">
            {googleSync.error}
          </div>
        )}

        {/* Success message */}
        {googleSync.pushSuccess && (
          <div className="mt-4 p-3 bg-green-900 border border-green-500 rounded text-green-200 text-sm">
            Successfully created Google Doc!{' '}
            <a
              href={googleSync.pushSuccess.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Open it here
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Google Sync Controls Component
interface GoogleSyncControlsProps {
  note: Note;
  className?: string;
}

export function GoogleSyncControls({ note, className = '' }: GoogleSyncControlsProps) {
  const googleSync = useGoogleSync(note.id, note);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isGoogle = isGoogleNote(note);

  if (!isGoogle) {
    // Not a Google note - show option to make it one
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-gray-400">Not synced with Google</span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
        >
          <FaGoogle size={12} />
          Sync with Google
        </button>

        <GoogleSyncModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          noteId={note.id}
        />
      </div>
    );
  }

  // Is a Google note - show sync controls
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Google Doc link */}
      <a
        href={`https://docs.google.com/document/d/${(note as any).googleDocId}/edit`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        title="Open in Google Docs"
      >
        <FaExternalLinkAlt size={10} />
        Google Doc
      </a>

      {/* Pull from Google button */}
      <button
        onClick={googleSync.pullFromGoogle}
        disabled={googleSync.isPulling}
        className="text-xs text-blue-400 hover:text-blue-300 underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        title="Pull latest content from Google Doc"
      >
        {googleSync.isPulling ? (
          <FaSpinner className="animate-spin" size={10} />
        ) : (
          <FaDownload size={10} />
        )}
        {googleSync.pullButtonText}
      </button>

      {/* Push to Google button */}
      <button
        onClick={() => googleSync.pushToGoogle()}
        disabled={googleSync.isPushing}
        className="text-xs text-green-400 hover:text-green-300 underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        title="Push current content to Google Doc as new section"
      >
        {googleSync.isPushing ? (
          <FaSpinner className="animate-spin" size={10} />
        ) : (
          <FaUpload size={10} />
        )}
        {googleSync.pushButtonText}
      </button>

      {/* Success message */}
      {googleSync.pushSuccess && (
        <a
          href={googleSync.pushSuccess.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-green-400 hover:text-green-300 underline flex items-center gap-1"
        >
          <FaGoogle size={10} />
          {googleSync.pushSuccess.isNew ? 'Created' : 'Updated'}
        </a>
      )}

      {/* Error message */}
      {googleSync.error && (
        <span className="text-xs text-red-400" title={googleSync.error}>
          Error: {googleSync.error.substring(0, 30)}...
        </span>
      )}
    </div>
  );
}
