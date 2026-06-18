'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KnowledgeCard, CardTab } from '@/lib/types';
import { X, Plus, Trash2, Edit2, Loader2, Sparkles, Save } from 'lucide-react';
import { Button } from './ui/Button';
import { useVaultStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface Props {
  card: KnowledgeCard;
  onClose: () => void;
}

export function ExpandedCardModal({ card, onClose }: Props) {
  const updateCard = useVaultStore((state) => state.updateCard);
  const [activeTabId, setActiveTabId] = useState<string>('raw');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Fallback to empty array if tabs is undefined
  const tabs = card.tabs || [];

  const handleAddTab = () => {
    const newTab: CardTab = {
      id: uuidv4(),
      title: `New Tab ${tabs.length + 1}`,
      content: ''
    };
    updateCard(card.id, { tabs: [...tabs, newTab] });
    setActiveTabId(newTab.id);
    setEditMode(true);
    setEditedContent('');
  };

  const handleDeleteTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this tab?')) {
      const newTabs = tabs.filter(t => t.id !== tabId);
      updateCard(card.id, { tabs: newTabs });
      if (activeTabId === tabId) {
        setActiveTabId('raw');
        setEditMode(false);
      }
    }
  };

  const handleSaveEdit = () => {
    if (activeTabId === 'raw') {
      updateCard(card.id, { raw_content: editedContent });
    } else {
      const newTabs = tabs.map(t => 
        t.id === activeTabId ? { ...t, content: editedContent } : t
      );
      updateCard(card.id, { tabs: newTabs });
    }
    setEditMode(false);
  };

  const startEdit = (content: string) => {
    setEditedContent(content);
    setEditMode(true);
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const existingCategories = ['Uncategorized']; // Simplified for now
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: card.raw_content, images: card.image_urls, existingCategories, type: card.type })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      updateCard(card.id, {
        title: data.title || card.title,
        summary: data.summary || card.summary,
        use_this_when: data.use_this_when || card.use_this_when,
        tags: data.tags || card.tags,
      });
    } catch (error) {
      alert('Failed to generate AI summary.');
      console.error(error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const currentContent = activeTabId === 'raw' 
    ? card.raw_content 
    : tabs.find(t => t.id === activeTabId)?.content || '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--color-bg-card)] rounded-[var(--radius-2xl)] shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-white shrink-0">
            <div>
              <div className="flex gap-2 mb-2">
                {card.use_this_when?.map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{card.title}</h2>
              <p className="text-slate-500 mt-1">{card.summary}</p>
            </div>
            
            <div className="flex gap-2 items-center">
              <Button variant="secondary" onClick={handleGenerateAI} disabled={isGeneratingAI}>
                {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate AI Summary
              </Button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Main Body */}
          <div className="flex flex-1 overflow-hidden bg-slate-50/50">
            {/* Sidebar / Tabs list */}
            <div className="w-64 border-r border-slate-200 bg-slate-50/80 p-4 flex flex-col gap-2 shrink-0 overflow-y-auto">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tabs</div>
              
              <button 
                onClick={() => { setActiveTabId('raw'); setEditMode(false); }}
                className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTabId === 'raw' ? 'bg-white shadow-sm border border-slate-200 text-blue-600' : 'text-slate-600 hover:bg-slate-200/50'}`}
              >
                Main Content
              </button>

              {tabs.map(tab => (
                <div 
                  key={tab.id}
                  onClick={() => { setActiveTabId(tab.id); setEditMode(false); }}
                  className={`group flex justify-between items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeTabId === tab.id ? 'bg-white shadow-sm border border-slate-200 text-blue-600' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                  <span className="truncate">{tab.title}</span>
                  <button 
                    onClick={(e) => handleDeleteTab(tab.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <Button variant="ghost" className="mt-2 text-slate-500 border border-dashed border-slate-300 bg-transparent hover:bg-slate-100" onClick={handleAddTab}>
                <Plus className="w-4 h-4 mr-2" /> Add Tab
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <span className="font-medium text-slate-700">
                  {activeTabId === 'raw' ? 'Main Content' : tabs.find(t => t.id === activeTabId)?.title}
                </span>
                
                {editMode ? (
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => startEdit(currentContent)}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {editMode ? (
                  <textarea 
                    className="w-full h-full min-h-[400px] p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="Type your content here..."
                  />
                ) : (
                  <div className="prose prose-slate max-w-none">
                    {currentContent ? (
                      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                        {currentContent}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-slate-400 italic">No content. Click Edit to add some.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
