import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Building2,
  RefreshCw,
  MoreHorizontal,
  TrendingUp,
  Award,
  BarChart2
} from 'lucide-react';

const STAGES = [
  'New Inquiry',
  'Requirement Discussion',
  'Quotation Prepared',
  'Quotation Sent',
  'Negotiation',
  'Purchase Order Received',
  'Closed Won',
  'Closed Lost'
];

const STAGE_PROBABILITIES = {
  'New Inquiry': 0.10,
  'Requirement Discussion': 0.20,
  'Quotation Prepared': 0.40,
  'Quotation Sent': 0.60,
  'Negotiation': 0.80,
  'Purchase Order Received': 0.95,
  'Closed Won': 1.00,
  'Closed Lost': 0.00
};

const Pipeline = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [bdas, setBdas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [bdaFilter, setBdaFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // all, high-value, my-assigned

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    contactPerson: '',
    dealValue: '',
    priority: 'Medium',
    expectedCloseDate: '',
    clientId: '',
    assignedTo: ''
  });

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (industryFilter) params.push(`industry=${encodeURIComponent(industryFilter)}`);
      if (priorityFilter) params.push(`priority=${encodeURIComponent(priorityFilter)}`);
      if (bdaFilter) params.push(`assignedTo=${encodeURIComponent(bdaFilter)}`);
      const queryStr = params.length > 0 ? `?${params.join('&')}` : '';

      const [leadsRes, clientsRes, bdasRes] = await Promise.all([
        api.get(`/leads${queryStr}`),
        api.get('/clients'),
        api.get('/users/bdas')
      ]);

      setLeads(leadsRes.data);
      setClients(clientsRes.data);
      setBdas(bdasRes.data);
    } catch (error) {
      console.error('Error fetching pipeline data', error);
      showToast('Error loading pipeline data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [search, industryFilter, priorityFilter, bdaFilter]);

  // Drag and Drop implementation
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStage) => {
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;

    // Find the lead being dropped
    const currentLead = leads.find(l => (l._id || l.id) === leadId);
    if (currentLead && currentLead.stage === targetStage) return; // No change

    // Optimistic update locally
    const originalLeads = [...leads];
    setLeads(prevLeads =>
      prevLeads.map(l => ((l._id || l.id) === leadId ? { ...l, stage: targetStage } : l))
    );

    try {
      await api.put(`/leads/${leadId}`, { stage: targetStage });
      showToast(`Lead moved to ${targetStage}`, 'success');
    } catch (error) {
      console.error('Failed to update stage on drag drop', error);
      showToast('Failed to update pipeline stage', 'error');
      setLeads(originalLeads); // roll back
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const selectedClient = clients.find(c => (c._id || c.id) === formData.clientId);
      const postData = {
        ...formData,
        companyName: selectedClient ? selectedClient.companyName : '',
        industry: selectedClient ? selectedClient.industry : '',
        dealValue: Number(formData.dealValue),
      };

      await api.post('/leads', postData);
      setIsCreateOpen(false);
      showToast('Opportunity created successfully', 'success');
      resetForm();
      fetchData(true);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error creating lead', 'error');
    }
  };

  const handleEditLead = async (e) => {
    e.preventDefault();
    try {
      const leadId = selectedLead._id || selectedLead.id;
      await api.put(`/leads/${leadId}`, {
        ...formData,
        dealValue: Number(formData.dealValue)
      });
      setIsEditOpen(false);
      showToast('Opportunity updated successfully', 'success');
      resetForm();
      fetchData(true);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error updating lead', 'error');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/leads/${leadId}`);
      setIsEditOpen(false);
      showToast('Lead deleted successfully', 'info');
      resetForm();
      fetchData(true);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error deleting lead', 'error');
    }
  };

  const openEditModal = (lead) => {
    setSelectedLead(lead);
    const leadId = lead._id || lead.id;
    setFormData({
      companyName: lead.companyName,
      industry: lead.industry,
      contactPerson: lead.contactPerson,
      dealValue: lead.dealValue,
      priority: lead.priority,
      expectedCloseDate: lead.expectedCloseDate ? lead.expectedCloseDate.substring(0, 10) : '',
      clientId: lead.clientId?._id || lead.clientId?.id || lead.clientId || '',
      assignedTo: lead.assignedTo?._id || lead.assignedTo?.id || lead.assignedTo || ''
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      industry: '',
      contactPerson: '',
      dealValue: '',
      priority: 'Medium',
      expectedCloseDate: '',
      clientId: '',
      assignedTo: ''
    });
    setSelectedLead(null);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'High': return <Badge variant="destructive">High</Badge>;
      case 'Medium': return <Badge variant="warning">Medium</Badge>;
      case 'Low': return <Badge variant="info">Low</Badge>;
      default: return <Badge variant="secondary">Medium</Badge>;
    }
  };

  // Local filtering based on quick tabs
  const getFilteredLeads = () => {
    let result = [...leads];
    if (quickFilter === 'high-value') {
      result = result.filter(l => l.dealValue >= 75000);
    } else if (quickFilter === 'my-assigned') {
      result = result.filter(l => {
        const assId = l.assignedTo?._id || l.assignedTo?.id || l.assignedTo;
        return assId === user?.id;
      });
    }
    return result;
  };

  const filteredLeads = getFilteredLeads();

  // Group leads by stage
  const columns = STAGES.reduce((acc, stage) => {
    acc[stage] = filteredLeads.filter(lead => lead.stage === stage);
    return acc;
  }, {});

  const getStageHeaderBg = (stage) => {
    switch (stage) {
      case 'Closed Won': return 'border-t-2 border-t-emerald-500';
      case 'Closed Lost': return 'border-t-2 border-t-red-400';
      case 'Negotiation': return 'border-t-2 border-t-blue-500';
      case 'Purchase Order Received': return 'border-t-2 border-t-indigo-500';
      default: return 'border-t-2 border-t-zinc-300 dark:border-t-zinc-700';
    }
  };

  // Pipeline Metric Calculations
  const activeLeads = leads.filter(l => !['Closed Won', 'Closed Lost'].includes(l.stage));
  const activeOppsCount = activeLeads.length;
  const totalActiveValue = activeLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
  const avgDealValue = activeOppsCount > 0 ? (totalActiveValue / activeOppsCount) : 0;
  
  // Calculate Weighted Value based on stage probabilities
  const weightedValue = leads.reduce((sum, l) => {
    const probability = STAGE_PROBABILITIES[l.stage] || 0;
    return sum + ((l.dealValue || 0) * probability);
  }, 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left font-sans animate-in fade-in">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="space-y-2">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-64" />
            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-96" />
          </div>
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-32 mt-4 md:mt-0" />
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-900 space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
            </div>
          ))}
        </div>

        {/* Board Skeleton */}
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-80 shrink-0 h-[60vh] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-950/20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 font-sans text-left">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Lead Pipeline Kanban</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Track fabrication opportunities. Drag and drop cards to update operational stages.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => fetchData(false)} className="flex items-center space-x-2 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300 font-sans">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload</span>
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }} className="flex items-center space-x-1 bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 font-sans">
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </Button>
        </div>
      </div>

      {/* Pipeline Metrics Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left font-sans">
        <Card className="compact-border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 subtle-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Active Pipeline</span>
            <TrendingUp className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mt-1">{formatCurrency(totalActiveValue)}</div>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Sum of all open deals</p>
        </Card>

        <Card className="compact-border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 subtle-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Weighted Win Value</span>
            <Award className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(weightedValue)}</div>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Adjusted by stage probability</p>
        </Card>

        <Card className="compact-border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 subtle-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Active Deals</span>
            <BarChart2 className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mt-1">{activeOppsCount} Inquiries</div>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Excluding Closed Won/Lost</p>
        </Card>

        <Card className="compact-border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 subtle-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Average Deal Value</span>
            <DollarSign className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mt-1">{formatCurrency(avgDealValue)}</div>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">Per active opportunity</p>
        </Card>
      </div>

      {/* Filter panel and Saved Filter Tabs */}
      <div className="flex flex-col space-y-4 font-sans text-left">
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
            All Opportunities
          </button>
          <button
            onClick={() => setQuickFilter('high-value')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              quickFilter === 'high-value'
                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            High Value (≥ ₹75k)
          </button>
          <button
            onClick={() => setQuickFilter('my-assigned')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              quickFilter === 'my-assigned'
                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            My Assigned Portfolio
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            <Input
              placeholder="Search company, contact, or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
            />
          </div>
          
          {isAdmin && (
            <div className="w-full md:w-48">
              <Select
                value={bdaFilter}
                onChange={(e) => setBdaFilter(e.target.value)}
                className="text-xs dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              >
                <option value="">All BDA Executives</option>
                {bdas.map(b => {
                  const bId = b._id || b.id;
                  return (
                    <option key={bId} value={bId}>{b.name}</option>
                  );
                })}
              </Select>
            </div>
          )}

          <div className="w-full md:w-36">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
          </div>

          {(search || priorityFilter || bdaFilter || industryFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setPriorityFilter('');
                setBdaFilter('');
                setIndustryFilter('');
              }}
              className="text-xs dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-[1600px] h-[calc(100vh-320px)] items-start">
          {STAGES.map((stage) => {
            const columnLeads = columns[stage] || [];
            const columnTotalValue = columnLeads.reduce((sum, l) => sum + l.dealValue, 0);

            return (
              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className="w-80 shrink-0 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 flex flex-col max-h-full"
              >
                {/* Column Header */}
                <div className={`p-2.5 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 mb-3 shadow-sm ${getStageHeaderBg(stage)} flex items-center justify-between font-sans`}>
                  <div className="text-left">
                    <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 block">{stage}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">{formatCurrency(columnTotalValue)}</span>
                  </div>
                  <Badge variant="secondary" className="px-2 py-0 text-[10px] font-bold dark:bg-zinc-800 dark:text-zinc-300">
                    {columnLeads.length}
                  </Badge>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-1 kanban-column">
                  {columnLeads.length === 0 ? (
                    /* Elegantly Styled Empty Stage Placeholder */
                    <div className="flex-1 flex flex-col justify-center items-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center bg-zinc-50/40 dark:bg-zinc-950/10 min-h-[150px] font-sans">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Empty Stage</span>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal max-w-[150px]">Drag a lead card here to advance stage</p>
                    </div>
                  ) : (
                    columnLeads.map((lead) => {
                      const leadId = lead._id || lead.id;
                      return (
                        <div
                          key={leadId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, leadId)}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative text-left font-sans"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{lead.companyName}</span>
                            <button
                              onClick={() => openEditModal(lead)}
                              className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors p-1"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{lead.contactPerson}</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic mt-0.5">{lead.industry}</p>
                          
                          <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-3" />

                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold font-sans text-zinc-800 dark:text-zinc-200">
                              {formatCurrency(lead.dealValue)}
                            </span>
                            {getPriorityBadge(lead.priority)}
                          </div>

                          <div className="flex items-center justify-between mt-3 text-[10px] text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center space-x-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded px-1.5 py-0.5">
                              <User className="h-3 w-3 text-zinc-400 dark:text-zinc-550" />
                              <span className="truncate max-w-[80px]">{lead.assignedTo?.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-zinc-400 dark:text-zinc-550" />
                              <span>{new Date(lead.expectedCloseDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE LEAD DIALOG */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <div className="dark:bg-zinc-900 text-left font-sans">
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-50">Create Pipeline Lead</DialogTitle>
            <DialogDescription className="dark:text-zinc-400">Register a new inquiry and assign it to a BDA Executive.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLead} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Select Client Account</label>
              <Select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              >
                <option value="">-- Choose Account --</option>
                {clients.map(c => {
                  const cId = c._id || c.id;
                  return (
                    <option key={cId} value={cId}>{c.companyName} ({c.location})</option>
                  );
                })}
              </Select>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Contact Person Name</label>
              <Input
                required
                placeholder="e.g. Rajesh Kulkarni"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Deal Value (INR)</label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 50000"
                  value={formData.dealValue}
                  onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Priority</label>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Expected Closure Date</label>
                <Input
                  required
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
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
                      const bId = b._id || b.id;
                      return (
                        <option key={bId} value={bId}>{b.name}</option>
                      );
                    })}
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter className="dark:bg-zinc-900">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="dark:border-zinc-800 dark:hover:bg-zinc-800">Cancel</Button>
              <Button type="submit" className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">Create Opportunity</Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>

      {/* EDIT/UPDATE LEAD DIALOG */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <div className="dark:bg-zinc-900 text-left font-sans">
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-50">Update Lead Details</DialogTitle>
            <DialogDescription className="dark:text-zinc-400">Modify parameters for {selectedLead?.companyName}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditLead} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Contact Person Name</label>
              <Input
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Deal Value (INR)</label>
                <Input
                  required
                  type="number"
                  value={formData.dealValue}
                  onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Priority</label>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Expected Closure Date</label>
                <Input
                  required
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
              {isAdmin && (
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Reassign BDA Executive</label>
                  <Select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                  >
                    {bdas.map(b => {
                      const bId = b._id || b.id;
                      return (
                        <option key={bId} value={bId}>{b.name}</option>
                      );
                    })}
                  </Select>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-6 dark:bg-zinc-900">
              <div>
                {isAdmin && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDeleteLead(selectedLead._id || selectedLead.id)}
                    className="flex items-center space-x-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove</span>
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="dark:border-zinc-800 dark:hover:bg-zinc-800">Cancel</Button>
                <Button type="submit" className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">Save Changes</Button>
              </div>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
};

export default Pipeline;
