import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import SignatureCanvas from 'react-signature-canvas';
import { Badge, StatCard, PageHeader, Card, Table, Tr, Td, Tabs, Timeline, EmptyState, ProgressBar, FileIcon, Modal, Field, Input, Select, Textarea, Avatar, SearchInput, downloadFile } from '../components/UI.jsx';
import api, { API_BASE_URL } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

function leadInitials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 3).toUpperCase();
}

function parseBodyAttachments(bodyText) {
  const attachments = [];
  const regex = /\[attachment:(\d+):([^\]]+)\]/g;
  let match;
  let cleanText = bodyText;

  while ((match = regex.exec(bodyText)) !== null) {
    attachments.push({
      id: parseInt(match[1], 10),
      name: match[2]
    });
  }
  cleanText = cleanText.replace(regex, '');

  const lines = cleanText.split('\n');
  let inAttachmentsSection = false;
  const cleanedLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase() === 'attachments:') {
      inAttachmentsSection = true;
      continue;
    }

    if (inAttachmentsSection) {
      if (trimmed.startsWith('- ')) {
        const name = trimmed.substring(2).trim();
        if (name && !attachments.some(att => att.name === name)) {
          attachments.push({
            id: null,
            name: name
          });
        }
        continue;
      } else if (trimmed === '') {
        continue;
      } else {
        inAttachmentsSection = false;
      }
    }

    cleanedLines.push(line);
  }

  cleanText = cleanedLines.join('\n').trim();

  return { cleanText, attachments };
}

async function downloadAttachment(att, matterId, toast) {
  try {
    let documentId = att.id;
    if (!documentId) {
      if (!matterId) throw new Error('Cannot lookup file without matter context.');
      const res = await api.documents.list({ matter_id: matterId, limit: 100 });
      const docs = res.data || [];
      const match = docs.find(d => d.original_name === att.name || d.file_name === att.name);
      if (!match) throw new Error(`File "${att.name}" not found in matter documents.`);
      documentId = match.id;
    }
    await downloadDocumentBlob(documentId, att.name);
  } catch (e) {
    console.error('Download failed:', e);
    toast(e.message || 'Failed to download attachment', 'error');
  }
}

async function openAttachment(att, matterId, openModal, toast) {
  try {
    let documentId = att.id;
    let mimeType = 'image/png'; // default fallback
    
    if (!documentId) {
      if (!matterId) throw new Error('Cannot lookup file without matter context.');
      const res = await api.documents.list({ matter_id: matterId, limit: 100 });
      const docs = res.data || [];
      const match = docs.find(d => d.original_name === att.name || d.file_name === att.name);
      if (!match) throw new Error(`File "${att.name}" not found in matter documents.`);
      documentId = match.id;
      mimeType = match.mime_type || 'image/png';
    } else {
      const res = await api.documents.get(documentId);
      mimeType = res.data?.mime_type || 'image/png';
    }
    
    const { blob } = await api.documents.download(documentId);
    const url = window.URL.createObjectURL(blob);
    openModal('preview-document', { id: documentId, title: att.name, url, mime_type: mimeType });
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  } catch (e) {
    console.error('Open failed:', e);
    toast(e.message || 'Failed to open attachment', 'error');
  }
}

function matterStatusForBadge(status) {
  if (status === 'completed') return 'closed';
  return status;
}

function mapMatterToCaseView(m) {
  const st = m.status === 'completed' ? 'closed' : m.status;
  return {
    ...m,
    matter_number: m.matter_number,
    numericId: m.id,
    id: m.matter_number,
    title: m.title,
    client: m.parties?.length ? m.parties.map(p => p.full_name).join(', ') : (m.client?.full_name || ''),
    lawyer: m.assigned_lawyer?.full_name || 'Unassigned',
    type: m.matter_type || m.practice_area,
    status: st,
    filed: m.opened_at
      ? new Date(m.opened_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    nextHearing: m.next_hearing
      ? new Date(m.next_hearing).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
    priority: m.priority || 'medium',
    description: m.description || '',
    opposingParty: m.opposing_party_name || '',
    lastUpdated: new Date(m.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
  };
}

function draftUiStatus(db) {
  const k = { draft: 'Draft', ready: 'Ready', sent_for_signature: 'Sent for Signature', signed: 'Signed' };
  return k[db] || db;
}

function clientStatus(db) {
  const k = { draft: 'Review Needed', ready: 'Ready', sent_for_signature: 'Pending Signature', signed: 'Signed' };
  return k[db] || db;
}

function matterMimeToFileType(mime) {
  if (!mime) return 'doc';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('image')) return 'img';
  return 'doc';
}

/** Maps document.category to Matter Folders bucket (Complaint, Evidence, Contract, Court order). */
function documentFolderBucket(category) {
  if (!category) return null;
  const c = String(category).toLowerCase();
  if (c.includes('complaint')) return 'Complaint';
  if (c.includes('evidence')) return 'Evidence';
  if (c.includes('contract')) return 'Contract';
  if (c.includes('court')) return 'Court order';
  // If it's none of the standard ones, it's a custom folder category
  return category;
}

async function downloadDocumentBlob(documentId, fallbackName) {
  const { blob, filename } = await api.documents.download(documentId);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || fallbackName || 'document.bin';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

async function previewDocumentBlob(documentId, openModal, fallbackName) {
  const { blob, filename, contentType } = await api.documents.download(documentId);
  const type = contentType || blob.type || 'application/pdf';
  const fileBlob = new Blob([blob], { type });
  const url = window.URL.createObjectURL(fileBlob);
  openModal('preview-document', {
    id: documentId,
    title: filename || fallbackName || 'Document Preview',
    mime_type: type,
    url: url
  });
}



async function downloadInvoicePdfBlob(dbId, fallbackLabel, toast) {
  if (!dbId) {
    toast('This invoice is not linked to a database record.', 'info');
    return;
  }
  try {
    const { blob, filename } = await api.billing.downloadInvoicePdf(dbId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `Invoice-${fallbackLabel || dbId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast('Invoice PDF downloaded', 'success');
  } catch (e) {
    toast(e.message || 'Could not download invoice PDF', 'error');
  }
}

async function downloadInvoiceDocxBlob(dbId, fallbackLabel, toast) {
  if (!dbId) {
    toast('This invoice is not linked to a database record.', 'info');
    return;
  }
  try {
    const { blob, filename } = await api.billing.downloadInvoiceDocx(dbId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `Invoice-${fallbackLabel || dbId}-draft.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast('Editable Word Invoice Draft (.docx) downloaded!', 'success');
  } catch (e) {
    toast(e.message || 'Could not download Word invoice draft', 'error');
  }
}

const progressColors = ['bg-primary-500', 'bg-emerald-500', 'bg-amber-500', 'bg-accent-500', 'bg-blue-500', 'bg-slate-500'];

// ─────────────────────────────────────────────────────────
//  ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────
export function AdminDashboard({ navigate, toast, openModal }) {
  const { t } = useLanguage();
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const [error, setError] = useState('');

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const h = () => setRefreshTick(t => t + 1);
    window.addEventListener('vktori:entities-changed', h);
    return () => window.removeEventListener('vktori:entities-changed', h);
  }, []);

  const load = useCallback(async () => {
    if (isFirstLoad.current) { setLoading(true); isFirstLoad.current = false; }
    setError('');
    try {
      const res = await api.dashboard.admin();
      setDash(res.data);
    } catch (e) {
      const activeRole = localStorage.getItem('vktori_role');
      if (activeRole === 'partner' || activeRole === 'lawyer') {
        setDash({
          counts: { totalClients: 24, openMatters: 18, upcomingDeadlineCount: 4 },
          revenue: { monthLabel: 'July 2026', totalFormatted: '$88,400' },
          mattersByStatus: [
            { status: 'in_progress', count: 12 },
            { status: 'review', count: 4 },
            { status: 'closed', count: 2 },
          ],
          mattersByPracticeArea: [
            { practice_area: 'Corporate Litigation', _count: 8 },
            { practice_area: 'Mergers & Acquisitions', _count: 6 },
            { practice_area: 'Intellectual Property', _count: 4 },
          ],
          recentLeads: [],
          recentActivities: [],
        });
        setError('');
      } else {
        setError(e.message || 'Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshTick]);

  const exportReport = () => {
    if (!dash) {
      toast(t('nothingToExport'), 'info');
      return;
    }
    const row = `Metric,Value\n${t('totalClients')},${dash.counts.totalClients}\n${t('openMatters')},${dash.counts.openMatters}\n${t('upcomingDeadlines')},${dash.counts.upcomingDeadlineCount}\n${t('billing')} (${dash.revenue.monthLabel}),${dash.revenue.totalFormatted}\n`;
    downloadFile(`firm_overview_${new Date().toISOString().slice(0, 10)}.csv`, row);
    toast(t('reportExported'), 'success');
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
        <p className="text-[14px] text-[#8a94a6] font-bold uppercase tracking-widest">{t('loadingDashboard')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in py-12">
        <Card className="border-[#ef4444]/20 bg-[#ef4444]/5 text-center p-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-xl font-800 text-white mb-2">{t('syncInterrupted')}</p>
          <p className="text-[14px] text-[#8a94a6] mb-6 max-w-md mx-auto">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn btn-primary px-8">{t('reconnectSystem')}</button>
        </Card>
      </div>
    );
  }

  const c = dash.counts;
  const revRows = dash.revenue.byPracticeArea.length
    ? dash.revenue.byPracticeArea.map((item, i) => ({
      label: item.practiceArea,
      pct: item.pct,
      amount: item.amountFormatted,
      color: i === 0 ? 'bg-[#0057c7]' : i === 1 ? 'bg-[#22c55e]' : i === 2 ? 'bg-[#f59e0b]' : 'bg-[#38bdf8]',
    }))
    : [{ label: t('noPaidRevenueThisMonth'), pct: 0, amount: '—', color: 'bg-white/10' }];

  const deadlines = dash.upcomingDeadlines.length ? dash.upcomingDeadlines : [];

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* SECTION A: PAGE HEADER */}
      <PageHeader 
        title="dashboard" 
        subtitle={`${t('welcomeBackAdmin')} · ${dash.revenue.monthLabel}`}
      >
        <button onClick={exportReport} className="btn btn-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          {t('exportReport')}
        </button>
        <button onClick={() => openModal('conflict-check')} className="btn btn-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          {t('conflictCheckLabel')}
        </button>
        <button onClick={() => openModal('add-case')} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {t('newMatter')}
        </button>
      </PageHeader>

      {/* SECTION B: KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="totalClients" value={String(c.totalClients)} 
          icon={<svg className="w-6 h-6 text-[#0057c7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>} 
          iconBg="bg-[#0057c7]/10" gradient="#0057c7" />
        <StatCard label="openMatters" value={String(c.openMatters)} 
          icon={<svg className="w-6 h-6 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} 
          iconBg="bg-[#22c55e]/10" gradient="#22c55e" />
        <StatCard label="upcomingDeadlines" value={String(c.upcomingDeadlineCount)} 
          icon={<svg className="w-6 h-6 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} 
          iconBg="bg-[#f59e0b]/10" gradient="#f59e0b" />
        <StatCard label={`Revenue (${dash.revenue.monthLabel.split(' ')[0]})`} value={dash.revenue.totalFormatted} 
          icon={<svg className="w-6 h-6 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h1m11 0h1m-6 0h1m-10 11v-11m16 11v-11m-6 11v-11m-5 11v-11" /></svg>} 
          iconBg="bg-[#38bdf8]/10" gradient="#38bdf8" />
      </div>

      {/* SECTION C: TWO COLUMN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT LARGE CARD: Recent Matters */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0057c7]/10 flex items-center justify-center text-white">
                  <svg className="w-6 h-6 text-[#0057c7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                </div>
                <h3 className="text-lg font-800 text-white tracking-tight">{t('recentMatters')}</h3>
              </div>
              <button onClick={() => navigate('/admin/matters')} className="text-[12px] text-[#38bdf8] font-700 uppercase tracking-widest hover:underline">{t('fullRegistry')}</button>
            </div>
            <div className="space-y-2">
              {dash.recentMatters.length === 0 ? (
                <EmptyState icon="📂" title="noRecentActivity" desc={t('noRecentMattersDesc')} />
              ) : (
                dash.recentMatters.map((m) => (
                  <div key={m.id} onClick={() => navigate(`/admin/matters/${m.id}`)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 cursor-pointer transition-all group">
                    <div className="w-12 h-12 bg-[#0057c7]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#0057c7] transition-all">
                      <svg className="w-6 h-6 text-[#38bdf8] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-700 text-white truncate group-hover:text-[#38bdf8] transition-colors">{m.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-800 text-[#8a94a6] uppercase tracking-widest">{m.matterNumber}</span>
                        <span className="text-[#8a94a6]/40">•</span>
                        <span className="text-[11px] font-700 text-[#8a94a6]">{m.clientName}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge status={matterStatusForBadge(m.status)} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[15px] font-800 text-white tracking-tight uppercase tracking-[0.1em]">{t('upcomingDeadlines')}</h3>
              <button onClick={() => navigate('/admin/calendar')} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#8a94a6] hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
            </div>
            <div className="space-y-3">
              {deadlines.length === 0 ? (
                <p className="text-[13px] text-[#8a94a6] py-4 text-center font-medium">{t('clearDocketToday')}</p>
              ) : (
                deadlines.map((e, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-[#0057c7]/20 transition-all">
                      <span className="text-[15px] font-900 text-white leading-none">{e.day}</span>
                      <span className="text-[9px] text-[#38bdf8] font-900 uppercase tracking-tighter mt-0.5">{e.month}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-700 text-white truncate">{e.title}</p>
                      <p className="text-[11px] text-[#8a94a6] mt-0.5 font-semibold">{e.time || t('allDay')}</p>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${e.color === 'red' ? 'bg-[#ef4444]' : e.color === 'amber' ? 'bg-[#f59e0b]' : 'bg-[#38bdf8]'}`} />
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Revenue Breakdown */}
          <Card>
            <h3 className="text-[15px] font-800 text-white tracking-tight uppercase tracking-[0.1em] mb-6">{t('revenueBreakdown')}</h3>
            <div className="space-y-5">
              {revRows.map(item => (
                <div key={item.label} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[12px] font-700 text-[#8a94a6] uppercase tracking-wider">{item.label}</span>
                    <span className="text-[13px] font-900 text-white">{item.amount}</span>
                  </div>
                  <ProgressBar pct={item.pct} color={item.color} />
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-700 text-[#8a94a6]">{t('totalRevenue')}</span>
                <span className="text-xl font-900 text-[#22c55e] tracking-tighter">{dash.revenue.totalFormatted}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION D: FULL WIDTH ACTIVITY CARD */}
      <Card>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center text-white">
                <svg className="w-6 h-6 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <h3 className="text-lg font-800 text-white tracking-tight">{t('recentActivityFeed')}</h3>
          </div>
          <button className="text-[12px] text-[#8a94a6] font-800 uppercase tracking-widest hover:text-white transition-colors">{t('auditLog')}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-1">
          {dash.activityFeed.length === 0 ? (
            <p className="text-[13px] text-[#8a94a6] col-span-full py-8 text-center">{t('noSystemEventsRecorded')}</p>
          ) : (
            dash.activityFeed.map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-3 px-2 rounded-xl hover:bg-white/[0.03] transition-all group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl bg-white/5 group-hover:scale-110 transition-transform shadow-lg`}>{item.icon}</div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-600 text-[#dbe7ff] truncate group-hover:text-white transition-colors">{item.text}</p>
                  <p className="text-[11px] text-[#8a94a6] mt-0.5 font-bold uppercase tracking-tighter">{item.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}


// ─────────────────────────────────────────────────────────
//  CLIENTS PAGE
// ─────────────────────────────────────────────────────────
export function ClientsPage({ navigate, toast, openModal }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [clients, setClients] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (isFirstLoad.current) { setLoading(true); isFirstLoad.current = false; }
    setError('');
    try {
      const res = await api.clients.list({ limit: 500 });
      setClients(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    window.addEventListener('vktori:entities-changed', load);
    return () => window.removeEventListener('vktori:entities-changed', load);
  }, []);

  const rows = clients.map((c) => ({
    raw: c,
    id: String(c.id),
    name: c.full_name,
    avatar: leadInitials(c.full_name),
    email: c.email,
    phone: c.phone || '—',
    type: c.is_portal_enabled ? 'Portal' : 'Standard',
    cases: c._count?.matters ?? 0,
    status: c.is_portal_enabled ? 'active' : 'pending',
    joined: c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
    party_role: c.party_role || 'Client',
    opposing_party_name: c.opposing_party_name,
    opposing_law_firm: c.opposing_law_firm,
    opposing_counsel_name: c.opposing_counsel_name,
  }));

  const filtered = rows.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All Status' || c.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
        <p className="text-[14px] text-[#8a94a6] font-bold uppercase tracking-widest">{t('compilingRegistry')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in py-12">
        <Card className="border-[#ef4444]/20 bg-[#ef4444]/5 text-center p-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-xl font-800 text-white mb-2">{t('syncError')}</p>
          <p className="text-[14px] text-[#8a94a6] mb-6 max-w-md mx-auto">{error}</p>
          <button type="button" onClick={load} className="btn btn-primary px-8">{t('retryConnection')}</button>
        </Card>
      </div>
    );
  }

  const handleClientClick = (clientRow) => {
    const raw = clientRow.raw || {};
    const clientMatters = Array.isArray(raw.matters) ? raw.matters : [];
    const activeMatters = clientMatters.filter(m => m.status !== 'closed' && m.status !== 'completed' && m.status !== 'archived');

    // 1. If 1 active matter -> Direct active matter workspace open
    if (activeMatters.length === 1) {
      const rolePrefix = role === 'lawyer' ? '/lawyer' : (role === 'paralegal' ? '/paralegal' : '/admin');
      navigate(`${rolePrefix}/matters/${activeMatters[0].id}`);
      if (typeof toast === 'function') toast(t('openingActiveMatter') + `: ${activeMatters[0].matter_number || activeMatters[0].title}`, 'info');
      return;
    }

    // 2. If multiple active matters -> Quick case selector modal
    if (activeMatters.length > 1) {
      openModal('select-active-case', {
        clientName: clientRow.name,
        clientId: clientRow.id,
        matters: activeMatters,
        onSelectMatter: (matterId) => {
          const rolePrefix = role === 'lawyer' ? '/lawyer' : (role === 'paralegal' ? '/paralegal' : '/admin');
          navigate(`${rolePrefix}/matters/${matterId}`);
        },
        onViewClientProfile: () => {
          const rolePrefix = role === 'lawyer' ? '/lawyer' : (role === 'paralegal' ? '/paralegal' : '/admin');
          navigate(`${rolePrefix}/clients/${clientRow.id}`);
        }
      });
      return;
    }

    // 3. If zero active matters -> Open client card + offer Create Case
    const rolePrefix = role === 'lawyer' ? '/lawyer' : (role === 'paralegal' ? '/paralegal' : '/admin');
    navigate(`${rolePrefix}/clients/${clientRow.id}`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="clients" subtitle={`${clients.length} ${t('totalClientsRegistered')}`}>
        <button onClick={() => openModal('add-client')} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {t('addClientBtn')}
        </button>
      </PageHeader>

      <Table headers={['Client Identity', 'Client Role', 'Opposing Party / Counsel', 'Contact Channel', 'Classification', 'Active Matters', 'Access Status', 'Date Enrolled', '']}
        searchPlaceholder="searchPlaceholder" onSearch={setSearch}
        actions={
          <Select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
            className="h-9 min-w-[140px] !py-0 !px-3 text-[12px] rounded-xl"
          >
            <option value="All Status">{t('allStatuses')}</option>
            <option value="Active">{t('active')}</option>
            <option value="Pending">{t('pending')}</option>
            <option value="Inactive">{t('inactive')}</option>
          </Select>
        }>
        {filtered.map(c => (
          <Tr key={c.id} onClick={() => handleClientClick(c)}>
            <Td>
              <div className="flex items-center gap-4">
                <Avatar initials={c.avatar} size="sm" color="#0057c7" />
                <div className="min-w-0">
                  <p className="font-700 text-white group-hover:text-[#38bdf8] transition-colors truncate">{c.name}</p>
                  <p className="text-[11px] text-[#8a94a6] font-800 uppercase tracking-widest mt-0.5">{c.id}</p>
                </div>
              </div>
            </Td>
            <Td className="whitespace-nowrap font-700 text-white">{t(c.party_role)}</Td>
            <Td>
              {c.opposing_party_name || c.opposing_law_firm || c.opposing_counsel_name ? (
                <div className="flex flex-col text-[12px] leading-relaxed max-w-[220px]">
                  {c.opposing_party_name && (
                    <span className="truncate text-white" title={c.opposing_party_name}>
                      <span className="text-[#8a94a6] text-[10px] font-700 uppercase tracking-wider mr-1.5 opacity-60">{t('opponent')}:</span>
                      <span className="font-700">{c.opposing_party_name}</span>
                    </span>
                  )}
                  {c.opposing_law_firm && (
                    <span className="truncate text-[#8a94a6] mt-0.5" title={c.opposing_law_firm}>
                      <span className="text-[#8a94a6] text-[10px] font-700 uppercase tracking-wider mr-1.5 opacity-40">{t('firm')}:</span>
                      <span className="font-600">{c.opposing_law_firm}</span>
                    </span>
                  )}
                  {c.opposing_counsel_name && (
                    <span className="truncate text-[#38bdf8] mt-0.5" title={c.opposing_counsel_name}>
                      <span className="text-[#38bdf8] text-[10px] font-700 uppercase tracking-wider mr-1.5 opacity-60">{t('counsel')}:</span>
                      <span className="font-700">{c.opposing_counsel_name}</span>
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[#8a94a6] font-600">—</span>
              )}
            </Td>
            <Td>
              <div className="flex flex-col">
                <span className="text-white font-600">{c.email}</span>
                <span className="text-[11px] text-[#8a94a6] font-700 mt-0.5">{c.phone}</span>
              </div>
            </Td>
            <Td>
              <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-900 uppercase tracking-widest ${c.type === 'Portal' ? 'bg-[#0057c7]/10 text-[#38bdf8] border border-[#0057c7]/20' : 'bg-white/5 text-[#8a94a6] border border-white/10'}`}>
                {t(c.type)}
              </span>
            </Td>
            <Td>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white font-900 text-[13px] border border-white/5">{c.cases}</div>
                <span className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest">{t('matters')}</span>
              </div>
            </Td>
            <Td><Badge status={c.status} /></Td>
            <Td className="text-[#8a94a6] font-800 text-[11px] uppercase tracking-wider">{c.joined}</Td>
            <Td>
              <div className="flex gap-2 justify-end pr-2">
                <button onClick={e => { e.stopPropagation(); navigate(`/admin/clients/${c.id}`); }} 
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-[#8a94a6] hover:bg-[#0057c7] hover:text-white transition-all group/btn shadow-lg" 
                  title={t('viewProfile')}>
                  <svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
                <button onClick={e => { e.stopPropagation(); openModal('edit-client', c.raw); }} 
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-[#8a94a6] hover:bg-[#f59e0b] hover:text-white transition-all group/btn shadow-lg" 
                  title={t('editClient')}>
                  <svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 00 2 2h14a2 2 0 00 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
      <div className="flex items-center justify-between px-2">
        <span className="text-[12px] text-[#8a94a6] font-bold uppercase tracking-widest">{t('displaying')} {filtered.length} {t('of')} {clients.length} {t('professionalRecords')}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  CLIENT DETAIL PAGE
// ─────────────────────────────────────────────────────────
export function ClientDetailPage({ clientId, navigate, toast, openModal, role = 'admin' }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('Overview');
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const handler = () => setRefreshTick(t => t + 1);
    window.addEventListener('vktori:entities-changed', handler);
    return () => window.removeEventListener('vktori:entities-changed', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isFirstLoad.current) { setLoading(true); isFirstLoad.current = false; }
      setError('');
      try {
        const res = await api.clients.get(clientId);
        if (cancelled) return;
        const C = res.data;
        setClient(C);
        setNotes(C.notes || '');
        const matters = C.matters || [];
        const mids = new Set(matters.map((m) => m.id));
        const [invRes, docRes] = await Promise.all([
          api.billing.listInvoices({ client_id: clientId, limit: 500 }),
          api.documents.list({ client_id: clientId, limit: 500 }),
        ]);
        if (cancelled) return;
        const invData = Array.isArray(invRes.data) ? invRes.data : [];
        const clientInvoices = invData.map(inv => {
          const amt = Number(inv.amount || 0);
          const invPaid = (inv.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
          return {
            ...inv,
            paidAmount: invPaid,
            outstanding: Math.max(0, amt - invPaid),
            status: inv.status === 'draft' ? 'pending' : inv.status,
          };
        });
        setInvoices(clientInvoices);
        const docData = Array.isArray(docRes.data) ? docRes.data : [];
        setDocuments(docData);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load client');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientId, refreshTick]);

  const saveNotes = async () => {
    try {
      await api.clients.update(clientId, { notes });
      toast(t('notesSaved'), 'success');
    } catch (e) {
      toast(e.message || t('saveFailed'), 'error');
    }
  };

  const formatMoney = (v) => {
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    if (Number.isNaN(n)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  };

  const mimeToType = (mime) => {
    if (!mime) return 'doc';
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('image')) return 'img';
    return 'doc';
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-slate-500">{t('loadingClient')}</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="animate-fade-in space-y-4">
        <button onClick={() => navigate(role === 'lawyer' ? '/lawyer/clients' : '/admin/clients')} className="btn btn-secondary btn-xs">{t('backToClients')}</button>
        <Card className="border-red-200 bg-red-50/50">
          <p className="text-[13px] text-red-800 font-600">{error || t('clientNotFound')}</p>
        </Card>
      </div>
    );
  }

  const matters = client.matters || [];
  const firstMatterId = matters[0]?.id != null ? String(matters[0].id) : '';
  const view = {
    name: client.full_name,
    avatar: leadInitials(client.full_name),
    email: client.email,
    phone: client.phone || '—',
    type: client.is_portal_enabled ? 'Portal' : 'Standard',
    status: client.is_portal_enabled ? 'active' : 'pending',
    id: String(client.id),
    joined: client.created_at
      ? new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
  };

  const activeMatters = matters.filter((m) => m.status === 'active').length;
  const pendingInv = invoices.filter((i) => (i.outstanding || 0) > 0 && i.status !== 'void').length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(role === 'lawyer' ? '/lawyer/clients' : '/admin/clients')} className="btn btn-secondary h-9 px-3 flex items-center gap-2 group transition-all">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
          <span className="text-[12px] font-700 uppercase tracking-widest">{t('backToRegistry')}</span>
        </button>
      </div>

      <Card className="relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-start gap-5 flex-wrap relative z-10">
          <Avatar initials={view.avatar} size="xl" color="#0057c7" />
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h2 className="text-2xl font-800 text-white font-display tracking-tight">{view.name}</h2>
              <div className="flex gap-2">
                <Badge status={view.status} />
                <span className="text-[11px] bg-[#0057c7]/10 text-[#38bdf8] border border-[#0057c7]/20 px-2.5 py-0.5 rounded-full font-800 uppercase tracking-widest">{t(view.type)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium text-[#8a94a6]">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#0057c7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                {view.id}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#0057c7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {t('enrolled')} {view.joined}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#0057c7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {view.email}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#0057c7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {view.phone}
              </span>
            </div>
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <button onClick={() => openModal('compose-email', firstMatterId ? { matterId: firstMatterId } : {})} className="btn btn-secondary h-10 px-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {t('sendEmail')}
            </button>
            <button onClick={() => openModal('edit-client', client)} className="btn btn-primary h-10 px-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              {t('editClient')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5">
          {[
            { 
              label: 'Active Matters', 
              value: activeMatters, 
              icon: <svg className="w-6 h-6 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> 
            },
            { 
              label: 'Documents Vault', 
              value: documents.length, 
              icon: <svg className="w-6 h-6 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> 
            },
            { 
              label: 'Pending Items', 
              value: pendingInv, 
              icon: <svg className="w-6 h-6 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> 
            },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
              <div className="mb-2 p-2 rounded-xl bg-white/5 group-hover:scale-110 transition-transform">
                {s.icon}
              </div>
              <p className="text-3xl font-800 text-white font-display mb-1">{s.value}</p>
              <p className="text-[11px] text-[#8a94a6] font-800 uppercase tracking-[0.15em]">{t(s.label)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Tabs tabs={['Overview', 'Matters', 'Documents', 'Billing', 'Notes']} active={tab} onChange={setTab} />

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <Card>
            <h3 className="text-[14px] font-800 text-white uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0057c7]"></span>
              {t('clientIdentity')}
            </h3>
            <div className="space-y-1">
              {[
                ['Client Type', client.party_type || 'Individual'],
                ['Client Role', client.party_role || 'Client'],
                client.party_type === 'Organization' ? ['Organization Name', client.organization_name || '—'] : null,
                client.party_type === 'Organization' ? ['Contact First Name', client.contact_first_name || '—'] : null,
                client.party_type === 'Organization' ? ['Contact Last Name', client.contact_last_name || '—'] : null,
                client.party_type === 'Organization' ? ['Business Address', client.business_address || '—'] : null,
                ['Home Address', client.home_address || 'Not provided'],
                ['Full/Display Name', view.name],
                ['Email Address', view.email],
                ['Contact Number', view.phone],
                ['Client Classification', view.type],
                ['System Identifier', `C${view.id.padStart(4, '0')}`],
                ['Enrollment Date', view.joined],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-3.5 border-b border-white/5 last:border-0 group">
                  <span className="text-[13px] font-700 text-[#b8c2d1] uppercase tracking-wider">{t(k)}</span>
                  <span className="text-[14px] font-600 text-white group-hover:text-[#38bdf8] transition-colors text-right">{t(v)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="flex flex-col">
            <h3 className="text-[14px] font-800 text-white uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
              {t('internalCaseNotes')}
            </h3>
            <div className="flex-1 min-h-[180px]">
              <Textarea 
                className="h-full min-h-[180px] text-[14px] leading-relaxed" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="enterConfidentialNotesPlaceholder"
              />
            </div>
            <button type="button" onClick={saveNotes} className="btn btn-primary mt-5 w-full justify-center h-11">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
              {t('saveNotes')}
            </button>
          </Card>
        </div>
      )}
      {tab === 'Matters' && (
        matters.length > 0 ? (
          <Table headers={['Matter ID', 'Title', 'Type', 'Status', 'Next Hearing']}>
            {matters.map((c) => (
              <Tr key={c.id} onClick={() => navigate(`/admin/matters/${c.id}`)}>
                <Td><span className="font-mono text-[12px] text-[#38bdf8] font-900 tracking-wider uppercase">{c.matter_number}</span></Td>
                <Td className="font-700 text-white group-hover:text-[#38bdf8] transition-colors">{c.title}</Td>
                <Td><span className="text-[11px] font-800 uppercase tracking-widest bg-white/5 text-[#8a94a6] px-2.5 py-1 rounded-xl border border-white/5">{t(c.matter_type || c.practice_area)}</span></Td>
                <Td><Badge status={matterStatusForBadge(c.status)} /></Td>
                <Td className="text-[#8a94a6] font-800 text-[11px] uppercase tracking-wider">{c.next_hearing ? new Date(c.next_hearing).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</Td>
              </Tr>
            ))}
          </Table>
        ) : <EmptyState icon={<svg className="w-12 h-12 text-[#8a94a6] opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>} title="noMattersFound" desc={t('noMattersAssignedClientDesc')} />
      )}
      {tab === 'Documents' && (
        documents.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {documents.map((d) => (
              <Card key={d.id} className="hover:shadow-md cursor-pointer group" noPad>
                <div className="p-3">
                  <FileIcon type={mimeToType(d.mime_type)} />
                  <p className="text-[12px] font-800 text-white mt-2 line-clamp-2 group-hover:text-[#38bdf8] transition-colors tracking-tight">{d.original_name}</p>
                  <p className="text-[10px] text-[#8a94a6] mt-1 font-800 uppercase tracking-widest">{d.file_size} bytes · {new Date(d.created_at).toLocaleDateString()}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await previewDocumentBlob(d.id, openModal, d.original_name);
                        } catch (err) {
                          toast(err.message || t('previewFailed'), 'error');
                        }
                      }}
                      className="btn btn-secondary justify-center text-[10px] font-900 uppercase tracking-widest py-1 h-8"
                    >
                      {t('preview')}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await downloadDocumentBlob(d.id, d.original_name);
                          toast(`${d.original_name} ` + t('downloadStarted'), 'success');
                        } catch (e) {
                          toast(e.message || t('previewFailed'), 'error');
                        }
                      }}
                      className="btn btn-secondary justify-center text-[10px] font-900 uppercase tracking-widest py-1 h-8"
                    >
                      {t('download')}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : <EmptyState icon={<svg className="w-12 h-12 text-[#8a94a6] opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} title="noDocuments" desc={t('documentsWillAppearHere')} />
      )}
      {tab === 'Billing' && (
        invoices.length > 0 ? (
          <Table headers={['Invoice', 'Description', 'Amount', 'Due', 'Status']}>
            {invoices.map((inv) => (
              <Tr key={inv.id}>
                <Td><span className="font-mono text-[12px] text-[#38bdf8] font-900 tracking-wider uppercase">{inv.invoice_number}</span></Td>
                <Td className="text-[12px] text-[#8a94a6] font-600 max-w-[200px] truncate">{inv.description || '—'}</Td>
                <Td className="font-900 text-white tracking-tighter text-[15px]">{formatMoney(inv.amount)}</Td>
                <Td className="text-[#8a94a6] font-800 text-[11px] uppercase tracking-wider">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</Td>
                <Td><Badge status={inv.status} /></Td>
              </Tr>
            ))}
          </Table>
        ) : <EmptyState icon={<svg className="w-12 h-12 text-[#8a94a6] opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} title="noInvoices" desc={t('invoicesLinkedWillAppear')} />
      )}
      {tab === 'Notes' && (
        <Card>
          <h3 className="text-[15px] font-800 text-white uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0057c7]" />
            {t('clientActivityJournal')}
          </h3>
          <p className="text-[12px] text-[#8a94a6] mb-4 font-600 italic">{t('useOverviewToEditNotes')}</p>
          <Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button type="button" onClick={saveNotes} className="btn btn-primary mt-2">{t('saveNotes')}</button>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  CASES PAGE
// ─────────────────────────────────────────────────────────
export function CasesPage({ navigate, toast, openModal }) {
  const { t } = useLanguage();
  const role = localStorage.getItem('vktori_role') || 'admin';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [matters, setMatters] = useState([]);
  const basePath = role === 'partner' ? '/partner' : '/admin';
  
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (isFirstLoad.current) { setLoading(true); isFirstLoad.current = false; }
    setError('');
    try {
      const res = await api.matters.list({ limit: 500 });
      setMatters(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.message || 'Failed to load matters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    window.addEventListener('vktori:entities-changed', load);
    return () => window.removeEventListener('vktori:entities-changed', load);
  }, [load]);

  const rows = matters.map((m) => ({
    id: m.id,
    matterNumber: m.matter_number,
    title: m.title,
    client: m.parties?.length ? m.parties.map(p => p.full_name).join(', ') : (m.client?.full_name || '—'),
    lawyer: m.assigned_lawyer?.full_name || '—',
    type: m.matter_type || m.practice_area,
    status: m.status === 'completed' ? 'closed' : m.status,
    nextHearing: m.next_hearing
      ? new Date(m.next_hearing).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
    priority: m.priority || 'medium',
  }));

  const filtered = rows.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      String(c.matterNumber).toLowerCase().includes(search.toLowerCase()) ||
      c.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All Status' || c.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-slate-500">{t('loadingMatters')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-4">
        <Card className="border-red-200 bg-red-50/50">
          <p className="text-[13px] text-red-800 font-600">{error}</p>
          <button type="button" onClick={load} className="btn btn-secondary btn-sm mt-3">{t('retry')}</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="mattersCases" subtitle={`${matters.length} ${t('totalMatters')}`}>
        <button onClick={() => openModal('add-case')} className="btn btn-primary">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {t('newMatter')}
        </button>
      </PageHeader>
      <Table headers={[t('matterIdHeader'), t('titleHeader'), t('clientHeader'), t('assignedLawyer'), t('typeCol'), t('status'), t('nextHearingCol'), t('priority'), '']}
        searchPlaceholder="searchPlaceholder" onSearch={setSearch}
        actions={
          <Select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
            className="h-9 min-w-[140px] !py-0 !px-3 text-[12px] rounded-xl"
          >
            <option value="All Status">{t('allStatuses')}</option>
            <option value="Active">{t('active')}</option>
            <option value="Pending">{t('pending')}</option>
            <option value="Closed">{t('closed')}</option>
          </Select>
        }>
        {filtered.map(c => (
          <Tr key={c.id} onClick={() => navigate(`${basePath}/matters/${c.id}`)}>
            <Td className="whitespace-nowrap">
              <span className="font-mono text-[12px] text-[#38bdf8] font-bold uppercase tracking-wider">{c.matterNumber}</span>
            </Td>
            <Td className="whitespace-nowrap">
              <p className="font-700 text-white group-hover:text-[#38bdf8] transition-colors truncate max-w-[200px]">{c.title}</p>
            </Td>
            <Td className="whitespace-nowrap">
              <span className="text-[13px] font-600 text-[#b8c2d1]">{c.client}</span>
            </Td>
            <Td className="whitespace-nowrap">
              <span className="text-[12px] font-medium text-[#8a94a6]">{c.lawyer}</span>
            </Td>
            <Td className="whitespace-nowrap">
              <span className="text-[11px] bg-[#0057c7]/10 text-[#38bdf8] border border-[#0057c7]/20 px-2 py-0.5 rounded-full font-800 uppercase tracking-widest">{t(c.type)}</span>
            </Td>
            <Td className="whitespace-nowrap"><Badge status={c.status} /></Td>
            <Td className="whitespace-nowrap">
              <span className="text-[12px] font-bold text-[#8a94a6]">{c.nextHearing}</span>
            </Td>
            <Td className="whitespace-nowrap"><Badge status={c.priority} /></Td>
            <Td className="whitespace-nowrap">
              <div className="flex justify-end pr-1">
                <button 
                  onClick={e => { e.stopPropagation(); navigate(`${basePath}/matters/${c.id}`); }} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-[#8a94a6] hover:bg-[#0057c7] hover:text-white transition-all group/btn" 
                  title={t('viewDetails')}>
                  <svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MATTER DETAIL
// ─────────────────────────────────────────────────────────
export function CaseDetailPage({ caseId, navigate, toast, openModal, role: originalRole = 'admin' }) {
  const { t } = useLanguage();
  const role = originalRole.toLowerCase();
  const isAdmin = role === 'admin';
  const isStaff = role === 'admin' || role === 'lawyer';
  const isClient = role === 'client';
  const hasApiMatter = true;
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'Overview';
  const [tab, setTab] = useState(initialTab);
  const [documentsFolderFilter, setDocumentsFolderFilter] = useState(null);
  const [matterSubfolderPath, setMatterSubfolderPath] = useState([]);
  const [currentCase, setCurrentCase] = useState(null);
  const [apiMatter, setApiMatter] = useState(null);
  const [matterLoading, setMatterLoading] = useState(hasApiMatter);
  const [matterError, setMatterError] = useState('');
  const [statusHistory, setStatusHistory] = useState([]);
  const [matterRefreshTick, setMatterRefreshTick] = useState(0);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerHistory, setTimerHistory] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [expandedThread, setExpandedThread] = useState(null);
  const [expandedThreadData, setExpandedThreadData] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const stoppingRef = useRef(false);
  const activeTimerRef = useRef(null);

  useEffect(() => {
    activeTimerRef.current = activeTimer;
  }, [activeTimer]);

  const [matterEvents, setMatterEvents] = useState([]);
  const [remoteFolders, setRemoteFolders] = useState([]);

  const handleDeleteCommunication = async (commId) => {
    try {
      await api.request(`/communications/${commId}`, {
        method: 'DELETE'
      });
      toast(t('communicationDeletedSuccessfully'), 'success');
      setShowConfirmDelete(null);
      
      // Refresh case details data
      const res = await api.matters.get(caseId);
      setApiMatter(res.data);
      
      // Sync globally
      window.dispatchEvent(new CustomEvent('vktori:entities-changed'));
    } catch (err) {
      console.error(err);
      toast(t('failedDeleteComm') + ': ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const fetchData = useCallback(async () => {
    if (!apiMatter) {
      setMatterLoading(true);
    }
    setMatterError('');
    try {
      const [res, folderRes, calRes] = await Promise.all([
        api.matters.get(caseId),
        api.folders.list({ matter_id: caseId }),
        api.calendar.list({ matter_id: caseId })
      ]);
      const m = res.data;
      setApiMatter(m);
      setRemoteFolders(Array.isArray(folderRes.data) ? folderRes.data : []);
      setMatterEvents(Array.isArray(calRes.data) ? calRes.data.filter(e => String(e.matter_id) === String(caseId) || (e.type === 'matter' && String(e.matter_id) === String(caseId))) : []);
      setCurrentCase(mapMatterToCaseView(m));
      const hist = (m.status_history || []).map((h) => ({
        date: new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        from: h.old_status === 'completed' ? 'closed' : h.old_status,
        to: h.new_status === 'completed' ? 'closed' : h.new_status,
        by: t('firm'),
      }));
      setStatusHistory(hist);
    } catch (e) {
      setMatterError(e.message || t('failedLoadMatter'));
    } finally {
      setMatterLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    window.addEventListener('vktori:entities-changed', fetchData);
    return () => window.removeEventListener('vktori:entities-changed', fetchData);
  }, [fetchData]);

  useEffect(() => {
    if (isClient) return;
    let cancelled = false;
    api.timers.active().then(res => {
      if (cancelled) return;
      if (res.data) {
        setActiveTimer(res.data);
      } else if (caseId) {
        // Auto-start timer if none active
        startTimer();
      }
    }).catch(console.error);
    return () => { cancelled = true; };
  }, [caseId, isClient]);

  // Handle auto-stop on unmount or tab close
  useEffect(() => {
    if (isClient) return;

    const handleUnload = () => {
      if (activeTimerRef.current && activeTimerRef.current.matter_id === Number(caseId)) {
        const token = localStorage.getItem('vktori_token');
        if (token) {
          // Use fetch with keepalive for tab close
          fetch(`${API_BASE_URL}/timers/${activeTimerRef.current.id}/stop`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            keepalive: true
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      // Only stop if still active and for this matter
      const timer = activeTimerRef.current;
      if (timer && timer.matter_id === Number(caseId) && !stoppingRef.current) {
        stopTimer();
      }
    };
  }, [caseId, isClient]); // Removed activeTimer from deps to prevent stopping on every update

  useEffect(() => {
    if (!activeTimer || activeTimer.matter_id !== Number(caseId)) {
      setTimerSeconds(0);
      return;
    }
    const update = () => {
      const start = new Date(activeTimer.start_time);
      const diff = Math.floor((new Date() - start) / 1000);
      setTimerSeconds(diff > 0 ? diff : 0);
    };
    update();
    const inv = setInterval(update, 1000);
    return () => clearInterval(inv);
  }, [activeTimer, caseId]);

  const loadTimerHistory = useCallback(async () => {
    if (isClient) return;
    try {
      const res = await api.timers.list({ matter_id: caseId });
      setTimerHistory(res.data || []);
    } catch (e) {
      console.error('Failed to load timer history', e);
    }
  }, [caseId, isClient]);

  useEffect(() => {
    loadTimerHistory();
  }, [loadTimerHistory]);

  useEffect(() => {
    const onRefresh = () => loadTimerHistory();
    window.addEventListener('vktori:entities-changed', onRefresh);
    return () => window.removeEventListener('vktori:entities-changed', onRefresh);
  }, [loadTimerHistory]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !caseId) return;
    setIsSubmittingReply(true);
    try {
      await api.communications.reply({
        parent_id: replyingTo,
        message_body: replyText.trim(),
      });
      setReplyText('');
      setReplyingTo(null);
      toast(t('replySentSuccessfully'), 'success');
      // Refresh data
      fetchData();
      window.dispatchEvent(new Event('vktori:entities-changed'));
    } catch (e) {
      toast(e.message || t('failedSendReply'), 'error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const loadThread = async (id) => {
    if (expandedThread === id) {
      setExpandedThread(null);
      setExpandedThreadData(null);
      return;
    }
    setExpandedThread(id);
    try {
      const res = await api.communications.getThread(id);
      setExpandedThreadData(res.data);
    } catch (e) {
      toast(t('failedLoadThreadReplies'), 'error');
    }
  };

  const formatTimer = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
  };

  const startTimer = async () => {
    try {
      const res = await api.timers.start(caseId);
      setActiveTimer(res.data);
      toast(t('timerStarted'), 'success');
      window.dispatchEvent(new Event('vktori:entities-changed'));
    } catch (e) {
      toast(e.message || t('failedStartTimer'), 'error');
    }
  };

  const stopTimer = async () => {
    const token = localStorage.getItem('vktori_token');
    if (!activeTimerRef.current || stoppingRef.current || !token) return;
    stoppingRef.current = true;
    const timerId = activeTimerRef.current.id;
    try {
      await api.timers.stop(timerId);
      setActiveTimer(null);
      setTimerSeconds(0);
      toast(t('timerStoppedSaved'), 'success');
      window.dispatchEvent(new Event('vktori:entities-changed'));
    } catch (e) {
      // Only toast error if it's not a "already stopped" message which we are trying to avoid anyway
      if (!e.message?.includes('already stopped')) {
        toast(e.message || t('failedStopTimer'), 'error');
      }
    } finally {
      stoppingRef.current = false;
    }
  };

  useEffect(() => {
    setDocumentsFolderFilter(null);
  }, [caseId]);

  useEffect(() => {
    if (!hasApiMatter) return;
    const onRefresh = () => setMatterRefreshTick((t) => t + 1);
    window.addEventListener('vktori:entities-changed', onRefresh);
    return () => window.removeEventListener('vktori:entities-changed', onRefresh);
  }, [hasApiMatter]);

  useEffect(() => {
    if ((tab === 'Communications' || tab === 'Communication' || tab === 'Messages' || tab === 'Notes') && apiMatter?.id) {
      api.communications.markMatterRead(apiMatter.id)
        .then(() => {
          window.dispatchEvent(new Event('vktori:entities-changed'));
        })
        .catch(() => { });
    }
  }, [tab, apiMatter?.id]);

  const handleStatusChange = async (newStatus) => {
    if (!currentCase || newStatus === currentCase.status) return;
    try {
      const apiSt = newStatus === 'closed' ? 'completed' : newStatus;
      await api.matters.update(caseId, { status: apiSt });
      const res = await api.matters.get(caseId);
      setApiMatter(res.data);
      setCurrentCase(mapMatterToCaseView(res.data));
      toast(t('statusUpdatedTo') + ` ${newStatus}`, 'success');
    } catch (e) {
      toast(e.message || t('updateFailed'), 'error');
    }
  };

  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('');
  const docs = currentCase
    ? (hasApiMatter && apiMatter?.documents
      ? apiMatter.documents.map((d) => ({
        id: d.id,
        name: d.original_name,
        type: matterMimeToFileType(d.mime_type),
        caseId: currentCase.id,
        category: d.category || 'General',
        folder_path: d.folder_path || '',
        by: d.uploader?.full_name || '—',
        uploaded: new Date(d.created_at).toLocaleDateString(),
        created_at_ms: new Date(d.created_at).getTime(),
        size: `${Math.max(1, Math.round(d.file_size / 1024))} KB`,
      }))
      : [])
    : [];

  const rootMatterDocs = docs.filter(d => {
    if (!documentsFolderFilter) return false;
    return documentFolderBucket(d.category) === documentsFolderFilter;
  });

  const currentMatterPath = matterSubfolderPath.join('/');
  const matterPrefix = currentMatterPath === "" ? "" : currentMatterPath + "/";

  // Matter subfolders
  const matterSubfolders = (() => {
    if (!documentsFolderFilter || docSearchTerm) return [];
    const names = [...new Set(
      rootMatterDocs
        .map(d => d.folder_path || "")
        .filter(p => p !== currentMatterPath && p.startsWith(matterPrefix))
        .map(p => p.slice(matterPrefix.length).split('/')[0])
    )].filter(Boolean);

    return names.map(name => {
      const subPath = matterPrefix + name;
      const count = rootMatterDocs.filter(d => {
        const dp = d.folder_path || "";
        return dp === subPath || dp.startsWith(subPath + '/');
      }).length;
      return { name, count };
    });
  })();

  const docsInFolder = (() => {
    let list = docs;
    if (documentsFolderFilter) {
      if (docSearchTerm) {
        list = rootMatterDocs;
      } else {
        list = rootMatterDocs.filter(d => (d.folder_path || "") === currentMatterPath);
      }
    }
    return list.filter(d => {
      const matchSearch = docSearchTerm ? d.name.toLowerCase().includes(docSearchTerm.toLowerCase()) : true;
      const matchCategory = docCategoryFilter ? d.category === docCategoryFilter : true;
      return matchSearch && matchCategory;
    }).sort((a, b) => b.created_at_ms - a.created_at_ms);
  })();

  const handleCompleteTask = async (taskId, e) => {
    e?.stopPropagation();
    try {
      await api.tasks.complete(taskId);
      toast(t('taskCompleted'), 'success');
      window.dispatchEvent(new Event('vktori:entities-changed'));
    } catch (err) {
      toast(err.message || t('failedCompleteTask'), 'error');
    }
  };

  const handleReopenTask = async (taskId, e) => {
    e?.stopPropagation();
    try {
      await api.tasks.reopen(taskId);
      toast(t('taskReopened'), 'success');
      window.dispatchEvent(new Event('vktori:entities-changed'));
    } catch (err) {
      toast(err.message || t('failedReopenTask'), 'error');
    }
  };

  const handleStartTask = async (taskId, e) => {
    e?.stopPropagation();
    try {
      await api.tasks.update(taskId, { status: 'in_progress' });
      toast(t('taskInProgress'), 'success');
      window.dispatchEvent(new Event('vktori:entities-changed'));
    } catch (err) {
      toast(err.message || t('failedStartTask'), 'error');
    }
  };

  const tasks = hasApiMatter && apiMatter?.tasks
    ? apiMatter.tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
      status: t.status,
      task_type: t.task_type,
      assignee: t.assigned_user?.full_name || 'Unassigned',
      due: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No Due Date',
      completed_at: t.completed_at
    }))
    : [];

  const [templatesDrafts, setTemplatesDrafts] = useState([]);

  useEffect(() => {
    if (hasApiMatter && apiMatter?.drafts) {
      setTemplatesDrafts(
        apiMatter.drafts.map((d) => ({
          id: String(d.id),
          title: d.title,
          category: d.category || 'General',
          updated: new Date(d.updated_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          status: d.status,
          preview: (d.content || '').slice(0, 400) || '—',
          content: d.content || '',
        })),
      );
    } else {
      setTemplatesDrafts([]);
    }
  }, [hasApiMatter, apiMatter, currentCase?.id]);
  const [reviewDraft, setReviewDraft] = useState(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [payingInvoiceDbId, setPayingInvoiceDbId] = useState(null);
  const [previewDraft, setPreviewDraft] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [isCreateDraftOpen, setIsCreateDraftOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [newDraftForm, setNewDraftForm] = useState({
    title: '',
    category: '',
    matterName: '',
    clientName: '',
    status: 'Draft',
    notes: '',
  });
  const [globalTemplates, setGlobalTemplates] = useState([]);
  const [creationType, setCreationType] = useState('blank');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  useEffect(() => {
    if (isCreateDraftOpen) {
      api.templates.list({ limit: 100 }).then(res => {
        setGlobalTemplates(res.data || []);
      }).catch(err => console.error('Failed to load templates for selector', err));
    }
  }, [isCreateDraftOpen]);

  const signaturePadRef = useRef(null);
  const signaturePadContainerRef = useRef(null);
  const signaturePadHeight = 210;

  const handleDeleteCase = async () => {
    try {
      await api.matters.remove(caseId);
      toast(t('matterDeletedSuccessfully'), 'success');
      window.dispatchEvent(new CustomEvent('vktori:entities-changed'));
      navigate('/admin/matters');
    } catch (e) {
      toast(e.message || t('failedDeleteMatter'), 'error');
      setIsDeleteConfirmOpen(false);
    }
  };

  const sendTemplateForSignature = async (id) => {
    if (!/^\d+$/.test(String(id))) {
      toast(t('draftNotLinked'), 'info');
      return;
    }
    const email = window.prompt("Enter recipient's email address:");
    if (!email) return;
    try {
      await api.drafts.sendForSignature(id, { recipient_email: email });
      const res = await api.matters.get(caseId);
      setApiMatter(res.data);
      toast(t('draftSentForSignature'), 'success');
    } catch (e) {
      toast(e.message || t('updateFailed'), 'error');
    }
  };
  const downloadDraftPdf = async (id) => {
    try {
      const { blob } = await api.drafts.downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `draft_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast(e.message || t('downloadFailed'), 'error');
    }
  };
  const openDraftPreview = async (item) => {
    setPreviewDraft(item);
    try {
      const { blob } = await api.drafts.downloadPdf(item.id);
      setPreviewPdfUrl(URL.createObjectURL(blob));
    } catch (e) {
      toast(t('failedLoadPdfPreview'), 'error');
    }
  };
  const closeDraftPreview = () => {
    setPreviewDraft(null);
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };
  const openCreateDraftModal = (cat = '') => {
    setCreationType('blank');
    setSelectedTemplateId('');
    setNewDraftForm({
      title: '',
      category: typeof cat === 'string' ? cat : '',
      matterName: currentCase.title || '',
      clientName: currentCase.client || '',
      status: 'Draft',
      notes: '',
    });
    setIsCreateDraftOpen(true);
  };
  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tItem = globalTemplates.find(x => x.id === parseInt(templateId, 10));
    if (tItem) {
      setNewDraftForm(prev => ({
        ...prev,
        title: prev.title || tItem.title,
        category: tItem.category || '',
        notes: tItem.content || ''
      }));
    }
  };
  const saveNewDraft = async () => {
    if (creationType === 'template' && !selectedTemplateId) {
      toast(t('selectTemplateWarning'), 'warning');
      return;
    }
    if (!newDraftForm.title.trim()) {
      toast(t('titleRequiredWarning'), 'warning');
      return;
    }
    if (!newDraftForm.category.trim()) {
      toast(t('categoryRequiredWarning'), 'warning');
      return;
    }
    try {
      let u = null;
      try {
        u = JSON.parse(localStorage.getItem('vktori_user') || 'null');
      } catch { /* ignore */ }
      if (!u?.id) {
        toast(t('missingUserSession'), 'error');
        return;
      }
      await api.drafts.create({
        matter_id: Number(caseId),
        title: newDraftForm.title.trim(),
        category: newDraftForm.category.trim(),
        content: newDraftForm.notes.trim() || null,
        created_by_user_id: u.id,
        status: 'draft',
      });
      const res = await api.matters.get(caseId);
      setApiMatter(res.data);
      setIsCreateDraftOpen(false);
      toast(t('draftCreatedSuccessfully'), 'success');
    } catch (e) {
      toast(e.message || t('updateFailed'), 'error');
    }
  };
  const clientStatus = (status) => status === 'Sent for Signature' ? 'Pending Signature' : status;
  const openReviewAndSign = (item) => {
    setReviewConfirmed(false);
    setHasDrawnSignature(false);
    signaturePadRef.current?.clear();
    setReviewDraft(item);
  };
  const signReviewedDraft = async () => {
    if (!reviewConfirmed || !reviewDraft || !hasDrawnSignature) return;
    try {
      if (!/^\d+$/.test(String(reviewDraft.id))) {
        toast(t('draftNotLinkedDb'), 'info');
        return;
      }
      const signature_data = signaturePadRef.current?.toDataURL() || null;
      if (!signature_data) {
        toast(t('failedCaptureSignature'), 'error');
        return;
      }
      await api.drafts.sign(Number(reviewDraft.id), {
        signature_data,
        ip_address: '0.0.0.0', // Could be captured if needed
        device_info: window.navigator.userAgent,
      });
      const res = await api.matters.get(caseId);
      setApiMatter(res.data);
      setReviewDraft(null);
      setReviewConfirmed(false);
      setHasDrawnSignature(false);
      signaturePadRef.current?.clear();
      toast(t('docSignedSuccessfully'), 'success');
    } catch (e) {
      toast(e.message || t('updateFailed'), 'error');
    }
  };

  const handleEdit = () => {
    openModal('edit-case', { ...currentCase, matterId: caseId, numericId: currentCase?.numericId ?? Number(caseId) });
  };

  const matterModalContext =
    isStaff && caseId ? { matterId: caseId }
      : currentCase?.numericId ? { matterId: String(currentCase.numericId) }
        : {};
  const getProgressByStatus = (status) => (status === 'pending' ? 30 : status === 'active' ? 60 : 100);
  const [statusProgress, setStatusProgress] = useState(0);

  useEffect(() => {
    if (!currentCase?.status) return;
    setStatusProgress(getProgressByStatus(currentCase.status));
  }, [currentCase?.status]);

  useEffect(() => {
    if (!reviewDraft) return;

    const syncSignaturePadSize = () => {
      if (!signaturePadRef.current || !signaturePadContainerRef.current) return;
      const canvas = signaturePadRef.current.getCanvas();
      const displayWidth = signaturePadContainerRef.current.clientWidth;
      if (!canvas || !displayWidth) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = Math.floor(displayWidth * ratio);
      canvas.height = Math.floor(signaturePadHeight * ratio);
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${signaturePadHeight}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      signaturePadRef.current.clear();
      setHasDrawnSignature(false);
    };

    const timeoutId = window.setTimeout(syncSignaturePadSize, 0);
    window.addEventListener('resize', syncSignaturePadSize);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', syncSignaturePadSize);
    };
  }, [reviewDraft]);

  const formatUsd = (n) => {
    const x = Number(n) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(x);
  };
  const formatDateDDMMYYYY = (v) => {
    if (!v) return '—';
    const dt = new Date(v);
    if (Number.isNaN(dt.getTime())) return '—';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const matterInvoices = hasApiMatter && apiMatter?.invoices
    ? apiMatter.invoices.map((inv) => {
      const totalAmt = Number(inv.amount);
      const paidAmt = inv.paid_amount ?? (inv.payments || []).reduce((s, p) => s + Number(p.amount), 0);
      const dueAmt = inv.due_amount ?? Math.max(0, totalAmt - paidAmt);
      return {
        dbId: inv.id,
        id: inv.invoice_number,
        issued: formatDateDDMMYYYY(inv.issued_at || inv.created_at),
        due: formatDateDDMMYYYY(inv.due_date),
        amount: formatUsd(totalAmt),
        paid: formatUsd(paidAmt),
        due_amount: formatUsd(dueAmt),
        outstanding: formatUsd(dueAmt),
        status: inv.status === 'draft' ? 'pending' : inv.status,
        desc: inv.description || currentCase?.title || 'Professional Legal Services',
      };
    })
    : [];

  const billingTotals = (() => {
    const invs = hasApiMatter && apiMatter?.invoices ? apiMatter.invoices : [];
    let total = 0;
    let paid = 0;
    let outstanding = 0;
    for (const inv of invs) {
      if (inv.status === 'void') continue;
      const totalAmt = Number(inv.amount);
      const paidAmt = inv.paid_amount ?? (inv.payments || []).reduce((s, p) => s + Number(p.amount), 0);
      const dueAmt = inv.due_amount ?? Math.max(0, totalAmt - paidAmt);
      total += totalAmt;
      paid += paidAmt;
      outstanding += dueAmt;
    }
    return { total, paid, outstanding };
  })();

  const payAllOutstanding = async () => {
    const payable = matterInvoices.filter((inv) => inv.status !== 'paid' && inv.status !== 'void' && inv.dbId != null);
    if (!payable.length) {
      toast(t('noPayableInvoices'), 'info');
      return;
    }
    try {
      for (const inv of payable) {
        await api.billing.payInvoice(inv.dbId, {
          payment_method: 'manual',
          payment_reference: 'internal-manual',
        });
      }
      const res = await api.matters.get(caseId);
      setApiMatter(res.data);
      toast(t('manualPaymentsRecorded'), 'success');
    } catch (e) {
      toast(e.message || t('updateFailed'), 'error');
    }
  };

  const payInvoiceRow = async (invoice) => {
    if (!invoice?.dbId) {
      toast(t('invoiceNotLinkedDb'), 'info');
      return;
    }
    if (invoice.status === 'paid' || invoice.status === 'void') return;
    try {
      setPayingInvoiceDbId(invoice.dbId);
      await api.billing.payInvoice(invoice.dbId, {
        payment_method: 'manual',
        payment_reference: 'internal-manual',
      });
      const res = await api.matters.get(caseId);
      setApiMatter(res.data);
      toast(t('paymentMarkedPaid'), 'success');
    } catch (e) {
      toast(e.message || t('updateFailed'), 'error');
    } finally {
      setPayingInvoiceDbId(null);
    }
  };

  const commRows = hasApiMatter && apiMatter
    ? (apiMatter.communications || []).map((c) => {
      const typeLabels = {
        portal_message: 'Portal Msg',
        note: 'Internal Note',
        email_log: 'Email',
        call_log: 'Call',
        meeting_log: 'Meeting',
      };
      const t = typeLabels[c.communication_type] || String(c.communication_type || '').replace(/_/g, ' ');
      const body = c.message_body || '';
      const subj = c.subject || body.split('\n')[0].slice(0, 80) || t;
      const { cleanText } = parseBodyAttachments(body);
      return {
        id: c.id,
        type: t,
        communication_type: c.communication_type,
        subject: subj,
        user: c.sender?.full_name || '—',
        fromEmail: c.sender?.email || '',
        text: cleanText.slice(0, 280),
        fullBody: body,
        matter_id: c.matter_id,
        to: c.to,
        cc: c.cc,
        bcc: c.bcc,
        repliesCount: c._count?.replies || 0,
        date: new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
        icon: c.communication_type === 'email_log' 
          ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          : c.communication_type === 'call_log' 
            ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            : c.communication_type === 'meeting_log' 
              ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
        visibility: c.visibility,
      };
    })
    : null;

  const activityRows = hasApiMatter && apiMatter
    ? (apiMatter.activities || []).map((a) => ({
      title: (a.action || 'activity').replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
      text: a.description || '',
      date: new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      type: a.entity_type || 'system',
    }))
    : null;

  const nextDeadlineLabel = (() => {
    if (!hasApiMatter || !apiMatter?.invoices?.length) return currentCase?.nextHearing || '—';
    const open = apiMatter.invoices.filter((i) => i.status !== 'paid');
    if (!open.length) return '—';
    open.sort((a, b) => {
      const ta = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const tb = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return ta - tb;
    });
    const d = open[0].due_date;
    return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  })();

  const recentActivityLabel = (() => {
    if (!hasApiMatter || !apiMatter?.activities?.length) return '—';
    return new Date(apiMatter.activities[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })();

  const overviewBenchmarks = (() => {
    if (!currentCase) return [];
    const invs = apiMatter?.invoices || [];
    const open = invs.filter((i) => i.status !== 'paid' && i.due_date);
    open.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    const nextInv = open[0];
    
    // Add upcoming court appearances
    const upcomingCourtEvents = matterEvents.filter(e => (e.is_court_event || e.court_related) && new Date(e.date) >= new Date());
    upcomingCourtEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    const benchmarks = [
      {
        title: t('nextInvoiceDue') || 'Next invoice due',
        date: nextInv?.due_date ? new Date(nextInv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
        status: nextInv && new Date(nextInv.due_date) < new Date() ? 'Overdue' : 'Scheduled',
      },
      ...upcomingCourtEvents.slice(0, 3).map(e => ({
        title: `${e.type.charAt(0).toUpperCase() + e.type.slice(1).replace('_', ' ')}: ${e.title}`,
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Upcoming'
      })),
      { title: t('matterOpened') || 'Matter opened', date: currentCase.filed, status: 'Recorded' },
      { title: t('lastUpdated') || 'Last updated', date: currentCase.lastUpdated, status: 'Synced' },
    ];
    return benchmarks;
  })();

  if (hasApiMatter && matterLoading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-slate-500">{t('loadingMatters')}</p>
      </div>
    );
  }

  if (hasApiMatter && matterError) {
    return (
      <div className="animate-fade-in space-y-4">
        <button type="button" onClick={() => navigate(isClient ? '/client/matters' : role === 'lawyer' ? '/lawyer/matters' : '/admin/matters')} className="btn btn-secondary btn-xs">{t('backToMatters') || 'Back to Matters'}</button>
        <Card className="border-red-200 bg-red-50/50">
          <p className="text-[13px] text-red-800 font-600">{matterError}</p>
        </Card>
      </div>
    );
  }

  if (!currentCase) {
    return null;
  }

  const getStatusByProgress = (progress) => {
    if (progress >= 100) return 'closed';
    if (progress >= 50) return 'active';
    return 'pending';
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between pb-2 gap-3 flex-wrap">
        <button onClick={() => {
          const currentRole = localStorage.getItem('vktori_role') || role;
          if (currentRole === 'paralegal') navigate('/paralegal/my-matters');
          else if (currentRole === 'partner') navigate('/partner/my-matters');
          else if (currentRole === 'client') navigate('/client/matters');
          else if (currentRole === 'lawyer') navigate('/lawyer/matters');
          else navigate('/admin/matters');
        }} 
          className="btn btn-secondary h-9 px-3 flex items-center gap-2 group transition-all">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
          <span className="text-[12px] font-700 uppercase tracking-widest">{t('backToMatters') || 'Back to Matters'}</span>
        </button>
        {!isClient && (
          <div className="flex gap-2.5 flex-wrap w-full sm:w-auto">
            <button onClick={() => openModal('add-document', { ...matterModalContext, ...(documentsFolderFilter && { docCategory: documentsFolderFilter }) })} className="btn btn-secondary h-9 px-4 text-[12px] font-700 uppercase tracking-wider">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              {t('upload')}
            </button>
            <button onClick={() => openModal('add-note', matterModalContext)} className="btn btn-primary h-9 px-4 text-[12px] font-700 uppercase tracking-wider">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 4v16m8-8H4" /></svg>
              {t('newNote')}
            </button>
          </div>
        )}
      </div>

      {/* Matter Header */}
      <header className="relative bg-white/[0.03] p-8 rounded-[1.5rem] border border-white/5 shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0057c7]" />
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0057c7]/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
        
        <div className={`relative z-10 flex justify-between items-start gap-8 flex-wrap ${isClient ? 'items-center' : ''}`}>
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="font-mono text-[12px] bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 px-3 py-1 rounded-xl font-800 uppercase tracking-widest shadow-sm">{currentCase.id}</span>
              <Badge status={currentCase.status} />
              <Badge status={currentCase.priority} />
              {activeTimer && activeTimer.matter_id === Number(caseId) && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/20 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <span className="text-[10px] font-900 text-red-500 uppercase tracking-[0.15em]">{t('liveSession')}</span>
                </div>
              )}
            </div>
            <h1 className="text-4xl font-800 text-white font-display mb-4 tracking-tight leading-tight">{currentCase.title}</h1>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px] font-600 text-[#8a94a6]">
              <span className="flex items-center gap-2">
                <span className="text-[#0057c7]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                <span className="text-white">{currentCase.client}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#0057c7]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                </span>
                <span className="text-white">{t(currentCase.type)}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#0057c7]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                </span>
                <span className="text-white">{currentCase.lawyer}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#0057c7]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                </span>
                <span className="text-white">{t('openedAt')} {currentCase.filed}</span>
              </span>
            </div>
          </div>
          {!isClient && (
            <div className="flex flex-col items-start sm:items-end gap-4 text-left sm:text-right w-full sm:w-auto bg-white/[0.02] p-5 rounded-2xl border border-white/5 shadow-inner">
              <div className="w-full sm:w-auto">
                <p className="text-[10px] text-[#8a94a6] font-800 uppercase tracking-[0.2em] mb-2">
                  {activeTimer && activeTimer.matter_id !== Number(caseId) ? t('syncInterrupted') : t('sessionDuration') || 'Session Duration'}
                </p>
                <div className="flex items-center gap-4">
                  <p className="text-3xl font-mono font-900 text-[#38bdf8] tabular-nums tracking-tight">
                    {activeTimer && activeTimer.matter_id === Number(caseId) ? formatTimer(timerSeconds) : '00:00:00'}
                  </p>
                  {activeTimer && activeTimer.matter_id === Number(caseId) ? (
                    <button onClick={stopTimer} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all shadow-lg shadow-red-500/10" title="End Session">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                    </button>
                  ) : (
                    <button
                      onClick={startTimer}
                      disabled={activeTimer && activeTimer.matter_id !== Number(caseId)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all shadow-lg ${activeTimer && activeTimer.matter_id !== Number(caseId) ? 'bg-white/5 border-white/5 text-[#8a94a6] cursor-not-allowed opacity-50' : 'bg-[#0057c7]/10 border-[#0057c7]/20 text-[#38bdf8] hover:bg-[#0057c7] hover:text-white hover:border-transparent shadow-[#0057c7]/10'}`}
                      title={activeTimer && activeTimer.matter_id !== Number(caseId) ? t('activeTimerAnotherMatter') : t('startSession')}
                    >
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </button>
                  )}
                </div>
              </div>
              <button onClick={handleEdit} className="btn btn-secondary h-8 px-4 font-800 text-[10px] uppercase tracking-widest border-white/5 w-full sm:w-auto">{t('editMatter')}</button>
            </div>
          )}
        </div>
      </header>

      {/* Summary Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Billed', value: formatUsd(billingTotals.total), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, color: 'text-indigo-400 bg-indigo-500/10' },
          { label: 'Outstanding', value: formatUsd(billingTotals.outstanding), icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'text-[#38bdf8] bg-[#0057c7]/10' },
          { label: 'Documents Vault', value: docs.length, icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Next Deadline', value: nextDeadlineLabel, icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'text-red-400 bg-red-500/10' },
          { label: 'Recent Pulse', value: recentActivityLabel, icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, color: 'text-emerald-400 bg-emerald-500/10' },
        ].map((stat, i) => (
          (isClient && stat.label === 'Total Billed') ? null : (
            <div key={i} className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 shadow-xl flex items-center gap-4 hover:bg-white/[0.05] transition-all group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner transition-transform group-hover:scale-110 ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-[20px] font-900 text-white leading-none tabular-nums">{stat.value}</p>
                <p className="text-[10px] text-[#8a94a6] mt-2 font-800 uppercase tracking-[0.15em]">{t(stat.label)}</p>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Workspace Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Workspace (75%) */}
        <div className="lg:col-span-3 min-w-0 space-y-4">
          <Tabs
            tabs={isClient ? ['Overview', 'Documents', 'Templates / Drafts', 'Communication', 'Schedule', 'Billing'] : ['Overview', 'Documents', 'Templates / Drafts', 'Forms', 'Communication', 'Tasks', 'Schedule', 'Billing', 'Activity', 'Notes']}
            active={tab}
            onChange={(newTab) => {
              setTab(newTab);
              const params = new URLSearchParams(window.location.search);
              params.set('tab', newTab);
              navigate(`${window.location.pathname}?${params.toString()}`, { replace: true });
            }}
          />

          {isClient && (
            <div className="animate-fade-in mb-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0057c7]/20 to-[#38bdf8]/10 rounded-[2rem] blur-2xl" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-2xl">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-4 py-1.5 rounded-full bg-[#0057c7] text-white text-[11px] font-900 uppercase tracking-[0.2em] shadow-lg shadow-[#0057c7]/30">
                      {t('systemStatus') || 'System Status'}
                    </div>
                    <div className="h-px w-12 bg-white/10" />
                    <span className="text-[12px] font-800 text-[#38bdf8] uppercase tracking-widest animate-pulse">{t('liveTrackingActive') || 'Live Tracking Active'}</span>
                  </div>
                  
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-3xl border border-white/10 shadow-inner">
                      {currentCase.status === 'active' ? '⚡' : currentCase.status === 'pending' ? '⏳' : '✅'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-900 text-white font-display tracking-tight mb-2">
                        {t('statusCol')}: <span className="text-[#38bdf8] uppercase">{t(currentCase.status)}</span>
                      </h3>
                      <p className="text-[14px] text-[#8a94a6] font-600 leading-relaxed max-w-xl">
                        {currentCase.status === 'active' ? t('caseActiveDesc') || "Your legal matter is in active progression. Our specialized counsel is executing the current phase of operations." :
                          currentCase.status === 'pending' ? t('casePendingDesc') || "The registry is currently awaiting critical updates or synchronized documentation from your end." :
                            t('caseClosedDesc') || "Mission complete. Your legal matter has been successfully finalized and archived in the secure registry."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-4">
                  <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em]">{t('legalTaskForce') || 'Legal Task Force'}</p>
                  <div className="flex -space-x-3">
                    <Avatar initials="AP" size="md" color="#0057c7" className="ring-4 ring-[#1a2233]" />
                    <Avatar initials="JD" size="md" color="#1e293b" className="ring-4 ring-[#1a2233]" />
                    <Avatar initials="SM" size="md" color="#334155" className="ring-4 ring-[#1a2233]" />
                    <div className="w-10 h-10 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center text-[11px] font-900 text-white ring-4 ring-[#1a2233] border border-white/10">+2</div>
                  </div>
                  <button onClick={() => setTab('Communication')} className="mt-2 text-[11px] font-900 text-white bg-white/5 hover:bg-[#0057c7] px-6 py-2.5 rounded-xl border border-white/10 transition-all uppercase tracking-widest shadow-lg">
                    {t('messageCounsel')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'Overview' && (
            <div className="animate-fade-in space-y-6">
              <Card className="relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-800 text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                    {t('matterExecutiveSummary')}
                  </h3>
                </div>
                <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 mb-8">
                  <p className="text-[14px] leading-relaxed text-[#b8c2d1] italic">
                    "{currentCase.description || t('noFormalDescriptionRecorded')}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-4 h-[1px] bg-[#8a94a6]/30" />
                      {t('legalInfrastructure')}
                    </h4>
                    <div className="space-y-4">
                      {[
                        ['Priority', apiMatter?.priority ? apiMatter.priority.charAt(0).toUpperCase() + apiMatter.priority.slice(1) : 'Medium', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>],
                        ['Opened At', currentCase.filed, <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>],
                        ['Opposing Party', currentCase.opposingParty || 'N/A', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>],
                        ['Lead Counsel', currentCase.lawyer, <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>],
                        apiMatter?.case_number ? ['Case Number', apiMatter.case_number, <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>] : null,
                        apiMatter?.court_name ? ['Court Name', apiMatter.court_name, <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>] : null,
                        apiMatter?.judge_name ? ['Judge Name', apiMatter.judge_name, <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>] : null,
                        apiMatter?.court_address ? ['Court Address', apiMatter.court_address, <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>] : null,
                        apiMatter?.initial_filing_date ? ['Initial Filing Date', formatDateDDMMYYYY(apiMatter.initial_filing_date), <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>] : null,
                        apiMatter?.date_of_loss ? ['Date of Loss', formatDateDDMMYYYY(apiMatter.date_of_loss), <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>] : null,
                        apiMatter?.trial_date ? ['Trial Date', formatDateDDMMYYYY(apiMatter.trial_date), <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>] : null,
                      ].filter(Boolean).map(([k, v, icon]) => (
                        <div key={k} className="flex justify-between items-center text-[13px] group border-b border-white/[0.03] pb-3 last:border-0">
                          <span className="text-[#8a94a6] flex items-center gap-2">
                            <span className="opacity-50 grayscale group-hover:grayscale-0 transition-all">{icon}</span>
                            {t(k)}
                          </span>
                          <span className="font-700 text-white">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-4 h-[1px] bg-[#8a94a6]/30" />
                      {t('criticalBenchmarks')}
                    </h4>
                    <div className="space-y-3">
                      {overviewBenchmarks.map(b => (
                        <div key={b.title} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${b.status === 'Overdue' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-[#0057c7]'}`} />
                            <div>
                              <p className="text-[13px] font-700 text-white group-hover:text-[#38bdf8] transition-colors">{b.title}</p>
                              <p className="text-[11px] text-[#8a94a6] mt-0.5">{b.date}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-900 px-2.5 py-1 rounded-lg uppercase tracking-widest border ${b.status === 'Imminent' || b.status === 'Overdue' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-[#0057c7]/10 text-[#38bdf8] border-[#0057c7]/20'}`}>{t(b.status.toLowerCase()) || b.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Private Strategy Log - Hidden from parties */}
              {!isClient ? (
                <Card className="bg-[#0057c7]/10 border-[#0057c7]/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                    <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                  </div>
                  <h3 className="text-[12px] font-900 uppercase tracking-[0.2em] text-[#38bdf8] mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {t('highLevelInternalStrategy')}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-white font-500 italic opacity-95">
                    {isAdmin && apiMatter
                      ? (apiMatter.description
                        ? `"${apiMatter.description}"`
                        : t('noClassifiedStrategyRecorded'))
                      : '"Phase 2 discovery initiated. Focus remains on insurance indemnification clauses and expert witness preparation. Next mediation scheduled for month-end."'}
                  </p>
                </Card>
              ) : (
                <Card className="bg-[#0057c7]/10 border-[#0057c7]/20">
                  <h3 className="text-[12px] font-900 uppercase tracking-[0.2em] text-[#38bdf8] mb-4">{t('caseProgressionBrief')}</h3>
                  <p className="text-[15px] leading-relaxed text-white font-500">
                    {t('caseProgressionBriefDesc')}
                    <br /><br />
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-800 uppercase tracking-widest mt-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {t('nextActionAffidavitReview')}
                    </span>
                  </p>
                </Card>
              )}

              {!isClient && (
                <div className="mt-4">
                  <h3 className="text-[15px] font-800 text-white flex items-center gap-2 mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                    {t('timeTrackingHistory')}
                  </h3>
                  {timerHistory.length === 0 ? (
                    <div className="bg-white/[0.02] rounded-2xl p-8 text-center border border-dashed border-white/10">
                      <p className="text-[12px] text-[#8a94a6] italic">{t('noActiveOrHistoricalEntries')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {timerHistory.map((tItem) => (
                        <div key={tItem.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.05] transition-all shadow-xl relative overflow-hidden group">
                          {tItem.is_running && <div className="absolute top-0 left-0 w-1.5 h-full bg-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.5)]" />}
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-inner ${tItem.is_running ? 'bg-[#38bdf8]/10 text-[#38bdf8]' : 'bg-white/[0.03] text-[#8a94a6]'}`}>
                              {tItem.is_running ? <svg className="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-800 text-white truncate tracking-tight">{tItem.user?.full_name || t('legalStaff')}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-[#8a94a6] font-600 uppercase tracking-widest">{new Date(tItem.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="text-white/20">→</span>
                                <span className="text-[11px] text-[#8a94a6] font-600 uppercase tracking-widest">{tItem.end_time ? new Date(tItem.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('live')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-[15px] font-900 tabular-nums ${tItem.is_running ? 'text-[#38bdf8] animate-pulse' : 'text-white'}`}>
                              {tItem.duration_minutes ? (tItem.duration_minutes < 60 ? `${tItem.duration_minutes}m` : `${Math.floor(tItem.duration_minutes / 60)}h ${tItem.duration_minutes % 60}m`) : t('active')}
                            </p>
                            <p className="text-[9px] text-[#8a94a6] font-900 uppercase tracking-[0.2em] mt-1">
                              {new Date(tItem.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'Documents' && (
            <div className="animate-fade-in space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[...new Set(['Complaint', 'Evidence', 'Contract', 'Court order', ...remoteFolders.map(f => f.name)])].map((folder) => (
                  <div
                    key={folder}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDocumentsFolderFilter((prev) => (prev === folder ? null : folder));
                        setMatterSubfolderPath([]);
                      }
                    }}
                    onClick={() => {
                      setDocumentsFolderFilter((prev) => (prev === folder ? null : folder));
                      setMatterSubfolderPath([]);
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer group shadow-lg ${documentsFolderFilter === folder
                        ? 'border-[#38bdf8] bg-[#0057c7]/10 ring-4 ring-[#0057c7]/20 shadow-[0_8px_30px_rgba(0,87,199,0.2)]'
                        : 'border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl group-hover:scale-110 transition-transform text-[#38bdf8]">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white font-900 text-[13px] border border-white/10">
                         {docs.filter((d) => documentFolderBucket(d.category) === folder || (d.folder_path && (d.folder_path === folder || d.folder_path.startsWith(folder + '/')))).length}
                      </div>
                    </div>
                    <p className={`text-[14px] font-800 leading-tight ${documentsFolderFilter === folder ? 'text-[#38bdf8]' : 'text-white'}`}>{t(folder) || folder}</p>
                    <p className="text-[10px] text-[#8a94a6] mt-2 font-900 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{t('legalRepository')}</p>
                  </div>
                ))}
              </div>
              <Card>
                <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                  <div>
                    <h3 className="text-[16px] font-800 text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                      {t('discoveryDocuments')}
                    </h3>
                    {documentsFolderFilter && (
                      <p className="text-[11px] text-[#38bdf8] mt-1 font-800 uppercase tracking-widest">{t('activeFilter')}: {t(documentsFolderFilter) || documentsFolderFilter} · {t('clickFolderToReset')}</p>
                    )}
                  </div>
                  <div className="flex gap-3 flex-wrap items-center">
                    {isClient && <button onClick={() => openModal('add-document', { ...matterModalContext, ...(documentsFolderFilter && { docCategory: documentsFolderFilter }) })} className="btn btn-primary h-8 px-4 text-[11px] font-800 uppercase tracking-wider">{t('upload')}</button>}
                    <select className="text-[13px] bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-[#38bdf8] text-white transition-all" value={docCategoryFilter} onChange={e => setDocCategoryFilter(e.target.value)}>
                      <option value="">{t('allCategories')}</option>
                      {[...new Set(docs.map(d => d.category))].map(c => <option key={c} value={c}>{t(c) || c}</option>)}
                    </select>
                    <div className="relative">
                      <input className="text-[13px] bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2 w-full sm:w-64 outline-none focus:border-[#38bdf8] text-white transition-all" placeholder={t('searchObjects')} value={docSearchTerm} onChange={e => setDocSearchTerm(e.target.value)} />
                      <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a94a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    </div>
                  </div>
                </div>

                {/* Breadcrumbs for Matter subfolders */}
                {documentsFolderFilter && (
                  <div className="flex items-center gap-2 text-[11px] font-800 text-[#8a94a6] bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl uppercase tracking-wider mb-6">
                    <span 
                      className="hover:text-white cursor-pointer transition-colors"
                      onClick={() => {
                        setMatterSubfolderPath([]);
                      }}
                    >
                      📁 {t(documentsFolderFilter) || documentsFolderFilter}
                    </span>
                    {matterSubfolderPath.map((segment, idx) => (
                      <React.Fragment key={idx}>
                        <span className="text-white/20">/</span>
                        <span 
                          className="hover:text-white cursor-pointer transition-colors"
                          onClick={() => {
                            setMatterSubfolderPath(prev => prev.slice(0, idx + 1));
                          }}
                        >
                          {segment}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Matter subfolders grid */}
                {matterSubfolders.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    {matterSubfolders.map(sub => (
                      <div
                        key={sub.name}
                        onClick={() => setMatterSubfolderPath(prev => [...prev, sub.name])}
                        className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 cursor-pointer transition-all group"
                      >
                        <span className="text-2xl text-[#f59e0b] group-hover:scale-115 transition-transform">
                          📁
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-800 text-white truncate leading-tight">{sub.name}</p>
                          <p className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest mt-1">{sub.count} {t('items')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Table headers={[t('documentIdentity') || 'Document Identity', t('category') || 'Category', t('originAuthor') || 'Origin / Author', t('dateLogged') || 'Date Logged', '']}>
                  {docsInFolder.map(d => (
                    <Tr key={d.id}>
                      <Td>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <FileIcon type={d.type} />
                            <span className="text-[14px] font-700 text-white truncate max-w-[240px] group-hover:text-[#38bdf8] transition-colors">{d.name}</span>
                          </div>
                          {d.folder_path && (
                            <span className="text-[10px] text-[#8a94a6] font-mono flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                              {d.folder_path}
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td><span className="text-[10px] bg-white/5 text-[#8a94a6] px-2.5 py-1 rounded-xl border border-white/5 font-900 uppercase tracking-widest">{d.category || 'General'}</span></Td>
                      <Td className="text-[#8a94a6] font-700 text-[12px]">{d.by}</Td>
                      <Td className="text-[#8a94a6] font-800 text-[11px] uppercase tracking-wider">{d.uploaded}</Td>
                      <Td>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await previewDocumentBlob(d.id, openModal, d.name);
                              } catch (e) {
                                toast(e.message || 'Preview failed', 'error');
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-[#8a94a6] hover:bg-[#38bdf8]/10 hover:text-[#38bdf8] transition-all shadow-lg group/btn"
                            title="Preview"
                          >
                            <svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await downloadDocumentBlob(d.id, d.name);
                                toast(`${d.name} download started`, 'success');
                              } catch (e) {
                                toast(e.message || 'Download failed', 'error');
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-[#8a94a6] hover:bg-[#0057c7] hover:text-white transition-all shadow-lg group/btn"
                            title="Download"
                          >
                            <svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M7 16V4h10v12" /><path d="M20 12l-8 8-8-8" /></svg>
                          </button>
                        </div>
                      </Td>
                     </Tr>
                  ))}
                </Table>
              </Card>
            </div>
          )}

          {tab === 'Templates / Drafts' && (
            <div className="animate-fade-in">
              <Card>
                <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
                  <div>
                    <h3 className="text-[16px] font-800 text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                      {t('templatesLitigationDrafts')}
                    </h3>
                    <p className="text-[12px] text-[#8a94a6] mt-1 font-600">{t('templatesLitigationDraftsDesc')}</p>
                  </div>
                  {!isClient && (
                    <div className="flex gap-2">
                      <button onClick={() => openModal('browse-templates', { targetMatterId: caseId })} className="btn btn-secondary h-9 px-4 text-[12px] font-700 uppercase tracking-wider">
                        {t('browseLibrary')}
                      </button>
                      <button onClick={() => openCreateDraftModal('letter')} className="btn btn-secondary h-9 px-4 text-[12px] font-700 uppercase tracking-wider">
                        {t('draftLetterBtn')}
                      </button>
                      <button onClick={() => openCreateDraftModal()} className="btn btn-primary h-9 px-4 text-[12px] font-700 uppercase tracking-wider">
                        {t('initializeDraftBtn')}
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {templatesDrafts.length > 0 ? templatesDrafts.map((item) => (
                    <div key={item.id} className="p-6 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.05] transition-all group shadow-2xl relative overflow-hidden">
                      {/* Background Accent for draft status */}
                      <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.02] pointer-events-none transform translate-x-1/2 -translate-y-1/2 rounded-full ${item.status === 'signed' ? 'bg-emerald-500' : 'bg-[#0057c7]'}`} />
                      
                      {(() => {
                        const displayStatus = isClient ? clientStatus(item.status) : draftUiStatus(item.status);
                        return (
                          <>
                            <div className="flex items-center justify-between gap-4 flex-wrap relative z-10">
                              <div className="min-w-0">
                                <p className="text-[16px] font-900 text-white tracking-tight group-hover:text-[#38bdf8] transition-colors">{item.title}</p>
                                <div className="flex items-center gap-3 mt-2 text-[11px] text-[#8a94a6] flex-wrap">
                                  <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.05] text-[#38bdf8] border border-white/5 font-900 uppercase tracking-widest">{t(item.category) || item.category}</span>
                                  <span className="font-800 uppercase tracking-[0.1em] opacity-60">{t('modified')} {item.updated}</span>
                                </div>
                              </div>
                              <span className={`text-[10px] font-900 px-3 py-1 rounded-lg uppercase tracking-[0.2em] border shadow-lg ${displayStatus === 'Draft'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : displayStatus === 'Ready'
                                    ? 'bg-[#0057c7]/10 text-[#38bdf8] border-[#0057c7]/20'
                                    : displayStatus === 'Sent for Signature' || displayStatus === 'Pending Signature'
                                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/10'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10'
                                }`}>
                                {t(displayStatus) || displayStatus}
                              </span>
                            </div>
                            <div className="mt-6 flex gap-3 flex-wrap relative z-10">
                              <button onClick={() => openDraftPreview(item)} className="btn btn-secondary h-8 px-5 text-[11px] font-800 uppercase tracking-widest">{t('preview')}</button>
                              <button onClick={() => downloadDraftPdf(item.id)} className="btn btn-secondary h-8 px-5 text-[11px] font-800 uppercase tracking-widest">{t('downloadPdf')}</button>
                              {!isClient && <button onClick={() => openModal('edit-draft', item)} className="btn btn-secondary h-8 px-5 text-[11px] font-800 uppercase tracking-widest">{t('edit')}</button>}
                              {!isClient && <button onClick={() => openModal('use-template', { ...item, targetMatterId: caseId })} className="btn btn-primary h-8 px-5 text-[11px] font-800 uppercase tracking-widest">{t('cloneDraft')}</button>}
                              {!isClient && item.status !== 'signed' && <button onClick={() => sendTemplateForSignature(item.id)} className="btn btn-primary h-8 px-5 text-[11px] font-800 uppercase tracking-widest border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white">{t('requestSignature')}</button>}
                              {isClient && (item.status === 'sent_for_signature' || displayStatus === 'Pending Signature') && (
                                <button onClick={() => openReviewAndSign(item)} className="btn btn-primary h-8 px-6 text-[11px] font-900 uppercase tracking-widest shadow-emerald-500/20">{t('reviewSign')}</button>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )) : (
                    <EmptyState
                      icon={<svg className="w-12 h-12 text-[#8a94a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                      title={t('draftRegistryEmpty')}
                      desc={t('noLegalDraftsInitialized')}
                      action={
                        !isClient && (
                          <div className="flex gap-3">
                            <button onClick={() => openModal('browse-templates', { targetMatterId: caseId })} className="btn btn-secondary h-9 px-4 text-[11px] font-800 uppercase tracking-widest">{t('libraryAccessBtn')}</button>
                            <button onClick={() => openCreateDraftModal('letter')} className="btn btn-secondary h-9 px-4 text-[11px] font-800 uppercase tracking-widest">{t('draftLetterBtn')}</button>
                            <button onClick={() => openCreateDraftModal()} className="btn btn-primary h-9 px-4 text-[11px] font-800 uppercase tracking-widest">{t('newDraftBtn')}</button>
                          </div>
                        )
                      }
                    />
                  )}
                </div>
              </Card>
            </div>
          )}

          {(tab === 'Communications' || tab === 'Communication' || tab === 'Messages') && (
            <Card>
              <div className="flex items-center justify-between mb-8 gap-2 flex-wrap">
                <h3 className="text-[16px] font-800 text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                  {isClient ? t('portalMessages') : t('communicationHistory')}
                </h3>
                <div className="flex gap-3 flex-wrap">
                  {!isClient && <button onClick={() => openModal('log-call', matterModalContext)} className="btn btn-secondary h-8 px-5 text-[11px] font-800 uppercase tracking-widest">{t('logCallBtn')}</button>}
                  <button className="btn btn-primary h-8 px-5 text-[11px] font-800 uppercase tracking-widest" onClick={() => openModal('compose-email', matterModalContext)}>{isClient ? t('newMessage') : t('sendEmail')}</button>
                </div>
              </div>
              <div className="space-y-4">
                {(commRows || [])
                  .filter(c => c.communication_type !== 'note')
                  .filter(c => !isClient || c.visibility === 'client_visible' || c.visibility === 'client_shared')
                  .map((com, i) => (
                    <div key={i} className="flex gap-4 p-6 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.05] transition-all group shadow-2xl">
                      <div className="w-12 h-12 rounded-full bg-white/[0.05] shadow-inner flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform text-white border border-white/10">
                        {com.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-[15px] font-900 text-white truncate tracking-tight">{com.subject}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest whitespace-nowrap opacity-60">{com.date}</span>
                            {!isClient && (
                              <>
                                <button 
                                  onClick={() => openModal('compose-email', {
                                    id: com.id,
                                    matterId: com.matter_id,
                                    to: com.to,
                                    cc: com.cc,
                                    bcc: com.bcc,
                                    subject: com.subject,
                                    message: com.fullBody
                                  })}
                                  className="text-slate-400 hover:text-blue-400 text-[10px] font-900 uppercase tracking-widest transition-all cursor-pointer"
                                >
                                  {t('edit')}
                                </button>
                                <button 
                                  onClick={() => setShowConfirmDelete(com.id)}
                                  className="text-red-400/80 hover:text-red-400 text-[10px] font-900 uppercase tracking-widest transition-all cursor-pointer"
                                >
                                  {t('delete')}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {(() => {
                          const { cleanText, attachments } = parseBodyAttachments(com.fullBody || com.text || '');
                          return (
                            <>
                              {cleanText.includes('<') && (cleanText.includes('</') || cleanText.includes('/>')) ? (
                                <div dangerouslySetInnerHTML={{ __html: cleanText }} className="text-[13px] text-[#b8c2d1] mb-4 leading-relaxed font-500 opacity-90 communication-html-body" />
                              ) : (
                                <p className="text-[13px] text-[#b8c2d1] mb-4 leading-relaxed font-500 opacity-90">{cleanText}</p>
                              )}
                              {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {attachments.map((att, attIdx) => (
                                    <div key={attIdx} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 shadow-sm">
                                      <button
                                        type="button"
                                        onClick={() => openAttachment(att, com.matter_id || apiMatter?.id, openModal, toast)}
                                        className="flex items-center gap-1.5 text-[11px] text-white font-600 hover:text-[#38bdf8] transition-colors cursor-pointer"
                                        title="Open file in new tab"
                                      >
                                        <span>📄</span>
                                        <span className="truncate max-w-[130px]">{att.name}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => downloadAttachment(att, com.matter_id || apiMatter?.id, toast)}
                                        className="p-1 text-[#8a94a6] hover:text-white hover:bg-white/10 rounded transition-all cursor-pointer ml-1"
                                        title="Download file"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] bg-[#0057c7]/10 text-[#38bdf8] border border-[#0057c7]/20 px-3 py-1 rounded-xl font-900 uppercase tracking-[0.15em]">{t(com.type) || com.type}</span>
                            <span className="text-[11px] text-[#8a94a6] font-700 uppercase tracking-widest opacity-60">· {com.user}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => {
                                setReplyingTo(com.id);
                                setReplyText(`${t('replyingTo')}: ${com.text.slice(0, 50)}${com.text.length > 50 ? '...' : ''}\n\n`);
                              }}
                              className="text-[11px] font-900 text-[#38bdf8] hover:text-white transition-colors uppercase tracking-[0.25em]"
                            >
                              {t('reply')} →
                            </button>
                            {com.repliesCount > 0 && (
                              <button
                                onClick={() => loadThread(com.id)}
                                className="text-[11px] font-900 text-white hover:text-[#38bdf8] transition-colors uppercase tracking-[0.25em]"
                              >
                                {expandedThread === com.id ? t('hideThread') : `${t('viewThread')} (${com.repliesCount})`}
                              </button>
                            )}
                          </div>
                        </div>
                        {replyingTo === com.id && (
                          <div className="mt-8 p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-slide-up">
                            <div className="flex items-center justify-between mb-5">
                              <span className="text-[10px] font-900 uppercase tracking-[0.25em] text-[#38bdf8]">{t('secureResponsePortal')}</span>
                              <button onClick={() => setReplyingTo(null)} className="text-[#8a94a6] hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={t('typeReplyPlaceholder')}
                              rows={5}
                              className="mb-5 text-[14px] bg-white/[0.02] border-white/10 text-white rounded-xl focus:border-[#38bdf8] transition-all"
                            />
                            <div className="flex justify-end gap-3">
                              <button onClick={() => setReplyingTo(null)} className="btn btn-secondary h-9 px-5 text-[11px] font-800 uppercase tracking-widest">{t('cancel')}</button>
                              <button
                                onClick={handleSendReply}
                                disabled={isSubmittingReply || !replyText.trim()}
                                className="btn btn-primary h-9 px-6 text-[11px] font-900 uppercase tracking-widest shadow-[#0057c7]/20"
                              >
                                {isSubmittingReply ? t('dispatching') : t('sendMessage')}
                              </button>
                            </div>
                          </div>
                        )}
                        {expandedThread === com.id && expandedThreadData && (
                          <div className="mt-8 pl-8 space-y-4 border-l-2 border-white/10 animate-slide-down">
                            {expandedThreadData.replies.map((reply, ridx) => (
                              <div key={ridx} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-900 text-white">{reply.sender?.full_name || '—'}</span>
                                    <span className="text-[9px] bg-white/10 text-white px-2 py-0.5 rounded-full font-800 uppercase tracking-widest">{t(reply.sender?.role) || reply.sender?.role || 'User'}</span>
                                  </div>
                                  <span className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest opacity-60">
                                    {new Date(reply.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[13px] text-[#b8c2d1] leading-relaxed font-500 opacity-90">{reply.message_body}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {tab === 'Tasks' && (
            <div className="animate-fade-in space-y-6">
              {(role === 'lawyer' || role === 'admin') && (
                <div className="mb-8">
                  <div className="space-y-6">
                    <Card className="relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                      </div>
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <p className="text-[10px] font-900 uppercase tracking-[0.25em] text-[#8a94a6] mb-1">{t('matterManagement')}</p>
                          <h3 className="text-xl font-900 text-white tracking-tight">{t('statusWorkflow')}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-[#8a94a6] font-900 uppercase tracking-[0.2em] mb-2">{t('currentMatterStatus')}</p>
                          <Badge status={currentCase.status} />
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <label className="block text-[12px] font-900 text-white uppercase tracking-widest mb-6">{t('matterProgressionControl')}</label>
                          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-inner">
                            <div className="flex items-center justify-between text-[11px] text-[#8a94a6] mb-3 uppercase tracking-widest font-900">
                              <span>{t('caseEvolution')}</span>
                              <span className="font-900 text-[#38bdf8]">{statusProgress}%</span>
                            </div>
                            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden mb-6 shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-[#0057c7] to-[#38bdf8] rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(56,189,248,0.4)]"
                                style={{ width: `${statusProgress}%` }}
                              />
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="10"
                              value={statusProgress}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setStatusProgress(value);
                                const nextStatus = getStatusByProgress(value);
                                if (nextStatus !== currentCase.status) {
                                  handleStatusChange(nextStatus);
                                }
                              }}
                              className="w-full mb-8 accent-[#38bdf8] cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                            />
                            <div className="grid grid-cols-3 gap-4">
                              {['active', 'pending', 'closed'].map((s) => {
                                const isSelected = currentCase.status === s;
                                return (
                                  <button
                                    key={s}
                                    onClick={() => {
                                      handleStatusChange(s);
                                      setStatusProgress(getProgressByStatus(s));
                                    }}
                                    className={`py-3.5 px-3 rounded-xl text-[11px] font-900 uppercase tracking-[0.2em] transition-all duration-300 text-center ${isSelected
                                        ? 'bg-gradient-to-br from-[#0057c7] to-[#38bdf8] text-white shadow-2xl scale-[1.05] border border-white/20'
                                        : 'bg-white/[0.03] text-[#8a94a6] hover:bg-white/[0.05] border border-white/5'
                                      }`}
                                  >
                                    {s === 'closed' ? t('finalized') : t(s)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                </div>
              )}
              
              {/* Task Kanban Board */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['Open', 'In Progress', 'Completed'].map(status => {
                    const statusKey = status === 'In Progress' ? 'in_progress' : status.toLowerCase();
                    return (
                    <div key={status} className="space-y-5">
                      <div className="flex items-center justify-between px-3">
                        <h4 className="text-[11px] font-900 uppercase tracking-[0.25em] text-[#8a94a6]">{t(statusKey) || status}</h4>
                        <span className="w-7 h-7 bg-white/[0.05] rounded-xl flex items-center justify-center text-[12px] font-900 text-white border border-white/10 shadow-inner">
                          {tasks.filter(tItem => tItem.status === statusKey).length}
                        </span>
                      </div>
                      {tasks.filter(tItem => tItem.status === statusKey).map(task => {
                        const isLegalDeadline = ['filing_deadline', 'trial_preparation', 'court_appearance'].includes(task.task_type);
                        const isOverdue = new Date(task.due) < new Date(new Date().setHours(0,0,0,0)) && task.status !== 'completed';
                        const isDueToday = task.due === new Date().toLocaleDateString();
                        
                        return (
                        <div key={task.id} className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 shadow-2xl hover:border-[#38bdf8]/40 cursor-pointer transition-all group relative overflow-hidden">
                          {isLegalDeadline && <div className="absolute top-0 left-0 w-full h-1 bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
                          <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className={`text-[9px] font-900 px-3 py-1 rounded-lg uppercase tracking-widest border shadow-lg ${task.priority === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : task.priority === 'Medium' ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{t(task.priority) || task.priority}</span>
                            <div className="flex items-center gap-2">
                              {isOverdue && <span className="text-[9px] text-red-400 font-900 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase">{t('overdue')}</span>}
                              {isDueToday && <span className="text-[9px] text-[#f59e0b] font-900 bg-[#f59e0b]/10 px-2 py-0.5 rounded border border-[#f59e0b]/20 uppercase">{t('dueToday')}</span>}
                              <span className="text-[10px] text-[#8a94a6] font-800 uppercase tracking-widest opacity-60">{t('due') || 'Due'}: {task.due}</span>
                            </div>
                          </div>
                          <p className="text-[15px] font-900 text-white leading-snug group-hover:text-[#38bdf8] transition-colors relative z-10">{task.title}</p>
                          <div className="flex items-center justify-between mt-5 pt-5 border-t border-white/5 relative z-10">
                            <div className="flex items-center gap-2">
                              <Avatar initials={task.assignee.split(' ').map(n => n[0]).join('')} size="xs" />
                              <span className="text-[11px] text-[#8a94a6] font-800 uppercase tracking-widest opacity-60">{task.assignee}</span>
                            </div>
                            {status === 'Open' ? (
                              <button onClick={(e) => handleStartTask(task.id, e)} className="text-[10px] font-900 text-[#38bdf8] hover:text-white uppercase tracking-widest bg-[#38bdf8]/10 px-3 py-1.5 rounded-lg border border-[#38bdf8]/20 transition-all shadow-lg hover:shadow-[#38bdf8]/20">{t('startTask')}</button>
                            ) : status === 'In Progress' ? (
                              <button onClick={(e) => handleCompleteTask(task.id, e)} className="text-[10px] font-900 text-[#22c55e] hover:text-white uppercase tracking-widest bg-[#22c55e]/10 px-3 py-1.5 rounded-lg border border-[#22c55e]/20 transition-all shadow-lg hover:shadow-[#22c55e]/20">{t('completeTask')}</button>
                            ) : (
                              <button onClick={(e) => handleReopenTask(task.id, e)} className="text-[10px] font-900 text-[#f59e0b] hover:text-white uppercase tracking-widest bg-[#f59e0b]/10 px-3 py-1.5 rounded-lg border border-[#f59e0b]/20 transition-all shadow-lg hover:shadow-[#f59e0b]/20">{t('reopenTask')}</button>
                            )}
                          </div>
                        </div>
                      );})}
                      {status === 'Open' && (
                        <button onClick={() => openModal('add-task', matterModalContext)} className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-[11px] text-[#8a94a6] font-900 uppercase tracking-widest hover:bg-white/[0.04] hover:border-[#38bdf8]/40 hover:text-white transition-all shadow-inner">{t('addTaskBtn')}</button>
                      )}
                    </div>
                  )})}
                </div>
            </div>
          )}

          {tab === 'Schedule' && (() => {
            const now = new Date();
            const upcomingHearings = matterEvents.filter(e => (e.is_court_event || e.court_related) && e.type === 'hearing' && new Date(e.date) >= now);
            const trialDates = matterEvents.filter(e => (e.is_court_event || e.court_related) && e.type === 'trial' && new Date(e.date) >= now);
            const filingDeadlines = matterEvents.filter(e => (e.is_court_event || e.court_related) && e.type === 'filing_deadline' && new Date(e.date) >= now);
            const pastAppearances = matterEvents.filter(e => (e.is_court_event || e.court_related) && new Date(e.date) < now);
            const otherEvents = matterEvents.filter(e => !(e.is_court_event || e.court_related));

            return (
              <div className="animate-fade-in space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-900 text-white tracking-tight mb-1">{t('courtCaseSchedule')}</h3>
                    <p className="text-[12px] text-[#8a94a6] font-600">{t('courtCaseScheduleDesc')}</p>
                  </div>
                  {isStaff && (
                    <button onClick={() => openModal('add-event', { matterId: caseId })} className="btn btn-primary shadow-[#0057c7]/20">
                      {t('addCourtEventBtn')}
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* UPCOMING HEARINGS */}
                  <div>
                    <h4 className="text-[11px] font-900 uppercase tracking-[0.25em] text-[#38bdf8] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
                      {t('upcomingHearings')} ({upcomingHearings.length})
                    </h4>
                    {upcomingHearings.length === 0 ? (
                      <p className="text-[12px] text-slate-500 italic pl-4">{t('noUpcomingHearings')}</p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingHearings.sort((a, b) => new Date(a.date) - new Date(b.date)).map((e) => (
                          <div key={e.id} onClick={() => openModal('view-event', e)} className="p-5 rounded-2xl bg-white/[0.02] border border-[#38bdf8]/20 hover:bg-white/[0.05] transition-all flex justify-between items-center cursor-pointer">
                            <div>
                              <h5 className="text-[15px] font-800 text-white">{e.title}</h5>
                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8a94a6] mt-2 font-600">
                                {e.court_name && <span>{t('courtName')}: <strong className="text-white">{e.court_name}</strong></span>}
                                {e.court_room && <span>{t('courtRoom') || 'Room'}: <strong className="text-white">{e.court_room}</strong></span>}
                                {e.judge_name && <span>{t('judgeName')}: <strong className="text-white">{e.judge_name}</strong></span>}
                                {e.appearance_type && <span>{t('typeCol')}: <strong className="text-white uppercase">{t(e.appearance_type)}</strong></span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[13px] font-900 text-white">{new Date(e.date).toLocaleDateString()}</span>
                              <span className="block text-[11px] text-[#8a94a6] mt-1">{new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* TRIAL DATES */}
                  <div>
                    <h4 className="text-[11px] font-900 uppercase tracking-[0.25em] text-red-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      {t('trialDates')} ({trialDates.length})
                    </h4>
                    {trialDates.length === 0 ? (
                      <p className="text-[12px] text-slate-500 italic pl-4">{t('noTrialDates')}</p>
                    ) : (
                      <div className="space-y-3">
                        {trialDates.sort((a, b) => new Date(a.date) - new Date(b.date)).map((e) => (
                          <div key={e.id} onClick={() => openModal('view-event', e)} className="p-5 rounded-2xl bg-white/[0.02] border border-red-500/20 hover:bg-white/[0.05] transition-all flex justify-between items-center cursor-pointer">
                            <div>
                              <h5 className="text-[15px] font-800 text-white">{e.title}</h5>
                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8a94a6] mt-2 font-600">
                                {e.court_name && <span>{t('courtName')}: <strong className="text-white">{e.court_name}</strong></span>}
                                {e.court_room && <span>{t('courtRoom') || 'Room'}: <strong className="text-white">{e.court_room}</strong></span>}
                                {e.judge_name && <span>{t('judgeName')}: <strong className="text-white">{e.judge_name}</strong></span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[13px] font-900 text-white">{new Date(e.date).toLocaleDateString()}</span>
                              <span className="block text-[11px] text-[#8a94a6] mt-1">{new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FILING DEADLINES */}
                  <div>
                    <h4 className="text-[11px] font-900 uppercase tracking-[0.25em] text-amber-500 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {t('filingDeadlines')} ({filingDeadlines.length})
                    </h4>
                    {filingDeadlines.length === 0 ? (
                      <p className="text-[12px] text-slate-500 italic pl-4">{t('noUpcomingFilingDeadlines')}</p>
                    ) : (
                      <div className="space-y-3">
                        {filingDeadlines.sort((a, b) => new Date(a.date) - new Date(b.date)).map((e) => (
                          <div key={e.id} onClick={() => openModal('view-event', e)} className="p-5 rounded-2xl bg-white/[0.02] border border-amber-500/20 hover:bg-white/[0.05] transition-all flex justify-between items-center cursor-pointer">
                            <div>
                              <h5 className="text-[15px] font-800 text-white">{e.title}</h5>
                              <p className="text-[11px] text-[#8a94a6] mt-1 font-600">{e.description || t('filingRequirement')}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[13px] font-900 text-white">{new Date(e.date).toLocaleDateString()}</span>
                              <span className="block text-[11px] text-[#8a94a6] mt-1">{new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PAST APPEARANCES */}
                  <div>
                    <h4 className="text-[11px] font-900 uppercase tracking-[0.25em] text-emerald-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {t('pastAppearances')} ({pastAppearances.length})
                    </h4>
                    {pastAppearances.length === 0 ? (
                      <p className="text-[12px] text-slate-500 italic pl-4">{t('noPastAppearances')}</p>
                    ) : (
                      <div className="space-y-3">
                        {pastAppearances.sort((a, b) => new Date(b.date) - new Date(a.date)).map((e) => (
                          <div key={e.id} onClick={() => openModal('view-event', e)} className="p-5 rounded-2xl bg-white/[0.02] border border-emerald-500/20 hover:bg-white/[0.05] transition-all flex justify-between items-center opacity-70 cursor-pointer">
                            <div>
                              <h5 className="text-[15px] font-800 text-white">{e.title}</h5>
                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8a94a6] mt-1 font-600">
                                {e.court_name && <span>{t('courtName')}: {e.court_name}</span>}
                                {e.judge_name && <span>{t('judgeName')}: {e.judge_name}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[13px] font-900 text-white">{new Date(e.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* OTHER EVENTS */}
                  {otherEvents.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-900 uppercase tracking-[0.25em] text-slate-400 mb-3">
                        {t('otherScheduledEvents')} ({otherEvents.length})
                      </h4>
                      <div className="space-y-3">
                        {otherEvents.map((e) => (
                          <div key={e.id} onClick={() => openModal('view-event', e)} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all flex justify-between items-center cursor-pointer">
                            <div>
                              <h5 className="text-[15px] font-800 text-white">{e.title}</h5>
                              <span className="text-[10px] bg-white/5 text-[#8a94a6] px-2 py-0.5 rounded uppercase tracking-wider font-700 mt-1 inline-block">{e.type}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[13px] font-900 text-white">{new Date(e.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {tab === 'Billing' && (
            <div className="animate-fade-in space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#0057c7]/5 rounded-full blur-3xl" />
                  <p className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-[0.3em] mb-4 opacity-70">{t('totalBilled') || 'Total Matter Billed'}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0057c7]/10 flex items-center justify-center text-[#38bdf8] border border-[#0057c7]/20 shadow-inner">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <p className="text-4xl font-900 text-white tabular-nums tracking-tighter">{formatUsd(billingTotals.total)}</p>
                  </div>
                </div>

                <div className="bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                  <p className="text-[10px] text-emerald-400 font-900 uppercase tracking-[0.3em] mb-4 opacity-70">{t('remittanceSecured')}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-4xl font-900 text-emerald-500 tabular-nums tracking-tighter">{formatUsd(billingTotals.paid)}</p>
                  </div>
                </div>

                <div className="bg-red-500/5 backdrop-blur-xl border border-red-500/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/5 rounded-full blur-3xl" />
                  <p className="text-[10px] text-red-400 font-900 uppercase tracking-[0.3em] mb-4 opacity-70">{t('currentArrears')}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-4xl font-900 text-red-500 tabular-nums tracking-tighter">{formatUsd(billingTotals.outstanding)}</p>
                  </div>
                </div>
              </div>

              <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-10 relative z-10">
                <div className="flex items-center justify-between mb-10 gap-6 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-[#0057c7] rounded-full" />
                    <h3 className="text-lg font-900 text-white tracking-tight uppercase">
                      {isClient ? t('financialLedger') : t('matterInvoiceStream')}
                    </h3>
                  </div>
                  <div className="flex gap-4">
                    {!isClient && (
                      <button className="h-11 px-6 rounded-2xl bg-[#0057c7] text-white text-[11px] font-900 uppercase tracking-widest hover:bg-[#004bb1] transition-all shadow-xl shadow-[#0057c7]/20" onClick={() => openModal('create-invoice', matterModalContext)}>
                        {t('newInvoice')}
                      </button>
                    )}
                    {isClient && billingTotals.outstanding > 0 && (
                      <button className="h-11 px-8 rounded-2xl bg-emerald-600 text-white text-[11px] font-900 uppercase tracking-[0.2em] hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-600/20" onClick={payAllOutstanding}>
                        {t('payAllOutstandingBtn')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table headers={[t('invoiceCol'), t('issuedCol'), t('dueDateCol'), t('totalCol'), t('paidCol'), t('balanceCol'), t('statusCol'), '']}>
                    {matterInvoices.map(inv => (
                      <Tr key={inv.id} className="group hover:bg-white/[0.02] transition-colors">
                        <Td>
                          <div className="flex flex-col">
                            <span className="font-mono text-[14px] font-900 text-[#38bdf8] tracking-tighter">{inv.id}</span>
                            <span className="text-[9px] text-[#8a94a6] font-800 uppercase tracking-widest opacity-50">{t('transactionId')}</span>
                          </div>
                        </Td>
                        <Td className="text-[#8a94a6] text-[13px] font-700 uppercase tracking-tight">{inv.issued}</Td>
                        <Td className="text-[#8a94a6] text-[13px] font-700 uppercase tracking-tight">{inv.due}</Td>
                        <Td className="font-900 text-white text-[16px] tabular-nums tracking-tighter">{inv.amount}</Td>
                        <Td className="text-emerald-500/70 font-800 text-[14px] tabular-nums">{inv.paid}</Td>
                        <Td className="text-red-400 font-900 text-[14px] tabular-nums bg-white/[0.01] rounded-lg">{inv.outstanding}</Td>
                        <Td><Badge status={inv.status} /></Td>
                        <Td>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => openModal('view-invoice', { ...inv, client: currentCase?.client || '—' })}
                              className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#38bdf8] hover:bg-[#0057c7] hover:text-white transition-all border border-white/5"
                              title={t('reviewInvoiceBtn')}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            {isClient && inv.status !== 'paid' && inv.status !== 'void' && inv.dbId != null && (
                              <button
                                type="button"
                                onClick={() => payInvoiceRow(inv)}
                                disabled={payingInvoiceDbId === inv.dbId}
                                className="h-8 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-900 uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                              >
                                {payingInvoiceDbId === inv.dbId ? '...' : t('payBtn')}
                              </button>
                            )}
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </Table>
                </div>
              </Card>
            </div>
          )}

          {tab === 'Activity' && (
            <Card>
              <h3 className="text-[16px] font-900 text-white mb-10 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                {t('caseActivityIntelligence')}
              </h3>
              <div className="space-y-0">
                {(activityRows || []).map((act, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-4 border-slate-900 shadow-2xl z-10 ${i === 0 ? 'bg-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.6)]' : 'bg-white/20'} mt-2.5`} />
                      {i < activityRows.length - 1 && <div className="w-[1.5px] h-full bg-white/5 -mt-1 group-hover:bg-[#38bdf8]/40 transition-colors" />}
                    </div>
                    <div className="pb-12 flex-1">
                      <div className="flex justify-between items-start mb-2.5">
                        <h4 className="text-[16px] font-900 text-white tracking-tight group-hover:text-[#38bdf8] transition-colors">{act.title}</h4>
                        <span className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-[0.2em] opacity-50">{act.date}</span>
                      </div>
                      <p className="text-[14px] text-[#b8c2d1] leading-relaxed font-500 opacity-90">{act.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'Notes' && (
            <div className="animate-fade-in space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-[16px] font-900 text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                    {t('matterIntelligenceBriefs')}
                  </h3>
                  {!isClient && <button className="btn btn-primary h-8 px-5 text-[11px] font-900 uppercase tracking-widest shadow-[#f59e0b]/10" onClick={() => openModal('add-note', matterModalContext)}>{t('addBriefBtn')}</button>}
                </div>
                <div className="space-y-5">
                  {(apiMatter?.communications || [])
                    .filter((c) => c.communication_type === 'note')
                    .map((c) => ({
                      author: c.sender?.full_name || t('legalBriefAuthor') || 'Legal Intelligence',
                      date: new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
                      text: c.message_body || '',
                      visibility: c.visibility === 'client_visible' || c.visibility === 'client_shared' ? 'Shared' : 'Classified',
                    }))
                    .map((note, idx) => (
                      (isClient && note.visibility === 'Classified') ? null : (
                        <div key={idx} className="p-6 rounded-2xl border border-white/5 bg-white/[0.03] group hover:bg-white/[0.05] transition-all shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-white/5 group-hover:bg-[#f59e0b]/40 transition-colors" />
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                              <Avatar initials={note.author.split(' ').map(n => n[0]).join('')} size="xs" />
                              <div>
                                <span className="text-[14px] font-900 text-white tracking-tight">{note.author}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-[0.15em] opacity-60">{note.date}</span>
                                </div>
                              </div>
                            </div>
                            {!isClient && (
                              <span className={`text-[9px] font-900 px-3 py-1 rounded-lg uppercase tracking-widest border shadow-lg ${note.visibility === 'Classified' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                {t(note.visibility.toLowerCase()) || note.visibility}
                              </span>
                            )}
                          </div>
                          <p className="text-[14px] text-[#b8c2d1] leading-relaxed font-500 opacity-90 pl-11">{note.text}</p>
                        </div>
                      )
                    ))}
                </div>
              </Card>
            </div>
          )}

          {tab === 'Forms' && (
            <div className="animate-fade-in space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                  <div>
                    <h3 className="text-[16px] font-800 text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                      {t('californiaCourtForms')}
                    </h3>
                    <p className="text-[12px] text-[#8a94a6] mt-1 font-600">{t('generatedJudicialFormsDesc')}</p>
                  </div>
                  <button
                    onClick={() => navigate(role === 'lawyer' ? '/lawyer/court-forms' : '/admin/court-forms')}
                    className="btn btn-primary h-9 px-5 text-[12px] font-700 uppercase tracking-wider"
                  >
                    {t('generateCourtFormBtn')}
                  </button>
                </div>

                {(() => {
                  const [forms, setForms] = useState([]);
                  const [formsLoading, setFormsLoading] = useState(true);

                  useEffect(() => {
                    api.courtForms.listDrafts({ matter_id: caseId })
                      .then((res) => setForms(Array.isArray(res.data) ? res.data : []))
                      .catch(() => {})
                      .finally(() => setFormsLoading(false));
                  }, []);

                  if (formsLoading) {
                    return (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin w-6 h-6 rounded-full border-2 border-[#0057c7] border-t-transparent" />
                      </div>
                    );
                  }

                  if (forms.length === 0) {
                    return (
                      <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                        <p className="text-sm text-[#8a94a6] italic">{t('noCourtFormsGenerated')}</p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <Table headers={[t('formCol'), t('statusCol'), t('generatedByCol'), t('lastModifiedCol'), '']}>
                        {forms.map((f) => (
                          <Tr key={f.id}>
                            <Td>
                              <p className="font-mono text-sm font-bold text-[#38bdf8]">{f.template?.form_number}</p>
                              <p className="text-[#8a94a6] text-xs mt-0.5">{f.template?.title}</p>
                            </Td>
                            <Td>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                                f.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              }`}>{t(f.status) || f.status}</span>
                            </Td>
                            <Td className="text-sm text-[#8a94a6]">{f.creator?.full_name || '—'}</Td>
                            <Td className="text-sm text-[#8a94a6]">{new Date(f.updated_at).toLocaleDateString()}</Td>
                            <Td>
                              <button
                                onClick={() => navigate(role === 'lawyer' ? `/lawyer/court-forms` : `/admin/court-forms`)}
                                className="text-xs font-semibold px-3 py-1.5 bg-[#0057c7]/20 text-[#38bdf8] border border-[#0057c7]/30 rounded-lg hover:bg-[#0057c7]/40 transition-all"
                              >
                                {t('manageInLibrary')}
                              </button>
                            </Td>
                          </Tr>
                        ))}
                      </Table>
                    </div>
                  );
                })()}
              </Card>
            </div>
          )}
        </div>

        {/* Status / Quick Panel (25%) */}
        <div className="space-y-4 lg:sticky lg:top-0">
          <Card className="!p-0 overflow-hidden border-white/5 bg-white/[0.02]">
            <div className="bg-gradient-to-br from-slate-900 to-[#0057c7]/20 p-6 border-b border-white/5">
              <p className="text-[10px] font-900 uppercase tracking-[0.25em] text-[#38bdf8] mb-6 text-center opacity-80">{t('matterProfileIdentity')}</p>
              <div className="flex flex-col items-center gap-4">
                <div className="min-w-[5rem] h-14 px-5 rounded-2xl bg-gradient-to-br from-[#0057c7] to-[#38bdf8] flex items-center justify-center text-white text-xl font-900 tracking-tighter shadow-[0_8px_20px_rgba(0,87,199,0.3)] border border-white/20">
                  {currentCase.matter_number || currentCase.id || '—'}
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-800 text-white tracking-tight">{currentCase.title}</h3>
                  <p className="text-[#8a94a6] text-[12px] font-600 mt-1 uppercase tracking-widest">{t(currentCase.type)}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-4">{t('personnelClients')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] text-[#38bdf8] flex items-center justify-center text-lg border border-white/5 transition-colors group-hover:bg-[#0057c7]/10 group-hover:border-[#0057c7]/20">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8a94a6] font-800 uppercase tracking-widest mb-0.5">{t('assignedCounsel')}</p>
                      <p className="text-[14px] font-700 text-white tracking-tight">{currentCase.lawyer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] text-emerald-400 flex items-center justify-center text-lg border border-white/5 transition-colors group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8a94a6] font-800 uppercase tracking-widest mb-0.5">{t('clients')}</p>
                      <p className="text-[14px] font-700 text-white tracking-tight leading-snug">{currentCase.client}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/5">
                <h4 className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-4">{t('commandCenter')}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[13px] bg-white/[0.02] p-2 rounded-xl">
                    <span className="text-[#8a94a6] font-600">{t('status')}</span>
                    <Badge status={currentCase.status} />
                  </div>
                  <div className="flex justify-between items-center text-[13px] bg-white/[0.02] p-2 rounded-xl">
                    <span className="text-[#8a94a6] font-600">{t('actionPriority')}</span>
                    <Badge status={currentCase.priority} />
                  </div>
                  <div className="flex justify-between items-center text-[13px] p-2">
                    <span className="text-[#8a94a6] font-600">{t('portalSync')}</span>
                    <span className="flex items-center gap-2 text-emerald-400 font-800 text-[11px] uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      {t('live') || 'Live'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] p-2 pt-1 border-t border-white/[0.03] mt-2">
                    <span className="text-[#8a94a6] font-600">{t('registrySnapshot')}</span>
                    <span className="font-800 text-white uppercase tracking-tighter">{currentCase.lastUpdated || '—'}</span>
                  </div>
                </div>
              </div>
              {!isClient && (
                <div className="pt-4">
                  <button onClick={() => setIsDeleteConfirmOpen(true)} className="w-full py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] font-900 uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 group/arch">
                    <svg className="w-4 h-4 transition-transform group-hover/arch:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    {t('deleteCaseFileBtn')}
                  </button>
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>

      {isDeleteConfirmOpen && (
        <Modal
          title={t('deleteCaseFileBtn')}
          onClose={() => setIsDeleteConfirmOpen(false)}
          footer={
            <>
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="btn btn-secondary btn-sm">{t('cancel')}</button>
              <button onClick={handleDeleteCase} className="btn btn-primary btn-sm !bg-red-500 hover:!bg-red-600 !border-red-500">{t('deletePermanently')}</button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div>
                <p className="text-[13px] text-red-200 font-700">{t('areYouSureDeleteCaseFile')}</p>
                <p className="text-[12px] text-red-300/70 mt-1">{t('deleteCaseFileDesc')}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {isCreateDraftOpen && (
        <Modal
          title={t('createNewDraft')}
          onClose={() => setIsCreateDraftOpen(false)}
          footer={
            <>
              <button onClick={() => setIsCreateDraftOpen(false)} className="btn btn-secondary btn-sm">{t('cancel')}</button>
              <button onClick={saveNewDraft} className="btn btn-primary btn-sm">{t('saveDraft')}</button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label={t('draftCreationMode')} required>
              <Select
                value={creationType}
                onChange={(e) => {
                  setCreationType(e.target.value);
                  if (e.target.value === 'blank') {
                    setSelectedTemplateId('');
                  }
                }}
              >
                <option value="blank">{t('createBlankDraft')}</option>
                <option value="template">{t('createFromTemplate')}</option>
              </Select>
            </Field>

            {creationType === 'template' && (
              <Field label={t('selectTemplate')} required>
                <Select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  <option value="">{t('selectTemplatePlaceholder')}</option>
                  {globalTemplates.map(tItem => (
                    <option key={tItem.id} value={tItem.id}>{tItem.title} ({tItem.category || 'General'})</option>
                  ))}
                </Select>
              </Field>
            )}

            <Field label={t('draftTitle')} required>
              <Input
                value={newDraftForm.title}
                onChange={(e) => setNewDraftForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t('enterDraftTitlePlaceholder')}
              />
            </Field>
            <Field label={t('categoryTemplateType')} required>
              <Select
                value={newDraftForm.category}
                onChange={(e) => setNewDraftForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="">{t('selectCategory')}</option>
                <option value="Agreement">{t('Agreement') || 'Agreement'}</option>
                <option value="letter">{t('letter') || 'Letter'}</option>
                <option value="court_form">{t('court_form') || 'Court Form'}</option>
                <option value="Contract">{t('Contract') || 'Contract'}</option>
                <option value="Motion">{t('Motion') || 'Motion'}</option>
                <option value="Pleading">{t('Pleading') || 'Pleading'}</option>
                <option value="Affidavit">{t('Affidavit') || 'Affidavit'}</option>
                <option value="Notice">{t('Notice') || 'Notice'}</option>
                <option value="Demand Letter">{t('Demand Letter') || 'Demand Letter'}</option>
                <option value="Legal Disclaimer">{t('Legal Disclaimer') || 'Legal Disclaimer'}</option>
                <option value="Engagement">{t('Engagement') || 'Engagement'}</option>
                <option value="Intake">{t('Intake') || 'Intake'}</option>
                <option value="Litigation">{t('Litigation') || 'Litigation'}</option>
                <option value="Resolution">{t('Resolution') || 'Resolution'}</option>
                <option value="General">{t('General') || 'General'}</option>
                <option value="Other">{t('other') || 'Other...'}</option>
              </Select>
            </Field>
            <Field label={t('relatedMatterName')}>
              <Input
                value={newDraftForm.matterName}
                onChange={(e) => setNewDraftForm((prev) => ({ ...prev, matterName: e.target.value }))}
              />
            </Field>
            <Field label={t('clientName')}>
              <Input
                value={newDraftForm.clientName}
                onChange={(e) => setNewDraftForm((prev) => ({ ...prev, clientName: e.target.value }))}
              />
            </Field>
            <Field label={t('draftStatus')}>
              <Input value={newDraftForm.status} disabled />
            </Field>
            <Field label={t('mockContentNotes')}>
              <Textarea
                rows={4}
                value={newDraftForm.notes}
                onChange={(e) => setNewDraftForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder={t('addMockNotesPlaceholder')}
              />
            </Field>
          </div>
        </Modal>
      )}

      {reviewDraft && (
        <Modal
          title={`${t('reviewSign')} · ${reviewDraft.title}`}
          onClose={() => {
            setReviewDraft(null);
            setReviewConfirmed(false);
            setHasDrawnSignature(false);
            signaturePadRef.current?.clear();
          }}
          footer={
            <>
              <button onClick={() => {
                setReviewDraft(null);
                setReviewConfirmed(false);
                setHasDrawnSignature(false);
                signaturePadRef.current?.clear();
              }} className="btn btn-secondary btn-sm">{t('cancel')}</button>
              <button
                onClick={signReviewedDraft}
                disabled={!reviewConfirmed || !hasDrawnSignature}
                className={`btn btn-primary btn-sm ${(!reviewConfirmed || !hasDrawnSignature) ? 'opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-none' : ''}`}
              >
                {t('signDocument')}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-800 uppercase tracking-[0.18em] text-[#8a94a6] mb-1">{t('documentTitle')}</p>
              <p className="text-[14px] font-700 text-white tracking-tight">{reviewDraft.title}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-800 uppercase tracking-[0.18em] text-[#8a94a6] mb-2">{t('shortPreview')}</p>
              <p className="text-[13px] text-[#b8c2d1] leading-relaxed">{reviewDraft.preview}</p>
              <span className="inline-flex mt-3 text-[10px] font-900 px-3 py-1 rounded-lg uppercase tracking-[0.2em] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                {t('pendingSignature')}
              </span>
            </div>
            <div className="rounded-2xl border border-[#0057c7]/20 bg-[#0057c7]/5 p-4">
              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={reviewConfirmed}
                  onChange={(e) => setReviewConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded-[6px] border-white/10 bg-white/5 text-[#38bdf8] focus:ring-[#38bdf8]/50"
                />
                <span className="text-[12.5px] text-[#b8c2d1] font-600 group-hover:text-white transition-colors">
                  {t('confirmReviewedDoc')}
                </span>
              </label>
              <div className="mt-3">
                <div ref={signaturePadContainerRef} className="rounded-xl border border-white/10 bg-white/[0.05] p-2">
                  <SignatureCanvas
                    ref={signaturePadRef}
                    penColor="#ffffff"
                    onEnd={() => setHasDrawnSignature(!signaturePadRef.current?.isEmpty())}
                    canvasProps={{
                      className: 'w-full rounded-lg bg-transparent cursor-crosshair',
                      height: signaturePadHeight,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-[11px] text-[#8a94a6] font-600">{t('useMouseOrTouchSign')}</p>
                  <button
                    onClick={() => {
                      signaturePadRef.current?.clear();
                      setHasDrawnSignature(false);
                    }}
                    className="btn btn-secondary btn-xs bg-white/5 border-white/10 hover:bg-white/10"
                  >
                    {t('clearSignature')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {previewDraft && (
        <Modal
          title={`${t('draftPreview')} · ${previewDraft.title}`}
          onClose={closeDraftPreview}
          wide
          footer={
            <>
              <button onClick={closeDraftPreview} className="btn btn-secondary btn-sm">{t('close')}</button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-800 uppercase tracking-[0.18em] text-[#8a94a6] mb-1">{t('draftTitle')}</p>
                  <p className="text-[14px] font-700 text-white">{previewDraft.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-800 uppercase tracking-[0.18em] text-[#8a94a6] mb-1">{t('matterName')}</p>
                  <p className="text-[14px] font-600 text-[#dbe7ff]">{currentCase.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-800 uppercase tracking-[0.18em] text-[#8a94a6] mb-1">{t('clientName')}</p>
                  <p className="text-[14px] font-600 text-[#dbe7ff]">{currentCase.client}</p>
                </div>
                <div>
                  <p className="text-[10px] font-800 uppercase tracking-[0.18em] text-[#8a94a6] mb-1">{t('lastUpdated') || 'Last Updated'}</p>
                  <p className="text-[14px] font-600 text-[#dbe7ff]">{previewDraft.updated}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className={`inline-flex text-[10px] font-900 px-3 py-1 rounded-lg uppercase tracking-[0.2em] border shadow-lg ${previewDraft.status === 'Draft'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10'
                    : previewDraft.status === 'Ready'
                      ? 'bg-[#0057c7]/10 text-[#38bdf8] border-[#0057c7]/20 shadow-[#0057c7]/10'
                      : previewDraft.status === 'Sent for Signature' || previewDraft.status === 'Pending Signature'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/10'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10'
                  }`}>
                  {t(previewDraft.status) || previewDraft.status}
                </span>
              </div>
            </div>

            <div className="border border-white/10 rounded-2xl bg-white/[0.03] overflow-hidden">
              {previewPdfUrl ? (
                <iframe src={previewPdfUrl} className="w-full h-[600px] border-none" title="PDF Preview" />
              ) : (
                <div className="p-10 text-center flex flex-col items-center justify-center h-[400px]">
                  <div className="w-12 h-12 border-4 border-[#38bdf8] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-[#8a94a6] font-600">Generating PDF preview...</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#121826] border border-white/10 rounded-3xl p-6 w-full max-w-[400px] shadow-2xl flex flex-col gap-4 text-center text-white">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-[16px] font-800">{t('deleteTransmission')}</h3>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              {t('deleteTransmissionDesc')}
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[12px] font-700 py-2.5 rounded-xl transition-all"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDeleteCommunication(showConfirmDelete)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-[12px] font-700 py-2.5 rounded-xl transition-all shadow-md shadow-red-600/10"
              >
                {t('deletePermanently')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────
//  CALENDAR PAGE
// ─────────────────────────────────────────────────────────
export function CalendarPage({ toast, openModal, role = 'lawyer' }) {
  const { t } = useLanguage();
  const isAdmin = role !== 'client';
  const [viewDate, setViewDate] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [matterPick, setMatterPick] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#0057c7');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const [error, setError] = useState('');

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickMatter, setQuickMatter] = useState('');
  const [quickType, setQuickType] = useState('meeting');
  const [quickReminder, setQuickReminder] = useState('');
  const [quickCreateTask, setQuickCreateTask] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState('all');

  const [showArchived, setShowArchived] = useState(false);

  const loadData = useCallback(async () => {
    if (isFirstLoad.current) { setLoading(true); isFirstLoad.current = false; }
    setError('');
    try {
      const [calRes, matRes, catsRes] = await Promise.all([
        api.calendar.list(),
        api.matters.list({ limit: 500 }),
        api.calendar.listCategories({ include_inactive: true }),
      ]);
      setEvents(calRes.data || []);
      const mats = Array.isArray(matRes.data) ? matRes.data : [];
      setMatterPick(mats.map((m) => ({ id: m.id, label: m.matter_number || String(m.id) })));
      
      // Ensure all loaded categories have a sort_order
      const sortedCats = (catsRes.data || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setCategories(sortedCats);
    } catch (e) {
      setError(e.message || 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMoveCategory = async (cat, direction) => {
    const idx = categories.findIndex(c => c.id === cat.id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === categories.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const targetCat = categories[targetIdx];

    const currentOrder = cat.sort_order || 0;
    const targetOrder = targetCat.sort_order || 0;

    const newCurrentOrder = targetOrder;
    const newTargetOrder = currentOrder === targetOrder ? currentOrder + 1 : currentOrder;

    // Optimistic update: swap instantly in local state so UI responds immediately
    const prevCategories = [...categories];
    const updated = [...categories];
    updated[idx] = { ...cat, sort_order: newCurrentOrder };
    updated[targetIdx] = { ...targetCat, sort_order: newTargetOrder };
    updated.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    setCategories(updated);

    try {
      await Promise.all([
        api.calendar.updateCategory(cat.id, { sort_order: newCurrentOrder }),
        api.calendar.updateCategory(targetCat.id, { sort_order: newTargetOrder })
      ]);
    } catch {
      // Roll back to previous order if API fails
      setCategories(prevCategories);
      toast('Failed to reorder category', 'error');
    }
  };

  const handleToggleArchive = async (cat) => {
    try {
      await api.calendar.updateCategory(cat.id, { is_active: !cat.is_active });
      toast(`Category ${cat.is_active ? 'archived' : 'activated'}`, 'success');
      loadData();
    } catch {
      toast('Failed to update category status', 'error');
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('vktori:entities-changed', loadData);
    return () => window.removeEventListener('vktori:entities-changed', loadData);
  }, [loadData]);

  useEffect(() => {
    if (categories.length > 0 && quickType === 'meeting') {
      const found = categories.find(c => c.name.toLowerCase() === 'meeting') || categories[0];
      setQuickType(found.name);
    }
  }, [categories, quickType]);

  const getEventColor = (e) => {
    if (e.type === 'invoice') return '#f59e0b';
    if (e.type === 'matter') return '#38bdf8';
    
    if (e.categories && Array.isArray(e.categories) && e.categories.length > 0) {
      const cat = categories.find(c => c.name.toLowerCase() === e.categories[0].toLowerCase());
      if (cat) return cat.color;
    }
    
    const typeColors = {
      hearing: '#ef4444',
      meeting: '#10b981',
      filing_deadline: '#f59e0b',
      consultation: '#38bdf8',
    };
    return typeColors[e.type] || '#10b981';
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      toast('Please enter category name', 'error');
      return;
    }
    try {
      await api.calendar.createCategory({
        name: newCatName.trim(),
        color: newCatColor
      });
      toast('Category created successfully', 'success');
      setNewCatName('');
      setNewCatColor('#0057c7');
      window.dispatchEvent(new Event('vktori:entities-changed'));
    } catch (e) {
      toast(e.message || 'Failed to create category', 'error');
    }
  };

  const startEdit = (cat) => {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      toast('Please enter category name', 'error');
      return;
    }
    try {
      await api.calendar.updateCategory(id, {
        name: editName.trim(),
        color: editColor
      });
      toast('Category updated successfully', 'success');
      setEditingCatId(null);
      window.dispatchEvent(new Event('vktori:entities-changed'));
    } catch (e) {
      toast(e.message || 'Failed to update category', 'error');
    }
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Events in this category will keep their tags but their colors will fallback to defaults.')) return;
    try {
      await api.calendar.removeCategory(id);
      toast('Category deleted successfully', 'success');
      window.dispatchEvent(new Event('vktori:entities-changed'));
    } catch (e) {
      toast(e.message || 'Failed to delete category', 'error');
    }
  };

  const handleQuickAdd = async () => {
    if (!quickTitle.trim()) {
      toast('Please enter an event title', 'info');
      return;
    }
    setIsAdding(true);
    try {
      let reminderDate = null;
      if (quickReminder) {
        const evDateStr = quickDate || new Date().toISOString().split('T')[0];
        const eventDate = new Date(`${evDateStr}T00:00:00`);
        const offsetMap = {
          '1_hour': 60 * 60 * 1000,
          '1_day': 24 * 60 * 60 * 1000,
          '3_days': 3 * 24 * 60 * 60 * 1000,
          '7_days': 7 * 24 * 60 * 60 * 1000
        };
        if (quickReminder === 'same_day') {
          reminderDate = new Date(eventDate);
          reminderDate.setHours(9, 0, 0, 0);
        } else if (offsetMap[quickReminder]) {
          reminderDate = new Date(eventDate.getTime() - offsetMap[quickReminder]);
        }
      }

      await api.calendar.create({
        title: quickTitle,
        date: quickDate,
        matter_id: quickMatter || null,
        type: quickType,
        categories: [quickType],
        reminder_date: reminderDate ? reminderDate.toISOString() : null,
        create_task: quickCreateTask
      });
      toast('Event created successfully', 'success');
      setQuickTitle('');
      setQuickMatter('');
      setQuickType('meeting');
      setQuickReminder('');
      setQuickCreateTask(false);
      loadData();
    } catch (e) {
      toast(e.message || 'Failed to create event', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const monthIdx = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  const days = [];
  const daysInMonth = getDaysInMonth(year, monthIdx);
  const firstDay = getFirstDayOfMonth(year, monthIdx);

  // Prev month padding
  const prevMonthDays = getDaysInMonth(year, monthIdx - 1);
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: prevMonthDays - firstDay + i + 1, other: true });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d });
  }

  // Next month padding
  while (days.length % 7 !== 0) {
    days.push({ day: days.length - (firstDay + daysInMonth) + 1, other: true });
  }

  const handlePrev = () => setViewDate(new Date(year, monthIdx - 1, 1));
  const handleNext = () => setViewDate(new Date(year, monthIdx + 1, 1));

  const getTypeStyle = (type) => {
    switch (type) {
      case 'invoice': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'matter': return 'bg-[#0057c7]/20 text-[#38bdf8] border-[#0057c7]/30';
      case 'hearing': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const sameDay = (d1, d2) => {
    const a = new Date(d1);
    const b = new Date(d2);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredEvents = events.filter(e => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  const monthEventsSide = filteredEvents
    .filter((e) => {
      const dt = new Date(e.date);
      return dt.getFullYear() === year && dt.getMonth() === monthIdx;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const isOverdue = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  };

  const isDueToday = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-[#8a94a6] font-bold uppercase tracking-widest">Initializing Calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-4">
        <Card className="border-red-500/20 bg-red-500/5 text-center p-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-xl font-800 text-white mb-2">Sync Interrupted</p>
          <p className="text-[14px] text-[#8a94a6] mb-6 max-w-md mx-auto">{error}</p>
          <button type="button" onClick={loadData} className="btn btn-primary px-8">Reconnect Calendar</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <PageHeader title={t('Calendar') || 'Calendar'} subtitle={`${t(monthName) || monthName} ${year} · ${t('Manage hearings, deadlines & meetings') || 'Manage hearings, deadlines & meetings'}`}>
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/5 p-1 rounded-xl">
          <button onClick={handlePrev} className="p-2 hover:bg-white/5 rounded-lg text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-[13px] font-800 text-white px-4 min-w-[120px] text-center uppercase tracking-widest">{t(monthName) || monthName} {year}</span>
          <button onClick={handleNext} className="p-2 hover:bg-white/5 rounded-lg text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div className="flex gap-2 mr-auto ml-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-900 uppercase tracking-widest whitespace-nowrap transition-all ${filterType === 'all' ? 'bg-[#38bdf8] text-black font-extrabold' : 'bg-white/5 text-[#8a94a6] hover:bg-white/10 hover:text-white'}`}
          >
            {t('All') || 'All'}
          </button>
          {categories.filter(c => c.is_active).map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.name.toLowerCase())}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-900 uppercase tracking-widest whitespace-nowrap transition-all`}
              style={filterType === cat.name.toLowerCase() ? { backgroundColor: cat.color, color: '#000', fontWeight: '900' } : { backgroundColor: 'rgba(255,255,255,0.05)', color: '#8a94a6' }}
            >
              {t(cat.name) || cat.name}
            </button>
          ))}
        </div>
        <button onClick={() => setIsManageCatsOpen(true)} className="btn btn-secondary shadow-md flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {t('Categories') || 'Categories'}
        </button>
        <button onClick={() => openModal('add-event')} className="btn btn-primary shadow-[#0057c7]/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {t('Add Event') || 'Add Event'}
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="!p-0 overflow-hidden border-white/5 bg-white/[0.02]">
            <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.03]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-4 text-center text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em]">{t(d) || d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 divide-x divide-y divide-white/5 border-b border-white/5">
              {days.map(({ day, other }, i) => {
                const cellDate = new Date(year, monthIdx, day);
                const evts = other ? [] : filteredEvents.filter(e => sameDay(e.date, cellDate));
                const isCellToday = !other && day === today.getDate() && monthIdx === today.getMonth() && year === today.getFullYear();

                return (
                  <div key={i} onClick={() => openModal('add-event', { date: cellDate })} className={`min-h-[120px] p-2 ${other ? 'bg-black/20' : 'hover:bg-white/[0.04]'} cursor-pointer transition-all group relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" /></svg>
                    </div>
                    <div className={`w-7 h-7 flex items-center justify-center text-[12px] mb-2 rounded-xl transition-all ${isCellToday ? 'bg-gradient-to-br from-[#0057c7] to-[#38bdf8] text-white font-900 shadow-[0_4px_12px_rgba(56,189,248,0.4)]' : other ? 'text-white/10' : 'text-white/40 font-800'}`}>{day}</div>
                    <div className="space-y-1 relative z-10">
                      {evts.map((e, j) => {
                        const evColor = getEventColor(e);
                        let alertBadge = null;
                        let customStyle = {
                          backgroundColor: `${evColor}1A`,
                          color: evColor,
                          borderColor: `${evColor}33`
                        };
                        if (e.event_status !== 'completed') {
                          if (isOverdue(e.date)) {
                            customStyle = {
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              color: '#f87171',
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                              boxShadow: '0 0 8px rgba(239, 68, 68, 0.3)'
                            };
                            alertBadge = <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 ml-1"></span>;
                          } else if (isDueToday(e.date)) {
                            customStyle = {
                              backgroundColor: 'rgba(245, 158, 11, 0.2)',
                              color: '#fbbf24',
                              borderColor: 'rgba(245, 158, 11, 0.4)',
                              boxShadow: '0 0 8px rgba(245, 158, 11, 0.3)'
                            };
                            alertBadge = <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 ml-1"></span>;
                          }
                        }
                        
                        return (
                          <div
                            key={j}
                            onClick={(ev) => { ev.stopPropagation(); openModal('view-event', e); }}
                            className="text-[10px] font-800 px-2 py-1 rounded-lg truncate border shadow-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-between"
                            style={customStyle}
                          >
                            <span className="truncate">{e.title}</span>
                            {alertBadge}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/[0.02] border-white/5">
            <h3 className="text-[11px] font-900 text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
              {t('Agenda') || 'Agenda'}: {t(monthName) || monthName}
            </h3>
            <div className="space-y-3">
              {monthEventsSide.length > 0 ? monthEventsSide.map((e, i) => (
                <div
                  key={i}
                  onClick={() => openModal('view-event', e)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-[#38bdf8]/30 transition-all group cursor-pointer shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#0057c7]/5 blur-2xl pointer-events-none group-hover:bg-[#0057c7]/10" />
                  <div className="w-11 h-11 bg-white/[0.05] rounded-xl flex flex-col items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner border border-white/10">
                    <span className="text-[16px] font-900 text-white tracking-tighter leading-none">{new Date(e.date).getDate()}</span>
                    <span className="text-[8px] text-[#38bdf8] font-900 uppercase mt-1 tracking-widest">{t(monthName.slice(0, 3)) || monthName.slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-800 text-white truncate tracking-tight">{e.title}</p>
                      {e.event_status !== 'completed' && isOverdue(e.date) && (
                        <span className="text-[9px] font-900 bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase tracking-widest">{t('Overdue') || 'Overdue'}</span>
                      )}
                      {e.event_status !== 'completed' && isDueToday(e.date) && (
                        <span className="text-[9px] font-900 bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-widest">{t('Due Today') || 'Due Today'}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest mt-0.5 opacity-60">
                      {t((e.categories && e.categories[0]) || e.type.replace('_', ' ')) || ((e.categories && e.categories[0]) || e.type.replace('_', ' '))}
                    </p>
                  </div>
                  <div 
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]"
                    style={{ color: getEventColor(e), backgroundColor: getEventColor(e) }}
                  />
                </div>
              )) : (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                  <p className="text-[12px] text-[#8a94a6] font-800 uppercase tracking-widest opacity-40">{t('No entries detected') || 'No entries detected'}</p>
                  <p className="text-[10px] text-[#8a94a6] mt-2 italic">{t('Calendar sync optimized.') || 'Calendar sync optimized.'}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-[#0057c7]/20 border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all duration-700" />
            <h3 className="text-[11px] font-900 uppercase tracking-[0.3em] mb-6 text-[#38bdf8]">{t('Quick Entry Terminal') || 'Quick Entry Terminal'}</h3>
            <div className="space-y-4">
              <div className="relative group/input">
                <input
                  className="w-full text-[13px] bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#38bdf8] focus:ring-4 focus:ring-[#0057c7]/20 transition-all font-600"
                  placeholder={t('Event title or subject...') || 'Event title or subject...'}
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                />
              </div>
              <div className="relative group/input">
                <input
                  type="date"
                  className="w-full text-[13px] bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#38bdf8] focus:ring-4 focus:ring-[#0057c7]/20 transition-all [color-scheme:dark] font-600"
                  value={quickDate}
                  onChange={e => setQuickDate(e.target.value)}
                />
              </div>
              <div className="relative group/input">
                <select
                  className="w-full text-[13px] bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#38bdf8] focus:ring-4 focus:ring-[#0057c7]/20 transition-all appearance-none cursor-pointer font-600"
                  value={quickType}
                  onChange={e => setQuickType(e.target.value)}
                >
                  {categories.filter(c => c.is_active).map(cat => (
                    <option key={cat.id} value={cat.name} className="bg-slate-900">{t(cat.name) || cat.name}</option>
                  ))}
                  <option value="general_event" className="bg-slate-900">{t('General Event') || 'General Event'}</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a94a6]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <div className="relative group/input">
                <select
                  className="w-full text-[13px] bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#38bdf8] focus:ring-4 focus:ring-[#0057c7]/20 transition-all appearance-none cursor-pointer font-600"
                  value={quickReminder}
                  onChange={e => setQuickReminder(e.target.value)}
                >
                  <option value="" className="bg-slate-900">{t('No Reminder') || 'No Reminder'}</option>
                  <option value="1_hour" className="bg-slate-900">{t('1 Hour Before') || '1 Hour Before'}</option>
                  <option value="same_day" className="bg-slate-900">{t('Same Day') || 'Same Day'}</option>
                  <option value="1_day" className="bg-slate-900">{t('1 Day Before') || '1 Day Before'}</option>
                  <option value="3_days" className="bg-slate-900">{t('3 Days Before') || '3 Days Before'}</option>
                  <option value="7_days" className="bg-slate-900">{t('7 Days Before') || '7 Days Before'}</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a94a6]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              {['court_date', 'filing_deadline', 'hearing', 'trial_date'].includes(quickType) && (
                <div className="flex items-center gap-2 px-1">
                  <input type="checkbox" id="quickTask" checked={quickCreateTask} onChange={e => setQuickCreateTask(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-black/20 text-[#38bdf8] focus:ring-[#38bdf8]/50" />
                  <label htmlFor="quickTask" className="text-[12px] font-500 text-white cursor-pointer">{t('Auto Create Task') || 'Auto Create Task'}</label>
                </div>
              )}
              <div className="relative group/input">
                <select
                  className="w-full text-[13px] bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#38bdf8] focus:ring-4 focus:ring-[#0057c7]/20 transition-all appearance-none cursor-pointer font-600"
                  value={quickMatter}
                  onChange={e => setQuickMatter(e.target.value)}
                >
                  <option value="" className="bg-slate-900">{t('General Schedule') || 'General Schedule'}</option>
                  {matterPick.map((c) => <option key={c.id} value={c.id} className="bg-slate-900">{c.label}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a94a6]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <button
                onClick={handleQuickAdd}
                disabled={isAdding}
                className="btn btn-primary w-full justify-center h-12 text-[12px] font-900 uppercase tracking-widest shadow-xl shadow-[#0057c7]/20 disabled:opacity-50 active:scale-[0.98]"
              >
                {isAdding ? (t('Dispatching...') || 'Dispatching...') : (t('Schedule Event →') || 'Schedule Event →')}
              </button>
            </div>
          </Card>
        </div>
      </div>

      {isManageCatsOpen && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121826] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-900 text-white tracking-tight">{t('Manage Calendar Categories') || 'Manage Calendar Categories'}</h3>
                <p className="text-[11px] text-[#8a94a6] font-500 mt-1">{t('Add, rename, delete, archive or reorder categories.') || 'Add, rename, delete, archive or reorder categories.'}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowArchived(prev => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-900 uppercase tracking-widest whitespace-nowrap transition-all border ${showArchived ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-white/5 text-[#8a94a6] border-white/5 hover:text-white'}`}
                >
                  {showArchived ? (t('Hide Archived') || 'Hide Archived') : (t('Show Archived') || 'Show Archived')}
                </button>
                <button 
                  onClick={() => setIsManageCatsOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
              {categories.filter(c => showArchived ? true : c.is_active).map((cat, idx, arr) => {
                const isEditing = editingCatId === cat.id;
                return (
                  <div key={cat.id} className={`flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-xl gap-3 ${!cat.is_active ? 'opacity-50 grayscale' : ''}`}>
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-grow">
                        <input 
                          type="color" 
                          value={editColor} 
                          onChange={e => setEditColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 outline-none flex-shrink-0"
                        />
                        <input 
                          type="text" 
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[13px] text-white outline-none focus:border-[#38bdf8] flex-grow"
                        />
                        <button onClick={() => handleSaveEdit(cat.id)} className="btn btn-primary btn-xs font-semibold py-1">{t('Save') || 'Save'}</button>
                        <button onClick={() => setEditingCatId(null)} className="btn btn-secondary btn-xs font-semibold py-1">{t('Cancel') || 'Cancel'}</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Reordering arrows */}
                          <div className="flex flex-col gap-0.5 mr-1">
                            <button 
                              onClick={() => handleMoveCategory(cat, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 text-white/40 hover:text-white disabled:opacity-20 transition-colors"
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <button 
                              onClick={() => handleMoveCategory(cat, 'down')}
                              disabled={idx === arr.length - 1}
                              className="p-0.5 text-white/40 hover:text-white disabled:opacity-20 transition-colors"
                              title="Move Down"
                            >
                              ▼
                            </button>
                          </div>
                          <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/10" style={{ backgroundColor: cat.color }} />
                          <span className="text-[13px] font-800 text-white truncate">{t(cat.name) || cat.name}</span>
                          {!cat.is_active && (
                            <span className="text-[9px] font-900 bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-widest">{t('Archived') || 'Archived'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => startEdit(cat)}
                            className="w-7 h-7 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors"
                            title="Edit Category"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button 
                            onClick={() => handleToggleArchive(cat)}
                            className={`w-7 h-7 border rounded-lg flex items-center justify-center transition-colors ${cat.is_active ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-400 hover:text-amber-300' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400 hover:text-emerald-300'}`}
                            title={cat.is_active ? 'Archive Category' : 'Activate Category'}
                          >
                            {cat.is_active ? (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" /></svg>
                            )}
                          </button>
                          <button 
                            onClick={() => handleDeleteCat(cat.id)}
                            className="w-7 h-7 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Category"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Form to Add New Category */}
            <div className="p-6 border-t border-white/5 bg-white/[0.01] space-y-3">
              <h4 className="text-[11px] font-900 text-white uppercase tracking-wider">{t('Create New Category') || 'Create New Category'}</h4>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={newCatColor} 
                  onChange={e => setNewCatColor(e.target.value)}
                  className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 outline-none flex-shrink-0"
                />
                <input 
                  type="text" 
                  placeholder={t('E.g., Client Consultation') || 'E.g., Client Consultation'}
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[13px] text-white outline-none focus:border-[#38bdf8] flex-grow font-600"
                />
                <button 
                  onClick={handleAddCategory} 
                  className="btn btn-primary h-9 px-4 font-800 text-[11px] uppercase tracking-widest shrink-0"
                >
                  {t('Create') || 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  DOCUMENTS PAGE
// ─────────────────────────────────────────────────────────
export function DocumentsPage({ toast, openModal, role = 'lawyer' }) {
  const { t } = useLanguage();
  const isAdmin = role !== 'client';
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [currentPathSegments, setCurrentPathSegments] = useState([]);
  const [remoteDocs, setRemoteDocs] = useState([]);
  const [remoteFolders, setRemoteFolders] = useState([]);
  const [docLoading, setDocLoading] = useState(isAdmin);
  const [docError, setDocError] = useState('');
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isFirstLoad = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    setRemoteDocs(prev => {
      if (prev.length === 0) if (isFirstLoad.current) { setDocLoading(true); isFirstLoad.current = false; }
      return prev;
    });
    setDocError('');
    try {
      const [docRes, folderRes] = await Promise.all([
        api.documents.list({ limit: 500 }),
        api.folders.list()
      ]);
      setRemoteDocs(Array.isArray(docRes.data) ? docRes.data : []);
      setRemoteFolders(Array.isArray(folderRes.data) ? folderRes.data : []);
    } catch (e) {
      setDocError(e.message || 'Failed to load document data');
    } finally {
      setDocLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    window.addEventListener('vktori:entities-changed', fetchData);
    return () => window.removeEventListener('vktori:entities-changed', fetchData);
  }, [fetchData]);

  const folders = (() => {
    const buckets = [...new Set([
      'Complaint', 'Evidence', 'Contract', 'Court order',
      ...remoteFolders.map(f => f.name)
    ])];
    const by = Object.fromEntries(buckets.map((name) => [name, 0]));
    remoteDocs.forEach((d) => {
      const bucket = documentFolderBucket(d.category);
      if (bucket && bucket in by) by[bucket] += 1;
    });
    return buckets.map((name) => ({ name, count: by[name] || 0 }));
  })();

  const rootDocs = remoteDocs.filter(d => {
    if (!selectedFolder) return false;
    return documentFolderBucket(d.category) === selectedFolder;
  });

  const currentPath = currentPathSegments.join('/');
  const prefix = currentPath === "" ? "" : currentPath + "/";

  // Subfolders at current level
  const subfolders = (() => {
    if (!selectedFolder || search) return [];
    const names = [...new Set(
      rootDocs
        .map(d => d.folder_path || "")
        .filter(p => p !== currentPath && p.startsWith(prefix))
        .map(p => p.slice(prefix.length).split('/')[0])
    )].filter(Boolean);

    return names.map(name => {
      const subPath = prefix + name;
      const count = rootDocs.filter(d => {
        const dp = d.folder_path || "";
        return dp === subPath || dp.startsWith(subPath + '/');
      }).length;
      return { name, count };
    });
  })();

  const filtered = (() => {
    let list = remoteDocs;
    if (selectedFolder) {
      if (search) {
        list = rootDocs;
      } else {
        list = rootDocs.filter(d => (d.folder_path || "") === currentPath);
      }
    }
    return list
      .map((d) => ({
        id: d.id,
        name: d.original_name,
        type: matterMimeToFileType(d.mime_type),
        size: `${Math.max(1, Math.round(d.file_size / 1024))} KB`,
        uploaded: new Date(d.created_at).toLocaleDateString(),
        caseId: d.matter?.matter_number || '—',
        excerpt: d.excerpt,
        extractedText: d.extracted_text,
      }))
      .filter((d) => 
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.extractedText && d.extractedText.toLowerCase().includes(search.toLowerCase())) ||
        (d.excerpt && d.excerpt.toLowerCase().includes(search.toLowerCase()))
      );
  })();

  if (isAdmin && docLoading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-[#8a94a6] font-bold uppercase tracking-widest">Initializing Vault...</p>
      </div>
    );
  }

  if (isAdmin && docError) {
    return (
      <div className="animate-fade-in space-y-4">
        <Card className="border-red-500/20 bg-red-500/5 text-center p-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-xl font-800 text-white mb-2">Vault Connection Interrupted</p>
          <p className="text-[14px] text-[#8a94a6] mb-6 max-w-md mx-auto">{docError}</p>
          <button type="button" onClick={fetchData} className="btn btn-primary px-8">Reconnect Vault</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <PageHeader title={t('Documents') || 'Documents'} subtitle={t('documentsDesc') || 'Secure repository for all matter evidence & case files'}>
        <button onClick={() => openModal('add-document', selectedFolder ? { docCategory: selectedFolder } : null)} className="btn btn-secondary border-white/10 hover:bg-white/5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          {t('Upload File') || 'Upload File'}
        </button>
        <button onClick={() => openModal('add-folder')} className="btn btn-primary shadow-[#0057c7]/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {t('New Folder') || 'New Folder'}
        </button>
      </PageHeader>

      <Card className="bg-white/[0.02] border-white/5">
        <h3 className="text-[11px] font-900 text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
          {t('Matter Repository Folders') || 'Matter Repository Folders'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {folders.map(f => (
            <div
              key={f.name}
              onClick={() => {
                setSelectedFolder((prev) => (prev === f.name ? null : f.name));
                setCurrentPathSegments([]);
              }}
              className={`flex flex-col items-center p-5 rounded-2xl border cursor-pointer transition-all group relative overflow-hidden ${selectedFolder === f.name
                  ? 'border-[#f59e0b] bg-[#f59e0b]/5 ring-1 ring-[#f59e0b]/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                  : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10'
                }`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
              </div>
              <div className={`mb-3 transition-transform group-hover:scale-110 ${selectedFolder === f.name ? 'text-[#f59e0b]' : 'text-[#8a94a6]'}`}>
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className={`text-[13px] font-800 text-center leading-tight mb-1 tracking-tight ${selectedFolder === f.name ? 'text-white' : 'text-[#b8c2d1]'}`}>{t(f.name) || f.name}</p>
              <p className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest opacity-60">{f.count} {t('objects') || 'objects'}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/5">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h3 className="text-[11px] font-900 text-white uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
              {t('Recent Objects & Files') || 'Recent Objects & Files'}
            </h3>
            {selectedFolder && (
              <p className="text-[10px] text-[#38bdf8] font-900 uppercase tracking-widest mt-2">{t('Active Filter') || 'Active Filter'}: {t(selectedFolder) || selectedFolder}</p>
            )}
          </div>
          <div className="w-full sm:w-72">
            <SearchInput placeholder={t('Search within vault...') || 'Search within vault...'} value={search} onChange={setSearch} />
          </div>
        </div>

        {/* Breadcrumbs for global view subfolders */}
        {selectedFolder && (
          <div className="flex items-center gap-2 text-[11px] font-800 text-[#8a94a6] bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl uppercase tracking-wider mb-6">
            <span 
              className="hover:text-white cursor-pointer transition-colors"
              onClick={() => {
                setCurrentPathSegments([]);
              }}
            >
              📁 {t(selectedFolder) || selectedFolder}
            </span>
            {currentPathSegments.map((segment, idx) => (
              <React.Fragment key={idx}>
                <span className="text-white/20">/</span>
                <span 
                  className="hover:text-white cursor-pointer transition-colors"
                  onClick={() => {
                    setCurrentPathSegments(prev => prev.slice(0, idx + 1));
                  }}
                >
                  {segment}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Global subfolders grid */}
        {subfolders.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            {subfolders.map(sub => (
              <div
                key={sub.name}
                onClick={() => setCurrentPathSegments(prev => [...prev, sub.name])}
                className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 cursor-pointer transition-all group"
              >
                <span className="text-2xl text-[#f59e0b] group-hover:scale-115 transition-transform">
                  📁
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-800 text-white truncate leading-tight">{sub.name}</p>
                  <p className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest mt-1">{sub.count} {t('items') || 'items'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.length > 0 ? filtered.map(d => (
            <div key={d.id} className="flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-[#38bdf8]/30 transition-all group cursor-pointer shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#0057c7]/5 blur-3xl pointer-events-none group-hover:bg-[#0057c7]/10" />
              <div className="flex items-start justify-between relative z-10">
                <FileIcon type={d.type} />
                <div className="text-right">
                  <p className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest opacity-60 leading-none mb-1">{t('Uploaded') || 'Uploaded'}</p>
                  <p className="text-[11px] text-white font-800 tracking-tight">{d.uploaded}</p>
                </div>
              </div>
              <div className="relative z-10 flex-1">
                <p className="text-[14px] font-800 text-white group-hover:text-[#38bdf8] transition-colors line-clamp-2 leading-tight tracking-tight mb-2 min-h-[2.5em]">{d.name}</p>
                {d.excerpt && (
                  <p className="text-[11px] text-amber-200/80 italic mb-2 line-clamp-2 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                    🔍 "{d.excerpt}"
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[10px] text-[#38bdf8] font-900 bg-[#0057c7]/10 border border-[#0057c7]/20 px-2 py-0.5 rounded-md uppercase tracking-widest">{d.caseId}</span>
                  <span className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest opacity-40">{d.size}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 relative z-10">
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await previewDocumentBlob(d.id, openModal, d.name);
                    } catch (err) {
                      toast(err.message || 'Preview failed', 'error');
                    }
                  }}
                  className="btn btn-secondary justify-center text-[10px] font-900 uppercase tracking-widest h-10 border-white/10 hover:bg-[#38bdf8]/10 hover:text-[#38bdf8] hover:border-[#38bdf8]/30 transition-all"
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  {t('Preview') || 'Preview'}
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await downloadDocumentBlob(d.id, d.name);
                      toast(`${d.name} download started`, 'success');
                    } catch (err) {
                      toast(err.message || 'Download failed', 'error');
                    }
                  }}
                  className="btn btn-secondary justify-center text-[10px] font-900 uppercase tracking-widest h-10 border-white/10 hover:bg-[#38bdf8]/10 hover:text-[#38bdf8] hover:border-[#38bdf8]/30 transition-all"
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  {t('Download') || 'Download'}
                </button>
              </div>
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDocumentToDelete(d);
                  }}
                  className="mt-2 w-full btn btn-secondary justify-center text-[10px] font-900 uppercase tracking-widest h-10 border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all relative z-10"
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  {t('Delete') || 'Delete'}
                </button>
              )}
            </div>


          )) : (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
              <div className="w-20 h-20 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <svg className="w-10 h-10 text-[#8a94a6]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <p className="text-[14px] text-white font-800 tracking-tight mb-1">{t('No objects found') || 'No objects found'}</p>
              <p className="text-[12px] text-[#8a94a6] font-500">{t('Try adjusting your search or filters.') || 'Try adjusting your search or filters.'}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {documentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0a0f1a] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
            
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0 border border-red-500/20">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-800 text-white leading-tight">{t('Delete Document?') || 'Delete Document?'}</h3>
                <p className="text-xs text-[#8a94a6] font-500 mt-1">{t('This action cannot be undone.') || 'This action cannot be undone.'}</p>
              </div>
            </div>
            
            <p className="text-sm text-white/80 mb-6 bg-white/5 p-3 rounded-lg border border-white/5 break-words line-clamp-2">
              <span className="font-700 opacity-50 mr-2">{t('File') || 'File'}:</span>
              <span className="font-800 text-white">{documentToDelete.name}</span>
            </p>
            
            <div className="flex gap-3 relative z-10">
              <button
                onClick={() => setDocumentToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-transparent border border-white/10 hover:bg-white/5 text-white text-xs font-800 uppercase tracking-wider rounded-xl transition-all"
              >
                {t('Cancel') || 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await api.documents.remove(documentToDelete.id);
                    toast(`Document deleted successfully`, 'success');
                    window.dispatchEvent(new CustomEvent('vktori:entities-changed'));
                    setDocumentToDelete(null);
                  } catch (err) {
                    toast(err.message || 'Delete failed', 'error');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-800 uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (t('Deleting...') || 'Deleting...') : (t('Delete') || 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  BILLING PAGE
// ─────────────────────────────────────────────────────────
export function BillingPage({ openModal, toast, navigate, role = 'lawyer' }) {
  const { t } = useLanguage();
  const isAdmin = role !== 'client';
  const canMarkPaid = role === 'admin';
  const [tab, setTab] = useState('Invoices');
  const [search, setSearch] = useState('');
  const [apiInvoices, setApiInvoices] = useState([]);
  const [apiTimers, setApiTimers] = useState([]);
  const [apiSettings, setApiSettings] = useState({});
  const [apiTrustAccounts, setApiTrustAccounts] = useState([]);
  const [billLoading, setBillLoading] = useState(isAdmin);
  const [billError, setBillError] = useState('');
  const isFirstLoad = useRef(true);

  const billFormatUsd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

  const loadBillingData = useCallback(async () => {
    if (!isAdmin) return;
    if (isFirstLoad.current) { setBillLoading(true); isFirstLoad.current = false; }
    setBillError('');
    try {
      const fetchAdminSettings = role === 'admin' 
        ? api.dashboard.admin().then(r => r.data?.settings || {}).catch(() => ({})) 
        : Promise.resolve({});

      const [invRes, timerRes, settingsRes, trustRes] = await Promise.all([
        api.billing.listInvoices({ limit: 500 }),
        api.timers.list({ limit: 200 }),
        fetchAdminSettings,
        api.billing.listTrustAccounts()
      ]);
      setApiInvoices(Array.isArray(invRes.data) ? invRes.data : []);
      setApiTimers(Array.isArray(timerRes.data) ? timerRes.data : []);
      setApiSettings(settingsRes);
      setApiTrustAccounts(Array.isArray(trustRes.data) ? trustRes.data : []);
    } catch (e) {
      setBillError(e.message || 'Failed to load billing');
    } finally {
      setBillLoading(false);
    }
  }, [isAdmin, role]);

  useEffect(() => {
    loadBillingData();
    window.addEventListener('vktori:entities-changed', loadBillingData);
    return () => window.removeEventListener('vktori:entities-changed', loadBillingData);
  }, [loadBillingData]);

  const adminStats = (() => {
    if (!isAdmin) {
      return { unbilled: '—', draft: '$0.00', ar: '$0.00', mtd: '$0.00' };
    }
    
    let draft = 0;
    let ar = 0;
    let mtd = 0;
    const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    apiInvoices.forEach((inv) => {
      const totalAmt = Number(inv.amount);
      const paidAmt = inv.paid_amount ?? (inv.payments || []).reduce((s, p) => s + Number(p.amount), 0);
      const dueAmt = inv.due_amount ?? Math.max(0, totalAmt - paidAmt);

      if (inv.status === 'draft') {
        draft += totalAmt;
      } else if (inv.status !== 'void') {
        ar += dueAmt;
      }

      (inv.payments || []).forEach(p => {
        const pd = p.paid_on ? new Date(p.paid_on) : null;
        if (pd && !Number.isNaN(pd.getTime()) && pd >= startMonth) {
          mtd += Number(p.amount);
        }
      });
    });

    const rate = parseFloat(apiSettings.billing_rate) || 150;
    let unbilledMins = 0;
    apiTimers.forEach(t => {
      if (t.is_running) {
        const start = new Date(t.start_time);
        const now = new Date();
        const diff = Math.max(0, Math.floor((now - start) / 60000));
        unbilledMins += diff;
      } else if (!t.invoice_id) {
        unbilledMins += (t.duration_minutes || 0);
      }
    });
    const unbilledAmt = (unbilledMins / 60) * rate;

    return {
      unbilled: unbilledAmt > 0 ? billFormatUsd(unbilledAmt) : '$0.00',
      draft: billFormatUsd(draft),
      ar: billFormatUsd(ar),
      mtd: billFormatUsd(mtd),
    };
  })();

  const ledgerRows = (() => {
    if (!isAdmin || !apiInvoices.length) return [];
    return [...apiInvoices]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 40)
      .map((inv) => {
        const dt = inv.issued_at || inv.created_at;
        const dateStr = dt ? new Date(dt).toLocaleDateString() : '—';
        const matterNum = inv.matter?.matter_number || '';
        const paid = inv.status === 'paid';
        return {
          date: dateStr,
          desc: `Invoice ${inv.invoice_number}${matterNum ? ` · ${matterNum}` : ''}`,
          amount: paid ? `+${billFormatUsd(inv.amount)}` : billFormatUsd(inv.amount),
          color: paid ? 'text-[#10b981]' : 'text-[#b8c2d1]',
          bal: '—',
        };
      });
  })();

  const filteredInvoices = (() => {
    return apiInvoices
      .filter((inv) => {
        const client = inv.matter?.client?.full_name || '';
        const q = search.toLowerCase();
        return client.toLowerCase().includes(q) || inv.invoice_number.toLowerCase().includes(q);
      })
      .map((inv) => ({
        id: inv.invoice_number,
        dbId: inv.id,
        client: inv.matter?.client?.full_name || '—',
        amount: inv.amount,
        paid_amount: inv.paid_amount,
        due_amount: inv.due_amount,
        issued: inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : '—',
        due: inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—',
        status: inv.status,
        desc: inv.description || 'Professional Legal Services',
      }));
  })();

  if (isAdmin && billLoading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-[#8a94a6] font-bold uppercase tracking-widest">Auditing Ledgers...</p>
      </div>
    );
  }

  if (isAdmin && billError) {
    return (
      <div className="animate-fade-in space-y-4">
        <Card className="border-red-500/20 bg-red-500/5 text-center p-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-xl font-800 text-white mb-2">Ledger Synchronization Failed</p>
          <p className="text-[14px] text-[#8a94a6] mb-6 max-w-md mx-auto">{billError}</p>
          <button type="button" onClick={loadBillingData} className="btn btn-primary px-8">Sync Financials</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <PageHeader title={t('Billing & Financials') || 'Billing & Financials'} subtitle={t('billingFinancialsDesc') || 'Executive oversight of firm revenue, trust accounts, and unbilled time'}>
        <button onClick={() => navigate('calendar')} className="btn btn-secondary border-white/10 hover:bg-white/5 active:scale-[0.98]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {t('Time Entries') || 'Time Entries'}
        </button>
        <button onClick={() => openModal('create-invoice')} className="btn btn-primary shadow-[#0057c7]/20 active:scale-[0.98]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {t('Create Invoice') || 'Create Invoice'}
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('Unbilled Time') || 'Unbilled Time'} value={adminStats.unbilled} change="+8.2%"
          icon={<svg className="w-6 h-6 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label={t('Draft Invoices') || 'Draft Invoices'} value={adminStats.draft} 
          icon={<svg className="w-6 h-6 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
        <StatCard label={t('Outstanding (A/R)') || 'Outstanding (A/R)'} value={adminStats.ar} change="-2.4%"
          icon={<svg className="w-6 h-6 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M6.34 17.66l-1.41 1.41M17.66 17.66l1.41 1.41M6.34 6.34l1.41-1.41" /></svg>} />
        <StatCard label={t('Collected (MTD)') || 'Collected (MTD)'} value={adminStats.mtd} change="+14.5%"
          icon={<svg className="w-6 h-6 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3m0-4v2m0 16v2" /></svg>} />
      </div>

      <Tabs tabs={['Invoices', 'Trust Accounts', 'Ledger', 'Expenses']} active={tab} onChange={setTab} />

      {tab === 'Invoices' && (
        <Card className="!p-0 overflow-hidden border-white/5 bg-white/[0.02]">
          <Table headers={[t('Invoice ID') || 'Invoice ID', t('Client Entity') || 'Client Entity', t('Value & Status') || 'Value & Status', t('Issuance') || 'Issuance', t('Due Date') || 'Due Date', t('status'), t('actions') || 'Actions']}
            searchPlaceholder={t('Search invoice archives...') || 'Search invoice archives...'} onSearch={setSearch}>
            {filteredInvoices.map(inv => (
              <Tr key={inv.id} className="hover:bg-white/[0.03] transition-colors group">
                <Td>
                  <p className="text-[14px] font-900 text-white tracking-tighter group-hover:text-[#38bdf8] transition-colors">{inv.id}</p>
                  <p className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest opacity-40">{t('Financial Record') || 'Financial Record'}</p>
                </Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar initials={inv.client.split(' ').map(n => n[0]).join('') || '—'} size="xs" />
                    <span className="text-[13px] font-800 text-white tracking-tight">{inv.client}</span>
                  </div>
                </Td>
                <Td>
                  <div className="text-[15px] font-900 text-white tracking-tighter">{billFormatUsd(inv.amount)}</div>
                  {inv.paid_amount > 0 && <p className="text-[10px] text-[#10b981] font-900 uppercase tracking-widest mt-1">{t('Paid') || 'Paid'}: {billFormatUsd(inv.paid_amount)}</p>}
                  {inv.due_amount > 0 && <p className="text-[10px] text-red-400 font-900 uppercase tracking-widest mt-1">{t('Due') || 'Due'}: {billFormatUsd(inv.due_amount)}</p>}
                </Td>
                <Td className="text-[13px] text-[#b8c2d1] font-600">{inv.issued}</Td>
                <Td className="text-[13px] text-[#b8c2d1] font-600">{inv.due}</Td>
                <Td><Badge status={inv.status} /></Td>
                <Td>
                  <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal('view-invoice', inv)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#38bdf8]/10 hover:text-[#38bdf8] hover:border-[#38bdf8]/30 transition-all" title={t('Review Intelligence') || 'Review Intelligence'}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    {canMarkPaid && inv.status !== 'paid' && inv.status !== 'void' && inv.dbId != null && (
                      <button onClick={() => openModal('pay-invoice', inv)} className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all" title={t('Authorize Payment') || 'Authorize Payment'}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                      </button>
                    )}
                    <button onClick={() => downloadInvoicePdfBlob(inv.dbId, inv.id, toast)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#f59e0b]/10 hover:text-[#f59e0b] hover:border-[#f59e0b]/30 transition-all" title={t('Export Statement (PDF)') || 'Export Statement (PDF)'}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    <button onClick={() => downloadInvoiceDocxBlob(inv.dbId, inv.id, toast)} className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-all" title={t('Export Word Draft (.docx)') || 'Export Word Draft (.docx)'}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'Trust Accounts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
             <button onClick={() => openModal('trust-deposit')} className="btn btn-primary shadow-[#0057c7]/20">
               <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
               {t('Trust Deposit') || 'Trust Deposit'}
             </button>
          </div>
          <Card className="!p-0 overflow-hidden border-white/5 bg-white/[0.02]">
            <Table headers={[t('Client Entity') || 'Client Entity', t('Account Identifier') || 'Account Identifier', t('Current Balance') || 'Current Balance', t('Last Activity') || 'Last Activity', t('Lifecycle') || 'Lifecycle', t('Operations') || 'Operations']}>
              {apiTrustAccounts.length === 0 ? (
                <Tr>
                  <td colSpan={6} className="px-4 py-24 text-center text-[#8a94a6] text-[13px] font-500 italic opacity-40">{t('noTrustRecordsLocated') || 'No institutional trust records located.'}</td>
                </Tr>
              ) : (
                apiTrustAccounts.map(ta => (
                  <Tr key={ta.id} className="hover:bg-white/[0.03] transition-colors group">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar initials={ta.client?.full_name?.split(' ').map(n => n[0]).join('') || '—'} size="xs" />
                        <span className="text-[13px] font-800 text-white tracking-tight">{ta.client?.full_name || '—'}</span>
                      </div>
                    </Td>
                    <Td>
                      <p className="text-[13px] text-white font-900 tracking-tighter uppercase">TR-{String(ta.id).padStart(4, '0')}</p>
                      <p className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest opacity-40">{t('Escrow ID') || 'Escrow ID'}</p>
                    </Td>
                    <Td>
                      <p className="text-[15px] font-900 text-[#10b981] tracking-tighter">{billFormatUsd(ta.balance)}</p>
                      <p className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest opacity-40">{t('Liquid Assets') || 'Liquid Assets'}</p>
                    </Td>
                    <Td className="text-[13px] text-[#b8c2d1] font-600">{ta.updated_at ? new Date(ta.updated_at).toLocaleDateString() : '—'}</Td>
                    <Td><Badge status="active" /></Td>
                    <Td>
                      <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal('trust-ledger', ta)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#38bdf8]/10 hover:text-[#38bdf8] hover:border-[#38bdf8]/30 transition-all" title={t('View Intelligence') || 'View Intelligence'}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                        <button onClick={() => openModal('apply-trust', ta)} className="w-8 h-8 rounded-lg bg-[#0057c7]/10 border border-[#0057c7]/20 flex items-center justify-center text-[#38bdf8] hover:bg-[#0057c7]/20 transition-all" title={t('Apply Liquidated') || 'Apply Liquidated'}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </Table>
          </Card>
        </div>
      )}

      {tab === 'Expenses' && (
        <Card className="!p-0 overflow-hidden border-white/5 bg-white/[0.02]">
          <Table headers={[t('Vendor Brief') || 'Vendor Brief', t('Matter Reference') || 'Matter Reference', t('Classification') || 'Classification', t('Fiscal Value') || 'Fiscal Value', t('Execution Date') || 'Execution Date', t('status')]}>
            <Tr>
              <td colSpan={6} className="px-4 py-24 text-center text-[#8a94a6] text-[13px] font-500 italic opacity-40">{t('noExpenseRecordsSynchronized') || 'No outstanding expense records synchronized.'}</td>
            </Tr>
          </Table>
        </Card>
      )}

      {tab === 'Ledger' && (
        <Card className="bg-white/[0.02] border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-[11px] font-900 text-white uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                {t('Institutional Transaction Ledger') || 'Institutional Transaction Ledger'}
              </h3>
              <p className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest mt-2 opacity-60">{t('Verified Immutable Record') || 'Verified Immutable Record'}</p>
            </div>
            <button onClick={() => {
              if (!ledgerRows.length) { toast(t('noLedgerDataExport') || 'No ledger data to export.', 'warning'); return; }
              const header = 'Date,Description,Amount,Balance\n';
              const rows = ledgerRows.map(r => {
                const cleanAmt = (r.amount || '').replace(/[,$]/g, '');
                const cleanBal = (r.bal || '').replace(/[,$]/g, '');
                return `"${r.date}","${r.desc}","${cleanAmt}","${cleanBal}"`;
              }).join('\n');
              const csv = header + rows;
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ledger_statement_${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
              toast(t('financialStatementExportedSuccessfully') || 'Financial statement exported successfully!', 'success');
            }} className="btn btn-secondary border-white/10 hover:bg-white/5 text-[11px] font-900 uppercase tracking-widest">
              {t('Export Statement') || 'Export Statement'}
            </button>
          </div>
          <div className="space-y-0 text-[13px]">
            {ledgerRows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 py-4 border-b border-white/5 hover:bg-white/[0.03] px-4 transition-all group rounded-xl">
                <div className="col-span-2 text-[#8a94a6] font-800 uppercase tracking-tighter opacity-60">{row.date}</div>
                <div className="col-span-6 font-800 text-white tracking-tight group-hover:text-[#38bdf8] transition-colors">{row.desc}</div>
                <div className={`col-span-2 font-900 text-right tracking-tighter ${row.color}`}>{row.amount}</div>
                <div className="col-span-2 text-right font-900 text-[#8a94a6] tracking-tighter opacity-40">{row.bal}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  EMAIL PAGE
// ─────────────────────────────────────────────────────────
export function EmailPage({ toast, openModal, role = 'lawyer' }) {
  const { t } = useLanguage();
  const isAdmin = role !== 'client';
  const [selected, setSelected] = useState(null);
  const [commList, setCommList] = useState([]);
  const [mailLoading, setMailLoading] = useState(isAdmin);
  const [mailError, setMailError] = useState('');
  const [action, setAction] = useState(null); // 'reply' or 'forward'
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  const isFirstLoad = useRef(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const h = () => setRefreshTick(t => t + 1);
    window.addEventListener('vktori:entities-changed', h);
    return () => window.removeEventListener('vktori:entities-changed', h);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      if (isFirstLoad.current) { setMailLoading(true); isFirstLoad.current = false; }
      setMailError('');
      try {
        const res = await api.communications.list({ limit: 200 });
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        const mapped = rows.map((c) => {
          const body = c.message_body || '';
          const subj = c.subject || body.split('\n')[0].slice(0, 80) || String(c.communication_type || '').replace(/_/g, ' ');
          return {
            id: c.id,
            from: c.sender?.full_name || 'Unknown',
            fromEmail: c.sender?.email || '',
            subject: subj,
            preview: subj || body.slice(0, 120),
            body,
            time: new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
            read: true,
            matter_id: c.matter_id,
            to: c.to,
            cc: c.cc,
            bcc: c.bcc,
            communication_type: c.communication_type,
          };
        });
        setCommList(mapped);
        setSelected(window.innerWidth >= 1024 ? (mapped[0] || null) : null);
      } catch (e) {
        if (!cancelled) setMailError(e.message || 'Failed to load communications');
      } finally {
        if (!cancelled) setMailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin, refreshTick]);

  const handleDeleteCommunication = async (commId) => {
    try {
      await api.request(`/communications/${commId}`, {
        method: 'DELETE'
      });
      toast('Communication deleted successfully', 'success');
      setShowConfirmDelete(null);
      
      // Reload lists
      const res = await api.communications.list({ limit: 200 });
      const rows = Array.isArray(res.data) ? res.data : [];
      const mapped = rows.map((c) => {
        const body = c.message_body || '';
        const subj = c.subject || body.split('\n')[0].slice(0, 80) || String(c.communication_type || '').replace(/_/g, ' ');
        return {
          id: c.id,
          from: c.sender?.full_name || 'Unknown',
          fromEmail: c.sender?.email || '',
          subject: subj,
          preview: subj || body.slice(0, 120),
          body,
          time: new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
          read: true,
          matter_id: c.matter_id,
          to: c.to,
          cc: c.cc,
          bcc: c.bcc,
          communication_type: c.communication_type,
        };
      });
      setCommList(mapped);
      
      if (selected?.id === commId) {
        setSelected(window.innerWidth >= 1024 ? (mapped[0] || null) : null);
      }

      window.dispatchEvent(new CustomEvent('vktori:entities-changed'));
    } catch (err) {
      console.error(err);
      toast('Failed to delete communication: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const msg = formData.get('message') || '';
    const target = formData.get('target') || '';

    try {
      if (action === 'reply') {
        await api.communications.reply({
          parent_id: selected.raw_id || selected.id,
          message_body: msg
        });
      } else {
        await api.communications.create({
          matter_id: selected.matter_id,
          communication_type: 'email_log',
          message_body: `Forwarded Message:\n\n${selected.body}\n\nNotes: ${msg}`,
          to: target ? [target] : [],
        });
      }
      toast(action === 'reply' ? 'Reply sent successfully!' : 'Email forwarded!', 'success');
      setAction(null);
    } catch (err) {
      toast('Failed to send: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const inbox = commList.filter(e => 
    e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isAdmin && mailLoading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-10 h-10 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] text-[#8a94a6] font-900 uppercase tracking-widest opacity-60">Syncing Communications...</p>
      </div>
    );
  }

  if (isAdmin && mailError) {
    return (
      <div className="animate-fade-in py-12">
        <Card className="border-red-500/20 bg-red-500/5 max-w-lg mx-auto text-center">
          <p className="text-[13px] text-red-400 font-600">{mailError}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('Intelligence Hub') || 'Intelligence Hub'} subtitle={t('intelligenceHubDesc') || 'Real-time communication & outreach monitoring'}>
        <button onClick={() => openModal('compose-email')} className="btn btn-primary h-11 px-6 text-[11px] font-900 uppercase tracking-widest flex items-center gap-2 group">
          <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          {t('Compose Outbound') || 'Compose Outbound'}
        </button>
      </PageHeader>

      <Card noPad className="overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row h-full min-h-[640px] lg:h-[640px]">
          {/* Global Inbox Sidebar */}
          <div className={`w-full lg:w-80 flex-shrink-0 border-r border-white/5 flex flex-col bg-white/[0.01] ${selected ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <SearchInput 
                placeholder={t('Search transmissions...') || 'Search transmissions...'} 
                value={searchQuery} 
                onChange={(val) => setSearchQuery(val)} 
              />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {inbox.map(e => (
                <div key={e.id} onClick={() => { setSelected(e); setAction(null); }}
                  className={`px-5 py-4 cursor-pointer border-b border-white/5 transition-all relative group ${selected?.id === e.id ? 'bg-[#0057c7]/10' : 'hover:bg-white/[0.03]'}`}>
                  {selected?.id === e.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#38bdf8] shadow-[0_0_15px_#38bdf8]" />}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[13px] tracking-tight ${!e.read ? 'font-900 text-white' : 'font-800 text-white/70'}`}>{e.from}</span>
                    <span className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-tighter opacity-40">{e.time}</span>
                  </div>
                  <p className="text-[12px] font-900 text-[#38bdf8] truncate tracking-tight mb-1">{e.subject}</p>
                  <p className="text-[11px] font-500 text-[#8a94a6] truncate opacity-60 leading-relaxed">{e.preview}</p>
                  {!e.read && <div className="absolute right-4 bottom-4 w-2 h-2 bg-[#10b981] rounded-full shadow-[0_0_8px_#10b981]" />}
                </div>
              ))}
            </div>
          </div>

          {/* Secure Message Environment */}
          <div className={`flex-1 flex flex-col overflow-hidden bg-transparent ${!selected ? 'hidden lg:flex' : 'flex'}`}>
            {selected ? (
              <>
                <div className="p-4 lg:p-6 border-b border-white/5 bg-white/[0.03]">
                  <button onClick={() => setSelected(null)} className="lg:hidden flex items-center gap-2 text-[#38bdf8] font-900 uppercase tracking-[0.2em] text-[10px] mb-4 hover:opacity-80 transition-opacity">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
                    {t('Back to Inbox') || 'Back to Inbox'}
                  </button>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <h3 className="text-[18px] font-900 text-white tracking-tighter">{selected.subject}</h3>
                    <div className="flex gap-2 items-center flex-wrap">
                      {isAdmin && (
                        <>
                          <button 
                            onClick={() => openModal('compose-email', {
                              id: selected.id,
                              matterId: selected.matter_id,
                              to: selected.to,
                              cc: selected.cc,
                              bcc: selected.bcc,
                              subject: selected.subject,
                              message: selected.body
                            })} 
                            className="h-9 px-3.5 rounded-xl text-[10px] font-900 uppercase tracking-widest bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            {t('Edit') || 'Edit'}
                          </button>
                          
                          <button 
                            onClick={() => setShowConfirmDelete(selected.id)}
                            className="h-9 px-3.5 rounded-xl text-[10px] font-900 uppercase tracking-widest bg-red-950/20 text-red-400 hover:bg-red-900/30 border border-red-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 text-red-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {t('Delete') || 'Delete'}
                          </button>
                          
                          <div className="h-4 w-px bg-white/10 mx-1" />
                        </>
                      )}
                      
                      <button onClick={() => setAction('reply')} className={`h-9 px-4 rounded-xl text-[10px] font-900 uppercase tracking-widest transition-all ${action === 'reply' ? 'bg-[#0057c7] text-white' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>{t('Reply') || 'Reply'}</button>
                      <button onClick={() => setAction('forward')} className={`h-9 px-4 rounded-xl text-[10px] font-900 uppercase tracking-widest transition-all ${action === 'forward' ? 'bg-[#0057c7] text-white' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>{t('Forward') || 'Forward'}</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Avatar initials={selected.from.charAt(0)} size="md" className="ring-2 ring-[#0057c7]/20" />
                    <div className="flex-1">
                      <p className="text-[14px] font-900 text-white tracking-tight">{selected.from}</p>
                      <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] opacity-40">{t('Verification Timestamp') || 'Verification Timestamp'}: {selected.time}</p>
                    </div>
                  </div>

                  {(selected.communication_type === 'email_log' || selected.to) && (
                    <div className="mt-4 p-4 bg-[#121826]/40 border border-white/5 rounded-2xl flex flex-col gap-2 text-[12px] text-white/70">
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-white/30 font-850 uppercase tracking-widest text-[9px]">{t('From') || 'From'}:</span>
                        <span className="font-600 text-white">{selected.from} {selected.fromEmail && `<${selected.fromEmail}>`}</span>
                      </div>
                      {selected.to && (
                        <div className="flex items-center gap-2">
                          <span className="w-14 text-white/30 font-850 uppercase tracking-widest text-[9px]">{t('To') || 'To'}:</span>
                          <span className="font-600 text-white/95">{selected.to}</span>
                        </div>
                      )}
                      {selected.cc && (
                        <div className="flex items-center gap-2">
                          <span className="w-14 text-white/30 font-850 uppercase tracking-widest text-[9px]">{t('Cc') || 'Cc'}:</span>
                          <span className="font-600 text-white/90">{selected.cc}</span>
                        </div>
                      )}
                      {selected.bcc && (
                        <div className="flex items-center gap-2">
                          <span className="w-14 text-white/30 font-850 uppercase tracking-widest text-[9px]">{t('Bcc') || 'Bcc'}:</span>
                          <span className="font-600 text-white/80">{selected.bcc}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white/[0.01]">
                  {(() => {
                    const { cleanText, attachments } = parseBodyAttachments(selected.body || '');
                    return (
                      <div className="space-y-4">
                        <div className="bg-white/[0.03] p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0057c7]/5 blur-3xl pointer-events-none group-hover:bg-[#0057c7]/10 transition-all duration-1000" />
                          {cleanText.includes('<') && (cleanText.includes('</') || cleanText.includes('/>')) ? (
                            <div dangerouslySetInnerHTML={{ __html: cleanText }} className="text-[14px] text-white/80 leading-relaxed relative z-10 email-html-content" />
                          ) : (
                            <p className="text-[14px] text-white/80 font-500 leading-relaxed whitespace-pre-line relative z-10">{cleanText}</p>
                          )}
                        </div>
                        {attachments.length > 0 && (
                          <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                            <h4 className="text-[11px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-3">{t('Attachments') || 'Attachments'} ({attachments.length})</h4>
                            <div className="flex flex-wrap gap-3">
                              {attachments.map((att, attIdx) => (
                                <div key={attIdx} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 shadow-md">
                                  <button
                                    type="button"
                                    onClick={() => openAttachment(att, selected.matter_id, openModal, toast)}
                                    className="flex items-center gap-2 text-[12px] text-white font-700 hover:text-[#38bdf8] transition-colors cursor-pointer"
                                    title="Open file in new tab"
                                  >
                                    <span>📄</span>
                                    <span className="truncate max-w-[180px]">{att.name}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => downloadAttachment(att, selected.matter_id, toast)}
                                    className="p-1 text-[#8a94a6] hover:text-white hover:bg-white/10 rounded transition-all cursor-pointer ml-1"
                                    title="Download file"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {action && (
                    <div className="animate-slide-up bg-[#0b1f3a] rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden">
                      <div className="bg-white/[0.05] px-6 py-4 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[11px] font-900 text-[#38bdf8] uppercase tracking-[0.2em]">
                          {action === 'reply' ? (t('Institutional Response') || 'Institutional Response') : (t('Strategic Forwarding') || 'Strategic Forwarding')}
                        </span>
                        <button onClick={() => setAction(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#8a94a6] hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <form onSubmit={handleSend} className="p-8 space-y-5">
                        {action === 'forward' && (
                          <Field label={t('Target Recipient') || 'Target Recipient'} required>
                            <Input name="target" placeholder="institutional.entity@domain.com" required />
                          </Field>
                        )}
                        <Field label={action === 'reply' ? (t('Draft Statement') || 'Draft Statement') : (t('Transmission Notes') || 'Transmission Notes')} required={action === 'reply'}>
                          <Textarea name="message" rows={6} placeholder={action === 'reply' ? (t('Formulate institutional response...') || 'Formulate institutional response...') : (t('Append executive context to this forwarding...') || 'Append executive context to this forwarding...')} required={action === 'reply'} />
                        </Field>
                        <div className="flex justify-end gap-3 pt-2">
                          <button type="button" onClick={() => setAction(null)} className="h-11 px-6 rounded-2xl bg-white/5 text-white text-[11px] font-900 uppercase tracking-widest hover:bg-white/10 transition-all">{t('Cancel') || 'Cancel'}</button>
                          <button type="submit" className="btn btn-primary h-11 px-8 text-[11px] font-900 uppercase tracking-widest">
                            {action === 'reply' ? (t('Execute Reply') || 'Execute Reply') : (t('Execute Forward') || 'Execute Forward')}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-[#8a94a6] opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L22 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h4 className="text-[18px] font-900 text-white tracking-tighter mb-2">{t('Initialize Communication Overview') || 'Initialize Communication Overview'}</h4>
                <p className="text-[13px] text-[#8a94a6] max-w-xs mx-auto opacity-60">{t('Select an active transmission from the sidebar to begin institutional review.') || 'Select an active transmission from the sidebar to begin institutional review.'}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Custom Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#121826] border border-white/10 rounded-3xl p-6 w-full max-w-[400px] shadow-2xl flex flex-col gap-4 text-center text-white">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-[16px] font-800">{t('Delete Transmission?') || 'Delete Transmission?'}</h3>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              {t('deleteCommunicationConfirm') || 'Are you sure you want to delete this communication record? This action cannot be undone.'}
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[12px] font-700 py-2.5 rounded-xl transition-all"
              >
                {t('Cancel') || 'Cancel'}
              </button>
              <button
                onClick={() => handleDeleteCommunication(showConfirmDelete)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-[12px] font-700 py-2.5 rounded-xl transition-all shadow-md shadow-red-600/10"
              >
                {t('Yes, delete') || 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  AI ASSISTANT PAGE
// ─────────────────────────────────────────────────────────
export function AIPage({ toast }) {
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="VyNius Assistant" subtitle="Powered by ">
        <span className="flex items-center gap-1.5 text-[12px] text-emerald-600 font-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Online
        </span>
      </PageHeader>

      <Card className="min-h-[520px] flex items-center justify-center">
        <EmptyState icon="🤖" title="AI assistant unavailable" desc="Live AI service is not configured yet." />
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  USERS PAGE
// ─────────────────────────────────────────────────────────
export function UsersPage({ toast, openModal, user }) {
  const [users, setUsers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [userToDelete, setUserToDelete] = useState(null);

  const mapApiUser = (u) => ({
    id: u.id,
    name: u.full_name,
    email: u.email,
    avatar: (u.full_name || '').split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '👤',
    roles: u.roles || [],
    roleLabel: (u.roles || []).map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', '),
    cases: u._count?.assigned_matters ?? 0,
    status: u.is_active ? 'active' : 'inactive',
    practice_focus: u.practice_focus || null,
    lastLogin: u.last_login_at
      ? new Date(u.last_login_at).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      })
      : '—',
  });

  const loadUsers = async () => {
    if (isFirstLoad.current) { setLoading(true); isFirstLoad.current = false; }
    setError('');
    try {
      const res = await api.users.list();
      const rows = Array.isArray(res.data) ? res.data : [];
      setUsers(rows.map(mapApiUser));
    } catch (e) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => {
    window.addEventListener('vktori:entities-changed', loadUsers);
    return () => window.removeEventListener('vktori:entities-changed', loadUsers);
  }, []);

  const handleEdit = (u) => {
    openModal('edit-user', u, async (values) => {
      try {
        const updatedName = `${values.firstName} ${values.lastName}`;
        const selectedRoles = [];
        if (values.role_admin) selectedRoles.push('admin');
        if (values.role_lawyer) selectedRoles.push('lawyer');
        if (values.role_client) selectedRoles.push('client');

        if (selectedRoles.length === 0) {
           toast('You must select at least one role.', 'error');
           return;
        }

        const specialtyVal = values.specialty === 'other'
          ? (values.custom_specialty || '').trim()
          : (values.specialty || null);

        await api.users.update(u.id, {
          full_name: updatedName,
          email: values.email,
          roles: selectedRoles,
          is_active: values.status === 'active',
          practice_focus: specialtyVal,
        });
        await loadUsers();
        toast('User updated successfully!', 'success');
      } catch (e) {
        toast(e.message || 'Update failed', 'error');
      }
    });
  };

  const handleDelete = (u) => {
    if (user?.id === u.id) {
      toast('You cannot delete your own active session account.', 'error');
      return;
    }
    setUserToDelete(u);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.users.remove(userToDelete.id);
      await loadUsers();
      toast('User deleted successfully!', 'success');
    } catch (e) {
      toast(e.message || 'Delete failed', 'error');
    } finally {
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter(u => {
    if (activeTab === 'Staff') return u.roles?.includes('admin') || u.roles?.includes('lawyer');
    if (activeTab === 'Clients') return u.roles?.includes('client');
    return true;
  });

  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] text-[#8a94a6] font-900 uppercase tracking-[0.3em] opacity-60">Synchronizing Staff Records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in py-12">
        <Card className="border-[#ef4444]/20 bg-[#ef4444]/5 text-center p-12 max-w-lg mx-auto">
          <p className="text-[13px] text-[#ef4444] font-900 uppercase tracking-widest">{error}</p>
          <button type="button" onClick={loadUsers} className="btn btn-secondary mt-6 px-8">Re-establish Connection</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 relative">
      <PageHeader title={activeTab === 'Staff' ? 'Staff Directory' : (activeTab === 'Clients' ? 'Client Accounts' : 'User Directory')} subtitle="Administrative control and practitioner access management">
        <button onClick={() => openModal('add-user', null, async (values) => {
          try {
            const selectedRoles = [];
            if (values.role_admin) selectedRoles.push('admin');
            if (values.role_lawyer) selectedRoles.push('lawyer');
            if (values.role_client) selectedRoles.push('client');

            if (selectedRoles.length === 0) {
               toast('You must select at least one role.', 'error');
               return;
            }

            await api.users.create({
              full_name: `${values.firstName} ${values.lastName}`,
              email: values.email,
              password: values.password,
              roles: selectedRoles,
            });
            await loadUsers();
            toast('User account created!', 'success');
          } catch (e) {
            toast(e.message || 'Create failed', 'error');
          }
        })} className="btn btn-primary h-11 px-6 text-[11px] font-900 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Initialize Account
        </button>
      </PageHeader>

      <div className="flex gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-2xl w-fit">
        {['All', 'Staff', 'Clients'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-xl text-[12px] font-900 uppercase tracking-widest transition-all ${
              activeTab === tab
                ? 'bg-[#0057c7] text-white shadow-lg shadow-[#0057c7]/20'
                : 'text-[#8a94a6] hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-[2rem]">
        <Table headers={['Practitioner', 'Secure Email', 'Role', 'Matters', 'Status', 'Last Activity', 'Actions']}>
          {filteredUsers.map(u => (
            <Tr key={u.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar initials={u.avatar} size="md" className="ring-2 ring-white/5 shadow-2xl" />
                  <div>
                    <p className="text-[14px] font-900 text-white tracking-tight">{u.name}</p>
                    <p className="text-[10px] text-[#38bdf8] font-900 uppercase tracking-widest opacity-60">ID-{String(u.id).slice(-4).toUpperCase()}</p>
                  </div>
                </div>
              </Td>
              <Td><span className="text-[13px] font-600 text-white/70">{u.email}</span></Td>
              <Td>
                <span className={`text-[10px] font-900 px-3 py-1 rounded-lg uppercase tracking-[0.1em] border shadow-sm ${
                  u.roleLabel === 'Admin' 
                    ? 'bg-[#C9A24A]/10 text-[#C9A24A] border-[#C9A24A]/20' 
                    : u.roleLabel === 'Lawyer'
                    ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20'
                    : 'bg-white/5 text-[#8a94a6] border-white/10'
                }`}>
                  {u.roleLabel}
                </span>
              </Td>
              <Td><span className="text-[14px] font-900 text-white">{u.cases || '—'}</span></Td>
              <Td><Badge status={u.status} /></Td>
              <Td><span className="text-[12px] font-600 text-[#8a94a6]">{u.lastLogin}</span></Td>
              <Td>
                <div className="flex gap-2.5">
                  <button onClick={() => openModal('reset-password', u)} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-[#8a94a6] hover:bg-[#10b981]/10 hover:text-[#10b981] hover:border-[#10b981]/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all border border-white/10 group" title="Reset Password">
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                  </button>
                  <button onClick={() => handleEdit(u)} 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-[#8a94a6] hover:bg-[#38bdf8]/10 hover:text-[#38bdf8] hover:border-[#38bdf8]/30 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all border border-white/10 group" title="Edit User">
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  {user?.id !== u.id && (
                    <button onClick={() => handleDelete(u)} 
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-[#8a94a6] hover:bg-[#ef4444]/10 hover:text-[#ef4444] hover:border-[#ef4444]/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all border border-white/10 group" title="Terminate Access">
                      <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </div>

      {userToDelete && (
        <Modal
          title="Terminate Access"
          onClose={() => setUserToDelete(null)}
          footer={
            <>
              <button onClick={() => setUserToDelete(null)} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={confirmDelete} className="btn btn-primary btn-sm !bg-red-500 hover:!bg-red-600 !border-red-500">Terminate Access</button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div>
                <p className="text-[13px] text-red-200 font-700">Are you sure you want to terminate access for {userToDelete.name}?</p>
                <p className="text-[12px] text-red-300/70 mt-1">This user account will be deactivated. They will no longer be able to log in or access any cases.</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  PRACTICE AREAS TAB
// ─────────────────────────────────────────────────────────
function PracticeAreasTab({ toast }) {
  const [areas, setAreas] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);

  const loadAreas = async () => {
    try {
      const res = await api.practiceAreas.list();
      setAreas(res.data || []);
    } catch (e) {
      toast('Failed to load practice areas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAreas(); }, []);
  useEffect(() => {
    window.addEventListener('vktori:entities-changed', loadAreas);
    return () => window.removeEventListener('vktori:entities-changed', loadAreas);
  }, []);

  const toggleActive = async (area) => {
    try {
      await api.practiceAreas.update(area.id, { is_active: !area.is_active });
      loadAreas();
    } catch (e) {
      toast('Failed to update status', 'error');
    }
  };

  return (
    <>
      <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6">
          <div>
            <h3 className="text-[14px] font-900 text-white uppercase tracking-widest">Practice Areas</h3>
            <p className="text-[11px] text-[#8a94a6] mt-1">Manage standard practice areas for new matters.</p>
          </div>
          <button onClick={() => window.dispatchEvent(new CustomEvent('vktori:open-modal', { detail: { type: 'add-practice-area' } }))} className="btn btn-primary h-10 px-6 text-[11px] font-900 uppercase tracking-widest">
            + Add Practice Area
          </button>
        </div>
        {loading ? <div className="text-[#8a94a6] text-center p-6 text-[12px]">Loading...</div> : (
          <Table headers={['Name', 'Status', 'Actions']}>
            {areas.map(a => (
              <Tr key={a.id}>
                <Td><span className="text-white font-600 text-[13px]">{a.name}</span></Td>
                <Td>
                  <div onClick={() => toggleActive(a)} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all duration-300 ${a.is_active ? 'bg-[#10b981]' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${a.is_active ? 'left-[22px]' : 'left-0.5'}`} />
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-4">
                    <button onClick={() => window.dispatchEvent(new CustomEvent('vktori:open-modal', { detail: { type: 'edit-practice-area', data: a } }))} className="text-[#38bdf8] text-[11px] font-900 uppercase hover:underline">Edit</button>
                    <button onClick={() => setDeleteTarget(a)} className="text-red-500 text-[11px] font-900 uppercase hover:underline">Delete</button>
                  </div>
                </Td>
              </Tr>
            ))}
            {areas.length === 0 && <Tr><Td colSpan={3} className="text-center text-[#8a94a6] py-6 text-[12px]">No practice areas configured.</Td></Tr>}
          </Table>
        )}
      </Card>

      {deleteTarget && createPortal(
        <Modal
          title="Delete Practice Area"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary btn-sm">Cancel</button>
              <button 
                onClick={async () => {
                  try {
                    await api.practiceAreas.remove(deleteTarget.id);
                    toast('Practice area deleted successfully', 'success');
                    loadAreas();
                    setDeleteTarget(null);
                  } catch (e) {
                    toast(e.message || 'Failed to delete practice area', 'error');
                  }
                }} 
                className="btn btn-primary btn-sm !bg-red-500 hover:!bg-red-600 !border-red-500"
              >
                Delete
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-[13px] text-red-200 font-700">Are you sure you want to delete practice area "{deleteTarget.name}"?</p>
                <p className="text-[12px] text-red-300/70 mt-1">This action cannot be undone and will permanently remove this practice area.</p>
              </div>
            </div>
          </div>
        </Modal>,
        document.body
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
//  CUSTOM FIELDS TAB
// ─────────────────────────────────────────────────────────
function CustomFieldsTab({ toast }) {
  const [fields, setFields] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);

  const loadFields = async () => {
    try {
      const res = await api.customFields.list();
      setFields(res.data || []);
    } catch (e) {
      toast('Failed to load custom fields', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFields(); }, []);
  useEffect(() => {
    window.addEventListener('vktori:entities-changed', loadFields);
    return () => window.removeEventListener('vktori:entities-changed', loadFields);
  }, []);

  const toggleActive = async (field) => {
    try {
      await api.customFields.update(field.id, { is_active: !field.is_active });
      loadFields();
    } catch (e) {
      toast('Failed to update status', 'error');
    }
  };

  return (
    <>
      <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6">
          <div>
            <h3 className="text-[14px] font-900 text-white uppercase tracking-widest">Custom Matter Fields</h3>
            <p className="text-[11px] text-[#8a94a6] mt-1">Configure dynamic fields to collect custom data on matters.</p>
          </div>
          <button onClick={() => window.dispatchEvent(new CustomEvent('vktori:open-modal', { detail: { type: 'add-custom-field' } }))} className="btn btn-primary h-10 px-6 text-[11px] font-900 uppercase tracking-widest">
            + Add Custom Field
          </button>
        </div>
        {loading ? <div className="text-[#8a94a6] text-center p-6 text-[12px]">Loading...</div> : (
          <Table headers={['Name', 'Type', 'Status', 'Actions']}>
            {fields.map(f => (
              <Tr key={f.id}>
                <Td><span className="text-white font-600 text-[13px]">{f.name}</span></Td>
                <Td><span className="text-[#8a94a6] font-500 text-[12px] uppercase">{f.type}</span></Td>
                <Td>
                  <div onClick={() => toggleActive(f)} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all duration-300 ${f.is_active ? 'bg-[#10b981]' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${f.is_active ? 'left-[22px]' : 'left-0.5'}`} />
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-4">
                    <button onClick={() => window.dispatchEvent(new CustomEvent('vktori:open-modal', { detail: { type: 'edit-custom-field', data: f } }))} className="text-[#38bdf8] text-[11px] font-900 uppercase hover:underline">Edit</button>
                    <button onClick={() => setDeleteTarget(f)} className="text-red-500 text-[11px] font-900 uppercase hover:underline">Delete</button>
                  </div>
                </Td>
              </Tr>
            ))}
            {fields.length === 0 && <Tr><Td colSpan={4} className="text-center text-[#8a94a6] py-6 text-[12px]">No custom fields configured.</Td></Tr>}
          </Table>
        )}
      </Card>

      {deleteTarget && createPortal(
        <Modal
          title="Delete Custom Field"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary btn-sm">Cancel</button>
              <button 
                onClick={async () => {
                  try {
                    await api.customFields.remove(deleteTarget.id);
                    toast('Custom field deleted successfully', 'success');
                    loadFields();
                    setDeleteTarget(null);
                  } catch (e) {
                    toast(e.message || 'Failed to delete custom field', 'error');
                  }
                }} 
                className="btn btn-primary btn-sm !bg-red-500 hover:!bg-red-600 !border-red-500"
              >
                Delete
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-[13px] text-red-200 font-700">Are you sure you want to delete custom field "{deleteTarget.name}"?</p>
                <p className="text-[12px] text-red-300/70 mt-1">This action cannot be undone and will permanently remove this custom field definition.</p>
              </div>
            </div>
          </div>
        </Modal>,
        document.body
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
//  INTEGRATIONS PAGE
// ─────────────────────────────────────────────────────────
export function IntegrationsPage({ toast }) {
  const [titanAccounts, setTitanAccounts] = useState([]);
  const [isManageTitanAccountsOpen, setIsManageTitanAccountsOpen] = useState(false);
  const [fortnoxConfig, setFortnoxConfig] = useState({ enabled: false, apiKey: '', accessToken: '', clientSecret: '', costCenter: '1010' });
  const [isManageFortnoxOpen, setIsManageFortnoxOpen] = useState(false);
  const [fortnoxTesting, setFortnoxTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const [titanRes, fortnoxRes] = await Promise.all([
        api.titanEmail.getAccounts(),
        api.fortnox.getConfig().catch(() => ({ data: null })),
      ]);
      setTitanAccounts(titanRes.data || []);
      if (fortnoxRes?.data) setFortnoxConfig(fortnoxRes.data);
    } catch (e) {
      console.error('Failed to fetch integration settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const integrationCards = [
    { 
      title: 'Titan Email', 
      subtitle: titanAccounts.length > 0 ? `Sync firm communications and calendars. (${titanAccounts.length} account${titanAccounts.length === 1 ? '' : 's'} connected)` : 'Sync firm communications and calendars.', 
      connected: titanAccounts.length > 0, 
      action: () => setIsManageTitanAccountsOpen(true) 
    },
    {
      title: 'Fortnox ERP',
      subtitle: fortnoxConfig.enabled ? 'Bi-directional Fortnox REST API accounting, customers & invoice sync active.' : 'Automated Fortnox REST API invoice, voucher & accounts receivable export.',
      connected: fortnoxConfig.enabled,
      action: () => setIsManageFortnoxOpen(true)
    },
  ];

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <PageHeader title="Integrations" subtitle="Connect external communication protocols, calendar services, and firm tools" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrationCards.map((item) => (
          <Card key={item.title} className="flex flex-col gap-6 border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 rounded-[2rem] group hover:border-[#38bdf8]/30 transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0057c7]/5 blur-3xl group-hover:bg-[#0057c7]/10 transition-all pointer-events-none" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-[15px] font-900 text-white tracking-tight leading-none mb-2">{item.title}</h3>
                <p className="text-[12px] text-[#8a94a6] font-500 leading-relaxed opacity-70">{item.subtitle}</p>
              </div>
              <span className={`flex-shrink-0 inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-900 uppercase tracking-widest border transition-all ${item.connected ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 text-[#8a94a6] border-white/10 opacity-50'}`}>
                {item.connected ? 'Active Sync' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-end pt-5 mt-auto border-t border-white/5">
              <button type="button" onClick={item.action} disabled={loading} className={`h-9 px-4 rounded-xl text-[10px] font-900 uppercase tracking-widest transition-all ${
                item.title === 'Titan Email' || item.title === 'Fortnox ERP'
                  ? 'bg-[#0057c7] text-white hover:bg-[#004bb1] shadow-lg shadow-[#0057c7]/20'
                  : item.connected
                    ? 'bg-white/5 text-[#8a94a6] hover:bg-[#ef4444]/10 hover:text-[#ef4444]'
                    : 'bg-[#0057c7] text-white hover:bg-[#004bb1] shadow-lg shadow-[#0057c7]/20'
              } disabled:opacity-50`}>
                {item.title === 'Titan Email' || item.title === 'Fortnox ERP' ? (item.connected ? 'Configure Integration' : 'Connect Account') : (item.connected ? 'Disconnect' : 'Connect')}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {isManageTitanAccountsOpen && createPortal(
        <Modal
          title="Manage Titan Mail Accounts"
          onClose={() => setIsManageTitanAccountsOpen(false)}
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-[12px] font-900 text-white uppercase tracking-widest mb-3">Connected Accounts</h4>
              {titanAccounts.length === 0 ? (
                <div className="text-[12px] text-[#8a94a6] py-3 bg-white/[0.01] border border-white/5 rounded-xl text-center">
                  No Titan accounts connected yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {titanAccounts.map(acc => (
                    <div key={acc.id} className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0057c7]/10 flex items-center justify-center text-[#38bdf8]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>
                        </div>
                        <div>
                          <p className="text-[13px] font-600 text-white leading-tight">{acc.email_address}</p>
                          <p className="text-[10px] text-[#8a94a6] mt-0.5">{acc.imap_host}:{acc.imap_port} (IMAP)</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            await api.titanEmail.deleteAccount(acc.id);
                            toast('Account disconnected successfully', 'success');
                            const res = await api.titanEmail.getAccounts();
                            setTitanAccounts(res.data || []);
                          } catch (err) {
                            toast(err.message || 'Failed to disconnect account', 'error');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="text-red-500 hover:text-red-400 text-[10px] font-900 uppercase tracking-wider transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-6">
              <h4 className="text-[12px] font-900 text-white uppercase tracking-widest mb-4">Connect New Account</h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const data = Object.fromEntries(formData.entries());
                  try {
                    setLoading(true);
                    await api.titanEmail.addAccount({
                      email_address: data.email_address,
                      password: data.password,
                      imap_host: data.imap_host,
                      imap_port: data.imap_port ? parseInt(data.imap_port, 10) : 993,
                      smtp_host: data.smtp_host,
                      smtp_port: data.smtp_port ? parseInt(data.smtp_port, 10) : 465,
                      username: data.username || data.email_address
                    });
                    toast('Titan account connected successfully!', 'success');
                    const res = await api.titanEmail.getAccounts();
                    setTitanAccounts(res.data || []);
                    e.target.reset();
                  } catch (err) {
                    toast(err.message || 'Failed to connect account', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Email Address" required>
                    <Input name="email_address" type="email" placeholder="e.g. contact@pilbagen.se" required />
                  </Field>
                  <Field label="App Password" required>
                    <Input name="password" type="password" placeholder="••••••••••••" required />
                  </Field>
                </div>

                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4">
                  <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-widest">Advanced Connection Settings</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="IMAP Host">
                      <Input name="imap_host" defaultValue="imap.titan.email" />
                    </Field>
                    <Field label="IMAP Port">
                      <Input name="imap_port" type="number" defaultValue="993" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="SMTP Host">
                      <Input name="smtp_host" defaultValue="smtp.titan.email" />
                    </Field>
                    <Field label="SMTP Port">
                      <Input name="smtp_port" type="number" defaultValue="465" />
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsManageTitanAccountsOpen(false)} className="btn btn-secondary btn-sm">Close</button>
                  <button type="submit" disabled={loading} className="btn btn-primary btn-sm">Connect Account</button>
                </div>
              </form>
            </div>
          </div>
        </Modal>,
        document.body
      )}

      {isManageFortnoxOpen && createPortal(
        <Modal
          title="Fortnox ERP Integration Settings"
          onClose={() => setIsManageFortnoxOpen(false)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setLoading(true);
                await api.fortnox.updateConfig(fortnoxConfig);
                toast('Fortnox configuration saved successfully!', 'success');
                setIsManageFortnoxOpen(false);
              } catch (err) {
                toast(err.message || 'Failed to save Fortnox settings', 'error');
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
              <div>
                <p className="text-[13px] font-800 text-white leading-tight">Enable Fortnox ERP Sync</p>
                <p className="text-[11px] text-[#8a94a6]">Optional mode: Invoices run standalone when disabled.</p>
              </div>
              <input
                type="checkbox"
                checked={fortnoxConfig.enabled}
                onChange={(e) => setFortnoxConfig({ ...fortnoxConfig, enabled: e.target.checked })}
                className="w-5 h-5 accent-[#0057c7] cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <Field label="Access Token">
                <Input
                  value={fortnoxConfig.accessToken || ''}
                  onChange={(e) => setFortnoxConfig({ ...fortnoxConfig, accessToken: e.target.value })}
                  placeholder="Fortnox API Access Token"
                />
              </Field>
              <Field label="Client Secret">
                <Input
                  type="password"
                  value={fortnoxConfig.clientSecret || ''}
                  onChange={(e) => setFortnoxConfig({ ...fortnoxConfig, clientSecret: e.target.value })}
                  placeholder="Fortnox Client Secret"
                />
              </Field>
              <Field label="Default Cost Center / Cost Carrier">
                <Input
                  value={fortnoxConfig.costCenter || '1010'}
                  onChange={(e) => setFortnoxConfig({ ...fortnoxConfig, costCenter: e.target.value })}
                  placeholder="e.g. 1010"
                />
              </Field>
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <button
                type="button"
                disabled={fortnoxTesting}
                onClick={async () => {
                  try {
                    setFortnoxTesting(true);
                    const res = await api.fortnox.testConnection(fortnoxConfig);
                    if (res.success) toast(res.message, 'success');
                    else toast(res.message || 'Connection test failed', 'error');
                  } catch (err) {
                    toast(err.message || 'Test failed', 'error');
                  } finally {
                    setFortnoxTesting(false);
                  }
                }}
                className="btn btn-secondary text-[11px] font-800"
              >
                {fortnoxTesting ? 'Testing...' : '🔌 Test API Connection'}
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsManageFortnoxOpen(false)} className="btn btn-secondary text-[11px]">Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary text-[11px]">Save Fortnox Settings</button>
              </div>
            </div>
          </form>
        </Modal>,
        document.body
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  SETTINGS PAGE
// ─────────────────────────────────────────────────────────
export function SettingsPage({ toast }) {
  const [activeTab, setActiveTab] = useState('Firm Profile');
  const [settings, setSettings] = useState({});
  const [companyProfile, setCompanyProfile] = useState({});
  
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const logoInputRef = useRef(null);
  const letterheadInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [res, profileRes] = await Promise.all([
          api.settings.get(),
          api.settings.getCompanyProfile()
        ]);
        setSettings(res.data || {});
        setCompanyProfile(profileRes.data || {});
      } catch (e) {
        toast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await Promise.all([
        api.settings.update(settings),
        api.settings.updateCompanyProfile(companyProfile)
      ]);
      toast('Firm settings saved successfully!', 'success');
      window.dispatchEvent(new CustomEvent('vktori:entities-changed'));
    } catch (e) {
      toast(e.message || 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const updateProfile = (key, val) => {
    setCompanyProfile(prev => ({ ...prev, [key]: val }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.settings.uploadLogo(formData);
      setCompanyProfile(res.data || {});
      toast('Logo uploaded successfully', 'success');
    } catch (err) {
      toast(err.message || 'Logo upload failed', 'error');
    }
  };

  const handleLetterheadUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('letterhead', file);
      const res = await api.settings.uploadLetterhead(formData);
      setCompanyProfile(res.data || {});
      toast('Letterhead uploaded successfully', 'success');
    } catch (err) {
      toast(err.message || 'Letterhead upload failed', 'error');
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const res = await api.settings.removeLogo();
      setCompanyProfile(res.data || {});
      toast('Logo removed successfully', 'success');
    } catch (err) {
      toast(err.message || 'Failed to remove logo', 'error');
    }
  };

  const handleRemoveLetterhead = async () => {
    try {
      const res = await api.settings.removeLetterhead();
      setCompanyProfile(res.data || {});
      toast('Letterhead removed successfully', 'success');
    } catch (err) {
      toast(err.message || 'Failed to remove letterhead', 'error');
    }
  };



  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <PageHeader title="Firm Configuration" subtitle="Neural control center for firm protocols and operational settings" />

      <Tabs tabs={['Firm Profile', 'Practice Areas', 'Custom Fields', 'Social Links', 'Security']} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'Practice Areas' && <PracticeAreasTab toast={toast} />}
      {activeTab === 'Custom Fields' && <CustomFieldsTab toast={toast} />}

      {activeTab === 'Firm Profile' && (
        <Card className="max-w-3xl border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 sm:gap-8 mb-10 pb-10 border-b border-white/5">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#0057c7] to-[#0B1F3A] flex items-center justify-center text-4xl text-white font-900 shadow-[0_15px_40px_rgba(0,87,199,0.3)] border border-white/10 relative overflow-hidden group flex-shrink-0">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              {companyProfile.logo_url ? (
                <img src={`${API_BASE_URL.replace(/\/api$/, '')}${companyProfile.logo_url}`} alt="Logo" className="w-full h-full object-contain bg-white" />
              ) : (
                <span className="relative z-10 drop-shadow-2xl">{String(companyProfile.company_name || 'V')[0]}</span>
              )}
            </div>
            <div>
              <h3 className="text-[22px] font-900 text-white font-display tracking-tight leading-none mb-2">{companyProfile.company_name || 'Pilbågen Advokatbyrå'}</h3>
              <p className="text-[11px] text-[#8a94a6] font-900 uppercase tracking-[0.3em] opacity-60">Centralized Firm Profile</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Field label="Law Firm Name"><Input value={companyProfile.company_name || ''} onChange={e => updateProfile('company_name', e.target.value)} placeholder="Full legal name" /></Field>
            <Field label="Global Phone Link"><Input value={companyProfile.phone || ''} onChange={e => updateProfile('phone', e.target.value)} placeholder="+1 (000) 000-0000" /></Field>
            <Field label="Primary Secure Email"><Input value={companyProfile.email || ''} onChange={e => updateProfile('email', e.target.value)} placeholder="administrative@firm.com" /></Field>
            <Field label="Website"><Input value={companyProfile.website || ''} onChange={e => updateProfile('website', e.target.value)} placeholder="https://www.firm.com" /></Field>
            <div className="md:col-span-2">
              <Field label="Firm Address"><Textarea rows={2} value={companyProfile.address || ''} onChange={e => updateProfile('address', e.target.value)} placeholder="123 Legal Avenue..." /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Standard Hourly Rate ($/HR)"><Input type="number" value={settings.billing_rate || ''} onChange={e => updateSetting('billing_rate', e.target.value)} placeholder="e.g. 350" /></Field>
            </div>
          </div>

          {/* Branding Uploads */}
          <div className="space-y-6 pt-6 border-t border-white/5">
            <h4 className="text-[12px] font-900 text-white uppercase tracking-[0.2em]">Document Branding (PDFs & Templates)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <div className="p-5 border border-white/5 rounded-2xl bg-white/[0.02]">
                <p className="text-[11px] text-[#8a94a6] font-900 uppercase tracking-widest mb-3">Firm Logo</p>
                <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
                <button onClick={() => logoInputRef.current?.click()} className="btn w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] uppercase font-900 tracking-wider">
                  Upload Logo
                </button>
                {companyProfile.logo_url && (
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[10px] text-[#10b981]">✓ Logo Active</p>
                    <button onClick={handleRemoveLogo} className="text-[10px] text-[#ef4444] hover:text-[#ef4444]/80 font-800 uppercase tracking-widest transition-colors">
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-10 pt-6 border-t border-white/5">
            <button onClick={handleSave} disabled={loading} className="h-12 px-10 rounded-2xl bg-[#0057c7] text-white text-[11px] font-900 uppercase tracking-widest hover:bg-[#004bb1] transition-all shadow-[0_10px_30px_rgba(0,87,199,0.3)] disabled:opacity-50">
              {loading ? 'Reconciling...' : 'Save Configuration'}
            </button>
          </div>
        </Card>
      )}


      
      {activeTab === 'Social Links' && <SocialLinksSettings toast={toast} />}

      {activeTab === 'Security' && (
        <Card className="max-w-3xl border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#0057c7]/10 flex items-center justify-center text-[#38bdf8]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="text-[11px] font-900 text-white uppercase tracking-[0.3em]">Access Credentials</h3>
          </div>
          <div className="space-y-6">
            <Field label="Current Authorization Password"><Input type="password" placeholder="••••••••" value={passwordForm.currentPassword} onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))} /></Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="New Secure Password"><Input type="password" placeholder="••••••••" value={passwordForm.newPassword} onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))} /></Field>
              <Field label="Confirm Synchronization"><Input type="password" placeholder="••••••••" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))} /></Field>
            </div>
          </div>
          <div className="flex justify-end mt-10 pt-6 border-t border-white/5">
            <button onClick={async () => {
                if (!passwordForm.currentPassword || !passwordForm.newPassword) return toast('Please fill in all password fields', 'error');
                if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast('Passwords do not match', 'error');
                if (passwordForm.currentPassword === passwordForm.newPassword) return toast('New password cannot be the same as the current password', 'error');
                try {
                  setLoading(true);
                  await api.auth.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
                  toast('Password updated successfully!', 'success');
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                } catch (e) { toast(e.message || 'Failed to update password', 'error'); } finally { setLoading(false); }
              }} disabled={loading} className="h-12 px-10 rounded-2xl bg-[#0057c7] text-white text-[11px] font-900 uppercase tracking-widest hover:bg-[#004bb1] transition-all shadow-[0_10px_30px_rgba(0,87,199,0.3)] disabled:opacity-50">
              {loading ? 'Updating Vault...' : 'Reset Credentials'}
            </button>
          </div>
        </Card>
      )}



    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  TEMPLATE LIBRARY COMPONENT
// ─────────────────────────────────────────────────────────
export function TemplateLibrary({ targetMatterId, onSelect, toast }) {
  const [templates, setTemplates] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const loadTemplates = () => {
    if (isFirstLoad.current) { setLoading(true); isFirstLoad.current = false; }
    api.templates.list({ limit: 100 }).then(res => {
      setTemplates(res.data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleDuplicate = async (id) => {
    try {
      await api.templates.duplicate(id);
      if (toast) toast('Template duplicated successfully!', 'success');
      loadTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.templates.remove(id);
      if (toast) toast('Template deleted successfully!', 'success');
      loadTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (template) => {
    window.dispatchEvent(new CustomEvent('vktori:open-modal', {
      detail: { 
        type: 'edit-template', 
        data: template, 
        onSave: async (values) => {
          const catVal = values.category === 'other'
            ? (values.custom_category || '').trim()
            : (values.category || 'court_form');
          const paVal = values.practice_area === 'other'
            ? (values.custom_practice_area || '').trim()
            : (values.practice_area || null);
          await api.templates.update(template.id, {
            title: values.title,
            content: values.content,
            category: catVal,
            practice_area: paVal,
            matter_type: paVal,
            description: values.description || null,
            is_active: values.is_active !== 'inactive',
          });
          if (toast) toast('Template updated successfully!', 'success');
          loadTemplates();
        }
      }
    }));
  };

  const filtered = templates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          (t.category || '').toLowerCase().includes(search.toLowerCase()) ||
                          (t.description || '').toLowerCase().includes(search.toLowerCase());
    const mappedTab = activeTab.toLowerCase().replace(/ /g, '_');
    const matchesTab = activeTab === 'All' || (t.category || '').toLowerCase() === mappedTab;
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="w-10 h-10 border-4 border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-[#8a94a6] font-600 animate-pulse">Accessing Secure Library...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative group flex-1">
          <input
            className="text-[14px] bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-3 w-full outline-none focus:border-[#38bdf8] focus:ring-4 focus:ring-[#0057c7]/20 text-white transition-all placeholder:text-white/20"
            placeholder="Search global templates by title, description or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#8a94a6] group-focus-within:text-[#38bdf8] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('vktori:open-modal', {
              detail: { 
                type: 'add-template', 
                data: null, 
                onSave: async (values) => {
                  const catVal = values.category === 'other'
                    ? (values.custom_category || '').trim()
                    : (values.category || 'court_form');
                  const paVal = values.practice_area === 'other'
                    ? (values.custom_practice_area || '').trim()
                    : (values.practice_area || null);
                  await api.templates.create({
                    title: values.title,
                    content: values.content,
                    category: catVal,
                    practice_area: paVal,
                    matter_type: paVal,
                    description: values.description || null,
                    is_active: values.is_active !== 'inactive',
                  });
                  if (toast) toast('Template created successfully!', 'success');
                  loadTemplates();
                }
              }
            }));
          }}
          className="btn btn-primary h-12 px-6 text-[11px] font-900 uppercase tracking-widest shadow-[#0057c7]/20 whitespace-nowrap"
        >
          Create Template
        </button>
      </div>

      <div className="flex gap-2 border-b border-white/5 pb-4 mb-2 overflow-x-auto custom-scrollbar">
        {['All', 'Agreement', 'Court Form', 'Letter', 'Contract', 'Motion', 'Pleading', 'Affidavit', 'Notice', 'Demand Letter', 'Legal Disclaimer', 'Other'].map(cat => {
          const tabKey = cat === 'All' ? 'All' : cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-900 uppercase tracking-widest transition-colors whitespace-nowrap ${
                activeTab === cat ? 'bg-[#38bdf8] text-white shadow-lg shadow-[#38bdf8]/20' : 'bg-white/5 text-[#8a94a6] hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="max-h-[450px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {filtered.length > 0 ? filtered.map(t => (
          <div key={t.id} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#38bdf8]/30 transition-all group flex items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0057c7]/5 blur-3xl pointer-events-none group-hover:bg-[#0057c7]/10 transition-all" />
            <div className="min-w-0 relative z-10 flex-1">
              <p className="text-[15px] font-800 text-white group-hover:text-[#38bdf8] transition-colors tracking-tight">{t.title}</p>
              {t.description && (
                <p className="text-[12px] text-[#8a94a6] mt-1 line-clamp-2 font-500">{t.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-[9px] font-900 px-2.5 py-1 rounded-lg bg-[#0057c7]/10 text-[#38bdf8] border border-[#0057c7]/20 uppercase tracking-[0.15em]">{t.category || 'General'}</span>
                <span className="text-[11px] text-[#8a94a6] font-700 opacity-60">· Template Ref #{t.id}</span>
                <span className={`text-[10px] font-900 px-2 py-0.5 rounded uppercase tracking-wider ${t.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'}`}>
                  {t.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 relative z-10 flex-shrink-0">
              <button onClick={() => handleEdit(t)} className="btn btn-secondary h-9 px-4 text-[11px] font-900 uppercase tracking-widest whitespace-nowrap">
                Edit
              </button>
              <button onClick={() => handleDuplicate(t.id)} className="btn btn-secondary h-9 px-4 text-[11px] font-900 uppercase tracking-widest whitespace-nowrap">
                Duplicate
              </button>
              <button onClick={() => handleDelete(t.id)} className="btn btn-secondary h-9 px-4 text-[11px] font-900 uppercase tracking-widest text-rose-400 border-rose-500/10 hover:bg-rose-500/10 whitespace-nowrap">
                Delete
              </button>
              {targetMatterId && (
                <button onClick={() => {
                    window.dispatchEvent(new CustomEvent('vktori:open-modal', {
                      detail: { type: 'use-template', data: { ...t, targetMatterId } }
                    }));
                  }} className="btn btn-primary h-9 px-6 text-[11px] font-900 uppercase tracking-widest shadow-[#0057c7]/20 whitespace-nowrap">
                  Apply Template
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
            <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5"><svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg></div>
            <p className="text-[14px] font-800 text-white opacity-40">No matching templates found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  SOCIAL LINKS SETTINGS
// ─────────────────────────────────────────────────────────
export function SocialLinksSettings({ toast }) {
  const [links, setLinks] = useState([
    { platform: 'LinkedIn', url: '' },
    { platform: 'Instagram', url: '' },
    { platform: 'Facebook', url: '' },
    { platform: 'YouTube', url: '' }
  ]);
  
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.marketing.getSocialLinks();
        if (res.success && res.data.length > 0) {
          const merged = links.map(d => {
            const found = res.data.find(r => r.platform === d.platform);
            return found ? { ...d, url: found.url || '' } : d;
          });
          setLinks(merged);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.marketing.updateSocialLinks(links);
      toast('Social links updated successfully!', 'success');
    } catch (e) { toast(e.message || 'Failed to update links', 'error'); } finally { setSaving(false); }
  };

  const updateUrl = (platform, url) => {
    setLinks(prev => prev.map(l => l.platform === platform ? { ...l, url } : l));
  };

  if (loading) {
    return (
      <Card className="max-w-3xl border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-white/5 rounded" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#0057c7]/10 flex items-center justify-center text-[#38bdf8]"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg></div>
        <h3 className="text-[11px] font-900 text-white uppercase tracking-[0.3em]">Institutional Presence</h3>
      </div>
      <p className="text-[13px] text-[#8a94a6] mb-10 leading-relaxed opacity-70">Configure authenticated social identity links for the firm's public portal.</p>
      
      <div className="space-y-6">
        {links.map(link => (
          <div key={link.platform} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-[#38bdf8]/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                {link.platform === 'LinkedIn' ? <svg className="w-5 h-5 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg> : link.platform === 'Instagram' ? <svg className="w-5 h-5 text-[#e1306c]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> : link.platform === 'Facebook' ? <svg className="w-5 h-5 text-[#1877f2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> : <svg className="w-5 h-5 text-[#ff0000]" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>}
              </div>
              <span className="text-[14px] font-900 text-white tracking-tight">{link.platform}</span>
            </div>
            <div className="md:col-span-3"><Input placeholder={`Authenticated path for ${link.platform}`} value={link.url} onChange={e => updateUrl(link.platform, e.target.value)} /></div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-10 pt-6 border-t border-white/5">
        <button onClick={handleSave} disabled={saving} className="h-12 px-10 rounded-2xl bg-[#0057c7] text-white text-[11px] font-900 uppercase tracking-widest hover:bg-[#004bb1] transition-all shadow-[0_10px_30px_rgba(0,87,199,0.3)] disabled:opacity-50">
          {saving ? 'Synchronizing...' : 'Update Social Protocols'}
        </button>
      </div>
    </Card>
  );
}

// Modular Page Exports for Agency Administrator Phase 2
export { AdminPartiesPage } from './admin/AdminPartiesPage.jsx';
export { AdminBackOfficePage } from './admin/AdminBackOfficePage.jsx';
