import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { PageHeader, StatCard, Card, Table, Tr, Td, Badge, Avatar } from '../components/UI.jsx';
import { LawyerCasesPage } from './LawyerPages.jsx';
import { DocumentsPage, BillingPage, EmailPage, CalendarPage, SettingsPage } from './AdminPages.jsx';
import { ConflictCheckPage } from './LeadPages.jsx';
import {
  paralegalMockKpis,
  paralegalMockTasks,
  paralegalMockSchedule,
  paralegalMockDocuments,
  paralegalMockTimeEntries,
} from '../data/paralegalData.js';

// ─────────────────────────────────────────────────────────
//  PARALEGAL DASHBOARD
// ─────────────────────────────────────────────────────────
export function ParalegalDashboard({ navigate }) {
  return (
    <div className="animate-fade-in space-y-8 relative">
      {/* Background Atmosphere */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#14b8a6]/5 rounded-full blur-[120px] pointer-events-none" />

      <PageHeader 
        title="Paralegal Workspace" 
        subtitle="Case management support, document drafting, filing deadlines, and task execution"
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {paralegalMockKpis.map((kpi) => (
          <StatCard key={kpi.id} label={kpi.label} value={kpi.value} change={kpi.change} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Priority Pending Tasks (2 Cols) */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-800 text-white font-display">Assigned Legal Tasks</h3>
              <p className="text-[12px] text-[#8a94a6]">Work items delegated by lead attorneys</p>
            </div>
            <button onClick={() => navigate?.('/paralegal/tasks')} className="text-[12px] font-800 text-[#14b8a6] hover:text-white transition-colors">
              All Tasks →
            </button>
          </div>

          <Table headers={['Task', 'Matter', 'Assigned By', 'Due Date', 'Priority', 'Status']}>
            {paralegalMockTasks.map((t) => (
              <Tr key={t.id}>
                <Td className="font-700 text-white max-w-[200px] truncate">{t.title}</Td>
                <Td className="text-[12px] text-[#38bdf8] font-600">{t.matter}</Td>
                <Td className="text-[12px] text-white/80">{t.assignedBy}</Td>
                <Td className="text-[12px] text-[#8a94a6]">{t.dueDate}</Td>
                <Td>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-800 uppercase ${t.priority === 'Urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : t.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                    {t.priority}
                  </span>
                </Td>
                <Td><Badge status={t.status} /></Td>
              </Tr>
            ))}
          </Table>
        </Card>

        {/* Filing Deadlines & Hearings (1 Col) */}
        <Card className="space-y-4">
          <h3 className="text-lg font-800 text-white font-display border-b border-white/5 pb-3">Dockets & Deadlines</h3>
          <div className="space-y-3">
            {paralegalMockSchedule.map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 hover:bg-white/[0.04] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-900 text-[#14b8a6] uppercase tracking-wider">{item.time} • {item.date}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-800 uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {item.type}
                  </span>
                </div>
                <p className="text-[13px] font-700 text-white line-clamp-1">{item.title}</p>
                <p className="text-[11px] text-[#8a94a6]">{item.location}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Draft Documents Pending Review */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-800 text-white font-display">Draft Pleadings & Filings</h3>
            <p className="text-[12px] text-[#8a94a6]">Work-in-progress case documents and evidence binders</p>
          </div>
          <button onClick={() => navigate?.('/paralegal/documents')} className="text-[12px] font-800 text-[#14b8a6] hover:text-white transition-colors">
            View Vault →
          </button>
        </div>

        <Table headers={['Document Title', 'Category', 'File Size', 'Last Updated', 'Status']}>
          {paralegalMockDocuments.map((doc) => (
            <Tr key={doc.id}>
              <Td className="font-700 text-white">{doc.title}</Td>
              <Td className="text-[12px] text-teal-300 font-600">{doc.category}</Td>
              <Td className="text-[12px] text-[#8a94a6]">{doc.size}</Td>
              <Td className="text-[12px] text-[#8a94a6]">{doc.updated_at}</Td>
              <Td><Badge status={doc.status} /></Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  PARALEGAL TASKS PAGE
// ─────────────────────────────────────────────────────────
export function ParalegalTasks() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Paralegal Task Center" 
        subtitle="Manage assigned case tasks, pleading drafts, discovery indexing, and filing deadlines"
      />

      <Card className="space-y-4">
        <Table headers={['Task Title', 'Associated Matter', 'Assigned By', 'Due Date', 'Priority', 'Status']}>
          {paralegalMockTasks.map((t) => (
            <Tr key={t.id}>
              <Td className="font-700 text-white">{t.title}</Td>
              <Td className="text-[12px] text-[#38bdf8] font-600">{t.matter}</Td>
              <Td className="text-[12px] text-white/80">{t.assignedBy}</Td>
              <Td className="text-[12px] text-[#8a94a6]">{t.dueDate}</Td>
              <Td>
                <span className={`px-2 py-0.5 rounded text-[10px] font-800 uppercase ${t.priority === 'Urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : t.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                  {t.priority}
                </span>
              </Td>
              <Td><Badge status={t.status} /></Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  PARALEGAL WRAPPER COMPONENTS
// ─────────────────────────────────────────────────────────
export function ParalegalMyMatters(props) {
  const ctx = useOutletContext() || {};
  return <LawyerCasesPage role="lawyer" {...ctx} {...props} />;
}

export function ParalegalCalendar(props) {
  const ctx = useOutletContext() || {};
  return <CalendarPage role="lawyer" {...ctx} {...props} />;
}

export function ParalegalDocuments(props) {
  const ctx = useOutletContext() || {};
  return <DocumentsPage role="lawyer" {...ctx} {...props} />;
}

export function ParalegalTimeEntries(props) {
  const ctx = useOutletContext() || {};
  return <BillingPage role="lawyer" {...ctx} {...props} />;
}

export function ParalegalCommunications(props) {
  const ctx = useOutletContext() || {};
  return <EmailPage role="lawyer" {...ctx} {...props} />;
}

export function ParalegalConflictCheck(props) {
  const ctx = useOutletContext() || {};
  return <ConflictCheckPage role="paralegal" {...ctx} {...props} />;
}

import { LawyerProfilePage } from './LawyerPages.jsx';

export function ParalegalSettings(props) {
  const ctx = useOutletContext() || {};
  return <LawyerProfilePage role="paralegal" {...ctx} {...props} />;
}
