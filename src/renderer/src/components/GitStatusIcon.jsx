import React from 'react';

export default function GitStatusIcon({ status, commitsCount, branch, error }) {
  const getIconAndColor = () => {
    switch (status) {
      case 'up-to-date':
        return {
          icon: '✅',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-400',
          tooltip: `${branch}: актуальная версия`
        };
      
      case 'behind':
        return {
          icon: '🔽',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          textColor: 'text-yellow-400',
          tooltip: `${branch}: отстает на ${commitsCount} ${commitsCount === 1 ? 'коммит' : 'коммитов'}`
        };
      
      case 'error':
        return {
          icon: '⚠️',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          tooltip: error || `${branch}: ошибка подключения (проверьте VPN)`
        };
      
      default:
        return {
          icon: '⏳',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30',
          textColor: 'text-gray-400',
          tooltip: `${branch}: проверка...`
        };
    }
  };

  const { icon, bgColor, borderColor, textColor, tooltip } = getIconAndColor();

  return (
    <div
      className={`
        inline-flex items-center gap-1 px-2 py-1
        ${bgColor} border ${borderColor} ${textColor}
        rounded text-xs font-mono
        transition-all duration-200
        hover:scale-105
      `}
      title={tooltip}
    >
      <span className="text-sm">{icon}</span>
      <span className="font-semibold">{branch}</span>
      {commitsCount > 0 && (
        <span className="text-xs opacity-80">-{commitsCount}</span>
      )}
    </div>
  );
}

