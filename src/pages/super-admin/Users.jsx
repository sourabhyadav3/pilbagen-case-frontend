import { useState, useMemo } from 'react';
import { PageHeader, Table, Tr, Td, Badge, Avatar, Modal, Field, Input, Select, EmptyState, useToast } from '../../components/UI.jsx';
import { initialUsers, initialAgencies } from '../../data/superAdminData';

export default function SuperAdminUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [activeModal, setActiveModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Lawyer', agency: 'Apex Legal Group', status: 'active' });

  const { toast } = useToast();

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            u.agency.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', role: 'Lawyer', agency: initialAgencies[0]?.name || 'Apex Legal Group', status: 'active' });
    setActiveModal('add');
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({ ...user });
    setActiveModal('edit');
  };

  const handleOpenView = (user) => {
    setSelectedUser(user);
    setActiveModal('view');
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setActiveModal('delete');
  };

  const handleSaveAdd = () => {
    if (!formData.name || !formData.email) {
      toast('Please enter full name and email.', 'error');
      return;
    }
    const initials = formData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const newUser = {
      id: `USR-${users.length + 1}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      agency: formData.agency,
      status: formData.status,
      lastLogin: 'Never',
      initials: initials || 'US',
      color: formData.role === 'Super Admin' ? '#7c3aed' : '#0057c7',
    };
    setUsers([newUser, ...users]);
    setActiveModal(null);
    toast(`User "${formData.name}" created successfully!`, 'success');
  };

  const handleSaveEdit = () => {
    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u));
    setActiveModal(null);
    toast(`User "${formData.name}" updated!`, 'success');
  };

  const handleDelete = () => {
    setUsers(users.filter(u => u.id !== selectedUser.id));
    setActiveModal(null);
    toast(`User "${selectedUser.name}" deleted!`, 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title="Platform Users" 
        subtitle="Global directory of all platform administrators, lawyers, agency staff, and clients"
      >
        <button 
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-[#0057c7] text-white font-700 text-[14px] hover:bg-[#0057c7]/80 shadow-lg shadow-[#0057c7]/20 flex items-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4" /></svg>
          Create New User
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#1a2233]/40 p-4 rounded-2xl border border-white/5 backdrop-blur-xl">
        <div className="w-full sm:flex-1 min-w-[180px]">
          <Input 
            placeholder="Search users by name, email, or agency..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:w-44">
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="super admin">Super Admin</option>
              <option value="agency administrator">Agency Administrator</option>
              <option value="lawyer">Lawyer</option>
              <option value="client">Client</option>
            </Select>
          </div>
          <div className="flex-1 sm:w-44">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState 
          icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
          title="No Users Found" 
          desc="No user accounts match your search filter." 
        />
      ) : (
        <Table headers={['User', 'System Role', 'Assigned Agency', 'Last Login', 'Status', 'Actions']}>
          {filteredUsers.map((user) => (
            <Tr key={user.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar initials={user.initials} size="sm" color={user.color} />
                  <div>
                    <div className="text-white font-700">{user.name}</div>
                    <div className="text-[12px] text-[#8a94a6]">{user.email}</div>
                  </div>
                </div>
              </Td>
              <Td>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-800 uppercase tracking-wider ${user.role === 'Super Admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                  {user.role}
                </span>
              </Td>
              <Td className="text-white font-600">
                {user.agency}
              </Td>
              <Td className="text-[12px] text-[#8a94a6]">
                {user.lastLogin}
              </Td>
              <Td>
                <Badge status={user.status} />
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenView(user)} className="px-3 py-1.5 rounded-lg bg-white/5 text-white hover:bg-white/10 text-[12px] font-700 transition-all">
                    View
                  </button>
                  <button onClick={() => handleOpenEdit(user)} className="px-3 py-1.5 rounded-lg bg-[#0057c7]/20 text-[#38bdf8] hover:bg-[#0057c7]/30 text-[12px] font-700 transition-all">
                    Edit
                  </button>
                  <button onClick={() => handleOpenDelete(user)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[12px] font-700 transition-all">
                    Delete
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Modals */}
      {activeModal === 'add' && (
        <Modal title="Create New Platform User" onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">Cancel</button>
              <button onClick={handleSaveAdd} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">Create User</button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Full Name" required>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Jonathan Reed" />
            </Field>
            <Field label="Email Address" required>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="e.g. jreed@beaconlaw.com" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Assign Role">
                <Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Agency Administrator">Agency Administrator</option>
                  <option value="Lawyer">Lawyer</option>
                  <option value="Client">Client</option>
                </Select>
              </Field>
              <Field label="Assigned Agency">
                <Select value={formData.agency} onChange={(e) => setFormData({ ...formData, agency: e.target.value })}>
                  {initialAgencies.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </Select>
              </Field>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'edit' && selectedUser && (
        <Modal title={`Edit User - ${selectedUser.name}`} onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">Cancel</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">Update User</button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Full Name" required>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Field>
            <Field label="Email Address" required>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          </div>
        </Modal>
      )}

      {activeModal === 'view' && selectedUser && (
        <Modal title={`User Profile - ${selectedUser.name}`} onClose={() => setActiveModal(null)}
          footer={<button onClick={() => setActiveModal(null)} className="px-5 py-2 rounded-xl bg-[#0057c7] text-white text-[13px] font-700">Close</button>}
        >
          <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/5 text-[14px]">
            <div>
              <p className="text-[11px] text-[#8a94a6] uppercase font-700">User ID</p>
              <p className="text-white font-800">{selectedUser.id}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8a94a6] uppercase font-700">Role</p>
              <p className="text-purple-300 font-800">{selectedUser.role}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8a94a6] uppercase font-700">Agency</p>
              <p className="text-white font-600">{selectedUser.agency}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8a94a6] uppercase font-700">Status</p>
              <Badge status={selectedUser.status} />
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'delete' && selectedUser && (
        <Modal title="Confirm Delete User" onClose={() => setActiveModal(null)}
          footer={
            <>
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-white text-[13px] font-700">Cancel</button>
              <button onClick={handleDelete} className="px-5 py-2 rounded-xl bg-red-600 text-white text-[13px] font-700">Delete User</button>
            </>
          }
        >
          <p className="text-[14px] text-[#b8c2d1]">Are you sure you want to delete <strong className="text-white">{selectedUser.name}</strong>?</p>
        </Modal>
      )}
    </div>
  );
}
