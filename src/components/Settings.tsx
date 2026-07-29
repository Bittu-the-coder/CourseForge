import React from 'react';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  Database
} from 'lucide-react';
import type { UserSettings, Course } from '../types';

interface SettingsProps {
  settings: UserSettings;
  courses: Course[];
  onUpdateSettings: (settings: UserSettings) => void;
  onImportBackup: (jsonString: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  courses,
  onUpdateSettings,
  onImportBackup,
}) => {
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(
      {
        courses,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courseforge_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onImportBackup(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="border-b border-hairline pb-4 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-semibold uppercase font-mono">
          <SettingsIcon className="w-3.5 h-3.5" /> Preferences & Storage
        </div>
        <h1 className="text-2xl md:text-3xl font-normal text-ink">
          App Settings & Data Backup
        </h1>
        <p className="text-xs text-ink-muted">
          Manage your theme, video playback speed defaults, and export/import your offline data.
        </p>
      </div>

      {/* Preferences Section */}
      <div className="card-hairline p-6 space-y-6">
        <h2 className="text-xs font-semibold uppercase font-mono tracking-wider text-ink border-b border-hairline pb-2">
          1. Interface & Playback Settings
        </h2>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-ink">Dark Theme</h4>
              <p className="text-ink-muted">Switch between editorial cream canvas and dark editor mode.</p>
            </div>
            <button
              onClick={() => onUpdateSettings({ ...settings, darkMode: !settings.darkMode })}
              className="p-2 rounded-md bg-canvas-soft border border-hairline hover:border-brand-orange text-ink transition-colors"
            >
              {settings.darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-hairline pt-3">
            <div>
              <h4 className="font-semibold text-ink">Auto-Advance Next Lesson</h4>
              <p className="text-ink-muted">Automatically play next video chapter upon completion.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoAdvanceNextVideo}
              onChange={(e) => onUpdateSettings({ ...settings, autoAdvanceNextVideo: e.target.checked })}
              className="w-4 h-4 accent-brand-orange"
            />
          </div>
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="card-hairline p-6 space-y-6">
        <h2 className="text-xs font-semibold uppercase font-mono tracking-wider text-ink border-b border-hairline pb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-orange" /> 2. Local Backup & Restore (Offline First)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-canvas-soft border border-hairline space-y-3">
            <h4 className="font-semibold text-ink flex items-center gap-1.5">
              <Download className="w-4 h-4 text-brand-orange" /> Export Data Backup (JSON)
            </h4>
            <p className="text-ink-muted">
              Download your complete courses, chapters, timestamp notes, and bookmarks as a JSON backup file.
            </p>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 rounded-md bg-brand-orange text-white font-semibold hover:bg-brand-orange-active transition-colors"
            >
              Export Complete Backup
            </button>
          </div>

          <div className="p-4 rounded-lg bg-canvas-soft border border-hairline space-y-3">
            <h4 className="font-semibold text-ink flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-600" /> Restore Backup File
            </h4>
            <p className="text-ink-muted">
              Restore previously saved courses and notes from a JSON backup file.
            </p>
            <label className="inline-block px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 cursor-pointer transition-colors">
              Upload JSON File
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

    </div>
  );
};
