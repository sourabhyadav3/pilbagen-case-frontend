import { useState, useEffect } from 'react';
import { PageHeader, Card, StatCard, ProgressBar, Input, Select, Field, downloadFile } from '../components/UI.jsx';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

// ─────────────────────────────────────────────────────────
//  MARKETING DASHBOARD
// ─────────────────────────────────────────────────────────
export function MarketingDashboard({ navigate, toast, openModal }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const h = () => setRefreshTick(t => t + 1);
    window.addEventListener('vktori:entities-changed', h);
    return () => window.removeEventListener('vktori:entities-changed', h);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.reports.marketing();
        if (cancelled) return;
        setData(res.data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load marketing analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshTick]);

  if (loading) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] text-[#8a94a6] font-900 uppercase tracking-widest opacity-60">Analyzing Market Intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in py-12">
        <Card className="border-[#ef4444]/20 bg-[#ef4444]/5 text-center p-12 max-w-lg mx-auto">
          <p className="text-[13px] text-[#ef4444] font-900 uppercase tracking-widest">{error}</p>
        </Card>
      </div>
    );
  }

  const stats = data || {};

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <PageHeader title="Intelligence & Analytics" subtitle="Lead source attribution and conversion performance monitoring" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          label="Total Visitors" 
          value={stats.visitors || 0} 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>} 
          iconBg="bg-[#0057c7]/10" 
          gradient="linear-gradient(135deg, #0B1F3A, #0057c7)" 
        />
        <StatCard 
          label="Total Leads" 
          value={stats.leads || 0} 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} 
          iconBg="bg-[#f59e0b]/10" 
          gradient="linear-gradient(135deg, #1a1a1a, #f59e0b)" 
        />
        <StatCard 
          label="Conversion" 
          value={`${stats.conversionRate || 0}%`} 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" /></svg>} 
          iconBg="bg-[#10b981]/10" 
          gradient="linear-gradient(135deg, #1a1a1a, #10b981)" 
        />
        <StatCard 
          label="Retained" 
          value={stats.clients || 0} 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
          iconBg="bg-[#38bdf8]/10" 
          gradient="linear-gradient(135deg, #1a1a1a, #38bdf8)" 
        />
        <StatCard 
          label="Market Rev." 
          value={`$${Number(stats.revenue || 0).toLocaleString()}`} 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3m0-4v2m0 16v2" /></svg>} 
          iconBg="bg-[#10b981]/10" 
          gradient="linear-gradient(135deg, #0B1F3A, #10b981)" 
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-[11px] font-900 text-white uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                Inbound Attribution Matrix
              </h3>
              <p className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest mt-2 opacity-60">Verified lead sources by channel</p>
            </div>
          </div>
          <div className="space-y-6">
            {!stats.leadsBySource || stats.leadsBySource.length === 0 ? (
              <div className="py-20 text-center opacity-40">
                <p className="text-[13px] text-[#8a94a6] font-900 uppercase tracking-widest">No attribution data synchronized.</p>
              </div>
            ) : (
              stats.leadsBySource.map((c) => (
                <div key={c.name} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${c.color} shadow-[0_0_10px_currentColor]`} />
                      <span className="text-[14px] text-white font-800 tracking-tight">{c.name} <span className="text-[#8a94a6] text-[12px] ml-1 opacity-60">({c.count} records)</span></span>
                    </div>
                    <span className="text-[15px] font-900 text-white tracking-tighter">{c.value}%</span>
                  </div>
                  <ProgressBar pct={c.value} color={c.color} />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="bg-[#0057c7]/5 border border-[#0057c7]/10 p-6 rounded-3xl flex items-center gap-4 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0057c7]/5 blur-3xl group-hover:bg-[#0057c7]/10 transition-all duration-1000" />
        <div className="w-12 h-12 rounded-2xl bg-[#0057c7]/10 border border-[#0057c7]/20 flex items-center justify-center text-[#0057c7] flex-shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-[13px] text-white/80 font-800 tracking-tight leading-relaxed relative z-10">
          {stats.leads > 0 
            ? <>Executive analysis synchronized. System validated <span className="text-[#38bdf8]">{stats.leads} strategic leads</span> with a retention conversion of <span className="text-[#10b981]">{stats.clients} institutional clients</span>.</> 
            : "Campaign performance metrics are currently in initialization phase. Awaiting data synchronization."}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  REPORTS DASHBOARD
// ─────────────────────────────────────────────────────────
export function ReportsDashboard({ navigate, toast, openModal }) {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Financial');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const loadReports = async () => {
    try {
      const res = await api.reports.list();
      setReports(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const h = () => setRefreshTick(t => t + 1);
    window.addEventListener('vktori:entities-changed', h);
    return () => window.removeEventListener('vktori:entities-changed', h);
  }, []);

  useEffect(() => {
    loadReports();
  }, [refreshTick]);

  const handleGenerate = async () => {
    if (!title.trim() || !startDate || !endDate) {
       toast('Please fill all required fields.', 'error');
       return;
    }
    setIsGenerating(true);
    try {
      await api.reports.generate({
        title,
        category,
        start_date: startDate,
        end_date: endDate
      });
      toast('Report generated successfully!', 'success');
      setTitle('');
      loadReports();
    } catch (e) {
      toast(e.message || 'Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (r) => {
    toast(`Preparing PDF for ${r.title}...`, 'info');
    try {
      const res = await api.reports.download(r.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${r.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast('Report downloaded successfully', 'success');
    } catch (e) {
      toast(e.message || 'Download failed', 'error');
    }
  };

  const viewReport = (r) => {
    const d = r.data;
    const stats = [
      { 
        label: t('Lead Inbound') || 'Lead Inbound', 
        value: d.leads ?? 0, 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, 
        color: 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20' 
      },
      { 
        label: t('Matters Initialized') || 'Matters Initialized', 
        value: d.matters ?? 0, 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>, 
        color: 'text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/20' 
      },
      { 
        label: t('Revenue Reconciled') || 'Revenue Reconciled', 
        value: `$${Number(d.revenue || 0).toLocaleString()}`, 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3m0-4v2m0 16v2" /></svg>, 
        color: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20' 
      },
      { 
        label: t('Billable Capacity') || 'Billable Capacity', 
        value: `${d.hours || 0}h`, 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, 
        color: 'text-[#8a94a6] bg-white/5 border-white/10' 
      },
    ];

    openModal('view-report', {
      title: r.title,
      content: (
        <div className="space-y-8 py-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.3em] mb-1">{t('Fiscal Analysis Period') || 'Fiscal Analysis Period'}</p>
              <p className="text-[13px] font-800 text-white tracking-tight">{new Date(r.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(r.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.3em] mb-1">{t('Validation Hash') || 'Validation Hash'}</p>
              <p className="text-[13px] font-800 text-[#38bdf8] tracking-tighter opacity-80">REF-{String(r.id).slice(-8).toUpperCase()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map(s => (
              <div key={s.label} className={`p-5 rounded-3xl border ${s.color} backdrop-blur-xl relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-lg">
                    {s.icon}
                  </div>
                  <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-widest opacity-60 leading-none">{s.label}</p>
                </div>
                <p className="text-[22px] font-900 text-white tracking-tighter">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#0057c7]/5 border border-[#0057c7]/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#0057c7]/10 blur-3xl pointer-events-none group-hover:bg-[#0057c7]/20 transition-all duration-1000" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#38bdf8] font-900">{t('Executive Synthesis') || 'Executive Synthesis'}</p>
              </div>
              <p className="text-[15px] font-500 text-white/90 leading-relaxed tracking-tight">
                {t('consolidatedReportIntro') || 'This consolidated intelligence report for'} <span className="font-900 text-white">{r.title}</span> {t('consolidatedReportBody') || 'reflects a high-precision snapshot of firm operations. Liquidated revenue of'} <span className="text-[#10b981] font-900 underline decoration-2 decoration-[#10b981]/30 underline-offset-4">${Number(d.revenue || 0).toLocaleString()}</span> {t('consolidatedReportEnd') || 'represents finalized billing cycles. Operational throughput is tracked at'} <span className="text-[#38bdf8] font-900">{d.hours || 0} {t('verifiedBillableHours') || 'verified billable hours'}</span>.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
             <button onClick={() => handleDownload(r)} className="h-14 flex-1 rounded-2xl bg-white/5 border border-white/10 text-white text-[11px] font-900 uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3 group">
                <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {t('Secure PDF Export') || 'Secure PDF Export'}
             </button>
          </div>
        </div>
      )
    });
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <PageHeader title={t('Firm Intelligence') || 'Firm Intelligence'} subtitle={t('firmIntelligenceDesc') || 'Institutional performance audits and financial reconciliations'} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((r) => (
          <Card key={r.id} noPad className="hover:scale-[1.02] cursor-pointer group transition-all animate-slide-up border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-[2rem] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all group-hover:scale-110 ${r.category === 'Financial' ? 'bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981]' : 'bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8]'}`}>
                  {r.category === 'Financial' ? (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3m0-4v2m0 16v2" /></svg>
                  ) : (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-900 text-white tracking-tight truncate group-hover:text-[#38bdf8] transition-colors">{r.title}</p>
                  <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mt-1 opacity-60">{t(r.category) || r.category} Audit · {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => viewReport(r)} className="h-10 px-4 flex-1 rounded-xl bg-white/5 text-white text-[10px] font-900 uppercase tracking-widest hover:bg-white/10 transition-all">{t('Audit View') || 'Audit View'}</button>
                <button onClick={() => handleDownload(r)} className="h-10 px-4 flex-1 rounded-xl bg-[#0057c7] text-white text-[10px] font-900 uppercase tracking-widest hover:bg-[#004bb1] transition-all shadow-[0_10px_20px_-10px_#0057c7]">{t('Download') || 'Download'}</button>
              </div>
            </div>
          </Card>
        ))}
        {reports.length === 0 && (
          <div className="lg:col-span-3 py-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
            <p className="text-[13px] text-[#8a94a6] font-900 uppercase tracking-widest opacity-40">{t('No generated reports synchronized.') || 'No generated reports synchronized.'}</p>
          </div>
        )}
      </div>

      <Card className="mt-12 bg-white/[0.02] border-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 relative overflow-hidden group">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#0057c7]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#0057c7]/10 transition-all duration-1000" />
        
        <div className="flex items-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_10px_#f59e0b]" />
          <h3 className="text-[11px] font-900 text-white uppercase tracking-[0.3em]">{t('Institutional Report Builder') || 'Institutional Report Builder'}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end relative z-10">
          <div className="lg:col-span-3">
            <Field label={t('Audit Identification') || 'Audit Identification'} required>
              <Input placeholder={t('E.g., Quarterly Tax Summary') || 'E.g., Quarterly Tax Summary'} value={title} onChange={e => setTitle(e.target.value)} />
            </Field>
          </div>
          <div className="lg:col-span-3">
            <Field label={t('Audit Classification') || 'Audit Classification'}>
              <Select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="Financial">{t('Financial Performance') || 'Financial Performance'}</option>
                <option value="Operational">{t('Operational Efficiency') || 'Operational Efficiency'}</option>
                <option value="Marketing">{t('Market Attribution') || 'Market Attribution'}</option>
              </Select>
            </Field>
          </div>
          <div className="lg:col-span-2"><Field label={t('Period Start') || 'Period Start'} required><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></Field></div>
          <div className="lg:col-span-2"><Field label={t('Period End') || 'Period End'} required><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></Field></div>
          <div className="lg:col-span-2">
            <button onClick={handleGenerate} disabled={isGenerating}
              className="h-[46px] w-full rounded-2xl bg-[#0057c7] text-white text-[11px] font-900 uppercase tracking-widest hover:bg-[#004bb1] transition-all shadow-2xl shadow-[#0057c7]/40 disabled:opacity-50">
              {isGenerating ? (t('Processing...') || 'Processing...') : (t('Execute Audit') || 'Execute Audit')}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
