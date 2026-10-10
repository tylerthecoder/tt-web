'use client';

import {
  Download as FaDownload,
  ExternalLink as FaExternalLinkAlt,
  FileSymlink as FaGoogle,
  LoaderCircle as FaSpinner,
  X as FaTimes,
  Upload as FaUpload,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { isGoogleNote, type Note } from 'tt-services/src/client-index.ts';
import {
  assignGoogleDocIdToNote,
  pullContentFromGoogleDoc,
  pushNoteToGoogleDrive,
} from '@/(panel)/actions';

import { parseGoogleDocId } from './google-doc-link';

// Hook for Google sync functionality
export const useGoogleSync = (
  noteId: string,
  note?: Note | null,
  beforeAction?: () => Promise<void>,
  afterAction?: () => void,
) => {
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
      await beforeAction?.();
      const updatedNote = await pullContentFromGoogleDoc(noteId);
      // Refresh the page to show the updated content
      window.location.reload();
      return updatedNote;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to pull content from Google Doc';
      setError(errorMessage);
      return null;
    } finally {
      setIsPulling(false);
      afterAction?.();
    }
  }, [noteId, beforeAction, afterAction]);

  const pushToGoogle = useCallback(
    async (options: { convertToGoogleNote?: boolean; tabName?: string } = {}) => {
      setIsPushing(true);
      setError(null);
      setPushSuccess(null);

      try {
        await beforeAction?.();
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
        afterAction?.();
      }
    },
    [noteId, note, beforeAction, afterAction],
  );

  const assignGoogleDoc = useCallback(
    async (googleDocId: string) => {
      setIsPushing(true);
      setError(null);
      try {
        await beforeAction?.();
        await assignGoogleDocIdToNote(noteId, googleDocId);
        window.location.reload(); // Refresh to show updated state
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to assign Google Doc';
        setError(errorMsg);
        return false;
      } finally {
        setIsPushing(false);
        afterAction?.();
      }
    },
    [noteId, beforeAction, afterAction],
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
  beforeAction?: () => Promise<void>;
  afterAction?: () => void;
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
}

function GoogleSyncModal({
  isOpen,
  onClose,
  noteId,
  beforeAction,
  afterAction,
}: GoogleSyncModalProps) {
  const googleSync = useGoogleSync(noteId, undefined, beforeAction, afterAction);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [documentLink, setDocumentLink] = useState('');
  const documentId = parseGoogleDocId(documentLink);

  const handleCreateNewDoc = async () => {
    const result = await googleSync.pushToGoogle({
      convertToGoogleNote: true,
    });

    if (result.success) {
      onClose();
    }
  };

  const handleAssignDoc = async (docId: string) => {
    const assigned = await googleSync.assignGoogleDoc(docId);
    if (assigned) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FaGoogle size="1em" className="text-red-400" />
            {showDocSelector ? 'Select Google Doc' : 'Sync with Google Docs'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes size="1em" />
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
                type="button"
                onClick={handleCreateNewDoc}
                disabled={googleSync.isSyncing}
                className="w-full p-4 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white flex items-center gap-3 transition-colors"
              >
                {googleSync.isPushing ? (
                  <FaSpinner size="1em" className="animate-spin" />
                ) : (
                  <FaUpload size="1em" />
                )}
                <div className="text-left">
                  <div className="font-medium">Create New Google Doc</div>
                  <div className="text-sm text-green-200">
                    Push this note's content to a new Google Doc
                  </div>
                </div>
              </button>

              {/* Sync with existing Google Doc */}
              <button
                type="button"
                onClick={() => setShowDocSelector(true)}
                disabled={googleSync.isSyncing}
                className="w-full p-4 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white flex items-center gap-3 transition-colors"
              >
                <FaGoogle size="1em" />
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
                type="button"
                onClick={() => setShowDocSelector(false)}
                className="text-blue-400 hover:text-blue-300 text-sm mb-3"
              >
                ← Back to options
              </button>

              <label className="block text-sm text-gray-300" htmlFor="google-document-link">
                Google Doc link or ID
              </label>
              <input
                id="google-document-link"
                value={documentLink}
                onChange={(event) => setDocumentLink(event.target.value)}
                placeholder="https://docs.google.com/document/d/…"
                className="mt-2 w-full min-w-0 rounded-sm border border-gray-600 bg-gray-700 px-3 py-3 text-base text-white"
              />
              <p className="my-3 text-sm text-gray-400">
                Use a document this app has permission to access.
              </p>
              <button
                type="button"
                onClick={() => documentId && handleAssignDoc(documentId)}
                disabled={!documentId || googleSync.isPushing}
                className="editor-button"
              >
                {googleSync.isPushing ? 'Connecting…' : 'Connect document'}
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {googleSync.error && (
          <div className="mt-4 p-3 bg-red-900 border border-red-500 rounded-sm text-red-200 text-sm">
            {googleSync.error}
          </div>
        )}

        {/* Success message */}
        {googleSync.pushSuccess && (
          <div className="mt-4 p-3 bg-green-900 border border-green-500 rounded-sm text-green-200 text-sm">
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
  beforeAction?: () => Promise<void>;
  afterAction?: () => void;
}

export function GoogleSyncControls({
  note,
  className = '',
  beforeAction,
  afterAction,
}: GoogleSyncControlsProps) {
  const googleSync = useGoogleSync(note.id, note, beforeAction, afterAction);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isGoogle = isGoogleNote(note);

  if (!isGoogle) {
    // Not a Google note - show option to make it one
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-gray-400">Not synced with Google</span>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
        >
          <FaGoogle size={12} />
          Sync with Google
        </button>

        <GoogleSyncModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          beforeAction={beforeAction}
          afterAction={afterAction}
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
        type="button"
        onClick={googleSync.pullFromGoogle}
        disabled={googleSync.isSyncing}
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
        type="button"
        onClick={() => googleSync.pushToGoogle()}
        disabled={googleSync.isSyncing}
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
