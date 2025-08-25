'use client';

import { formatDistance } from 'date-fns';
import React, { ReactNode } from 'react';

import { LayoutMode } from '@/(panel)/notes/page';

interface BaseCardProps {
  layout?: LayoutMode;
  accentClassName?: string;
  title: string;
  titleIcon?: ReactNode;
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
  createdAt,
  updatedAt,
  headerExtra,
  body,
  footerButtons,
}: BaseCardProps) {
  const lastModified = updatedAt || createdAt;

  if (layout === 'grid') {
    return (
      <div
        className={`bg-gray-800 rounded-lg shadow-md overflow-hidden h-full flex flex-col ${accentClassName ? `border-l-4 ${accentClassName}` : ''}`}
      >
        <div className="p-4 border-b border-gray-700 flex items-start">
          <div className="flex-grow">
            <div className="flex items-center">
              {titleIcon}
              <h3 className="text-xl font-semibold text-red-400 line-clamp-2">{title}</h3>
            </div>
            {lastModified && (
              <p className="text-sm text-gray-400 mt-1">
                Last modified{' '}
                {formatDistance(new Date(lastModified), new Date(), { addSuffix: true })}
              </p>
            )}
          </div>
          {headerExtra}
        </div>
        {body && <div className="p-4 flex-grow">{body}</div>}
        <div className="p-4 bg-gray-950 flex justify-end gap-2">{footerButtons}</div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row ${accentClassName ? `border-l-4 ${accentClassName}` : ''}`}
    >
      <div className="p-4 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-700">
        <div className="flex items-start mb-2 justify-between gap-3">
          <div className="flex items-center">
            {titleIcon}
            <h3 className="text-xl font-semibold text-red-400">{title}</h3>
          </div>
          {headerExtra}
        </div>
        {lastModified && (
          <p className="text-sm text-gray-400">
            Last modified {formatDistance(new Date(lastModified), new Date(), { addSuffix: true })}
          </p>
        )}
        {createdAt && (
          <p className="text-sm text-gray-400 mt-1">
            Created {formatDistance(new Date(createdAt), new Date(), { addSuffix: true })}
          </p>
        )}
      </div>

      <div className="p-4 flex-grow flex flex-col">
        {body && <div>{body}</div>}
        <div className={`${body ? 'mt-4' : ''} flex justify-end gap-2`}>{footerButtons}</div>
      </div>
    </div>
  );
}
