'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ScheduleSlot, Activity, GoogleCalendarEvent } from '@/lib/types';
import { getTwoWeekDates, formatDateKey } from '@/lib/date-utils';
import { saveLastSyncTime, getLastSyncTime } from '@/lib/storage';
import { Cloud, CloudOff, RefreshCw, LogOut, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoogleSyncProps {
  schedule: ScheduleSlot[];
  activities: Activity[];
  onImportEvents: (events: GoogleCalendarEvent[]) => void;
}

export function GoogleSync({ schedule, activities, onImportEvents }: GoogleSyncProps) {
  const { data: session, status } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(() => getLastSyncTime());
  const [syncResult, setSyncResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  const handleExport = async () => {
    if (!session?.accessToken) return;
    
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule,
          activities,
          action: 'export',
        }),
      });

      const data = await response.json();

      if (data.success) {
        const syncTime = new Date().toISOString();
        saveLastSyncTime(syncTime);
        setLastSync(syncTime);
        setSyncResult({
          type: 'success',
          message: `Exported ${data.created} new, ${data.updated} updated events`,
        });
      } else {
        throw new Error(data.error || 'Export failed');
      }
    } catch (error: any) {
      setSyncResult({
        type: 'error',
        message: error.message || 'Failed to export to Google Calendar',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImport = async () => {
    if (!session?.accessToken) return;
    
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const dates = getTwoWeekDates();
      const startDate = formatDateKey(dates[0]);
      const endDate = formatDateKey(dates[dates.length - 1]);

      const response = await fetch(
        `/api/calendar/sync?startDate=${startDate}&endDate=${endDate}`
      );

      const data = await response.json();

      if (data.success) {
        onImportEvents(data.events);
        const syncTime = new Date().toISOString();
        saveLastSyncTime(syncTime);
        setLastSync(syncTime);
        setSyncResult({
          type: 'success',
          message: `Imported ${data.events.length} events from Google Calendar`,
        });
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error: any) {
      setSyncResult({
        type: 'error',
        message: error.message || 'Failed to import from Google Calendar',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => signIn('google')}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-surface-2 hover:bg-surface-3 rounded-md transition-colors"
      >
        <Cloud className="w-4 h-4" />
        <span>Connect Google Calendar</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Sync Status */}
      {lastSync && (
        <div className="text-xs text-muted-foreground hidden md:block">
          Last sync: {formatLastSync(lastSync)}
        </div>
      )}

      {/* Sync Result Toast */}
      {syncResult && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs',
          syncResult.type === 'success' ? 'bg-mental/20 text-mental' : 'bg-destructive/20 text-destructive'
        )}>
          {syncResult.type === 'success' ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          <span>{syncResult.message}</span>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isSyncing}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
          'bg-primary/10 text-primary hover:bg-primary/20',
          isSyncing && 'opacity-50 cursor-not-allowed'
        )}
        title="Export schedule to Google Calendar"
      >
        <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
        <span className="hidden sm:inline">Export</span>
      </button>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={isSyncing}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
          'bg-surface-2 hover:bg-surface-3',
          isSyncing && 'opacity-50 cursor-not-allowed'
        )}
        title="Import events from Google Calendar"
      >
        <Cloud className="w-4 h-4" />
        <span className="hidden sm:inline">Import</span>
      </button>

      {/* Sign Out */}
      <button
        onClick={() => signOut()}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        title="Disconnect Google Calendar"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
