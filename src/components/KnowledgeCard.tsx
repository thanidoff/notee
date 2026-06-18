'use client';

import React, { useState } from 'react';
import { KnowledgeCard as IKnowledgeCard } from '@/lib/types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Copy, ExternalLink, Trash2, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { useVaultStore } from '@/lib/store';
import 'highlight.js/styles/github.css';
import { motion } from 'framer-motion';
import { ExpandedCardModal } from './ExpandedCardModal';

interface Props {
  card: IKnowledgeCard;
}

export function KnowledgeCard({ card }: Props) {
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const removeCard = useVaultStore((state) => state.removeCard);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = card.ready_to_use_output || card.raw_content;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("คุณแน่ใจหรือไม่ที่จะลบการ์ดนี้? (ลบแล้วไม่สามารถกู้คืนได้)")) {
      removeCard(card.id);
    }
  };

  return (
    <>
      <motion.div 
        className="group relative bg-white/60 backdrop-blur-xl rounded-[var(--radius-xl)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-[300px]"
      >
        {/* Header: Use Cases */}
        <div className="flex flex-wrap gap-2 mb-3">
          {card.use_this_when?.map((situation, i) => (
            <Badge key={i} variant="default">
              {situation}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-slate-800 mb-2 leading-tight line-clamp-2">
          {card.title}
        </h3>
        
        {/* Summary or Preview */}
        <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-1">
          {card.summary}
        </p>

        {/* Actions (Bottom Bar) */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
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
                onClick={(e) => e.stopPropagation()}
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
        </div>

        {/* Hover "Open" Button Overlay */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="shadow-lg font-bold"
          >
            <Maximize2 className="w-4 h-4 mr-2" /> Open / ขยายเต็มจอ
          </Button>
        </div>
      </motion.div>

      {/* Expanded Modal */}
      {isModalOpen && (
        <ExpandedCardModal 
          card={card} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}
