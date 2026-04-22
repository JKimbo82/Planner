'use client';

import { useState, useRef, useCallback } from 'react';
import { useSchedule } from '@/hooks/use-schedule';
import { ScheduleGrid } from '@/components/schedule/schedule-grid';
import { ActivityManager } from '@/components/activities/activity-manager';
import { ReminderBanner, useWeeklyReminder } from '@/components/ui/reminder-banner';
import { GoogleSync } from '@/components/calendar/google-sync';
import { GoogleCalendarEvent } from '@/lib/types';
import { Calendar, Dumbbell, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportData, importData } from '@/lib/storage';

type Tab = 'schedule' | 'activities';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [importedEvents, setImportedEvents] = useState<GoogleCalendarEvent[]>([]);
  const scheduleGridRef = useRef<{ navigateToNextWeek: () => void } | null>(null);
  
  // Enable browser notifications on Thursday/Friday
  useWeeklyReminder();
  
  const handleNavigateToNextWeek = useCallback(() => {
    setActiveTab('schedule');
    // Small delay to ensure schedule tab is rendered
    setTimeout(() => {
      scheduleGridRef.current?.navigateToNextWeek();
    }, 100);
  }, []);
  
  const {
    activities,
    schedule,
    isLoaded,
    addActivity,
    updateActivity,
    deleteActivity,
    toggleSlotActivity,
    clearSlot,
    copyWeekToWeek,
  } = useSchedule();

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          importData(data);
          window.location.reload();
        } catch (error) {
          alert('Invalid backup file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Reminder Banner */}
      <ReminderBanner onNavigateToNextWeek={handleNavigateToNextWeek} />
      
      {/* Header */}
      <header className="border-b border-border bg-surface-1">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Training Schedule</h1>
              <p className="text-xs text-muted-foreground">2-Week Planner</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('schedule')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === 'schedule' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === 'activities' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Dumbbell className="w-4 h-4" />
              Activities
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Google Calendar Sync */}
            <GoogleSync
              schedule={schedule}
              activities={activities}
              onImportEvents={setImportedEvents}
            />
            
            <div className="w-px h-6 bg-border" />
            
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-md transition-colors"
              title="Export backup"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-md transition-colors"
              title="Import backup"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'schedule' && (
          <ScheduleGrid
            ref={scheduleGridRef}
            schedule={schedule}
            activities={activities}
            onToggleActivity={toggleSlotActivity}
            onClearSlot={clearSlot}
            onCopyWeek={copyWeekToWeek}
          />
        )}
        
        {activeTab === 'activities' && (
          <ActivityManager
            activities={activities}
            onAdd={addActivity}
            onUpdate={updateActivity}
            onDelete={deleteActivity}
          />
        )}
      </main>
    </div>
  );
}
