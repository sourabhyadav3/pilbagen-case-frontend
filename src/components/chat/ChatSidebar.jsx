import React, { useState } from 'react';
import ConversationList from './ConversationList';

export default function ChatSidebar({
  conversations = [],
  contacts = [],
  activeConversationId,
  onSelectConversation,
  onStartNewChat,
  onlineUsers = [],
  userRole
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);

  return (
    <div className="w-full lg:w-80 bg-[#0a0f1d]/90 border-r border-white/10 flex flex-col h-full flex-shrink-0 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <h3 className="text-base font-extrabold text-white font-display">Encrypted Chat</h3>
          </div>

          <button
            type="button"
            onClick={() => setShowContactPicker(true)}
            className="px-3 py-1.5 rounded-xl bg-[#0057c7] hover:bg-[#004bb1] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <span>+</span> New Chat
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations or contacts..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[#0057c7] transition-all placeholder:text-slate-500 font-medium"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onlineUsers={onlineUsers}
        searchQuery={searchQuery}
      />

      {/* Contact Picker Modal */}
      {showContactPicker && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1a2233] border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">Start New Conversation</h3>
              <button
                type="button"
                onClick={() => setShowContactPicker(false)}
                className="text-slate-400 hover:text-white font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select an authorized team member or client within your agency to initiate an encrypted session.
            </p>

            <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-white/5">
              {contacts.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-500 italic">No eligible contacts found.</p>
              ) : (
                contacts.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onStartNewChat(c.id);
                      setShowContactPicker(false);
                    }}
                    className="p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0057c7]/20 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-[#38bdf8] transition-colors">{c.name}</p>
                        <p className="text-[10px] text-slate-400">{c.subtitle || c.role}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#0057c7]/20 text-[#38bdf8]">
                      {c.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
