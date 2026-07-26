import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toastMessage, hideToast } = useAuth();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (!toastMessage) return null;

  const { message, type } = toastMessage;

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-[#12161B] border-[#3FB950]/50 text-[#3FB950]',
          icon: <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
        };
      case 'error':
        return {
          bg: 'bg-[#12161B] border-[#F85149]/50 text-[#F85149]',
          icon: <AlertCircle className="w-4 h-4 text-[#F85149] shrink-0" />
        };
      default:
        return {
          bg: 'bg-[#12161B] border-[#4FA8E0]/50 text-[#E6EDF3]',
          icon: <Info className="w-4 h-4 text-[#4FA8E0] shrink-0" />
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full font-mono">
      <div className={`p-3.5 rounded border backdrop-blur-md shadow-2xl flex items-center justify-between space-x-3 ${style.bg}`}>
        <div className="flex items-center space-x-2.5 text-xs">
          {style.icon}
          <span>{message}</span>
        </div>
        <button
          onClick={hideToast}
          className="p-1 text-[#7D8590] hover:text-[#E6EDF3] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
