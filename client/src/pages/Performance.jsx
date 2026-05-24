import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Trophy,
  Target,
  DollarSign,
  TrendingUp,
  Award,
  Zap,
  RefreshCw,
  BarChart2,
  Users
} from 'lucide-react';

const Performance = () => {
  const { user, isAdmin } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/leaderboard');
      setLeaderboard(res.data);
    } catch (error) {
      console.error('Failed to load performance metrics', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Find user rank
  const userRankIndex = leaderboard.findIndex(item => item._id === user?._id);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : null;
  const userStats = userRankIndex !== -1 ? leaderboard[userRankIndex] : null;

  // Calculate top performers
  const topPerformer = leaderboard[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center space-y-2">
          <RefreshCw className="h-8 w-8 text-zinc-500 animate-spin" />
          <span className="text-sm font-medium text-zinc-500">Compiling performance leaderboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">BDA Performance & Leaderboard</h1>
          <p className="text-xs text-zinc-500 mt-1">Track executive win rates, conversion rates, and closed booked revenue contributions.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={fetchPerformanceData} className="flex items-center space-x-2">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Stats</span>
          </Button>
        </div>
      </div>

      {/* Top Cards for Personal Ranking & Overall Top Performer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Rank card */}
        {userRank && (
          <Card className="border-t-4 border-t-zinc-900 subtle-shadow text-left">
            <CardHeader className="p-4 pb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Your Standing</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-extrabold font-sans text-zinc-900">#{userRank}</span>
                  <span className="text-xs text-zinc-500 block mt-1">Rank in BDA Team</span>
                </div>
                <div className="bg-zinc-100 p-2 rounded-md">
                  <Trophy className="h-6 w-6 text-zinc-800" />
                </div>
              </div>
              <div className="mt-4 h-px bg-zinc-150" />
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div>
                  <span className="text-[9px] text-zinc-400 block font-bold uppercase">Conversion</span>
                  <span className="font-semibold text-zinc-700">{userStats?.conversionRate}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block font-bold uppercase">Booked Vol.</span>
                  <span className="font-semibold text-zinc-700">{formatCurrency(userStats?.revenueGenerated)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Performer Card */}
        {topPerformer && (
          <Card className="border-t-4 border-t-emerald-500 subtle-shadow text-left">
            <CardHeader className="p-4 pb-2">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center space-x-1.5">
                <Award className="h-3.5 w-3.5" />
                <span>Top Performer</span>
              </span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold font-sans text-zinc-900">{topPerformer.name}</span>
                  <span className="text-xs text-zinc-500 block mt-1">Leading Revenue Generation</span>
                </div>
                <div className="bg-emerald-50 p-2 rounded-md">
                  <Trophy className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4 h-px bg-zinc-150" />
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div>
                  <span className="text-[9px] text-zinc-400 block font-bold uppercase">Revenue Booked</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(topPerformer.revenueGenerated)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block font-bold uppercase">Wins</span>
                  <span className="font-semibold text-zinc-700">{topPerformer.closedDeals} Deals</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aggregate Target Card */}
        <Card className="border-t-4 border-t-blue-500 subtle-shadow text-left">
          <CardHeader className="p-4 pb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Team Performance Index</span>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-bold font-sans text-zinc-900">
                  {leaderboard.length > 0 ? (
                    (leaderboard.reduce((sum, item) => sum + item.conversionRate, 0) / leaderboard.length).toFixed(1)
                  ) : 0}%
                </span>
                <span className="text-xs text-zinc-500 block mt-1">Average Win Rate</span>
              </div>
              <div className="bg-blue-50 p-2 rounded-md">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 h-px bg-zinc-150" />
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div>
                <span className="text-[9px] text-zinc-400 block font-bold uppercase">Total Booked</span>
                <span className="font-semibold text-zinc-700">
                  {formatCurrency(leaderboard.reduce((sum, item) => sum + item.revenueGenerated, 0))}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-400 block font-bold uppercase">Quotes Output</span>
                <span className="font-semibold text-zinc-700">
                  {leaderboard.reduce((sum, item) => sum + item.quotationsCreated, 0)} Quotes
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table Card */}
      <Card className="compact-border subtle-shadow text-left">
        <CardHeader className="p-4 border-b border-zinc-100 flex flex-row items-center justify-between">
          <div>
            <span className="font-bold text-xs uppercase text-zinc-500 tracking-wider">BDA Leaderboard Table</span>
            <p className="text-[10px] text-zinc-400 mt-0.5">Ranked in order of total booked revenue generated</p>
          </div>
          <Zap className="h-4 w-4 text-zinc-400" />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] text-center">Rank</TableHead>
                <TableHead>BDA Executive Name</TableHead>
                <TableHead>Total Leads</TableHead>
                <TableHead>Quotes Created</TableHead>
                <TableHead>Closed Deals</TableHead>
                <TableHead>Revenue Booked</TableHead>
                <TableHead className="text-right">Conversion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((bda, index) => {
                const isCurrentUser = bda._id === user?._id;
                return (
                  <TableRow
                    key={bda._id}
                    className={`hover:bg-zinc-50/70 ${isCurrentUser ? 'bg-zinc-50/90 font-medium border-l-4 border-l-zinc-900' : ''}`}
                  >
                    <TableCell className="text-center font-bold text-zinc-500 text-xs">
                      #{index + 1}
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-950 flex items-center space-x-2">
                      <div className="h-7 w-7 rounded bg-zinc-100 text-zinc-800 text-[10px] font-bold uppercase flex items-center justify-center shrink-0">
                        {bda.name.substring(0, 2)}
                      </div>
                      <div>
                        <span>{bda.name}</span>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="ml-2 text-[9px] px-1 py-0 font-bold uppercase">You</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{bda.totalLeads}</TableCell>
                    <TableCell className="text-xs">{bda.quotationsCreated}</TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-600">
                      {bda.closedDeals} Won
                    </TableCell>
                    <TableCell className="font-bold font-sans text-zinc-800">
                      {formatCurrency(bda.revenueGenerated)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-xs">
                      <div className="flex items-center justify-end space-x-2">
                        <span>{bda.conversionRate}%</span>
                        <div className="w-16 bg-zinc-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-zinc-800 h-full"
                            style={{ width: `${Math.min(bda.conversionRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Performance;
