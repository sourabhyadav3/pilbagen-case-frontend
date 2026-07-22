import { useState, useMemo } from 'react';
import { PageHeader, Table, Tr, Td, Badge, Modal, Field, Input, Select, EmptyState, useToast } from '../../components/UI.jsx';
import { initialAgencies } from '../../data/superAdminData';
import { useLanguage } from '../../context/LanguageContext';

export default function SuperAdminAgencies() {
  const { t } = useLanguage();
  const [agencies, setAgencies] = useState(initialAgencies);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'add' | 'edit' | 'view' | 'delete'
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [formData, setFormData] = useState({ name: '', owner: '', email: '', phone: '', plan: 'Professional', status: 'active' });

  const { toast } = useToast();

  const filteredAgencies = useMemo(() => {
    return agencies.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesPlan = planFilter === 'all' || item.plan.toLowerCase() === planFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [agencies, searchQuery, statusFilter, planFilter]);

  const handleOpenAdd = () => {
    setFormData({ name: '', owner: '', email: '', phone: '', plan: 'Professional', status: 'active' });
    setActiveModal('add');
  };

  const handleOpenEdit = (agency) => {
    setSelectedAgency(agency);
    setFormData({ ...agency });
    setActiveModal('edit');
  };

  const handleOpenView = (agency) => {
    setSelectedAgency(agency);
    setActiveModal('view');
  };

  const handleOpenDelete = (agency) => {
    setSelectedAgency(agency);
    setActiveModal('delete');
  };

  const handleSaveAdd = () => {
    if (!formData.name || !formData.owner || !formData.email) {
      toast(t('completeAllRequiredFields'), 'error');
      return;
    }
    const newAgency = {
      id: `AG-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name,
      owner: formData.owner,
      email: formData.email,
      phone: formData.phone || '+1 (555) 000-0000',
      plan: formData.plan,
      officesCount: 1,
      usersCount: 2,
      status: formData.status,
      createdAt: new Date().toISOString().split('T')[0],
      revenue: '$0',
    };
    setAgencies([newAgency, ...agencies]);
    setActiveModal(null);
    toast(t('agencyAdded') + ` "${formData.name}"!`, 'success');
  };

  const handleSaveEdit = () => {
    if (!formData.name || !formData.owner) {
      toast(t('enterValidAgencyDetails'), 'error');
      return;
    }
    setAgencies(agencies.map(a => a.id === selectedAgency.id ? { ...a, ...formData } : a));
    setActiveModal(null);
    toast(t('agencyUpdated') + ` "${formData.name}"!`, 'success');
  };

  const handleDelete = () => {
    setAgencies(agencies.filter(a => a.id !== selectedAgency.id));
    setActiveModal(null);
    toast(t('agencyRemoved') + ` "${selectedAgency.name}"!`, 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title={t('agenciesManagement')} 
        subtitle={t('manageLawFirmAgenciesSubscriptionsOffices')}
      >
        <button 
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-[#0057c7] text-white font-700 text-[14px] hover:bg-[#0057c7]/80 shadow-lg shadow-[#0057c7]/20 flex items-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4" /></svg>
          {t('addAgency')}
        </button>
      </PageHeader>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#1a2233]/40 p-4 rounded-2xl border border-white/5 backdrop-blur-xl">
        <div className="w-full sm:flex-1 min-w-[180px]">
          <Input 
            placeholder={t('searchAgenciesPlaceholder')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:w-44">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{t('allStatuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="inactive">{t('inactive')}</option>
            </Select>
          </div>
          <div className="flex-1 sm:w-44">
            <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
              <option value="all">{t('allPlans')}</option>
              <option value="basic">{t('basic')}</option>
              <option value="professional">{t('professional')}</option>
              <option value="enterprise">{t('enterprise')}</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
          <p className="text-[12px] text-[#8a94a6] font-800 uppercase tracking-widest">{t('loadingAgenciesData')}</p>
        </div>
      ) : filteredAgencies.length === 0 ? (
        <EmptyState 
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          title={t('noAgenciesFound')} 
          desc={t('noLawAgenciesMatchFilter')} 
        />
      ) : (
        <Table headers={[t('Agency Name'), t('Owner Contact'), t('Subscription Plan'), t('Offices / Users'), t('Created Date'), t('status'), t('actions') || 'Actions']}>
          {filteredAgencies.map((agency) => (
            <Tr key={agency.id}>
              <Td className="font-700 text-white">
                <div>{agency.name}</div>
                <div className="text-[11px] text-[#8a94a6] font-500">{agency.id}</div>
              </Td>
              <Td>
                <div className="text-white font-600">{agency.owner}</div>
                <div className="text-[12px] text-[#8a94a6]">{agency.email}</div>
              </Td>
              <Td>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-800 uppercase tracking-wider bg-[#0057c7]/10 text-[#38bdf8] border border-[#0057c7]/20">
                  {t(agency.plan)}
                </span>
              </Td>
              <Td>
                <div className="text-white font-600">{agency.officesCount} {t('officesSuf')}</div>
                <div className="text-[12px] text-[#8a94a6]">{agency.usersCount} {t('usersSuf')}</div>
              </Td>
              <Td className="text-[13px] text-[#8a94a6]">
                {agency.createdAt}
              </Td>
              <Td>
                <Badge status={agency.status} />
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenView(agency)} className="px-3 py-1.5 rounded-lg bg-white/5 text-white hover:bg-white/10 text-[12px] font-700 transition-all">
                    {t('view')}
                  </button>
                  <button onClick={() => handleOpenEdit(agency)} className="px-3 py-1.5 rounded-lg bg-[#0057c7]/20 text-[#38bdf8] hover:bg-[#0057c7]/30 text-[12px] font-700 transition-all">
                    {t('edit')}
                  </button>
                  <button onClick={() => handleOpenDelete(agency)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[12px] font-700 transition-all">
                    {t('delete')}
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* MODALS */}
      {/* Add Agency Modal */}
      {activeModal === 'add' && (
        <Modal 
          title={t('addAgency')} 
          onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">{t('cancel')}</button>
              <button onClick={handleSaveAdd} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">{t('saveAgency')}</button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label={t('Agency Name') || 'Agency Name'} required>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Apex Legal Group" />
            </Field>
            <Field label={t('ownerFullName') || 'Owner Full Name'} required>
              <Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} placeholder="e.g. Robert Vance" />
            </Field>
            <Field label={t('ownerEmail') || 'Owner Email'} required>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="e.g. vance@apexlegal.com" />
            </Field>
            <Field label={t('phoneNumber') || 'Phone Number'}>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('Subscription Plan') || 'Subscription Plan'}>
                <Select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}>
                  <option value="Basic">{t('basic')}</option>
                  <option value="Professional">{t('professional')}</option>
                  <option value="Enterprise">{t('enterprise')}</option>
                </Select>
              </Field>
              <Field label={t('accountStatus') || 'Account Status'}>
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="active">{t('active')}</option>
                  <option value="pending">{t('pending')}</option>
                  <option value="inactive">{t('inactive')}</option>
                </Select>
              </Field>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Agency Modal */}
      {activeModal === 'edit' && (
        <Modal 
          title={`${t('editAgency')}: ${selectedAgency?.name}`} 
          onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">{t('cancel')}</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">{t('saveChanges')}</button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label={t('Agency Name') || 'Agency Name'} required>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Field>
            <Field label={t('ownerFullName') || 'Owner Full Name'} required>
              <Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} />
            </Field>
            <Field label={t('ownerEmail') || 'Owner Email'} required>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('Subscription Plan') || 'Subscription Plan'}>
                <Select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}>
                  <option value="Basic">{t('basic')}</option>
                  <option value="Professional">{t('professional')}</option>
                  <option value="Enterprise">{t('enterprise')}</option>
                </Select>
              </Field>
              <Field label={t('accountStatus') || 'Account Status'}>
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="active">{t('active')}</option>
                  <option value="pending">{t('pending')}</option>
                  <option value="inactive">{t('inactive')}</option>
                </Select>
              </Field>
            </div>
          </div>
        </Modal>
      )}

      {/* View Agency Modal */}
      {activeModal === 'view' && selectedAgency && (
        <Modal 
          title={`${t('agencyOverview')}: ${selectedAgency.name}`} 
          onClose={() => setActiveModal(null)}
          footer={<button onClick={() => setActiveModal(null)} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">{t('close')}</button>}
        >
          <div className="space-y-4 text-[14px]">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-[11px] text-[#8a94a6] uppercase font-700">{t('agencyId')}</p>
                <p className="text-white font-800">{selectedAgency.id}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#8a94a6] uppercase font-700">{t('status')}</p>
                <Badge status={selectedAgency.status} />
              </div>
              <div>
                <p className="text-[11px] text-[#8a94a6] uppercase font-700">{t('owner')}</p>
                <p className="text-white font-600">{selectedAgency.owner}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#8a94a6] uppercase font-700">{t('email')}</p>
                <p className="text-white font-600">{selectedAgency.email}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#8a94a6] uppercase font-700">{t('officesCount')}</p>
                <p className="text-white font-600">{selectedAgency.officesCount} {t('officesSuf')}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#8a94a6] uppercase font-700">{t('totalUsers')}</p>
                <p className="text-white font-600">{selectedAgency.usersCount} {t('usersSuf')}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Agency Modal */}
      {activeModal === 'delete' && selectedAgency && (
        <Modal 
          title={t('confirmDeleteAgency')} 
          onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">{t('cancel')}</button>
              <button onClick={handleDelete} className="px-5 py-2 rounded-xl bg-red-600 text-white text-[13px] font-700">{t('deletePermanently')}</button>
            </>
          }
        >
          <p className="text-[14px] text-[#b8c2d1]">
            {t('areYouSureDeleteAgency')} <strong className="text-white">{selectedAgency.name}</strong>? {t('actionCannotBeUndoneAgency')}
          </p>
        </Modal>
      )}
    </div>
  );
}
