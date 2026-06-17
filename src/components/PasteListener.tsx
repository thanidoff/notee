'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/lib/uiStore';

export function PasteListener() {
  const openQuickSave = useUIStore((state) => state.openQuickSave);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Ignore paste if focused on an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      e.preventDefault();

      const text = e.clipboardData?.getData('text/plain') || '';
      let imageFound = false;

      // Check for images
      if (e.clipboardData?.items) {
        const imagePromises: Promise<string>[] = [];
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
              imageFound = true;
              imagePromises.push(new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  resolve(event.target?.result as string);
                };
                reader.readAsDataURL(blob);
              }));
            }
          }
        }
        
        if (imagePromises.length > 0) {
          const images = await Promise.all(imagePromises);
          openQuickSave({ text, images });
          return;
        }
      }

      // If no image, but text exists
      if (!imageFound && text) {
        openQuickSave({ text });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [openQuickSave]);

  return null;
}
