import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  RefreshCw,
  Layers,
  ArrowRight,
  TrendingDown,
  Percent
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
  Area,
  LineChart,
  Line,
  Legend
} from 'recharts';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching analytics charts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center space-y-2">
          <RefreshCw className="h-8 w-8 text-zinc-500 animate-spin" />
          <span className="text-sm font-medium text-zinc-500">Compiling analytical workspace charts...</span>
        </div>
      </div>
    );
  }

  const { charts } = stats || {
    charts: { pipelineDistribution: [], monthlyRevenue: [], teamConversion: [] }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">Business Analytics Portal</h1>
          <p className="text-xs text-zinc-500 mt-1">Deep analysis of customer acquisition pipelines, value mappings, and team efficiency scores.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={fetchAnalytics} className="flex items-center space-x-2">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload Analytics</span>
          </Button>
        </div>
      </div>

      {/* Main Revenue Trend Chart */}
      <Card className="compact-border subtle-shadow text-left">
        <CardHeader className="p-4 border-b border-zinc-100 flex flex-row items-center justify-between">
          <div>
            <span className="font-bold text-xs uppercase text-zinc-500 tracking-wider flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Closed Won Revenue Progression</span>
            </span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Chronological summary of contract values booked monthly</p>
          </div>
        </CardHeader>
        <CardContent className="p-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.monthlyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenueLong" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#27272a" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#27272a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
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
                contentStyle={{ backgroundColor: '#fff', borderColor: '#e4e4e7', fontSize: '11px', borderRadius: '6px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#27272a" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenueLong)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Two Columns for Stage Value & Team Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Value Distribution Bar Chart */}
        <Card className="compact-border subtle-shadow text-left">
          <CardHeader className="p-4 border-b border-zinc-100">
            <span className="font-bold text-xs uppercase text-zinc-500 tracking-wider flex items-center space-x-2">
              <Layers className="h-4 w-4 text-zinc-400" />
              <span>Pipeline Stage Financial Breakdown</span>
            </span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Sum of estimated contract values mapping to stages</p>
          </CardHeader>
          <CardContent className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.pipelineDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="stage" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => v.split(' ').map(w => w[0]).join('')}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `₹${v/1000}k`}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Estimated Value']}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e4e4e7', fontSize: '11px', borderRadius: '6px' }}
                />
                <Bar dataKey="value" fill="#27272a" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Conversion Rate Chart */}
        <Card className="compact-border subtle-shadow text-left">
          <CardHeader className="p-4 border-b border-zinc-100">
            <span className="font-bold text-xs uppercase text-zinc-500 tracking-wider flex items-center space-x-2">
              <Percent className="h-4 w-4 text-zinc-400" />
              <span>Team Win Rates Comparison</span>
            </span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Conversion rate percentage (Closed Won / Total Leads) per BDA</p>
          </CardHeader>
          <CardContent className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={charts.teamConversion} 
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Win Rate']}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e4e4e7', fontSize: '11px', borderRadius: '6px' }}
                />
                <Bar dataKey="conversionRate" fill="#3f3f46" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
