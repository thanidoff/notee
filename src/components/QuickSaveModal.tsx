'use client';

import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/lib/uiStore';
import { useVaultStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { KnowledgeCard, CardTab } from '@/lib/types';
import { X, Loader2, Tag, Type } from 'lucide-react';

export function QuickSaveModal() {
  const { isQuickSaveOpen, clipboardData, pasteTrigger, closeQuickSave } = useUIStore();
  const addCard = useVaultStore((state) => state.addCard);
  const cards = useVaultStore((state) => state.cards);
  
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get unique categories for datalist
  const existingCategories = Array.from(
    new Set(cards.flatMap((card) => card.use_this_when))
  ).filter(Boolean);

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
      setTitle('');
      setCategory('');
      setIsSubmitting(false);
    }
  }, [isQuickSaveOpen]);

  const generateFallbackTitle = (rawContent: string, isUrl: boolean) => {
    if (isUrl) return 'New Link';
    if (!rawContent.trim()) return `New Note ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    // Get first 5 words
    const words = rawContent.trim().split(/\s+/);
    const firstFewWords = words.slice(0, 5).join(' ');
    return words.length > 5 ? `${firstFewWords}...` : firstFewWords;
  };

  const generateFallbackSummary = (rawContent: string) => {
    if (!rawContent.trim()) return 'No content provided.';
    // First 120 characters roughly 2-3 sentences
    const preview = rawContent.trim().slice(0, 120);
    return rawContent.length > 120 ? `${preview}...` : preview;
  };

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

    // Determine final Title and Summary
    const finalTitle = title.trim() || generateFallbackTitle(content, isUrl);
    const finalSummary = generateFallbackSummary(content);
    const finalCategory = category.trim() || 'Uncategorized';

    // Prepare Initial Tabs (Optional: put raw content in a default tab)
    const initialTabs: CardTab[] = [];
    if (content.length > 300) {
      // If content is very long, maybe we put it in a tab? Or just leave it in raw_content.
      // For now, raw_content serves as the main content. Tabs are for later user addition.
    }

    const newCard: KnowledgeCard = {
      id: newId,
      title: finalTitle,
      type: type,
      raw_content: content,
      source_url: isUrl ? content : undefined,
      image_urls: uploadedImageUrls && uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
      summary: finalSummary,
      use_this_when: [finalCategory],
      tags: [finalCategory],
      tabs: [],
      status: 'saved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      use_count: 0
    };

    addCard(newCard);
    
    // Close immediately, fast save!
    closeQuickSave();
    setContent('');
    setTitle('');
    setCategory('');
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isQuickSaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[var(--color-bg-card)] rounded-[var(--radius-2xl)] shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h2 className="font-bold text-slate-800">Fast Save</h2>
              <button onClick={closeQuickSave} className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              
              {/* Optional Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" /> Title (Optional)
                </label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-[var(--radius-md)] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] text-sm"
                  placeholder="Leave blank to auto-generate..."
                />
              </div>

              {/* Optional Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Category (Optional)
                </label>
                <input 
                  type="text"
                  list="categories-list"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 rounded-[var(--radius-md)] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] text-sm"
                  placeholder="Select or type new category..."
                />
                <datalist id="categories-list">
                  {existingCategories.map((cat, i) => (
                    <option key={i} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content or URL</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-32 p-3 rounded-[var(--radius-md)] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] text-sm resize-none"
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
              
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <Button 
                className="w-full font-bold" 
                size="lg" 
                onClick={handleSave}
                disabled={(!content && (!clipboardData?.images || clipboardData.images.length === 0)) || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Immediately'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
