import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ALLOWED_EMAIL_DOMAIN } from '../lib/constants';
import { Terminal, Lock, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle2, UserCheck, ShieldCheck } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, loginDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await signup({ email, password, fullName });
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = (role) => {
    loginDemoUser(role);
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 py-12 font-mono">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded bg-[#161B22] border border-[#21262D] flex items-center justify-center mx-auto text-[#3FB950]">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#E6EDF3] tracking-tight">
            ASCEND://auth
          </h1>
          <p className="text-xs text-[#7D8590] font-sans">
            Competitive programming judge & daily practice portal
          </p>
        </div>

        {/* Domain restriction banner */}
        <div className="judge-card p-3.5 border-l-4 border-l-[#3FB950] flex items-start space-x-2.5 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0 mt-0.5" />
          <div className="text-[#E6EDF3]">
            <span className="text-[#3FB950] font-bold">// DOMAIN_POLICY:</span> Required domain <code className="text-[#3FB950]">{ALLOWED_EMAIL_DOMAIN}</code>.
          </div>
        </div>

        {/* Main Auth Card */}
        <div className="judge-card p-8 space-y-6 shadow-2xl">
          
          {/* Tab Selector */}
          <div className="flex bg-[#0B0E11] p-1 rounded border border-[#21262D] text-xs font-mono">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-1.5 font-bold transition-all ${
                isLogin 
                  ? 'bg-[#3FB950] text-[#0B0E11] rounded-[2px]' 
                  : 'text-[#7D8590] hover:text-[#E6EDF3]'
              }`}
            >
              [SIGN_IN]
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-1.5 font-bold transition-all ${
                !isLogin 
                  ? 'bg-[#3FB950] text-[#0B0E11] rounded-[2px]' 
                  : 'text-[#7D8590] hover:text-[#E6EDF3]'
              }`}
            >
              [REGISTER]
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded bg-[#F85149]/10 border border-[#F85149]/40 text-[#F85149] text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-[#F85149] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[#7D8590]">full_name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-[#7D8590]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-[#0B0E11] border border-[#21262D] rounded pl-9 pr-3 py-2 text-[#E6EDF3] placeholder-[#7D8590] focus:outline-none focus:border-[#3FB950]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[#7D8590]">email_address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-[#7D8590]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`student${ALLOWED_EMAIL_DOMAIN}`}
                  className="w-full bg-[#0B0E11] border border-[#21262D] rounded pl-9 pr-3 py-2 text-[#E6EDF3] placeholder-[#7D8590] focus:outline-none focus:border-[#3FB950]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[#7D8590]">password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-[#7D8590]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0B0E11] border border-[#21262D] rounded pl-9 pr-3 py-2 text-[#E6EDF3] placeholder-[#7D8590] focus:outline-none focus:border-[#3FB950]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#7D8590] hover:text-[#E6EDF3]"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-[#3FB950] text-[#0B0E11] font-bold text-xs hover:bg-[#3FB950]/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#0B0E11] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{isLogin ? '[EXECUTE_LOGIN]' : '[EXECUTE_REGISTER]'}</span>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
