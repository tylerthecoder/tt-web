'use client';

import { formatDistance } from 'date-fns';
import React, { ReactNode } from 'react';

import type { LayoutMode } from '@/(panel)/notes/page';

interface BaseCardProps {
  layout?: LayoutMode;
  accentClassName?: string;
  title: string;
  titleIcon?: ReactNode;
  typeLabel?: string;
  createdAt?: string;
  updatedAt?: string;
  headerExtra?: ReactNode;
  body?: ReactNode;
  footerButtons?: ReactNode;
}

export function BaseCard({
  layout = 'grid',
  accentClassName,
  title,
  titleIcon,
  typeLabel,
  createdAt,
  updatedAt,
  headerExtra,
  body,
  footerButtons,
}: BaseCardProps) {
  const lastModified = updatedAt || createdAt;
  const modifiedLabel = lastModified
    ? formatDistance(new Date(lastModified), new Date(), { addSuffix: true })
    : null;
  const accentClasses = accentClassName
    ? `border-l-2 ${accentClassName}`
    : 'border-l-2 border-transparent';

  if (layout === 'grid') {
    return (
      <div
        className={`group h-full overflow-hidden rounded-lg border border-gray-700/80 bg-gray-800/90 shadow-sm transition-colors hover:border-gray-600 ${accentClasses}`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex min-h-[104px] items-start gap-3">
            <div className="mt-1 shrink-0 text-red-400">{titleIcon}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-red-300">
                  {title}
                </h3>
                {typeLabel && (
                  <span className="shrink-0 rounded-md bg-gray-700/80 px-2 py-1 text-[11px] font-medium text-gray-300">
                    {typeLabel}
                  </span>
                )}
              </div>
              {modifiedLabel && (
                <p className="mt-2 text-sm leading-5 text-gray-400">Modified {modifiedLabel}</p>
              )}
            </div>
          </div>
          {headerExtra && <div className="mt-3 min-h-[28px]">{headerExtra}</div>}
          {body && <div className="mt-4 flex-1">{body}</div>}
          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-700/70 pt-3">
            {footerButtons}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group overflow-hidden rounded-lg border border-gray-700/80 bg-gray-800/90 shadow-sm transition-colors hover:border-gray-600 ${accentClasses}`}
    >
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-1 shrink-0 text-red-400">{titleIcon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="min-w-0 truncate text-lg font-semibold leading-snug text-red-300">
                {title}
              </h3>
              {typeLabel && (
                <span className="rounded-md bg-gray-700/80 px-2 py-1 text-[11px] font-medium text-gray-300">
                  {typeLabel}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
              {modifiedLabel && <span>Modified {modifiedLabel}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          {headerExtra}
          <div className="flex flex-wrap justify-start gap-2 md:justify-end">{footerButtons}</div>
        </div>
      </div>
    </div>
  );
}
