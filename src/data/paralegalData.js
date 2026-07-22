// Centralized Mock Data Layer for Paralegal Role (Phase 5)

export const paralegalMockKpis = [
  { id: 'p-kpi-1', label: 'Assigned Matters', value: '12', change: 'Active', color: 'teal' },
  { id: 'p-kpi-2', label: 'Pending Tasks', value: '8 Tasks', change: '3 High Priority', color: 'amber' },
  { id: 'p-kpi-3', label: 'Documents Pending', value: '5 Files', change: 'Review Required', color: 'purple' },
  { id: 'p-kpi-4', label: 'Upcoming Hearings', value: '3 Next 7d', change: 'Court Prep', color: 'indigo' },
  { id: 'p-kpi-5', label: 'Logged Hours', value: '118.5h', change: 'This Month', color: 'emerald' },
  { id: 'p-kpi-6', label: 'Filing Deadlines', value: '4 Next 14d', change: 'On Track', color: 'rose' },
];

export const paralegalMockTasks = [
  { id: 1, title: 'Draft Motion for Summary Judgment', matter: 'MAT-2026-101 (Vanguard vs. Sterling)', assignedBy: 'David Sterling, Esq.', dueDate: '2026-07-24', priority: 'High', status: 'in_progress' },
  { id: 2, title: 'Index Discovery Documents & Exhibits', matter: 'MAT-2026-102 (Apex Acquisition)', assignedBy: 'David Sterling, Esq.', dueDate: '2026-07-26', priority: 'Medium', status: 'pending' },
  { id: 3, title: 'Prepare Deposition Binder for Expert Witness', matter: 'MAT-2026-103 (Beacon Civil Claim)', assignedBy: 'Sarah Jenkins, Esq.', dueDate: '2026-07-28', priority: 'High', status: 'in_progress' },
  { id: 4, title: 'File Subpoena Duces Tecum in Superior Court', matter: 'MAT-2026-101 (Vanguard vs. Sterling)', assignedBy: 'Alex Parker, Esq.', dueDate: '2026-07-22', priority: 'Urgent', status: 'completed' },
];

export const paralegalMockSchedule = [
  { id: 1, title: 'Hearing Filing Deadline - MAT-2026-101', date: '2026-07-22', time: '05:00 PM', type: 'deadline', location: 'Clerk of Court - Rm 102' },
  { id: 2, title: 'Expert Deposition Prep Meeting', date: '2026-07-24', time: '11:00 AM', type: 'meeting', location: 'Conference Rm B' },
  { id: 3, title: 'Superior Court Motion Hearing', date: '2026-07-25', time: '10:30 AM', type: 'court', location: 'Superior Court Dept 14' },
];

export const paralegalMockDocuments = [
  { id: 1, title: 'Draft_Pleading_Motion_Summary_v2.docx', category: 'Pleadings', size: '2.1 MB', updated_at: '2026-07-21', status: 'draft' },
  { id: 2, title: 'Exhibit_Index_Binder_Apex_Closing.pdf', category: 'Discovery', size: '5.4 MB', updated_at: '2026-07-20', status: 'completed' },
  { id: 3, title: 'Deposition_Transcript_Summary_Sterling.docx', category: 'Transcripts', size: '1.2 MB', updated_at: '2026-07-19', status: 'under_review' },
];

export const paralegalMockTimeEntries = [
  { id: 1, date: '2026-07-21', matter: 'MAT-2026-101', activity: 'Drafting Motion for Summary Judgment & Brief', hours: 4.5, rate: '$150/hr', total: '$675.00', status: 'logged' },
  { id: 2, date: '2026-07-20', matter: 'MAT-2026-102', activity: 'Reviewing and Indexing M&A Closing Schedules', hours: 3.0, rate: '$150/hr', total: '$450.00', status: 'logged' },
  { id: 3, date: '2026-07-19', matter: 'MAT-2026-103', activity: 'Client Interview & Deposition Summary Compilation', hours: 5.0, rate: '$150/hr', total: '$750.00', status: 'approved' },
];
