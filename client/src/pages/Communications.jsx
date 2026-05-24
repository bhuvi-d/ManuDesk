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
  MessageSquare,
  Plus,
  Phone,
  Mail,
  Users,
  MapPin,
  Calendar,
  Layers,
  FileText,
  RefreshCw,
  Search,
  MessageCircle,
  X,
  FileSpreadsheet
} from 'lucide-react';

const Communications = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activities, setActivities] = useState([]);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [clientFilter, setClientFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Form State
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    leadId: '',
    type: 'Call',
    description: '',
    timestamp: new Date().toISOString().substring(0, 16)
  });

  const fetchActivities = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let params = [];
      if (clientFilter) params.push(`clientId=${clientFilter}`);
      const queryStr = params.length > 0 ? `?${params.join('&')}` : '';

      const res = await api.get(`/activities${queryStr}`);
      // Client-side type filter
      let filteredData = res.data;
      if (typeFilter) {
        filteredData = filteredData.filter(a => a.type === typeFilter);
      }
      setActivities(filteredData);

      const clientsRes = await api.get('/clients');
      setClients(clientsRes.data);

      const leadsRes = await api.get('/leads');
      setLeads(leadsRes.data);
      
      if (!silent) {
        showToast('Communication logs refreshed', 'success');
      }
    } catch (error) {
      console.error('Error loading activity logs', error);
      showToast('Error loading activity logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(true);
  }, [clientFilter, typeFilter]);

  // Set local timezone timestamp on open
  const handleOpenLogModal = () => {
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
    setFormData({
      clientId: '',
      leadId: '',
      type: 'Call',
      description: '',
      timestamp: localISOTime
    });
    setIsLogOpen(true);
  };

  // When client changes in form, filter active leads dropdown
  const handleClientChange = (clientId) => {
    setFormData(prev => ({
      ...prev,
      clientId,
      leadId: '' // reset lead selection
    }));
  };

  const formLeads = leads.filter(l => {
    const cId = l.clientId?._id || l.clientId?.id || l.clientId;
    return cId === formData.clientId && !['Closed Won', 'Closed Lost'].includes(l.stage);
  });

  const handleLogActivity = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        timestamp: new Date(formData.timestamp)
      };
      if (!payload.leadId) delete payload.leadId; // clean empty leadId

      await api.post('/activities', payload);
      setIsLogOpen(false);
      showToast('Activity logged successfully', 'success');
      resetForm();
      fetchActivities(true);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error logging activity', 'error');
    }
  };

  const resetForm = () => {
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
    setFormData({
      clientId: '',
      leadId: '',
      type: 'Call',
      description: '',
      timestamp: localISOTime
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'Call': return <Phone className="h-4 w-4 text-blue-500" />;
      case 'Email': return <Mail className="h-4 w-4 text-amber-500" />;
      case 'Meeting': return <Users className="h-4 w-4 text-indigo-500" />;
      case 'Site Visit': return <MapPin className="h-4 w-4 text-red-500" />;
      case 'Negotiation Update': return <FileText className="h-4 w-4 text-purple-500" />;
      default: return <MessageCircle className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getActivityBadge = (type) => {
    switch (type) {
      case 'Call': return <Badge variant="info">Call</Badge>;
      case 'Email': return <Badge variant="warning">Email</Badge>;
      case 'Meeting': return <Badge variant="success">Meeting</Badge>;
      case 'Site Visit': return <Badge variant="destructive">Site Visit</Badge>;
      case 'Negotiation Update': return <Badge variant="default">Negotiation</Badge>;
      default: return <Badge variant="secondary">Update</Badge>;
    }
  };

  const activityTypes = ['Call', 'Email', 'Meeting', 'Site Visit', 'Negotiation Update'];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 font-sans">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">BDA Communication Workflows</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Audit chronological records of calls, client visits, site reviews, and commercial terms negotiations.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => fetchActivities(false)} className="flex items-center space-x-2 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload</span>
          </Button>
          <Button size="sm" onClick={handleOpenLogModal} className="flex items-center space-x-1 bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
            <Plus className="h-4 w-4" />
            <span>Log Communication</span>
          </Button>
        </div>
      </div>

      {/* Filter and Tab Panels */}
      <div className="flex flex-col space-y-4 font-sans">
        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              typeFilter === ''
                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            All Logs
          </button>
          {activityTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                typeFilter === type
                  ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {type}s
            </button>
          ))}
        </div>

        {/* Client filter dropdown */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row gap-4 shadow-sm">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Filter by Account</label>
            <Select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="text-xs dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
            >
              <option value="">All Accounts</option>
              {clients.map(c => {
                const cId = c._id || c.id;
                return (
                  <option key={cId} value={cId}>{c.companyName}</option>
                );
              })}
            </Select>
          </div>
        </div>
      </div>

      {/* Activities Timeline */}
      <Card className="compact-border dark:border-zinc-800 subtle-shadow bg-white dark:bg-zinc-900">
        <CardContent className="p-6">
          {loading ? (
            /* Skeleton Loading States */
            <div className="space-y-6 py-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex space-x-4 animate-pulse">
                  <div className="h-8 w-8 rounded-md bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-1/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            /* Enhanced Illustrated Empty State */
            <div className="text-center py-20 flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-1">No communications logged</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-normal">
                {typeFilter || clientFilter 
                  ? 'No activity matches the selected filters. Try broadening your criteria.'
                  : 'Start tracking customer touchpoints by logging details of phone calls, site reviews, or email updates.'}
              </p>
              {(typeFilter || clientFilter) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setTypeFilter(''); setClientFilter(''); }} 
                  className="text-xs dark:border-zinc-800"
                >
                  Clear Filters
                </Button>
              )}
              {!typeFilter && !clientFilter && (
                <Button size="sm" onClick={handleOpenLogModal} className="text-xs">
                  Log First Activity
                </Button>
              )}
            </div>
          ) : (
            /* Chronological Timeline */
            <div className="relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-8">
              {activities.map((act) => {
                const actId = act._id || act.id;
                const clientObj = act.clientId;
                const companyName = typeof clientObj === 'object' ? clientObj?.companyName : 'Corporate Account';
                const leadObj = act.leadId;
                const isLeadObject = leadObj && typeof leadObj === 'object';
                const leadContact = isLeadObject ? leadObj?.contactPerson : null;

                return (
                  <div key={actId} className="relative">
                    {/* Icon Node */}
                    <span className="absolute -left-10 top-0.5 h-8 w-8 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center">
                      {getActivityIcon(act.type)}
                    </span>
                    
                    {/* Content */}
                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                            {companyName}
                          </span>
                          {leadContact && (
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                              (Lead: {leadContact})
                            </span>
                          )}
                          {getActivityBadge(act.type)}
                        </div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                          {new Date(act.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-600 dark:text-zinc-300 font-normal leading-relaxed max-w-4xl">
                        {act.description}
                      </p>

                      <div className="flex items-center space-x-2 text-[10px] text-zinc-400 dark:text-zinc-500 pt-1 font-sans">
                        <span className="font-semibold text-zinc-500 dark:text-zinc-400">Logged by:</span>
                        <span>{act.createdBy?.name || 'Unknown User'} ({act.createdBy?.role || 'Executive'})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* LOG ACTIVITY DIALOG */}
      <Dialog isOpen={isLogOpen} onClose={() => setIsLogOpen(false)}>
        <div className="dark:bg-zinc-900 text-left font-sans">
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-50">Log BDA Activity</DialogTitle>
            <DialogDescription className="dark:text-zinc-400">Document phone calls, visits, emails, or technical drawing changes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogActivity} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Select Client Account</label>
              <Select
                required
                value={formData.clientId}
                onChange={(e) => handleClientChange(e.target.value)}
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

            {/* Conditional Lead dropdown */}
            {formData.clientId && formLeads.length > 0 && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Link to Opportunity (Optional)</label>
                <Select
                  value={formData.leadId}
                  onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                >
                  <option value="">-- General Account Level --</option>
                  {formLeads.map(l => {
                    const lId = l._id || l.id;
                    return (
                      <option key={lId} value={lId}>Inquiry: {l.contactPerson} (₹{l.dealValue?.toLocaleString('en-IN') || 0})</option>
                    );
                  })}
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Activity Type</label>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Site Visit">Site Visit</option>
                  <option value="Negotiation Update">Negotiation Update</option>
                </Select>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Log Timestamp</label>
                <Input
                  required
                  type="datetime-local"
                  value={formData.timestamp}
                  onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                  className="dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Detailed Description / Notes</label>
              <textarea
                required
                rows="4"
                placeholder="e.g. Reviewed tolerances. Client requested a 3% discount on batch casting molds. Revision drafted."
                className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:focus-visible:ring-zinc-700"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <DialogFooter className="dark:bg-zinc-900">
              <Button type="button" variant="outline" onClick={() => setIsLogOpen(false)} className="dark:border-zinc-800 dark:hover:bg-zinc-800">Cancel</Button>
              <Button type="submit" className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">Log Entry</Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>
    </div>
  );
};

export default Communications;
