import { useState } from 'react';
import { PageHeader, Table, Tr, Td, Badge, Modal, Card, Field, Select, useToast } from '../../components/UI.jsx';
import { initialSubscriptions, pricingPlans, initialAgencies } from '../../data/superAdminData';

export default function SuperAdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [newPlan, setNewPlan] = useState('Enterprise');

  const { toast } = useToast();

  const handleOpenChangePlan = (sub) => {
    setSelectedSub(sub);
    setNewPlan(sub.plan);
    setActiveModal('changePlan');
  };

  const handleOpenCancel = (sub) => {
    setSelectedSub(sub);
    setActiveModal('cancel');
  };

  const handleSavePlanChange = () => {
    setSubscriptions(subscriptions.map(s => s.id === selectedSub.id ? { ...s, plan: newPlan } : s));
    setActiveModal(null);
    toast(`Subscription plan for ${selectedSub.agency} updated to ${newPlan}!`, 'success');
  };

  const handleConfirmCancel = () => {
    setSubscriptions(subscriptions.map(s => s.id === selectedSub.id ? { ...s, status: 'inactive', autoRenew: false } : s));
    setActiveModal(null);
    toast(`Subscription for ${selectedSub.agency} has been cancelled.`, 'warning');
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <PageHeader 
        title="Subscriptions & Billing" 
        subtitle="Manage platform pricing tiers, active agency subscriptions, and renewals" 
      />

      {/* Pricing Cards Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-800 text-white font-display">Subscription Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((tier) => (
            <Card key={tier.name} className={`relative overflow-hidden ${tier.popular ? 'border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/5'}`}>
              {tier.popular && (
                <span className="absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full bg-[#D4AF37] text-[#0A192F] uppercase tracking-widest">
                  Most Popular
                </span>
              )}
              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-800 text-white">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-900 text-white font-display">{tier.price}</span>
                  <span className="text-[13px] text-[#8a94a6] font-600">{tier.period}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                {tier.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[13px] text-[#b8c2d1]">
                    <svg className="w-4 h-4 text-[#D4AF37] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Subscriptions Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-800 text-white font-display">Active Subscriptions Overview</h2>
        
        <Table headers={['Agency', 'Current Plan', 'Monthly Recurring (MRR)', 'Billing Cycle', 'Next Renewal', 'Auto Renew', 'Status', 'Actions']}>
          {subscriptions.map((sub) => (
            <Tr key={sub.id}>
              <Td className="font-700 text-white">
                <div>{sub.agency}</div>
                <div className="text-[11px] text-[#8a94a6]">{sub.id}</div>
              </Td>
              <Td>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-800 uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {sub.plan}
                </span>
              </Td>
              <Td className="font-800 text-emerald-400">
                {sub.mrr}
              </Td>
              <Td className="text-[13px] text-[#b8c2d1]">
                {sub.billingCycle}
              </Td>
              <Td className="text-[13px] text-[#8a94a6]">
                {sub.renewalDate}
              </Td>
              <Td>
                <span className={`text-[12px] font-700 ${sub.autoRenew ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {sub.autoRenew ? 'Enabled' : 'Disabled'}
                </span>
              </Td>
              <Td>
                <Badge status={sub.status} />
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenChangePlan(sub)} className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/25 text-[12px] font-bold transition-all">
                    Change Plan
                  </button>
                  {sub.status === 'active' && (
                    <button onClick={() => handleOpenCancel(sub)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[12px] font-bold transition-all">
                      Cancel
                    </button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </div>

      {/* Change Plan Modal */}
      {activeModal === 'changePlan' && selectedSub && (
        <Modal title={`Modify Subscription Plan - ${selectedSub.agency}`} onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">Cancel</button>
              <button onClick={handleSavePlanChange} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">Update Subscription</button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-[13px] text-[#8a94a6]">Select the new billing tier for {selectedSub.agency}:</p>
            <Field label="New Subscription Tier">
              <Select value={newPlan} onChange={(e) => setNewPlan(e.target.value)}>
                <option value="Basic">Basic ($299/mo)</option>
                <option value="Professional">Professional ($699/mo)</option>
                <option value="Enterprise">Enterprise ($1,499/mo)</option>
              </Select>
            </Field>
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {activeModal === 'cancel' && selectedSub && (
        <Modal title="Cancel Subscription" onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">Go Back</button>
              <button onClick={handleConfirmCancel} className="px-5 py-2 rounded-xl bg-red-600 text-white text-[13px] font-700">Confirm Cancelation</button>
            </>
          }
        >
          <p className="text-[14px] text-[#b8c2d1]">Are you sure you want to cancel subscription for <strong className="text-white">{selectedSub.agency}</strong>? The agency will revert to read-only access at the end of the billing period.</p>
        </Modal>
      )}
    </div>
  );
}
