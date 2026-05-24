import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import {
  Search,
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  MessageSquare,
  GitBranch,
  RefreshCw,
  X,
  Edit,
  ExternalLink
} from 'lucide-react';

const Clients = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [clients, setClients] = useState([]);
  const [bdas, setBdas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // all, active, inactive, my

  // Client Details Panel (Drawer)
  const [selectedClientData, setSelectedClientData] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    procurementContact: '',
    email: '',
    phone: '',
    location: '',
    productInterest: '',
    annualRequirement: '',
    status: 'Active',
    assignedTo: ''
  });

  const fetchClients = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = '/clients';
      let params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (industryFilter) params.push(`industry=${encodeURIComponent(industryFilter)}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await api.get(url);
      setClients(res.data);

      const bdasRes = await api.get('/users/bdas');
      setBdas(bdasRes.data);

      if (!silent) {
        showToast('Client directory loaded successfully', 'success');
      }
    } catch (error) {
      console.error('Error loading clients', error);
      showToast('Error loading clients directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(true);
  }, [search, industryFilter]);

  const loadClientDetails = async (clientId) => {
    setDetailLoading(true);
    setShowDetailPanel(true);
    try {
      const res = await api.get(`/clients/${clientId}`);
      setSelectedClientData(res.data);
    } catch (error) {
      console.error('Error loading client details', error);
      showToast('Failed to load client details Workspace context', 'error');
      setShowDetailPanel(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      setIsCreateOpen(false);
      resetForm();
      showToast('New client profile registered successfully', 'success');
      fetchClients(true);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error creating client', 'error');
    }
  };

  const handleEditClientSubmit = async (e) => {
    e.preventDefault();
    const clientId = editingClient._id || editingClient.id;
    try {
      await api.put(`/clients/${clientId}`, formData);
      setIsEditOpen(false);
      resetForm();
      showToast('Client account parameters updated', 'success');
      fetchClients(true);
      if (selectedClientData && (selectedClientData.client._id || selectedClientData.client.id) === clientId) {
        loadClientDetails(clientId);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Error updating client', 'error');
    }
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      companyName: client.companyName,
      industry: client.industry,
      procurementContact: client.procurementContact,
      email: client.email,
      phone: client.phone,
      location: client.location,
      productInterest: client.productInterest,
      annualRequirement: client.annualRequirement,
      status: client.status,
      assignedTo: client.assignedTo?._id || client.assignedTo?.id || client.assignedTo || ''
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      industry: '',
      procurementContact: '',
      email: '',
      phone: '',
      location: '',
      productInterest: '',
      annualRequirement: '',
      status: 'Active',
      assignedTo: ''
    });
    setEditingClient(null);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Local filtering based on quick tabs
  const getFilteredClients = () => {
    let result = [...clients];
    if (quickFilter === 'active') {
      result = result.filter(c => c.status === 'Active');
    } else if (quickFilter === 'inactive') {
      result = result.filter(c => c.status === 'Inactive');
    } else if (quickFilter === 'my') {
      result = result.filter(c => {
        const assignedId = c.assignedTo?._id || c.assignedTo?.id || c.assignedTo;
        const currentUserId = user?._id || user?.id;
        return assignedId === currentUserId;
      });
    }
    return result;
  };

  const filteredClients = getFilteredClients();

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Manufacturing Account Directory</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Manage industrial clients, link quotations, and audit communication timelines.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => fetchClients(false)} className="flex items-center space-x-2 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-350">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload</span>
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }} className="flex items-center space-x-1 bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
            <Plus className="h-4 w-4" />
            <span>New Client Account</span>
          </Button>
        </div>
      </div>

      {/* Saved Filter Quick Tabs & Search Workspace */}
      <div className="flex flex-col space-y-4">
        {/* Saved Filter Quick Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <button
            onClick={() => setQuickFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              quickFilter === 'all'
                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setQuickFilter('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              quickFilter === 'active'
                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Active Accounts
          </button>
          <button
            onClick={() => setQuickFilter('inactive')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              quickFilter === 'inactive'
                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Inactive Accounts
          </button>
          <button
            onClick={() => setQuickFilter('my')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              quickFilter === 'my'
                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            My Portfolio
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-sm">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-550" />
            <Input
              placeholder="Search company name, procurement contact, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-350"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="text-xs dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-350"
            >
              <option value="">All Industries</option>
              <option value="Heavy Machinery">Heavy Machinery</option>
              <option value="Automotive">Automotive</option>
              <option value="Aerospace Components">Aerospace Components</option>
              <option value="Industrial Automation">Industrial Automation</option>
              <option value="Infrastructure & Construction">Infrastructure & Construction</option>
              <option value="Fluid Power & Hydraulics">Fluid Power & Hydraulics</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Grid: Client Table and Side Drawer Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side: Client Accounts Table */}
        <div className="flex-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden text-left">
          {loading ? (
            /* Polish Table Skeleton Loaders */
            <Table>
              <TableHeader>
                <TableRow className="dark:border-zinc-800">
                  <TableHead className="w-[220px]">Company Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Procurement Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assigned BDA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map(n => (
                  <TableRow key={n} className="animate-pulse dark:border-zinc-800">
                    <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-36" /></TableCell>
                    <TableCell><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-20" /></TableCell>
                    <TableCell>
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24 mb-1" />
                      <div className="h-2 bg-zinc-100 dark:bg-zinc-850 rounded w-32" />
                    </TableCell>
                    <TableCell><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24" /></TableCell>
                    <TableCell><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></TableCell>
                    <TableCell><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-12" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredClients.length === 0 ? (
            /* Illustrated Empty State Placeholder */
            <div className="text-center py-20 flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-550 mb-4">
                <Building2 className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-1">No client accounts found</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-normal">
                {quickFilter !== 'all' || search || industryFilter
                  ? 'No clients match your filter preferences. Try adjusting filters or search term.'
                  : 'Register manufacturing client profiles, log annual casting demands, and audit customer interactions in one workspace.'}
              </p>
              {(quickFilter !== 'all' || search || industryFilter) ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setQuickFilter('all'); setSearch(''); setIndustryFilter(''); }} 
                  className="text-xs dark:border-zinc-800 dark:text-zinc-300"
                >
                  Clear Filters
                </Button>
              ) : (
                <Button size="sm" onClick={() => setIsCreateOpen(true)} className="text-xs">
                  Register First Client
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="dark:border-zinc-800">
                  <TableHead className="w-[220px]">Company Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Procurement Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assigned BDA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const clientKey = client._id || client.id;
                  return (
                    <TableRow
                      key={clientKey}
                      className="cursor-pointer hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 dark:border-zinc-800"
                      onClick={() => loadClientDetails(clientKey)}
                    >
                      <TableCell className="font-bold text-zinc-950 dark:text-zinc-100 flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-zinc-400 dark:text-zinc-550 shrink-0" />
                        <span>{client.companyName}</span>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-zinc-650 dark:text-zinc-350">{client.industry}</TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{client.procurementContact}</div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500">{client.email}</div>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">{client.location}</TableCell>
                      <TableCell className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {client.assignedTo?.name || 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'Active' ? 'success' : 'secondary'}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(client)}
                          className="h-8 w-8 text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Right Side: Account Workspace Drawer (Slide-in Detail view) */}
        {showDetailPanel && (
          <div className="w-full lg:w-[450px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg shadow-md p-5 sticky top-6 overflow-y-auto z-20 text-left animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
              <span className="font-bold text-xs uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Account Workspace</span>
              <button
                onClick={() => setShowDetailPanel(false)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-250 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin text-zinc-400 dark:text-zinc-550" />
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Fetching workspace context...</span>
              </div>
            ) : selectedClientData ? (
              <div className="space-y-6">
                {/* Client Profile */}
                <div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 font-sans">{selectedClientData.client.companyName}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] dark:bg-zinc-800 dark:text-zinc-300">{selectedClientData.client.industry}</Badge>
                    <Badge variant={selectedClientData.client.status === 'Active' ? 'success' : 'secondary'} className="text-[10px]">
                      {selectedClientData.client.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center space-x-2.5 text-zinc-650 dark:text-zinc-355">
                      <Mail className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-550 shrink-0" />
                      <span>{selectedClientData.client.email}</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-zinc-650 dark:text-zinc-355">
                      <Phone className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-550 shrink-0" />
                      <span>{selectedClientData.client.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-zinc-650 dark:text-zinc-355">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-550 shrink-0" />
                      <span>{selectedClientData.client.location}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs">
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Procurement Specifications</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase">Interest</span>
                        <span className="text-zinc-600 dark:text-zinc-400 font-medium">{selectedClientData.client.productInterest}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase">Annual Vol.</span>
                        <span className="text-zinc-600 dark:text-zinc-400 font-medium">{selectedClientData.client.annualRequirement}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked Active Leads */}
                <div>
                  <h4 className="font-bold text-xs text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                    <GitBranch className="h-3.5 w-3.5" />
                    <span>Linked Leads ({selectedClientData.leads?.length || 0})</span>
                  </h4>
                  {(!selectedClientData.leads || selectedClientData.leads.length === 0) ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No active opportunities linked</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedClientData.leads.map(lead => {
                        const leadKey = lead._id || lead.id;
                        return (
                          <div key={leadKey} className="border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-850/40 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">{lead.contactPerson}</span>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-550 font-medium">Stage: {lead.stage}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold font-sans text-zinc-850 dark:text-zinc-200 block">{formatCurrency(lead.dealValue)}</span>
                              <span className="text-[9px] text-zinc-500 dark:text-zinc-450">{new Date(lead.expectedCloseDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Linked Quotations */}
                <div>
                  <h4 className="font-bold text-xs text-zinc-455 dark:text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Quotation History ({selectedClientData.quotations?.length || 0})</span>
                  </h4>
                  {(!selectedClientData.quotations || selectedClientData.quotations.length === 0) ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No quotation history registered</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedClientData.quotations.map(quote => {
                        const quoteKey = quote._id || quote.id;
                        return (
                          <div key={quoteKey} className="border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-855/40 flex items-center justify-between">
                            <div className="truncate max-w-[200px]">
                              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block truncate">{quote.product}</span>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Qty: {quote.quantity} | Timeline: {quote.deliveryTimeline}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold font-sans text-zinc-805 dark:text-zinc-200 block">{formatCurrency(quote.totalValue)}</span>
                              <Badge variant={
                                quote.status === 'Approved' ? 'success' :
                                quote.status === 'Sent' ? 'info' :
                                quote.status === 'Rejected' ? 'destructive' :
                                quote.status === 'Under Review' ? 'warning' : 'secondary'
                              } className="text-[8px] py-0 px-1 font-bold">
                                {quote.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Chronological Communication Timeline */}
                <div>
                  <h4 className="font-bold text-xs text-zinc-455 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Communication History ({selectedClientData.activities?.length || 0})</span>
                  </h4>
                  {(!selectedClientData.activities || selectedClientData.activities.length === 0) ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No communication logged</p>
                  ) : (
                    <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                      {selectedClientData.activities.map(act => {
                        const actKey = act._id || act.id;
                        return (
                          <div key={actKey} className="relative pl-4 border-l border-zinc-200 dark:border-zinc-800 pb-1">
                            <span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-50 ring-2 ring-white dark:ring-zinc-900" />
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-450 flex justify-between font-medium">
                              <span>{act.createdBy?.name || 'System'} ({act.createdBy?.role || 'Service'})</span>
                              <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{act.type}</p>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 leading-normal">{act.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* CREATE CLIENT DIALOG */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <div className="dark:bg-zinc-900 text-left font-sans">
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-50">Register Client Account</DialogTitle>
            <DialogDescription className="dark:text-zinc-400">Create a new client corporate entry for sales tracking.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Company Name</label>
              <Input
                required
                placeholder="e.g. Orion Hydraulics Ltd"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Industry Segment</label>
                <Select
                  required
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                >
                  <option value="">-- Choose Industry --</option>
                  <option value="Heavy Machinery">Heavy Machinery</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Aerospace Components">Aerospace Components</option>
                  <option value="Industrial Automation">Industrial Automation</option>
                  <option value="Infrastructure & Construction">Infrastructure & Construction</option>
                  <option value="Fluid Power & Hydraulics">Fluid Power & Hydraulics</option>
                </Select>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Procurement Contact Name</label>
                <Input
                  required
                  placeholder="e.g. Alok Desai"
                  value={formData.procurementContact}
                  onChange={(e) => setFormData({ ...formData, procurementContact: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Contact Email</label>
                <Input
                  required
                  type="email"
                  placeholder="e.g. purchasing@client.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Contact Phone</label>
                <Input
                  required
                  placeholder="e.g. +91 99999 88888"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Corporate Location (City, State)</label>
              <Input
                required
                placeholder="e.g. Ahmedabad, Gujarat"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Product Interest</label>
                <Input
                  required
                  placeholder="e.g. Hydraulic Cylinders"
                  value={formData.productInterest}
                  onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Annual Requirement (Volume)</label>
                <Input
                  required
                  placeholder="e.g. 5,000 units"
                  value={formData.annualRequirement}
                  onChange={(e) => setFormData({ ...formData, annualRequirement: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
            </div>
            {isAdmin && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Assign BDA Executive</label>
                <Select
                  required
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                >
                  <option value="">-- Choose BDA --</option>
                  {bdas.map(b => {
                    const bKey = b._id || b.id;
                    return <option key={bKey} value={bKey}>{b.name}</option>;
                  })}
                </Select>
              </div>
            )}
            <DialogFooter className="dark:bg-zinc-900">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="dark:border-zinc-800 dark:hover:bg-zinc-800">Cancel</Button>
              <Button type="submit" className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">Create Account</Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>

      {/* EDIT CLIENT DIALOG */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <div className="dark:bg-zinc-900 text-left font-sans">
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-50">Modify Client Account</DialogTitle>
            <DialogDescription className="dark:text-zinc-400">Modify parameters for {editingClient?.companyName}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditClientSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Procurement Contact Name</label>
                <Input
                  required
                  value={formData.procurementContact}
                  onChange={(e) => setFormData({ ...formData, procurementContact: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Account Status</label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Contact Email</label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Contact Phone</label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Corporate Location (City, State)</label>
              <Input
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Product Interest</label>
                <Input
                  required
                  value={formData.productInterest}
                  onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Annual Requirement (Volume)</label>
                <Input
                  required
                  value={formData.annualRequirement}
                  onChange={(e) => setFormData({ ...formData, annualRequirement: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
            </div>
            {isAdmin && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Reassign BDA Executive</label>
                <Select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                >
                  <option value="">-- Choose BDA --</option>
                  {bdas.map(b => {
                    const bKey = b._id || b.id;
                    return <option key={bKey} value={bKey}>{b.name}</option>;
                  })}
                </Select>
              </div>
            )}
            <DialogFooter className="dark:bg-zinc-900">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="dark:border-zinc-800 dark:hover:bg-zinc-800">Cancel</Button>
              <Button type="submit" className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">Save Changes</Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>
    </div>
  );
};

export default Clients;
