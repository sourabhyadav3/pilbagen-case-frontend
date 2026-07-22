import { useState, useMemo } from 'react';
import { PageHeader, Table, Tr, Td, Modal, Input, Select, EmptyState } from '../../components/UI.jsx';
import { initialActivityLogs } from '../../data/superAdminData';
import { useLanguage } from '../../context/LanguageContext';

export default function SuperAdminActivityLogs() {
  const { t } = useLanguage();
  const [logs] = useState(initialActivityLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  
  const [selectedLog, setSelectedLog] = useState(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.ip.includes(searchQuery);
      const matchesModule = moduleFilter === 'all' || log.module.toLowerCase() === moduleFilter.toLowerCase();
      const matchesSeverity = severityFilter === 'all' || log.severity.toLowerCase() === severityFilter.toLowerCase();
      return matchesSearch && matchesModule && matchesSeverity;
    });
  }, [logs, searchQuery, moduleFilter, severityFilter]);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title={t('activityAuditLogs')} 
        subtitle={t('immutableSecurityAuditTrail')} 
      />

      {/* Filter Toolbar */}
      <div className="flex items-center gap-4 flex-wrap bg-[#1a2233]/40 p-4 rounded-2xl border border-white/5 backdrop-blur-xl">
        <div className="flex-1 min-w-[240px]">
          <Input 
            placeholder={t('searchLogsPlaceholder')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <option value="all">{t('allModules')}</option>
            <option value="settings">{t('settings')}</option>
            <option value="offices">{t('offices')}</option>
            <option value="subscriptions">{t('subscriptions')}</option>
            <option value="system">{t('system')}</option>
            <option value="security">{t('security')}</option>
          </Select>
        </div>
        <div className="w-48">
          <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="all">{t('allSeverities')}</option>
            <option value="low">{t('low')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="high">{t('high')}</option>
          </Select>
        </div>
      </div>

      {/* Log Table */}
      {filteredLogs.length === 0 ? (
        <EmptyState 
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title={t('noLogsFound')} 
          desc={t('noAuditLogsMatchCriteria')} 
        />
      ) : (
        <Table headers={[t('Log ID') || 'Log ID', t('timestamp'), t('Actor Name') || 'Actor Name', t('Action Executed') || 'Action Executed', t('module'), t('IP Address') || 'IP Address', t('severity'), t('details') || 'Details']}>
          {filteredLogs.map((log) => (
            <Tr key={log.id}>
              <Td className="font-700 text-white">{log.id}</Td>
              <Td className="text-[12px] text-[#8a94a6] whitespace-nowrap">{log.timestamp}</Td>
              <Td>
                <div className="text-white font-600">{log.actor}</div>
                <div className="text-[11px] text-[#8a94a6]">{t(log.role)}</div>
              </Td>
              <Td className="text-[13.5px] text-[#b8c2d1] font-500 max-w-xs truncate">{t(log.action)}</Td>
              <Td className="text-[12px] text-purple-300 font-700">{t(log.module)}</Td>
              <Td className="text-[12px] text-[#8a94a6] font-mono">{log.ip}</Td>
              <Td>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-900 uppercase tracking-widest ${log.severity === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : log.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {t(log.severity)}
                </span>
              </Td>
              <Td>
                <button onClick={() => setSelectedLog(log)} className="px-3 py-1.5 rounded-lg bg-white/5 text-white hover:bg-white/10 text-[12px] font-700 transition-all">
                  {t('viewLog')}
                </button>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <Modal title={`${t('logEntry') || 'Log Entry'}: ${selectedLog.id}`} onClose={() => setSelectedLog(null)}
          footer={<button onClick={() => setSelectedLog(null)} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">{t('close')}</button>}
        >
          <div className="space-y-4 text-[14px]">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3 font-mono text-[13px]">
              <div><span className="text-[#8a94a6]">{t('timestamp')}:</span> <span className="text-white">{selectedLog.timestamp}</span></div>
              <div><span className="text-[#8a94a6]">{t('actor')}:</span> <span className="text-white">{selectedLog.actor} ({t(selectedLog.role)})</span></div>
              <div><span className="text-[#8a94a6]">{t('action')}:</span> <span className="text-emerald-400">{t(selectedLog.action)}</span></div>
              <div><span className="text-[#8a94a6]">{t('module')}:</span> <span className="text-purple-300">{t(selectedLog.module)}</span></div>
              <div><span className="text-[#8a94a6]">{t('ipAddress')}:</span> <span className="text-white">{selectedLog.ip}</span></div>
              <div><span className="text-[#8a94a6]">{t('severity')}:</span> <span className="text-amber-400">{t(selectedLog.severity).toUpperCase()}</span></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
