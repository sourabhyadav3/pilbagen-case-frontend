import { useState } from 'react';
import { PageHeader, Card, Tabs, Field, Input, Select, useToast } from '../../components/UI.jsx';
import { initialSettings } from '../../data/superAdminData';

export default function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState('General');
  const [settings, setSettings] = useState(initialSettings);
  const { toast } = useToast();

  const handleSave = (section) => {
    toast(`${section} settings updated successfully!`, 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title="Super Admin Platform Settings" 
        subtitle="Global platform configurations, system maintenance, email server, and branding" 
      />

      <Tabs 
        tabs={['General', 'Security & Access', 'Email Server (SMTP)', 'Maintenance & System']} 
        active={activeTab} 
        onChange={setActiveTab} 
      />

      {/* General Settings Tab */}
      {activeTab === 'General' && (
        <Card className="max-w-3xl space-y-6">
          <h2 className="text-xl font-800 text-white font-display border-b border-white/5 pb-4">General Platform Details</h2>
          
          <div className="space-y-4">
            <Field label="Platform Name">
              <Input value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} />
            </Field>
            <Field label="Support Email">
              <Input type="email" value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} />
            </Field>
            <Field label="Default System Language">
              <Select value={settings.defaultLanguage} onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}>
                <option value="English (US)">English (US)</option>
                <option value="English (UK)">English (UK)</option>
                <option value="Spanish">Spanish</option>
              </Select>
            </Field>
          </div>

          <div className="pt-4 flex justify-end">
            <button onClick={() => handleSave('General')} className="px-6 py-2.5 rounded-xl bg-[#0057c7] text-white font-700 text-[14px]">
              Save General Settings
            </button>
          </div>
        </Card>
      )}

      {/* Security & Access Tab */}
      {activeTab === 'Security & Access' && (
        <Card className="max-w-3xl space-y-6">
          <h2 className="text-xl font-800 text-white font-display border-b border-white/5 pb-4">Platform Security</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-white font-700">Enforce Two-Factor Authentication (2FA)</p>
                <p className="text-[12px] text-[#8a94a6]">Require 2FA for all Super Admin and Agency Admin logins</p>
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
                <p className="text-white font-700">Allow Open Agency Registration</p>
                <p className="text-[12px] text-[#8a94a6]">Enable new law firms to register accounts online</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings.enableRegistration} 
                onChange={(e) => setSettings({ ...settings, enableRegistration: e.target.checked })} 
                className="w-5 h-5 accent-[#0057c7] cursor-pointer"
              />
            </div>

            <Field label="Session Inactivity Timeout (Minutes)">
              <Input type="number" value={settings.sessionTimeoutMinutes} onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: e.target.value })} />
            </Field>
          </div>

          <div className="pt-4 flex justify-end">
            <button onClick={() => handleSave('Security')} className="px-6 py-2.5 rounded-xl bg-[#0057c7] text-white font-700 text-[14px]">
              Save Security Rules
            </button>
          </div>
        </Card>
      )}

      {/* Email Server (SMTP) Tab */}
      {activeTab === 'Email Server (SMTP)' && (
        <Card className="max-w-3xl space-y-6">
          <h2 className="text-xl font-800 text-white font-display border-b border-white/5 pb-4">Global SMTP Mailer</h2>
          
          <div className="space-y-4">
            <Field label="SMTP Host Server">
              <Input value={settings.smtpServer} onChange={(e) => setSettings({ ...settings, smtpServer: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="SMTP Port">
                <Input value={settings.smtpPort} onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })} />
              </Field>
              <Field label="Sender Email Address">
                <Input value={settings.smtpSender} onChange={(e) => setSettings({ ...settings, smtpSender: e.target.value })} />
              </Field>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button onClick={() => handleSave('SMTP Configuration')} className="px-6 py-2.5 rounded-xl bg-[#0057c7] text-white font-700 text-[14px]">
              Save Mailer Config
            </button>
          </div>
        </Card>
      )}

      {/* Maintenance & System Tab */}
      {activeTab === 'Maintenance & System' && (
        <Card className="max-w-3xl space-y-6">
          <h2 className="text-xl font-800 text-white font-display border-b border-white/5 pb-4">Maintenance Mode Control</h2>
          
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-400 font-800 text-lg">System Maintenance Mode</p>
                <p className="text-[13px] text-[#b8c2d1] mt-1">When active, non-Super Admin users will see a maintenance notice upon logging in.</p>
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
              Update Maintenance Status
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
