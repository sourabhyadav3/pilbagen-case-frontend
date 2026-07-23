import { useState, useEffect } from 'react';
import { PageHeader, StatCard, Card, Table, Tr, Td, Badge, EmptyState } from '../../components/UI.jsx';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

export default function SuperAdminDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.superAdmin.getDashboard();
      setData(res.data);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
      setError(e.message || 'Failed to load ecosystem metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white font-display text-lg animate-pulse">{t('loading')}...</div>
      </div>
    );
  }

  const kpis = data?.kpis || { totalAgencies: 0, activeOffices: 0, totalUsers: 0, subscriptionRate: '0.0' };
  const agencies = data?.recentAgencies || [];
  const logs = data?.recentActivities || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title="superAdminDashboard" 
        subtitle={t('platformWideEcosystemMetrics')} 
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-500">
          {error}
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="totalAgencies" 
          value={kpis.totalAgencies} 
          change="+12.5%" 
          icon={<svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard 
          label="activeOffices" 
          value={kpis.activeOffices} 
          change="+8.4%" 
          icon={<svg className="w-6 h-6 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" /></svg>}
        />
        <StatCard 
          label="totalUsers" 
          value={kpis.totalUsers} 
          change="+18.2%" 
          icon={<svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
        />
        <StatCard 
          label="subscriptions" 
          value={`${kpis.subscriptionRate}%`} 
          change={t('percentActiveChange')} 
          icon={<svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        />
      </div>

      {/* Main Grid: Recent Agencies & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Agencies (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-800 text-white font-display">{t('recentRegisteredAgencies')}</h2>
            <span className="text-[12px] text-[#38bdf8] font-700 uppercase tracking-widest cursor-pointer hover:underline">{t('viewAllAgencies')}</span>
          </div>

          <Table headers={['Agency Name', 'Owner / Email', 'Plan', 'Offices / Users', 'Status']}>
            {agencies.map((agency) => (
              <Tr key={agency.id}>
                <Td className="font-700 text-white">
                  <div>{agency.name}</div>
                  <div className="text-[11px] text-[#8a94a6] font-500">AGC-{agency.id}</div>
                </Td>
                <Td>
                  <div className="text-white">{agency.owner}</div>
                  <div className="text-[12px] text-[#8a94a6]">{agency.email}</div>
                </Td>
                <Td>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-800 uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {t(agency.plan)}
                  </span>
                </Td>
                <Td>
                  <div className="text-white font-600">{agency.officesCount || 0} {t('officesSuf')}</div>
                  <div className="text-[12px] text-[#8a94a6]">{agency.usersCount || 0} {t('usersSuf')}</div>
                </Td>
                <Td>
                  <Badge status={agency.status} />
                </Td>
              </Tr>
            ))}
          </Table>
        </div>

        {/* Right Column: System Activity Logs */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-800 text-white font-display">{t('recentSystemActivity')}</h2>
            <span className="text-[12px] text-[#8a94a6] font-700 uppercase tracking-widest">{t('realTime')}</span>
          </div>

          <Card className="space-y-4">
            {logs.length === 0 ? (
              <EmptyState title="noRecentActivity" desc={t('allPlatformLogsSynced')} />
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-700 text-white">{log.actor}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#8a94a6] font-800 uppercase">{t(log.role)}</span>
                    </div>
                    <p className="text-[12.5px] text-[#b8c2d1] font-500">{t(log.action)}</p>
                    <div className="text-[11px] text-[#8a94a6] flex items-center gap-2">
                      <span>{t('module')}: {t(log.module)}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-900 uppercase tracking-wider ${log.severity === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {t(log.severity)}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
