import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { PageHeader, StatCard, Card, Table, Tr, Td, Badge, ProgressBar, Avatar } from '../components/UI.jsx';
import { LawyerDashboard, LawyerCasesPage } from './LawyerPages.jsx';
import { CasesPage, DocumentsPage, BillingPage, EmailPage, UsersPage, CalendarPage, SettingsPage } from './AdminPages.jsx';
import { ReportsDashboard } from './MarketingPages.jsx';
import { ConflictCheckPage } from './LeadPages.jsx';
import {
  partnerMockKpis,
  partnerMockFirmPerformance,
  partnerMockTeamPerformance,
  partnerMockActivities,
  partnerMockSchedule,
  partnerMockMatters,
} from '../data/partnerData.js';

// ─────────────────────────────────────────────────────────
//  PARTNER DASHBOARD (ENHANCED SENIOR MANAGEMENT VIEW)
// ─────────────────────────────────────────────────────────
export function PartnerDashboard(props) {
  const ctx = useOutletContext() || {};
  const navigate = props.navigate || ctx.navigate;
  return (
    <div className="animate-fade-in space-y-8 relative">
      {/* Background Atmosphere */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0057c7]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#7c3aed]/5 rounded-full blur-[120px] pointer-events-none" />

      <PageHeader 
        title="Partner Management Dashboard" 
        subtitle="Executive oversight of firm revenue, associate productivity, matter realization, and practice performance"
      />

      {/* KPI Cards Grid (8 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {partnerMockKpis.map((kpi) => (
          <StatCard key={kpi.id} label={kpi.label} value={kpi.value} change={kpi.change} />
        ))}
      </div>

      {/* Firm Performance & Practice Area Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Practice Area Breakdown (2 Cols) */}
        <Card className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-800 text-white font-display">Practice Area Revenue & Utilization</h3>
              <p className="text-[12px] text-[#8a94a6]">Real-time financial realization across legal practice groups</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-900 uppercase tracking-widest">
              Realization: {partnerMockFirmPerformance.realizationRate}
            </span>
          </div>

          <div className="space-y-5">
            {partnerMockFirmPerformance.practiceAreas.map((pa) => (
              <div key={pa.area} className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-700 text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                    {pa.area} ({pa.matters} matters)
                  </span>
                  <span className="font-800 text-emerald-400">{pa.revenue} <span className="text-[#8a94a6] text-[11px] font-600">({pa.percentage}%)</span></span>
                </div>
                <ProgressBar progress={pa.percentage} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 text-center">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-[#8a94a6] font-800 uppercase tracking-widest">Avg Matter Duration</p>
              <p className="text-lg font-900 text-white mt-1">{partnerMockFirmPerformance.avgDuration}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-[#8a94a6] font-800 uppercase tracking-widest">Case Success Rate</p>
              <p className="text-lg font-900 text-emerald-400 mt-1">{partnerMockFirmPerformance.successRate}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-[#8a94a6] font-800 uppercase tracking-widest">Realization Rate</p>
              <p className="text-lg font-900 text-[#38bdf8] mt-1">{partnerMockFirmPerformance.realizationRate}</p>
            </div>
          </div>
        </Card>

        {/* Executive Schedule & Deadlines (1 Col) */}
        <Card className="space-y-4">
          <h3 className="text-lg font-800 text-white font-display border-b border-white/5 pb-3">Upcoming Partner Schedule</h3>
          <div className="space-y-3">
            {partnerMockSchedule.map((item) => (
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
            ))}
          </div>
        </Card>
      </div>

      {/* Team Productivity & Utilization Table */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-800 text-white font-display">Associate Team Performance & Utilization</h3>
            <p className="text-[12px] text-[#8a94a6]">Workload allocation and monthly billables overview</p>
          </div>
          <button onClick={() => navigate?.('/partner/team')} className="text-[12px] font-800 text-[#38bdf8] hover:text-white transition-colors">
            Manage Team →
          </button>
        </div>

        <Table headers={['Team Member', 'Role & Department', 'Monthly Billed', 'Logged Hours', 'Utilization %', 'Active Matters', 'Status']}>
          {partnerMockTeamPerformance.map((tm) => (
            <Tr key={tm.id}>
              <Td className="font-700 text-white">
                <div className="flex items-center gap-3">
                  <Avatar initials={tm.name.split(' ').map(n => n[0]).join('').slice(0,2)} size="sm" color="#0057c7" />
                  <div>
                    <div className="text-white font-700">{tm.name}</div>
                    <div className="text-[11px] text-[#8a94a6]">{tm.position}</div>
                  </div>
                </div>
              </Td>
              <Td className="text-[13px] text-purple-300 font-600">{tm.department}</Td>
              <Td className="font-800 text-emerald-400">{tm.billed}</Td>
              <Td className="text-[13px] text-white font-600">{tm.hours}</Td>
              <Td className="min-w-[140px]">
                <div className="flex items-center gap-3">
                  <ProgressBar progress={tm.utilization} />
                  <span className="text-[11px] font-800 text-white">{tm.utilization}%</span>
                </div>
              </Td>
              <Td className="text-[13px] text-white font-700 text-center">{tm.active_matters}</Td>
              <Td><Badge status={tm.status} /></Td>
            </Tr>
          ))}
        </Table>
      </Card>

      {/* Recent Activity Feed */}
      <Card className="space-y-4">
        <h3 className="text-lg font-800 text-white font-display border-b border-white/5 pb-3">Firm Activity Feed</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partnerMockActivities.map((act) => (
            <div key={act.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
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
      </Card>

      {/* Active Firm Matters & Lead Supervision Section */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-800 text-white font-display">Active Firm Matters & Lead Supervision</h3>
            <p className="text-[12px] text-[#8a94a6]">Overview of partner-supervised litigation and transaction matters</p>
          </div>
          <button onClick={() => navigate?.('/partner/firm-matters')} className="text-[12px] font-800 text-[#38bdf8] hover:text-white transition-colors">
            All Firm Matters →
          </button>
        </div>

        <Table headers={['Matter Number', 'Title & Client', 'Practice Area', 'Lead Attorney', 'Associate', 'Est. Value', 'Next Hearing', 'Status']}>
          {partnerMockMatters.map((m) => (
            <Tr key={m.id}>
              <Td className="whitespace-nowrap"><span className="font-mono text-[12px] text-[#38bdf8] font-700">{m.matter_number}</span></Td>
              <Td className="font-700 text-white">
                <div>{m.title}</div>
                <div className="text-[11px] text-[#8a94a6]">{m.client_name}</div>
              </Td>
              <Td className="text-[12px] text-purple-300 font-600">{m.practice_area}</Td>
              <Td className="text-[12px] text-white font-600">{m.lead_attorney}</Td>
              <Td className="text-[12px] text-[#8a94a6]">{m.associate}</Td>
              <Td className="font-800 text-emerald-400">{m.est_value}</Td>
              <Td className="text-[12px] text-[#8a94a6]">{m.next_court_date}</Td>
              <Td><Badge status={m.status} /></Td>
            </Tr>
          ))}
        </Table>
      </Card>
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
  return <CasesPage role="admin" {...ctx} {...props} />;
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
