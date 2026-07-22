// Shared Mock Data Source for Super Admin Phase 1 UI

export const initialAgencies = [
  { id: 'AG-101', name: 'Apex Legal Group', owner: 'Robert Vance', email: 'vance@apexlegal.com', phone: '+1 (555) 234-5678', plan: 'Enterprise', officesCount: 4, usersCount: 28, status: 'active', createdAt: '2025-01-15', revenue: '$14,500' },
  { id: 'AG-102', name: 'Lexington Partners', owner: 'Eleanor Vance', email: 'contact@lexingtonlaw.com', phone: '+1 (555) 876-5432', plan: 'Professional', officesCount: 2, usersCount: 14, status: 'active', createdAt: '2025-03-20', revenue: '$6,800' },
  { id: 'AG-103', name: 'Titan Defense Advocates', owner: 'Marcus Thorne', email: 'mthorne@titandefense.org', phone: '+1 (555) 432-1098', plan: 'Enterprise', officesCount: 5, usersCount: 42, status: 'active', createdAt: '2024-11-10', revenue: '$22,000' },
  { id: 'AG-104', name: 'Beacon Civil Litigation', owner: 'Sarah Jenkins', email: 'sjenkins@beaconlaw.com', phone: '+1 (555) 987-6543', plan: 'Basic', officesCount: 1, usersCount: 5, status: 'pending', createdAt: '2026-06-01', revenue: '$1,200' },
  { id: 'AG-105', name: 'Vanguard Family Law', owner: 'David Sterling', email: 'dsterling@vanguardfam.com', phone: '+1 (555) 345-6789', plan: 'Professional', officesCount: 2, usersCount: 12, status: 'active', createdAt: '2025-08-12', revenue: '$7,400' },
  { id: 'AG-106', name: 'Solace IP & Patent Attorneys', owner: 'Claire Bennet', email: 'cbennet@solaceip.io', phone: '+1 (555) 654-3210', plan: 'Basic', officesCount: 1, usersCount: 3, status: 'inactive', createdAt: '2026-02-18', revenue: '$950' },
];

export const initialOffices = [
  { id: 'OFF-1', agencyId: 'AG-101', agencyName: 'Apex Legal Group', name: 'New York HQ', location: 'New York, NY', phone: '+1 (212) 555-0199', manager: 'Robert Vance', activeMatters: 142, status: 'active' },
  { id: 'OFF-2', agencyId: 'AG-101', agencyName: 'Apex Legal Group', name: 'Chicago Branch', location: 'Chicago, IL', phone: '+1 (312) 555-0144', manager: 'Jessica Alba', activeMatters: 88, status: 'active' },
  { id: 'OFF-3', agencyId: 'AG-102', agencyName: 'Lexington Partners', name: 'Boston Main Office', location: 'Boston, MA', phone: '+1 (617) 555-0182', manager: 'Eleanor Vance', activeMatters: 64, status: 'active' },
  { id: 'OFF-4', agencyId: 'AG-103', agencyName: 'Titan Defense Advocates', name: 'Houston Central', location: 'Houston, TX', phone: '+1 (713) 555-0111', manager: 'Marcus Thorne', activeMatters: 210, status: 'active' },
  { id: 'OFF-5', agencyId: 'AG-103', agencyName: 'Titan Defense Advocates', name: 'Dallas Downtown', location: 'Dallas, TX', phone: '+1 (214) 555-0167', manager: 'Carlos Mendez', activeMatters: 115, status: 'active' },
  { id: 'OFF-6', agencyId: 'AG-105', agencyName: 'Vanguard Family Law', name: 'Seattle Regional', location: 'Seattle, WA', phone: '+1 (206) 555-0133', manager: 'David Sterling', activeMatters: 45, status: 'active' },
];

export const initialUsers = [
  { id: 'USR-1', name: 'Pilbågen Admin', email: 'superadmin@pilbagen.se', role: 'Super Admin', agency: 'Platform Head', status: 'active', lastLogin: '2 mins ago', initials: 'PA', color: '#7c3aed' },
  { id: 'USR-2', name: 'Robert Vance', email: 'vance@apexlegal.com', role: 'Agency Administrator', agency: 'Apex Legal Group', status: 'active', lastLogin: '1 hour ago', initials: 'RV', color: '#003e9e' },
  { id: 'USR-3', name: 'Alex Parker', email: 'lawyer@pilbagen.se', role: 'Lawyer', agency: 'Apex Legal Group', status: 'active', lastLogin: '15 mins ago', initials: 'AP', color: '#0057c7' },
  { id: 'USR-4', name: 'Sarah Mitchell', email: 'smitchell@gmail.com', role: 'Client', agency: 'Lexington Partners', status: 'active', lastLogin: 'Yesterday', initials: 'SM', color: '#22c55e' },
  { id: 'USR-5', name: 'Marcus Thorne', email: 'mthorne@titandefense.org', role: 'Agency Administrator', agency: 'Titan Defense Advocates', status: 'active', lastLogin: '3 hours ago', initials: 'MT', color: '#003e9e' },
  { id: 'USR-6', name: 'Claire Bennet', email: 'cbennet@solaceip.io', role: 'Lawyer', agency: 'Solace IP', status: 'inactive', lastLogin: '2 weeks ago', initials: 'CB', color: '#8a94a6' },
  { id: 'USR-7', name: 'Jonathan Reed', email: 'jreed@beaconlaw.com', role: 'Agency Administrator', agency: 'Beacon Civil Litigation', status: 'pending', lastLogin: 'Never', initials: 'JR', color: '#f59e0b' },
];

export const initialSubscriptions = [
  { id: 'SUB-101', agency: 'Apex Legal Group', plan: 'Enterprise', mrr: '$1,499', billingCycle: 'Monthly', status: 'active', renewalDate: '2026-08-15', autoRenew: true },
  { id: 'SUB-102', agency: 'Titan Defense Advocates', plan: 'Enterprise', mrr: '$2,199', billingCycle: 'Monthly', status: 'active', renewalDate: '2026-08-10', autoRenew: true },
  { id: 'SUB-103', agency: 'Lexington Partners', plan: 'Professional', mrr: '$699', billingCycle: 'Monthly', status: 'active', renewalDate: '2026-08-20', autoRenew: true },
  { id: 'SUB-104', agency: 'Vanguard Family Law', plan: 'Professional', mrr: '$699', billingCycle: 'Annual', status: 'active', renewalDate: '2027-01-12', autoRenew: true },
  { id: 'SUB-105', agency: 'Beacon Civil Litigation', plan: 'Basic', mrr: '$299', billingCycle: 'Monthly', status: 'pending', renewalDate: '2026-08-01', autoRenew: false },
  { id: 'SUB-106', agency: 'Solace IP Attorneys', plan: 'Basic', mrr: '$299', billingCycle: 'Monthly', status: 'inactive', renewalDate: '2026-06-18', autoRenew: false },
];

export const pricingPlans = [
  { name: 'Basic', price: '$299', period: '/month', features: ['Up to 5 Users', '1 Law Office Location', 'Standard Intake & Cases', 'Basic Reports & Storage (50GB)', 'Email Support'] },
  { name: 'Professional', price: '$699', period: '/month', popular: true, features: ['Up to 20 Users', '3 Law Office Locations', 'Advanced Case & Billing Module', 'Custom Client Portal', 'Priority Email & Phone Support'] },
  { name: 'Enterprise', price: '$1,499', period: '/month', features: ['Unlimited Users & Offices', 'Multi-Agency Management', 'Dedicated Account Manager', 'Custom Integrations & API Access', '24/7 SLA Support'] },
];

export const initialActivityLogs = [
  { id: 'LOG-901', timestamp: '2026-07-21 15:30:12', actor: 'Pilbågen Admin', role: 'Super Admin', action: 'Updated System Settings', module: 'Settings', ip: '192.168.1.10', severity: 'low' },
  { id: 'LOG-902', timestamp: '2026-07-21 14:12:45', actor: 'Robert Vance', role: 'Agency Admin', action: 'Created New Law Office (Chicago)', module: 'Offices', ip: '104.28.14.92', severity: 'medium' },
  { id: 'LOG-903', timestamp: '2026-07-21 11:45:00', actor: 'Marcus Thorne', role: 'Agency Admin', action: 'Upgraded Subscription to Enterprise', module: 'Subscriptions', ip: '172.56.21.04', severity: 'high' },
  { id: 'LOG-904', timestamp: '2026-07-20 18:22:19', actor: 'System Daemon', role: 'Automated Task', action: 'Executed Nightly Database Backup', module: 'System', ip: '127.0.0.1', severity: 'low' },
  { id: 'LOG-905', timestamp: '2026-07-20 10:05:33', actor: 'Claire Bennet', role: 'Lawyer', action: 'Failed Login Attempt (Invalid Password)', module: 'Security', ip: '98.210.45.11', severity: 'high' },
];

export const initialSettings = {
  platformName: 'Pilbågen Legal Platform',
  supportEmail: 'support@pilbagen.se',
  defaultLanguage: 'English (US)',
  maintenanceMode: false,
  enableRegistration: true,
  twoFactorRequired: true,
  sessionTimeoutMinutes: 60,
  maxFileUploadMb: 100,
  themeColor: '#0057c7',
  smtpServer: 'mail.pilbagen.se',
  smtpPort: '587',
  smtpSender: 'no-reply@pilbagen.se',
};
