import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Terminal, Calendar, ShieldCheck, LogOut, Code2 } from 'lucide-react';
import { ALLOWED_EMAIL_DOMAIN } from '../../lib/constants';
import Heatmap from './Heatmap';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#21262D] bg-[#0B0E11]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Brand logo & tagline - Ascend Monospace */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2 group">
            <Terminal className="w-5 h-5 text-[#3FB950]" />
            <span className="font-mono text-sm font-bold tracking-tight text-[#E6EDF3] group-hover:text-[#3FB950] transition-colors">
              ASCEND://
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-[#7D8590] border border-[#21262D] px-1.5 py-0.5 rounded-sm">
              {ALLOWED_EMAIL_DOMAIN.replace('@', '')}
            </span>
          </Link>

          {/* IDE-style Navigation Tabs */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#21262D]">
              <Link
                to="/"
                className={`px-3 py-1 text-xs font-mono transition-colors flex items-center space-x-1.5 border-b-2 ${
                  isActive('/') 
                    ? 'border-[#3FB950] text-[#E6EDF3] font-bold bg-[#12161B]' 
                    : 'border-transparent text-[#7D8590] hover:text-[#E6EDF3] hover:bg-[#12161B]/50'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Today's Batch</span>
              </Link>
              
              <Link
                to="/archive"
                className={`px-3 py-1 text-xs font-mono transition-colors flex items-center space-x-1.5 border-b-2 ${
                  isActive('/archive') 
                    ? 'border-[#3FB950] text-[#E6EDF3] font-bold bg-[#12161B]' 
                    : 'border-transparent text-[#7D8590] hover:text-[#E6EDF3] hover:bg-[#12161B]/50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Archive</span>
              </Link>

              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-1 text-xs font-mono transition-colors flex items-center space-x-1.5 border-b-2 ${
                    isActive('/admin') 
                      ? 'border-[#C87DE8] text-[#C87DE8] font-bold bg-[#12161B]' 
                      : 'border-transparent text-[#7D8590] hover:text-[#C87DE8] hover:bg-[#12161B]/50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Right Actions & Heatmap */}
        <div className="flex items-center space-x-4">
          
          {user ? (
            <>
              {/* Contribution Activity Heatmap */}
              <Heatmap />

              {/* User Profile Info */}
              <div className="flex items-center space-x-3 pl-3 border-l border-[#21262D]">
                <div className="hidden sm:flex flex-col text-right font-mono">
                  <span className="text-xs text-[#E6EDF3] truncate max-w-[140px]">
                    {profile?.full_name || user.email}
                  </span>
                  <span className={`text-[10px] uppercase ${profile?.role === 'admin' ? 'text-[#C87DE8]' : 'text-[#7D8590]'}`}>
                    [{profile?.role || 'student'}]
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 rounded text-[#7D8590] hover:text-[#F85149] hover:bg-[#12161B] border border-transparent hover:border-[#21262D] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-3 py-1 text-xs font-mono font-bold rounded bg-[#3FB950] text-[#0B0E11] hover:bg-[#3FB950]/90 transition-colors"
            >
              [SIGN_IN]
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}
