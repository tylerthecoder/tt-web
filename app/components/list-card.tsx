'use client';

import React from 'react';
import type { List } from 'tt-services';

interface ListCardProps {
  list: List;
}

export default function ListCard({ list }: ListCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 min-w-0">
      <div className="flex items-center gap-2 mb-3 min-w-0">
        <h3 className="text-lg font-semibold text-white truncate flex-1 min-w-0">{list.name}</h3>
      </div>

      <div className="text-sm text-gray-400 mb-2">
        {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
      </div>

      {list.items.length > 0 && (
        <div className="space-y-1">
          {list.items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-xs text-gray-300 min-w-0">
              <div
                className={`w-3 h-3 flex-shrink-0 rounded border ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}
              ></div>
              <span
                className={`${item.checked ? 'line-through text-gray-500' : ''} truncate flex-1 min-w-0`}
              >
                {item.content}
              </span>
            </div>
          ))}
          {list.items.length > 3 && (
            <div className="text-xs text-gray-500">+{list.items.length - 3} more</div>
          )}
        </div>
      )}
    </div>
  );
}
