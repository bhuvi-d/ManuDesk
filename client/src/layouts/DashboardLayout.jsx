import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import {
  LayoutDashboard,
  GitBranch,
  Users,
  FileText,
  MessageSquare,
  Trophy,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  User,
  Shield,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  ChevronDown,
  Plus,
  Terminal,
  Activity as ActivityIcon,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Pipeline', path: '/pipeline', icon: GitBranch },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Quotations', path: '/quotations', icon: FileText },
    { name: 'Communications', path: '/communications', icon: MessageSquare },
    { name: 'Performance', path: '/performance', icon: Trophy },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  // Theme — default to light mode; toggle persists via localStorage
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Sidebar / Header UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Command Palette State
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdResults, setCmdResults] = useState({ leads: [], clients: [], quotations: [] });

  // Quick Action Modal States
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // Dynamic Lists for Modals
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [bdas, setBdas] = useState([]);

  // Form States for Quick Modals
  const [leadForm, setLeadForm] = useState({ clientId: '', contactPerson: '', dealValue: '', priority: 'Medium', expectedCloseDate: '', assignedTo: '' });
  const [quoteForm, setQuoteForm] = useState({ leadId: '', clientId: '', product: '', quantity: '', unitPrice: '', discount: '0', deliveryTimeline: '4 Weeks', terms: '50% advance, 50% on dispatch. Delivery Ex-Works.' });
  const [activityForm, setActivityForm] = useState({ clientId: '', leadId: '', type: 'Call', description: '', timestamp: new Date().toISOString().substring(0, 16) });

  // Initial Boot & Notification polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Apply theme class to <html> whenever isDark changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Command Palette Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch shared resources for forms
  const fetchFormResources = async () => {
    try {
      const clientsRes = await api.get('/clients');
      setClients(clientsRes.data);
      const leadsRes = await api.get('/leads');
      setLeads(leadsRes.data.filter(l => !['Closed Won', 'Closed Lost'].includes(l.stage)));
      const bdasRes = await api.get('/users/bdas');
      setBdas(bdasRes.data);
    } catch (err) {
      console.error('Failed to load form resources', err);
    }
  };

  useEffect(() => {
    if (isLeadModalOpen || isQuoteModalOpen || isActivityModalOpen || isCmdOpen) {
      fetchFormResources();
    }
  }, [isLeadModalOpen, isQuoteModalOpen, isActivityModalOpen, isCmdOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  // Debounced Global Search Handler
  const handleGlobalSearch = (val) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val.trim()) {
      setSearchResults(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(val)}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 300); // 300ms debounce
  };

  // Command Palette search handler
  const handleCmdSearch = async (val) => {
    setCmdQuery(val);
    if (!val.trim()) {
      setCmdResults({ leads: [], clients: [], quotations: [] });
      return;
    }
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(val)}`);
      setCmdResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Form Submissions
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedClient = clients.find(c => c._id === leadForm.clientId);
      const payload = {
        ...leadForm,
        companyName: selectedClient ? selectedClient.companyName : '',
        industry: selectedClient ? selectedClient.industry : '',
        dealValue: Number(leadForm.dealValue)
      };
      await api.post('/leads', payload);
      showToast('New pipeline opportunity created successfully!');
      setIsLeadModalOpen(false);
      setLeadForm({ clientId: '', contactPerson: '', dealValue: '', priority: 'Medium', expectedCloseDate: '', assignedTo: '' });
      if (location.pathname === '/' || location.pathname === '/pipeline') {
        window.location.reload();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create lead', 'error');
    }
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedLead = leads.find(l => l._id === quoteForm.leadId);
      const payload = {
        ...quoteForm,
        clientId: selectedLead ? (selectedLead.clientId?._id || selectedLead.clientId) : '',
        quantity: Number(quoteForm.quantity),
        unitPrice: Number(quoteForm.unitPrice),
        discount: Number(quoteForm.discount)
      };
      await api.post('/quotations', payload);
      showToast('Quotation draft prepared successfully!');
      setIsQuoteModalOpen(false);
      setQuoteForm({ leadId: '', clientId: '', product: '', quantity: '', unitPrice: '', discount: '0', deliveryTimeline: '4 Weeks', terms: '50% advance, 50% on dispatch. Delivery Ex-Works.' });
      if (location.pathname === '/quotations' || location.pathname === '/') {
        window.location.reload();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create quotation', 'error');
    }
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...activityForm,
        timestamp: new Date(activityForm.timestamp)
      };
      if (!payload.leadId) delete payload.leadId;
      await api.post('/activities', payload);
      showToast('Communication log recorded successfully!');
      setIsActivityModalOpen(false);
      setActivityForm({ clientId: '', leadId: '', type: 'Call', description: '', timestamp: new Date().toISOString().substring(0, 16) });
      if (location.pathname === '/communications' || location.pathname === '/') {
        window.location.reload();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to log activity', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col md:flex-row transition-colors duration-200">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-zinc-950 dark:bg-black text-white px-4 py-3 h-14 border-b border-zinc-800 dark:border-zinc-900 shrink-0">
        <div className="flex items-center space-x-2">
          <GitBranch className="h-5 w-5 text-zinc-300" />
          <span className="font-bold text-base tracking-wide font-sans">MANUDESK</span>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => toggleTheme()} className="p-1 text-zinc-400 hover:text-white">
            {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className="relative p-1 text-zinc-400 hover:text-white"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-zinc-950" />
            )}
          </button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-zinc-400 hover:text-white"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 dark:bg-black text-zinc-400 border-r border-zinc-800 dark:border-zinc-900 flex flex-col justify-between
        transform transition-transform duration-200 ease-in-out md:relative md:transform-none md:flex shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
            <div className="flex items-center space-x-3">
              <div className="bg-zinc-800 p-1.5 rounded-md text-white">
                <GitBranch className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="font-bold text-white tracking-wide text-base">ManuDesk</span>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">BDA Operations</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="px-4 pt-4 space-y-2">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5">Quick Entries</div>
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={() => setIsLeadModalOpen(true)} className="flex flex-col items-center justify-center p-2 rounded bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-white">
                <Plus className="h-4 w-4 mb-1 text-emerald-500" />
                <span className="text-[9px] font-semibold uppercase">Lead</span>
              </button>
              <button onClick={() => setIsQuoteModalOpen(true)} className="flex flex-col items-center justify-center p-2 rounded bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-white">
                <Plus className="h-4 w-4 mb-1 text-blue-500" />
                <span className="text-[9px] font-semibold uppercase">Quote</span>
              </button>
              <button onClick={() => setIsActivityModalOpen(true)} className="flex flex-col items-center justify-center p-2 rounded bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-white">
                <Plus className="h-4 w-4 mb-1 text-amber-500" />
                <span className="text-[9px] font-semibold uppercase">Call</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-zinc-900 text-white shadow-sm border border-zinc-800' 
                      : 'hover:bg-zinc-900/50 hover:text-zinc-200'}
                  `}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile section at the bottom */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950 dark:bg-black">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 overflow-hidden text-left">
              <div className="h-9 w-9 rounded-md bg-zinc-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {user?.name?.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <Shield className="h-3 w-3 text-zinc-500" />
                  <p className="text-[10px] font-medium text-zinc-500 truncate">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-zinc-900/50 border border-zinc-800/50 rounded-md transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Top Header for Desktop */}
        <header className="hidden md:flex items-center justify-between h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 shrink-0 z-30 transition-colors duration-200">
          
          {/* Global Search & Command Palette Hint */}
          <div className="flex items-center space-x-3 w-96 relative">
            <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search leads, clients, quotes..."
              value={searchQuery}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="w-full pl-9 pr-14 py-1.5 text-xs rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-50 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 h-5 select-none pointer-events-none absolute right-3 top-2 px-1.5 font-mono text-[9px] font-bold text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded">
              Ctrl K
            </kbd>

            {/* Global Search Results Dropdown */}
            {searchFocused && searchQuery.trim() && (
              <div className="absolute top-11 left-0 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg max-h-80 overflow-y-auto z-[60] p-2 text-left">
                {!searchResults ? (
                  <div className="p-4 text-center text-xs text-zinc-400 flex items-center justify-center space-x-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Searching...</span>
                  </div>
                ) : Object.values(searchResults).every(arr => arr.length === 0) ? (
                  <div className="p-4 text-center text-xs text-zinc-400">No results found for "{searchQuery}"</div>
                ) : (
                  <div className="space-y-3 p-1">
                    {searchResults.leads.length > 0 && (
                      <div>
                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 bg-zinc-50 dark:bg-zinc-950 rounded">Leads</div>
                        {searchResults.leads.map(l => (
                          <Link key={l._id} to="/pipeline" className="block px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded text-xs">
                            <div className="font-bold text-zinc-800 dark:text-zinc-200">{l.companyName}</div>
                            <div className="text-[10px] text-zinc-400">Contact: {l.contactPerson} | Stage: {l.stage}</div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {searchResults.clients.length > 0 && (
                      <div>
                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 bg-zinc-50 dark:bg-zinc-950 rounded">Clients</div>
                        {searchResults.clients.map(c => (
                          <Link key={c._id} to="/clients" className="block px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded text-xs">
                            <div className="font-bold text-zinc-800 dark:text-zinc-200">{c.companyName}</div>
                            <div className="text-[10px] text-zinc-400">Industry: {c.industry} | Location: {c.location}</div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {searchResults.quotations.length > 0 && (
                      <div>
                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 bg-zinc-50 dark:bg-zinc-950 rounded">Quotations</div>
                        {searchResults.quotations.map(q => (
                          <Link key={q._id} to="/quotations" className="block px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded text-xs">
                            <div className="font-bold text-zinc-800 dark:text-zinc-200">{q.product}</div>
                            <div className="text-[10px] text-zinc-400">Total: ₹{q.totalValue?.toLocaleString('en-IN')} | Status: {q.status}</div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Header icons */}
          <div className="flex items-center space-x-4">
            
            {/* Theme Toggle */}
            <button
              onClick={() => toggleTheme()}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-zinc-900" />
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-250">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">Operational Alerts</span>
                      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-medium text-zinc-600 dark:text-zinc-400">
                        {notifications.length} Action Items
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-zinc-400">No alerts pending</div>
                      ) : (
                        notifications.map((notif) => (
                          <Link
                            key={notif.id}
                            to={notif.link}
                            onClick={() => setShowNotifications(false)}
                            className="block px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 border-b border-zinc-50 dark:border-zinc-800 last:border-0 text-left transition-colors"
                          >
                            <div className="flex items-start space-x-2">
                              <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${
                                notif.type === 'warning' ? 'bg-amber-500' :
                                notif.type === 'action' ? 'bg-blue-600' :
                                notif.type === 'today' ? 'bg-red-500' : 'bg-green-500'
                              }`} />
                              <div>
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-tight">{notif.message}</p>
                                <span className="text-[9px] text-zinc-400 mt-1 block">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-6 w-px bg-zinc-200 dark:border-zinc-800" />

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="h-7 w-7 rounded bg-zinc-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user?.name?.substring(0, 2)}
                </div>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{user?.name}</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-3 duration-250 text-left">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-200 block truncate">{user?.name}</span>
                      <span className="text-[10px] text-zinc-400 truncate block mt-0.5">{user?.email}</span>
                    </div>
                    <Link to="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center space-x-2 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors">
                      <User className="h-4 w-4 text-zinc-400" />
                      <span>My Profile</span>
                    </Link>
                    <Link to="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center space-x-2 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors">
                      <SettingsIcon className="h-4 w-4 text-zinc-400" />
                      <span>Workspace Settings</span>
                    </Link>
                    <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
                    <button 
                      onClick={() => { logout(); navigate('/login'); }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>

      {/* ================= COMMAND PALETTE DIALOG (Ctrl+K) ================= */}
      <Dialog isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)}>
        <div className="space-y-4 text-left">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Terminal className="h-4.5 w-4.5 text-zinc-400" />
              <span>ManuDesk Command Palette</span>
            </DialogTitle>
            <DialogDescription>Quickly search resources or execute workspace navigation.</DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search or type a navigation command..."
              value={cmdQuery}
              onChange={(e) => handleCmdSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-4">
            {/* If empty input, show quick nav shortcuts */}
            {!cmdQuery.trim() ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block px-1 mb-1">Navigation Shortcuts</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button onClick={() => { setIsCmdOpen(false); navigate('/'); }} className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded bg-zinc-50 dark:bg-zinc-950 text-left font-medium">
                      Dashboard
                    </button>
                    <button onClick={() => { setIsCmdOpen(false); navigate('/pipeline'); }} className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded bg-zinc-50 dark:bg-zinc-950 text-left font-medium">
                      Kanban Pipeline
                    </button>
                    <button onClick={() => { setIsCmdOpen(false); navigate('/clients'); }} className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded bg-zinc-50 dark:bg-zinc-950 text-left font-medium">
                      Client Accounts
                    </button>
                    <button onClick={() => { setIsCmdOpen(false); navigate('/quotations'); }} className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded bg-zinc-50 dark:bg-zinc-950 text-left font-medium">
                      Quotations Log
                    </button>
                    <button onClick={() => { setIsCmdOpen(false); navigate('/communications'); }} className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded bg-zinc-50 dark:bg-zinc-950 text-left font-medium">
                      Communication Audit
                    </button>
                    <button onClick={() => { setIsCmdOpen(false); navigate('/analytics'); }} className="p-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded bg-zinc-50 dark:bg-zinc-950 text-left font-medium">
                      Analytical Portal
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block px-1 mb-1">Fast Workflows</span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button onClick={() => { setIsCmdOpen(false); setIsLeadModalOpen(true); }} className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded text-center font-bold text-emerald-600 dark:text-emerald-400">
                      + Add Lead
                    </button>
                    <button onClick={() => { setIsCmdOpen(false); setIsQuoteModalOpen(true); }} className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950 rounded text-center font-bold text-blue-600 dark:text-blue-400">
                      + Quote
                    </button>
                    <button onClick={() => { setIsCmdOpen(false); setIsActivityModalOpen(true); }} className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950 rounded text-center font-bold text-amber-600 dark:text-amber-400">
                      + Log Call
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Search results inside Palette */
              <div className="space-y-3">
                {cmdResults.leads.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block px-1 mb-1 bg-zinc-50 dark:bg-zinc-950 rounded">Leads</span>
                    {cmdResults.leads.map(l => (
                      <div 
                        key={l._id} 
                        onClick={() => { setIsCmdOpen(false); navigate('/pipeline'); }}
                        className="cursor-pointer p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded text-xs flex justify-between"
                      >
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{l.companyName}</span>
                        <span className="text-[10px] text-zinc-400">Inquiry: {l.contactPerson}</span>
                      </div>
                    ))}
                  </div>
                )}

                {cmdResults.clients.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block px-1 mb-1 bg-zinc-50 dark:bg-zinc-950 rounded">Clients</span>
                    {cmdResults.clients.map(c => (
                      <div 
                        key={c._id} 
                        onClick={() => { setIsCmdOpen(false); navigate('/clients'); }}
                        className="cursor-pointer p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded text-xs flex justify-between"
                      >
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{c.companyName}</span>
                        <span className="text-[10px] text-zinc-400">{c.location}</span>
                      </div>
                    ))}
                  </div>
                )}

                {cmdResults.quotations.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block px-1 mb-1 bg-zinc-50 dark:bg-zinc-950 rounded">Quotations</span>
                    {cmdResults.quotations.map(q => (
                      <div 
                        key={q._id} 
                        onClick={() => { setIsCmdOpen(false); navigate('/quotations'); }}
                        className="cursor-pointer p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded text-xs flex justify-between"
                      >
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{q.product}</span>
                        <span className="text-[10px] text-zinc-400">Total: ₹{q.totalValue?.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {Object.values(cmdResults).every(arr => arr.length === 0) && (
                  <div className="p-4 text-center text-xs text-zinc-400">No matching search records.</div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCmdOpen(false)}>Close Palette</Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* ================= GLOBAL QUICK LEAD DIALOG ================= */}
      <Dialog isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Create Pipeline Lead</DialogTitle>
          <DialogDescription>Register a new inquiry and assign it to a BDA Executive.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLeadSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-600">Select Client Account</label>
            <Select
              required
              value={leadForm.clientId}
              onChange={(e) => setLeadForm({ ...leadForm, clientId: e.target.value })}
            >
              <option value="">-- Choose Account --</option>
              {clients.map(c => (
                <option key={c._id} value={c._id}>{c.companyName} ({c.location})</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-600">Contact Person Name</label>
            <Input
              required
              placeholder="e.g. Contact 1"
              value={leadForm.contactPerson}
              onChange={(e) => setLeadForm({ ...leadForm, contactPerson: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600">Deal Value (INR)</label>
              <Input
                required
                type="number"
                placeholder="e.g. 50000"
                value={leadForm.dealValue}
                onChange={(e) => setLeadForm({ ...leadForm, dealValue: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600">Priority</label>
              <Select
                value={leadForm.priority}
                onChange={(e) => setLeadForm({ ...leadForm, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600">Expected Closure Date</label>
              <Input
                required
                type="date"
                value={leadForm.expectedCloseDate}
                onChange={(e) => setLeadForm({ ...leadForm, expectedCloseDate: e.target.value })}
              />
            </div>
            {isAdmin && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-600">Assign BDA Executive</label>
                <Select
                  required
                  value={leadForm.assignedTo}
                  onChange={(e) => setLeadForm({ ...leadForm, assignedTo: e.target.value })}
                >
                  <option value="">-- Choose BDA --</option>
                  {bdas.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeadModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Opportunity</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ================= GLOBAL QUICK QUOTATION DIALOG ================= */}
      <Dialog isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Prepare Commercial Quote</DialogTitle>
          <DialogDescription>Draft pricing figures and terms linked to a pipeline opportunity.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleQuoteSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-600">Select Pipeline Opportunity (Lead)</label>
            <Select
              required
              value={quoteForm.leadId}
              onChange={(e) => setQuoteForm({ ...quoteForm, leadId: e.target.value })}
            >
              <option value="">-- Choose Opportunity --</option>
              {leads.map(l => (
                <option key={l._id} value={l._id}>
                  {l.companyName} - {l.contactPerson} (₹{l.dealValue?.toLocaleString('en-IN')})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-600">Product / Fabrication Item Name</label>
            <Input
              required
              placeholder="e.g. Helical Gears (Grade 12-B)"
              value={quoteForm.product}
              onChange={(e) => setQuoteForm({ ...quoteForm, product: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600">Quantity</label>
              <Input
                required
                type="number"
                placeholder="e.g. 5000"
                value={quoteForm.quantity}
                onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600">Unit Price (INR)</label>
              <Input
                required
                type="number"
                step="0.01"
                placeholder="e.g. 15.50"
                value={quoteForm.unitPrice}
                onChange={(e) => setQuoteForm({ ...quoteForm, unitPrice: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600">Discount (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={quoteForm.discount}
                onChange={(e) => setQuoteForm({ ...quoteForm, discount: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-600">Delivery Timeline</label>
            <Input
              required
              placeholder="e.g. 4 Weeks / 15 Days"
              value={quoteForm.deliveryTimeline}
              onChange={(e) => setQuoteForm({ ...quoteForm, deliveryTimeline: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-600">Terms & Conditions</label>
            <textarea
              required
              rows="3"
              className="flex w-full rounded-md border border-zinc-200 bg-white dark:bg-zinc-950 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none"
              value={quoteForm.terms}
              onChange={(e) => setQuoteForm({ ...quoteForm, terms: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuoteModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Draft Quotation</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* ================= GLOBAL QUICK LOG ACTIVITY DIALOG ================= */}
      <Dialog isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Log BDA Activity</DialogTitle>
          <DialogDescription>Document phone calls, visits, emails, or technical drawing changes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleActivitySubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-600">Select Client Account</label>
            <Select
              required
              value={activityForm.clientId}
              onChange={(e) => {
                const cId = e.target.value;
                setActivityForm({ ...activityForm, clientId: cId, leadId: '' });
              }}
            >
              <option value="">-- Choose Account --</option>
              {clients.map(c => (
                <option key={c._id} value={c._id}>{c.companyName} ({c.location})</option>
              ))}
            </Select>
          </div>

          {activityForm.clientId && (
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600">Link to Opportunity (Optional)</label>
              <Select
                value={activityForm.leadId}
                onChange={(e) => setActivityForm({ ...activityForm, leadId: e.target.value })}
              >
                <option value="">-- General Account Level --</option>
                {leads.filter(l => (l.clientId?._id || l.clientId) === activityForm.clientId).map(l => (
                  <option key={l._id} value={l._id}>Inquiry: {l.contactPerson} (₹{l.dealValue?.toLocaleString('en-IN')})</option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600">Activity Type</label>
              <Select
                value={activityForm.type}
                onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
              >
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Meeting">Meeting</option>
                <option value="Site Visit">Site Visit</option>
                <option value="Negotiation Update">Negotiation Update</option>
              </Select>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-600">Log Timestamp</label>
              <Input
                required
                type="datetime-local"
                value={activityForm.timestamp}
                onChange={(e) => setActivityForm({ ...activityForm, timestamp: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-600">Detailed Description / Notes</label>
            <textarea
              required
              rows="3"
              className="flex w-full rounded-md border border-zinc-200 bg-white dark:bg-zinc-950 px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none"
              placeholder="e.g. Discussed technical tolerances."
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityModalOpen(false)}>Cancel</Button>
            <Button type="submit">Log Entry</Button>
          </DialogFooter>
        </form>
      </Dialog>

    </div>
  );
};

export default DashboardLayout;

