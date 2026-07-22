// Centralized Mock Data Layer for Partner Role (Phase 4.2 Enhanced)

export const partnerMockKpis = [
  { id: 'kpi-1', label: 'Active Matters', value: '18', change: '+3 this mo', color: 'blue' },
  { id: 'kpi-2', label: 'Firm Matters', value: '46', change: '+8 total', color: 'purple' },
  { id: 'kpi-3', label: 'Active Clients', value: '24', change: '+2 new', color: 'emerald' },
  { id: 'kpi-4', label: 'Associate Lawyers', value: '8 Staff', change: 'Optimal', color: 'amber' },
  { id: 'kpi-5', label: 'Monthly Revenue', value: '$188,400', change: '+14.2%', color: 'emerald' },
  { id: 'kpi-6', label: 'Billable Hours', value: '420.5h', change: '+28.4h', color: 'blue' },
  { id: 'kpi-7', label: 'Pending Approvals', value: '5 Items', change: 'Action Required', color: 'rose' },
  { id: 'kpi-8', label: 'Upcoming Hearings', value: '4 Next 7d', change: 'On Track', color: 'indigo' },
];

export const partnerMockFirmPerformance = {
  avgDuration: '4.2 Months',
  successRate: '94.8%',
  realizationRate: '96.2%',
  practiceAreas: [
    { area: 'Corporate & M&A', revenue: '$142,000', percentage: 37, matters: 14, utilization: 95.4 },
    { area: 'Civil Litigation', revenue: '$118,500', percentage: 31, matters: 18, utilization: 92.0 },
    { area: 'Intellectual Property', revenue: '$74,000', percentage: 19, matters: 8, utilization: 88.5 },
    { area: 'Employment & Labor', revenue: '$50,000', percentage: 13, matters: 6, utilization: 86.0 },
  ],
};

export const partnerMockTeamPerformance = [
  { id: 1, name: 'David Sterling, Esq.', role: 'Partner', position: 'Senior Partner', department: 'Corporate & M&A', billed: '$42,000', hours: '165h', utilization: 98, active_matters: 12, status: 'active' },
  { id: 2, name: 'Alex Parker, Esq.', role: 'Lawyer', position: 'Senior Associate', department: 'Civil Litigation', billed: '$34,200', hours: '148h', utilization: 92, active_matters: 8, status: 'active' },
  { id: 3, name: 'Sarah Jenkins, Esq.', role: 'Lawyer', position: 'Associate Attorney', department: 'Intellectual Property', billed: '$28,500', hours: '132h', utilization: 88, active_matters: 6, status: 'active' },
  { id: 4, name: 'Emily Carter', role: 'Paralegal', position: 'Senior Paralegal', department: 'Corporate', billed: '$18,400', hours: '156h', utilization: 94, active_matters: 14, status: 'active' },
  { id: 5, name: 'Michael Vance', role: 'Assistant', position: 'Legal Assistant', department: 'Administration', billed: '$9,200', hours: '120h', utilization: 82, active_matters: 0, status: 'active' },
];

export const partnerMockActivities = [
  { id: 1, type: 'billing', title: 'Invoice #INV-2026-001 Approved', detail: 'Vanguard Corp - $28,500 retainer payment cleared', time: '10 mins ago', badge: 'Billing' },
  { id: 2, type: 'document', title: 'Document Signed by Client', detail: 'Sarah Mitchell signed Apex Acquisition Term Sheet', time: '45 mins ago', badge: 'Document' },
  { id: 3, type: 'court', title: 'Hearing Scheduled', detail: 'MAT-2026-101 (Superior Court Rm 14)', time: '2 hours ago', badge: 'Calendar' },
  { id: 4, type: 'conflict', title: 'Conflict Waiver Cleared', detail: 'BioHealth Labs vs. Apex Global checked & cleared', time: '4 hours ago', badge: 'Conflict' },
];

export const partnerMockSchedule = [
  { id: 1, title: 'Partner Strategic Case Review', date: '2026-07-22', time: '09:00 AM', type: 'meeting', location: 'Executive Conference Rm A', matter: 'MAT-2026-101' },
  { id: 2, title: 'Preliminary Hearing - Vanguard vs. Sterling', date: '2026-07-25', time: '10:30 AM', type: 'court', location: 'Superior Court Dept 14', matter: 'MAT-2026-101' },
  { id: 3, title: 'M&A Closing Teleconference', date: '2026-07-28', time: '02:00 PM', type: 'client_call', location: 'Zoom Video Conference', matter: 'MAT-2026-102' },
  { id: 4, title: 'Associate Realization & Quarterly Review', date: '2026-07-30', time: '04:00 PM', type: 'internal', location: 'Boardroom', matter: 'Firm Ops' },
];

export const partnerMockMatters = [
  {
    id: 101,
    matter_number: 'MAT-2026-101',
    title: 'Vanguard Corp vs. Sterling Tech',
    client_name: 'David Sterling',
    client: { full_name: 'David Sterling', email: 'dsterling@vanguard.com' },
    lead_attorney: 'David Sterling, Esq.',
    associate: 'Alex Parker, Esq.',
    assigned_lawyer: { full_name: 'Alex Parker, Esq.' },
    status: 'in_progress',
    practice_area: 'Corporate Litigation',
    priority: 'High',
    est_value: '$150,000',
    billed: '$88,400',
    next_court_date: '2026-08-15',
    created_at: '2026-01-15',
  },
  {
    id: 102,
    matter_number: 'MAT-2026-102',
    title: 'Apex Global Acquisition Agreement',
    client_name: 'Sarah Mitchell',
    client: { full_name: 'Sarah Mitchell', email: 'smitchell@gmail.com' },
    lead_attorney: 'David Sterling, Esq.',
    associate: 'Sarah Jenkins, Esq.',
    assigned_lawyer: { full_name: 'David Sterling, Esq.' },
    status: 'in_progress',
    practice_area: 'Mergers & Acquisitions',
    priority: 'Urgent',
    est_value: '$95,000',
    billed: '$62,000',
    next_court_date: 'N/A',
    created_at: '2026-02-10',
  },
  {
    id: 103,
    matter_number: 'MAT-2026-103',
    title: 'Beacon Civil Indemnity Claim',
    client_name: 'Global Logistics Corp',
    client: { full_name: 'Global Logistics Corp', email: 'legal@globallogistics.com' },
    lead_attorney: 'Sarah Jenkins, Esq.',
    associate: 'Emily Carter',
    assigned_lawyer: { full_name: 'Sarah Jenkins, Esq.' },
    status: 'review',
    practice_area: 'Civil Dispute',
    priority: 'Medium',
    est_value: '$75,000',
    billed: '$41,200',
    next_court_date: '2026-09-01',
    created_at: '2026-03-05',
  },
  {
    id: 104,
    matter_number: 'MAT-2026-104',
    title: 'BioHealth IP Defense & Patent Waiver',
    client_name: 'BioHealth Labs',
    client: { full_name: 'BioHealth Labs', email: 'ip@biohealth.org' },
    lead_attorney: 'David Sterling, Esq.',
    associate: 'Alex Parker, Esq.',
    assigned_lawyer: { full_name: 'David Sterling, Esq.' },
    status: 'closed',
    practice_area: 'Intellectual Property',
    priority: 'Low',
    est_value: '$120,000',
    billed: '$120,000',
    next_court_date: 'N/A',
    created_at: '2026-01-08',
  },
];

export const partnerMockClients = [
  { id: 201, full_name: 'David Sterling', email: 'dsterling@vanguard.com', phone: '+1 (555) 234-5678', company: 'Vanguard Corp', status: 'active', matters_count: 3 },
  { id: 202, full_name: 'Sarah Mitchell', email: 'smitchell@gmail.com', phone: '+1 (555) 876-5432', company: 'Apex Global', status: 'active', matters_count: 2 },
  { id: 203, full_name: 'Global Logistics Corp', email: 'legal@globallogistics.com', phone: '+1 (555) 345-6789', company: 'Global Logistics', status: 'active', matters_count: 4 },
];

export const partnerMockDocuments = [
  { id: 1, title: 'Master_Partnership_Retainer_2026.pdf', category: 'Agreements', size: '3.2 MB', updated_at: '2026-07-18', uploaded_by: 'David Sterling, Esq.', status: 'approved' },
  { id: 2, title: 'Vanguard_Settlement_Term_Sheet_v4.docx', category: 'Pleadings', size: '1.8 MB', updated_at: '2026-07-20', uploaded_by: 'Alex Parker, Esq.', status: 'pending_review' },
  { id: 3, title: 'BioHealth_Patent_Waiver_Executed.pdf', category: 'IP Contracts', size: '4.5 MB', updated_at: '2026-07-10', uploaded_by: 'David Sterling, Esq.', status: 'approved' },
];

export const partnerMockBilling = [
  { id: 'INV-2026-001', client_name: 'Vanguard Corp', matter_number: 'MAT-2026-101', amount: '$28,500', status: 'paid', issue_date: '2026-07-01', due_date: '2026-07-15' },
  { id: 'INV-2026-002', client_name: 'Apex Global', matter_number: 'MAT-2026-102', amount: '$18,200', status: 'sent', issue_date: '2026-07-10', due_date: '2026-07-24' },
  { id: 'INV-2026-003', client_name: 'Global Logistics Corp', matter_number: 'MAT-2026-103', amount: '$14,750', status: 'draft', issue_date: '2026-07-20', due_date: '2026-08-05' },
];

export const partnerMockCommunications = [
  { id: 1, sender: 'David Sterling', subject: 'Urgent: Partner Review Required for Vanguard Settlement', time: '10:45 AM', is_read: false, preview: 'The updated term sheet has been received from opposing counsel...' },
  { id: 2, sender: 'Sarah Mitchell', subject: 'Apex Acquisition Closing Checklist', time: 'Yesterday', is_read: true, preview: 'Confirming all closing schedules have been signed off by external audit...' },
  { id: 3, sender: 'Alex Parker, Esq.', subject: 'Associate Weekly Billing & Docket Summary', time: 'Jul 19', is_read: true, preview: 'Summary of 48.5 billable hours logged across civil litigation matters...' },
];

export const partnerMockReports = {
  totalRevenue: '$384,500',
  billableHours: '1,240h',
  realizationRate: '95.4%',
  activeAttorneys: 8,
  revenueByArea: [
    { area: 'Corporate & M&A', revenue: '$142,000', percentage: '37%' },
    { area: 'Civil Litigation', revenue: '$118,500', percentage: '31%' },
    { area: 'Intellectual Property', revenue: '$74,000', percentage: '19%' },
    { area: 'Employment & Labor', revenue: '$50,000', percentage: '13%' },
  ],
};

export const partnerMockConflicts = [
  { id: 'CNF-2026-101', entity: 'Apex Global Corp', party_type: 'Acquirer', status: 'cleared', matched_parties: 0, date: '2026-07-20' },
  { id: 'CNF-2026-102', entity: 'Sterling Tech Inc.', party_type: 'Adverse Entity', status: 'waiver_required', matched_parties: 1, date: '2026-07-18' },
];
