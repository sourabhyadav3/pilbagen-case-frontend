import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Avatar } from './UI.jsx';
import { useLanguage } from '../context/LanguageContext';
import logoImg from '../assets/pilbagen-logo.png';

// ── Nav Icon ──────────────────────────────────────────────
const NAV_ICONS = {
  dashboard: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  calendar: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  leads: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>,
  cases: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  clients: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  marketing: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>,
  billing: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 14l6-6m-5.5.5h.5m5.5.5h.5m-6 4h.5m5.5.5h.5M3 16.5v-13a1 1 0 011-1h16a1 1 0 011 1v13a1 1 0 01-1 1H4a1 1 0 01-1-1z" /><path d="M16 21.5h-8" /></svg>,
  users: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  documents: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  email: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  titanemail: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>,
  reports: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  ai: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  settings: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>,
  profile: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  messages: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  courtforms: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>,
  integrations: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  agencies: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  offices: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" /></svg>,
  subscriptions: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  activity: <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

const SA_NAV = [
  { section: 'Platform Overview' },
  { id: 'sa-dashboard', label: 'Dashboard', icon: 'dashboard', path: '/super-admin/dashboard' },
  { id: 'sa-agencies', label: 'Agencies', icon: 'agencies', path: '/super-admin/agencies' },
  { id: 'sa-offices', label: 'Offices', icon: 'offices', path: '/super-admin/offices' },
  { section: 'System Administration' },
  { id: 'sa-users', label: 'Users & Roles', icon: 'users', path: '/super-admin/users' },
  { id: 'sa-subscriptions', label: 'Subscriptions', icon: 'subscriptions', path: '/super-admin/subscriptions' },
  { id: 'sa-activity-logs', label: 'Activity Logs', icon: 'activity', path: '/super-admin/activity-logs' },
];

const NAV_BY_ROLE = {
  super_admin: SA_NAV,
  superadmin: SA_NAV,
  admin: [
    { section: 'Workspace' },
    { id: 'dashboard', label: 'Home Page', icon: 'dashboard', path: '/admin/dashboard' },
    { id: 'clients', label: 'Clients', icon: 'clients', path: '/admin/clients' },
    { id: 'cases', label: 'Matters / Cases', icon: 'cases', path: '/admin/matters' },
    { id: 'billing', label: 'Time & Billing', icon: 'billing', path: '/admin/billing' },
    { id: 'conflict-check', label: 'Conflict Control', icon: 'leads', path: '/admin/conflict-check' },
    { id: 'reports', label: 'Reports', icon: 'reports', path: '/admin/reports' },
    { id: 'documents', label: 'Documents', icon: 'documents', path: '/admin/documents' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar', path: '/admin/calendar' },
    { id: 'messages', label: 'Communication', icon: 'messages', path: '/admin/messages' },
    { section: 'Administration' },
    { id: 'team-users', label: 'Users & Staff', icon: 'users', path: '/admin/users' },
    { id: 'back-office', label: 'Back Office', icon: 'offices', path: '/admin/back-office' },
  ],
  lawyer: [
    { section: 'My Work' },
    { id: 'l-dashboard', label: 'Dashboard', icon: 'dashboard', path: '/lawyer/dashboard' },
    { id: 'l-clients', label: 'My Clients', icon: 'clients', path: '/lawyer/clients' },
    { id: 'l-cases', label: 'My Matters', icon: 'cases', path: '/lawyer/matters' },
    { id: 'activities', label: 'Activities', icon: 'tasks', path: '/lawyer/activities' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar', path: '/lawyer/calendar' },
    { section: 'Tools' },
    { id: 'documents', label: 'Documents', icon: 'documents', path: '/lawyer/documents' },
    { id: 'court-forms', label: 'Library', icon: 'courtforms', path: '/lawyer/court-forms' },
    { id: 'billing', label: 'Billing', icon: 'billing', path: '/lawyer/billing' },
    { id: 'email', label: 'Email', icon: 'email', path: '/lawyer/email' },
    { id: 'titan-email', label: 'Email', icon: 'titanemail', path: '/lawyer/titan-email' },
    { id: 'ai', label: 'VyNius', icon: 'ai', path: '/lawyer/vynius' },
    { id: 'integrations', label: 'Integrations', icon: 'integrations', path: '/lawyer/integrations' },
    { id: 'l-conflict', label: 'Conflict Check', icon: 'leads', path: '/lawyer/conflict-check' },
    { section: 'Account' },
    { id: 'l-profile', label: 'My Profile', icon: 'profile', path: '/lawyer/profile' },
  ],
  client: [
    { section: 'My Portal' },
    { id: 'c-dashboard', label: 'Dashboard', icon: 'dashboard', path: '/client/dashboard' },
    { id: 'c-cases', label: 'My Matters', icon: 'cases', path: '/client/matters' },
    { id: 'c-documents', label: 'Documents', icon: 'documents', path: '/client/documents' },
    { id: 'c-billing', label: 'Billing', icon: 'billing', path: '/client/billing' },
    { id: 'c-messages', label: 'Messages', icon: 'messages', path: '/client/messages' },
    { section: 'Account' },
    { id: 'c-profile', label: 'My Profile', icon: 'profile', path: '/client/profile' },
  ],
  partner: [
    { section: 'Practice & Matters' },
    { id: 'p-dashboard', label: 'Dashboard', icon: 'dashboard', path: '/partner/dashboard' },
    { id: 'p-my-matters', label: 'My Matters', icon: 'cases', path: '/partner/my-matters' },
    { id: 'p-firm-matters', label: 'Firm Matters', icon: 'cases', path: '/partner/firm-matters' },
    { id: 'p-calendar', label: 'Calendar', icon: 'calendar', path: '/partner/calendar' },
    { section: 'Practice Tools' },
    { id: 'p-documents', label: 'Documents', icon: 'documents', path: '/partner/documents' },
    { id: 'p-billing', label: 'Time & Billing', icon: 'billing', path: '/partner/billing' },
    { id: 'p-communications', label: 'Communications', icon: 'email', path: '/partner/communications' },
    { id: 'p-conflict', label: 'Conflict Check', icon: 'leads', path: '/partner/conflict-check' },
    { section: 'Partnership & Oversight' },
    { id: 'p-reports', label: 'Reports', icon: 'reports', path: '/partner/reports' },
    { id: 'p-team', label: 'Team', icon: 'users', path: '/partner/team' },
    { id: 'p-settings', label: 'Settings', icon: 'settings', path: '/partner/settings' },
  ],
  paralegal: [
    { section: 'Support Workspace' },
    { id: 'pg-dashboard', label: 'Dashboard', icon: 'dashboard', path: '/paralegal/dashboard' },
    { id: 'pg-my-matters', label: 'My Matters', icon: 'cases', path: '/paralegal/my-matters' },
    { id: 'pg-calendar', label: 'Calendar', icon: 'calendar', path: '/paralegal/calendar' },
    { id: 'pg-documents', label: 'Documents', icon: 'documents', path: '/paralegal/documents' },
    { section: 'Case Operations' },
    { id: 'pg-billing', label: 'Time Entries', icon: 'billing', path: '/paralegal/billing' },
    { id: 'pg-tasks', label: 'Tasks', icon: 'activity', path: '/paralegal/tasks' },
    { id: 'pg-communications', label: 'Communications', icon: 'email', path: '/paralegal/communications' },
    { id: 'pg-conflict', label: 'Conflict Check', icon: 'leads', path: '/paralegal/conflict-check' },
    { id: 'pg-settings', label: 'Settings', icon: 'settings', path: '/paralegal/settings' },
  ],
  assistant: [],
};

const ROLE_INFO = {
  super_admin: { name: 'Pilbågen Admin', role: 'Super Admin', initials: 'PA', color: '#7c3aed' },
  superadmin: { name: 'Pilbågen Admin', role: 'Super Admin', initials: 'PA', color: '#7c3aed' },
  admin: { name: 'Admin User', role: 'Agency Administrator', initials: 'AU', color: '#003e9e' },
  lawyer: { name: 'Alex Parker', role: 'Lawyer', initials: 'AP', color: '#003e9e' },
  client: { name: 'Sarah Mitchell', role: 'Client', initials: 'SM', color: '#22c55e' },
  partner: { name: 'Partner User', role: 'Partner', initials: 'PU', color: '#0284c7' },
  paralegal: { name: 'Emily Carter', role: 'Paralegal', initials: 'PG', color: '#14b8a6' },
  assistant: { name: 'Assistant User', role: 'Legal Assistant', initials: 'LA', color: '#6366f1' },
};

export default function Sidebar({ open, role, user, onToggle, onLogout, onItemClick, badges = {} }) {
  const { t } = useLanguage();
  const info = ROLE_INFO[role?.toLowerCase()] || ROLE_INFO.client;
  const displayName = user?.full_name || user?.name || info.name;
  const displayInitials = displayName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const navItems = NAV_BY_ROLE[role?.toLowerCase()] || NAV_BY_ROLE.admin;

  return (
    <aside className={`flex flex-col h-screen bg-[#0A192F] border-r border-[#D4AF37]/15 shadow-2xl z-[100] transition-all duration-300 ease-in-out fixed lg:relative top-0 left-0 flex-shrink-0 ${open ? 'w-[250px] lg:w-[210px] translate-x-0' : 'w-[250px] lg:w-20 -translate-x-full lg:translate-x-0'}`}>
      {/* Floating Toggle Button (Collapsed State - Desktop Only) */}
      {!open && (
        <button onClick={onToggle}
          className="hidden lg:flex absolute -right-4 top-[22px] w-8 h-8 bg-[#0A192F] text-[#D4AF37] rounded-full items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-[#D4AF37]/30 hover:scale-110 active:scale-95 transition-all z-[110]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
        </button>
      )}

      <div className={`flex items-center h-[72px] ${open ? 'px-4' : 'px-0 justify-center'} gap-2.5 flex-shrink-0 border-b border-white/5 relative overflow-hidden notranslate`} translate="no">
        <div className="transition-all duration-300 w-10 h-10 flex items-center justify-center overflow-hidden bg-[#002868] border border-amber-400/30 rounded-xl flex-shrink-0 shadow-lg">
          <img src={logoImg} alt="Pilbågen Logo" className="w-8 h-8 object-contain rounded-lg" />
        </div>
        {open && (
          <div className="flex flex-col">
            <span className="text-white font-display font-bold text-[19px] leading-tight tracking-tight">Pilbågen</span>
            <span className="text-amber-400 font-semibold text-[10px] uppercase tracking-wider">System</span>
          </div>
        )}
        {open && (
          <button onClick={onToggle}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-[#dbe7ff] hover:bg-white/10 hover:text-white transition-all flex-shrink-0">
            {/* Show X on mobile, Chevron on Desktop */}
            <svg className="w-5 h-5 block lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
            <svg className="w-5 h-5 hidden lg:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1 custom-scrollbar">
        {navItems.map((item, i) => {
          if (item.section) {
            return open
              ? <p key={i} className="text-[10px] font-800 uppercase tracking-[0.2em] text-[#8a94a6] px-4 py-3 mt-4 first:mt-0">{t(item.section)}</p>
              : <div key={i} className="h-px bg-white/5 mx-3 my-4" />;
          }
          return (
            <NavLink key={item.id} to={item.path} onClick={onItemClick}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${!open ? 'justify-center px-0' : ''}`}
              title={!open ? t(item.label) : ''}>
              {({ isActive }) => (
                <>
                  <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[#dbe7ff]'}`}>{NAV_ICONS[item.icon]}</span>
                  {open && <span className="flex-1 text-left whitespace-nowrap font-semibold">{t(item.label)}</span>}

                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer User Card */}
      <div className="p-4 border-t border-white/5 bg-black/10 overflow-hidden">
        {open ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <Avatar initials={displayInitials} size="sm" color={info.color} className="ring-2 ring-white/10" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-700 text-white truncate">{displayName}</p>
                <p className="text-[11px] text-[#8a94a6] font-500">{t(info.role)}</p>
                {role?.toLowerCase() !== 'super_admin' && role?.toLowerCase() !== 'superadmin' && (user?.agency?.name || user?.agency_name) && (
                  <p className="text-[10px] font-700 text-[#14b8a6] truncate mt-0.5">🏢 {user?.agency?.name || user?.agency_name}</p>
                )}
              </div>
            </div>
            <button onClick={onLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-all duration-300 text-[13px] font-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              {t('Sign Out')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Avatar initials={displayInitials} size="sm" color={info.color} />
            <button onClick={onLogout}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
              title={t('Sign Out')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 16l4-4-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
