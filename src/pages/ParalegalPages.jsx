import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PageHeader, StatCard, Card, Table, Tr, Td, Badge, Avatar } from '../components/UI.jsx';
import { LawyerCasesPage, LawyerProfilePage } from './LawyerPages.jsx';
import { DocumentsPage, BillingPage, EmailPage, CalendarPage, SettingsPage } from './AdminPages.jsx';
import { ConflictCheckPage } from './LeadPages.jsx';
import api from '../services/api.js';

// ─────────────────────────────────────────────────────────
//  PARALEGAL DASHBOARD
// ─────────────────────────────────────────────────────────
export function ParalegalDashboard({ navigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    kpis: [],
    tasks: [],
    schedule: [],
    documents: [],
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.dashboard.paralegal();
      if (res?.success && res?.data) {
        setDashboardData({
          kpis: res.data.kpis || [],
          tasks: res.data.tasks || [],
          schedule: res.data.schedule || [],
          documents: res.data.documents || [],
        });
      } else {
        throw new Error(res?.message || 'Failed to load paralegal dashboard');
      }
    } catch (err) {
      console.error('Paralegal Dashboard Error:', err);
      setError(err.message || 'Unable to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-600 text-slate-400">Loading Paralegal Workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-4 max-w-xl mx-auto my-12">
        <h3 className="text-lg font-700 text-red-400">Dashboard Unavailable</h3>
        <p className="text-sm text-slate-300">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-700 hover:bg-red-500/30 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 relative">
      {/* Background Atmosphere */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#14b8a6]/5 rounded-full blur-[120px] pointer-events-none" />

      <PageHeader 
        title="Paralegal Workspace" 
        subtitle="Case management support, document drafting, filing deadlines, and task execution"
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {dashboardData.kpis.map((kpi) => (
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

          {dashboardData.tasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8a94a6]">No pending legal tasks assigned.</div>
          ) : (
            <Table headers={['Task', 'Matter', 'Assigned By', 'Due Date', 'Priority', 'Status']}>
              {dashboardData.tasks.map((t) => (
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
          )}
        </Card>

        {/* Filing Deadlines & Hearings (1 Col) */}
        <Card className="space-y-4">
          <h3 className="text-lg font-800 text-white font-display border-b border-white/5 pb-3">Dockets & Deadlines</h3>
          {dashboardData.schedule.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8a94a6]">No upcoming court dockets or deadlines.</div>
          ) : (
            <div className="space-y-3">
              {dashboardData.schedule.map((item) => (
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
          )}
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

        {dashboardData.documents.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8a94a6]">No active draft documents.</div>
        ) : (
          <Table headers={['Document Title', 'Category', 'File Size', 'Last Updated', 'Status']}>
            {dashboardData.documents.map((doc) => (
              <Tr key={doc.id}>
                <Td className="font-700 text-white">{doc.title}</Td>
                <Td className="text-[12px] text-teal-300 font-600">{doc.category}</Td>
                <Td className="text-[12px] text-[#8a94a6]">{doc.size}</Td>
                <Td className="text-[12px] text-[#8a94a6]">{doc.updated_at}</Td>
                <Td><Badge status={doc.status} /></Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  PARALEGAL TASKS PAGE
// ─────────────────────────────────────────────────────────
export function ParalegalTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.tasks.list();
      const rawTasks = Array.isArray(res?.data) ? res.data : (res?.data?.tasks || []);
      setTasks(rawTasks);
    } catch (err) {
      console.error('Fetch Paralegal Tasks Error:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleStatus = async (taskId, currentStatus) => {
    try {
      if (currentStatus === 'completed') {
        await api.tasks.reopen(taskId);
      } else {
        await api.tasks.complete(taskId);
      }
      fetchTasks();
    } catch (err) {
      console.error('Toggle Task Error:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Paralegal Task Center" 
        subtitle="Manage assigned case tasks, pleading drafts, discovery indexing, and filing deadlines"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['all', 'pending', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-700 capitalize transition-all ${filter === f ? 'bg-[#14b8a6] text-white' : 'bg-white/5 text-[#8a94a6] hover:bg-white/10'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
          <p className="text-xs text-red-300">{error}</p>
          <button onClick={fetchTasks} className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-xs font-700">
            Retry
          </button>
        </div>
      ) : (
        <Card className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8a94a6]">No tasks found.</div>
          ) : (
            <Table headers={['Task Title', 'Associated Matter', 'Assigned By', 'Due Date', 'Priority', 'Status', 'Action']}>
              {filteredTasks.map((t) => (
                <Tr key={t.id}>
                  <Td className="font-700 text-white">{t.title}</Td>
                  <Td className="text-[12px] text-[#38bdf8] font-600">
                    {t.matter?.title || t.matter?.matter_number || 'General'}
                  </Td>
                  <Td className="text-[12px] text-white/80">{t.created_by?.full_name || 'Legal Admin'}</Td>
                  <Td className="text-[12px] text-[#8a94a6]">
                    {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No Due Date'}
                  </Td>
                  <Td>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-800 uppercase ${(t.priority || '').toLowerCase() === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : (t.priority || '').toLowerCase() === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                      {t.priority || 'Medium'}
                    </span>
                  </Td>
                  <Td><Badge status={t.status || 'open'} /></Td>
                  <Td>
                    <button
                      onClick={() => handleToggleStatus(t.id, t.status)}
                      className="px-2.5 py-1 rounded text-[10px] font-700 bg-white/5 hover:bg-white/10 text-white transition-all"
                    >
                      {t.status === 'completed' ? 'Reopen' : 'Complete'}
                    </button>
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      )}
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

export function ParalegalSettings(props) {
  const ctx = useOutletContext() || {};
  return <LawyerProfilePage role="paralegal" {...ctx} {...props} />;
}
