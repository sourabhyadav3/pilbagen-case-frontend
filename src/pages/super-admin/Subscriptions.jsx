import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Table, Tr, Td, Badge, Modal, Card, Field, Select, EmptyState, useToast } from '../../components/UI.jsx';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const pricingPlans = [
  { name: 'Basic', price: '$299', period: '/month', features: ['Up to 5 Users', '1 Law Office Location', 'Standard Intake & Cases', 'Basic Reports & Storage (50GB)', 'Email Support'] },
  { name: 'Professional', price: '$699', period: '/month', popular: true, features: ['Up to 20 Users', '3 Law Office Locations', 'Advanced Case & Billing Module', 'Custom Client Portal', 'Priority Email & Phone Support'] },
  { name: 'Enterprise', price: '$1,499', period: '/month', features: ['Unlimited Users & Offices', 'Multi-Agency Management', 'Dedicated Account Manager', 'Custom Integrations & API Access', '24/7 SLA Support'] },
];

export default function SuperAdminSubscriptions() {
  const { t } = useLanguage();
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [newPlan, setNewPlan] = useState('Enterprise');
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.superAdmin.listAgencies({ limit: 200 });
      const list = res.data?.items || res.data || [];
      setSubscriptions(list.map(s => ({
        id: s.id,
        agency: s.name,
        plan: s.plan,
        mrr: `$${parseFloat(s.subscription_amount).toLocaleString()}`,
        billingCycle: s.billing_cycle,
        renewalDate: new Date(s.next_billing).toLocaleDateString(),
        autoRenew: s.status === 'active',
        status: s.status,
      })));
    } catch (e) {
      console.error(e);
      toast(t('failedToLoadSubscriptions'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenChangePlan = (sub) => {
    setSelectedSub(sub);
    setNewPlan(sub.plan);
    setActiveModal('changePlan');
  };

  const handleOpenCancel = (sub) => {
    setSelectedSub(sub);
    setActiveModal('cancel');
  };

  const handleSavePlanChange = async () => {
    let price = 699.00;
    if (newPlan === 'Basic') price = 299.00;
    if (newPlan === 'Enterprise') price = 1499.00;

    try {
      setIsLoading(true);
      await api.superAdmin.updateAgency(selectedSub.id, {
        plan: newPlan,
        subscription_amount: price
      });
      setActiveModal(null);
      toast(t('subscriptionUpdatedFor') + ` ${selectedSub.agency} ${t('to')} ${newPlan}!`, 'success');
      loadData();
    } catch (e) {
      toast(e.message || t('failedToUpdateSubscription'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    try {
      setIsLoading(true);
      await api.superAdmin.updateAgency(selectedSub.id, {
        status: 'inactive'
      });
      setActiveModal(null);
      toast(t('subscriptionCancelledFor') + ` ${selectedSub.agency}.`, 'warning');
      loadData();
    } catch (e) {
      toast(e.message || t('failedToCancelSubscription'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <PageHeader 
        title="subscriptionsBilling" 
        subtitle={t('managePlatformPricingTiers')} 
      />

      {/* Pricing Cards Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-800 text-white font-display">{t('subscriptionTiers')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((tier) => (
            <Card key={tier.name} className={`relative overflow-hidden ${tier.popular ? 'border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/5'}`}>
              {tier.popular && (
                <span className="absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full bg-[#D4AF37] text-[#0A192F] uppercase tracking-widest">
                  {t('mostPopular')}
                </span>
              )}
              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-800 text-white">{t(tier.name)}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-900 text-white font-display">{tier.price}</span>
                  <span className="text-[13px] text-[#8a94a6] font-600">{t(tier.period)}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                {tier.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[13px] text-[#b8c2d1]">
                    <svg className="w-4 h-4 text-[#D4AF37] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                    <span>{t(feat)}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Subscriptions Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-800 text-white font-display">{t('activeSubscriptionsOverview')}</h2>
        
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] text-[#8a94a6] font-800 uppercase tracking-widest">{t('loading')}</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <EmptyState title="No Subscriptions Found" desc="There are no registered subscriptions." />
        ) : (
          <Table headers={[t('agency'), t('currentPlan') || 'Current Plan', t('Monthly Recurring (MRR)') || 'Monthly Recurring (MRR)', t('Billing Cycle') || 'Billing Cycle', t('Next Renewal') || 'Next Renewal', t('Auto Renew') || 'Auto Renew', t('status'), t('actions') || 'Actions']}>
            {subscriptions.map((sub) => (
              <Tr key={sub.id}>
                <Td className="font-700 text-white">
                  <div>{sub.agency}</div>
                  <div className="text-[11px] text-[#8a94a6]">AGC-{sub.id}</div>
                </Td>
                <Td>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-800 uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {t(sub.plan)}
                  </span>
                </Td>
                <Td className="font-800 text-emerald-400">
                  {sub.mrr}
                </Td>
                <Td className="text-[13px] text-[#b8c2d1]">
                  {t(sub.billingCycle)}
                </Td>
                <Td className="text-[13px] text-[#8a94a6]">
                  {sub.renewalDate}
                </Td>
                <Td>
                  <span className={`text-[12px] font-700 ${sub.autoRenew ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {sub.autoRenew ? t('enabled') : t('disabled')}
                  </span>
                </Td>
                <Td>
                  <Badge status={sub.status} />
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenChangePlan(sub)} className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/25 text-[12px] font-bold transition-all">
                      {t('changePlan')}
                    </button>
                    {sub.status === 'active' && (
                      <button onClick={() => handleOpenCancel(sub)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[12px] font-bold transition-all">
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </div>

      {/* Change Plan Modal */}
      {activeModal === 'changePlan' && selectedSub && (
        <Modal title={`${t('modifySubscriptionPlan') || 'Modify Subscription Plan'}: ${selectedSub.agency}`} onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">{t('cancel')}</button>
              <button onClick={handleSavePlanChange} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">{t('updateSubscription')}</button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-[13px] text-[#8a94a6]">{t('selectNewBillingTierForAgency')} {selectedSub.agency}:</p>
            <Field label={t('newSubscriptionTier') || 'New Subscription Tier'}>
              <Select value={newPlan} onChange={(e) => setNewPlan(e.target.value)}>
                <option value="Basic">{t('basic')} ($299/mo)</option>
                <option value="Professional">{t('professional')} ($699/mo)</option>
                <option value="Enterprise">{t('enterprise')} ($1,499/mo)</option>
              </Select>
            </Field>
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {activeModal === 'cancel' && selectedSub && (
        <Modal title={t('confirmCancelation')} onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">{t('goBack')}</button>
              <button onClick={handleConfirmCancel} className="px-5 py-2 rounded-xl bg-red-600 text-white text-[13px] font-700">{t('confirmCancelation')}</button>
            </>
          }
        >
          <p className="text-[14px] text-[#b8c2d1]">{t('areYouSureCancelSubscription')} <strong className="text-white">{selectedSub.agency}</strong>? {t('revertToReadOnlyDesc')}</p>
        </Modal>
      )}
    </div>
  );
}
