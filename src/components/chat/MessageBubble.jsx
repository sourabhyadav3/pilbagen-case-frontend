import React from 'react';
import FileAttachment from './FileAttachment';

export default function MessageBubble({ message, isOwnMessage, currentUser }) {
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const senderInitials = message.senderName
    ? message.senderName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const ownInitials = currentUser?.full_name
    ? currentUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'YOU';

  if (isOwnMessage) {
    // SENT MESSAGE (STRICT RIGHT ALIGNED WITH ML-AUTO)
    return (
      <div className="w-full flex flex-col items-end justify-end ml-auto mb-4 animate-fade-in group self-end">
        <div className="flex items-end justify-end gap-3 max-w-[85%] sm:max-w-lg ml-auto">
          {/* Message Bubble */}
          <div className="p-4 rounded-2xl rounded-tr-xs bg-[#0057c7] text-white shadow-lg border border-[#0057c7]/50 relative">
            {message.text && (
              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap font-medium break-words">
                {message.text}
              </p>
            )}
            <FileAttachment attachments={message.attachments} />
          </div>

          {/* Avatar (Right side) */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0057c7] to-[#38bdf8] text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-md border border-white/20">
            {ownInitials}
          </div>
        </div>

        {/* Info below (Right side) */}
        <div className="flex items-center justify-end gap-1.5 mt-1.5 pr-12 text-[10.5px] text-slate-400 font-semibold ml-auto">
          {message.isEncrypted && <span title="Encrypted Payload">🔒</span>}
          <span>{formatTime(message.createdAt)}</span>
          <span className="text-emerald-400 font-bold text-xs">✓✓</span>
        </div>
      </div>
    );
  }

  // RECEIVED MESSAGE (STRICT LEFT ALIGNED WITH MR-AUTO)
  return (
    <div className="w-full flex flex-col items-start justify-start mr-auto mb-4 animate-fade-in group self-start">
      <div className="flex items-end justify-start gap-3 max-w-[85%] sm:max-w-lg mr-auto">
        {/* Avatar (Left side) */}
        <div className="w-9 h-9 rounded-full bg-[#1a2233] border border-white/10 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-md">
          {senderInitials}
        </div>

        {/* Message Bubble */}
        <div className="p-4 rounded-2xl rounded-tl-xs bg-[#161e2e] border border-white/10 text-slate-100 shadow-lg relative">
          {message.text && (
            <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap font-medium break-words">
              {message.text}
            </p>
          )}
          <FileAttachment attachments={message.attachments} />
        </div>
      </div>

      {/* Info below (Left side) */}
      <div className="flex items-center justify-start gap-1.5 mt-1.5 pl-12 text-[10.5px] text-slate-400 font-semibold mr-auto">
        <span className="font-bold text-slate-300">{message.senderName || 'User'}</span>
        <span>•</span>
        <span>{formatTime(message.createdAt)}</span>
        {message.isEncrypted && <span title="Encrypted Payload">🔒</span>}
      </div>
    </div>
  );
}
