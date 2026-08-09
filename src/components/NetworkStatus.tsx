import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white text-xs py-2 px-4 flex items-center justify-between shadow-md z-50 sticky top-0">
      <div className="flex items-center gap-2 font-medium">
        <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
        <span>Internet connection is required to use this feature and sync study data online.</span>
      </div>
      <button 
        onClick={() => setIsOnline(navigator.onLine)}
        className="bg-amber-700 hover:bg-amber-800 px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 shrink-0"
      >
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  );
};
