import React from 'react';
import { useOfflineStatus } from '../../lib/hooks/useOfflineStatus';
import { WifiOff, Database, RefreshCw } from 'lucide-react';
import { syncAllData } from '../../lib/storage';

export const OfflineIndicator: React.FC = () => {
  const { isOffline, lastOnline } = useOfflineStatus();
  const [syncing, setSyncing] = React.useState(false);

  const handleSync = async () => {
    if (isOffline) return;
    
    setSyncing(true);
    try {
      await syncAllData();
      setTimeout(() => setSyncing(false), 1000);
    } catch (error) {
      console.error('Error syncing data:', error);
      setSyncing(false);
    }
  };

  if (!isOffline && !syncing) return null;

  return (
    <div className={`fixed bottom-4 right-4 ${isOffline ? 'bg-warning-500' : 'bg-primary-500'} text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center`}>
      {isOffline ? (
        <>
          <WifiOff className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">You're offline</p>
            <p className="text-xs">
              {lastOnline
                ? `Last connected: ${lastOnline.toLocaleTimeString()}`
                : 'Changes will sync when you reconnect'}
            </p>
            <div className="flex items-center text-xs mt-1">
              <Database className="h-3 w-3 mr-1" />
              <span>Using local storage</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <RefreshCw className={`h-5 w-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          <div>
            <p className="font-medium">Syncing data...</p>
            <button 
              onClick={handleSync}
              className="text-xs underline mt-1"
              disabled={syncing}
            >
              {syncing ? 'Please wait...' : 'Sync again'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};