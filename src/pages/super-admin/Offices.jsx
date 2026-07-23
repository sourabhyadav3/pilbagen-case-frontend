import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader, Table, Tr, Td, Badge, Modal, Field, Input, Select, EmptyState, useToast } from '../../components/UI.jsx';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

export default function SuperAdminOffices() {
  const { t } = useLanguage();
  const [offices, setOffices] = useState([]);
  const [agenciesList, setAgenciesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [formData, setFormData] = useState({ name: '', agencyId: '', city: '', status: 'active' });

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [officesRes, agenciesRes] = await Promise.all([
        api.superAdmin.listOffices({ q: searchQuery, status: statusFilter === 'all' ? undefined : statusFilter }),
        api.superAdmin.listAgencies({ limit: 200 })
      ]);
      const list = officesRes.data?.items || officesRes.data || [];
      const agencies = agenciesRes.data?.items || agenciesRes.data || [];
      setAgenciesList(agencies);
      
      const mappedOffices = list.map(o => ({
        id: o.id,
        name: o.name,
        agencyId: o.agency_id,
        agencyName: o.agency?.name || 'Unknown',
        location: o.city,
        phone: '+1 (555) 000-0000',
        manager: 'Unassigned',
        activeMatters: 0,
        status: o.status,
      }));

      // Filter in memory for agency Name if selected
      const filtered = agencyFilter === 'all'
        ? mappedOffices
        : mappedOffices.filter(o => o.agencyName === agencyFilter);

      setOffices(filtered);
    } catch (e) {
      console.error(e);
      toast(t('failedToLoadOffices'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, agencyFilter, statusFilter, t, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setFormData({ name: '', agencyId: agenciesList[0]?.id || '', city: '', status: 'active' });
    setActiveModal('add');
  };

  const handleOpenEdit = (office) => {
    setSelectedOffice(office);
    setFormData({ name: office.name, agencyId: office.agencyId, city: office.location, status: office.status });
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

  const handleSaveAdd = async () => {
    if (!formData.name || !formData.city || !formData.agencyId) {
      toast(t('provideOfficeNameLocation'), 'error');
      return;
    }
    try {
      setIsLoading(true);
      await api.superAdmin.createOffice({
        name: formData.name,
        agency_id: formData.agencyId,
        city: formData.city,
        status: formData.status
      });
      setActiveModal(null);
      toast(t('officeAdded') + ` "${formData.name}"!`, 'success');
      loadData();
    } catch (e) {
      toast(e.message || t('failedToAddOffice'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!formData.name || !formData.city) {
      toast(t('provideOfficeNameLocation'), 'error');
      return;
    }
    try {
      setIsLoading(true);
      await api.superAdmin.updateOffice(selectedOffice.id, {
        name: formData.name,
        agency_id: formData.agencyId,
        city: formData.city,
        status: formData.status
      });
      setActiveModal(null);
      toast(t('officeUpdated') + ` "${formData.name}"!`, 'success');
      loadData();
    } catch (e) {
      toast(e.message || t('failedToUpdateOffice'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await api.superAdmin.deleteOffice(selectedOffice.id);
      setActiveModal(null);
      toast(t('officeDeleted') + ` "${selectedOffice.name}"!`, 'success');
      loadData();
    } catch (e) {
      toast(e.message || t('failedToRemoveOffice'), 'error');
    } finally {
      setIsLoading(false);
    }
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
              {agenciesList.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
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
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
          <p className="text-[12px] text-[#8a94a6] font-800 uppercase tracking-widest">{t('loading')}</p>
        </div>
      ) : offices.length === 0 ? (
        <EmptyState 
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" /></svg>}
          title={t('noOfficesFound')} 
          desc={t('noLawOfficesMatchCriteria')} 
        />
      ) : (
        <Table headers={[t('Office Branch') || 'Office Branch', t('parentAgency'), t('location'), t('Branch Manager') || 'Branch Manager', t('activeCases'), t('status'), t('actions') || 'Actions']}>
          {offices.map((office) => (
            <Tr key={office.id}>
              <Td className="font-700 text-white">
                <div>{office.name}</div>
                <div className="text-[11px] text-[#8a94a6] font-500">OFF-{office.id}</div>
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
              <Select value={formData.agencyId} onChange={(e) => setFormData({ ...formData, agencyId: e.target.value })}>
                {agenciesList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </Field>
            <Field label={t('branchOfficeName') || 'Branch Office Name'} required>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Chicago Branch" />
            </Field>
            <Field label={t('cityLocation') || 'City / Location'} required>
              <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Chicago, IL" />
            </Field>
            <Field label={t('accountStatus') || 'Account Status'}>
              <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </Select>
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
            <Field label={t('parentAgency') || 'Parent Agency'}>
              <Select value={formData.agencyId} onChange={(e) => setFormData({ ...formData, agencyId: e.target.value })}>
                {agenciesList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </Field>
            <Field label={t('branchOfficeName') || 'Branch Office Name'} required>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Field>
            <Field label={t('location') || 'Location'} required>
              <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            </Field>
            <Field label={t('accountStatus') || 'Account Status'}>
              <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </Select>
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
              <p className="text-white font-800">OFF-{selectedOffice.id}</p>
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
