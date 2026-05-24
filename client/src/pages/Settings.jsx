import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  ShieldAlert,
  Users,
  Terminal,
  CheckCircle,
  RefreshCw,
  Sliders
} from 'lucide-react';

const Settings = () => {
  const { user, login, logout } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSimulateRole = async (email, password) => {
    setSwitching(true);
    setMsg('');
    try {
      await login(email, password);
      setMsg(`Successfully simulated session as ${email}`);
    } catch (error) {
      console.error(error);
      setMsg('Simulation failed to authenticate');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">Workspace Settings & DevTools</h1>
          <p className="text-xs text-zinc-500 mt-1">Configure profile details and simulate role accounts to verify security middleware rules.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card className="compact-border subtle-shadow text-left">
          <CardHeader className="p-4 border-b border-zinc-100 flex flex-row items-center justify-between">
            <div>
              <span className="font-bold text-xs uppercase text-zinc-500 tracking-wider">Active Workspace Profile</span>
              <p className="text-[10px] text-zinc-400">Current authenticated corporate user context</p>
            </div>
            <User className="h-4.5 w-4.5 text-zinc-400" />
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold text-base">
                {user?.name?.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <span className="font-bold text-base text-zinc-900 block">{user?.name}</span>
                <span className="text-xs text-zinc-500 block">{user?.email}</span>
              </div>
            </div>

            <div className="h-px bg-zinc-150" />

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500 font-medium">Access Authorization Role:</span>
                <Badge variant={user?.role === 'Admin' ? 'default' : 'secondary'} className="font-bold">
                  {user?.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500 font-medium">Security Scope:</span>
                <span className="text-zinc-700 font-semibold">
                  {user?.role === 'Admin' 
                    ? 'Global Read / Write / User Allocation' 
                    : 'Assigned Leads Read / Write / Quote Proposals'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500 font-medium">Workspace Status:</span>
                <span className="text-emerald-600 font-bold flex items-center space-x-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Synchronized</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Simulator Tool */}
        <Card className="compact-border subtle-shadow text-left">
          <CardHeader className="p-4 border-b border-zinc-100 flex flex-row items-center justify-between">
            <div>
              <span className="font-bold text-xs uppercase text-zinc-500 tracking-wider flex items-center space-x-1.5">
                <Sliders className="h-4 w-4 text-zinc-400" />
                <span>BDA & Admin Role Simulator</span>
              </span>
              <p className="text-[10px] text-zinc-400">Instantly swap credentials without leaving the dashboard</p>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-md text-xs">
              <p className="text-zinc-600 leading-normal mb-2 flex items-center space-x-1.5">
                <ShieldAlert className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                <span>Use these shortcuts to verify Kanban filtering and leaderboard statistics dynamically:</span>
              </p>
              
              {msg && (
                <div className="bg-emerald-50 border border-emerald-150 text-emerald-700 p-2.5 rounded mb-3 text-[11px] font-semibold flex items-center space-x-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>{msg}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white border border-zinc-150 rounded hover:border-zinc-300 transition-colors">
                  <div>
                    <span className="font-bold text-zinc-800 block text-[11px]">Admin User</span>
                    <span className="text-[10px] text-zinc-500">Corporate Admin</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={switching}
                    onClick={() => handleSimulateRole('admin@manudesk.com', 'admin123')}
                    className="text-xs h-7 px-2.5"
                  >
                    {switching ? 'Swapping...' : 'Simulate Admin'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-2 bg-white border border-zinc-150 rounded hover:border-zinc-300 transition-colors">
                  <div>
                    <span className="font-bold text-zinc-800 block text-[11px]">User 1</span>
                    <span className="text-[10px] text-zinc-500">BDA Executive</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={switching}
                    onClick={() => handleSimulateRole('bda1@manudesk.com', 'bda123')}
                    className="text-xs h-7 px-2.5"
                  >
                    {switching ? 'Swapping...' : 'Simulate User 1'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-2 bg-white border border-zinc-150 rounded hover:border-zinc-300 transition-colors">
                  <div>
                    <span className="font-bold text-zinc-800 block text-[11px]">User 2</span>
                    <span className="text-[10px] text-zinc-500">BDA Executive</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={switching}
                    onClick={() => handleSimulateRole('bda2@manudesk.com', 'bda123')}
                    className="text-xs h-7 px-2.5"
                  >
                    {switching ? 'Swapping...' : 'Simulate User 2'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
