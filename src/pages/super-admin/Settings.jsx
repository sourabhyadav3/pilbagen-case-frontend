import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Tabs, Field, Input, Select, useToast } from '../../components/UI.jsx';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

export default function SuperAdminSettings() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('General');
  const [settings, setSettings] = useState({
    platformName: '',
    supportEmail: '',
    defaultLanguage: 'English (US)',
    twoFactorRequired: false,
    enableRegistration: false,
    sessionTimeoutMinutes: 30,
    smtpServer: '',
    smtpPort: '',
    smtpSender: '',
    maintenanceMode: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.superAdmin.getSettings();
      if (res.data) {
        setSettings({
          platformName: res.data.platformName || '',
          supportEmail: res.data.supportEmail || '',
          defaultLanguage: res.data.defaultLanguage || 'English (US)',
          twoFactorRequired: !!res.data.twoFactorRequired,
          enableRegistration: !!res.data.enableRegistration,
          sessionTimeoutMinutes: Number(res.data.sessionTimeoutMinutes || 30),
          smtpServer: res.data.smtpServer || '',
          smtpPort: res.data.smtpPort || '',
          smtpSender: res.data.smtpSender || '',
          maintenanceMode: !!res.data.maintenanceMode
        });
      }
    } catch (e) {
      console.error(e);
      toast(t('failedToLoadSettings'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (section) => {
    try {
      setIsLoading(true);
      await api.superAdmin.updateSettings(settings);
      toast(t(section) + " " + t('settingsUpdatedSuccessfully'), 'success');
      loadData();
    } catch (e) {
      toast(e.message || t('failedToSaveSettings'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !settings.platformName) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] text-[#8a94a6] font-800 uppercase tracking-widest">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title="superAdminPlatformSettings" 
        subtitle={t('globalPlatformConfigurations')} 
      />

      <Tabs 
        tabs={['General', 'Security & Access', 'Email Server (SMTP)', 'Maintenance & System']} 
        active={activeTab} 
        onChange={setActiveTab} 
      />

      {/* General Settings Tab */}
      {activeTab === 'General' && (
        <Card className="max-w-3xl space-y-6">
          <h2 className="text-xl font-800 text-white font-display border-b border-white/5 pb-4">{t('generalPlatformDetails')}</h2>
          
          <div className="space-y-4">
            <Field label={t('platformName') || 'Platform Name'}>
              <Input value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} />
            </Field>
            <Field label={t('supportEmail') || 'Support Email'}>
              <Input type="email" value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} />
            </Field>
            <Field label={t('defaultSystemLanguage') || 'Default System Language'}>
              <Select value={settings.defaultLanguage} onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}>
                <option value="English (US)">{t('English (US)')}</option>
                <option value="English (UK)">{t('English (UK)')}</option>
                <option value="Spanish">{t('Spanish')}</option>
              </Select>
            </Field>
          </div>

          <div className="pt-4 flex justify-end">
            <button onClick={() => handleSave('General')} className="px-6 py-2.5 rounded-xl bg-[#0057c7] text-white font-700 text-[14px]">
              {t('saveGeneralSettings')}
            </button>
          </div>
        </Card>
      )}

      {/* Security & Access Tab */}
      {activeTab === 'Security & Access' && (
        <Card className="max-w-3xl space-y-6">
          <h2 className="text-xl font-800 text-white font-display border-b border-white/5 pb-4">{t('platformSecurity')}</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-white font-700">{t('enforceTwoFactorAuthentication')}</p>
                <p className="text-[12px] text-[#8a94a6]">{t('require2FAForAdminLogins')}</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings.twoFactorRequired} 
                onChange={(e) => setSettings({ ...settings, twoFactorRequired: e.target.checked })} 
                className="w-5 h-5 accent-[#0057c7] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-white font-700">{t('allowOpenAgencyRegistration')}</p>
                <p className="text-[12px] text-[#8a94a6]">{t('enableNewLawFirmsToRegister')}</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings.enableRegistration} 
                onChange={(e) => setSettings({ ...settings, enableRegistration: e.target.checked })} 
                className="w-5 h-5 accent-[#0057c7] cursor-pointer"
              />
            </div>

            <Field label={t('sessionInactivityTimeoutMinutes') || 'Session Inactivity Timeout (Minutes)'}>
              <Input type="number" value={settings.sessionTimeoutMinutes} onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: e.target.value })} />
            </Field>
          </div>

          <div className="pt-4 flex justify-end">
            <button onClick={() => handleSave('Security')} className="px-6 py-2.5 rounded-xl bg-[#0057c7] text-white font-700 text-[14px]">
              {t('saveSecurityRules')}
            </button>
          </div>
        </Card>
      )}

      {/* Email Server (SMTP) Tab */}
      {activeTab === 'Email Server (SMTP)' && (
        <Card className="max-w-3xl space-y-6">
          <h2 className="text-xl font-800 text-white font-display border-b border-white/5 pb-4">{t('globalSMTPMailer')}</h2>
          
          <div className="space-y-4">
            <Field label={t('smtpHostServer') || 'SMTP Host Server'}>
              <Input value={settings.smtpServer} onChange={(e) => setSettings({ ...settings, smtpServer: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('smtpPort') || 'SMTP Port'}>
                <Input value={settings.smtpPort} onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })} />
              </Field>
              <Field label={t('senderEmailAddress') || 'Sender Email Address'}>
                <Input value={settings.smtpSender} onChange={(e) => setSettings({ ...settings, smtpSender: e.target.value })} />
              </Field>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button onClick={() => handleSave('SMTP Configuration')} className="px-6 py-2.5 rounded-xl bg-[#0057c7] text-white font-700 text-[14px]">
              {t('saveMailerConfig')}
            </button>
          </div>
        </Card>
      )}

      {/* Maintenance & System Tab */}
      {activeTab === 'Maintenance & System' && (
        <Card className="max-w-3xl space-y-6">
          <h2 className="text-xl font-800 text-white font-display border-b border-white/5 pb-4">{t('maintenanceModeControl')}</h2>
          
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-400 font-800 text-lg">{t('systemMaintenanceMode')}</p>
                <p className="text-[13px] text-[#b8c2d1] mt-1">{t('maintenanceModeNoticeDesc')}</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings.maintenanceMode} 
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} 
                className="w-6 h-6 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button onClick={() => handleSave('Maintenance Mode')} className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-800 text-[14px]">
              {t('updateMaintenanceStatus')}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
