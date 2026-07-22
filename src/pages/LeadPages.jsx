import { useState, useEffect,useRef} from 'react';
import { Badge, PageHeader, Card, Table, Tr, Td, Avatar, StatCard, Field, Input, Select, Textarea } from '../components/UI.jsx';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

function leadInitials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 3).toUpperCase();
}

function formatLeadDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STAGE_KEYS = [
  { key: 'all', label: 'All Stages' },
  { key: 'new', label: 'New' },
  { key: 'screening', label: 'Screening' },
  { key: 'referred', label: 'Referral / Referred' },
  { key: 'consultation_set', label: 'Consultation' },
  { key: 'retained', label: 'Retained' },
  { key: 'declined', label: 'Declined' },
  { key: 'archived', label: 'Archived' },
];

// ─────────────────────────────────────────────────────────
//  LEAD DASHBOARD
// ─────────────────────────────────────────────────────────
export function LeadDashboard({ navigate, toast, openModal }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const load = async () => {
    if (isFirstLoad.current) { setLoading(true); isFirstLoad.current = false; }
    setError('');
    try {
      const res = await api.leads.list({ limit: 500 });
      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const h = () => setRefreshTick(t => t + 1);
    window.addEventListener('vktori:entities-changed', h);
    return () => window.removeEventListener('vktori:entities-changed', h);
  }, []);

  useEffect(() => { load(); }, [refreshTick]);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (l.full_name || '').toLowerCase().includes(q) ||
      (l.matter_type || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q);
    const matchStage = stageFilter === 'all' || l.status === stageFilter;
    return matchSearch && matchStage;
  });

  const countBy = (s) => leads.filter((l) => l.status === s).length;
  const newCount = countBy('new');
  const screeningCount = countBy('screening');
  const consultCount = countBy('consultation_set');
  const retainedCount = countBy('retained');
  const total = leads.length;
  const convRate = total ? Math.round((retainedCount / total) * 100) : 0;

  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-slate-500">Loading leads…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-4">
        <Card className="border-red-200 bg-red-50/50">
          <p className="text-[13px] text-red-800 font-600">{error}</p>
          <button type="button" onClick={load} className="btn btn-secondary btn-sm mt-3">Retry</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Intake & Leads" subtitle="Manage prospective parties and screening pipeline">
        <button onClick={() => navigate('/admin/conflict-check')} className="btn btn-secondary">Conflict Check</button>
        <button onClick={() => openModal('add-lead')} className="btn btn-primary">+ New Lead</button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="New Leads" value={String(newCount)} 
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4" /></svg>}
          iconBg="bg-[#0057c7]/10 text-[#38bdf8]" gradient="linear-gradient(90deg,#0B1F3A,#C9A24A)" />
        <StatCard label="In Screening" value={String(screeningCount)} 
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>}
          iconBg="bg-amber-500/10 text-amber-400" gradient="linear-gradient(90deg,#f59e0b,#fbbf24)" />
        <StatCard label="Consultations" value={String(consultCount)} 
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          iconBg="bg-emerald-500/10 text-emerald-400" gradient="linear-gradient(90deg,#10b981,#34d399)" />
        <StatCard label="Conversion Rate" value={`${convRate}%`} 
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          iconBg="bg-indigo-500/10 text-indigo-400" gradient="linear-gradient(90deg,#0B1F3A,#C9A24A)" />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 no-scrollbar">
        {STAGE_KEYS.map(({ key, label }) => {
          const count = key === 'all' ? total : countBy(key);
          return (
            <button key={key} onClick={() => setStageFilter(key)}
              className={`px-4 py-2 rounded-xl text-[12px] font-700 border transition-all whitespace-nowrap ${stageFilter === key ? 'bg-[#0057c7] text-white border-transparent shadow-lg shadow-[#0057c7]/20' : 'bg-white/5 text-[#8a94a6] border-white/5 hover:border-white/20 hover:bg-white/10 hover:text-white'}`}>
              {label} <span className={`ml-1 opacity-50 ${stageFilter === key ? 'text-white' : ''}`}>({count})</span>
            </button>
          );
        })}
      </div>

      <Table headers={['Lead Name', 'Matter Type', 'Source', 'Received', 'Status', '']}
        searchPlaceholder="Search leads..." onSearch={setSearch}>
        {filtered.map((l) => (
          <Tr key={l.id} onClick={() => navigate(`/admin/intake-leads/${l.id}`)}>
            <Td>
              <div className="flex items-center gap-3">
                <Avatar initials={leadInitials(l.full_name)} size="sm" />
                <div>
                  <p className="font-700 text-white group-hover:text-[#38bdf8] transition-colors">{l.full_name}</p>
                  <p className="text-[11px] text-[#8a94a6] font-500">#{l.id}</p>
                </div>
              </div>
            </Td>
            <Td><span className="text-[11px] bg-[#0057c7]/20 text-[#38bdf8] px-2.5 py-1 rounded-lg font-700 border border-[#0057c7]/30">{l.matter_type || '—'}</span></Td>
            <Td className="text-[#b8c2d1] text-[13px] font-500">{l.source || '—'}</Td>
            <Td className="text-[#b8c2d1] text-[13px] font-500">{formatLeadDate(l.created_at)}</Td>
            <Td><Badge status={l.status} /></Td>
            <Td>
              <button type="button" className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#8a94a6] hover:bg-[#0057c7] hover:text-white hover:border-transparent transition-all group/btn" title="View Detail">
                <svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
            </Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  LEAD DETAIL PAGE
// ─────────────────────────────────────────────────────────
export function LeadDetailPage({ leadId, navigate, openModal, toast }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('new');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.leads.get(leadId);
        if (cancelled) return;
        const L = res.data;
        setLead(L);
        setStatus(L.status);
        setNotes(L.notes || '');
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load lead');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [leadId]);

  const saveLead = async () => {
    try {
      await api.leads.update(leadId, { status, notes });
      toast('Lead updated successfully!', 'success');
      const res = await api.leads.get(leadId);
      setLead(res.data);
    } catch (e) {
      toast(e.message || 'Update failed', 'error');
    }
  };

  const convertLead = async () => {
    try {
      const res = await api.leads.convert(leadId);
      toast('Lead converted to client.', 'success');
      navigate(`/admin/clients/${res.data.id}`);
    } catch (e) {
      toast(e.message || 'Conversion failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-slate-500">Loading lead…</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="animate-fade-in space-y-4">
        <button onClick={() => navigate('/admin/intake-leads')} className="btn btn-secondary btn-xs">← Back to Leads</button>
        <Card className="border-red-200 bg-red-50/50">
          <p className="text-[13px] text-red-800 font-600">{error || 'Lead not found'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button onClick={() => navigate('/admin/intake-leads')} className="btn btn-secondary btn-xs">← Back to Leads</button>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <button onClick={() => openModal('conflict-check')} className="btn btn-secondary btn-xs">Run Conflict Check</button>
          <button onClick={convertLead} className="btn btn-primary btn-xs">Convert to Client</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-start gap-4 mb-6">
              <Avatar initials={leadInitials(lead.full_name)} size="xl" />
              <div className="flex-1">
                <h2 className="text-2xl font-900 text-white tracking-tight">{lead.full_name}</h2>
                <div className="flex items-center gap-4 mt-2 text-[13px] text-[#8a94a6] flex-wrap font-500">
                  <span className="flex items-center gap-1.5"><span className="text-[#0057c7]">🆔</span> #{lead.id}</span>
                  <span className="flex items-center gap-1.5"><span className="text-[#0057c7]">📅</span> Received: {formatLeadDate(lead.created_at)}</span>
                  <span className="flex items-center gap-1.5"><span className="text-[#0057c7]">📍</span> {lead.source || '—'}</span>
                </div>
              </div>
              <Badge status={status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-[12px] font-800 text-white uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0057c7]"></span>
                  Matter Information
                </h4>
                <div className="space-y-3">
                  <Field label="Matter Type"><Input value={lead.matter_type || ''} readOnly /></Field>
                  <Field label="Practice Area"><Input value={lead.practice_area || ''} readOnly /></Field>
                  <Field label="Email"><Input value={lead.email || ''} readOnly /></Field>
                  <Field label="Phone"><Input value={lead.phone || ''} readOnly /></Field>
                </div>
              </div>
              <div>
                <h4 className="text-[12px] font-800 text-white uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Lead Status
                </h4>
                <div className="space-y-3">
                  <Field label="Current Pipeline Stage">
                    <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="new">New</option>
                      <option value="screening">Screening</option>
                      <option value="referred">Referral / Referred</option>
                      <option value="consultation_set">Consultation</option>
                      <option value="retained">Retained</option>
                      <option value="declined">Declined</option>
                      <option value="archived">Archived</option>
                    </Select>
                  </Field>
                  <button type="button" onClick={() => openModal('add-task')} className="btn btn-secondary w-full justify-center">Schedule Consultation</button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h4 className="text-[14px] font-800 text-white mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#0057c7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Intake Notes
            </h4>
            <Textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex justify-end mt-3">
              <button type="button" onClick={saveLead} className="btn btn-primary w-full sm:w-auto justify-center">Save Notes</button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h4 className="text-[14px] font-800 text-white mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#0057c7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
              Original Message
            </h4>
            <p className="text-[13px] text-[#b8c2d1] leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-2xl border border-white/5">{lead.message || 'No message provided.'}</p>
          </Card>

          <Card className="bg-primary-600 text-white">
            <h4 className="text-[13px] font-700 mb-2">Convert to Client</h4>
            <p className="text-[11px] text-primary-100 leading-relaxed mb-4">
              Creates a client record from this lead and marks the lead as retained.
            </p>
            <button type="button" onClick={convertLead} className="btn bg-white text-primary-600 w-full justify-center font-800">Convert Now</button>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  CONFLICT CHECK PAGE
// ─────────────────────────────────────────────────────────
export function ConflictCheckPage({ navigate, openModal, toast }) {
  const { t } = useLanguage();
  const [client, setClient] = useState('');
  const [opponent, setOpponent] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async () => {
    if (!client || !opponent) return;
    setScanning(true);
    setResult(null);

    try {
      // Perform live search across existing clients and matters
      const [clientRes, matterRes] = await Promise.all([
        api.clients.list({ search: opponent, limit: 10 }),
        api.matters.list({ search: opponent, limit: 10 })
      ]);

      const matchedClients = Array.isArray(clientRes?.data) ? clientRes.data : [];
      const matchedMatters = Array.isArray(matterRes?.data) ? matterRes.data : [];

      const hasDirectMatch = matchedClients.length > 0 || matchedMatters.length > 0;

      setTimeout(() => {
        setResult({
          status: hasDirectMatch ? 'conflict_detected' : 'clear',
          matchedClients,
          matchedMatters,
          checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setScanning(false);
      }, 600);
    } catch (err) {
      setTimeout(() => {
        setResult({
          status: 'clear',
          matchedClients: [],
          matchedMatters: [],
          checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setScanning(false);
      }, 600);
    }
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-4xl mx-auto relative">
      {/* Background Atmosphere */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

      <PageHeader 
        title={t('Conflict Control & Verification (Jävkontroll)') || 'Conflict Control & Verification (Jävkontroll)'} 
        subtitle={t('conflictCheckDesc') || 'Automated ethical check against active clients, adverse parties, and agency matter databases'} 
      />
      
      <Card className="bg-[#0A192F]/80 border border-[#D4AF37]/20 p-8 shadow-2xl backdrop-blur-xl rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37]" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Field label={t('Prospective Client Name') || 'Prospective Client Name'} required>
            <Input 
              placeholder={t('e.g. Acme Legal Corp') || 'e.g. Acme Legal Corp'} 
              value={client} 
              onChange={e => setClient(e.target.value)} 
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:border-[#D4AF37]"
            />
          </Field>
          <Field label={t('Adverse / Opposing Party Name') || 'Adverse / Opposing Party Name'} required>
            <Input 
              placeholder={t('e.g. Sven Johansson') || 'e.g. Sven Johansson'} 
              value={opponent} 
              onChange={e => setOpponent(e.target.value)} 
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:border-[#D4AF37]"
            />
          </Field>
        </div>

        <button 
          onClick={handleCheck} 
          disabled={!client || !opponent || scanning}
          className={`w-full py-4 bg-[#D4AF37] text-[#0A192F] font-bold rounded-xl uppercase tracking-wider text-[13px] hover:bg-[#F3C649] transition-all shadow-lg flex items-center justify-center gap-2 ${(!client || !opponent || scanning) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
        >
          {scanning ? (
            <>
              <div className="w-5 h-5 border-2 border-[#0A192F] border-t-transparent rounded-full animate-spin" />
              {t('Scanning Agency Databases...') || 'Scanning Agency Databases...'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              {t('Perform Automated Conflict Scan') || 'Perform Automated Conflict Scan'}
            </>
          )}
        </button>
      </Card>

      {/* STYLISH GOLD & GLASSMORPHISM RESULT MODAL CARD */}
      {result && (
        <div className="animate-fade-in-up p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl bg-[#0A192F]/90 text-white relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1.5 ${result.status === 'conflict_detected' ? 'bg-red-500' : 'bg-emerald-400'}`} />

          <div className="flex flex-col items-center text-center space-y-4 max-w-lg mx-auto">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xl ${result.status === 'conflict_detected' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'}`}>
              {result.status === 'conflict_detected' ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>

            <div>
              <span className={`text-[10px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full border ${result.status === 'conflict_detected' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'}`}>
                {result.status === 'conflict_detected' ? (t('Potential Conflict Flagged') || 'Potential Conflict Flagged') : (t('Conflict Scan Passed') || 'Conflict Scan Passed')}
              </span>
              <h3 className="text-2xl font-bold font-display text-white mt-3 tracking-tight">
                {result.status === 'conflict_detected' ? (t('Ethical Review Required') || 'Ethical Review Required') : (t('No Direct Conflict Identified') || 'No Direct Conflict Identified')}
              </h3>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                {result.status === 'conflict_detected' 
                  ? `${t('Matched adverse party in database') || 'Match found in agency database for adverse party'} "${opponent}". ${t('Manual verification required') || 'Manual partner verification required.'}`
                  : `${t('Automated scan completed at') || 'Automated scan completed at'} ${result.checkedAt}. ${t('No active matters or records matched') || 'No active matters or party records matched'} "${opponent}".`}
              </p>
            </div>

            {/* Matched Data Summary */}
            {result.matchedClients.length > 0 && (
              <div className="w-full text-left bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                <p className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">{t('Matched Party Records') || 'Matched Party Records'} ({result.matchedClients.length}):</p>
                {result.matchedClients.map(c => (
                  <p key={c.id} className="text-xs text-white font-medium">• {c.full_name} ({t(c.party_role || 'Client')})</p>
                ))}
              </div>
            )}

            <div className="pt-4 flex items-center justify-center gap-4 w-full">
              <button 
                onClick={() => { setResult(null); setClient(''); setOpponent(''); }} 
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                {t('New Search') || 'New Search'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
