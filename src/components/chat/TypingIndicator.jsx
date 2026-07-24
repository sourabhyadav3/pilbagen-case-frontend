import React from 'react';

export default function TypingIndicator({ userName }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[#38bdf8] italic py-1 px-3 bg-white/5 rounded-full w-max border border-white/5 animate-fade-in">
      <span className="font-semibold text-white/90">{userName || 'Someone'}</span> is typing
      <div className="flex items-center gap-1 ml-1">
        <span className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full animate-bounce" />
      </div>
    </div>
  );
}
