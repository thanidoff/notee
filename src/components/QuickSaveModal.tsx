'use client';

import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/lib/uiStore';
import { useVaultStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { KnowledgeCard } from '@/lib/types';
import { X, Loader2 } from 'lucide-react';

export function QuickSaveModal() {
  const { isQuickSaveOpen, clipboardData, pasteTrigger, closeQuickSave } = useUIStore();
  const addCard = useVaultStore((state) => state.addCard);
  const updateCard = useVaultStore((state) => state.updateCard);
  const cards = useVaultStore((state) => state.cards);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isQuickSaveOpen && clipboardData?.text) {
      setContent((prev) => {
        if (!prev) return clipboardData.text || '';
        if (prev === clipboardData.text) return prev;
        return `${prev}\n${clipboardData.text}`;
      });
    }
  }, [pasteTrigger, isQuickSaveOpen, clipboardData]);

  useEffect(() => {
    if (!isQuickSaveOpen) {
      setContent('');
      setIsSubmitting(false);
    }
  }, [isQuickSaveOpen]);

  const handleSave = async () => {
    const images = clipboardData?.images;
    if (!content && (!images || images.length === 0)) return;
    
    setIsSubmitting(true);
    
    const newId = uuidv4();
    const isUrl = content.startsWith('http');
    const type = isUrl ? 'link' : 'note';

    // Upload images to Supabase Storage first
    let uploadedImageUrls: string[] | undefined = undefined;
    if (images && images.length > 0) {
      uploadedImageUrls = [];
      for (const base64 of images) {
        try {
          const res = await fetch(base64);
          const blob = await res.blob();
          const fileName = `${Date.now()}-${uuidv4()}.png`;
          
          const { error } = await supabase.storage.from('images').upload(fileName, blob, {
            contentType: blob.type || 'image/png',
          });
          
          if (!error) {
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
            uploadedImageUrls.push(urlData.publicUrl);
          }
        } catch (err) {
          console.error('Image upload failed', err);
        }
      }
    }

    // 1. Optimistic Save
    const optimisticCard: KnowledgeCard = {
      id: newId,
      title: '✨ AI กำลังสรุปข้อมูล...',
      type: type,
      raw_content: content,
      source_url: isUrl ? content : undefined,
      image_urls: uploadedImageUrls && uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
      summary: 'Please wait while AI analyzes the content...',
      use_this_when: ['Processing...'],
      status: 'saved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      use_count: 0
    };

    addCard(optimisticCard);
    closeQuickSave(); // Close immediately for smooth UX
    setContent('');
    setIsSubmitting(false);

    // Compute existing categories to suggest to AI
    const existingCategories = Array.from(
      new Set(cards.flatMap((card) => card.use_this_when))
    );

    // 2. Call AI API
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, images: uploadedImageUrls, existingCategories, type })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'API Error');
      }

      const data = await response.json();
      
      updateCard(newId, {
        title: data.title || 'Untitled',
        summary: data.summary || 'No summary available.',
        use_this_when: data.use_this_when || ['Uncategorized'],
        tags: data.tags || [],
      });

    } catch (error: any) {
      console.error(error);
      const isRateLimit = error.message?.includes('429') || error.message?.includes('exhausted');
      updateCard(newId, {
        title: isUrl ? 'New Link' : 'New Note',
        summary: isRateLimit 
          ? 'โควตาฟรีเต็มชั่วคราว (คุณกดรัวเกินไป) กรุณารอ 1 นาทีแล้วลองใหม่นะครับ ⏳' 
          : `AI Error: ${error.message || 'Unknown error'}`,
        use_this_when: isRateLimit ? ['Rate Limited'] : ['Failed'],
      });
    }
  };

  return (
    <AnimatePresence>
      {isQuickSaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[var(--color-bg-card)] rounded-[var(--radius-2xl)] shadow-xl w-full max-w-lg overflow-hidden border border-slate-100"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">Quick Save</h2>
              <button onClick={closeQuickSave} className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content or URL</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-24 p-3 rounded-[var(--radius-md)] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] text-sm resize-none"
                  placeholder="Paste link, prompt, or notes here..."
                />
              </div>
              
              {clipboardData?.images && clipboardData.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Attached Images</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                    {clipboardData.images.map((img, i) => (
                      <img key={i} src={img} alt={`Pasted ${i + 1}`} className="h-32 w-auto rounded-[var(--radius-md)] object-cover flex-shrink-0 snap-center border border-slate-200 shadow-sm" />
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full font-bold" 
                size="lg" 
                onClick={handleSave}
                disabled={(!content && (!clipboardData?.images || clipboardData.images.length === 0)) || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save to Vault'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
