import { useState, useRef, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet, useParams } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import { VyniusAI } from './components/VyniusAI.jsx';
import { useToast, ToastContainer, Modal, Field, Input, Select, Textarea } from './components/UI.jsx';
import logoImg from './assets/pilbagen-logo.png';
import justiceBg from './assets/lady_justice_login_bg_1777101771752.png';
import api from './services/api';
import OutlookEventComposer from './components/OutlookEventComposer.jsx';
import EmailComposeModal from './components/EmailComposeModal.jsx';
import { saveDraft, loadDraft, clearDraft } from './utils/autoDraftSaver';

// Admin Pages
import { AdminDashboard, ClientsPage, ClientDetailPage, CasesPage, CaseDetailPage, CalendarPage, DocumentsPage, BillingPage, EmailPage, AIPage, UsersPage, SettingsPage, IntegrationsPage, TemplateLibrary, AdminPartiesPage, AdminBackOfficePage } from './pages/AdminPages.jsx';
import ActivitiesPage from './pages/ActivitiesPage.jsx';
import CourtFormsPage from './pages/CourtFormsPage.jsx';

// Lawyer Pages
import { LawyerDashboard, LawyerCasesPage, LawyerClientsPage, LawyerProfilePage } from './pages/LawyerPages.jsx';

// Partner Pages
import { PartnerDashboard, PartnerMyMatters, PartnerFirmMatters, PartnerCalendar, PartnerDocuments, PartnerBilling, PartnerCommunications, PartnerReports, PartnerTeam, PartnerConflictCheck, PartnerSettings } from './pages/PartnerPages.jsx';

// Paralegal Pages
import { ParalegalDashboard, ParalegalMyMatters, ParalegalCalendar, ParalegalDocuments, ParalegalTimeEntries, ParalegalTasks, ParalegalCommunications, ParalegalConflictCheck, ParalegalSettings } from './pages/ParalegalPages.jsx';

// Lead & Marketing Pages
import { LeadDashboard, LeadDetailPage, ConflictCheckPage } from './pages/LeadPages.jsx';
import { MarketingDashboard, ReportsDashboard } from './pages/MarketingPages.jsx';

// Client Pages
import { ClientDashboard, ClientCasesPage, ClientDocumentsPage, ClientBillingPage, ClientMessagesPage, ClientProfilePage } from './pages/ClientPages.jsx';

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/Dashboard.jsx';
import SuperAdminAgencies from './pages/super-admin/Agencies.jsx';
import SuperAdminOffices from './pages/super-admin/Offices.jsx';
import SuperAdminUsers from './pages/super-admin/Users.jsx';
import SuperAdminSubscriptions from './pages/super-admin/Subscriptions.jsx';
import SuperAdminReports from './pages/super-admin/Reports.jsx';
import SuperAdminActivityLogs from './pages/super-admin/ActivityLogs.jsx';
import SuperAdminSettings from './pages/super-admin/Settings.jsx';

import { SignDocument } from './components/SignDocument.jsx';
import TitanEmailModule from './pages/EmailModule/TitanEmailModule.jsx';

// ─────────────────────────────────────────────────────────
//  LOGIN SCREEN
// ─────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showAdminContact, setShowAdminContact] = useState(false);
  const [showAdminEmail, setShowAdminEmail] = useState(false);

  const handleSubmit = async (overrideEmail, overridePass) => {
    setIsLoading(true);
    setErrorMsg('');
    const targetEmail = overrideEmail || email;
    const targetPass = overridePass || pass;

    if (
      targetEmail === 'superadmin@pilbagen.se' ||
      targetEmail === 'super_admin@pilbagen.se' ||
      targetEmail === 'superadmin@vktori.com'
    ) {
      const superAdminUser = {
        id: 999,
        email: 'superadmin@pilbagen.se',
        full_name: 'Pilbågen Admin',
        roles: ['super_admin'],
        role: 'super_admin',
      };
      onLogin(superAdminUser, 'demo_super_admin_token');
      setIsLoading(false);
      return;
    }

    if (targetEmail === 'partner@vktori.com') {
      try {
        const response = await api.auth.login({ email: 'lawyer@vktori.com', password: targetPass || '1234' });
        const payload = response?.data;
        const realToken = payload?.token ?? response?.token;
        const realUser = payload?.user ?? response?.user;
        const partnerUser = {
          ...realUser,
          email: 'partner@vktori.com',
          full_name: 'David Sterling, Esq.',
          roles: ['partner'],
          role: 'partner',
        };
        onLogin(partnerUser, realToken);
      } catch (err) {
        const fallbackUser = { id: 2, email: 'partner@vktori.com', full_name: 'David Sterling, Esq.', roles: ['partner'], role: 'partner' };
        onLogin(fallbackUser, 'demo_partner_token');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (targetEmail === 'paralegal@vktori.com') {
      try {
        const response = await api.auth.login({ email: 'lawyer@vktori.com', password: targetPass || '1234' });
        const payload = response?.data;
        const realToken = payload?.token ?? response?.token;
        const realUser = payload?.user ?? response?.user;
        const paralegalUser = {
          ...realUser,
          email: 'paralegal@vktori.com',
          full_name: 'Emily Carter',
          roles: ['paralegal'],
          role: 'paralegal',
        };
        onLogin(paralegalUser, realToken);
      } catch (err) {
        const fallbackUser = { id: 5, email: 'paralegal@vktori.com', full_name: 'Emily Carter', roles: ['paralegal'], role: 'paralegal' };
        onLogin(fallbackUser, 'demo_paralegal_token');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      // Map pilbagen.se alias emails to seeded backend user accounts if needed
      let backendEmail = targetEmail;
      if (targetEmail === 'admin@pilbagen.se') backendEmail = 'admin@vktori.com';
      if (targetEmail === 'lawyer@pilbagen.se') backendEmail = 'lawyer@vktori.com';
      if (targetEmail === 'client@pilbagen.se') backendEmail = 'client@vktori.com';

      const response = await api.auth.login({ email: backendEmail, password: targetPass });
      const payload = response?.data;
      const user = payload?.user ?? response?.user;
      const token = payload?.token ?? response?.token;
      if (!user || !token) {
        throw new Error('Invalid login response from server.');
      }
      onLogin(user, token);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const [activeDemoRole, setActiveDemoRole] = useState(null);

  const DEMO_INFO = {
    super_admin: { label: 'Super Admin', email: 'superadmin@vktori.com', pass: '1234', icon: '👑', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
    admin: { label: 'Agency Admin', email: 'admin@vktori.com', pass: '1234', icon: '🛡️', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
    partner: { label: 'Partner', email: 'partner@vktori.com', pass: '1234', icon: '🤝', color: 'border-sky-500/40 bg-sky-500/10 text-sky-300' },
    lawyer: { label: 'Lawyer', email: 'lawyer@vktori.com', pass: '1234', icon: '⚖️', color: 'border-[#0057c7]/40 bg-[#0057c7]/10 text-[#38bdf8]' },
    paralegal: { label: 'Paralegal', email: 'paralegal@vktori.com', pass: '1234', icon: '📋', color: 'border-teal-500/40 bg-teal-500/10 text-teal-300' },
    client: { label: 'Client', email: 'client@vktori.com', pass: '1234', icon: '👤', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  };

  const handleDemoLogin = (roleKey) => {
    setActiveDemoRole(roleKey);
    const info = DEMO_INFO[roleKey];
    if (info) {
      setEmail(info.email);
      setPass(info.pass);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#05080f] overflow-hidden">
      {/* Left Panel - Cinematic Branding */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-[#05080f] relative flex-col items-center justify-center p-12 text-center border-r border-white/5">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img src={justiceBg} alt="Justice Background" className="w-full h-full object-cover opacity-40 mix-blend-luminosity scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05080f]/80 via-[#05080f]/40 to-[#05080f]/90" />
        </div>

        <div className="relative z-10 space-y-12 animate-fade-in-up">
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto p-2 rounded-2xl bg-white backdrop-blur-xl shadow-2xl flex items-center justify-center">
              <img src={logoImg} alt="Pilbågen Logo" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-1">
              <h2 className="text-[#D4AF37] font-sans font-bold text-xl tracking-wider uppercase">Swedish Legal Platform</h2>
              <p className="text-white/60 text-[11px] font-semibold uppercase tracking-[0.3em]">Agency & Matter Management</p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-white font-serif text-5xl font-bold leading-tight tracking-tight">Pilbågen</h1>
            <p className="text-white/70 text-sm max-w-sm mx-auto leading-relaxed">
              Fast, secure and intuitive case management designed for law firms.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-12 border-t border-white/10">
            {[
              { label: 'Secure', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
              { label: 'Efficient', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
              { label: 'Insightful', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 012 2h2a2 2 0 012-2" /></svg> },
            ].map(f => (
              <div key={f.label} className="space-y-3 group cursor-default">
                <div className="w-10 h-10 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C9A24A] group-hover:bg-[#C9A24A] group-hover:text-black transition-all duration-300">
                  {f.icon}
                </div>
                <p className="text-[10px] font-900 text-white/60 uppercase tracking-widest">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Institutional Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#0a0f1a] relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0057c7]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#C9A24A]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-xl space-y-8 animate-fade-in relative z-10">
          {/* Mobile Logo */}
          <div className="md:hidden flex flex-col items-center gap-4 mb-8">
            <div className="w-16 h-16 p-3 rounded-2xl bg-[#00163C] border border-amber-400/40 backdrop-blur-xl">
              <img src={logoImg} alt="Pilbågen Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-white font-display text-4xl font-bold tracking-tight">Pilbågen</h1>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-4 py-1.5 rounded-full bg-[#002868] border border-amber-400/30 text-amber-400 text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg">
                Pilbågen Portal
              </div>
              <div className="h-px w-12 bg-white/10" />
              <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest">Law Firm Platform</span>
            </div>
            <h2 className="text-white font-display text-4xl font-bold tracking-tight leading-tight">Welcome <span className="text-[#D4AF37]">Back</span></h2>
            <p className="text-white/80 text-base font-medium">Log in with your user credentials to access firm matters and workspace.</p>
          </div>

          {/* Quick Demo Credentials Panel (Compact & Tidy) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
              <span className="text-[10.5px] font-900 text-[#C9A24A] uppercase tracking-[0.2em]">⚡ Quick Demo Accounts</span>
              <span className="text-[9.5px] text-white/50 font-medium">Click role to auto-fill credentials</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(DEMO_INFO).map(([key, info]) => {
                const isActive = activeDemoRole === key || email === info.email;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleDemoLogin(key)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[10.5px] font-extrabold transition-all flex items-center justify-between group ${
                      isActive
                        ? `${info.color} ring-2 ring-amber-400/50 shadow-md scale-[1.01]`
                        : 'border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="text-xs">{info.icon}</span>
                      <span className="truncate">{info.label}</span>
                    </span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:bg-[#D4AF37]/10 transition-colors" />

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[14px] font-bold text-center relative z-10">
                {errorMsg}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="relative z-10 space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[#D4AF37] uppercase tracking-[0.2em] ml-2">Email Address / Identity</label>
                  <div className="relative group/input">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-[#D4AF37] transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <input value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-14 pr-5 py-4 text-white text-[15px] outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/15 transition-all font-medium placeholder:text-slate-600 shadow-inner"
                      placeholder="Enter your credential email" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[#D4AF37] uppercase tracking-[0.2em] ml-2">Secure Credential</label>
                  <div className="relative group/input">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-[#D4AF37] transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 0 0-8 0v4h8z" /></svg>
                    </div>
                    <input type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-14 pr-14 py-4 text-white text-[15px] outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/15 transition-all font-medium placeholder:text-slate-600 shadow-inner"
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className={`absolute right-5 top-1/2 -translate-y-1/2 transition-colors ${showPass ? 'text-[#D4AF37]' : 'text-slate-500 hover:text-white'}`}>
                      {showPass ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L4.22 4.22m13.88 13.88l-1.42-1.42m1.42-1.42a10.02 10.02 0 001.383-2.31c-1.274-4.057-5.064-7-9.542-7-1.144 0-2.235.19-3.25.54m0 0l-1.42-1.42" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2 pt-1">
                  <label className="flex items-center gap-3 text-[13px] text-white/80 font-medium cursor-pointer group">
                    <input type="checkbox" defaultChecked className="w-4.5 h-4.5 rounded-[6px] border-white/10 bg-white/5 text-[#D4AF37] focus:ring-[#D4AF37]/50" />
                    Remember this device
                  </label>
                  <button type="button" onClick={() => { setShowAdminContact(true); setShowAdminEmail(false); }} className="text-[13px] text-[#D4AF37] font-semibold hover:underline transition-colors">Forgot Password?</button>
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] via-[#F3C649] to-[#D4AF37] text-[#0A192F] font-extrabold uppercase tracking-[0.2em] rounded-2xl text-[15px] hover:shadow-2xl hover:shadow-[#D4AF37]/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 relative z-10 shadow-xl border border-amber-300/40">
                {isLoading ? 'Authenticating...' : 'Enter System Platform'}
              </button>
            </form>
          </div>

          <p className="text-center text-[14px] text-slate-500 font-600">
            Endast behörig personal. <span onClick={() => { setShowAdminContact(true); setShowAdminEmail(false); }} className="text-[#D4AF37] font-bold cursor-pointer hover:text-white transition-colors ml-1">Kontakta byråns administratör</span>
          </p>
        </div>

        {showAdminContact && (
          <div className="absolute inset-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fade-in">
            <div className="bg-white/[0.05] border border-white/10 p-6 sm:p-8 rounded-3xl max-w-md w-full text-center space-y-4 sm:space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A24A]/10 rounded-full -mr-16 -mt-16 blur-xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0057c7]/10 rounded-full -ml-16 -mb-16 blur-xl" />
              
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#C9A24A]/20 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 relative z-10 border border-[#C9A24A]/30">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#C9A24A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif text-white relative z-10 tracking-tight">Security Protocol</h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed relative z-10">
                For security compliance, password resets must be authorized by the Systems Administrator. 
                Please contact IT support to receive a temporary credential.
              </p>
              <div className="pt-4 sm:pt-6 space-y-3 relative z-10">
                {showAdminEmail ? (
                  <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl animate-fade-in text-center space-y-2">
                    <p className="text-[10px] sm:text-[11px] font-900 text-slate-400 uppercase tracking-widest">Administrator Email</p>
                    <p className="text-sm sm:text-base font-semibold text-[#38bdf8] select-all break-all">
                      info@pilbagen.se
                    </p>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAdminEmail(true)} className="block w-full py-3 sm:py-4 bg-[#0057c7] text-white rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm hover:bg-[#004bb1] transition-all shadow-lg shadow-[#0057c7]/20">
                    Email Administrator
                  </button>
                )}
                <button type="button" onClick={() => { setShowAdminContact(false); setShowAdminEmail(false); }} className="block w-full py-3 sm:py-4 bg-transparent border border-white/10 text-white rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm hover:bg-white/5 transition-all">
                  Return to Gateway
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-10 left-0 w-full text-center opacity-40">
          <p className="text-[10px] font-900 text-slate-600 uppercase tracking-[0.4em]">
            © 2026 Pilbågen Advokatbyrå. Secure Legal Network v2.4.0
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MODAL → API (default submit when page does not pass onSave)
// ─────────────────────────────────────────────────────────
async function defaultModalSubmit(type, modalData, values, { role, user, toast, navigate }, selectedFiles = []) {
  const uid = user?.id;
  const dispatchRefresh = () => window.dispatchEvent(new CustomEvent('vktori:entities-changed'));

  switch (type) {
    case 'add-lead': {
      if (!uid) throw new Error('Not signed in.');
      const full_name = `${values.firstName || ''} ${values.lastName || ''}`.trim();
      let practice = values.matterType || 'General';
      if (practice === 'other') {
        practice = (values.custom_matter_type || '').trim();
      }
      await api.leads.create({
        full_name,
        email: values.email,
        phone: values.phone || null,
        source: values.source || 'Direct',
        matter_type: practice,
        practice_area: practice,
        message: values.message || null,
        notes: values.notes || null,
        created_by_user_id: uid,
        status: 'new',
      });
      toast('Lead added successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'add-client': {
      if (!uid) throw new Error('Not signed in.');
      const party_type = values.party_type || 'Individual';
      const party_role = values.party_role === 'Other'
        ? (values.custom_party_role || '').trim()
        : (values.party_role || 'Client');
      const full_name = party_type === 'Organization' 
        ? values.organization_name?.trim() 
        : `${values.firstName || ''} ${values.lastName || ''}`.trim();
        
      await api.clients.create({
        full_name,
        email: values.email,
        phone: values.phone || null,
        notes: values.notes || null,
        party_type,
        party_role,
        organization_name: values.organization_name || null,
        contact_first_name: values.contact_first_name || null,
        contact_last_name: values.contact_last_name || null,
        business_address: values.business_address || null,
        home_address: values.home_address || null,
        opposing_party_name: values.opposing_party_name || null,
        opposing_law_firm: values.opposing_law_firm || null,
        opposing_counsel_name: values.opposing_counsel_name || null,
      });
      toast('Client added successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'edit-client': {
      const id = modalData?.id ?? modalData?.raw?.id;
      if (!id) throw new Error('Missing client.');
      const party_type = values.party_type || 'Individual';
      const party_role = values.party_role === 'Other'
        ? (values.custom_party_role || '').trim()
        : (values.party_role || 'Client');
      const full_name = party_type === 'Organization' 
        ? values.organization_name?.trim() 
        : `${values.firstName || ''} ${values.lastName || ''}`.trim();
      const st = (values.status || 'active').toLowerCase();
      const is_portal_enabled = st === 'active';
      await api.clients.update(id, {
        full_name,
        email: values.email,
        phone: values.phone || null,
        notes: values.notes || null,
        is_portal_enabled,
        party_type,
        party_role,
        organization_name: values.organization_name || null,
        contact_first_name: values.contact_first_name || null,
        contact_last_name: values.contact_last_name || null,
        business_address: values.business_address || null,
        home_address: values.home_address || null,
        opposing_party_name: values.opposing_party_name || null,
        opposing_law_firm: values.opposing_law_firm || null,
        opposing_counsel_name: values.opposing_counsel_name || null,
      });
      toast('Client updated successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'add-case': {
      if (!uid) throw new Error('Not signed in.');
      const clientIds = values.clientIds || [];
      if (!Array.isArray(clientIds) || clientIds.length === 0) throw new Error('Select at least one party.');
      let assigned_lawyer_id = values.lawyerId ? parseInt(values.lawyerId, 10) : null;
      if (role === 'lawyer' && !Number.isFinite(assigned_lawyer_id)) assigned_lawyer_id = uid;
      if (!Number.isFinite(assigned_lawyer_id)) assigned_lawyer_id = null;
      let practice = values.matterType || values.type || 'General';
      if (practice === 'other') {
        practice = (values.custom_matter_type || '').trim();
      }
      const filed = values.filed || values.openedAt;
      await api.matters.create({
        title: values.title,
        clientIds: clientIds,
        assigned_lawyer_id,
        practice_area: practice,
        matter_type: practice,
        opposing_party_name: values.opposingParty === 'Other' ? values.custom_opposing_party : (values.opposingParty || null),
        description: values.description || null,
        opened_at: filed ? new Date(filed).toISOString() : null,
        status: 'pending',
        priority: values.priority || 'medium',
        initial_filing_date: values.initial_filing_date || null,
        date_of_loss: values.date_of_loss || null,
        trial_date: values.trial_date || null,
        case_number: values.case_number || null,
        judge_name: values.judge_name || null,
        court_name: values.court_name || null,
        court_address: values.court_address || null,
        created_by_user_id: uid,
        custom_fields: Object.keys(values).filter(k => k.startsWith('cf_')).map(k => ({
          field_id: k.replace('cf_', ''),
          value: values[k]
        }))
      });
      toast('Matter created!', 'success');
      dispatchRefresh();
      if (role === 'admin') navigate('/admin/matters');
      else if (role === 'lawyer') navigate('/lawyer/matters');
      break;
    }
    case 'create-invoice': {
      if (!uid) throw new Error('Not signed in.');
      const matter_id = parseInt(String(values.matterId || modalData?.matterId || ''), 10);
      if (!Number.isFinite(matter_id)) throw new Error('Select a matter.');
      const invNum = `INV-${Date.now()}`;
      await api.billing.createInvoice({
        matter_id,
        invoice_number: invNum,
        description: values.description || null,
        amount: values.amount,
        due_date: values.dueDate ? new Date(values.dueDate).toISOString() : null,
        status: 'draft',
        created_by_user_id: uid,
      });
      toast('Invoice created!', 'success');
      dispatchRefresh();
      break;
    }
    case 'trust-deposit': {
      if (!uid) throw new Error('Not signed in.');
      await api.billing.depositTrust({
        client_id: values.client_id,
        matter_id: values.matter_id || null,
        amount: values.amount,
        reference: values.reference,
        notes: values.notes,
      });
      toast('Trust deposit recorded!', 'success');
      dispatchRefresh();
      break;
    }
    case 'apply-trust': {
      if (!uid) throw new Error('Not signed in.');
      await api.billing.applyTrustToInvoice({
        trust_account_id: values.trust_account_id,
        invoice_id: values.invoice_id,
        amount: values.amount,
      });
      toast('Funds applied successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'add-document': {
      if (!uid) throw new Error('Not signed in.');
      const matter_id = parseInt(String(values.matterId || modalData?.matterId || ''), 10);
      if (!Number.isFinite(matter_id)) throw new Error('Select a matter.');
      
      const fileInput = document.querySelector('input[name="file"]');
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        throw new Error('Please select files to upload.');
      }
      
      const form = new FormData();
      const metadataList = [];
      const category = values.docCategory === 'other'
        ? (values.custom_doc_category || '').trim()
        : (values.docCategory || 'General');
      const visibility = role === 'lawyer' ? 'client_shared' : role === 'client' ? 'client_visible' : 'internal';
      
      for (let i = 0; i < fileInput.files.length; i++) {
        const file = fileInput.files[i];
        form.append('files', file);
        
        let folder_path = null;
        if (file.webkitRelativePath) {
          const parts = file.webkitRelativePath.split('/');
          if (parts.length > 1) {
            folder_path = parts.slice(0, -1).join('/');
          }
        }
        
        metadataList.push({
          matter_id,
          category,
          visibility,
          folder_path,
          uploaded_by_user_id: String(uid),
        });
      }
      
      form.append('metadata', JSON.stringify(metadataList));
      const res = await api.documents.createBulk(form);
      
      const results = res.data;
      const successes = results.filter(r => r.status === 'success').length;
      const failures = results.length - successes;
      
      if (failures > 0) {
        toast(`Uploaded ${successes} files, ${failures} failed.`, 'warning');
      } else {
        toast(`Successfully uploaded ${successes} files!`, 'success');
      }
      
      dispatchRefresh();
      break;
    }
    case 'edit-case': {
      if (!uid) throw new Error('Not signed in.');
      const matterId = modalData?.numericId ?? modalData?.matterId;
      const idInt = parseInt(String(matterId), 10);
      if (!Number.isFinite(idInt)) throw new Error('Missing matter.');
      let apiStatus = (values.status || 'active').toLowerCase();
      if (apiStatus === 'closed') apiStatus = 'completed';
      let practice = values.type || modalData?.type || 'General';
      if (practice === 'other') {
        practice = (values.custom_matter_type || '').trim();
      }
      await api.matters.update(idInt, {
        title: values.title,
        opposing_party_name: values.opposingParty === 'Other' ? values.custom_opposing_party : (values.opposingParty || null),
        assigned_lawyer_id: values.assigned_lawyer_id ? parseInt(values.assigned_lawyer_id, 10) : undefined,
        status: apiStatus,
        matter_type: practice,
        practice_area: practice,
        priority: values.priority || 'medium',
        next_hearing: values.nextHearing || null,
        initial_filing_date: values.initial_filing_date || null,
        date_of_loss: values.date_of_loss || null,
        trial_date: values.trial_date || null,
        case_number: values.case_number || null,
        judge_name: values.judge_name || null,
        court_name: values.court_name || null,
        court_address: values.court_address || null,
        updated_by_user_id: uid,
        custom_fields: Object.keys(values).filter(k => k.startsWith('cf_')).map(k => ({
          field_id: k.replace('cf_', ''),
          value: values[k]
        }))
      });
      toast('Matter updated successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'compose-email': {
      if (!uid) throw new Error('Not signed in.');
      const mid = values.matterId || modalData?.matterId;
      if (!mid) throw new Error('Select a related matter, or open a matter and use Send Email from that workspace.');
      const visibility = values.visibility === 'Shared' || values.visibility === 'client_shared' ? 'client_shared' : 'internal';
      
      let messageBody = `To: ${values.to || ''}\n`;
      if (values.cc) messageBody += `Cc: ${values.cc}\n`;
      if (values.bcc) messageBody += `Bcc: ${values.bcc}\n`;
      messageBody += `Subject: ${values.subject || ''}\n\n${values.message || ''}`;

      if (selectedFiles && selectedFiles.length > 0) {
        const form = new FormData();
        const metadataList = [];
        for (const file of selectedFiles) {
          form.append('files', file);
          metadataList.push({
            matter_id: parseInt(String(mid), 10),
            category: 'Email Attachment',
            visibility: visibility,
            uploaded_by_user_id: String(uid),
          });
        }
        form.append('metadata', JSON.stringify(metadataList));
        
        try {
          const res = await api.documents.createBulk(form);
          const results = res.data || [];
          const successes = results.filter(r => r.status === 'success');
          
          if (successes.length > 0) {
            messageBody += '\n\nAttachments:';
            for (const doc of successes) {
              messageBody += `\n[attachment:${doc.document?.id}:${doc.document?.original_name || doc.document?.file_name}]`;
            }
          }
          
          const failures = results.length - successes.length;
          if (failures > 0) {
            toast(`Uploaded ${successes.length} attachments, ${failures} failed.`, 'warning');
          }
        } catch (uploadErr) {
          console.error('Attachment upload failed:', uploadErr);
          toast('Failed to upload some attachments, but email logging will proceed.', 'warning');
        }
      }

      await api.communications.create({
        matter_id: String(mid).startsWith('act_') ? null : parseInt(String(mid), 10),
        activity_id: String(mid).startsWith('act_') ? parseInt(String(mid).replace('act_', ''), 10) : null,
        communication_type: 'email_log',
        visibility,
        message_body: messageBody,
        to: values.to ? values.to.split(',').map(s => s.trim()).filter(Boolean) : [],
        cc: values.cc ? values.cc.split(',').map(s => s.trim()).filter(Boolean) : [],
        bcc: values.bcc ? values.bcc.split(',').map(s => s.trim()).filter(Boolean) : [],
      });
      toast('Email record logged on matter.', 'success');
      dispatchRefresh();
      break;
    }
    case 'add-note': {
      if (!uid) throw new Error('Not signed in.');
      const mid = values.matterId || modalData?.matterId;
      if (!mid) throw new Error('Open a matter to add notes.');
      const visibility = values.visibility === 'Shared' || values.visibility === 'client_shared' ? 'client_shared' : 'internal';
      await api.communications.create({
        matter_id: String(mid).startsWith('act_') ? null : parseInt(String(mid), 10),
        activity_id: String(mid).startsWith('act_') ? parseInt(String(mid).replace('act_', ''), 10) : null,
        communication_type: 'note',
        visibility,
        message_body: `${values.title || 'Note'}\n\n${values.content || ''}`,
      });
      toast('Matter note added successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'log-call': {
      if (!uid) throw new Error('Not signed in.');
      const mid = values.matterId || modalData?.matterId;
      if (!mid) throw new Error('Open a matter to log a call.');
      const map = { Call: 'call_log', Meeting: 'meeting_log', Video: 'call_log' };
      const communication_type = map[values.type] || 'call_log';
      const visibility = values.visibility === 'Shared' || values.visibility === 'client_shared' ? 'client_shared' : 'internal';
      await api.communications.create({
        matter_id: String(mid).startsWith('act_') ? null : parseInt(String(mid), 10),
        activity_id: String(mid).startsWith('act_') ? parseInt(String(mid).replace('act_', ''), 10) : null,
        communication_type,
        visibility,
        message_body: `[${values.direction || ''}] ${values.subject || ''}\n\n${values.notes || ''}`,
      });
      toast('Communication logged successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'add-event': {
      if (!uid) throw new Error('Not signed in.');
      
      let reminderDate = null;
      if (values.reminderOffset) {
        const evDateStr = values.date || new Date().toISOString().split('T')[0];
        const evTimeStr = values.time || '00:00';
        const eventDate = new Date(`${evDateStr}T${evTimeStr}:00`);
        const offsetMap = {
          '1_hour': 60 * 60 * 1000,
          '1_day': 24 * 60 * 60 * 1000,
          '3_days': 3 * 24 * 60 * 60 * 1000,
          '7_days': 7 * 24 * 60 * 60 * 1000
        };
        if (values.reminderOffset === 'same_day') {
          reminderDate = new Date(eventDate);
          reminderDate.setHours(9, 0, 0, 0); // 9 AM same day
        } else if (offsetMap[values.reminderOffset]) {
          reminderDate = new Date(eventDate.getTime() - offsetMap[values.reminderOffset]);
        } else if (values.reminderOffset === 'custom' && values.customReminderDate) {
          reminderDate = new Date(values.customReminderDate);
        }
      }

      await api.calendar.create({
        title: values.title || 'Event',
        date: values.date || new Date().toISOString().split('T')[0],
        time: values.time || null,
        matter_id: values.matterId && !String(values.matterId).startsWith('act_') ? values.matterId : null,
        activity_id: values.matterId && String(values.matterId).startsWith('act_') ? parseInt(String(values.matterId).replace('act_', ''), 10) : null,
        type: values.eventType === 'other'
          ? (values.custom_event_type || '').toLowerCase().replace(/ /g, '_')
          : (values.eventType || 'meeting').toLowerCase().replace(/ /g, '_'),
        description: values.notes || null,
        reminder_date: reminderDate ? reminderDate.toISOString() : null,
        create_task: values.createTask === 'on' || values.createTask === true,
        court_name: values.court_name || null,
        court_room: values.court_room || null,
        judge_name: values.judge_name || null,
        appearance_type: values.appearance_type === 'other'
          ? (values.custom_appearance_type || '').trim()
          : (values.appearance_type || null),
        is_court_event: values.is_court_event === 'on' || values.is_court_event === true,
        attendees: [
          ...(Array.isArray(values.internalAttendees) ? values.internalAttendees : [values.internalAttendees]).filter(Boolean).map(id => ({ user_id: id })),
          ...(values.externalAttendees || '').split(',').map(e => e.trim()).filter(Boolean).map(email => ({ email }))
        ]
      });
      toast('Event added to calendar!', 'success');
      dispatchRefresh();
      break;
    }
    case 'add-folder': {
      if (!uid) throw new Error('Not signed in.');
      await api.folders.create({
        name: values.name,
        matterId: values.matterId || null,
        accessLevel: values.accessLevel || 'Public'
      });
      toast('Folder created successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'add-user': {
      if (!uid) throw new Error('Not signed in.');
      const fullName = `${values.firstName || ''} ${values.lastName || ''}`.trim();
      const role = String(values.roleLabel || '').toLowerCase();

      if (role === 'client') {
        // Create Party (this backend service already creates a User with 'client' role)
        await api.clients.create({
          full_name: fullName,
          email: values.email,
          phone: values.phone || null,
          password: values.password || undefined,
        });
        toast(`Party account created for ${fullName}`, 'success');
      } else {
        // Create Staff User (Admin/Lawyer)
        const specialtyVal = values.specialty === 'other'
          ? (values.custom_specialty || '').trim()
          : (values.specialty || null);

        await api.users.create({
          full_name: fullName,
          email: values.email,
          role: role,
          password: values.password || '1234',
          practice_focus: specialtyVal,
        });
        toast(`${values.roleLabel} account created for ${fullName}`, 'success');
      }
      dispatchRefresh();
      break;
    }
    case 'reset-password': {
      if (!uid) throw new Error('Not signed in.');
      const id = modalData?.id || modalData?.raw?.id;
      if (!id) throw new Error('Missing user ID.');
      if (!values.newPassword) throw new Error('Password cannot be empty.');
      await api.users.resetPassword(id, { newPassword: values.newPassword });
      toast('Password reset successfully!', 'success');
      break;
    }
    case 'add-task': {
      const taskTypeVal = values.task_type === 'other'
        ? (values.custom_task_type || '').trim()
        : (values.task_type || 'general');
      const mid = values.matterId || modalData?.matterId;
      await api.tasks.create({
        matter_id: mid && !String(mid).startsWith('act_') ? mid : null,
        activity_id: mid && String(mid).startsWith('act_') ? parseInt(String(mid).replace('act_', ''), 10) : null,
        title: values.title,
        description: values.description,
        priority: values.priority || 'medium',
        task_type: taskTypeVal,
        due_date: values.due_date ? new Date(values.due_date).toISOString() : null,
        assigned_user_id: values.assigned_user_id || null,
      });
      toast('Task created successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'add-template': {
      if (!uid) throw new Error('Not signed in.');
      const catVal = values.category === 'other'
        ? (values.custom_category || '').trim()
        : (values.category || 'court_form');
      const paVal = values.practice_area === 'other'
        ? (values.custom_practice_area || '').trim()
        : (values.practice_area || null);
      await api.templates.create({
        title: values.title,
        content: values.content,
        category: catVal,
        practice_area: paVal,
        matter_type: paVal,
        description: values.description || null,
        is_active: values.is_active !== 'inactive',
      });
      toast('Template created successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'edit-template': {
      if (!uid) throw new Error('Not signed in.');
      const catVal = values.category === 'other'
        ? (values.custom_category || '').trim()
        : (values.category || 'court_form');
      const paVal = values.practice_area === 'other'
        ? (values.custom_practice_area || '').trim()
        : (values.practice_area || null);
      
      const templateId = modalData?.id;
      if (!templateId) throw new Error('Missing template ID.');

      await api.templates.update(templateId, {
        title: values.title,
        content: values.content,
        category: catVal,
        practice_area: paVal,
        matter_type: paVal,
        description: values.description || null,
        is_active: values.is_active !== 'inactive',
      });
      toast('Template updated successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'use-template': {
      if (!uid) throw new Error('Not signed in.');
      const templateId = modalData?.id;
      if (!templateId) throw new Error('Missing template.');

      // Use targetMatterId if provided (from the matter detail page)
      const targetMatterId = modalData.targetMatterId;
      if (!targetMatterId) throw new Error('Missing target matter.');

      await api.templates.cloneToMatter({
        template_id: templateId,
        matter_id: Number(targetMatterId)
      });

      toast('New draft created from template!', 'success');
      dispatchRefresh();
      break;
    }
    case 'edit-draft': {
      if (!uid) throw new Error('Not signed in.');
      const draftId = modalData?.id || modalData?.raw?.id;
      if (!draftId) throw new Error('Missing draft.');
      
      const catVal = values.category === 'other'
        ? (values.custom_category || '').trim()
        : (values.category || 'General');

      await api.drafts.update(draftId, {
        title: values.title,
        category: catVal,
        content: values.content,
      });

      toast('Draft updated successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'conflict-check': {
      if (!uid) throw new Error('Not signed in.');
      const res = await api.conflicts.check({
        prospective_client_name: values.prospectiveClient,
        opposing_party_name: values.opposingParty,
      });
      if (res.data?.conflict) {
        toast(`⚠️ Conflict found! ${res.data.matches.length} potential matches detected.`, 'error');
      } else {
        toast('✅ No conflict found. Safe to proceed.', 'success');
      }
      break;
    }
    case 'add-practice-area': {
      await api.practiceAreas.create({
        name: values.name,
        is_active: values.status !== 'inactive'
      });
      toast('Practice Area created successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'edit-practice-area': {
      const id = modalData?.id;
      if (!id) throw new Error('Missing ID');
      await api.practiceAreas.update(id, {
        name: values.name,
        is_active: values.status !== 'inactive'
      });
      toast('Practice Area updated!', 'success');
      dispatchRefresh();
      break;
    }
    case 'add-custom-field': {
      await api.customFields.create({
        name: values.name,
        type: values.type,
        options: values.options ? values.options.split(',').map(s => s.trim()) : null,
        is_active: values.status !== 'inactive'
      });
      toast('Custom Field created successfully!', 'success');
      dispatchRefresh();
      break;
    }
    case 'edit-custom-field': {
      const id = modalData?.id;
      if (!id) throw new Error('Missing ID');
      await api.customFields.update(id, {
        name: values.name,
        type: values.type,
        options: values.options ? values.options.split(',').map(s => s.trim()) : null,
        is_active: values.status !== 'inactive'
      });
      toast('Custom Field updated!', 'success');
      dispatchRefresh();
      break;
    }
    case 'browse-templates': {
      // This is a selection modal, handled by onSave in AdminPages if needed, 
      // but here we just need it to be a valid case for the switch.
      break;
    }
    case 'view-event': {
      const eventId = modalData?.raw_id || modalData?.id;
      if (eventId) {
        await api.calendar.acknowledge(eventId);
        toast('Calendar Event acknowledged.', 'success');
        dispatchRefresh();
      } else {
        toast('This event is not linked to a database record.', 'info');
      }
      break;
    }
    case 'view-invoice':
      break;
    case 'pay-invoice': {
      const dbId = modalData?.dbId;
      if (dbId) {
        await api.billing.payInvoice(dbId, {
          payment_method: 'manual',
          payment_reference: values.payment_reference || 'internal-manual',
        });
        toast('Payment marked as paid.', 'success');
        dispatchRefresh();
      } else {
        toast('This invoice is not linked to a database record.', 'info');
      }
      break;
    }
    default:
      toast('This action is not wired to the API yet.', 'info');
  }
}

function ViewInvoicePdfEmbed({ dbId, toast }) {
  const [src, setSrc] = useState(null);
  const [loadErr, setLoadErr] = useState(null);
  const urlRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!dbId) {
      setSrc(null);
      setLoadErr(null);
      return undefined;
    }
    let cancelled = false;
    setSrc(null);
    setLoadErr(null);
    (async () => {
      try {
        const { blob } = await api.billing.downloadInvoicePdf(dbId);
        if (cancelled) return;
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const u = URL.createObjectURL(blob);
        urlRef.current = u;
        setSrc(u);
      } catch (e) {
        if (!cancelled) {
          const msg = e.message || 'Failed to load PDF';
          setLoadErr(msg);
          toast(msg, 'error');
        }
      }
    })();
    return () => {
      cancelled = true;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbId]);

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownload = async () => {
    try {
      const { blob, filename } = await api.billing.downloadInvoicePdf(dbId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast('Failed to download invoice', 'error');
    }
  };

  if (!dbId) return null;
  if (loadErr) return <p className="text-[12px] text-red-600 mt-3">{loadErr}</p>;
  if (!src) return <p className="text-[12px] text-slate-500 mt-3">Loading PDF…</p>;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[13px] font-700 text-slate-900">Live Preview</h4>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[12px] font-600 hover:bg-slate-50 transition-all shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>
            Print
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-[12px] font-600 hover:bg-primary-700 transition-all shadow-sm shadow-primary-500/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Download
          </button>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 bg-slate-100 p-2 sm:p-4">
        <iframe ref={iframeRef} title="Invoice PDF" src={src} className="w-full h-[min(540px,65vh)] bg-white rounded-lg shadow-inner ring-1 ring-slate-900/5" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MODAL SYSTEM
// ─────────────────────────────────────────────────────────
function AppModal({ type, data, onClose, toast, onSave, navigate, role, user, lookups, openModal }) {
  const [isValid, setIsValid] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState({});
  const formRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [uploadQueue, setUploadQueue] = useState([]);
  const [isUploadingQueue, setIsUploadingQueue] = useState(false);
  const abortControllersRef = useRef({});

  const filesInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const parseDroppedItems = async (dataTransfer) => {
    const files = [];
    const entries = [];
    
    if (dataTransfer.items) {
      for (let i = 0; i < dataTransfer.items.length; i++) {
        const item = dataTransfer.items[i];
        if (item.kind === 'file') {
          const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null;
          if (entry) {
            entries.push(entry);
          }
        }
      }
    } else if (dataTransfer.files) {
      return Array.from(dataTransfer.files);
    }

    const traverseEntry = async (entry, relativePath = "") => {
      if (entry.isFile) {
        const file = await new Promise((resolve, reject) => {
          entry.file(resolve, reject);
        });
        const pathValue = relativePath ? `${relativePath}/${file.name}` : file.name;
        Object.defineProperty(file, 'webkitRelativePath', {
          value: pathValue,
          configurable: true,
          writable: true
        });
        files.push(file);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const readAllEntries = async () => {
          let allEntries = [];
          const readBatch = async () => {
            const results = await new Promise((resolve, reject) => {
              reader.readEntries(resolve, reject);
            });
            if (results.length > 0) {
              allEntries = allEntries.concat(results);
              await readBatch();
            }
          };
          await readBatch();
          return allEntries;
        };
        const childEntries = await readAllEntries();
        const currentPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        for (const child of childEntries) {
          await traverseEntry(child, currentPath);
        }
      }
    };

    for (const entry of entries) {
      await traverseEntry(entry);
    }
    return files;
  };

  const handleFilesSelection = (files) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const uploadSingleFile = async (item, matterId, category, visibility, uid) => {
    const controller = new AbortController();
    abortControllersRef.current[item.id] = controller;
    
    const form = new FormData();
    form.append('file', item.file);
    form.append('matter_id', String(matterId));
    form.append('category', category);
    form.append('visibility', visibility);
    form.append('uploaded_by_user_id', String(uid));
    
    let folder_path = null;
    if (item.relativePath) {
      const parts = item.relativePath.split('/');
      if (parts.length > 1) {
        folder_path = parts.slice(0, -1).join('/');
      }
    }
    if (folder_path) {
      form.append('folder_path', folder_path);
    }
    
    try {
      await api.documents.create(form, {
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: percentCompleted } : q));
        }
      });
      
      setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q));
    } catch (err) {
      if (controller.signal.aborted) {
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'failed', error: 'Upload cancelled.' } : q));
      } else {
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'failed', error: err.response?.data?.message || err.message } : q));
      }
      throw err;
    } finally {
      delete abortControllersRef.current[item.id];
    }
  };

  const startQueueUpload = async (filesList, matterId, category, visibility, uid) => {
    const initialQueue = filesList.map((file, idx) => ({
      id: `${Date.now()}_${idx}_${file.name}`,
      file,
      name: file.name,
      relativePath: file.webkitRelativePath || file.name,
      size: file.size,
      progress: 0,
      status: 'pending',
      error: null
    }));
    
    setUploadQueue(initialQueue);
    
    const pending = [...initialQueue];
    const active = [];
    const maxConcurrency = 3;
    
    const runNext = async () => {
      if (pending.length === 0 && active.length === 0) {
        return;
      }
      
      while (pending.length > 0 && active.length < maxConcurrency) {
        const item = pending.shift();
        active.push(item);
        
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading' } : q));
        
        uploadSingleFile(item, matterId, category, visibility, uid)
          .then(() => {
            active.splice(active.indexOf(item), 1);
            runNext();
          })
          .catch(() => {
            active.splice(active.indexOf(item), 1);
            runNext();
          });
      }
    };
    
    runNext();
  };

  const cancelAllQueue = () => {
    Object.values(abortControllersRef.current).forEach(c => c.abort());
    setUploadQueue(prev => prev.map(q => 
      q.status === 'pending' || q.status === 'uploading' 
        ? { ...q, status: 'failed', error: 'Cancelled' } 
        : q
    ));
  };

  const retryFailedItem = (item, matterId, category, visibility, uid) => {
    setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'pending', progress: 0, error: null } : q));
    uploadSingleFile(item, matterId, category, visibility, uid).catch(() => {});
  };

  const [showDeleteEventConfirm, setShowDeleteEventConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (formRef.current) setIsValid(formRef.current.checkValidity());

    // Section 22 Auto-Draft Recovery
    const formKeys = ['add-client', 'add-case', 'add-matter', 'create-invoice', 'trust-deposit', 'add-time-entry', 'add-lead'];
    if (formKeys.includes(type)) {
      const draft = loadDraft(type);
      if (draft && Object.keys(draft).length > 0) {
        setHasDraft(true);
        setTimeout(() => {
          if (formRef.current) {
            Object.entries(draft).forEach(([k, v]) => {
              const el = formRef.current.elements[k];
              if (el && v != null && v !== '' && (!data || !data[k])) {
                el.value = v;
              }
            });
            const fd = new FormData(formRef.current);
            setFormState(Object.fromEntries(fd.entries()));
          }
        }, 100);
      } else {
        setHasDraft(false);
      }
    } else {
      setHasDraft(false);
    }
  }, [type, data]);

  const handleChange = () => {
    if (formRef.current) {
      setIsValid(formRef.current.checkValidity());
      const fd = new FormData(formRef.current);
      const values = Object.fromEntries(fd.entries());
      setFormState(values);
      const formKeys = ['add-client', 'add-case', 'add-matter', 'create-invoice', 'trust-deposit', 'add-time-entry', 'add-lead'];
      if (formKeys.includes(type)) {
        saveDraft(type, values);
        setHasDraft(true);
      }
    }
  };

  const [practiceAreas, setPracticeAreas] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [documentCategories, setDocumentCategories] = useState([]);
  
  const [loadingLookups, setLoadingLookups] = useState(true);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) { setLoadingLookups(true); isFirstLoad.current = false; }
    setSelectedFiles([]);
    const promises = [];
    if (type === 'add-case' || type === 'edit-case' || type === 'add-lead') {
      promises.push(
        api.practiceAreas.list({ active: 'true' })
          .then(res => setPracticeAreas(res.data || []))
          .catch(() => {})
      );
    }
    if (type === 'add-case' || type === 'edit-case') {
      promises.push(
        api.customFields.list({ active: 'true' })
          .then(res => setCustomFields(res.data || []))
          .catch(() => {})
      );
    }
    if (type === 'add-document' || type === 'edit-document') {
      promises.push(
        api.documentCategories.list({ active: 'true' })
          .then(res => setDocumentCategories(res.data || []))
          .catch(() => {})
      );
    }

    Promise.all(promises).finally(() => {
      setLoadingLookups(false);
    });
  }, [type]);

  const clientRows = lookups?.clients?.length ? lookups.clients : [];
  const matterRows = lookups?.matters?.length ? lookups.matters : [];
  const lawyerRows = lookups?.lawyers?.length ? lookups.lawyers : [];

  if (!type) return null;

  if (loadingLookups) {
    return (
      <Modal title="Loading..." onClose={onClose} wide={false} footer={<button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>}>
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30" />
        </div>
      </Modal>
    );
  }

  const recordOptions = (
    <>
      <option disabled className="font-700 text-white/50 bg-[#05080f]">── Legal Matters ──</option>
      {matterRows.map((m) => <option key={m.id} value={m.id}>{m.matter_number} — {m.title}</option>)}
      
      {lookups?.activities?.length > 0 && (
        <>
          <option disabled className="font-700 text-white/50 bg-[#05080f] mt-2">── Activities ──</option>
          {lookups.activities.map((a) => <option key={`act_${a.id}`} value={`act_${a.id}`}>{a.type} — {a.title}</option>)}
        </>
      )}
    </>
  );

  const modals = {
    'add-task': {
      title: 'Add New Task', wide: false,
      body: <>
        <div className="mb-3"><Field label="Task Title" required><Input name="title" placeholder="E.g., Prepare evidence summary" required /></Field></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Priority" required><Select name="priority" required><option value="medium">Medium</option><option value="high">High</option><option value="low">Low</option></Select></Field>
          <Field label="Task Type"><Select name="task_type"><option value="general">General</option><option value="filing_deadline">Filing Deadline</option><option value="trial_preparation">Trial Preparation</option><option value="court_appearance">Court Appearance</option><option value="other">Other...</option></Select></Field>
        </div>
        {formState.task_type === 'other' && (
          <div className="mb-3">
            <Field label="Custom Task Type" required>
              <Input name="custom_task_type" placeholder="E.g., Party meeting" required />
            </Field>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Related Record"><Select name="matterId" defaultValue={data?.matterId || ''}><option value="">None</option>{recordOptions}</Select></Field>
          <Field label="Due Date" required><Input name="due_date" type="date" required /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Assigned To" required>
            <Select name="assigned_user_id" required>
              <option value="">Select lawyer...</option>
              {lawyerRows.map((u) => <option key={u.id} value={u.user_id || u.id}>{u.full_name || u.display_name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Description"><Textarea name="description" rows={3} placeholder="Describe the task details..." /></Field>
      </>,
    },
    'add-lead': {
      title: 'Add New Lead', wide: false,
      body: <>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="First Name" required><Input name="firstName" placeholder="John" required /></Field>
          <Field label="Last Name" required><Input name="lastName" placeholder="Doe" required /></Field>
        </div>
        <div className="mb-3">
          <Field label="Email Address" required><Input name="email" type="email" placeholder="john@example.com" required /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Phone"><Input name="phone" placeholder="+1 (555) 000-0000" /></Field>
          <Field label="Lead Source"><Input name="source" placeholder="Referral, Website, etc." /></Field>
        </div>
        <div className="mb-3">
          <Field label="Matter Type">
            <Select name="matterType">
              {practiceAreas.length > 0 ? practiceAreas.map(pa => (
                <option key={pa.id} value={pa.name}>{pa.name}</option>
              )) : (
                <><option>Civil Litigation</option><option>Family Law</option><option>Corporate</option><option>Real Estate</option><option>Employment</option><option>Intellectual Property</option></>
              )}
              <option value="other">Other...</option>
            </Select>
          </Field>
        </div>
        {formState.matterType === 'other' && (
          <div className="mb-3">
            <Field label="Custom Matter Type" required>
              <Input name="custom_matter_type" placeholder="E.g., Immigration Law" required />
            </Field>
          </div>
        )}
        <div className="mb-3">
          <Field label="Message / Inquiry"><Textarea name="message" rows={3} placeholder="Prospect's initial message or inquiry..." /></Field>
        </div>
        <Field label="Internal Notes"><Textarea name="notes" rows={2} placeholder="Internal screening notes..." /></Field>
      </>,
      onSave: () => toast('Lead added successfully!', 'success'),
    },
    'add-client': {
      title: 'Add New Client', wide: false,
      body: <>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Client Type" required>
            <Select name="party_type" required defaultValue="Individual">
              <option value="Individual">Individual</option>
              <option value="Organization">Organization</option>
            </Select>
          </Field>
          <Field label="Client Role" required>
            <Select name="party_role" required defaultValue="Client">
              <option value="Client">Client</option>
              <option value="Plaintiff">Plaintiff</option>
              <option value="Defendant">Defendant</option>
              <option value="Petitioner">Petitioner</option>
              <option value="Respondent">Respondent</option>
              <option value="Claimant">Claimant</option>
              <option value="Other">Other</option>
            </Select>
          </Field>
        </div>

        {formState.party_role === 'Other' && (
          <div className="mb-3">
            <Field label="Custom Client Role" required>
              <Input name="custom_party_role" placeholder="Enter custom role..." required />
            </Field>
          </div>
        )}

        {formState.party_type === 'Organization' ? (
          <>
            <div className="mb-3"><Field label="Organization Name" required><Input name="organization_name" placeholder="Acme Corp" required /></Field></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Contact First Name"><Input name="contact_first_name" placeholder="John" /></Field>
              <Field label="Contact Last Name"><Input name="contact_last_name" placeholder="Doe" /></Field>
            </div>
            <div className="mb-3"><Field label="Business Address"><Input name="business_address" placeholder="123 Corporate Blvd" /></Field></div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="First Name" required><Input name="firstName" placeholder="John" required /></Field>
            <Field label="Last Name" required><Input name="lastName" placeholder="Doe" required /></Field>
          </div>
        )}

        <div className="mb-3"><Field label="Email Address" required><Input name="email" type="email" placeholder="john@example.com" required /></Field></div>
        <div className="mb-3"><Field label="Phone"><Input name="phone" placeholder="+1 (555) 000-0000" /></Field></div>
        <div className="mb-3"><Field label="Home Address"><Input name="home_address" placeholder="456 Main St, City" /></Field></div>
        
        <div className="mb-3"><Field label="Opposing Party Name"><Input name="opposing_party_name" placeholder="Opposing Party Name" /></Field></div>
        <div className="mb-3"><Field label="Opposing Law Firm & Contacts"><Input name="opposing_law_firm" placeholder="Firm Name / Phone / Email" /></Field></div>
        <div className="mb-3"><Field label="Opposing Counsel"><Input name="opposing_counsel_name" placeholder="Attorney Name, Esq." /></Field></div>

        <Field label="Notes"><Textarea name="notes" rows={3} placeholder="Initial notes..." /></Field>
      </>,
      onSave: () => toast('Client added successfully!', 'success'),
    },
    'edit-client': {
      title: data ? `Edit Client: ${data.full_name || data.name || ''}` : 'Edit Client', wide: false,
      body: (() => {
        const predefinedRoles = ['Client', 'Plaintiff', 'Defendant', 'Petitioner', 'Respondent', 'Claimant'];
        const isCustomRole = data?.party_role && !predefinedRoles.includes(data.party_role);
        const defaultRoleValue = isCustomRole ? 'Other' : (data?.party_role || 'Client');
        const showCustomRole = (formState.party_role || defaultRoleValue) === 'Other';

        return (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Client Type" required>
                <Select name="party_type" required defaultValue={data?.party_type || 'Individual'}>
                  <option value="Individual">Individual</option>
                  <option value="Organization">Organization</option>
                </Select>
              </Field>
              <Field label="Client Role" required>
                <Select name="party_role" required defaultValue={defaultRoleValue}>
                  <option value="Client">Client</option>
                  <option value="Plaintiff">Plaintiff</option>
                  <option value="Defendant">Defendant</option>
                  <option value="Petitioner">Petitioner</option>
                  <option value="Respondent">Respondent</option>
                  <option value="Claimant">Claimant</option>
                  <option value="Other">Other</option>
                </Select>
              </Field>
            </div>

            {showCustomRole && (
              <div className="mb-3">
                <Field label="Custom Client Role" required>
                  <Input name="custom_party_role" defaultValue={data?.party_role || ''} placeholder="Enter custom role..." required />
                </Field>
              </div>
            )}

            {(formState.party_type || data?.party_type) === 'Organization' ? (
              <>
                <div className="mb-3"><Field label="Organization Name" required><Input name="organization_name" defaultValue={data?.organization_name || data?.full_name || ''} required /></Field></div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="Contact First Name"><Input name="contact_first_name" defaultValue={data?.contact_first_name || ''} /></Field>
                  <Field label="Contact Last Name"><Input name="contact_last_name" defaultValue={data?.contact_last_name || ''} /></Field>
                </div>
                <div className="mb-3"><Field label="Business Address"><Input name="business_address" defaultValue={data?.business_address || ''} /></Field></div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="First Name" required><Input name="firstName" defaultValue={data?.full_name ? data.full_name.split(' ')[0] : (data?.name ? data.name.split(' ')[0] : '')} required /></Field>
                <Field label="Last Name" required><Input name="lastName" defaultValue={data?.full_name ? data.full_name.split(' ').slice(1).join(' ') : (data?.name ? data.name.split(' ').slice(1).join(' ') : '')} required /></Field>
              </div>
            )}

            <div className="mb-3"><Field label="Email Address" required><Input name="email" type="email" defaultValue={data ? data.email : ''} required /></Field></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Phone"><Input name="phone" defaultValue={data ? data.phone : ''} /></Field>
              <Field label="Status">
                <Select name="status" defaultValue={data ? (data.status === 'pending' ? 'pending' : data.is_portal_enabled === false ? 'inactive' : 'active') : 'active'}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </Field>
            </div>
            <div className="mb-3"><Field label="Home Address"><Input name="home_address" defaultValue={data?.home_address || ''} /></Field></div>
            
            <div className="mb-3"><Field label="Opposing Party Name"><Input name="opposing_party_name" defaultValue={data?.opposing_party_name || ''} placeholder="Opposing Party Name" /></Field></div>
            <div className="mb-3"><Field label="Opposing Law Firm & Contacts"><Input name="opposing_law_firm" defaultValue={data?.opposing_law_firm || ''} placeholder="Firm Name / Phone / Email" /></Field></div>
            <div className="mb-3"><Field label="Opposing Counsel"><Input name="opposing_counsel_name" defaultValue={data?.opposing_counsel_name || ''} placeholder="Attorney Name, Esq." /></Field></div>

            <Field label="Notes"><Textarea name="notes" rows={3} defaultValue={data?.notes || ''} /></Field>
          </>
        );
      })(),
      onSave: () => toast('Client updated successfully!', 'success'),
    },
    'add-case': {
      title: 'Create New Matter', wide: true,
      body: <>
        <div className="mb-3"><Field label="Matter Title" required><Input name="title" placeholder="Plaintiff vs. Defendant" required /></Field></div>
        <div className="mb-3">
          <Field label="Clients" required>
            <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 max-h-[160px] overflow-y-auto space-y-2.5 custom-scrollbar">
              {clientRows.length > 0 ? (
                clientRows.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 cursor-pointer group text-white">
                    <input 
                      type="checkbox" 
                      name="clientIds" 
                      value={c.id} 
                      className="w-4.5 h-4.5 rounded border-white/20 bg-white/5 text-[#38bdf8] focus:ring-0 cursor-pointer accent-[#38bdf8]" 
                    />
                    <span className="text-[13px] font-700 tracking-tight group-hover:text-[#38bdf8] transition-colors">
                      {c.full_name || c.name} <span className="text-[11px] text-[#8a94a6] font-800 uppercase tracking-widest ml-1.5 opacity-60">({c.party_role || 'Client'})</span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-[12px] text-[#8a94a6] font-800 uppercase tracking-widest p-2 opacity-50">No registered parties found</p>
              )}
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Assigned Lawyer"><Select name="lawyerId"><option value="">Unassigned</option>{lawyerRows.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}</Select></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Case Type">
            <Select name="matterType">
              {practiceAreas.length > 0 ? practiceAreas.map(pa => (
                <option key={pa.id} value={pa.name}>{pa.name}</option>
              )) : (
                <>
                  <option>Personal Injury</option>
                  <option>Immigration</option>
                  <option>Property Damage</option>
                  <option>Unlawful Detainer</option>
                  <option>Employment</option>
                  <option>Business</option>
                  <option>Wrongful Death</option>
                  <option>Medical Malpractice</option>
                  <option>Contracts</option>
                  <option>Civil Rights</option>
                </>
              )}
              <option value="other">Other...</option>
            </Select>
          </Field>
          <Field label="Priority"><Select name="priority"><option>High</option><option>Medium</option><option>Low</option></Select></Field>
        </div>
        {formState.matterType === 'other' && (
          <div className="mb-3">
            <Field label="Custom Case Type" required>
              <Input name="custom_matter_type" placeholder="E.g., Immigration Law" required />
            </Field>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Initial Filing Date"><Input name="initial_filing_date" type="date" /></Field>
          <Field label="Date of Loss"><Input name="date_of_loss" type="date" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Trial Date"><Input name="trial_date" type="date" /></Field>
          <Field label="Case Number"><Input name="case_number" placeholder="Case #" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Court Name"><Input name="court_name" placeholder="Court Name" /></Field>
          <Field label="Judge Name"><Input name="judge_name" placeholder="Honorable Judge..." /></Field>
        </div>
        <div className="mb-3"><Field label="Court Address"><Input name="court_address" placeholder="Court Address" /></Field></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Opposing party">
            <Select name="opposingParty" value={formState.opposingParty || ''} onChange={handleChange}>
              <option value="">Party</option>
              <option value="Plaintiff">Plaintiff</option>
              <option value="Defendant">Defendant</option>
              <option value="Witness">Witness</option>
              <option value="Insurance Company">Insurance Company</option>
              <option value="Attorney Office">Attorney Office</option>
              <option value="Organization">Organization</option>
              <option value="Business">Business</option>
              <option value="Other">Other</option>
            </Select>
          </Field>
          <Field label="Opened At"><Input name="filed" type="date" /></Field>
        </div>
        {formState.opposingParty === 'Other' && (
          <div className="mb-3">
            <Field label="Custom Opposing Party Name" required>
              <Input name="custom_opposing_party" placeholder="Enter custom opposing party name..." required />
            </Field>
          </div>
        )}
        <Field label="Case Description"><Textarea name="description" rows={3} placeholder="Brief description of the case..." /></Field>
        
        {customFields.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <h4 className="text-[12px] font-900 text-white uppercase tracking-widest mb-3">Custom Fields</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customFields.map(f => (
                <Field key={f.id} label={f.name}>
                  {f.type === 'dropdown' ? (
                    <Select name={`cf_${f.id}`}>
                      <option value="">Select option...</option>
                      {(f.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                  ) : f.type === 'date' ? (
                    <Input type="date" name={`cf_${f.id}`} />
                  ) : f.type === 'number' || f.type === 'currency' ? (
                    <Input type="number" step="any" name={`cf_${f.id}`} placeholder={f.type === 'currency' ? '0.00' : ''} />
                  ) : f.type === 'checkbox' || f.type === 'yes_no' ? (
                    <Select name={`cf_${f.id}`}>
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </Select>
                  ) : (
                    <Input type="text" name={`cf_${f.id}`} />
                  )}
                </Field>
              ))}
            </div>
          </div>
        )}
      </>,
      onSave: () => toast('Case created!', 'success'),
    },
    'compose-email': {
      title: 'Compose Email', wide: false,
      body: <>
        {(matterRows.length > 0 || data?.matterId) && (
          <div className="mb-3">
            {matterRows.length > 0 ? (
              <Field label="Related record" required>
                <Select name="matterId" required defaultValue={data?.matterId || ''}>
                  <option value="">Select record...</option>
                  {recordOptions}
                </Select>
              </Field>
            ) : (
              <input type="hidden" name="matterId" value={data.matterId} />
            )}
          </div>
        )}
        <div className="mb-3"><Field label="To" required><Input name="to" type="email" placeholder="recipient@example.com" required /></Field></div>
        <div className="mb-3"><Field label="Cc"><Input name="cc" placeholder="cc1@example.com, cc2@example.com" /></Field></div>
        <div className="mb-3"><Field label="Bcc"><Input name="bcc" placeholder="bcc1@example.com, bcc2@example.com" /></Field></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Subject" required><Input name="subject" placeholder="Email subject..." required /></Field>
          <Field label="Visibility" required>
            <Select name="visibility" defaultValue="Shared" required>
              <option value="Shared">Shared (Party & Firm)</option>
              <option value="Internal">Internal (Firm Only)</option>
            </Select>
          </Field>
        </div>
        <Field label="Message" required><Textarea name="message" rows={5} placeholder="Write your message..." required /></Field>
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setSelectedFiles(prev => [...prev, ...files]);
            }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-xs">📎 Attach</button>
            <span className="text-[11px] text-slate-400">Max 25MB per file</span>
          </div>
          {selectedFiles.length > 0 && (
            <div className="flex flex-col gap-1 mt-1 p-2 rounded-xl bg-white/[0.03] border border-white/5 max-h-[120px] overflow-y-auto custom-scrollbar">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex justify-between items-center text-[12px] text-white/80">
                  <span className="truncate max-w-[200px]">📄 {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  <button type="button" onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 text-[11px] ml-2">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </>,
      onSave: () => toast('Email sent!', 'success'),
    },
    'preview-document': {
      title: data?.title || 'Attachment Preview', wide: true,
      body: <>
        <div className="flex flex-col items-center justify-center min-h-[300px] max-h-[70vh] overflow-auto p-4 bg-white/[0.02] border border-white/5 rounded-3xl">
          {data?.mime_type?.includes('image') ? (
            <img src={data?.url} alt={data?.title} className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-2xl border border-white/10" />
          ) : data?.mime_type?.includes('pdf') ? (
            <iframe src={data?.url} title={data?.title} className="w-full h-[65vh] bg-white rounded-2xl shadow-2xl" />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-[#8a94a6]">
              <span className="text-5xl mb-4">📄</span>
              <h4 className="text-[14px] font-900 text-white mb-2">Preview Not Available</h4>
              <p className="text-[12px] opacity-60 max-w-xs mx-auto mb-6">This document type ({data?.mime_type || 'unknown'}) cannot be previewed inline.</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { blob, filename } = await api.documents.download(data.id);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename || data.title || 'document.bin';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (e) {
                    toast('Download failed', 'error');
                  }
                }}
                className="btn btn-primary h-10 px-6 text-[11px] font-900 uppercase tracking-widest"
              >
                Download File
              </button>
            </div>
          )}
        </div>
      </>,
    },
    'select-active-case': {
      title: `Select Active Case — ${data?.clientName || 'Client'}`,
      wide: false,
      body: (
        <div className="space-y-4">
          <p className="text-[12px] text-[#8a94a6] font-600">
            This client has <strong className="text-white">{data?.matters?.length || 0} active cases</strong>. Select a case workspace to open directly, or view client card profile:
          </p>

          <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
            {(data?.matters || []).map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  data?.onSelectMatter?.(m.id);
                  onClose();
                }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-[#0057c7]/20 hover:border-[#38bdf8]/40 transition-all cursor-pointer group"
              >
                <div>
                  <p className="text-[13px] font-800 text-white group-hover:text-[#38bdf8] transition-colors">
                    {m.matter_number || `MTR-${m.id}`} — {m.title}
                  </p>
                  <p className="text-[10px] text-[#8a94a6] font-700 uppercase tracking-widest mt-0.5">
                    {m.practice_area || m.matter_type || 'Active Legal Matter'}
                  </p>
                </div>
                <span className="text-[10px] font-900 uppercase tracking-widest px-2.5 py-1 rounded-lg bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                  Open Case →
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                data?.onViewClientProfile?.();
                onClose();
              }}
              className="btn btn-secondary text-[11px] font-800"
            >
              👤 View Client Card
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary text-[11px]">
              Cancel
            </button>
          </div>
        </div>
      ),
    },
    'create-invoice': {
      title: 'Create Invoice', wide: false,
      body: <>
        <div className="mb-3"><Field label="Matter" required><Select name="matterId" required defaultValue={data?.matterId || ''}><option value="">Select matter...</option>{matterRows.map((m) => <option key={m.id} value={m.id}>{m.matter_number} — {m.title}</option>)}</Select></Field></div>
        <div className="mb-3"><Field label="Description" required><Textarea name="description" rows={2} placeholder="Services rendered..." required /></Field></div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount ($)" required><Input name="amount" type="number" min="0" step="0.01" placeholder="0.00" required /></Field>
          <Field label="Due Date" required><Input name="dueDate" type="date" required /></Field>
        </div>
      </>,
      onSave: () => toast('Invoice created!', 'success'),
    },
    'trust-deposit': {
      title: 'Institutional Trust Deposit', wide: false,
      body: <>
        <div className="bg-[#10b981]/5 p-6 rounded-3xl border border-[#10b981]/10 mb-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#10b981]/10 blur-3xl pointer-events-none group-hover:bg-[#10b981]/20 transition-all duration-700" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3m0-4v2m0 16v2" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-900 text-[#10b981] uppercase tracking-[0.2em] mb-1">Escrow Protocol</p>
              <h4 className="text-[15px] font-900 text-white tracking-tighter">Verified Trust Inbound</h4>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Field label="Target Party Entity" required>
            <Select name="client_id" required>
              <option value="">Select institutional entity...</option>
              {clientRows.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </Select>
          </Field>
          <Field label="Associated Matter (Optional)">
            <Select name="matter_id">
              <option value="">Independent Escrow</option>
              {matterRows.map(m => <option key={m.id} value={m.id}>{m.matter_number} — {m.title}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Inbound Valuation ($)" required>
              <Input name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
            </Field>
            <Field label="Execution Date">
              <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </Field>
          </div>
          <Field label="Verification Reference">
            <Input name="reference" placeholder="Check #, Wire ID, etc." />
          </Field>
          <Field label="Institutional Notes">
            <Textarea name="notes" rows={2} placeholder="Additional compliance details..." />
          </Field>
        </div>
      </>,
      onSave: () => toast('Trust deposit reconciled successfully!', 'success'),
    },
    'apply-trust': {
      title: 'Institutional Trust Liquidation', wide: false,
      body: <>
        <div className="bg-[#38bdf8]/5 p-6 rounded-3xl border border-[#38bdf8]/10 mb-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#38bdf8]/10 blur-3xl pointer-events-none group-hover:bg-[#38bdf8]/20 transition-all duration-700" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-900 text-[#38bdf8] uppercase tracking-[0.2em] mb-1">Available Liquid Assets</p>
              <p className="text-[28px] font-900 text-white tracking-tighter">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(data?.balance) || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
          </div>
        </div>
        <input type="hidden" name="trust_account_id" value={data?.id} />
        <div className="space-y-4">
          <Field label="Target Unpaid Statement" required>
            <Select name="invoice_id" required>
              <option value="">Select outstanding invoice...</option>
              {lookups?.invoices?.filter(inv => (inv.status !== 'paid' && inv.status !== 'void') && (inv.due_amount > 0)).map(inv => (
                <option key={inv.id} value={inv.id}>{inv.invoice_number} — {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(inv.due_amount))} (Remaining Balance)</option>
              ))}
            </Select>
          </Field>
          <Field label="Liquidation Amount ($)" required>
            <Input name="amount" type="number" step="0.01" min="0.01" max={Number(data?.balance)} placeholder="0.00" required />
          </Field>
          <div className="p-4 rounded-2xl bg-[#f59e0b]/5 border border-[#f59e0b]/10 flex items-center gap-3">
            <svg className="w-4 h-4 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-[10px] text-[#f59e0b] font-900 uppercase tracking-widest opacity-80">Execution will reduce trust balance and update invoice status.</p>
          </div>
        </div>
      </>,
      onSave: () => toast('Funds successfully liquidated to statement!', 'success'),
    },
    'trust-ledger': {
      title: data ? `Trust Ledger: ${data.client?.full_name}` : 'Trust Ledger', wide: true,
      body: <TrustLedgerView accountId={data?.id} formatUsd={billFormatUsd} />,
      onSave: () => { },
    },
    'add-document': {
      title: 'Upload Document(s)', wide: false,
      body: isUploadingQueue ? (
        <div className="space-y-4 text-white">
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] font-800">Upload Queue Progress</span>
              <span className="text-[12px] font-700 text-[#38bdf8]">
                {uploadQueue.filter(q => q.status === 'completed').length} / {uploadQueue.length} files
              </span>
            </div>
            
            {(() => {
              const total = uploadQueue.length || 1;
              const done = uploadQueue.filter(q => q.status === 'completed').length;
              const failed = uploadQueue.filter(q => q.status === 'failed').length;
              const percent = Math.round((done / total) * 100);
              return (
                <div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#0057c7] h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest mt-2">
                    <span>Overall: {percent}%</span>
                    {failed > 0 && <span className="text-red-400 font-bold">{failed} Failed</span>}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex gap-2">
            {uploadQueue.some(q => q.status === 'pending' || q.status === 'uploading') && (
              <button
                type="button"
                onClick={cancelAllQueue}
                className="btn btn-secondary border-red-500/10 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-[11px] px-3 h-8 uppercase tracking-wider"
              >
                Cancel Remaining
              </button>
            )}
            {uploadQueue.some(q => q.status === 'failed') && (
              <button
                type="button"
                onClick={() => {
                  if (formRef.current) {
                    const fd = new FormData(formRef.current);
                    const values = Object.fromEntries(fd.entries());
                    const category = values.docCategory === 'other' ? (values.custom_doc_category || '').trim() : (values.docCategory || 'General');
                    const visibility = role === 'lawyer' ? 'client_shared' : role === 'client' ? 'client_visible' : 'internal';
                    const failedItems = uploadQueue.filter(q => q.status === 'failed');
                    failedItems.forEach(item => {
                      retryFailedItem(item, values.matterId || data?.matterId, category, visibility, user.id);
                    });
                  }
                }}
                className="btn btn-primary text-[11px] px-3 h-8 uppercase tracking-wider"
              >
                Retry All Failed
              </button>
            )}
          </div>

          <div className="max-h-[220px] overflow-y-auto border border-white/5 bg-white/[0.01] rounded-2xl p-3 space-y-2 custom-scrollbar">
            {uploadQueue.map(item => (
              <div key={item.id} className="flex justify-between items-center text-[12px] bg-white/[0.01] border border-white/5 p-2.5 rounded-xl">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-[12px] font-700 text-white truncate" title={item.relativePath}>{item.relativePath}</p>
                  {item.status === 'uploading' && (
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1.5">
                      <div className="bg-[#38bdf8] h-full transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                  {item.error && (
                    <p className="text-[10px] text-red-400 mt-0.5 truncate">{item.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className={`text-[10px] font-900 uppercase tracking-wider ${
                    item.status === 'completed' ? 'text-emerald-400' :
                    item.status === 'failed' ? 'text-red-400' :
                    item.status === 'uploading' ? 'text-[#38bdf8] animate-pulse' : 'text-[#8a94a6]'
                  }`}>
                    {item.status}
                  </span>
                  {item.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formRef.current) {
                          const fd = new FormData(formRef.current);
                          const values = Object.fromEntries(fd.entries());
                          const category = values.docCategory === 'other' ? (values.custom_doc_category || '').trim() : (values.docCategory || 'General');
                          const visibility = role === 'lawyer' ? 'client_shared' : role === 'client' ? 'client_visible' : 'internal';
                          retryFailedItem(item, values.matterId || data?.matterId, category, visibility, user.id);
                        }
                      }}
                      className="text-[#38bdf8] hover:underline text-[10px] font-extrabold uppercase tracking-wider"
                    >
                      Retry
                    </button>
                  )}
                  {(item.status === 'pending' || item.status === 'uploading') && (
                    <button
                      type="button"
                      onClick={() => abortControllersRef.current[item.id]?.abort()}
                      className="text-red-400 hover:underline text-[10px] font-extrabold uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="text-[12px] text-slate-500 mb-3">Select files or a folder to upload. Folder structures will be preserved.</p>
          
          <div 
            className="p-8 border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer group mb-4"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const files = await parseDroppedItems(e.dataTransfer);
              if (files.length > 0) {
                handleFilesSelection(files);
              }
            }}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8a94a6] group-hover:text-[#38bdf8] group-hover:scale-110 transition-all">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </div>
            <div>
              <p className="text-[13px] text-white font-800">Drag & drop files or folders here</p>
              <p className="text-[11px] text-[#8a94a6] mt-1">or select from your computer</p>
            </div>
            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => filesInputRef.current?.click()}
                className="btn btn-secondary text-[11px] px-3.5 h-8 font-800 uppercase tracking-wider"
              >
                Upload Files
              </button>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="btn btn-secondary text-[11px] px-3.5 h-8 font-800 uppercase tracking-wider"
              >
                Upload Folder
              </button>
            </div>
            <input
              ref={filesInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleFilesSelection(Array.from(e.target.files));
                }
              }}
            />
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleFilesSelection(Array.from(e.target.files));
                }
              }}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="mb-4 max-h-[140px] overflow-y-auto border border-white/5 bg-white/[0.01] rounded-2xl p-3 space-y-1.5 custom-scrollbar">
              <p className="text-[10px] text-[#8a94a6] font-900 uppercase tracking-widest mb-1.5">Selected Items ({selectedFiles.length})</p>
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex justify-between items-center text-[12px] text-white/80 bg-white/[0.01] border border-white/5 px-2.5 py-1.5 rounded-xl">
                  <span className="truncate max-w-[300px]">
                    📎 {file.webkitRelativePath || file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-300 ml-2 font-bold text-[11px] uppercase tracking-wider"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Related Matter" required><Select name="matterId" required defaultValue={data?.matterId || ''}><option value="">Select matter...</option>{matterRows.map((m) => <option key={m.id} value={m.id}>{m.matter_number}</option>)}</Select></Field>
            <Field label="Document Category">
              <Select name="docCategory" defaultValue={data?.docCategory || 'General'}>
                <option value="General">General</option>
                <option value="Complaint">Complaint</option>
                <option value="Evidence">Evidence</option>
                <option value="Contract">Contract</option>
                <option value="Court order">Court order</option>
                {documentCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                {(lookups?.folders || []).map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                <option value="other">Other...</option>
              </Select>
            </Field>
          </div>
          {formState.docCategory === 'other' && (
            <div className="mb-3">
              <Field label="Custom Document Category" required>
                <Input name="custom_doc_category" placeholder="E.g., Affidavits" required />
              </Field>
            </div>
          )}
        </>
      ),
      onSave: null,
    },
    'add-folder': {
      title: 'Create New Folder', wide: false,
      body: <>
        <div className="mb-3"><Field label="Folder Name" required><Input name="name" placeholder="E.g., Financial Records" required /></Field></div>
        <Field label="Related Matter"><Select name="matterId"><option value="">None</option>{matterRows.map((m) => <option key={m.id} value={m.id}>{m.matter_number}</option>)}</Select></Field>
        <div className="mt-3"><Field label="Access Level"><Select name="accessLevel"><option value="Public">Public (All team)</option><option value="Private">Private (Only you)</option></Select></Field></div>
      </>,
      onSave: () => toast('Folder created successfully!', 'success'),
    },
    'add-event': {
      title: 'Add Calendar Event', wide: false,
      body: <>
        <div className="mb-3"><Field label="Event Title"><Input name="title" placeholder="Hearing, Meeting, Deadline..." /></Field></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Date"><Input name="date" type="date" /></Field>
          <Field label="Time"><Input name="time" type="time" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Event Type">
            <Select name="eventType">
              <option>Court Date</option>
              <option>Filing Deadline</option>
              <option>Hearing</option>
              <option>Trial Date</option>
              <option>Consultation</option>
              <option>Meeting</option>
              <option>General Event</option>
              <option value="other">Other...</option>
            </Select>
          </Field>
          <Field label="Related Record"><Select name="matterId" defaultValue={data?.matterId || ''}><option value="">None</option>{recordOptions}</Select></Field>
        </div>
        {formState.eventType === 'other' && (
          <div className="mb-3">
            <Field label="Custom Event Type" required>
              <Input name="custom_event_type" placeholder="E.g., Deposition" required />
            </Field>
          </div>
        )}
        
        {['court date', 'filing deadline', 'hearing', 'trial date'].includes((formState.eventType || 'court date').toLowerCase()) && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Court Name"><Input name="court_name" placeholder="Supreme Court" /></Field>
              <Field label="Court Room"><Input name="court_room" placeholder="Room 101" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Judge Name"><Input name="judge_name" placeholder="Judge..." /></Field>
              <Field label="Appearance Type">
                <Select name="appearance_type">
                  <option value="">Select type...</option>
                  <option value="hearing">Hearing</option>
                  <option value="trial">Trial</option>
                  <option value="motion">Motion</option>
                  <option value="mediation">Mediation</option>
                  <option value="conference">Conference</option>
                  <option value="other">Other...</option>
                </Select>
              </Field>
            </div>
            {formState.appearance_type === 'other' && (
              <div className="mb-3 col-span-2">
                <Field label="Custom Appearance Type" required>
                  <Input name="custom_appearance_type" placeholder="E.g., Arbitration" required />
                </Field>
              </div>
            )}
            <div className="mb-3 flex items-center gap-2">
              <input type="checkbox" name="is_court_event" id="is_court_event" defaultChecked className="w-4 h-4 rounded border-white/10 bg-black/20 text-[#38bdf8] focus:ring-[#38bdf8]/50" />
              <label htmlFor="is_court_event" className="text-[12px] font-500 text-white cursor-pointer">Is Court Event</label>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 gap-3 mb-3">
          <Field label="Internal Attendees">
            <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto bg-black/20 border border-white/10 rounded-xl p-3 custom-scrollbar">
              {lookups.users?.map((u) => (
                <label key={u.id} className="flex items-center gap-3 text-[13px] text-white/90 font-500 cursor-pointer group hover:bg-white/[0.05] p-1.5 rounded-lg transition-colors">
                  <input type="checkbox" name="internalAttendees" value={u.id} className="w-4 h-4 rounded border-white/20 bg-black/20 text-[#38bdf8] focus:ring-[#38bdf8]/50" />
                  <span className="truncate">{u.full_name} <span className="text-[#8a94a6] text-[11px]">({u.email})</span></span>
                </label>
              ))}
              {(!lookups.users || lookups.users.length === 0) && (
                <p className="text-[12px] text-slate-500 italic p-2">No internal users available.</p>
              )}
            </div>
          </Field>
          <Field label="External Attendees (comma separated emails)">
            <Input name="externalAttendees" placeholder="client1@example.com, client2@example.com" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Reminder">
            <Select name="reminderOffset" defaultValue="">
              <option value="">No Reminder</option>
              <option value="1_hour">1 Hour Before</option>
              <option value="same_day">Same Day</option>
              <option value="1_day">1 Day Before</option>
              <option value="3_days">3 Days Before</option>
              <option value="7_days">7 Days Before</option>
              <option value="custom">Custom Reminder</option>
            </Select>
          </Field>
          {formState.reminderOffset === 'custom' && (
            <Field label="Custom Reminder Time"><Input name="customReminderDate" type="datetime-local" /></Field>
          )}
        </div>
        {['court date', 'filing deadline', 'hearing', 'trial date'].includes((formState.eventType || 'court date').toLowerCase()) && (
          <div className="mb-3 flex items-center gap-2">
            <input type="checkbox" name="createTask" id="createTask" defaultChecked className="w-4 h-4 rounded border-white/10 bg-black/20 text-[#38bdf8] focus:ring-[#38bdf8]/50" />
            <label htmlFor="createTask" className="text-[12px] font-500 text-white cursor-pointer">Auto Create High Priority Tasks</label>
          </div>
        )}
        <Field label="Notes"><Textarea name="notes" rows={2} placeholder="Additional details..." /></Field>
      </>,
      onSave: () => toast('Event added to calendar!', 'success'),
    },
    'add-user': {
      title: 'Add New User', wide: false,
      body: <>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="First Name" required><Input name="firstName" placeholder="Jane" required /></Field>
          <Field label="Last Name" required><Input name="lastName" placeholder="Smith" required /></Field>
        </div>
        <div className="mb-3"><Field label="Email Address" required><Input name="email" type="email" placeholder="jane@pilbagen.se" required /></Field></div>
        <div className="mb-3">
          <label className="block text-[11px] font-900 text-white/80 uppercase tracking-[0.2em] mb-2 ml-1">Assigned Roles</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-[13px] text-white/90 font-600 cursor-pointer">
              <input type="checkbox" name="role_admin" value="admin" className="w-4 h-4 rounded bg-black/20 text-[#0057c7] border-white/10 focus:ring-[#0057c7]/50" />
              Admin
            </label>
            <label className="flex items-center gap-2 text-[13px] text-white/90 font-600 cursor-pointer">
              <input type="checkbox" name="role_lawyer" value="lawyer" className="w-4 h-4 rounded bg-black/20 text-[#0057c7] border-white/10 focus:ring-[#0057c7]/50" />
              Lawyer
            </label>
            <label className="flex items-center gap-2 text-[13px] text-white/90 font-600 cursor-pointer">
              <input type="checkbox" name="role_client" value="client" className="w-4 h-4 rounded bg-black/20 text-[#0057c7] border-white/10 focus:ring-[#0057c7]/50" />
              Party
            </label>
          </div>
        </div>
        <div className="mb-3">
          <Field label="Specialty (if Lawyer)">
            <Select name="specialty" defaultValue="">
              <option value="">None</option>
              <option value="Civil Litigation">Civil Litigation</option>
              <option value="Family Law">Family Law</option>
              <option value="Corporate">Corporate</option>
              <option value="Real Estate">Real Estate</option>
              <option value="other">Other...</option>
            </Select>
          </Field>
        </div>
        {formState.specialty === 'other' && (
          <div className="mb-3">
            <Field label="Custom Specialty" required>
              <Input name="custom_specialty" placeholder="E.g., Criminal Law" required />
            </Field>
          </div>
        )}
        <Field label="Set Password" required><Input name="password" type="password" placeholder="••••••••" required /></Field>
      </>,
      onSave: () => toast('User account created!', 'success'),
    },
    'edit-user': {
      title: data ? `Edit User: ${data.name}` : 'Edit User', wide: false,
      body: (() => {
        const predefinedSpecialties = ['Civil Litigation', 'Family Law', 'Corporate', 'Real Estate'];
        const isCustomSpecialty = data?.practice_focus && !predefinedSpecialties.includes(data.practice_focus);
        const defaultSelectValue = isCustomSpecialty ? 'other' : (data?.practice_focus || '');
        const showCustomField = (formState.specialty || defaultSelectValue) === 'other';

        return (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="First Name" required><Input name="firstName" defaultValue={data?.name ? data.name.split(' ')[0] : ''} required /></Field>
              <Field label="Last Name" required><Input name="lastName" defaultValue={data?.name ? data.name.split(' ').slice(1).join(' ') : ''} required /></Field>
            </div>
            <div className="mb-3"><Field label="Email Address" required><Input name="email" type="email" defaultValue={data ? data.email : ''} required /></Field></div>
            <div className="mb-3">
              <label className="block text-[11px] font-900 text-white/80 uppercase tracking-[0.2em] mb-2 ml-1">Assigned Roles</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-[13px] text-white/90 font-600 cursor-pointer">
                  <input type="checkbox" name="role_admin" value="admin" defaultChecked={data?.roles?.includes('admin')} className="w-4 h-4 rounded bg-black/20 text-[#0057c7] border-white/10 focus:ring-[#0057c7]/50" />
                  Admin
                </label>
                <label className="flex items-center gap-2 text-[13px] text-white/90 font-600 cursor-pointer">
                  <input type="checkbox" name="role_lawyer" value="lawyer" defaultChecked={data?.roles?.includes('lawyer')} className="w-4 h-4 rounded bg-black/20 text-[#0057c7] border-white/10 focus:ring-[#0057c7]/50" />
                  Lawyer
                </label>
                <label className="flex items-center gap-2 text-[13px] text-white/90 font-600 cursor-pointer">
                  <input type="checkbox" name="role_client" value="client" defaultChecked={data?.roles?.includes('client')} className="w-4 h-4 rounded bg-black/20 text-[#0057c7] border-white/10 focus:ring-[#0057c7]/50" />
                  Party
                </label>
              </div>
            </div>
            <div className="mb-3">
              <Field label="Specialty (if Lawyer)">
                <Select name="specialty" defaultValue={defaultSelectValue}>
                  <option value="">None</option>
                  <option value="Civil Litigation">Civil Litigation</option>
                  <option value="Family Law">Family Law</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="other">Other...</option>
                </Select>
              </Field>
            </div>
            {showCustomField && (
              <div className="mb-3">
                <Field label="Custom Specialty" required>
                  <Input name="custom_specialty" defaultValue={data?.practice_focus || ''} placeholder="E.g., Criminal Law" required />
                </Field>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Status">
                <Select name="status" defaultValue={data ? data.status : 'active'}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </Field>
            </div>
          </>
        );
      })(),
      onSave: () => toast('User updated successfully!', 'success'),
    },
    'reset-password': {
      title: data ? `Reset Password: ${data.name}` : 'Reset Password', wide: false,
      body: <>
        <div className="p-4 rounded-xl bg-[#0057c7]/10 border border-[#0057c7]/20 mb-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-[11px] text-[#38bdf8] font-700 uppercase tracking-widest opacity-80">This will immediately overwrite the user's current password.</p>
        </div>
        <Field label="New Password" required>
          <Input name="newPassword" type="password" placeholder="Enter new password" required minLength={4} />
        </Field>
      </>,
      onSave: () => {},
    },
    'edit-case': {
      title: data ? `Edit Matter: ${data.id}` : 'Edit Matter', wide: false,
      body: <>
        <div className="mb-3"><Field label="Matter Title" required><Input name="title" defaultValue={data ? data.title : ''} required /></Field></div>
        {(role === 'admin' || role === 'lawyer') && (
          <div className="mb-3">
            <Field label="Assigned Lawyer">
              <Select name="assigned_lawyer_id" defaultValue={data ? data.assigned_lawyer_id : ''}>
                <option value="">Select lawyer...</option>
                {lawyerRows.map((u) => <option key={u.id} value={u.user_id || u.id}>{u.full_name || u.display_name}</option>)}
              </Select>
            </Field>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Status" required>
            <Select name="status" defaultValue={data ? data.status : 'active'} required>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </Select>
          </Field>
          <Field label="Priority" required>
            <Select name="priority" defaultValue={data ? data.priority : 'medium'} required>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Case Type" required>
            <Select name="type" defaultValue={(() => { const predefinedTypes = ['Civil Litigation','Family Law','Criminal Defense','Corporate Law','Real Estate'].concat(practiceAreas.map(pa => pa.name)); return predefinedTypes.includes(data?.type) ? data.type : (data?.type ? 'other' : ''); })()} required>
              {practiceAreas.length > 0 ? practiceAreas.map(pa => (
                <option key={pa.id} value={pa.name}>{pa.name}</option>
              )) : (
                <><option>Civil Litigation</option><option>Family Law</option><option>Criminal Defense</option><option>Corporate Law</option><option>Real Estate</option></>
              )}
              <option value="other">Other...</option>
            </Select>
          </Field>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Opposing party">
            <Select name="opposingParty" value={formState.opposingParty !== undefined ? formState.opposingParty : (data?.opposing_party_name ? (['Plaintiff', 'Defendant', 'Witness', 'Insurance Company', 'Attorney Office', 'Organization', 'Business'].includes(data.opposing_party_name) ? data.opposing_party_name : 'Other') : '')} onChange={handleChange}>
              <option value="">Party</option>
              <option value="Plaintiff">Plaintiff</option>
              <option value="Defendant">Defendant</option>
              <option value="Witness">Witness</option>
              <option value="Insurance Company">Insurance Company</option>
              <option value="Attorney Office">Attorney Office</option>
              <option value="Organization">Organization</option>
              <option value="Business">Business</option>
              <option value="Other">Other</option>
            </Select>
          </Field>
          <Field label="Next Hearing"><Input name="nextHearing" type="date" defaultValue={data?.next_hearing ? data.next_hearing.split('T')[0] : (data?.nextHearing && data.nextHearing !== '—' ? data.nextHearing.split('T')[0] : '')} /></Field>
        </div>
        {((formState.opposingParty === 'Other') || (formState.opposingParty === undefined && data?.opposing_party_name && !['Plaintiff', 'Defendant', 'Witness', 'Insurance Company', 'Attorney Office', 'Organization', 'Business'].includes(data.opposing_party_name))) && (
          <div className="mb-3">
            <Field label="Custom Opposing Party Name" required>
              <Input name="custom_opposing_party" defaultValue={data?.opposing_party_name || ''} placeholder="Enter custom opposing party name..." required />
            </Field>
          </div>
        )}
        </div>
        {(formState.type === 'other' || (formState.type === undefined && (() => { const predefinedTypes = ['Civil Litigation','Family Law','Criminal Defense','Corporate Law','Real Estate'].concat(practiceAreas.map(pa => pa.name)); return !predefinedTypes.includes(data?.type) && !!data?.type; })() )) && (
          <div className="mb-3">
            <Field label="Custom Case Type" required>
              <Input name="custom_matter_type" defaultValue={(() => { const predefinedTypes = ['Civil Litigation','Family Law','Criminal Defense','Corporate Law','Real Estate'].concat(practiceAreas.map(pa => pa.name)); return !predefinedTypes.includes(data?.type) ? (data?.type || '') : ''; })()} placeholder="E.g., Immigration Law" required />
            </Field>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Initial Filing Date"><Input name="initial_filing_date" type="date" defaultValue={data?.initial_filing_date ? data.initial_filing_date.split('T')[0] : ''} /></Field>
          <Field label="Date of Loss"><Input name="date_of_loss" type="date" defaultValue={data?.date_of_loss ? data.date_of_loss.split('T')[0] : ''} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Trial Date"><Input name="trial_date" type="date" defaultValue={data?.trial_date ? data.trial_date.split('T')[0] : ''} /></Field>
          <Field label="Case Number"><Input name="case_number" placeholder="Case #" defaultValue={data?.case_number || ''} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Court Name"><Input name="court_name" placeholder="Court Name" defaultValue={data?.court_name || ''} /></Field>
          <Field label="Judge Name"><Input name="judge_name" placeholder="Honorable Judge..." defaultValue={data?.judge_name || ''} /></Field>
        </div>
        <div className="mb-3"><Field label="Court Address"><Input name="court_address" placeholder="Court Address" defaultValue={data?.court_address || ''} /></Field></div>
        
        {customFields.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <h4 className="text-[12px] font-900 text-white uppercase tracking-widest mb-3">Custom Fields</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customFields.map(f => {
                const existingVal = data?.custom_fields?.find(cf => cf.field_id === f.id)?.value || '';
                return (
                  <Field key={f.id} label={f.name}>
                    {f.type === 'dropdown' ? (
                      <Select name={`cf_${f.id}`} defaultValue={existingVal}>
                        <option value="">Select option...</option>
                        {(f.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </Select>
                    ) : f.type === 'date' ? (
                      <Input type="date" name={`cf_${f.id}`} defaultValue={existingVal} />
                    ) : f.type === 'number' || f.type === 'currency' ? (
                      <Input type="number" step="any" name={`cf_${f.id}`} defaultValue={existingVal} placeholder={f.type === 'currency' ? '0.00' : ''} />
                    ) : f.type === 'checkbox' || f.type === 'yes_no' ? (
                      <Select name={`cf_${f.id}`} defaultValue={existingVal}>
                        <option value="">Select...</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Select>
                    ) : (
                      <Input type="text" name={`cf_${f.id}`} defaultValue={existingVal} />
                    )}
                  </Field>
                );
              })}
            </div>
          </div>
        )}
      </>,
      onSave: () => toast('Matter updated successfully!', 'success'),
    },
    'pay-invoice': {
      title: data ? `Authorize Settlement: ${data.id}` : 'Pay Invoice', wide: false,
      body: <>
        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 mb-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#10b981]/5 blur-3xl" />
          <div className="relative z-10 flex justify-between items-center mb-3">
            <span className="text-[11px] font-900 text-[#8a94a6] uppercase tracking-[0.2em]">Total Outstanding</span>
            <span className="text-2xl font-900 text-[#10b981] tracking-tighter">{data?.amount || '$0.00'}</span>
          </div>
          <p className="text-[11px] text-[#8a94a6] font-500 italic opacity-60">Verified transaction record. Awaiting institutional authorization.</p>
        </div>
        <div className="space-y-4">
          <Field label="Institutional Method">
            <Input value="Institutional Wire / Manual" disabled className="!bg-white/[0.01] !border-white/5 !text-[#8a94a6]" />
          </Field>
          <Field label="Transaction Reference">
            <Input name="payment_reference" defaultValue={`SETTLE-${Date.now().toString().slice(-6)}`} placeholder="Enter bank reference number" />
          </Field>
        </div>
      </>,
    },
    'use-template': {
      title: 'Apply Document Template', wide: false,
      body: <>
        <p className="text-[12px] text-slate-500 mb-4">You are creating a new draft based on: <strong className="text-slate-900">{data?.title}</strong></p>
        <Field label="New Document Title" required>
          <Input name="title" defaultValue={`Copy of ${data?.title}`} required />
        </Field>
      </>,
      onSave: () => { },
    },
    'apply-template': {
      title: 'Apply Case Template', wide: false,
      body: <>
        <p className="text-[12px] text-slate-500 mb-4">Select a practice area template to auto-generate folder structures and task lists.</p>
        <div className="space-y-2">
          {[
            { id: 'pi', label: 'Personal Injury', desc: 'Medical Records, Insurance, Litigation flow' },
            { id: 'im', label: 'Immigration', desc: 'Identity Docs, USCIS Filings, Evidence' },
            { id: 'gl', label: 'General Litigation', desc: 'Pleadings, Discovery, Trial Prep' }
          ].map(t => (
            <label key={t.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-primary-400 cursor-pointer transition-all group">
              <input type="radio" name="template" value={t.id} className="mt-1" defaultChecked={t.id === 'pi'} />
              <div>
                <p className="text-[13px] font-700 text-slate-900 group-hover:text-primary-600">{t.label}</p>
                <p className="text-[11px] text-slate-400">{t.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </>,
      onSave: () => {
        toast('Matter folders and matter registry generated.', 'success');
        navigate('/admin/matters');
      },
    },
    'conflict-check': {
      title: 'Conflict of Interest Check', wide: false,
      body: <>
        <div className="mb-3"><Field label="Prospective Party Name" required><Input name="prospectiveClient" placeholder="Full name or Company" required /></Field></div>
        <div className="mb-3"><Field label="Opposing Party Name" required><Input name="opposingParty" placeholder="Opponent or Adverse Entity" required /></Field></div>
        <div className="bg-[#0057c7]/10 p-4 rounded-2xl border border-[#0057c7]/20 text-[13px] text-[#38bdf8] italic leading-relaxed">
          System will scan all matters, contacts, and closed files for potential hits.
        </div>
      </>,
      onSave: () => toast('Conflict check initiated. Standby...', 'info'),
    },
    'view-invoice': {
      title: data ? `Verified Financial Record: ${data.id}` : 'Invoice Preview', wide: false,
      body: <>
        {/* Executive Fintech Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0b1f3a] via-[#0057c7] to-[#003d8c] p-8 text-white shadow-2xl border border-white/10 mb-8 group">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#38bdf8]/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_10px_#10b981] animate-pulse" />
                <span className="text-[10px] font-900 uppercase tracking-[0.3em] text-white/70">Authenticated Statement</span>
              </div>
              <h2 className="text-[32px] font-900 tracking-tighter leading-tight mb-1 text-white">Pilbågen Advokatbyrå</h2>
              <p className="text-[12px] font-800 text-white/50 uppercase tracking-[0.2em]">Institutional Legal Counsel</p>
            </div>
            <div className="text-right">
              <div className="inline-flex px-4 py-1.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-[10px] font-900 uppercase tracking-[0.2em] mb-6">
                {data?.status || 'Processing'}
              </div>
              <p className="text-[11px] font-900 text-white/40 uppercase tracking-widest mb-1">Total Valuation</p>
              <p className="text-[42px] font-900 tracking-tighter text-white drop-shadow-2xl">{data?.amount}</p>
            </div>
          </div>
        </div>

        {/* Global Action Hub */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={async () => {
              try {
                const invoiceId = data.dbId || data.id;
                const { blob, filename } = await api.billing.downloadInvoicePdf(invoiceId);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = filename;
                document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url);
              } catch (e) { toast('Download failed', 'error'); }
            }}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[12.5px] font-800 hover:bg-white/10 hover:border-[#38bdf8]/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <svg className="w-4 h-4 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5 5-5M12 15V3" /></svg>
            PDF Archive
          </button>

          <button
            onClick={async () => {
              try {
                const invoiceId = data.dbId || data.id;
                const { blob, filename } = await api.billing.downloadInvoiceDocx(invoiceId);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = filename || `invoice-${invoiceId}-draft.docx`;
                document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
                toast('Word Draft (.docx) downloaded', 'success');
              } catch (e) { toast('Word draft download failed', 'error'); }
            }}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[12.5px] font-800 hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            title="Download editable Word document draft"
          >
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Word Draft (.docx)
          </button>

          <button
            onClick={async () => {
              try {
                const invoiceId = data.dbId || data.id;
                const { blob } = await api.billing.downloadInvoicePdf(invoiceId);
                const url = window.URL.createObjectURL(blob);
                onClose();
                setTimeout(() => {
                  openModal('preview-document', {
                    url,
                    mime_type: 'application/pdf',
                    title: `Invoice ${data.id || ''}`
                  });
                }, 100);
              } catch (e) {
                toast('Failed to open invoice PDF', 'error');
              }
            }}
            className="py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center active:scale-[0.98]"
            title="Preview PDF"
          >
            <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          </button>
        </div>

        {/* Fortnox ERP Integration Status & Actions */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-900 uppercase tracking-widest text-emerald-400">Fortnox ERP Integration</span>
              <span className="text-[9px] font-800 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {data?.fortnox_status || 'Ready'}
              </span>
            </div>
            <p className="text-[12px] text-white/70 mt-1">
              Fortnox Doc ID: <span className="font-mono text-emerald-300">{data?.fortnox_id || `FN-INV-${data?.dbId || data?.id || 'DRAFT'}`}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const invoiceId = data?.dbId || data?.id;
                  if (!invoiceId) return toast('Invalid invoice selected', 'error');
                  const res = await api.fortnox.postInvoice(invoiceId);
                  toast(res.message || 'Posted to Fortnox successfully', 'success');
                } catch (e) {
                  toast(e.message || 'Fortnox posting failed', 'error');
                }
              }}
              className="px-3.5 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 rounded-xl text-[11px] font-800 uppercase tracking-wider transition-all"
            >
              Post Fortnox
            </button>
            <button
              onClick={async () => {
                try {
                  const invoiceId = data?.dbId || data?.id;
                  if (!invoiceId) return toast('Invalid invoice selected', 'error');
                  const res = await api.fortnox.syncInvoice(invoiceId);
                  toast(res.message || 'Fortnox status synced', 'success');
                } catch (e) {
                  toast(e.message || 'Fortnox sync failed', 'error');
                }
              }}
              className="px-3.5 py-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl text-[11px] font-800 uppercase tracking-wider transition-all"
            >
              Sync Status
            </button>
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 transition-all hover:bg-white/[0.05] hover:border-white/10 group cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#38bdf8]/5 blur-2xl" />
            <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-2 opacity-60">Party Entity</p>
            <p className="text-[18px] font-900 text-white tracking-tighter group-hover:text-[#38bdf8] transition-colors">{data?.client}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-widest opacity-40">Identity Verified</span>
            </div>
          </div>
          <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 transition-all hover:bg-white/[0.05] hover:border-white/10 group cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#f59e0b]/5 blur-2xl" />
            <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-2 opacity-60">Settlement window</p>
            <p className="text-[18px] font-900 text-white tracking-tighter group-hover:text-[#f59e0b] transition-colors">{data?.due}</p>
            <p className="text-[10px] font-900 text-[#f59e0b] mt-4 uppercase tracking-[0.2em] opacity-80">Institutional Term</p>
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-5 px-4">
            <h4 className="text-[15px] font-900 text-white tracking-tighter flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0057c7]" />
              Statement breakdown
            </h4>
            <span className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.3em] opacity-40">{data?.id}</span>
          </div>

          <div className="space-y-3">
            {data?.items && data.items.length > 0 ? (
              data.items.map((item) => (
                <div key={item.id} className="rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-2 transition-all hover:bg-white/[0.04] hover:border-white/10 group">
                  <div className="px-6 py-5 rounded-[2rem] bg-white/[0.02] flex justify-between items-center">
                    <div className="space-y-1.5">
                      <p className="text-[15px] font-900 text-white tracking-tight group-hover:text-[#38bdf8] transition-colors">{item.description}</p>
                      <div className="flex gap-3 text-[10px] font-900 uppercase tracking-[0.2em] opacity-40">
                        <span className="text-[#38bdf8] opacity-100">Verified Service</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[18px] font-900 text-white tracking-tighter">${Number(item.amount).toFixed(2)}</p>
                      <p className="text-[9px] font-900 text-[#8a94a6] uppercase tracking-widest opacity-40">Institutional Rate</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-2 transition-all hover:bg-white/[0.04] group">
                <div className="px-8 py-7 rounded-[2rem] bg-white/[0.02] flex justify-between items-center group transition-all">
                  <div className="space-y-2">
                    <p className="text-[17px] font-900 text-white tracking-tight group-hover:text-[#38bdf8] transition-colors">{data?.desc || 'Institutional Legal Services'}</p>
                    <div className="flex gap-3 text-[10px] font-900 uppercase tracking-[0.2em] opacity-40">
                      <span className="text-[#10b981] opacity-100">Verified Service</span>
                      <span>•</span>
                      <span>Operational Ledger</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[22px] font-900 text-white tracking-tighter">{data?.amount}</p>
                    <p className="text-[9px] font-900 text-[#8a94a6] uppercase tracking-widest opacity-40">Consolidated Valuation</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </>,
      onSave: () => { },
    },
    'add-note': {
      title: 'Add Matter Note', wide: false,
      body: <>
        {data?.matterId ? <input type="hidden" name="matterId" value={data.matterId} /> : null}
        <div className="mb-3">
          <Field label="Note Title" required><Input name="title" placeholder="Summary of discussion/action" required /></Field>
        </div>
        <div className="mb-3">
          <Field label="Visibility" required>
            <Select name="visibility" required>
              <option value="Internal">Internal (Firm Only)</option>
              <option value="Shared">Shared (Party & Firm)</option>
            </Select>
          </Field>
        </div>
        <Field label="Note Content" required>
          <Textarea name="content" rows={5} placeholder="Type the detailed note here..." required />
        </Field>
      </>,
      onSave: () => toast('Matter note added successfully!', 'success'),
    },
    'log-call': {
      title: 'Log Communication / Call', wide: false,
      body: <>
        {data?.matterId ? <input type="hidden" name="matterId" value={data.matterId} /> : null}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Type" required>
            <Select name="type" required>
              <option value="Call">Phone Call</option>
              <option value="Meeting">Meeting</option>
              <option value="Video">Video Call</option>
            </Select>
          </Field>
          <Field label="Direction" required>
            <Select name="direction" required>
              <option value="Inbound">Inbound</option>
              <option value="Outbound">Outbound</option>
            </Select>
          </Field>
        </div>
        <div className="mb-3">
          <Field label="Subject" required><Input name="subject" placeholder="Purpose of the call" required /></Field>
          <Field label="Visibility" required>
            <Select name="visibility" required>
              <option value="Internal">Internal (Firm Only)</option>
              <option value="Shared">Shared (Party & Firm)</option>
            </Select>
          </Field>
        </div>
        <Field label="Notes / Outcome" required>
          <Textarea name="notes" rows={4} placeholder="Key takeaways and next steps..." required />
        </Field>
      </>,
      onSave: () => toast('Communication logged successfully!', 'success'),
    },
    'view-report': {
      title: data?.title || 'Report Overview', wide: false,
      body: data?.content || <p>No content available.</p>,
      onSave: () => { },
    },
    'view-event': {
      title: 'Calendar Intelligence', wide: false,
      body: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#0057c7]/5 blur-2xl pointer-events-none group-hover:bg-[#0057c7]/10" />
            <div className="relative z-10">
              <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-1 opacity-60">Entry Classification</p>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${data?.type === 'invoice' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : data?.type === 'matter' ? 'bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                <p className="text-[14px] font-900 text-white uppercase tracking-tight">{data?.type || 'General'}</p>
              </div>
            </div>
            <div className="text-right relative z-10">
              <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-1 opacity-60">Scheduled Date</p>
              <p className="text-[14px] font-800 text-white tracking-tight">
                {new Date(data?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                <span className="text-[#8a94a6] mx-2 opacity-40">·</span>
                {data?.type === 'invoice' ? 'All Day' : new Date(data?.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="space-y-2 px-1">
            <h4 className="text-[18px] font-900 text-white tracking-tighter leading-snug">{data?.title}</h4>
            
            {/* Matter badge */}
            {data?.matter_number && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-900 text-[#38bdf8] bg-[#0057c7]/10 border border-[#0057c7]/20 px-3 py-1 rounded-lg uppercase tracking-[0.15em]">
                  Matter: {data.matter_number}
                </span>
                {data.matter_title && (
                  <span className="text-[11px] text-[#8a94a6] font-700 tracking-tight opacity-80">— {data.matter_title}</span>
                )}
              </div>
            )}

            {/* Categories pills */}
            {data?.categories && (() => {
              try {
                const cats = typeof data.categories === 'string' ? JSON.parse(data.categories) : data.categories;
                if (Array.isArray(cats) && cats.length > 0) {
                  return (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cats.map(c => (
                        <span key={c} className="text-[9px] font-900 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-white/80 tracking-wider">
                          🏷️ {c}
                        </span>
                      ))}
                    </div>
                  );
                }
              } catch (e) {
                console.error(e);
              }
              return null;
            })()}
          </div>

          {/* Location field */}
          {data?.location && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5">
              <span className="text-[16px] text-white/40">📍</span>
              <div>
                <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-0.5">Location</p>
                <p className="text-[13px] font-600 text-white">{data.location}</p>
              </div>
            </div>
          )}

          {data?.description && (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0057c7]/20 group-hover:bg-[#38bdf8]/40 transition-colors" />
              <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-3 opacity-60">Intelligence Brief / Notes</p>
              <div 
                className="text-[14px] text-[#b8c2d1] font-500 leading-relaxed custom-editor break-words whitespace-pre-wrap overflow-hidden"
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            </div>
          )}

          {/* Busy status and Importance Grid */}
          <div className="grid grid-cols-2 gap-4">
            {data?.busy_status && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-1 opacity-60">Show As</p>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${data.busy_status === 'free' ? 'bg-emerald-500' : data.busy_status === 'tentative' ? 'bg-amber-400' : 'bg-red-500'}`} />
                  <p className="text-[13px] font-600 text-white capitalize">{data.busy_status}</p>
                </div>
              </div>
            )}
            {data?.importance && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-1 opacity-60">Importance</p>
                <p className="text-[13px] font-600 text-white capitalize">
                  {data.importance === 'high' ? '🔴 High' : data.importance === 'low' ? '🔵 Low' : '⚪ Normal'}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative group hover:bg-white/[0.04] transition-colors">
              <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-1 opacity-60">Configured Reminder</p>
              <p className="text-[13px] font-600 text-white">
                {data?.reminder_date ? new Date(data.reminder_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No reminder set'}
              </p>
            </div>
            {['court_date', 'filing_deadline', 'hearing', 'trial'].includes(data?.type) && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative group hover:bg-white/[0.04] transition-colors">
                <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-1 opacity-60">Linked Task Status</p>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                  <p className="text-[13px] font-600 text-white">
                    High Priority Generated
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {data?.attachments && (() => {
            try {
              const atts = typeof data.attachments === 'string' ? JSON.parse(data.attachments) : data.attachments;
              if (Array.isArray(atts) && atts.length > 0) {
                return (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-3 opacity-60">Attachments ({atts.length})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {atts.map(att => (
                        <div key={att.id || att.name} className="flex items-center justify-between p-2.5 border border-white/5 bg-white/[0.01] rounded-xl text-[12px] text-white">
                          <span className="truncate max-w-[180px] font-semibold text-white/80">📎 {att.name}</span>
                          <a 
                            href={att.url} 
                            download={att.name} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[#38bdf8] hover:underline text-[11px] font-bold"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch (e) {
              console.error(e);
            }
            return null;
          })()}

          {data?.attendees && data.attendees.length > 0 && (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-3 opacity-60">Attendees</p>
              <div className="flex flex-col gap-2">
                {data.attendees.map(a => (
                  <div key={a.id} className="flex justify-between items-center bg-white/[0.01] p-2 rounded-lg border border-white/5">
                    <span className="text-[13px] text-white">
                      {a.user ? a.user.full_name : a.email}
                    </span>
                    <span className={`text-[10px] font-900 uppercase tracking-widest ${a.status === 'accepted' ? 'text-emerald-400' : a.status === 'declined' ? 'text-red-400' : 'text-amber-400'}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.type === 'invoice' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 shadow-xl group hover:bg-amber-500/10 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 blur-xl pointer-events-none" />
                <p className="text-[10px] font-900 text-amber-400 uppercase tracking-[0.2em] mb-2 opacity-60">Financial Value</p>
                <p className="text-[20px] font-900 text-white tracking-tighter relative z-10">₹{data.amount}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 shadow-xl group hover:bg-white/[0.05] transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 blur-xl pointer-events-none" />
                <p className="text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] mb-2 opacity-60">Ledger Status</p>
                <div className="flex items-center gap-2 relative z-10">
                  <span className={`w-1.5 h-1.5 rounded-full ${String(data.status).toLowerCase() === 'paid' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`} />
                  <p className="text-[14px] font-900 text-white uppercase tracking-widest">{data.status || 'Pending'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-col gap-3">
            {role !== 'client' && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    openModal('add-event', data, onSave);
                  }}
                  className="flex-1 btn btn-primary justify-center h-12 text-[11px] font-900 uppercase tracking-widest shadow-[#0057c7]/20 active:scale-[0.98] transition-transform"
                >
                  Edit Event Details
                </button>
                <button
                  onClick={async () => {
                    const eventId = data?.raw_id || data?.id;
                    if (eventId) {
                      setEventToDelete(eventId);
                      setShowDeleteEventConfirm(true);
                    } else {
                      toast('This event cannot be deleted.', 'info');
                    }
                  }}
                  className="flex-1 btn bg-red-950/20 text-red-400 hover:bg-red-900/30 border border-red-500/10 justify-center h-12 text-[11px] font-900 uppercase tracking-widest active:scale-[0.98] transition-transform"
                >
                  Delete Event
                </button>
              </div>
            )}

            {data?.type === 'matter' && data?.matter_id && (
              <button
                onClick={() => { onClose(); navigate(role === 'admin' ? `/admin/matters/${data.matter_id}` : `/lawyer/matters/${data.matter_id}`); }}
                className="btn btn-secondary w-full justify-center h-12 text-[11px] font-900 uppercase tracking-widest border-white/10 hover:bg-white/5 active:scale-[0.98] transition-transform"
              >
                Access Matter Workspace →
              </button>
            )}
            {data?.type === 'invoice' && data?.raw_id && (
              <button
                onClick={() => { onClose(); openModal('view-invoice', { id: data.title.split(' ')[1], dbId: data.raw_id, amount: `₹${data.amount}`, status: data.status, desc: data.description, client: 'See Matter', due: new Date(data.date).toLocaleDateString() }); }}
                className="btn btn-secondary w-full justify-center h-12 text-[11px] font-900 uppercase tracking-widest border-white/10 hover:bg-white/5 active:scale-[0.98] transition-transform"
              >
                Review Full Statement
              </button>
            )}
          </div>
        </div>
      ),
      onSave: () => { },
    },
    'add-template': {
      title: 'Create New Template', wide: true,
      body: <>
        <div className="mb-3"><Field label="Template Title" required><Input name="title" placeholder="E.g., Initial Pleading Form" required /></Field></div>
        <div className="mb-3"><Field label="Description"><Input name="description" placeholder="E.g., Initial Pleading template for Civil Litigation cases." /></Field></div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Field label="Category" required>
            <Select name="category" required defaultValue="agreement">
              <option value="agreement">Agreement</option>
              <option value="court_form">Court Form</option>
              <option value="letter">Letter</option>
              <option value="contract">Contract</option>
              <option value="motion">Motion</option>
              <option value="pleading">Pleading</option>
              <option value="affidavit">Affidavit</option>
              <option value="notice">Notice</option>
              <option value="demand_letter">Demand Letter</option>
              <option value="legal_disclaimer">Legal Disclaimer</option>
              <option value="other">Other...</option>
            </Select>
          </Field>
          <Field label="Practice Area">
            <Select name="practice_area">
              <option value="">General</option>
              <option value="Civil Litigation">Civil Litigation</option>
              <option value="Family Law">Family Law</option>
              <option value="Corporate">Corporate</option>
              <option value="other">Other...</option>
            </Select>
          </Field>
          <Field label="Status" required>
            <Select name="is_active" defaultValue="active" required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </div>
        {formState.category === 'other' && (
          <div className="mb-3">
            <Field label="Custom Category" required>
              <Input name="custom_category" placeholder="E.g., Deposition Script" required />
            </Field>
          </div>
        )}
        {formState.practice_area === 'other' && (
          <div className="mb-3">
            <Field label="Custom Practice Area" required>
              <Input name="custom_practice_area" placeholder="E.g., Immigration" required />
            </Field>
          </div>
        )}
        <div className="p-4 rounded-xl bg-[#0057c7]/10 border border-[#0057c7]/20 mb-3 text-[11px] text-[#38bdf8] font-600">
          Available placeholders: {"{{FirmName}}"}, {"{{AttorneyName}}"}, {"{{MatterNumber}}"}, {"{{MatterTitle}}"}, {"{{PartyName}}"}, {"{{RecipientName}}"}, {"{{RecipientAddress}}"}, {"{{TodayDate}}"}, {"{{CaseNumber}}"}, {"{{CourtName}}"}
        </div>
        <Field label="Template Content" required><Textarea name="content" rows={10} placeholder="Enter template text with placeholders..." required /></Field>
      </>,
      onSave: () => toast('Template created successfully!', 'success'),
    },
    'edit-template': {
      title: data ? `Edit Template: ${data.title}` : 'Edit Template', wide: true,
      body: (() => {
        const predefinedCats = ['agreement', 'court_form', 'letter', 'contract', 'motion', 'pleading', 'affidavit', 'notice', 'demand_letter', 'legal_disclaimer'];
        const isCustomCat = data?.category && !predefinedCats.includes(data.category.toLowerCase());
        const defaultCatVal = isCustomCat ? 'other' : (data?.category || 'agreement');
        const showCustomCat = (formState.category || defaultCatVal) === 'other';

        const predefinedPAs = ['Civil Litigation', 'Family Law', 'Corporate'];
        const isCustomPA = data?.practice_area && !predefinedPAs.includes(data.practice_area);
        const defaultPAVal = isCustomPA ? 'other' : (data?.practice_area || '');
        const showCustomPA = (formState.practice_area || defaultPAVal) === 'other';

        return (
          <>
            <div className="mb-3"><Field label="Template Title" required><Input name="title" defaultValue={data?.title} required /></Field></div>
            <div className="mb-3"><Field label="Description"><Input name="description" defaultValue={data?.description || ''} placeholder="E.g., Initial Pleading template for Civil Litigation cases." /></Field></div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Field label="Category" required>
                <Select name="category" defaultValue={defaultCatVal} required>
                  <option value="agreement">Agreement</option>
                  <option value="court_form">Court Form</option>
                  <option value="letter">Letter</option>
                  <option value="contract">Contract</option>
                  <option value="motion">Motion</option>
                  <option value="pleading">Pleading</option>
                  <option value="affidavit">Affidavit</option>
                  <option value="notice">Notice</option>
                  <option value="demand_letter">Demand Letter</option>
                  <option value="legal_disclaimer">Legal Disclaimer</option>
                  <option value="other">Other...</option>
                </Select>
              </Field>
              <Field label="Practice Area">
                <Select name="practice_area" defaultValue={defaultPAVal}>
                  <option value="">General</option>
                  <option value="Civil Litigation">Civil Litigation</option>
                  <option value="Family Law">Family Law</option>
                  <option value="Corporate">Corporate</option>
                  <option value="other">Other...</option>
                </Select>
              </Field>
              <Field label="Status" required>
                <Select name="is_active" defaultValue={data?.is_active === false ? 'inactive' : 'active'} required>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </Field>
            </div>
            {showCustomCat && (
              <div className="mb-3">
                <Field label="Custom Category" required>
                  <Input name="custom_category" defaultValue={isCustomCat ? data.category : ''} placeholder="E.g., Deposition Script" required />
                </Field>
              </div>
            )}
            {showCustomPA && (
              <div className="mb-3">
                <Field label="Custom Practice Area" required>
                  <Input name="custom_practice_area" defaultValue={isCustomPA ? data.practice_area : ''} placeholder="E.g., Immigration" required />
                </Field>
              </div>
            )}
            <div className="p-4 rounded-xl bg-[#0057c7]/10 border border-[#0057c7]/20 mb-3 text-[11px] text-[#38bdf8] font-600">
              Available placeholders: {"{{FirmName}}"}, {"{{AttorneyName}}"}, {"{{MatterNumber}}"}, {"{{MatterTitle}}"}, {"{{PartyName}}"}, {"{{RecipientName}}"}, {"{{RecipientAddress}}"}, {"{{TodayDate}}"}, {"{{CaseNumber}}"}, {"{{CourtName}}"}
            </div>
            <Field label="Template Content" required><Textarea name="content" rows={10} defaultValue={data?.content || ''} required /></Field>
          </>
        );
      })(),
      onSave: () => toast('Template updated successfully!', 'success'),
    },
    'edit-draft': {
      title: data ? `Edit Draft: ${data.title}` : 'Edit Draft', wide: true,
      body: (() => {
        const predefinedDraftCats = ['Agreement','Engagement','Intake','Litigation','Resolution','General','court_form','letter','contract','motion','pleading','affidavit','notice','demand_letter','legal_disclaimer'];
        const isCustomDraftCat = data?.category && !predefinedDraftCats.includes(data.category);
        const defaultDraftCatVal = isCustomDraftCat ? 'other' : (data?.category || 'General');
        const showCustomDraftCat = (formState.category || defaultDraftCatVal) === 'other';
        return (
          <>
            <div className="mb-3"><Field label="Draft Title" required><Input name="title" defaultValue={data?.title} required /></Field></div>
            <div className="mb-3">
              <Field label="Category" required>
                <Select name="category" defaultValue={defaultDraftCatVal} required>
                  <option value="Agreement">Agreement</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Intake">Intake</option>
                  <option value="Litigation">Litigation</option>
                  <option value="Resolution">Resolution</option>
                  <option value="General">General</option>
                  <option value="court_form">Court Form</option>
                  <option value="letter">Letter</option>
                  <option value="contract">Contract</option>
                  <option value="motion">Motion</option>
                  <option value="pleading">Pleading</option>
                  <option value="affidavit">Affidavit</option>
                  <option value="notice">Notice</option>
                  <option value="demand_letter">Demand Letter</option>
                  <option value="legal_disclaimer">Legal Disclaimer</option>
                  <option value="other">Other...</option>
                </Select>
              </Field>
            </div>
            {showCustomDraftCat && (
              <div className="mb-3">
                <Field label="Custom Category" required>
                  <Input name="custom_category" defaultValue={isCustomDraftCat ? data.category : ''} placeholder="E.g., Settlement Agreement" required />
                </Field>
              </div>
            )}
            <Field label="Draft Content" required><Textarea name="content" rows={12} defaultValue={data?.content} required /></Field>
          </>
        );
      })(),
      onSave: () => toast('Draft updated successfully!', 'success'),
    },
    'browse-templates': {
      title: 'Document Template Library', wide: true,
      body: <TemplateLibrary targetMatterId={data?.targetMatterId} toast={toast} />,
    },
    'add-practice-area': {
      title: 'Add Practice Area', wide: false,
      body: <>
        <div className="mb-3"><Field label="Name" required><Input name="name" placeholder="e.g. Civil Litigation" required /></Field></div>
        <div className="mb-3"><Field label="Status"><Select name="status" defaultValue="active"><option value="active">Active</option><option value="inactive">Inactive</option></Select></Field></div>
      </>
    },
    'edit-practice-area': {
      title: 'Edit Practice Area', wide: false,
      body: <>
        <div className="mb-3"><Field label="Name" required><Input name="name" defaultValue={data?.name} required /></Field></div>
        <div className="mb-3"><Field label="Status"><Select name="status" defaultValue={data?.is_active ? 'active' : 'inactive'}><option value="active">Active</option><option value="inactive">Inactive</option></Select></Field></div>
      </>
    },
    'add-custom-field': {
      title: 'Add Custom Field', wide: false,
      body: <>
        <div className="mb-3"><Field label="Field Name" required><Input name="name" placeholder="e.g. Settlement Goal" required /></Field></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Field Type" required>
            <Select name="type" defaultValue="text" required>
              <option value="text">Text (Single Line)</option>
              <option value="number">Number</option>
              <option value="currency">Currency</option>
              <option value="date">Date</option>
              <option value="dropdown">Dropdown Options</option>
              <option value="yes_no">Yes / No</option>
              <option value="checkbox">Checkbox</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="active"><option value="active">Active</option><option value="inactive">Inactive</option></Select>
          </Field>
        </div>
        <Field label="Dropdown Options (Comma separated)"><Input name="options" placeholder="Option A, Option B" /></Field>
        <p className="text-[#8a94a6] text-[10px] mt-1 italic">Only required if Field Type is Dropdown Options</p>
      </>
    },
    'edit-custom-field': {
      title: 'Edit Custom Field', wide: false,
      body: <>
        <div className="mb-3"><Field label="Field Name" required><Input name="name" defaultValue={data?.name} required /></Field></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Field Type" required>
            <Select name="type" defaultValue={data?.type} required>
              <option value="text">Text (Single Line)</option>
              <option value="number">Number</option>
              <option value="currency">Currency</option>
              <option value="date">Date</option>
              <option value="dropdown">Dropdown Options</option>
              <option value="yes_no">Yes / No</option>
              <option value="checkbox">Checkbox</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={data?.is_active ? 'active' : 'inactive'}><option value="active">Active</option><option value="inactive">Inactive</option></Select>
          </Field>
        </div>
        <Field label="Dropdown Options (Comma separated)"><Input name="options" defaultValue={Array.isArray(data?.options) ? data.options.join(', ') : ''} placeholder="Option A, Option B" /></Field>
      </>
    },
  };

  const m = modals[type];
  if (!m) return null;

  const isQueueFinished = isUploadingQueue && uploadQueue.length > 0 && uploadQueue.every(q => q.status === 'completed' || q.status === 'failed');
  const primaryLabel =
    type === 'compose-email' ? 'Send Email'
      : type === 'add-document' ? (isUploadingQueue ? 'Done' : 'Upload')
        : type === 'view-invoice' ? 'Acknowledge'
          : type === 'view-event' ? 'Acknowledge'
            : type === 'browse-templates' ? 'Close'
              : 'Save';
  const handlePrimary = async () => {
    if (type === 'view-invoice') {
      onClose();
      return;
    }
    if (type === 'add-document') {
      if (isUploadingQueue) {
        onClose();
        window.dispatchEvent(new CustomEvent('vktori:entities-changed'));
        return;
      }
      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity?.();
        return;
      }
      const fd = new FormData(formRef.current);
      const values = Object.fromEntries(fd.entries());
      const category = values.docCategory === 'other'
        ? (values.custom_doc_category || '').trim()
        : (values.docCategory || 'General');
      const visibility = role === 'lawyer' ? 'client_shared' : role === 'client' ? 'client_visible' : 'internal';
      const matterId = parseInt(String(values.matterId || data?.matterId || ''), 10);
      
      if (!Number.isFinite(matterId)) {
        toast('Select a matter.', 'error');
        return;
      }
      if (selectedFiles.length === 0) {
        toast('Please select files or a folder to upload.', 'error');
        return;
      }
      
      setIsUploadingQueue(true);
      startQueueUpload(selectedFiles, matterId, category, visibility, user.id);
      return;
    }
    const skipValidity = ['apply-template', 'conflict-check'].includes(type);
    if (!skipValidity && formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity?.();
      return;
    }
    setSaving(true);
    try {
      let values = {};
      if (formRef.current) {
        const fd = new FormData(formRef.current);
        values = Object.fromEntries(fd.entries());
        if (type === 'add-case') {
          values.clientIds = fd.getAll('clientIds');
        }
        if (type === 'add-event') {
          values.internalAttendees = fd.getAll('internalAttendees');
        }
      }
      if (onSave) {
        await Promise.resolve(onSave(values));
      } else {
        await defaultModalSubmit(type, data, values, { role, user, toast, navigate }, selectedFiles);
      }
      clearDraft(type);
      setHasDraft(false);
      onClose();
    } catch (e) {
      toast(e.message || 'Action failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const primaryDisabled = 
    type === 'view-invoice' ? saving 
      : type === 'add-document' ? (isUploadingQueue ? !isQueueFinished : selectedFiles.length === 0 || saving)
        : (!isValid || saving);

  return (
    <>
      <Modal title={m.title} onClose={onClose} wide={m.wide}
        footer={
          <>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving || (type === 'add-document' && isUploadingQueue && !isQueueFinished)}>
              {type === 'preview-document' ? 'Close' : 'Cancel'}
            </button>
            {type !== 'preview-document' && (
              <button
                type="button"
                onClick={handlePrimary}
                disabled={primaryDisabled}
                className={`btn btn-primary transition-all ${primaryDisabled ? 'opacity-50 cursor-not-allowed hover:translate-y-0 shadow-none' : ''}`}
              >
                {saving && type !== 'view-invoice' ? 'Saving…' : primaryLabel}
              </button>
            )}
          </>
        }>
        {hasDraft && (
          <div className="mb-3 p-2.5 px-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between text-[11px] text-blue-300 animate-fade-in">
            <span className="flex items-center gap-1.5 font-700">
              <span>💾</span> Auto-saved draft restored (Section 22 Protection)
            </span>
            <button
              type="button"
              onClick={() => {
                clearDraft(type);
                setHasDraft(false);
                if (formRef.current) formRef.current.reset();
              }}
              className="text-[10px] font-800 uppercase tracking-wider text-blue-400 hover:text-white underline ml-2"
            >
              Clear Draft
            </button>
          </div>
        )}
        <form ref={formRef} className="[&_.grid-cols-2]:grid-cols-1 sm:[&_.grid-cols-2]:grid-cols-2" onChange={handleChange} onSubmit={e => e.preventDefault()}>
          {m.body}
        </form>
      </Modal>

      {/* Custom Delete Event Confirmation Modal */}
      {showDeleteEventConfirm && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#121826] border border-white/10 rounded-3xl p-6 w-full max-w-[400px] shadow-2xl flex flex-col gap-4 text-center text-white">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-[16px] font-800">Delete Event?</h3>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              Are you sure you want to delete this event? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setShowDeleteEventConfirm(false);
                  setEventToDelete(null);
                }}
                className="flex-1 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-[12px] font-bold text-white/80 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (eventToDelete) {
                    try {
                      await api.calendar.remove(eventToDelete);
                      toast('Calendar Event deleted successfully.', 'success');
                      onClose();
                      window.dispatchEvent(new CustomEvent('vktori:entities-changed'));
                    } catch (e) {
                      toast(e.message || 'Delete failed', 'error');
                    }
                  }
                  setShowDeleteEventConfirm(false);
                  setEventToDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-[12px] font-bold text-white transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
//  APP LAYOUT (Sidebar + Topbar + Outlet)
// ─────────────────────────────────────────────────────────
function AppLayout({ role, user, onLogout, onSwitchRole, toast, modal, setModal, modalLookups }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [sidebarBadges, setSidebarBadges] = useState({});
  const routerNavigate = useNavigate();

  // Outlook Composer States
  const [outlookComposerOpen, setOutlookComposerOpen] = useState(false);
  const [outlookComposerData, setOutlookComposerData] = useState(null);
  const [outlookComposerOnSave, setOutlookComposerOnSave] = useState(null);

  // Email Compose States
  const [emailComposeOpen, setEmailComposeOpen] = useState(false);
  const [emailComposeData, setEmailComposeData] = useState(null);
  const [emailComposeOnSave, setEmailComposeOnSave] = useState(null);

  const customOpenModal = (type, data = null, onSave = null) => {
    if (type === 'add-event') {
      setOutlookComposerData(data);
      setOutlookComposerOnSave(() => onSave);
      setOutlookComposerOpen(true);
      return;
    }
    if (type === 'compose-email') {
      setEmailComposeData(data);
      setEmailComposeOnSave(() => onSave);
      setEmailComposeOpen(true);
      return;
    }
    setModal({ type, data, onSave });
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!user?.id || !role) {
      setSidebarBadges({});
      return undefined;
    }
    let cancelled = false;
    const loadBadges = async () => {
      const r = String(role).toLowerCase();
      try {
        if (r === 'admin') {
          const [lr, mr, cr] = await Promise.all([
            api.leads.list({ limit: 500 }),
            api.matters.list({ limit: 500 }),
            api.communications.list({ limit: 500 }),
          ]);
          if (cancelled) return;
          const leads = Array.isArray(lr?.data) ? lr.data : [];
          const matters = Array.isArray(mr?.data) ? mr.data : [];
          const comms = Array.isArray(cr?.data) ? cr.data : [];
          setSidebarBadges({
            leads: leads.filter((l) => l.status === 'new').length,
            cases: matters.filter((m) => m.status !== 'completed').length,
            email: comms.filter((c) => c.sender_user_id !== user.id && c.sender_role === 'client' && !c.is_read).length,
          });
        } else if (r === 'lawyer') {
          const [mr, cr] = await Promise.all([
            api.matters.list({ limit: 500 }),
            api.communications.list({ limit: 500 }),
          ]);
          if (cancelled) return;
          const matters = Array.isArray(mr?.data) ? mr.data : [];
          const comms = Array.isArray(cr?.data) ? cr.data : [];
          setSidebarBadges({
            'l-cases': matters.filter((m) => m.status !== 'completed').length,
            email: comms.filter((c) => c.sender_user_id !== user.id && c.sender_role === 'client' && !c.is_read).length,
          });
        } else if (r === 'client') {
          const [ir, cr] = await Promise.all([
            api.billing.listInvoices({ limit: 500 }),
            api.communications.list({ limit: 500 }),
          ]);
          if (cancelled) return;
          const invoices = Array.isArray(ir?.data) ? ir.data : [];
          const comms = Array.isArray(cr?.data) ? cr.data : [];
          setSidebarBadges({
            'c-billing': invoices.filter((i) => i.status !== 'paid' && i.status !== 'void').length,
            'c-messages': comms.filter((c) => c.sender_user_id !== user.id && c.sender_role !== 'client' && c.sender_role !== 'system' && !c.is_read).length,
          });
        } else {
          setSidebarBadges({});
        }
      } catch {
        if (!cancelled) setSidebarBadges({});
      }
    };
    loadBadges();
    const onRefresh = () => loadBadges();
    window.addEventListener('vktori:entities-changed', onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener('vktori:entities-changed', onRefresh);
    };
  }, [user?.id, role]);

  const navigate = (path) => {
    routerNavigate(path);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#0B132B] overflow-hidden selection:bg-[#D4AF37] selection:text-[#0B132B]">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} role={role} user={user} onToggle={() => setSidebarOpen(o => !o)} onLogout={onLogout}
        badges={sidebarBadges}
        onItemClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(o => !o)}
          role={role} user={user} onLogout={onLogout} onSwitchRole={onSwitchRole} toast={toast} navigate={navigate} />

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0B132B]">
          <div className="w-full px-3 sm:px-6 lg:px-8 pt-4 pb-36 mb-12 lg:pb-12 lg:mb-0">
            <Outlet context={{ role, user, navigate, toast, openModal: customOpenModal }} />
          </div>
        </main>
      </div>

      {modal && (
        <AppModal
          type={modal.type || modal}
          data={modal.data}
          onSave={modal.onSave}
          onClose={() => setModal(null)}
          toast={toast}
          navigate={navigate}
          role={role}
          user={user}
          lookups={modalLookups}
          openModal={customOpenModal}
        />
      )}

      <OutlookEventComposer 
        isOpen={outlookComposerOpen} 
        eventData={outlookComposerData}
        onClose={() => { setOutlookComposerOpen(false); setOutlookComposerData(null); }}
        onSave={() => {
          if (outlookComposerOnSave) {
            outlookComposerOnSave();
          } else {
            window.dispatchEvent(new CustomEvent('vktori:entities-changed'));
          }
        }}
        toast={toast}
        lookups={modalLookups}
      />

      <EmailComposeModal
        isOpen={emailComposeOpen}
        onClose={() => { setEmailComposeOpen(false); setEmailComposeData(null); }}
        onSave={() => {
          if (emailComposeOnSave) {
            emailComposeOnSave();
          } else {
            window.dispatchEvent(new CustomEvent('vktori:entities-changed'));
          }
        }}
        data={emailComposeData}
        user={user}
        lookups={modalLookups}
        toast={toast}
      />

      <VyniusAI role={role} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  PAGE WRAPPERS (read context from Outlet)
// ─────────────────────────────────────────────────────────
import { useOutletContext } from 'react-router-dom';

function AdminDashboardPage() { const ctx = useOutletContext(); return <AdminDashboard   {...ctx} />; }
function LeadsPage() { const ctx = useOutletContext(); return <LeadDashboard     {...ctx} />; }
function LeadDetailWrapper() { const ctx = useOutletContext(); const { id } = useParams(); return <LeadDetailPage {...ctx} leadId={id} />; }
function ConflictPage() { const ctx = useOutletContext(); return <ConflictCheckPage {...ctx} />; }
function AdminClientsPage() { const ctx = useOutletContext(); return <ClientsPage       {...ctx} />; }
function AdminClientDetailPage() { const ctx = useOutletContext(); const { id } = useParams(); return <ClientDetailPage  {...ctx} clientId={id || "C001"} />; }
function AdminMattersPage() { const ctx = useOutletContext(); return <CasesPage         {...ctx} />; }
function AdminMatterDetailPage() { const ctx = useOutletContext(); const { id } = useParams(); return <CaseDetailPage    {...ctx} caseId={id || "CASE-2045"} />; }
function AdminCalendarPage() { const ctx = useOutletContext(); return <CalendarPage      {...ctx} />; }
function AdminDocumentsPage() { const ctx = useOutletContext(); return <DocumentsPage     {...ctx} />; }
function AdminBillingPage() { const ctx = useOutletContext(); return <BillingPage       {...ctx} />; }
function AdminEmailPage() { const ctx = useOutletContext(); return <EmailPage         {...ctx} />; }
function AdminAIPage() { const ctx = useOutletContext(); return <AIPage            {...ctx} />; }
function AdminMarketingPage() { const ctx = useOutletContext(); return <MarketingDashboard {...ctx} />; }
function AdminReportsPage() { const ctx = useOutletContext(); return <ReportsDashboard  {...ctx} />; }
function AdminUsersPage() { const ctx = useOutletContext(); return <UsersPage         {...ctx} />; }
function AdminIntegrationsPage() { const ctx = useOutletContext(); return <IntegrationsPage  {...ctx} />; }
function AdminSettingsPage() { const ctx = useOutletContext(); return <SettingsPage      {...ctx} />; }
function AdminCourtFormsPage() { const ctx = useOutletContext(); return <CourtFormsPage {...ctx} role="admin" />; }

function LawyerDashboardPage() { const ctx = useOutletContext(); return <LawyerDashboard  {...ctx} />; }
function LawyerClientsWrapper() { const ctx = useOutletContext(); return <LawyerClientsPage {...ctx} />; }
function LawyerClientDetailWrapper() { const ctx = useOutletContext(); const { id } = useParams(); return <ClientDetailPage  {...ctx} clientId={id} />; }
function LawyerMattersPage() { const ctx = useOutletContext(); return <LawyerCasesPage   {...ctx} />; }
function LawyerMatterDetailWrapper() { const ctx = useOutletContext(); const { id } = useParams(); return <CaseDetailPage    {...ctx} caseId={id} />; }
function LawyerCalendarPage() { const ctx = useOutletContext(); return <CalendarPage      {...ctx} />; }
function LawyerDocumentsPage() { const ctx = useOutletContext(); return <DocumentsPage     {...ctx} />; }
function LawyerBillingPage() { const ctx = useOutletContext(); return <BillingPage       {...ctx} />; }
function LawyerEmailPage() { const ctx = useOutletContext(); return <EmailPage         {...ctx} />; }
function LawyerAIPage() { const ctx = useOutletContext(); return <AIPage            {...ctx} />; }
function LawyerIntegrationsPage() { const ctx = useOutletContext(); return <IntegrationsPage  {...ctx} />; }
function LawyerSettingsPage() { const ctx = useOutletContext(); return <LawyerProfilePage {...ctx} />; }
function LawyerProfileWrapper() { const ctx = useOutletContext(); return <LawyerProfilePage {...ctx} />; }
function LawyerCourtFormsPage() { const ctx = useOutletContext(); return <CourtFormsPage {...ctx} role="lawyer" />; }

function ClientDashboardPage() { const ctx = useOutletContext(); return <ClientDashboard      {...ctx} />; }
function ClientMattersPage() { const ctx = useOutletContext(); return <ClientCasesPage       {...ctx} />; }
function ClientMatterDetailWrapper() { const ctx = useOutletContext(); const { id } = useParams(); return <CaseDetailPage    {...ctx} caseId={id} />; }
function ClientDocsPage() { const ctx = useOutletContext(); return <ClientDocumentsPage   {...ctx} />; }
function ClientBillingWrapper() { const ctx = useOutletContext(); return <ClientBillingPage     {...ctx} />; }
function ClientMessagesWrapper() { const ctx = useOutletContext(); return <ClientMessagesPage    {...ctx} />; }
function ClientProfileWrapper() { const ctx = useOutletContext(); return <ClientProfilePage     {...ctx} />; }

import WebsiteLayout from './website/WebsiteLayout.jsx';
import { HomePage, ClientPortalLandingPage } from './website/pages/WebsitePages.jsx';

// ─────────────────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────────────────
const HOME_ROUTE = { 
  super_admin: '/super-admin/dashboard', 
  superadmin: '/super-admin/dashboard', 
  admin: '/admin/dashboard', 
  lawyer: '/lawyer/dashboard', 
  client: '/client/dashboard',
  // Extensible future role placeholders
  partner: '/partner/dashboard',
  paralegal: '/paralegal/dashboard',
  assistant: '/assistant/dashboard',
};

const billFormatUsd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

function TrustLedgerView({ accountId, formatUsd }) {
  
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const [txs, setTxs] = useState([]);

  useEffect(() => {
    if (!accountId) return;
    api.billing.getTrustTransactions(accountId)
      .then(res => setTxs(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [accountId]);

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#0057c7] border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] text-[#8a94a6] font-900 uppercase tracking-widest opacity-60">Syncing Trust Assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/[0.03] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] opacity-60">Execution Date</th>
              <th className="px-6 py-4 text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] opacity-60">Transaction Type</th>
              <th className="px-6 py-4 text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] opacity-60">Matter reference</th>
              <th className="px-6 py-4 text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] opacity-60">Verification ref</th>
              <th className="px-6 py-4 text-[10px] font-900 text-[#8a94a6] uppercase tracking-[0.2em] opacity-60 text-right">Valuation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {txs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center text-[#8a94a6] text-[13px] font-500 italic opacity-40">
                  No verified trust transactions synchronized.
                </td>
              </tr>
            ) : (
              txs.map(tx => {
                const isDeposit = tx.transaction_type === 'deposit';
                return (
                  <tr key={tx.id} className="hover:bg-white/[0.03] transition-all group">
                    <td className="px-6 py-5 text-[13px] text-[#8a94a6] font-800 tracking-tighter whitespace-nowrap opacity-60 group-hover:opacity-100">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex px-3 py-1 rounded-lg border text-[10px] font-900 uppercase tracking-widest ${isDeposit ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#0057c7]/10 text-[#38bdf8] border-[#0057c7]/20'}`}>
                        {tx.transaction_type.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[13px] font-900 text-white tracking-tighter">{tx.matter?.matter_number || '—'}</p>
                      <p className="text-[10px] text-[#8a94a6] font-800 uppercase tracking-widest opacity-40">System Reference</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[12px] text-[#8a94a6] font-700 max-w-[200px] truncate opacity-40 group-hover:opacity-100 transition-opacity">{tx.reference || tx.notes || '—'}</p>
                    </td>
                    <td className={`px-6 py-5 text-right font-900 text-[16px] tracking-tighter ${isDeposit ? 'text-emerald-400' : 'text-white'}`}>
                      {isDeposit ? '+' : '-'}{formatUsd(tx.amount)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Institutional Note */}
      <div className="px-6 py-4 rounded-2xl bg-[#0057c7]/5 border border-[#0057c7]/10 flex items-center gap-3">
        <svg className="w-5 h-5 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="text-[11px] text-[#38bdf8] font-700 uppercase tracking-widest opacity-80">This ledger represents verified trust account movements and is immutable upon reconciliation.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [modal, setModal] = useState(null);
  const [modalLookups, setModalLookups] = useState({ clients: [], matters: [], lawyers: [], users: [], folders: [], activities: [] });
  const { toasts, toast } = useToast();
  const routerNavigate = useNavigate();
  const location = useLocation();

  const refreshModalLookups = useCallback(async () => {
    if (!isLoggedIn || !user) return;
    try {
      const [clRes, mtRes, usRes, flRes, invRes, actRes] = await Promise.all([
        api.clients.list({ limit: 500 }),
        api.matters.list({ limit: 500 }),
        (role === 'admin' || role === 'lawyer' || role === 'partner') ? api.users.list() : Promise.resolve({ data: [] }),
        api.folders.list(),
        api.billing.listInvoices({ limit: 500 }),
        api.activities.list({ limit: 500 })
      ]);
      const clients = Array.isArray(clRes?.data) ? clRes.data : [];
      const matters = Array.isArray(mtRes?.data) ? mtRes.data : [];
      const users = Array.isArray(usRes?.data) ? usRes.data : [];
      const folders = Array.isArray(flRes?.data) ? flRes.data : [];
      const invoices = Array.isArray(invRes?.data) ? invRes.data : [];
      const activities = Array.isArray(actRes?.data) ? actRes.data : Array.isArray(actRes) ? actRes : [];
      const lawyers = (role === 'admin' || role === 'lawyer' || role === 'partner')
        ? users.filter((u) => u.roles?.includes('lawyer') || u.role === 'lawyer' || u.roles?.includes('partner') || u.role === 'partner')
        : [];
      setModalLookups({ clients, matters, lawyers, users, folders, invoices, activities });
    } catch (e) {
      console.error(e);
    }
  }, [isLoggedIn, user, role]);

  useEffect(() => {
    refreshModalLookups();
  }, [refreshModalLookups]);

  useEffect(() => {
    if (!isLoggedIn) return;
    window.addEventListener('vktori:entities-changed', refreshModalLookups);

    // Global modal opener for cross-component triggers
    const openHandler = (e) => {
      const { type, data, onSave } = e.detail || {};
      if (type) setModal({ type, data, onSave });
    };
    window.addEventListener('vktori:open-modal', openHandler);

    return () => {
      window.removeEventListener('vktori:entities-changed', refreshModalLookups);
      window.removeEventListener('vktori:open-modal', openHandler);
    };
  }, [isLoggedIn, refreshModalLookups]);

  // Session verification on mount
  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('vktori_token');
      const cachedUser = JSON.parse(localStorage.getItem('vktori_user') || 'null');
      const cachedRole = localStorage.getItem('vktori_role');

      if (token || cachedUser) {
        try {
          if (token && !token.startsWith('demo_')) {
            const response = await api.auth.getMe();
            const me = response?.data;
            if (me?.id && me?.roles && me.roles.length > 0) {
              const activeRole = cachedRole || (me.roles.includes('admin') ? 'admin' : me.roles[0]);
              const mergedUser = {
                ...me,
                roles: Array.from(new Set([...(me.roles || []), ...(cachedUser?.roles || []), activeRole])),
                role: activeRole,
              };
              localStorage.setItem('vktori_user', JSON.stringify(mergedUser));
              localStorage.setItem('vktori_role', activeRole);
              setUser(mergedUser);
              setRole(activeRole);
              setIsLoggedIn(true);
            } else if (cachedUser && cachedRole) {
              setUser(cachedUser);
              setRole(cachedRole);
              setIsLoggedIn(true);
            }
          } else if (cachedUser && cachedRole) {
            setUser(cachedUser);
            setRole(cachedRole);
            setIsLoggedIn(true);
          }
        } catch (err) {
          if (cachedUser && cachedRole && HOME_ROUTE[cachedRole]) {
            setUser(cachedUser);
            setRole(cachedRole);
            setIsLoggedIn(true);
          } else {
            handleLogout();
          }
        }
      }
      setIsInitializing(false);
    };
    initSession();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (isLoggedIn && role) {
      localStorage.setItem('vktori_screen', 'app');
      localStorage.setItem('vktori_role', role);
    }
  }, [isLoggedIn, role]);

  const handleLogin = (userData, token) => {
    if (!userData?.roles || userData.roles.length === 0) {
      toast(`User has no assigned roles. Contact support.`, 'error');
      return;
    }

    let activeRole = localStorage.getItem('vktori_role');
    if (!activeRole || !userData.roles.includes(activeRole)) {
      activeRole = userData.roles.includes('admin') ? 'admin' : userData.roles[0];
    }

    const home = HOME_ROUTE[activeRole];
    if (!home) {
      toast(`Unknown account role: ${activeRole}. Contact support.`, 'error');
      return;
    }
    
    localStorage.setItem('vktori_token', token);
    localStorage.setItem('vktori_user', JSON.stringify(userData));
    localStorage.setItem('vktori_role', activeRole);
    setUser(userData);
    setRole(activeRole);
    setIsLoggedIn(true);
    routerNavigate(home, { replace: true });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setRole(null);
    localStorage.clear();
    routerNavigate('/login');
  };

  const handleSwitchRole = (newRole) => {
    if (!HOME_ROUTE[newRole]) return;
    localStorage.setItem('vktori_role', newRole);
    setRole(newRole);
    routerNavigate(HOME_ROUTE[newRole], { replace: true });
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Internal layout element
  const appLayoutEl = (
    <AppLayout
      role={role}
      user={user}
      onLogout={handleLogout}
      onSwitchRole={handleSwitchRole}
      toast={toast}
      modal={modal}
      setModal={setModal}
      modalLookups={modalLookups}
    />
  );

  return (
    <>
      <Routes>
        {/* PUBLIC WEBSITE ROUTES */}
        <Route element={<WebsiteLayout toast={toast} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<Navigate to="/#our-firm" replace />} />
          <Route path="/practice-areas" element={<Navigate to="/#practice-areas" replace />} />
          <Route path="/contact" element={<Navigate to="/#contact-us" replace />} />
          <Route path="/book-consultation" element={<Navigate to="/#book-consultation" replace />} />
          <Route path="/client-portal" element={<ClientPortalLandingPage />} />
        </Route>

        {/* E-SIGN ROUTE */}
        <Route path="/sign/:token" element={<SignDocument />} />

        {/* AUTH ROUTES */}
        <Route path="/login" element={<LoginScreen onLogin={handleLogin} />} />

        {/* PROTECTED APP ROUTES (Guarded) */}
        {/* SUPER ADMIN ROUTES */}
        <Route path="/super-admin" element={isLoggedIn && (user?.roles?.includes('super_admin') || user?.roles?.includes('superadmin') || role === 'super_admin' || role === 'superadmin') ? appLayoutEl : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="agencies" element={<SuperAdminAgencies />} />
          <Route path="offices" element={<SuperAdminOffices />} />
          <Route path="users" element={<SuperAdminUsers />} />
          <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
          <Route path="reports" element={<SuperAdminReports />} />
          <Route path="activity-logs" element={<SuperAdminActivityLogs />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={isLoggedIn && (user?.roles?.includes('admin') || role === 'admin') ? appLayoutEl : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="intake-leads" element={<LeadsPage />} />
          <Route path="intake-leads/:id" element={<LeadDetailWrapper />} />
          <Route path="conflict-check" element={<ConflictPage />} />
          <Route path="clients" element={<AdminClientsPage />} />
          <Route path="clients/:id" element={<AdminClientDetailPage />} />
          <Route path="matters" element={<AdminMattersPage />} />
          <Route path="matters/:id" element={<AdminMatterDetailPage />} />
          <Route path="parties" element={<AdminPartiesPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="calendar" element={<AdminCalendarPage />} />
          <Route path="documents" element={<AdminDocumentsPage />} />
          <Route path="court-forms" element={<AdminCourtFormsPage />} />
          <Route path="billing" element={<AdminBillingPage />} />
          <Route path="communications" element={<AdminEmailPage />} />
          <Route path="messages" element={<AdminEmailPage />} />
          <Route path="titan-email" element={<TitanEmailModule />} />
          <Route path="vynius" element={<AdminAIPage />} />
          <Route path="marketing" element={<AdminMarketingPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="back-office" element={<AdminBackOfficePage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="integrations" element={<AdminIntegrationsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* LAWYER ROUTES */}
        <Route path="/lawyer" element={isLoggedIn && (user?.roles?.includes('lawyer') || role === 'lawyer') ? appLayoutEl : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/lawyer/dashboard" replace />} />
          <Route path="dashboard" element={<LawyerDashboardPage />} />
          <Route path="clients" element={<LawyerClientsWrapper />} />
          <Route path="clients/:id" element={<LawyerClientDetailWrapper />} />
          <Route path="matters" element={<LawyerMattersPage />} />
          <Route path="matters/:id" element={<LawyerMatterDetailWrapper />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="calendar" element={<LawyerCalendarPage />} />
          <Route path="documents" element={<LawyerDocumentsPage />} />
          <Route path="court-forms" element={<LawyerCourtFormsPage />} />
          <Route path="billing" element={<LawyerBillingPage />} />
          <Route path="email" element={<LawyerEmailPage />} />
          <Route path="titan-email" element={<TitanEmailModule />} />
          <Route path="vynius" element={<LawyerAIPage />} />
          <Route path="profile" element={<LawyerProfileWrapper />} />
          <Route path="settings" element={<LawyerSettingsPage />} />
        </Route>

        {/* PARTNER ROUTES */}
        <Route path="/partner" element={isLoggedIn && (user?.roles?.includes('partner') || role === 'partner') ? appLayoutEl : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/partner/dashboard" replace />} />
          <Route path="dashboard" element={<PartnerDashboard />} />
          <Route path="my-matters" element={<PartnerMyMatters />} />
          <Route path="matters/:id" element={<LawyerMatterDetailWrapper />} />
          <Route path="firm-matters" element={<PartnerFirmMatters />} />
          <Route path="calendar" element={<PartnerCalendar />} />
          <Route path="documents" element={<PartnerDocuments />} />
          <Route path="billing" element={<PartnerBilling />} />
          <Route path="communications" element={<PartnerCommunications />} />
          <Route path="reports" element={<PartnerReports />} />
          <Route path="team" element={<PartnerTeam />} />
          <Route path="conflict-check" element={<PartnerConflictCheck />} />
          <Route path="settings" element={<PartnerSettings />} />
        </Route>

        {/* PARALEGAL ROUTES */}
        <Route path="/paralegal" element={isLoggedIn && (user?.roles?.includes('paralegal') || role === 'paralegal') ? appLayoutEl : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/paralegal/dashboard" replace />} />
          <Route path="dashboard" element={<ParalegalDashboard />} />
          <Route path="my-matters" element={<ParalegalMyMatters />} />
          <Route path="matters/:id" element={<LawyerMatterDetailWrapper />} />
          <Route path="calendar" element={<ParalegalCalendar />} />
          <Route path="documents" element={<ParalegalDocuments />} />
          <Route path="billing" element={<ParalegalTimeEntries />} />
          <Route path="tasks" element={<ParalegalTasks />} />
          <Route path="communications" element={<ParalegalCommunications />} />
          <Route path="conflict-check" element={<ParalegalConflictCheck />} />
          <Route path="settings" element={<ParalegalSettings />} />
        </Route>

        {/* CLIENT ROUTES */}
        <Route path="/client" element={isLoggedIn && (user?.roles?.includes('client') || role === 'client') ? appLayoutEl : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboardPage />} />
          <Route path="matters" element={<ClientMattersPage />} />
          <Route path="matters/:id" element={<ClientMatterDetailWrapper />} />
          <Route path="documents" element={<ClientDocsPage />} />
          <Route path="billing" element={<ClientBillingWrapper />} />
          <Route path="messages" element={<ClientMessagesWrapper />} />
          <Route path="profile" element={<ClientProfileWrapper />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={isLoggedIn && HOME_ROUTE[role] ? <Navigate to={HOME_ROUTE[role]} replace /> : <Navigate to="/" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} />
    </>
  );
}
