'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useVaultStore } from '@/lib/store';
import { useUIStore } from '@/lib/uiStore';
import { KnowledgeCard } from '@/components/KnowledgeCard';
import { SortableCard } from '@/components/SortableCard';
import { Input } from '@/components/ui/Input';
import { Search, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';

export default function Home() {
  const cards = useVaultStore((state) => state.cards);
  const fetchCards = useVaultStore((state) => state.fetchCards);
  const isLoading = useVaultStore((state) => state.isLoading);
  const openQuickSave = useUIStore((state) => state.openQuickSave);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isMounted, setIsMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    fetchCards();
  }, [fetchCards]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    cards.forEach(card => {
      card.use_this_when.forEach(c => cats.add(c));
    });
    return ['All', ...Array.from(cats).sort()];
  }, [cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging to allow clicking inner elements
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex((card) => card.id === active.id);
      const newIndex = cards.findIndex((card) => card.id === over.id);
      useVaultStore.getState().reorderCards(oldIndex, newIndex);
    }
    setActiveId(null);
  };

  const isSearchActive = searchQuery.trim().length > 0 || activeCategory !== 'All';

  const filteredCards = cards.filter((card) => {
    if (activeCategory !== 'All' && !card.use_this_when.includes(activeCategory)) return false;
    if (searchQuery.trim().length === 0) return true;
    const query = searchQuery.toLowerCase();
    return (
      card.title.toLowerCase().includes(query) ||
      card.use_this_when.some((u) => u.toLowerCase().includes(query)) ||
      card.tags?.some((t) => t.toLowerCase().includes(query))
    );
  });

  if (!isMounted) return null;

  return (
    <main className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pt-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500 tracking-tight mb-2">
            My Vault
          </h1>
          <p className="text-slate-500 font-medium">
            Find exactly what you need, when you need it.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by situation, tag, or title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/60 backdrop-blur-md border-slate-200/60 focus:bg-white transition-colors rounded-full shadow-sm"
            />
          </div>
          
          <Link href="/settings">
            <Button variant="secondary" size="icon" className="shrink-0 rounded-full border-slate-200/60 bg-white/60 backdrop-blur-md hover:bg-white text-slate-600">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>

          <Button 
            onClick={() => openQuickSave({})}
            className="shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25 border-0 hover:scale-105 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Quick Save
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      {cards.length > 0 && (
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide snap-x">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                activeCategory === cat
                  ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Loading/Empty/List State */}
      {isLoading && cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading your vault...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[var(--radius-2xl)] border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Your vault is empty</h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Press <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">Ctrl+V</kbd> anywhere to save a link, text, or image instantly.
          </p>
          <Button variant="primary" onClick={() => openQuickSave({ text: '' })}>
            Add Your First Card
          </Button>
        </div>
      ) : isSearchActive ? (
        /* Regular Masonry Grid for search results (no DnD) */
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredCards.map((card) => (
            <div key={card.id} className="break-inside-avoid">
              <KnowledgeCard card={card} />
            </div>
          ))}
        </div>
      ) : (
        /* Bento Grid with Drag and Drop */
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={cards.map(c => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {cards.map((card) => (
                <div key={card.id} className="break-inside-avoid">
                  <SortableCard card={card} />
                </div>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="scale-105 shadow-2xl ring-2 ring-violet-500 rounded-[var(--radius-xl)] rotate-2 cursor-grabbing">
                <KnowledgeCard card={cards.find(c => c.id === activeId)!} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      
      {/* No Search Results */}
      {cards.length > 0 && filteredCards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No cards found matching "{searchQuery}"</p>
        </div>
      )}
    </main>
  );
}
