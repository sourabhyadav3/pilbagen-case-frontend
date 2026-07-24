import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import TypingIndicator from './TypingIndicator';
import OnlineStatus from './OnlineStatus';

export default function ChatWindow({
  activeConversation,
  messages = [],
  currentUser,
  isTyping,
  typingUserName,
  isOnline,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onUploadAttachment
}) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#070b15] text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-amber-400 shadow-2xl">
          🔒
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-lg font-bold text-white font-display">Pilbågen Encrypted Communication</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select a conversation from the sidebar or click "New Chat" to begin a secure, encrypted real-time session.
          </p>
        </div>
      </div>
    );
  }

  const otherUser = activeConversation.otherParticipants?.[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b15] relative overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#0a0f1d]/90 border-b border-white/10 flex items-center justify-between flex-shrink-0 backdrop-blur-2xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0057c7]/20 border border-white/10 flex items-center justify-center font-extrabold text-white text-sm">
            {activeConversation.title ? activeConversation.title.charAt(0).toUpperCase() : 'C'}
          </div>

          <div>
            <h3 className="text-sm font-bold text-white leading-tight">
              {activeConversation.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {otherUser && <OnlineStatus isOnline={isOnline} size="xs" showText />}
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                🔒 AES-256 Encrypted Payload
              </span>
            </div>
          </div>
        </div>

        {activeConversation.matterNumber && (
          <div className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
            Matter: {activeConversation.matterNumber}
          </div>
        )}
      </div>

      {/* Message History Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs italic">
            No messages yet. Send a message to start the conversation.
          </div>
        ) : (
          messages.map((msg, index) => {
            let tokenUserId = null;
            try {
              const token = localStorage.getItem('vktori_token');
              if (token) {
                const base64Url = token.split('.')[1];
                if (base64Url) {
                  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                  const parsed = JSON.parse(jsonPayload);
                  tokenUserId = parsed.id || parsed.userId || parsed.user_id;
                }
              }
            } catch (e) {}

            const cachedUser = JSON.parse(localStorage.getItem('vktori_user') || '{}');
            const currentUserId = tokenUserId ?? currentUser?.id ?? currentUser?.user_id ?? currentUser?.userId ?? currentUser?.user?.id ?? cachedUser?.id ?? cachedUser?.user_id;
            const senderId = msg?.senderId ?? msg?.sender_id ?? msg?.sender?.id ?? msg?.user_id ?? msg?.userId;
            const isOwnMessage = Boolean(
              currentUserId !== undefined && 
              currentUserId !== null && 
              senderId !== undefined && 
              senderId !== null && 
              Number(currentUserId) === Number(senderId)
            );

            // Date separator check
            const msgDate = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const prevDate = prevMsg?.createdAt ? new Date(prevMsg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            const showDatePill = msgDate && msgDate !== prevDate;

            return (
              <React.Fragment key={msg.id || `${msg.createdAt}-${index}`}>
                {showDatePill && (
                  <div className="flex justify-center my-3">
                    <span className="px-3.5 py-1 rounded-full bg-[#161e2e] text-[#38bdf8] text-[10.5px] font-extrabold border border-white/10 shadow-md">
                      {msgDate === new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) ? 'Today, ' + msgDate : msgDate}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isOwnMessage={isOwnMessage}
                  currentUser={currentUser}
                />
              </React.Fragment>
            );
          })
        )}

        {isTyping && (
          <div className="mb-2">
            <TypingIndicator userName={typingUserName} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Input Bar */}
      <MessageComposer
        onSendMessage={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        onUploadAttachment={onUploadAttachment}
      />
    </div>
  );
}
