import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import FolderList from './components/FolderList.jsx';
import EmailList from './components/EmailList.jsx';
import EmailPreview from './components/EmailPreview.jsx';
import TitanComposeEmailModal from './components/TitanComposeEmailModal.jsx';
import { useToast } from '../../components/UI.jsx';

export default function TitanEmailModule() {
  const [folders] = useState([
    { id: 'inbox', label: 'Inbox', icon: '📥' },
    { id: 'sent', label: 'Sent', icon: '📤' },
    { id: 'drafts', label: 'Drafts', icon: '📝' },
    { id: 'trash', label: 'Trash', icon: '🗑️' },
    { id: 'spam', label: 'Spam', icon: '🚫' },
    { id: 'archive', label: 'Archive', icon: '📦' },
    { id: 'starred', label: 'Starred', icon: '⭐' },
    { id: 'flagged', label: 'Flagged', icon: '🚩' },
  ]);
  const currentUser = JSON.parse(localStorage.getItem('vktori_user') || 'null');
  const userId = currentUser?.id || 1;
  const localStorageKey = `vktori_custom_email_folders_${userId}`;

  const [customFolders, setCustomFolders] = useState(() => {
    return JSON.parse(localStorage.getItem(`vktori_custom_email_folders_${userId}`) || '[]');
  });
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [folderCounts, setFolderCounts] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [threadMessages, setThreadMessages] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const [titanAccounts, setTitanAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [accountsLoading, setAccountsLoading] = useState(true);

  // ── Fetch Accounts ──────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    try {
      setAccountsLoading(true);
      const res = await api.titanEmail.getAccounts();
      const accounts = res.data || [];
      setTitanAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedAccountId(prev => {
          if (prev && accounts.some(a => a.id === prev)) return prev;
          return accounts[0].id;
        });
      } else {
        setSelectedAccountId(null);
      }
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // ── Fetch Messages ──────────────────────────────────────
  const fetchMessages = useCallback(async (folder, search = '', accountId) => {
    if (!accountId) return;
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (folder) queryParams.set('folder', folder);
      if (search) queryParams.set('search', search);
      queryParams.set('accountId', accountId);
      const res = await api.request(`/titan-email/messages?${queryParams.toString()}`);
      if (res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      toast('Failed to load emails', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ── Fetch Folder Counts ─────────────────────────────────
  const fetchFolderCounts = useCallback(async (accountId) => {
    if (!accountId) return;
    try {
      const res = await api.request(`/titan-email/folder-counts?accountId=${accountId}`);
      if (res.data) setFolderCounts(res.data);
    } catch (err) {
      // Silently fail
    }
  }, []);

  // ── Fetch Custom Folders ────────────────────────────────
  const fetchCustomFolders = useCallback(async (accountId) => {
    if (!accountId) return;
    try {
      const res = await api.request(`/titan-email/custom-folders?accountId=${accountId}`);
      if (res.data) {
        setCustomFolders(prev => {
          const stored = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
          const all = new Set([...stored, ...res.data]);
          const merged = Array.from(all);
          localStorage.setItem(localStorageKey, JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      // Silently fail
    }
  }, [localStorageKey]);

  // ── Fetch Thread ────────────────────────────────────────
  const fetchThread = useCallback(async (emailId, accountId) => {
    try {
      const query = accountId ? `?accountId=${accountId}` : '';
      const res = await api.request(`/titan-email/messages/${emailId}/thread${query}`);
      if (res.data && res.data.length > 1) {
        setThreadMessages(res.data);
      } else {
        setThreadMessages([]);
      }
    } catch (err) {
      setThreadMessages([]);
    }
  }, []);

  // ── Refresh helper ──────────────────────────────────────
  const refresh = useCallback(() => {
    fetchMessages(selectedFolder, searchQuery, selectedAccountId);
    fetchFolderCounts(selectedAccountId);
    fetchCustomFolders(selectedAccountId);
  }, [selectedFolder, searchQuery, selectedAccountId, fetchMessages, fetchFolderCounts, fetchCustomFolders]);

  useEffect(() => {
    if (selectedAccountId) {
      refresh();
    } else {
      setMessages([]);
      setFolderCounts({});
    }
    const interval = setInterval(() => {
      if (selectedAccountId) refresh();
    }, 120000);
    return () => clearInterval(interval);
  }, [selectedFolder, searchQuery, selectedAccountId, refresh]);

  // ── Manual Sync Action ──────────────────────────────────
  const handleSync = async () => {
    if (!selectedAccountId) return;
    try {
      setIsSyncing(true);
      await api.request('/titan-email/sync', {
        method: 'POST',
        body: { accountId: selectedAccountId }
      });
      toast('Sync complete! New messages downloaded.', 'success');
      refresh();
    } catch (err) {
      toast('Sync failed. Please check your credentials.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Create Custom Folder Callback ───────────────────────
  const handleCreateCustomFolder = (folderName) => {
    const cleanName = folderName.trim().toLowerCase();
    if (!cleanName) return;
    const exists = folders.some(f => f.id === cleanName) || customFolders.includes(cleanName);
    if (exists) {
      setSelectedFolder(cleanName);
      return;
    }
    // Add locally and save to localStorage
    setCustomFolders(prev => {
      const next = [...prev, cleanName];
      localStorage.setItem(localStorageKey, JSON.stringify(next));
      return next;
    });
    setSelectedFolder(cleanName);
    toast(`Custom folder "${folderName}" created`, 'success');
  };

  // ── Auto Mark Read on Select ────────────────────────────
  const handleSelectEmail = useCallback(async (email) => {
    setSelectedEmail(email);
    setThreadMessages([]);
    if (email && !email.is_read) {
      try {
        const query = selectedAccountId ? `?accountId=${selectedAccountId}` : '';
        await api.request(`/titan-email/messages/${email.id}/state${query}`, {
          method: 'PUT',
          body: { is_read: true },
        });
        // Update local state
        setMessages(prev => prev.map(m => m.id === email.id ? { ...m, is_read: true, read_at: new Date().toISOString() } : m));
        email.is_read = true;
        fetchFolderCounts(selectedAccountId);
      } catch (err) {
        // Silently fail
      }
    }
    // Fetch thread for this email
    if (email) fetchThread(email.id, selectedAccountId);
  }, [fetchThread, fetchFolderCounts, selectedAccountId]);

  // ── Handle Single Actions ───────────────────────────────
  const handleAction = async (action, email) => {
    try {
      const query = selectedAccountId ? `?accountId=${selectedAccountId}` : '';
      if (action === 'delete') {
        await api.request(`/titan-email/messages/${email.id}${query}`, { method: 'DELETE' });
        toast(email.folder === 'trash' ? 'Message permanently deleted' : 'Message moved to Trash', 'success');
        setSelectedEmail(null);
        refresh();
      } else if (action === 'restore') {
        await api.request(`/titan-email/messages/${email.id}/restore${query}`, { method: 'PUT' });
        toast('Message restored to Inbox', 'success');
        setSelectedEmail(null);
        refresh();
      } else if (action === 'archive') {
        await api.request(`/titan-email/messages/${email.id}/move${query}`, { method: 'PUT', body: { folder: 'archive' } });
        toast('Message archived', 'success');
        setSelectedEmail(null);
        refresh();
      } else if (action === 'move_to_folder') {
        const { emailObj, folderName } = email;
        await api.request(`/titan-email/messages/${emailObj.id}/move${query}`, { method: 'PUT', body: { folder: folderName } });
        toast(`Message moved to ${folderName}`, 'success');
        setSelectedEmail(null);
        refresh();
      } else if (action === 'star') {
        const newVal = !email.is_starred;
        await api.request(`/titan-email/messages/${email.id}/state${query}`, { method: 'PUT', body: { is_starred: newVal } });
        setMessages(prev => prev.map(m => m.id === email.id ? { ...m, is_starred: newVal } : m));
        if (selectedEmail?.id === email.id) setSelectedEmail(prev => ({ ...prev, is_starred: newVal }));
        toast(newVal ? 'Starred' : 'Unstarred', 'info');
      } else if (action === 'flag') {
        const newVal = !email.is_flagged;
        await api.request(`/titan-email/messages/${email.id}/state${query}`, { method: 'PUT', body: { is_flagged: newVal } });
        setMessages(prev => prev.map(m => m.id === email.id ? { ...m, is_flagged: newVal } : m));
        if (selectedEmail?.id === email.id) setSelectedEmail(prev => ({ ...prev, is_flagged: newVal }));
        toast(newVal ? 'Flagged' : 'Unflagged', 'info');
      } else if (action === 'mark_read') {
        await api.request(`/titan-email/messages/${email.id}/state${query}`, { method: 'PUT', body: { is_read: true } });
        setMessages(prev => prev.map(m => m.id === email.id ? { ...m, is_read: true } : m));
        if (selectedEmail?.id === email.id) setSelectedEmail(prev => ({ ...prev, is_read: true }));
        fetchFolderCounts(selectedAccountId);
      } else if (action === 'mark_unread') {
        await api.request(`/titan-email/messages/${email.id}/state${query}`, { method: 'PUT', body: { is_read: false } });
        setMessages(prev => prev.map(m => m.id === email.id ? { ...m, is_read: false } : m));
        if (selectedEmail?.id === email.id) setSelectedEmail(prev => ({ ...prev, is_read: false }));
        fetchFolderCounts(selectedAccountId);
      } else if (action === 'reply') {
        setComposeData({ mode: 'reply', originalEmail: email });
        setIsComposeOpen(true);
      } else if (action === 'reply_all') {
        setComposeData({ mode: 'reply_all', originalEmail: email });
        setIsComposeOpen(true);
      } else if (action === 'forward') {
        setComposeData({ mode: 'forward', originalEmail: email });
        setIsComposeOpen(true);
      }
    } catch (err) {
      toast(`Failed to ${action} message`, 'error');
    }
  };

  // ── Handle Bulk Actions ─────────────────────────────────
  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;
    try {
      await api.request('/titan-email/bulk', {
        method: 'POST',
        body: { messageIds: Array.from(selectedIds), action, accountId: selectedAccountId },
      });
      toast(`${action.replace('_', ' ')} applied to ${selectedIds.size} message(s)`, 'success');
      setSelectedIds(new Set());
      setSelectedEmail(null);
      refresh();
    } catch (err) {
      toast(`Bulk ${action} failed`, 'error');
    }
  };

  // ── Toggle selection ────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === messages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messages.map(m => m.id)));
    }
  };

  // Combine standard and custom folders
  const allFoldersList = [
    ...folders,
    ...customFolders.map(folderName => ({
      id: folderName,
      label: folderName.charAt(0).toUpperCase() + folderName.slice(1),
      icon: '📁',
      isCustom: true,
    })),
  ];

  if (accountsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-slate-900/50 text-white rounded-xl border border-white/10 shadow-2xl m-2 sm:m-4 p-8 animate-fade-in">
        <div className="text-[#38bdf8] animate-spin mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" /></svg>
        </div>
        <p className="text-[12px] text-[#8a94a6] font-600 uppercase tracking-widest">Loading Mailboxes...</p>
      </div>
    );
  }

  if (titanAccounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-slate-900/50 text-white rounded-xl border border-white/10 shadow-2xl m-2 sm:m-4 p-8 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-[#0057c7]/10 flex items-center justify-center text-[#38bdf8] mb-6 shadow-[0_15px_40px_rgba(0,87,199,0.1)] border border-[#38bdf8]/10 animate-pulse">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </div>
        <h3 className="text-xl font-900 text-white tracking-tight mb-2 uppercase tracking-widest text-center">No Titan Mail Accounts Connected</h3>
        <p className="text-sm text-[#8a94a6] text-center max-w-md mb-8 leading-relaxed">
          Connect your professional Titan email accounts in settings to start syncing folders, managing communications, and composing messages.
        </p>
        <button
          onClick={() => window.location.href = '/admin/settings'}
          className="btn btn-primary h-12 px-8 text-[11px] font-900 uppercase tracking-widest shadow-xl shadow-[#0057c7]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Configure Integrations →
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100vh-80px)] bg-slate-900/50 text-white overflow-hidden rounded-xl border border-white/10 shadow-2xl m-2 sm:m-4">
      
      {/* Mobile Overlay for Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Panel: Folders */}
      <div className={`
        absolute lg:relative z-50 lg:z-0 h-full
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <FolderList 
          folders={allFoldersList} 
          selectedFolder={selectedFolder} 
          onSelect={(f) => { setSelectedFolder(f); setSelectedIds(new Set()); setIsSidebarOpen(false); }} 
          onCompose={() => { setComposeData(null); setIsComposeOpen(true); setIsSidebarOpen(false); }}
          folderCounts={folderCounts}
          isSyncing={isSyncing}
          onSync={handleSync}
          onCreateCustomFolder={handleCreateCustomFolder}
          titanAccounts={titanAccounts}
          selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId}
        />
      </div>
      
      {/* Center Panel: Email List */}
      <div className={`
        flex-1 md:flex-none h-full w-full md:w-[280px] lg:w-[320px] xl:w-[360px]
        ${selectedEmail ? 'hidden md:flex' : 'flex'}
      `}>
        <EmailList 
          folder={selectedFolder}
          messages={messages}
          isLoading={isLoading}
          selectedEmail={selectedEmail}
          onSelect={handleSelectEmail}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onAction={handleAction}
          onMenuClick={() => setIsSidebarOpen(true)}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onBulkAction={handleBulkAction}
        />
      </div>
      
      {/* Right Panel: Email Preview */}
      <div className={`
        flex-1 h-full w-full
        ${selectedEmail ? 'flex absolute inset-0 z-30 bg-slate-900 md:relative md:z-0' : 'hidden md:flex'}
      `}>
        <EmailPreview 
          email={selectedEmail} 
          onAction={handleAction}
          onBack={() => setSelectedEmail(null)}
          threadMessages={threadMessages}
          currentFolder={selectedFolder}
          folders={allFoldersList}
        />
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <TitanComposeEmailModal 
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)} 
          onSave={() => refresh()}
          data={composeData}
          accountId={selectedAccountId}
          titanAccounts={titanAccounts}
        />
      )}
    </div>
  );
}
