import { useState, useEffect } from 'react';
import { PageHeader, StatCard, Card, Table, Tr, Td, Badge, Modal, Field, Input, Select, EmptyState, useToast } from '../../components/UI.jsx';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api.js';

export function AdminBackOfficePage() {
  const { t } = useLanguage();
  const [vendors, setVendors] = useState([]);
  const [offices, setOffices] = useState([]);
  const [metrics, setMetrics] = useState({
    monthlyExpenses: '$0',
    locationsCount: '0 Locations',
    staffCount: '0 Staff',
    overhead: '0%'
  });
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: 'Legal Database', monthlyCost: '', contact: '' });
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.backOffice.get();
      if (res && res.data) {
        setVendors(res.data.vendors || []);
        setOffices(res.data.offices || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (e) {
      console.error('Failed to load back office data:', e);
      toast(e.message || 'Failed to load Back Office data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ name: '', category: 'Legal Database', monthlyCost: '', contact: '' });
    setActiveModal('add');
  };

  const handleSaveAdd = async () => {
    if (!formData.name || !formData.monthlyCost) {
      toast(t('enterVendorNameCost') || 'Please enter vendor name and monthly cost', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.backOffice.addVendor(formData);
      if (res && res.data) {
        toast((t('vendor') || 'Vendor') + ` "${formData.name}" ` + (t('addedToBackOffice') || 'added to Back Office'), 'success');
        setActiveModal(null);
        await loadData();
      }
    } catch (err) {
      toast(err.message || 'Failed to add vendor contract', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title={t('agencyBackOfficeManagement')} 
        subtitle={t('manageOfficeInfraDesc')} 
      >
        <button 
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-[#0057c7] text-white font-700 text-[14px] hover:bg-[#0057c7]/80 shadow-lg shadow-[#0057c7]/20 flex items-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4" /></svg>
          {t('addVendorAgreement')}
        </button>
      </PageHeader>

      {/* Operational Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="monthlyVendorExpenses" value={metrics.monthlyExpenses} change="Monthly" icon={<svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="activeBranchOffices" value={metrics.locationsCount} change="Active" icon={<svg className="w-6 h-6 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" /></svg>} />
        <StatCard label="activeStaffMembers" value={metrics.staffCount} change="Agency Staff" icon={<svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>} />
        <StatCard label="operationalOverhead" value={metrics.overhead} change="Est. Overhead" icon={<svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 012 2h2a2 2 0 012-2" /></svg>} />
      </div>

      {/* Office Locations & Vendor Agreements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Office Locations Card */}
        <Card className="space-y-4">
          <h3 className="text-lg font-800 text-white font-display border-b border-white/5 pb-3">{t('officeLocations')}</h3>
          <div className="space-y-3">
            {offices.length > 0 ? (
              offices.map((office) => (
                <div key={office.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-700">{office.name}</span>
                    <Badge status={office.status || 'active'} />
                  </div>
                  <p className="text-[12px] text-[#8a94a6]">{office.address}</p>
                  <p className="text-[11px] text-[#38bdf8] font-700">{office.staffCount} {t('staffMembers') || 'staff members'} • {office.mattersCount} {t('activeMatters') || 'active matters'}</p>
                </div>
              ))
            ) : (
              <EmptyState title="No office locations" description="No office locations created for this agency." />
            )}
          </div>
        </Card>

        {/* Vendor Agreements Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-800 text-white font-display">{t('activeVendorContracts')}</h3>
          {vendors.length > 0 ? (
            <Table headers={[t('Vendor Name') || 'Vendor Name', t('Category') || 'Category', t('Monthly Fee') || 'Monthly Fee', t('Contact') || 'Contact', t('status') || 'Status']}>
              {vendors.map((vendor) => (
                <Tr key={vendor.id}>
                  <Td className="font-700 text-white">
                    <div>{vendor.name}</div>
                    <div className="text-[11px] text-[#8a94a6]">{vendor.id}</div>
                  </Td>
                  <Td className="text-[13px] text-purple-300 font-600">
                    {t(vendor.category) || vendor.category}
                  </Td>
                  <Td className="font-800 text-emerald-400">
                    {vendor.monthlyCost}
                  </Td>
                  <Td className="text-[12px] text-[#8a94a6]">
                    {vendor.contact}
                  </Td>
                  <Td>
                    <Badge status={vendor.status || 'active'} />
                  </Td>
                </Tr>
              ))}
            </Table>
          ) : (
            <EmptyState 
              title="No Vendor Contracts Added" 
              description="No active vendor agreements for this agency. Click 'Add Vendor Agreement' above to add your first contract." 
              action={
                <button onClick={handleOpenAdd} className="px-4 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">
                  {t('addVendorAgreement') || 'Add Vendor Agreement'}
                </button>
              }
            />
          )}
        </div>
      </div>

      {/* Add Vendor Modal */}
      {activeModal === 'add' && (
        <Modal title={t('addVendorContract')} onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} disabled={submitting} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">{t('cancel')}</button>
              <button onClick={handleSaveAdd} disabled={submitting} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">
                {submitting ? 'Saving...' : t('saveContract')}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label={t('vendorSoftwareName')} required>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Westlaw Research" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('serviceCategory')}>
                <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  <option value="Legal Database">{t('Legal Database')}</option>
                  <option value="E-Signature">{t('E-Signature')}</option>
                  <option value="Communications">{t('Communications')}</option>
                  <option value="Stenography Services">{t('Stenography Services')}</option>
                  <option value="IT & Security">{t('IT & Security')}</option>
                </Select>
              </Field>
              <Field label={t('monthlyRecurringFee')} required>
                <Input value={formData.monthlyCost} onChange={(e) => setFormData({ ...formData, monthlyCost: e.target.value })} placeholder="e.g. $1,250" />
              </Field>
            </div>
            <Field label={t('vendorSupportContact')}>
              <Input type="email" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="support@vendor.com" />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
