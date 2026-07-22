import { useState, useMemo } from 'react';
import { PageHeader, Table, Tr, Td, Badge, Modal, Field, Input, Select, EmptyState, useToast } from '../../components/UI.jsx';

const initialParties = [
  { id: 'PTY-101', name: 'Emily Carter', partyType: 'Plaintiff', matter: 'MAT-2026-001 (Civil Litigation)', contact: 'emily.carter@gmail.com', phone: '+1 (555) 234-5678', counsel: 'Alex Parker, Esq.', status: 'active' },
  { id: 'PTY-102', name: 'Global Logistics Corp', partyType: 'Defendant', matter: 'MAT-2026-002 (Breach of Contract)', contact: 'legal@globallogistics.com', phone: '+1 (555) 876-5432', counsel: 'Vance & Associates', status: 'active' },
  { id: 'PTY-103', name: 'Dr. Michael Chen', partyType: 'Expert Witness', matter: 'MAT-2026-001 (Civil Litigation)', contact: 'm.chen@medexpert.org', phone: '+1 (555) 345-6789', counsel: 'Independent', status: 'active' },
  { id: 'PTY-104', name: 'Sarah Jenkins', partyType: 'Co-Counsel', matter: 'MAT-2026-003 (IP Defense)', contact: 'sjenkins@beaconlaw.com', phone: '+1 (555) 987-6543', counsel: 'Beacon Civil Litigation', status: 'active' },
  { id: 'PTY-105', name: 'David Sterling', partyType: 'Witness', matter: 'MAT-2026-002 (Breach of Contract)', contact: 'dsterling@vanguard.com', phone: '+1 (555) 654-3210', counsel: 'N/A', status: 'inactive' },
];

export function AdminPartiesPage() {
  const [parties, setParties] = useState(initialParties);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [activeModal, setActiveModal] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [formData, setFormData] = useState({ name: '', partyType: 'Plaintiff', matter: 'MAT-2026-001', contact: '', phone: '', counsel: '', status: 'active' });

  const { toast } = useToast();

  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.matter.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || p.partyType.toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [parties, searchQuery, typeFilter]);

  const handleOpenAdd = () => {
    setFormData({ name: '', partyType: 'Plaintiff', matter: 'MAT-2026-001 (Civil Litigation)', contact: '', phone: '', counsel: '', status: 'active' });
    setActiveModal('add');
  };

  const handleOpenEdit = (party) => {
    setSelectedParty(party);
    setFormData({ ...party });
    setActiveModal('edit');
  };

  const handleOpenView = (party) => {
    setSelectedParty(party);
    setActiveModal('view');
  };

  const handleOpenDelete = (party) => {
    setSelectedParty(party);
    setActiveModal('delete');
  };

  const handleSaveAdd = () => {
    if (!formData.name || !formData.contact) {
      toast('Please enter party name and contact email.', 'error');
      return;
    }
    const newParty = {
      id: `PTY-${parties.length + 101}`,
      name: formData.name,
      partyType: formData.partyType,
      matter: formData.matter,
      contact: formData.contact,
      phone: formData.phone || '+1 (555) 000-0000',
      counsel: formData.counsel || 'Unassigned',
      status: formData.status,
    };
    setParties([newParty, ...parties]);
    setActiveModal(null);
    toast(`Party "${formData.name}" added successfully!`, 'success');
  };

  const handleSaveEdit = () => {
    setParties(parties.map(p => p.id === selectedParty.id ? { ...p, ...formData } : p));
    setActiveModal(null);
    toast(`Party "${formData.name}" updated!`, 'success');
  };

  const handleDelete = () => {
    setParties(parties.filter(p => p.id !== selectedParty.id));
    setActiveModal(null);
    toast(`Party "${selectedParty.name}" removed!`, 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title="Case Parties Directory" 
        subtitle="Manage all involved plaintiffs, defendants, co-counsels, expert witnesses, and key case entities" 
      >
        <button 
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-[#0057c7] text-white font-700 text-[14px] hover:bg-[#0057c7]/80 shadow-lg shadow-[#0057c7]/20 flex items-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4" /></svg>
          Add New Party
        </button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 flex-wrap bg-[#1a2233]/40 p-4 rounded-2xl border border-white/5 backdrop-blur-xl">
        <div className="flex-1 min-w-[240px]">
          <Input 
            placeholder="Search parties by name, email, or associated matter..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-56">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Party Roles</option>
            <option value="plaintiff">Plaintiff</option>
            <option value="defendant">Defendant</option>
            <option value="expert witness">Expert Witness</option>
            <option value="co-counsel">Co-Counsel</option>
            <option value="witness">Witness</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filteredParties.length === 0 ? (
        <EmptyState 
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          title="No Case Parties Found" 
          desc="No registered case parties match your search query." 
        />
      ) : (
        <Table headers={['Party Name', 'Party Type', 'Associated Matter', 'Contact Email / Phone', 'Counsel', 'Status', 'Actions']}>
          {filteredParties.map((party) => (
            <Tr key={party.id}>
              <Td className="font-700 text-white">
                <div>{party.name}</div>
                <div className="text-[11px] text-[#8a94a6] font-500">{party.id}</div>
              </Td>
              <Td>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-800 uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {party.partyType}
                </span>
              </Td>
              <Td className="text-white font-600">
                {party.matter}
              </Td>
              <Td className="text-[13px] text-[#b8c2d1]">
                <div>{party.contact}</div>
                <div className="text-[11px] text-[#8a94a6]">{party.phone}</div>
              </Td>
              <Td className="text-[13px] text-[#8a94a6]">
                {party.counsel}
              </Td>
              <Td>
                <Badge status={party.status} />
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenView(party)} className="px-3 py-1.5 rounded-lg bg-white/5 text-white hover:bg-white/10 text-[12px] font-700 transition-all">
                    View
                  </button>
                  <button onClick={() => handleOpenEdit(party)} className="px-3 py-1.5 rounded-lg bg-[#0057c7]/20 text-[#38bdf8] hover:bg-[#0057c7]/30 text-[12px] font-700 transition-all">
                    Edit
                  </button>
                  <button onClick={() => handleOpenDelete(party)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[12px] font-700 transition-all">
                    Delete
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Modals */}
      {activeModal === 'add' && (
        <Modal title="Add New Case Party" onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">Cancel</button>
              <button onClick={handleSaveAdd} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">Save Party</button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Party Full Name / Entity" required>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Global Logistics Corp" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Party Role Type">
                <Select value={formData.partyType} onChange={(e) => setFormData({ ...formData, partyType: e.target.value })}>
                  <option value="Plaintiff">Plaintiff</option>
                  <option value="Defendant">Defendant</option>
                  <option value="Expert Witness">Expert Witness</option>
                  <option value="Co-Counsel">Co-Counsel</option>
                  <option value="Witness">Witness</option>
                </Select>
              </Field>
              <Field label="Associated Matter">
                <Input value={formData.matter} onChange={(e) => setFormData({ ...formData, matter: e.target.value })} />
              </Field>
            </div>
            <Field label="Contact Email" required>
              <Input type="email" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="email@domain.com" />
            </Field>
            <Field label="Phone">
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
            </Field>
          </div>
        </Modal>
      )}

      {activeModal === 'edit' && selectedParty && (
        <Modal title={`Edit Party - ${selectedParty.name}`} onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">Cancel</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">Update Party</button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Party Name" required>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Field>
            <Field label="Contact Email" required>
              <Input type="email" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
            </Field>
          </div>
        </Modal>
      )}

      {activeModal === 'view' && selectedParty && (
        <Modal title={`Party Profile - ${selectedParty.name}`} onClose={() => setActiveModal(null)}
          footer={<button onClick={() => setActiveModal(null)} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">Close</button>}
        >
          <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/5 text-[14px]">
            <div><p className="text-[11px] text-[#8a94a6] uppercase font-700">Party ID</p><p className="text-white font-800">{selectedParty.id}</p></div>
            <div><p className="text-[11px] text-[#8a94a6] uppercase font-700">Role</p><p className="text-blue-400 font-800">{selectedParty.partyType}</p></div>
            <div><p className="text-[11px] text-[#8a94a6] uppercase font-700">Matter</p><p className="text-white font-600">{selectedParty.matter}</p></div>
            <div><p className="text-[11px] text-[#8a94a6] uppercase font-700">Counsel</p><p className="text-white font-600">{selectedParty.counsel}</p></div>
          </div>
        </Modal>
      )}

      {activeModal === 'delete' && selectedParty && (
        <Modal title="Delete Party" onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">Cancel</button>
              <button onClick={handleDelete} className="px-5 py-2 rounded-xl bg-red-600 text-white text-[13px] font-700">Delete Party</button>
            </>
          }
        >
          <p className="text-[14px] text-[#b8c2d1]">Are you sure you want to remove <strong className="text-white">{selectedParty.name}</strong> from this case registry?</p>
        </Modal>
      )}
    </div>
  );
}
