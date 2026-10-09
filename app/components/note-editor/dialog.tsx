'use client';

import { type ReactNode, useLayoutEffect, useRef } from 'react';

/** Native modal semantics provide focus containment, Escape and focus restoration. */
export function EditorDialog({
  open,
  onClose,
  label,
  busy = false,
  children,
  className = '',
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  busy?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={`m-auto border-0 bg-transparent p-0 text-inherit backdrop:bg-black/60 ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
