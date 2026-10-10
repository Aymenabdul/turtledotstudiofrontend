import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserCheck, 
  Plus, 
  Shield, 
  Users, 
  CheckCircle2, 
  XCircle, 
  KeyRound, 
  X, 
  AlertCircle,
  Trash2,
  AlertTriangle,
  FolderPlus,
  Edit3,
  Camera,
  ImageOff,
  Video,
  Film,
  Download,
  Check,
  Search,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Layers,
  CheckCheck,
  Lock
} from 'lucide-react';
import api from '../../api/axios';
import { useAlert } from '../../context/AlertContext';

const ALL_PERMISSIONS = [
  { 
    key: 'CLIENT_VIEW', 
    label: 'View Assigned Clients', 
    desc: 'Access client contact records, dates, event logs, and account profiles.',
    category: 'Clients',
    icon: 'Users'
  },
  { 
    key: 'CLIENT_EDIT', 
    label: 'Edit Assigned Clients', 
    desc: 'Update client details, contact phone, delivery address, and studio notes.',
    category: 'Clients',
    icon: 'UserCheck'
  },
  { 
    key: 'ALBUM_CREATE', 
    label: 'Create Albums', 
    desc: 'Organize photo galleries and establish new public or private albums.',
    category: 'Albums',
    icon: 'FolderPlus'
  },
  { 
    key: 'ALBUM_EDIT', 
    label: 'Edit Albums', 
    desc: 'Modify album titles, descriptions, layout views, and cover art.',
    category: 'Albums',
    icon: 'Edit3'
  },
  { 
    key: 'ALBUM_DELETE', 
    label: 'Delete Albums', 
    desc: 'Permanently remove albums and their curated layouts.',
    category: 'Albums',
    icon: 'Trash2'
  },
  { 
    key: 'PHOTO_UPLOAD', 
    label: 'Upload Photos', 
    desc: 'Bulk upload high-res RAW and JPEG images to galleries.',
    category: 'Photos',
    icon: 'Camera'
  },
  { 
    key: 'PHOTO_DELETE', 
    label: 'Delete Photos', 
    desc: 'Delete individual frames and manage unselected photo sets.',
    category: 'Photos',
    icon: 'ImageOff'
  },
  { 
    key: 'VIDEO_UPLOAD', 
    label: 'Upload Videos', 
    desc: 'Upload 4K highlight reels, cinematic teasers, and deliverables.',
    category: 'Videos',
    icon: 'Video'
  },
  { 
    key: 'VIDEO_DELETE', 
    label: 'Delete Videos', 
    desc: 'Remove uploaded event footage and video streams.',
    category: 'Videos',
    icon: 'Film'
  },
  { 
    key: 'MEDIA_DOWNLOAD', 
    label: 'Download Media', 
    desc: 'Export original master resolution photos and video archives.',
    category: 'Delivery',
    icon: 'Download'
  },
];

const getPermIcon = (iconName) => {
  switch (iconName) {
    case 'Users': return Users;
    case 'UserCheck': return UserCheck;
    case 'FolderPlus': return FolderPlus;
    case 'Edit3': return Edit3;
    case 'Trash2': return Trash2;
    case 'Camera': return Camera;
    case 'ImageOff': return ImageOff;
    case 'Video': return Video;
    case 'Film': return Film;
    case 'Download': return Download;
    default: return Shield;
  }
};

export const Employees = () => {
  const queryClient = useQueryClient();
  const alert = useAlert();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignClientsModal, setAssignClientsModal] = useState(null);
  const [permissionsModal, setPermissionsModal] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const [clientSearch, setClientSearch] = useState('');

  const [createData, setCreateData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    designation: 'Senior Lead Photographer',
    department: 'Events & Weddings',
    notes: '',
  });
  const [createError, setCreateError] = useState('');

  // Fetch employees
  const { data: employeesData, isLoading: empLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data.data.content || [];
    },
  });

  // Fetch all clients for assignment modal
  const { data: allClients } = useQuery({
    queryKey: ['all-clients-list'],
    queryFn: async () => {
      const res = await api.get('/clients', { params: { size: 100 } });
      return res.data.data.content || [];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/employees', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setCreateModalOpen(false);
      setCreateData({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        designation: 'Senior Lead Photographer',
        department: 'Events & Weddings',
        notes: '',
      });
      setCreateError('');
      alert.success('Employee created & welcome email dispatched successfully!', 'Employee Added');
    },
    onError: (err) => {
      setCreateError(err.response?.data?.message || 'Failed to create employee');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/employees/${id}/status`, null, { params: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const assignClientsMutation = useMutation({
    mutationFn: ({ id, clientIds }) => api.post(`/employees/${id}/clients`, { clientIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
      queryClient.invalidateQueries({ queryKey: ['adminUpcomingEvents'] });
      queryClient.invalidateQueries({ queryKey: ['employeeUpcomingEvents'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['employees-dropdown'] });
      setAssignClientsModal(null);
      alert.success('Client assignments updated successfully!', 'Assignments Saved');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to update client assignments', 'Assignment Error');
    },
  });

  const assignPermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }) => api.post(`/employees/${id}/permissions`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setPermissionsModal(null);
      alert.success('Employee permissions updated successfully!', 'Permissions Saved');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to update permissions', 'Permissions Error');
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
      setDeleteError('');
    },
    onError: (err) => {
      setDeleteError(err.response?.data?.message || 'Failed to delete employee');
    },
  });

  const handleDeleteEmployee = () => {
    if (employeeToDelete) {
      deleteEmployeeMutation.mutate(employeeToDelete.id);
    }
  };

  const openAssignClients = (emp) => {
    setAssignClientsModal(emp);
    setSelectedClients(emp.assignedClientIds || []);
    setClientSearch('');
  };

  const openPermissions = (emp) => {
    setPermissionsModal(emp);
    setSelectedPermissions(emp.permissions || []);
  };

  // Map each client ID to all employees assigned across the studio
  const clientAssignmentMap = useMemo(() => {
    const map = {};
    (employeesData || []).forEach((emp) => {
      (emp.assignedClientIds || []).forEach((clientId) => {
        if (!map[clientId]) {
          map[clientId] = [];
        }
        map[clientId].push({
          id: emp.id,
          fullName: emp.fullName,
          employeeCode: emp.employeeCode
        });
      });
    });
    return map;
  }, [employeesData]);

  const handleToggleClient = (clientId) => {
    if (!assignClientsModal) return;
    const isCurrentlySelected = selectedClients.includes(clientId);
    if (!isCurrentlySelected) {
      // Check if client is already assigned to 3 other employees
      const otherEmps = (clientAssignmentMap[clientId] || []).filter(e => e.id !== assignClientsModal.id);
      if (otherEmps.length >= 3) {
        return; // Capped at maximum 3 employees
      }
    }
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSelectAllClients = () => {
    if (!assignClientsModal) return;
    const available = (allClients || []).filter((c) => {
      const otherEmps = (clientAssignmentMap[c.id] || []).filter(e => e.id !== assignClientsModal.id);
      return otherEmps.length < 3;
    });
    setSelectedClients(available.map(c => c.id));
  };

  const handleTogglePermission = (permKey) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
  };

  const filteredClients = (allClients || []).filter((client) => {
    if (!clientSearch.trim()) return true;
    const q = clientSearch.toLowerCase();
    return (
      client.name?.toLowerCase().includes(q) ||
      client.clientCode?.toLowerCase().includes(q) ||
      client.email?.toLowerCase().includes(q) ||
      client.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">Staff & Team Management</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal leading-relaxed">
            Configure studio photographers, second shooters, client assignments, and 9-point access permissions.
          </p>
        </div>
        <button
          onClick={() => {
            setCreateModalOpen(true);
            setCreateError('');
          }}
          className="neu-glass-btn-primary px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Employees Table */}
      <div className="neu-glass-panel rounded-3xl overflow-hidden">
        <div className="w-full">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-stone-100/60 border-b border-stone-200/60 text-stone-600 font-bold tracking-wider text-[11px] uppercase">
              <tr>
                <th className="px-4 py-3.5 w-[24%] whitespace-nowrap">Employee</th>
                <th className="px-3.5 py-3.5 w-[20%] whitespace-nowrap">Designation</th>
                <th className="px-2 py-3.5 w-[10%] text-center whitespace-nowrap">Clients</th>
                <th className="px-2 py-3.5 w-[11%] text-center whitespace-nowrap">Permissions</th>
                <th className="px-2 py-3.5 w-[10%] text-center whitespace-nowrap">Status</th>
                <th className="px-4 pr-6 py-3.5 w-[25%] text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {empLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-stone-400">
                    <span className="inline-block w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                  </td>
                </tr>
              ) : employeesData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-stone-400">
                    <UserCheck className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-700 text-sm">No staff members created</p>
                    <p className="text-xs mt-1 text-stone-400">Add photographers or assistants to configure client access.</p>
                  </td>
                </tr>
              ) : (
                employeesData.map((emp) => (
                  <tr key={emp.id} className="hover:bg-amber-50/20 transition-colors group">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/90 text-amber-900 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                          {emp.fullName ? emp.fullName.charAt(0).toUpperCase() : 'E'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p 
                            className="font-bold text-stone-900 text-xs leading-tight truncate" 
                            title={emp.email ? `${emp.fullName} • ${emp.email}` : emp.fullName}
                          >
                            {emp.fullName}
                          </p>
                          <span 
                            className="inline-block font-semibold font-mono text-[10px] text-amber-900 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded mt-0.5"
                            title={emp.email}
                          >
                            {emp.employeeCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3.5 py-3.5 text-stone-700">
                      <p className="font-semibold text-stone-800 text-xs truncate" title={emp.designation}>{emp.designation}</p>
                      <span className="text-[11px] text-stone-500 truncate block" title={emp.department}>{emp.department}</span>
                    </td>

                    <td className="px-3 py-3.5 whitespace-nowrap text-center">
                      <span 
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold whitespace-nowrap shadow-2xs"
                        title={`${emp.assignedClientsCount || 0} clients assigned`}
                      >
                        <Users className="w-3.5 h-3.5 text-sky-600" />
                        <span>{emp.assignedClientsCount || 0}</span>
                      </span>
                    </td>

                    <td className="px-3 py-3.5 whitespace-nowrap text-center">
                      <span 
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold whitespace-nowrap shadow-2xs"
                        title={`${emp.permissions?.length || 0} permissions granted`}
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        <span>{emp.permissions?.length || 0}</span>
                      </span>
                    </td>

                    <td className="px-3 py-3.5 whitespace-nowrap text-center">
                      <button
                        onClick={() => toggleStatusMutation.mutate({
                          id: emp.id,
                          status: emp.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
                        })}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition border shadow-2xs ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                            : 'bg-rose-50/90 border-rose-200 text-rose-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
                        }`}
                        title="Click to toggle account status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span>{emp.status === 'ACTIVE' ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>

                    <td className="px-4 pr-6 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => openAssignClients(emp)}
                          className="px-2.5 py-1 rounded-lg text-stone-700 hover:text-sky-700 bg-stone-50 hover:bg-sky-50 border border-stone-200 text-[11px] font-semibold flex items-center space-x-1 transition shadow-2xs"
                          title="Assign Clients"
                        >
                          <Users className="w-3.5 h-3.5 text-sky-600" />
                          <span>Clients</span>
                        </button>
                        <button
                          onClick={() => openPermissions(emp)}
                          className="px-2.5 py-1 rounded-lg text-amber-800 hover:text-amber-900 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/80 text-[11px] font-semibold flex items-center space-x-1 transition shadow-2xs"
                          title="Configure Permissions"
                        >
                          <Shield className="w-3.5 h-3.5 text-amber-600" />
                          <span>Perms</span>
                        </button>
                        <button
                          onClick={() => {
                            setEmployeeToDelete(emp);
                            setDeleteError('');
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-Screen Floating Assign Clients Matrix */}
      {assignClientsModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-md flex flex-col justify-between overflow-y-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
          {/* Top Control Bar: Context Pill + Search + Select All / Clear All + Close Button */}
          <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-4 pb-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300 flex items-center justify-center font-bold text-sm shadow-xs">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white tracking-tight">
                    Assign Clients
                  </span>
                  <span className="text-xs font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-md">
                    {assignClientsModal.employeeCode}
                  </span>
                </div>
                <p className="text-[11px] text-stone-300">
                  {assignClientsModal.fullName} • {assignClientsModal.designation}
                </p>
              </div>
            </div>

            {/* Quick Actions & Close in Unified Group */}
            <div className="flex items-center space-x-2 bg-stone-900/80 backdrop-blur-md border border-white/15 rounded-xl p-1 shadow-lg">
              <div className="relative w-36 sm:w-52">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white/10 text-white placeholder-stone-400 border border-white/10 rounded-lg text-xs focus:outline-none focus:bg-white/20 transition"
                />
              </div>
              <button
                type="button"
                onClick={handleSelectAllClients}
                className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition shadow-2xs whitespace-nowrap"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelectedClients([])}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white text-xs font-semibold transition shadow-2xs whitespace-nowrap"
              >
                Clear All
              </button>
              <div className="h-4 w-px bg-white/15 mx-0.5"></div>
              <button
                onClick={() => setAssignClientsModal(null)}
                className="p-1.5 text-stone-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Close (Esc)"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Main Full-Screen Cards Canvas: 5 columns on desktop */}
          <main className="w-full max-w-[1600px] mx-auto my-auto py-2">
            {filteredClients.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 shadow-xl max-w-sm mx-auto my-8">
                <Users className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <h3 className="font-bold text-stone-800 text-xs">No clients match your search</h3>
                <p className="text-[11px] text-stone-500 mt-1">Try searching for a different name or client code.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {filteredClients.map((client) => {
                  const isSelected = selectedClients.includes(client.id);
                  const assignedEmps = clientAssignmentMap[client.id] || [];
                  const otherEmps = assignedEmps.filter((e) => e.id !== assignClientsModal.id);
                  const activeCount = isSelected ? otherEmps.length + 1 : otherEmps.length;
                  const isCapped = !isSelected && otherEmps.length >= 3;
                  const allAssignedList = isSelected
                    ? [...otherEmps, { id: assignClientsModal.id, fullName: `${assignClientsModal.fullName} (This employee)`, employeeCode: assignClientsModal.employeeCode }]
                    : otherEmps;

                  return (
                    <div
                      key={client.id}
                      onClick={() => !isCapped && handleToggleClient(client.id)}
                      className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-150 select-none flex flex-col justify-between min-h-[165px] sm:min-h-[180px] border ${
                        isCapped
                          ? 'bg-stone-50/80 border-stone-200 opacity-60 cursor-not-allowed shadow-none'
                          : isSelected
                            ? 'bg-sky-50/95 border-2 border-sky-600 shadow-md ring-2 ring-sky-500/20 cursor-pointer'
                            : 'bg-white/95 hover:bg-white border-stone-200 hover:border-stone-300 shadow-sm hover:shadow-md cursor-pointer'
                      }`}
                    >
                      {/* Top Row: Avatar & Corner Status Badges */}
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                          isCapped
                            ? 'bg-stone-100 text-stone-400'
                            : isSelected
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-stone-100 text-stone-700 group-hover:bg-sky-50 group-hover:text-sky-700'
                        }`}>
                          {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
                        </div>

                        {/* Right Corner: Count badge with hover tooltip + Check/Lock */}
                        <div className="flex items-center space-x-2">
                          {/* Assigned Employees Count Badge with Tooltip */}
                          <div className="relative group/tooltip">
                            <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-help flex items-center space-x-1 ${
                              isCapped || activeCount >= 3
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : activeCount > 0
                                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                                  : 'bg-stone-100 text-stone-500 border-stone-200'
                            }`}>
                              <span>{activeCount}/3</span>
                              {isCapped && <span className="text-[9px] uppercase font-bold text-rose-600">Max</span>}
                            </div>

                            {/* Hover Tooltip displaying assigned employee names */}
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block z-50 pointer-events-none min-w-[200px] max-w-xs animate-in fade-in zoom-in-95 duration-100">
                              <div className="bg-stone-900/95 backdrop-blur-md text-white text-[11px] rounded-xl p-2.5 shadow-2xl border border-stone-700">
                                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-stone-800">
                                  <span className="font-bold text-stone-300 text-[10px] uppercase tracking-wider">
                                    Assigned Employees
                                  </span>
                                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                    activeCount >= 3 ? 'bg-rose-900/80 text-rose-300' : 'bg-sky-900/80 text-sky-300'
                                  }`}>
                                    {activeCount}/3 Max
                                  </span>
                                </div>

                                {allAssignedList.length === 0 ? (
                                  <p className="text-stone-400 italic text-[10px]">No employees assigned yet</p>
                                ) : (
                                  <ul className="space-y-1">
                                    {allAssignedList.map((emp) => (
                                      <li key={emp.id} className="flex items-center space-x-1.5 text-stone-200">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${emp.id === assignClientsModal.id ? 'bg-amber-400 ring-2 ring-amber-400/30' : 'bg-sky-400'}`}></span>
                                        <span className="font-medium truncate">{emp.fullName}</span>
                                        <span className="text-[10px] text-stone-400 font-mono shrink-0">({emp.employeeCode})</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}

                                {isCapped && (
                                  <div className="mt-1.5 pt-1 border-t border-stone-800 text-[10px] text-rose-400 font-medium leading-tight">
                                    🔒 Max capacity reached (3 employees). Unassign from another employee to assign here.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Floating Selection/Lock Indicator */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isCapped
                              ? 'bg-stone-100 border border-stone-300 text-stone-400'
                              : isSelected
                                ? 'bg-sky-600 text-white'
                                : 'border-2 border-stone-300 bg-white group-hover:border-sky-400'
                          }`}>
                            {isCapped ? (
                              <Lock className="w-3 h-3 text-stone-400" />
                            ) : isSelected ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <div className="mb-1.5">
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isCapped
                              ? 'bg-stone-200/80 text-stone-500'
                              : isSelected
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-stone-100 text-stone-600'
                          }`}>
                            {client.clientCode}
                          </span>
                        </div>
                        <h4 className={`font-bold text-xs sm:text-sm leading-snug truncate ${
                          isCapped ? 'text-stone-400' : 'text-stone-900 group-hover:text-sky-700 transition'
                        }`} title={client.name}>
                          {client.name}
                        </h4>

                        <div className="mt-2 space-y-1 text-[11px] text-stone-500 border-t border-stone-100 pt-2">
                          {client.city && (
                            <div className="flex items-center space-x-1.5 truncate">
                              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{client.city}{client.state ? `, ${client.state}` : ''}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center space-x-1.5 truncate">
                              <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          {/* Floating Action Dock */}
          <div className="w-full max-w-[1600px] mx-auto pt-2 flex justify-center">
            <div className="bg-stone-900/90 backdrop-blur-md border border-stone-700/60 text-white rounded-2xl px-6 py-3 shadow-2xl flex items-center space-x-8 max-w-2xl w-full justify-between animate-in fade-in slide-in-from-bottom-4 duration-150">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                    {selectedClients.length} of {(allClients || []).length} Clients Assigned
                  </p>
                  <p className="text-[11px] text-stone-400 whitespace-nowrap">
                    Click cards to assign or revoke access
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setAssignClientsModal(null)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs font-medium transition whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => assignClientsMutation.mutate({
                    id: assignClientsModal.id,
                    clientIds: selectedClients
                  })}
                  disabled={assignClientsMutation.isPending}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow transition flex items-center space-x-1.5 disabled:opacity-50 whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{assignClientsMutation.isPending ? 'Saving...' : 'Save Assignments'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Full-Screen Floating Permissions Matrix */}
      {permissionsModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-md flex flex-col justify-between overflow-y-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
          {/* Top Control Bar: Context Pill + Select All / Clear All + Close Button */}
          <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-4 pb-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center font-bold text-sm shadow-xs">
                <Shield className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white tracking-tight">
                    Permissions Matrix
                  </span>
                  <span className="text-xs font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    {permissionsModal.employeeCode}
                  </span>
                </div>
                <p className="text-[11px] text-stone-300">
                  {permissionsModal.fullName} • {permissionsModal.designation}
                </p>
              </div>
            </div>

            {/* Quick Actions & Close in Unified Group */}
            <div className="flex items-center space-x-2 bg-stone-900/80 backdrop-blur-md border border-white/15 rounded-xl p-1 shadow-lg">
              <button
                type="button"
                onClick={() => setSelectedPermissions(ALL_PERMISSIONS.map(p => p.key))}
                className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition shadow-2xs"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelectedPermissions([])}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white text-xs font-semibold transition shadow-2xs"
              >
                Clear All
              </button>
              <div className="h-4 w-px bg-white/15 mx-0.5"></div>
              <button
                onClick={() => setPermissionsModal(null)}
                className="p-1.5 text-stone-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Close (Esc)"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Main Full-Screen Cards Canvas: 5 columns x 2 rows on desktop */}
          <main className="w-full max-w-[1600px] mx-auto my-auto py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {ALL_PERMISSIONS.map((perm) => {
                const isSelected = selectedPermissions.includes(perm.key);
                const IconComponent = getPermIcon(perm.icon);

                return (
                  <div
                    key={perm.key}
                    onClick={() => handleTogglePermission(perm.key)}
                    className={`group rounded-2xl p-4 sm:p-5 transition-all duration-150 cursor-pointer select-none flex flex-col justify-between min-h-[160px] sm:min-h-[175px] border ${
                      isSelected
                        ? 'bg-amber-50/95 border-2 border-amber-600 shadow-md ring-2 ring-amber-500/20'
                        : 'bg-white/95 hover:bg-white border-stone-200 hover:border-stone-300 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Top Row: Icon badge + Category + Check indicator */}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 group-hover:bg-amber-50 group-hover:text-amber-700'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      {/* Selection Status Indicator */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-600 text-white'
                          : 'border-2 border-stone-300 bg-white group-hover:border-amber-400'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div>
                      <div className="mb-1.5">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {perm.category}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-amber-700 transition leading-snug">
                        {perm.label}
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-1 leading-relaxed line-clamp-3">
                        {perm.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* Floating Bottom Action Dock */}
          <div className="w-full max-w-[1600px] mx-auto pt-2 flex justify-center">
            <div className="bg-stone-900/90 backdrop-blur-md border border-stone-700/60 text-white rounded-2xl px-6 py-3 shadow-2xl flex items-center space-x-8 max-w-2xl w-full justify-between">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                    {selectedPermissions.length} of {ALL_PERMISSIONS.length} Permissions Active
                  </p>
                  <p className="text-[11px] text-stone-400 whitespace-nowrap">
                    Click cards to toggle access rights
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPermissionsModal(null)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs font-medium transition whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => assignPermissionsMutation.mutate({
                    id: permissionsModal.id,
                    permissions: selectedPermissions
                  })}
                  disabled={assignPermissionsMutation.isPending}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow transition flex items-center space-x-1.5 disabled:opacity-50 whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{assignPermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create Employee Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-sm">Add New Studio Employee</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-3 flex items-center space-x-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(createData);
            }} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={createData.fullName}
                  onChange={(e) => setCreateData({ ...createData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="maya@studio.local"
                    value={createData.email}
                    onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={createData.password}
                    onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={createData.designation}
                    onChange={(e) => setCreateData({ ...createData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={createData.department}
                    onChange={(e) => setCreateData({ ...createData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={createData.phone}
                  onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex items-start gap-2 text-[11px] text-amber-900 bg-amber-50/90 p-2.5 rounded-xl border border-amber-200/80">
                <Mail className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Welcome Email:</strong> A welcome email containing staff code, login email, and initial password will be automatically dispatched to this employee.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl disabled:opacity-50 shadow-sm transition"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      {deleteModalOpen && employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-900 text-base">Delete Employee</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Are you sure you want to permanently remove this employee account?
                </p>
              </div>
              <button 
                onClick={() => { setDeleteModalOpen(false); setEmployeeToDelete(null); }}
                className="text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Employee:</span>
                <span className="font-semibold text-stone-900">{employeeToDelete.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Code & Email:</span>
                <span className="font-mono text-stone-700">
                  <span className="bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded font-semibold mr-1.5">{employeeToDelete.employeeCode}</span>
                  {employeeToDelete.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Designation:</span>
                <span className="font-medium text-stone-800">{employeeToDelete.designation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Access:</span>
                <span className="text-stone-700">{employeeToDelete.assignedClientsCount || 0} Clients • {employeeToDelete.permissions?.length || 0} Permissions</span>
              </div>
            </div>

            <div className="mt-3.5 flex items-start space-x-2.5 text-[11px] text-rose-700 bg-rose-50/80 border border-rose-200/80 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed">
                This will permanently revoke all client assignments, remove granted permissions, and delete their user login credentials. This action cannot be undone.
              </span>
            </div>

            {deleteError && (
              <p className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => { setDeleteModalOpen(false); setEmployeeToDelete(null); }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                disabled={deleteEmployeeMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 disabled:opacity-50 shadow-sm transition"
              >
                {deleteEmployeeMutation.isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Employee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
