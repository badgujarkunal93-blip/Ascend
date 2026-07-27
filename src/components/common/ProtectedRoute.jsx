import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, loading, showToast } = useAuth();

  const isAnyAdmin = profile?.role === 'superadmin' || profile?.role === 'institution_admin' || profile?.role === 'admin';

  useEffect(() => {
    if (!loading && user && requireAdmin && !isAnyAdmin) {
      showToast('Access Restricted: Admin privileges required.', 'error');
    }
  }, [loading, user, requireAdmin, isAnyAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0E11] font-mono">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-[#3FB950] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#7D8590] text-xs">// LOADING_SESSION...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAnyAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
