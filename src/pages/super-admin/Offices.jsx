import { useState, useMemo } from 'react';
import { PageHeader, Table, Tr, Td, Badge, Modal, Field, Input, Select, EmptyState, useToast } from '../../components/UI.jsx';
import { initialOffices, initialAgencies } from '../../data/superAdminData';
import { useLanguage } from '../../context/LanguageContext';

export default function SuperAdminOffices() {
  const { t } = useLanguage();
  const [offices, setOffices] = useState(initialOffices);
  const [searchQuery, setSearchQuery] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [activeModal, setActiveModal] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [formData, setFormData] = useState({ name: '', agencyName: 'Apex Legal Group', location: '', phone: '', manager: '', status: 'active' });

  const { toast } = useToast();

  const filteredOffices = useMemo(() => {
    return offices.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.manager.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAgency = agencyFilter === 'all' || item.agencyName === agencyFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesAgency && matchesStatus;
    });
  }, [offices, searchQuery, agencyFilter, statusFilter]);

  const handleOpenAdd = () => {
    setFormData({ name: '', agencyName: initialAgencies[0]?.name || 'Apex Legal Group', location: '', phone: '', manager: '', status: 'active' });
    setActiveModal('add');
  };

  const handleOpenEdit = (office) => {
    setSelectedOffice(office);
    setFormData({ ...office });
    setActiveModal('edit');
  };

  const handleOpenView = (office) => {
    setSelectedOffice(office);
    setActiveModal('view');
  };

  const handleOpenDelete = (office) => {
    setSelectedOffice(office);
    setActiveModal('delete');
  };

  const handleSaveAdd = () => {
    if (!formData.name || !formData.location) {
      toast(t('provideOfficeNameLocation'), 'error');
      return;
    }
    const newOffice = {
      id: `OFF-${offices.length + 1}`,
      agencyId: 'AG-101',
      agencyName: formData.agencyName,
      name: formData.name,
      location: formData.location,
      phone: formData.phone || '+1 (555) 000-0000',
      manager: formData.manager || 'Unassigned',
      activeMatters: 0,
      status: formData.status,
    };
    setOffices([newOffice, ...offices]);
    setActiveModal(null);
    toast(t('officeAdded') + ` "${formData.name}"!`, 'success');
  };

  const handleSaveEdit = () => {
    setOffices(offices.map(o => o.id === selectedOffice.id ? { ...o, ...formData } : o));
    setActiveModal(null);
    toast(t('officeUpdated') + ` "${formData.name}"!`, 'success');
  };

  const handleDelete = () => {
    setOffices(offices.filter(o => o.id !== selectedOffice.id));
    setActiveModal(null);
    toast(t('officeDeleted') + ` "${selectedOffice.name}"!`, 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title={t('officesManagement')} 
        subtitle={t('manageBranchLocationsManagers')}
      >
        <button 
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-[#0057c7] text-white font-700 text-[14px] hover:bg-[#0057c7]/80 shadow-lg shadow-[#0057c7]/20 flex items-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4" /></svg>
          {t('addOffice')}
        </button>
      </PageHeader>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#1a2233]/40 p-4 rounded-2xl border border-white/5 backdrop-blur-xl">
        <div className="w-full sm:flex-1 min-w-[180px]">
          <Input 
            placeholder={t('searchOfficesPlaceholder')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:w-44">
            <Select value={agencyFilter} onChange={(e) => setAgencyFilter(e.target.value)}>
              <option value="all">{t('allAgencies')}</option>
              {initialAgencies.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </Select>
          </div>
          <div className="flex-1 sm:w-44">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{t('allStatuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="inactive">{t('inactive')}</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {filteredOffices.length === 0 ? (
        <EmptyState 
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" /></svg>}
          title={t('noOfficesFound')} 
          desc={t('noLawOfficesMatchCriteria')} 
        />
      ) : (
        <Table headers={[t('Office Branch') || 'Office Branch', t('parentAgency'), t('location'), t('Branch Manager') || 'Branch Manager', t('activeCases'), t('status'), t('actions') || 'Actions']}>
          {filteredOffices.map((office) => (
            <Tr key={office.id}>
              <Td className="font-700 text-white">
                <div>{office.name}</div>
                <div className="text-[11px] text-[#8a94a6] font-500">{office.id}</div>
              </Td>
              <Td className="text-white font-600">
                {office.agencyName}
              </Td>
              <Td className="text-[13px] text-[#b8c2d1]">
                <div>{office.location}</div>
                <div className="text-[11px] text-[#8a94a6]">{office.phone}</div>
              </Td>
              <Td className="text-white font-600">
                {office.manager}
              </Td>
              <Td className="text-emerald-400 font-800">
                {office.activeMatters} {t('casesSuf')}
              </Td>
              <Td>
                <Badge status={office.status} />
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenView(office)} className="px-3 py-1.5 rounded-lg bg-white/5 text-white hover:bg-white/10 text-[12px] font-700 transition-all">
                    {t('view')}
                  </button>
                  <button onClick={() => handleOpenEdit(office)} className="px-3 py-1.5 rounded-lg bg-[#0057c7]/20 text-[#38bdf8] hover:bg-[#0057c7]/30 text-[12px] font-700 transition-all">
                    {t('edit')}
                  </button>
                  <button onClick={() => handleOpenDelete(office)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[12px] font-700 transition-all">
                    {t('delete')}
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Add Modal */}
      {activeModal === 'add' && (
        <Modal title={t('addOffice')} onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">{t('cancel')}</button>
              <button onClick={handleSaveAdd} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">{t('saveOffice')}</button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label={t('parentAgency') || 'Parent Agency'}>
              <Select value={formData.agencyName} onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}>
                {initialAgencies.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </Select>
            </Field>
            <Field label={t('branchOfficeName') || 'Branch Office Name'} required>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Chicago Branch" />
            </Field>
            <Field label={t('cityLocation') || 'City / Location'} required>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Chicago, IL" />
            </Field>
            <Field label={t('phone') || 'Phone'}>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (312) 555-0144" />
            </Field>
            <Field label={t('managerName') || 'Manager Name'}>
              <Input value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })} placeholder="e.g. Jessica Alba" />
            </Field>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {activeModal === 'edit' && selectedOffice && (
        <Modal title={`${t('editOffice') || 'Edit Office'}: ${selectedOffice.name}`} onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">{t('cancel')}</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">{t('updateOffice')}</button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label={t('branchOfficeName') || 'Branch Office Name'} required>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Field>
            <Field label={t('location') || 'Location'} required>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            </Field>
            <Field label={t('manager') || 'Manager'}>
              <Input value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })} />
            </Field>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {activeModal === 'view' && selectedOffice && (
        <Modal title={`${t('officeDetails')}: ${selectedOffice.name}`} onClose={() => setActiveModal(null)}
          footer={<button onClick={() => setActiveModal(null)} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">{t('close')}</button>}
        >
          <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/5 text-[14px]">
            <div>
              <p className="text-[11px] text-[#8a94a6] uppercase font-700">{t('officeId')}</p>
              <p className="text-white font-800">{selectedOffice.id}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8a94a6] uppercase font-700">{t('parentAgency')}</p>
              <p className="text-white font-600">{selectedOffice.agencyName}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8a94a6] uppercase font-700">{t('location')}</p>
              <p className="text-white font-600">{selectedOffice.location}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8a94a6] uppercase font-700">{t('activeCases')}</p>
              <p className="text-emerald-400 font-800">{selectedOffice.activeMatters} {t('casesSuf')}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {activeModal === 'delete' && selectedOffice && (
        <Modal title={t('confirmDeleteOffice')} onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">{t('cancel')}</button>
              <button onClick={handleDelete} className="px-5 py-2 rounded-xl bg-red-600 text-white text-[13px] font-700">{t('deleteOffice')}</button>
            </>
          }
        >
          <p className="text-[14px] text-[#b8c2d1]">{t('areYouSureDeleteOffice')} <strong className="text-white">{selectedOffice.name}</strong>?</p>
        </Modal>
      )}
    </div>
  );
}
