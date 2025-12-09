import React from 'react';

/**
 * Компонент скелетон-загрузчика для улучшения perceived performance
 */
export default function SkeletonLoader({ type = 'table', count = 5 }) {
  if (type === 'table') {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700/50 rounded w-1/4"></div>
                <div className="h-3 bg-gray-700/30 rounded w-1/2"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-24 bg-gray-700/50 rounded"></div>
                <div className="h-8 w-24 bg-gray-700/50 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 bg-gray-700/50 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700/30 rounded w-full"></div>
          <div className="h-4 bg-gray-700/30 rounded w-5/6"></div>
          <div className="h-4 bg-gray-700/30 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-700/30 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-700/50 rounded w-full"></div>
    </div>
  );
}
