import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PageHeader, StatCard, Card, Table, Tr, Td, Badge, ProgressBar, Avatar, EmptyState } from '../components/UI.jsx';
import { LawyerDashboard, LawyerCasesPage } from './LawyerPages.jsx';
import { CasesPage, DocumentsPage, BillingPage, EmailPage, UsersPage, CalendarPage, SettingsPage } from './AdminPages.jsx';
import { ReportsDashboard } from './MarketingPages.jsx';
import { ConflictCheckPage } from './LeadPages.jsx';
import { dashboardAPI } from '../services/api.js';

// ─────────────────────────────────────────────────────────
//  PARTNER DASHBOARD (ENHANCED SENIOR MANAGEMENT VIEW)
// ─────────────────────────────────────────────────────────
export function PartnerDashboard(props) {
  const ctx = useOutletContext() || {};
  const navigate = props.navigate || ctx.navigate;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardAPI.partner()
      .then(res => {
        if (!cancelled) {
          setData(res.data || res);
          setError('');
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Failed to load partner dashboard');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#0057c7]/30 border-t-[#0057c7] rounded-full animate-spin" />
          <p className="text-[#8a94a6] text-sm font-600">Loading Partner Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm font-600">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-[#0057c7] text-white text-sm font-700">Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const KPI_ICONS = {
    'Active Matters': (
      <svg className="w-6 h-6 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    'Firm Matters': (
      <svg className="w-6 h-6 text-[#c084fc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4" />
      </svg>
    ),
    'Active Clients': (
      <svg className="w-6 h-6 text-[#34d399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    'Monthly Revenue': (
      <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 8v2m0-10e-5c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const firmPerformance = data.firmPerformance || { practiceAreas: [], avgDuration: 'N/A', successRate: 'N/A', realizationRate: 'N/A' };
  const teamPerformance = data.teamPerformance || [];
  const activities = data.activities || [];
  const upcomingSchedule = data.upcomingSchedule || [];
  const activeFirmMatters = data.activeFirmMatters || [];

  const REMOVED_KPIS = ['Associate Lawyers', 'Billable Hours', 'Pending Tasks', 'Upcoming Hearings', 'kpi-4', 'kpi-6', 'kpi-7', 'kpi-8'];
  const filteredKpis = (data.kpis || []).filter(
    (kpi) => !REMOVED_KPIS.includes(kpi.label) && !REMOVED_KPIS.includes(kpi.id)
  );

  return (
    <div className="animate-fade-in space-y-8 relative">
      {/* Background Atmosphere */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0057c7]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#7c3aed]/5 rounded-full blur-[120px] pointer-events-none" />

      <PageHeader 
        title="Partner Management Dashboard" 
        subtitle="Executive oversight of firm revenue, associate productivity, matter realization, and practice performance"
      />

      {/* KPI Cards Grid (4 Cards with Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredKpis.map((kpi) => (
          <StatCard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            change={kpi.change}
            icon={KPI_ICONS[kpi.label] || KPI_ICONS['Active Matters']}
          />
        ))}
      </div>

      {/* Executive Schedule & Firm Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Executive Schedule & Deadlines */}
        <Card className="space-y-4">
          <h3 className="text-lg font-800 text-white font-display border-b border-white/5 pb-3">Upcoming Partner Schedule</h3>
          <div className="space-y-3">
            {upcomingSchedule.length === 0 ? (
              <p className="text-[#8a94a6] text-sm text-center py-4">No upcoming events.</p>
            ) : (
              upcomingSchedule.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-900 text-[#38bdf8] uppercase tracking-wider">{item.time} • {item.date}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-800 uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[13px] font-700 text-white line-clamp-1">{item.title}</p>
                  <p className="text-[11px] text-[#8a94a6]">{item.location} ({item.matter})</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="space-y-4">
          <h3 className="text-lg font-800 text-white font-display border-b border-white/5 pb-3">Firm Activity Feed</h3>
          {activities.length === 0 ? (
            <p className="text-[#8a94a6] text-sm text-center py-4">No recent activity recorded.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4 hover:bg-white/[0.04] transition-all">
                  <div className="w-2 h-2 rounded-full bg-[#38bdf8] mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-700 text-white truncate">{act.title}</p>
                      <span className="text-[10px] font-800 text-[#8a94a6] uppercase tracking-wider">{act.time}</span>
                    </div>
                    <p className="text-[12px] text-[#8a94a6] line-clamp-1">{act.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  OTHER PARTNER WRAPPERS
// ─────────────────────────────────────────────────────────
export function PartnerMyMatters(props) {
  const ctx = useOutletContext() || {};
  return <LawyerCasesPage role="partner" {...ctx} {...props} />;
}

export function PartnerFirmMatters(props) {
  const ctx = useOutletContext() || {};
  return <CasesPage role="partner" {...ctx} {...props} />;
}

export function PartnerCalendar(props) {
  const ctx = useOutletContext() || {};
  return <CalendarPage role="lawyer" {...ctx} {...props} />;
}

export function PartnerDocuments(props) {
  const ctx = useOutletContext() || {};
  return <DocumentsPage role="lawyer" {...ctx} {...props} />;
}

export function PartnerBilling(props) {
  const ctx = useOutletContext() || {};
  return <BillingPage role="admin" {...ctx} {...props} />;
}

export function PartnerCommunications(props) {
  const ctx = useOutletContext() || {};
  return <EmailPage role="lawyer" {...ctx} {...props} />;
}

export function PartnerReports(props) {
  const ctx = useOutletContext() || {};
  return <ReportsDashboard role="admin" {...ctx} {...props} />;
}

export function PartnerTeam(props) {
  const ctx = useOutletContext() || {};
  return <UsersPage role="admin" {...ctx} {...props} />;
}

export function PartnerConflictCheck(props) {
  const ctx = useOutletContext() || {};
  return <ConflictCheckPage role="partner" {...ctx} {...props} />;
}

export function PartnerSettings(props) {
  const ctx = useOutletContext() || {};
  return <SettingsPage role="lawyer" {...ctx} {...props} />;
}
