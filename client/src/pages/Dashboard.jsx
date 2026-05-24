import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  CheckCircle,
  FileCheck,
  Calendar,
  ChevronRight,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Flame,
  FileSpreadsheet,
  ArrowUpRight,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Follow up on Apex Manufacturing quotation', done: false, priority: 'High' },
    { id: 2, text: 'Confirm feasibility of Fe500 H-Girders delivery specs', done: true, priority: 'Medium' },
    { id: 3, text: 'Draft quotation details for Orion Hydraulics cylinders', done: false, priority: 'High' },
    { id: 4, text: 'Log client site review notes for Titan Components Chennai', done: false, priority: 'Low' },
  ]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/analytics/dashboard');
      setStats(statsRes.data);

      const actRes = await api.get('/activities?limit=5');
      setActivities(actRes.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="space-y-2">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-64 animate-pulse" />
            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-96 animate-pulse" />
          </div>
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-32 mt-4 md:mt-0 animate-pulse" />
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-900 space-y-3">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
              <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
            </div>
          ))}
        </div>

        {/* Charts & Tasks Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 border border-zinc-200 dark:border-zinc-850 rounded-lg bg-white dark:bg-zinc-900 animate-pulse" />
          <div className="h-80 border border-zinc-200 dark:border-zinc-850 rounded-lg bg-white dark:bg-zinc-900 animate-pulse" />
        </div>
      </div>
    );
  }

  const { kpi, charts } = stats || {
    kpi: { totalLeads: 0, activeOpportunities: 0, quotationsSent: 0, pipelineValue: 0, closedDeals: 0, revenueGenerated: 0 },
    charts: { pipelineDistribution: [], monthlyRevenue: [], teamConversion: [] }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header section with Personal Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 font-sans">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            {getGreeting()}, {user?.name || 'BDA Executive'} 👋
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {user?.role === 'Admin' 
              ? 'Administrator Overview: Monitor BDA conversion flows, signed industrial contracts, and total catalog operations.' 
              : 'Here is your sales overview for today. Track fabrication inquiries, quotations sent, and check your pending follow-ups.'}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3 font-sans">
          <Button variant="outline" size="sm" onClick={fetchDashboardData} className="flex items-center space-x-2 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload Metrics</span>
          </Button>
          <Link to="/pipeline">
            <Button size="sm" className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">Open Kanban Board</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 font-sans">
        {/* Total Leads */}
        <Card className="compact-border dark:border-zinc-800 subtle-shadow bg-white dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Leads</span>
            <Layers className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold font-sans text-zinc-900 dark:text-zinc-50">{kpi.totalLeads}</div>
            <div className="flex items-center space-x-1 mt-1 text-[9px]">
              <span className="inline-flex items-center px-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
                <ArrowUpRight className="h-2.5 w-2.5 mr-0.5 shrink-0" />
                +12%
              </span>
              <span className="text-zinc-400">MoM</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Opps */}
        <Card className="compact-border dark:border-zinc-800 subtle-shadow bg-white dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Active Opps</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold font-sans text-orange-600 dark:text-orange-400">{kpi.activeOpportunities}</div>
            <div className="flex items-center space-x-1 mt-1 text-[9px]">
              <span className="inline-flex items-center px-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
                <ArrowUpRight className="h-2.5 w-2.5 mr-0.5 shrink-0" />
                +8%
              </span>
              <span className="text-zinc-400">active discussions</span>
            </div>
          </CardContent>
        </Card>

        {/* Quotes Sent */}
        <Card className="compact-border dark:border-zinc-800 subtle-shadow bg-white dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Quotes Sent</span>
            <FileCheck className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold font-sans text-zinc-900 dark:text-zinc-50">{kpi.quotationsSent}</div>
            <div className="flex items-center space-x-1 mt-1 text-[9px]">
              <span className="inline-flex items-center px-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
                <ArrowUpRight className="h-2.5 w-2.5 mr-0.5 shrink-0" />
                +15%
              </span>
              <span className="text-zinc-400">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Value */}
        <Card className="compact-border dark:border-zinc-800 subtle-shadow bg-white dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pipeline Value</span>
            <Briefcase className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg font-bold font-sans text-zinc-900 dark:text-zinc-50 truncate">{formatCurrency(kpi.pipelineValue)}</div>
            <div className="flex items-center space-x-1 mt-1 text-[9px]">
              <span className="inline-flex items-center px-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
                <ArrowUpRight className="h-2.5 w-2.5 mr-0.5 shrink-0" />
                +18.7%
              </span>
              <span className="text-zinc-400">weighted value</span>
            </div>
          </CardContent>
        </Card>

        {/* Closed Deals */}
        <Card className="compact-border dark:border-zinc-800 subtle-shadow bg-white dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Closed Deals</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold font-sans text-emerald-600 dark:text-emerald-400">{kpi.closedDeals}</div>
            <div className="flex items-center space-x-1 mt-1 text-[9px]">
              <span className="inline-flex items-center px-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
                <ArrowUpRight className="h-2.5 w-2.5 mr-0.5 shrink-0" />
                +8.3%
              </span>
              <span className="text-zinc-400">this quarter</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="compact-border dark:border-zinc-800 subtle-shadow bg-white dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg font-bold font-sans text-emerald-600 dark:text-emerald-400 truncate">{formatCurrency(kpi.revenueGenerated)}</div>
            <div className="flex items-center space-x-1 mt-1 text-[9px]">
              <span className="inline-flex items-center px-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
                <ArrowUpRight className="h-2.5 w-2.5 mr-0.5 shrink-0" />
                +20%
              </span>
              <span className="text-zinc-400">booked contract</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Chart 1: Revenue Trends */}
        <Card className="col-span-1 lg:col-span-2 compact-border dark:border-zinc-800 subtle-shadow bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <div>
              <span className="font-bold text-xs uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Monthly Booked Revenue</span>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Total value of closed won contracts over the last 6 months</p>
            </div>
            <TrendingUp className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="p-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(113, 113, 122, 0.1)" />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `₹${v/1000}k`}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'rgb(24, 24, 27)',
                    borderColor: 'rgb(39, 39, 42)',
                    color: 'rgb(250, 250, 250)',
                    fontSize: '12px',
                    borderRadius: '6px'
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#71717a" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* BDA Focus - "My Tasks" checklist */}
        <Card className="compact-border dark:border-zinc-800 subtle-shadow bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <div>
              <span className="font-bold text-xs uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">My Pending Tasks</span>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Checklist of commercial and client outreach actions</p>
            </div>
            <FileSpreadsheet className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="p-4 pt-3 text-left">
            <div className="space-y-3.5">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-start space-x-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                    task.done 
                      ? 'bg-zinc-50/50 border-zinc-100 dark:bg-zinc-950/20 dark:border-zinc-900/60 opacity-60' 
                      : 'bg-white border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700'
                  }`}
                  onClick={() => toggleTask(task.id)}
                >
                  <button className="shrink-0 mt-0.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200">
                    {task.done ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex-1 text-left">
                    <p className={`text-xs font-medium leading-tight ${task.done ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {task.text}
                    </p>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <span className={`text-[8px] font-extrabold uppercase px-1 rounded-sm ${
                        task.priority === 'High' 
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/45 dark:text-red-400' 
                          : task.priority === 'Medium' 
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/45 dark:text-amber-400'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-950/45 dark:text-blue-400'
                      }`}>
                        {task.priority} Priority
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Pipeline Stage & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Chart 2: Pipeline Stage Distribution */}
        <Card className="col-span-1 lg:col-span-2 compact-border dark:border-zinc-800 subtle-shadow bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <div>
              <span className="font-bold text-xs uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Pipeline Stage Distribution</span>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Total count of active opportunities in each stage</p>
            </div>
            <Layers className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="p-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.pipelineDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(113, 113, 122, 0.1)" />
                <XAxis 
                  dataKey="stage" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => v.split(' ').map(w => w[0]).join('')} 
                />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'count' ? 'Active Leads' : 'Value']}
                  contentStyle={{
                    backgroundColor: 'rgb(24, 24, 27)',
                    borderColor: 'rgb(39, 39, 42)',
                    color: 'rgb(250, 250, 250)',
                    fontSize: '11px',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="count" fill="#3f3f46" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workspace Activity Feed */}
        <Card className="compact-border dark:border-zinc-800 subtle-shadow bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <div>
              <span className="font-bold text-xs uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Workspace Activity Feed</span>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Chronological logging of sales and quotation updates</p>
            </div>
            <Calendar className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="space-y-4 text-left">
              {activities.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-xs">
                  No workspace activity logged recently
                </div>
              ) : (
                activities.map((act) => {
                  const actId = act._id || act.id;
                  return (
                    <div key={actId} className="relative pl-5 border-l border-zinc-200 dark:border-zinc-800 pb-0.5 last:border-0 last:pb-0">
                      <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-zinc-900 dark:bg-zinc-100 ring-4 ring-white dark:ring-zinc-900 flex items-center justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-zinc-900" />
                      </span>
                      <div className="text-left font-sans">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{act.createdBy?.name || 'System'}</span> logged a{' '}
                          <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-bold">
                            {act.type}
                          </Badge>
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{act.description}</p>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block mt-1">
                          {new Date(act.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Guide Info Box */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg flex flex-wrap gap-y-2 gap-x-6 text-xs font-sans text-zinc-600 dark:text-zinc-400">
        <span className="font-bold text-zinc-900 dark:text-zinc-200">Pipeline Stage Initials Index:</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {charts.pipelineDistribution.map((item) => (
            <div key={item.stage} className="flex items-center space-x-1">
              <span className="font-extrabold font-mono text-zinc-500 dark:text-zinc-355">
                {item.stage.split(' ').map(w => w[0]).join('')}:
              </span>
              <span>{item.stage}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
