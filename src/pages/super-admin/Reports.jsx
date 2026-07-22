import { useState } from 'react';
import { PageHeader, StatCard, Card, Table, Tr, Td, ProgressBar, useToast } from '../../components/UI.jsx';
import { useLanguage } from '../../context/LanguageContext';

export default function SuperAdminReports() {
  const { t } = useLanguage();
  const [timeframe, setTimeframe] = useState('30days');
  const { toast } = useToast();

  const handleExport = (reportType) => {
    toast(t('exportingReportAsCSV') + ` "${reportType}"...`, 'info');
    setTimeout(() => {
      toast(`${reportType} ` + t('reportDownloaded'), 'success');
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title={t('platformAnalyticsReports')} 
        subtitle={t('globalPlatformUtilizationMetrics')} 
      >
        <div className="flex items-center gap-3">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[13px] font-700 outline-none"
          >
            <option value="7days">{t('last7Days')}</option>
            <option value="30days">{t('last30Days')}</option>
            <option value="90days">{t('last90Days')}</option>
            <option value="1year">{t('thisYear')}</option>
          </select>

          <button 
            onClick={() => handleExport('Platform Comprehensive')}
            className="px-4 py-2 rounded-xl bg-[#0057c7] text-white font-700 text-[13px] hover:bg-[#0057c7]/80 flex items-center gap-2 transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {t('exportReport')}
          </button>
        </div>
      </PageHeader>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="totalPlatformMRR" value="$52,850" change="+14.2%" icon={<svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="activeCasesManaged" value="1,842" change="+9.5%" icon={<svg className="w-6 h-6 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
        <StatCard label="platformUptime" value="99.98%" change="Optimal" icon={<svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="averageAgencyRetention" value="96.4%" change="+2.1%" icon={<svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
      </div>

      {/* Visual Performance Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-800 text-white font-display">{t('revenueTiersBreakdown')}</h3>
            <span className="text-[12px] text-[#8a94a6] font-600">{t('distribution')}</span>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-[13px] font-700 mb-1.5">
                <span className="text-white">{t('enterprisePlanRevenue')} ($38,974)</span>
                <span className="text-[#38bdf8]">73.7%</span>
              </div>
              <ProgressBar pct={73.7} color="bg-purple-500" />
            </div>

            <div>
              <div className="flex justify-between text-[13px] font-700 mb-1.5">
                <span className="text-white">{t('professionalPlanRevenue')} ($11,184)</span>
                <span className="text-[#38bdf8]">21.2%</span>
              </div>
              <ProgressBar pct={21.2} color="bg-[#0057c7]" />
            </div>

            <div>
              <div className="flex justify-between text-[13px] font-700 mb-1.5">
                <span className="text-white">{t('basicPlanRevenue')} ($2,692)</span>
                <span className="text-[#38bdf8]">5.1%</span>
              </div>
              <ProgressBar pct={5.1} color="bg-emerald-500" />
            </div>
          </div>
        </Card>

        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-800 text-white font-display">{t('regionalUsageCapacity')}</h3>
            <span className="text-[12px] text-[#8a94a6] font-600">{t('storageAPI')}</span>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-[13px] font-700 mb-1.5">
                <span className="text-white">{t('eastCoastUSNodes')} (8.4 TB / 10 TB)</span>
                <span className="text-emerald-400">84%</span>
              </div>
              <ProgressBar pct={84} color="bg-emerald-500" />
            </div>

            <div>
              <div className="flex justify-between text-[13px] font-700 mb-1.5">
                <span className="text-white">{t('centralUSNodes')} (4.1 TB / 10 TB)</span>
                <span className="text-emerald-400">41%</span>
              </div>
              <ProgressBar pct={41} color="bg-[#0057c7]" />
            </div>

            <div>
              <div className="flex justify-between text-[13px] font-700 mb-1.5">
                <span className="text-white">{t('westCoastUSNodes')} (2.9 TB / 10 TB)</span>
                <span className="text-emerald-400">29%</span>
              </div>
              <ProgressBar pct={29} color="bg-indigo-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Reports Data Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-800 text-white font-display">{t('systemAuditUtilizationSummary')}</h3>
        <Table headers={[t('Report Name') || 'Report Name', t('module'), t('Generated Period') || 'Generated Period', t('Record Count') || 'Record Count', t('File Size') || 'File Size', t('actions') || 'Actions']}>
          {[
            { name: 'Monthly Financial Audit', module: 'Subscriptions', period: 'July 2026', count: '142 Txns', size: '2.4 MB' },
            { name: 'Agency Usage & Active Matters', module: 'Agencies', period: 'July 2026', count: '6 Agencies', size: '1.1 MB' },
            { name: 'User Authentication & Logins', module: 'Security', period: 'July 2026', count: '482 Events', size: '3.8 MB' },
            { name: 'System Performance & Latency', module: 'Infrastructure', period: 'July 2026', count: '1.2k Metrics', size: '5.6 MB' },
          ].map((rpt, i) => (
            <Tr key={i}>
              <Td className="font-700 text-white">{t(rpt.name)}</Td>
              <Td className="text-[13px] text-[#b8c2d1]">{t(rpt.module)}</Td>
              <Td className="text-[13px] text-[#8a94a6]">{rpt.period}</Td>
              <Td className="text-emerald-400 font-700">{rpt.count}</Td>
              <Td className="text-[12px] text-[#8a94a6]">{rpt.size}</Td>
              <Td>
                <button 
                  onClick={() => handleExport(rpt.name)} 
                  className="px-3 py-1.5 rounded-lg bg-[#0057c7]/20 text-[#38bdf8] hover:bg-[#0057c7]/30 text-[12px] font-700 transition-all"
                >
                  {t('downloadCSV')}
                </button>
              </Td>
            </Tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
