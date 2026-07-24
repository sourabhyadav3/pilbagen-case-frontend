import React from 'react';

export default function OnlineStatus({ isOnline, size = 'sm', showText = false }) {
  const dotSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="relative flex items-center justify-center">
        {isOnline && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75`} />
        )}
        <span
          className={`relative inline-flex rounded-full ${dotSizes[size] || dotSizes.sm} ${
            isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-500/50'
          }`}
        />
      </span>
      {showText && (
        <span className={`text-[11px] font-700 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
          {isOnline ? 'Active Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}
