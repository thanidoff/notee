'use client';

import React, { useState } from 'react';
import { KnowledgeCard as IKnowledgeCard } from '@/lib/types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Copy, ExternalLink, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { useVaultStore } from '@/lib/store';
import 'highlight.js/styles/github.css'; // You can change this style
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  card: IKnowledgeCard;
}

export function KnowledgeCard({ card }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const removeCard = useVaultStore((state) => state.removeCard);

  const handleCopy = () => {
    const textToCopy = card.ready_to_use_output || card.raw_content;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (window.confirm("คุณแน่ใจหรือไม่ที่จะลบการ์ดนี้? (ลบแล้วไม่สามารถกู้คืนได้)")) {
      removeCard(card.id);
    }
  };

  return (
    <motion.div 
      className="bg-white/60 backdrop-blur-xl rounded-[var(--radius-xl)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
    >
      {/* Header: Use Cases */}
      <div className="flex flex-wrap gap-2 mb-3">
        {card.use_this_when.map((situation, i) => (
          <Badge key={i} variant="default">
            {situation}
          </Badge>
        ))}
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-slate-800 mb-2 leading-tight">
        {card.title}
      </h3>
      
      {/* Summary */}
      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
        {card.summary}
      </p>

      {/* Images (if any) */}
      {card.image_urls && card.image_urls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 snap-x">
          {card.image_urls.map((url, i) => (
            <img 
              key={i} 
              src={url} 
              alt={`Attachment ${i}`} 
              className="h-24 w-auto rounded-[var(--radius-md)] object-cover flex-shrink-0 snap-center border border-slate-100"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          {card.source_url && (
            <a 
              href={card.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] text-sm font-medium transition-colors hover:bg-slate-100 text-slate-700 h-9 px-4 py-2"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Link
            </a>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDelete}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* Expanded Content (Markdown) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 bg-slate-50 rounded-[var(--radius-md)] text-sm text-slate-700 prose prose-sm max-w-none">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {card.ready_to_use_output || card.raw_content}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
