'use client';

import React, { useState } from 'react';
import { useVaultStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Download, CheckCircle2, ArrowLeft, Cloud } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { cards } = useVaultStore();
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(cards, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `use-it-later-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setStatus({ type: 'success', message: `Exported ${cards.length} cards successfully.` });
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <main className="flex-1 p-6 lg:p-12 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
      </div>
      <p className="text-slate-500 mb-8 pl-11">Manage your data and vault preferences.</p>

      <div className="bg-white rounded-[var(--radius-xl)] p-6 border border-slate-100 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-500" />
            Cloud Sync Active
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Your data is now securely synced to Supabase Cloud. You can still export a local backup for your peace of mind.
          </p>
        </div>

        {status && (
          <div className={`p-3 rounded-md text-sm flex items-center gap-2 bg-green-50 text-green-600`}>
            <CheckCircle2 className="w-4 h-4" />
            {status.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="primary" onClick={handleExport} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export Backup (.json)
          </Button>
        </div>
      </div>
    </main>
  );
}
