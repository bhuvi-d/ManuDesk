import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { GitBranch, ShieldAlert } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all fields');
    }
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setError('');
    setSubmitting(true);
    try {
      await login(demoEmail, demoPassword);
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-zinc-950 p-2.5 rounded-lg text-white mb-2 shadow-sm">
            <GitBranch className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight font-sans">MANUDESK</h1>
          <p className="text-xs text-zinc-400 font-medium">Manufacturing Workspace & Pipeline</p>
        </div>

        <Card className="border border-zinc-200 shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center text-xs">
              Enter your credentials to access the workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-150 text-red-700 text-xs p-3 rounded-md flex items-start space-x-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600" htmlFor="email">
                  Work Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-zinc-600" htmlFor="password">
                    Password
                  </label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={submitting}>
                {submitting ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-zinc-200"></div>
              <span className="flex-shrink mx-4 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Demo Accounts
              </span>
              <div className="flex-grow border-t border-zinc-200"></div>
            </div>

            {/* Quick Demo Logins */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('admin@manudesk.com', 'admin123')}
                disabled={submitting}
                className="text-xs py-3 h-auto flex flex-col items-center font-medium bg-zinc-50 border-zinc-200"
              >
                <span className="font-bold text-zinc-800">Admin User</span>
                <span className="text-[10px] text-zinc-500">Admin Account</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('bda1@manudesk.com', 'bda123')}
                disabled={submitting}
                className="text-xs py-3 h-auto flex flex-col items-center font-medium bg-zinc-50 border-zinc-200"
              >
                <span className="font-bold text-zinc-800">User 1</span>
                <span className="text-[10px] text-zinc-500">BDA Executive</span>
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-100 py-3 bg-zinc-50 rounded-b-lg">
            <span className="text-[10px] text-zinc-400 font-medium text-center">
              Internal Enterprise Workspace. Authorized Access Only.
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
