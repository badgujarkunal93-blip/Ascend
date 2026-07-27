import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Terminal, Lock, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle2, 
  Building2, Search, ArrowRight, ArrowLeft, Check, Sparkles 
} from 'lucide-react';

export default function AuthPage() {
  const { user, login, signup, institutionsList } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [step, setStep] = useState(1); // 1: Select Institute, 2: Auth Form
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Handle URL query parameter ?institution=<id>
  useEffect(() => {
    const instParam = searchParams.get('institution');
    if (instParam && institutionsList.length > 0) {
      const match = institutionsList.find(i => i.id === instParam || i.email_domain.includes(instParam));
      if (match) {
        setSelectedInstitution(match);
        setStep(2);
      }
    } else if (institutionsList.length > 0 && !selectedInstitution) {
      setSelectedInstitution(institutionsList[0]);
    }
  }, [searchParams, institutionsList]);

  const handleSelectInstitution = (inst) => {
    setSelectedInstitution(inst);
    setSearchParams({ institution: inst.id });
    setStep(2);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await signup({ 
          email, 
          password, 
          fullName, 
          institutionId: selectedInstitution?.id 
        });
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const filteredInstitutions = institutionsList.filter(inst =>
    inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.email_domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Competitive programming judge & multi-institution batch portal
          </p>
        </div>

        {/* STEP 1: SELECT INSTITUTION */}
        {step === 1 && (
          <div className="judge-card p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#21262D] pb-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#E6EDF3]">
                <Building2 className="w-4 h-4 text-[#3FB950]" />
                <span>// STEP_1: SELECT_YOUR_COLLEGE</span>
              </div>
              <span className="text-[10px] text-[#7D8590]">({institutionsList.length} onboarded)</span>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#7D8590]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search college name or domain..."
                className="w-full bg-[#0B0E11] border border-[#21262D] rounded pl-9 pr-3 py-2 text-xs text-[#E6EDF3] placeholder-[#7D8590] focus:outline-none focus:border-[#3FB950]"
              />
            </div>

            {/* Institutions List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredInstitutions.length > 0 ? (
                filteredInstitutions.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => handleSelectInstitution(inst)}
                    className="w-full p-3 rounded bg-[#0B0E11] hover:bg-[#161B22] border border-[#21262D] hover:border-[#3FB950]/50 transition-all flex items-center justify-between text-left group"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#E6EDF3] group-hover:text-[#3FB950] transition-colors">
                        {inst.name}
                      </div>
                      <div className="text-[10px] text-[#7D8590]">
                        Domain requirement: <span className="text-[#3FB950]">@{inst.email_domain.replace(/^@/, '')}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#7D8590] group-hover:text-[#3FB950] shrink-0 ml-2" />
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#7D8590] border border-dashed border-[#21262D] rounded">
                  No institution found matching "{searchQuery}".
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: AUTH FORM FOR SELECTED INSTITUTION */}
        {step === 2 && selectedInstitution && (
          <div className="judge-card p-8 space-y-6 shadow-2xl">
            
            {/* Selected Institution Banner & Back Button */}
            <div className="flex items-center justify-between bg-[#0B0E11] p-3 rounded border border-[#21262D] text-xs">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-[#3FB950] shrink-0" />
                <div>
                  <div className="text-[#E6EDF3] font-bold truncate max-w-[200px]">
                    {selectedInstitution.name}
                  </div>
                  <div className="text-[10px] text-[#7D8590]">
                    Required: <span className="text-[#3FB950]">@{selectedInstitution.email_domain.replace(/^@/, '')}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] text-[#7D8590] hover:text-[#E6EDF3] flex items-center space-x-1 border border-[#21262D] px-2 py-1 rounded hover:bg-[#161B22] transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>[change]</span>
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex bg-[#0B0E11] p-1 rounded border border-[#21262D] text-xs">
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

            {/* Auth Form */}
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
                    placeholder={`student@${selectedInstitution.email_domain.replace(/^@/, '')}`}
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
        )}

      </div>
    </div>
  );
}
