import React, { useState, useEffect } from 'react';
import usePersistentState from '../hooks/usePersistentState';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCwIcon, LoaderIcon } from './icons';

const SyncIndicator: React.FC = () => {
    const [lastSyncTime, setLastSyncTime] = usePersistentState<string>('lastSyncTime', () => new Date().toISOString());
    const [timeAgo, setTimeAgo] = useState('just now');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const update = () => {
            setTimeAgo(formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true }));
        };
        update();
        const intervalId = setInterval(update, 10000); // Update every 10 seconds
        return () => clearInterval(intervalId);
    }, [lastSyncTime]);

    const handleManualSync = () => {
        setIsSyncing(true);
        // Simulate sync and then reload
        setTimeout(() => {
            setLastSyncTime(new Date().toISOString());
            window.location.reload();
        }, 1500);
    };

    return (
        <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors disabled:opacity-70 disabled:cursor-wait"
            aria-label={`Last synced ${timeAgo}. Click to refresh.`}
            aria-live="polite"
        >
            {isSyncing ? (
                <>
                    <LoaderIcon className="w-4 h-4" />
                    <span aria-label="Syncing now">Syncing...</span>
                </>
            ) : (
                <>
                    <RefreshCwIcon className="w-4 h-4" />
                    <span>Synced {timeAgo}</span>
                </>
            )}
        </button>
    );
};

export default SyncIndicator;