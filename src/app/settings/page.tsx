'use client';

import React, { useRef, useState } from 'react';
import { useVaultStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Download, Upload, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { KnowledgeCard } from '@/lib/types';
import Link from 'next/link';

export default function SettingsPage() {
  const { cards, importCards } = useVaultStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        
        // Basic validation
        if (!Array.isArray(importedData)) {
          throw new Error('Invalid backup file format. Expected an array.');
        }

        if (importedData.length > 0 && !('id' in importedData[0]) && !('title' in importedData[0])) {
           throw new Error('Invalid card structure in backup file.');
        }

        // We can do more deep validation, but this suffices for MVP
        importCards(importedData as KnowledgeCard[]);
        setStatus({ type: 'success', message: `Imported ${importedData.length} cards successfully.` });
      } catch (error) {
        setStatus({ type: 'error', message: (error as Error).message || 'Failed to parse JSON backup.' });
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
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
            <Download className="w-5 h-5 text-slate-400" />
            Data Portability
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Since your data is stored locally in your browser (100% private), 
            we highly recommend exporting a backup regularly.
          </p>
        </div>

        {status && (
          <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {status.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {status.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="primary" onClick={handleExport} className="w-full sm:w-auto">
            Export Backup (.json)
          </Button>
          
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
            <Upload className="w-4 h-4 mr-2" />
            Import Backup
          </Button>
        </div>
      </div>
    </main>
  );
}
