import React from 'react';
import OnlineStatus from './OnlineStatus';

export default function ConversationList({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onlineUsers = [],
  searchQuery = ''
}) {
  const filteredConvs = conversations.filter(c =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.otherParticipants || []).some(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (filteredConvs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs italic">
        No active conversations found.
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5 overflow-y-auto custom-scrollbar flex-1">
      {filteredConvs.map((conv) => {
        const isActive = Number(conv.id) === Number(activeConversationId);
        const otherUser = conv.otherParticipants?.[0];
        const isOnline = otherUser ? onlineUsers.includes(Number(otherUser.id)) : false;

        return (
          <div
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            className={`p-4 flex items-center gap-3.5 cursor-pointer transition-all relative group ${
              isActive
                ? 'bg-gradient-to-r from-[#0057c7]/20 to-transparent border-l-4 border-[#0057c7]'
                : 'hover:bg-white/[0.04]'
            }`}
          >
            {/* Avatar & Online Dot */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-[#0057c7]/20 border border-white/10 flex items-center justify-center font-extrabold text-white text-sm shadow-md">
                {conv.title ? conv.title.charAt(0).toUpperCase() : 'C'}
              </div>
              {otherUser && (
                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineStatus isOnline={isOnline} size="xs" />
                </div>
              )}
            </div>

            {/* Title & Preview */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <h4 className={`text-xs font-bold truncate ${isActive ? 'text-white font-extrabold' : 'text-slate-200'}`}>
                  {conv.title}
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                  {formatTime(conv.updatedAt)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-400 truncate leading-tight">
                  {conv.lastMessage ? conv.lastMessage.text : <span className="italic text-slate-500">Encrypted session started</span>}
                </p>

                {conv.unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#0057c7] text-white text-[10px] font-black flex-shrink-0 shadow-md">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
