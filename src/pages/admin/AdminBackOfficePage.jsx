import { useState } from 'react';
import { PageHeader, StatCard, Card, Table, Tr, Td, Badge, Modal, Field, Input, Select, EmptyState, useToast } from '../../components/UI.jsx';

const initialVendors = [
  { id: 'VND-101', name: 'LexisNexis Research', category: 'Legal Database', monthlyCost: '$1,850', status: 'active', contact: 'support@lexisnexis.com' },
  { id: 'VND-102', name: 'DocuSign Enterprise', category: 'E-Signature', monthlyCost: '$650', status: 'active', contact: 'billing@docusign.com' },
  { id: 'VND-103', name: 'Titan Encrypted Email', category: 'Communications', monthlyCost: '$420', status: 'active', contact: 'sales@titan.email' },
  { id: 'VND-104', name: 'CourtReporter Express', category: 'Stenography Services', monthlyCost: '$2,100', status: 'active', contact: 'dispatch@courtreporter.express' },
];

export function AdminBackOfficePage() {
  const [vendors, setVendors] = useState(initialVendors);
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: 'Legal Database', monthlyCost: '', contact: '' });

  const { toast } = useToast();

  const handleOpenAdd = () => {
    setFormData({ name: '', category: 'Legal Database', monthlyCost: '', contact: '' });
    setActiveModal('add');
  };

  const handleSaveAdd = () => {
    if (!formData.name || !formData.monthlyCost) {
      toast('Please enter vendor name and monthly cost.', 'error');
      return;
    }
    const newVendor = {
      id: `VND-${vendors.length + 101}`,
      name: formData.name,
      category: formData.category,
      monthlyCost: formData.monthlyCost.startsWith('$') ? formData.monthlyCost : `$${formData.monthlyCost}`,
      status: 'active',
      contact: formData.contact || 'contact@vendor.com',
    };
    setVendors([newVendor, ...vendors]);
    setActiveModal(null);
    toast(`Vendor "${formData.name}" added to back office registry!`, 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title="Agency Back Office & Operational Management" 
        subtitle="Manage office infrastructure, vendor agreements, staff allocations, and operational overheads" 
      >
        <button 
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-[#0057c7] text-white font-700 text-[14px] hover:bg-[#0057c7]/80 shadow-lg shadow-[#0057c7]/20 flex items-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4" /></svg>
          Add Vendor Agreement
        </button>
      </PageHeader>

      {/* Operational Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Monthly Vendor Expenses" value="$5,020" change="-3.2%" icon={<svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Active Branch Offices" value="2 Locations" change="Optimal" icon={<svg className="w-6 h-6 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" /></svg>} />
        <StatCard label="Active Staff Members" value="28 Staff" change="+2" icon={<svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>} />
        <StatCard label="Operational Overhead" value="12.4%" change="-1.1%" icon={<svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 012 2h2a2 2 0 012-2" /></svg>} />
      </div>

      {/* Office Locations & Vendor Agreements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Office Locations Card */}
        <Card className="space-y-4">
          <h3 className="text-lg font-800 text-white font-display border-b border-white/5 pb-3">Office Locations</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-700">New York Headquarters</span>
                <Badge status="active" />
              </div>
              <p className="text-[12px] text-[#8a94a6]">140 Broadway, Floor 32, New York, NY</p>
              <p className="text-[11px] text-[#38bdf8] font-700">18 Staff Members • 142 Active Matters</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-700">Chicago Branch</span>
                <Badge status="active" />
              </div>
              <p className="text-[12px] text-[#8a94a6]">300 N LaSalle Dr, Chicago, IL</p>
              <p className="text-[11px] text-[#38bdf8] font-700">10 Staff Members • 88 Active Matters</p>
            </div>
          </div>
        </Card>

        {/* Vendor Agreements Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-800 text-white font-display">Active Vendor Contracts</h3>
          <Table headers={['Vendor Name', 'Category', 'Monthly Fee', 'Contact', 'Status']}>
            {vendors.map((vendor) => (
              <Tr key={vendor.id}>
                <Td className="font-700 text-white">
                  <div>{vendor.name}</div>
                  <div className="text-[11px] text-[#8a94a6]">{vendor.id}</div>
                </Td>
                <Td className="text-[13px] text-purple-300 font-600">
                  {vendor.category}
                </Td>
                <Td className="font-800 text-emerald-400">
                  {vendor.monthlyCost}
                </Td>
                <Td className="text-[12px] text-[#8a94a6]">
                  {vendor.contact}
                </Td>
                <Td>
                  <Badge status={vendor.status} />
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {activeModal === 'add' && (
        <Modal title="Add Vendor Contract" onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">Cancel</button>
              <button onClick={handleSaveAdd} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">Save Contract</button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Vendor / Software Name" required>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Westlaw Research" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Service Category">
                <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  <option value="Legal Database">Legal Database</option>
                  <option value="E-Signature">E-Signature</option>
                  <option value="Communications">Communications</option>
                  <option value="Stenography Services">Stenography Services</option>
                  <option value="IT & Security">IT & Security</option>
                </Select>
              </Field>
              <Field label="Monthly Recurring Fee ($)" required>
                <Input value={formData.monthlyCost} onChange={(e) => setFormData({ ...formData, monthlyCost: e.target.value })} placeholder="e.g. $1,250" />
              </Field>
            </div>
            <Field label="Vendor Support Contact">
              <Input type="email" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="support@vendor.com" />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
