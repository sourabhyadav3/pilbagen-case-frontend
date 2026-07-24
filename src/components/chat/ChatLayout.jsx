import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { initSocketClient, getSocketClient } from '../../services/socket';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

export function ChatLayout({ role }) {
  const ctx = useOutletContext() || {};
  const user = ctx.user || JSON.parse(localStorage.getItem('vktori_user') || '{}');
  const toast = ctx.toast || (() => {});

  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingState, setTypingState] = useState({});
  const [loading, setLoading] = useState(true);

  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Load Contacts & Conversations on Mount
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.chat.listConversations();
      const list = Array.isArray(res.data) ? res.data : [];
      setConversations(list);
      return list;
    } catch (err) {
      console.error('Failed to load conversations:', err);
      return [];
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await api.chat.getContacts();
      setContacts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  }, []);

  // Initialize Socket.IO Client
  useEffect(() => {
    const primaryRole = user.role || (user.roles && user.roles[0]);
    if (primaryRole === 'super_admin' || primaryRole === 'superadmin') return;

    const socket = initSocketClient();
    if (!socket) return;

    const onOnlineList = (userList) => {
      setOnlineUsers(userList || []);
    };

    const onMessageReceived = (msg) => {
      const currentActive = activeConversationRef.current;
      if (currentActive && Number(msg.conversationId) === Number(currentActive.id)) {
        setMessages(prev => {
          // Replace temp message if present, else append
          const tempIdx = prev.findIndex(m => String(m.id).startsWith('temp-') && m.text === msg.text);
          if (tempIdx !== -1) {
            const next = [...prev];
            next[tempIdx] = msg;
            return next;
          }
          if (prev.some(m => Number(m.id) === Number(msg.id))) return prev;
          return [...prev, msg];
        });
        api.chat.markAsRead(msg.conversationId).catch(console.error);
      }
      fetchConversations();
    };

    const onUserTyping = ({ conversationId, userName }) => {
      setTypingState(prev => ({
        ...prev,
        [conversationId]: { isTyping: true, userName }
      }));
    };

    const onUserStopTyping = ({ conversationId }) => {
      setTypingState(prev => ({
        ...prev,
        [conversationId]: { isTyping: false, userName: '' }
      }));
    };

    socket.on('user:online_list', onOnlineList);
    socket.on('chat:message_received', onMessageReceived);
    socket.on('chat:user_typing', onUserTyping);
    socket.on('chat:user_stop_typing', onUserStopTyping);

    return () => {
      socket.off('user:online_list', onOnlineList);
      socket.off('chat:message_received', onMessageReceived);
      socket.off('chat:user_typing', onUserTyping);
      socket.off('chat:user_stop_typing', onUserStopTyping);
    };
  }, [user, fetchConversations]);

  useEffect(() => {
    const primaryRole = user.role || (user.roles && user.roles[0]);
    if (primaryRole === 'super_admin' || primaryRole === 'superadmin') {
      setLoading(false);
      return;
    }

    Promise.all([fetchConversations(), fetchContacts()])
      .then(([convs]) => {
        if (convs && convs.length > 0 && !activeConversationRef.current) {
          setActiveConversation(convs[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [fetchConversations, fetchContacts, user]);

  // Load Messages when Active Conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    api.chat.getMessages(activeConversation.id)
      .then(res => {
        setMessages(Array.isArray(res.data) ? res.data : []);
        const socket = getSocketClient();
        if (socket) {
          socket.emit('chat:join_conversation', { conversationId: activeConversation.id });
        }
        api.chat.markAsRead(activeConversation.id).catch(console.error);
        fetchConversations();
      })
      .catch(err => {
        console.error('Error fetching messages:', err);
        toast('Failed to load messages', 'error');
      });
  }, [activeConversation]);

  // Start New Private Chat
  const handleStartNewChat = async (targetUserId) => {
    try {
      const res = await api.chat.startPrivate(targetUserId);
      const convData = res.data;
      await fetchConversations();
      if (convData) {
        setActiveConversation(convData);
      }
    } catch (err) {
      toast(err.message || 'Failed to start chat', 'error');
    }
  };

  // Send Message with Instant (0ms) Optimistic Update
  const handleSendMessage = async ({ text, attachments }) => {
    if (!activeConversation) return;

    const currentUserId = user?.id || JSON.parse(localStorage.getItem('vktori_user') || '{}')?.id;
    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      id: tempId,
      conversationId: activeConversation.id,
      senderId: currentUserId,
      sender_id: currentUserId,
      senderName: user?.full_name || 'You',
      senderRole: user?.role,
      text,
      attachments: attachments || [],
      isEncrypted: true,
      createdAt: new Date().toISOString()
    };

    // Instant append on sender UI
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const socket = getSocketClient();
      if (socket && socket.connected) {
        socket.emit('chat:send_message', {
          conversationId: activeConversation.id,
          text,
          attachments
        }, (ack) => {
          if (ack?.success && ack?.message) {
            setMessages(prev => prev.map(m => m.id === tempId ? ack.message : m));
            fetchConversations();
          }
        });
      } else {
        const res = await api.chat.sendMessage(activeConversation.id, text, attachments);
        if (res.data) {
          setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
          fetchConversations();
        }
      }
    } catch (err) {
      toast('Failed to send message', 'error');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // Typing triggers
  const handleTypingStart = () => {
    if (!activeConversation) return;
    const socket = getSocketClient();
    if (socket) {
      socket.emit('chat:typing_start', { conversationId: activeConversation.id });
    }
  };

  const handleTypingStop = () => {
    if (!activeConversation) return;
    const socket = getSocketClient();
    if (socket) {
      socket.emit('chat:typing_stop', { conversationId: activeConversation.id });
    }
  };

  // File Upload Handler
  const handleUploadAttachment = async (file) => {
    return await api.chat.uploadAttachment(file);
  };

  const primaryRole = user.role || (user.roles && user.roles[0]);
  if (primaryRole === 'super_admin' || primaryRole === 'superadmin') {
    return (
      <div className="p-12 text-center text-red-400 font-bold text-sm bg-white/5 rounded-3xl border border-red-500/20 max-w-md mx-auto my-12">
        🚫 Super Admin is not authorized to access the Encrypted Chat module.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Initializing Encrypted Chat...</p>
        </div>
      </div>
    );
  }

  const activeOtherUser = activeConversation?.otherParticipants?.[0];
  const isOnline = activeOtherUser ? onlineUsers.includes(Number(activeOtherUser.id)) : false;
  const typingInfo = typingState[activeConversation?.id] || {};

  return (
    <div className="flex h-[calc(100vh-100px)] rounded-3xl border border-white/10 overflow-hidden bg-[#0a0f1d] shadow-2xl animate-fade-in">
      <ChatSidebar
        conversations={conversations}
        contacts={contacts}
        activeConversationId={activeConversation?.id}
        onSelectConversation={setActiveConversation}
        onStartNewChat={handleStartNewChat}
        onlineUsers={onlineUsers}
        userRole={role}
      />

      <ChatWindow
        activeConversation={activeConversation}
        messages={messages}
        currentUser={user}
        isTyping={typingInfo.isTyping}
        typingUserName={typingInfo.userName}
        isOnline={isOnline}
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        onUploadAttachment={handleUploadAttachment}
      />
    </div>
  );
}

export default ChatLayout;
