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
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Eye,
  RefreshCw,
  Edit2
} from 'lucide-react';

const Quotations = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [quotations, setQuotations] = useState([]);
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // all, drafts, pending, approved

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    leadId: '',
    clientId: '',
    product: '',
    quantity: '',
    unitPrice: '',
    discount: '0',
    deliveryTimeline: '4 Weeks',
    terms: '50% advance, 50% on dispatch. Delivery Ex-Works.'
  });

  const fetchQuotations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = '/quotations';
      if (statusFilter) url += `?status=${statusFilter}`;

      const [res, leadsRes, clientsRes] = await Promise.all([
        api.get(url),
        api.get('/leads'),
        api.get('/clients')
      ]);

      setQuotations(res.data);
      setLeads(leadsRes.data.filter(l => !['Closed Won', 'Closed Lost'].includes(l.stage)));
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error fetching quotations', error);
      showToast('Error loading quotations list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations(true);
  }, [statusFilter]);

  // When lead is selected, auto-fill clientId
  const handleLeadChange = (leadId) => {
    const selectedLeadObj = leads.find(l => (l._id || l.id) === leadId);
    setFormData(prev => ({
      ...prev,
      leadId,
      clientId: selectedLeadObj?.clientId?._id || selectedLeadObj?.clientId?.id || selectedLeadObj?.clientId || ''
    }));
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        unitPrice: Number(formData.unitPrice),
        discount: Number(formData.discount)
      };

      await api.post('/quotations', payload);
      setIsCreateOpen(false);
      showToast('Quotation draft created successfully', 'success');
      resetForm();
      fetchQuotations(true);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error generating quotation', 'error');
    }
  };

  const updateQuotationStatus = async (quoteId, newStatus) => {
    try {
      await api.put(`/quotations/${quoteId}`, { status: newStatus });
      showToast(`Quotation status updated to ${newStatus}`, 'success');
      fetchQuotations(true);
      if (selectedQuote && (selectedQuote._id || selectedQuote.id) === quoteId) {
        // Refresh details modal
        const refreshed = await api.get(`/quotations/${quoteId}`);
        setSelectedQuote(refreshed.data);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Error updating status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      leadId: '',
      clientId: '',
      product: '',
      quantity: '',
      unitPrice: '',
      discount: '0',
      deliveryTimeline: '4 Weeks',
      terms: '50% advance, 50% on dispatch. Delivery Ex-Works.'
    });
  };

  const viewQuoteDetails = (quote) => {
    setSelectedQuote(quote);
    setIsViewOpen(true);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft': return <Badge variant="secondary">Draft</Badge>;
      case 'Sent': return <Badge variant="info">Sent</Badge>;
      case 'Under Review': return <Badge variant="warning">Under Review</Badge>;
      case 'Approved': return <Badge variant="success">Approved</Badge>;
      case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">Draft</Badge>;
    }
  };

  // Local filtering based on quick tabs
  const getFilteredQuotations = () => {
    let result = [...quotations];
    if (quickFilter === 'drafts') {
      result = result.filter(q => q.status === 'Draft');
    } else if (quickFilter === 'pending') {
      result = result.filter(q => ['Sent', 'Under Review'].includes(q.status));
    } else if (quickFilter === 'approved') {
      result = result.filter(q => q.status === 'Approved');
    }
    return result;
  };

  const filteredQuotes = getFilteredQuotations();

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Quotations & Pricing Workspace</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Configure commercial offers, compute item values with discounts, and coordinate approvals.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => fetchQuotations(false)} className="flex items-center space-x-2 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload</span>
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setIsCreateOpen(true); }} className="flex items-center space-x-1 bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
            <Plus className="h-4 w-4" />
            <span>Prepare Quotation</span>
          </Button>
        </div>
      </div>

      {/* Filter and Tab Panels */}
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
            All Quotes
          </button>
          <button
            onClick={() => setQuickFilter('drafts')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              quickFilter === 'drafts'
                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => setQuickFilter('pending')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              quickFilter === 'pending'
                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Awaiting Client (Sent / Under Review)
          </button>
          <button
            onClick={() => setQuickFilter('approved')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              quickFilter === 'approved'
                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Approved Contracts
          </button>
        </div>

        {/* Dropdown status Filter bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Detailed Status Filter</span>
          <div className="w-full md:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Quotations List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden text-left">
        {loading ? (
          /* Table Skeleton Loaders */
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-850 rounded w-1/4" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3" />
                </div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-850 rounded w-16" />
              </div>
            ))}
          </div>
        ) : filteredQuotes.length === 0 ? (
          /* Enhanced Illustrated Empty State Placeholder */
          <div className="text-center py-20 flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-550 mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-1">No quotations found</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-normal">
              {quickFilter !== 'all' || statusFilter
                ? 'No quotations match the active filters. Try broadening your criteria or reset the search.'
                : 'Formulate pricing catalogs, compute bulk casting discounts, and draft commercial proposals for active client leads.'}
            </p>
            {(quickFilter !== 'all' || statusFilter) ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setQuickFilter('all'); setStatusFilter(''); }} 
                className="text-xs dark:border-zinc-800"
              >
                Reset Filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIsCreateOpen(true)} className="text-xs">
                Prepare First Quote
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="dark:border-zinc-800">
                <TableHead>Client Company</TableHead>
                <TableHead>Product / Fabrication Part</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Delivery Timeline</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => {
                const quoteId = quote._id || quote.id;
                return (
                  <TableRow key={quoteId} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 dark:border-zinc-800">
                    <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">
                      {quote.clientId?.companyName || 'Unknown Client'}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {quote.product}
                    </TableCell>
                    <TableCell className="text-xs dark:text-zinc-300">
                      {quote.quantity.toLocaleString()} units
                      {quote.discount > 0 && (
                        <span className="text-[10px] text-red-500 font-bold ml-1.5">(-{quote.discount}%)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">{quote.deliveryTimeline}</TableCell>
                    <TableCell className="font-bold font-sans text-zinc-800 dark:text-zinc-200">
                      {formatCurrency(quote.totalValue)}
                    </TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewQuoteDetails(quote)}
                        className="text-xs flex items-center space-x-1.5 h-8 ml-auto dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-300"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* VIEW QUOTATION DETAILS DIALOG */}
      <Dialog isOpen={isViewOpen} onClose={() => setIsViewOpen(false)}>
        {selectedQuote && (
          <div className="text-left space-y-4 dark:bg-zinc-900 font-sans">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="dark:text-zinc-50">Quotation Details</DialogTitle>
                  <DialogDescription className="dark:text-zinc-400">Commercial parameters for {selectedQuote.clientId?.companyName}.</DialogDescription>
                </div>
                <div>
                  {getStatusBadge(selectedQuote.status)}
                </div>
              </div>
            </DialogHeader>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-md p-4 bg-zinc-50 dark:bg-zinc-950/40 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase">Associated Client</span>
                  <span className="text-zinc-800 dark:text-zinc-100 font-bold text-sm block mt-0.5">{selectedQuote.clientId?.companyName}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-450 block">{selectedQuote.clientId?.location}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase">Lead Contact</span>
                  <span className="text-zinc-800 dark:text-zinc-100 font-semibold block mt-0.5">{selectedQuote.leadId?.contactPerson || 'N/A'}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-450 block font-sans">BDA: {selectedQuote.leadId?.assignedTo?.name || 'Unassigned'}</span>
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 my-2" />

              <div>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase">Product / Part Specification</span>
                <span className="text-zinc-800 dark:text-zinc-100 font-semibold text-xs mt-0.5 block">{selectedQuote.product}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase">Quantity</span>
                  <span className="text-zinc-800 dark:text-zinc-100 font-semibold mt-0.5 block">{selectedQuote.quantity.toLocaleString()} units</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase">Unit Price</span>
                  <span className="text-zinc-800 dark:text-zinc-100 font-semibold mt-0.5 block font-sans">₹{selectedQuote.unitPrice}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase">Discount</span>
                  <span className="text-zinc-800 dark:text-zinc-100 font-semibold mt-0.5 block">{selectedQuote.discount}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-2">
                <div>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase">Delivery Timeline</span>
                  <span className="text-zinc-800 dark:text-zinc-100 font-semibold mt-0.5 block">{selectedQuote.deliveryTimeline}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-450 block font-bold uppercase">Quoted Value</span>
                  <span className="text-zinc-950 dark:text-zinc-50 font-bold text-sm mt-0.5 block font-sans text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedQuote.totalValue)}
                  </span>
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2">
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase">Commercial Terms & Conditions</span>
                <p className="text-zinc-650 dark:text-zinc-300 italic mt-1 leading-normal text-[11px]">{selectedQuote.terms}</p>
              </div>
            </div>

            {/* Status Workflow Action Bar */}
            <div className="pt-2 border-t border-zinc-150 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">Update Operational Workflow Status</span>
              <div className="flex flex-wrap gap-2">
                {selectedQuote.status === 'Draft' && (
                  <Button
                    size="sm"
                    onClick={() => updateQuotationStatus(selectedQuote._id || selectedQuote.id, 'Sent')}
                    className="flex items-center space-x-1 text-xs bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send to Client</span>
                  </Button>
                )}
                {selectedQuote.status === 'Sent' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateQuotationStatus(selectedQuote._id || selectedQuote.id, 'Under Review')}
                    className="flex items-center space-x-1 text-xs dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Mark Under Review</span>
                  </Button>
                )}
                {(selectedQuote.status === 'Sent' || selectedQuote.status === 'Under Review') && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateQuotationStatus(selectedQuote._id || selectedQuote.id, 'Approved')}
                      className="bg-emerald-600 hover:bg-emerald-600/90 text-white flex items-center space-x-1 text-xs"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Approve Quote</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateQuotationStatus(selectedQuote._id || selectedQuote.id, 'Rejected')}
                      className="flex items-center space-x-1 text-xs"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject Quote</span>
                    </Button>
                  </>
                )}
                {selectedQuote.status === 'Rejected' && (
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">Quotation rejected. A new quote draft must be prepared.</span>
                )}
                {selectedQuote.status === 'Approved' && (
                  <span className="text-[11px] text-emerald-650 dark:text-emerald-400 font-semibold flex items-center space-x-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Approved & Advanced to Negotiation. Contract pending.</span>
                  </span>
                )}
              </div>
            </div>

            <DialogFooter className="dark:bg-zinc-900">
              <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)} className="dark:border-zinc-800 dark:hover:bg-zinc-800">Close Details</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* CREATE QUOTATION DIALOG */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <div className="dark:bg-zinc-900 text-left font-sans">
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-50">Prepare Commercial Quote</DialogTitle>
            <DialogDescription className="dark:text-zinc-400">Draft pricing figures and terms linked to a pipeline opportunity.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateQuotation} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Select Pipeline Opportunity (Lead)</label>
              <Select
                required
                value={formData.leadId}
                onChange={(e) => handleLeadChange(e.target.value)}
                className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              >
                <option value="">-- Choose Opportunity --</option>
                {leads.map(l => {
                  const lId = l._id || l.id;
                  return (
                    <option key={lId} value={lId}>
                      {l.companyName} - {l.contactPerson} ({formatCurrency(l.dealValue)})
                    </option>
                  );
                })}
              </Select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Product / Fabrication Item Name</label>
              <Input
                required
                placeholder="e.g. Helical Gears (Grade 12-B)"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Quantity</label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 5000"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Unit Price (INR)</label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  placeholder="e.g. 15.50"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Discount (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Delivery Timeline</label>
              <Input
                required
                placeholder="e.g. 4 Weeks / 15 Days"
                value={formData.deliveryTimeline}
                onChange={(e) => setFormData({ ...formData, deliveryTimeline: e.target.value })}
                className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Terms & Conditions</label>
              <textarea
                required
                rows="3"
                className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:focus-visible:ring-zinc-700"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              />
            </div>

            <DialogFooter className="dark:bg-zinc-900">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="dark:border-zinc-800 dark:hover:bg-zinc-800">Cancel</Button>
              <Button type="submit" className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">Save Draft Quotation</Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>
    </div>
  );
};

export default Quotations;
