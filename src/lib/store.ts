import { create } from 'zustand';
import { KnowledgeCard } from './types';
import { supabase } from './supabase';

interface VaultState {
  cards: KnowledgeCard[];
  isLoading: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  addCard: (card: KnowledgeCard) => Promise<void>;
  updateCard: (id: string, updates: Partial<KnowledgeCard>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  reorderCards: (oldIndex: number, newIndex: number) => Promise<void>;
  clearVault: () => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  cards: [],
  isLoading: false,
  error: null,

  fetchCards: async () => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Fetch error:', error);
      set({ error: error.message, isLoading: false });
    } else {
      set({ cards: data as KnowledgeCard[], isLoading: false });
    }
  },

  addCard: async (card) => {
    // Determine sort order (put at the top)
    const minOrder = get().cards.length > 0 ? Math.min(...get().cards.map(c => c.sort_order ?? 0)) : 0;
    const newCard = { ...card, sort_order: minOrder - 1 };

    // Optimistic UI Update
    set((state) => ({ cards: [newCard, ...state.cards] }));
    
    const { error } = await supabase.from('cards').insert([newCard]);
    if (error) {
      console.error('Error adding card:', error);
      set({ error: error.message });
      // Re-fetch to revert on error
      get().fetchCards();
    }
  },

  updateCard: async (id, updates) => {
    const updatedAt = new Date().toISOString();
    // Optimistic UI Update
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates, updated_at: updatedAt } : c)),
    }));

    const { error } = await supabase
      .from('cards')
      .update({ ...updates, updated_at: updatedAt })
      .eq('id', id);

    if (error) {
      console.error('Error updating card:', error);
      get().fetchCards();
    }
  },

  removeCard: async (id) => {
    // Optimistic UI Update
    set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }));

    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) {
      console.error('Error removing card:', error);
      get().fetchCards();
    }
  },

  reorderCards: async (oldIndex, newIndex) => {
    const cards = [...get().cards];
    const [movedCard] = cards.splice(oldIndex, 1);
    cards.splice(newIndex, 0, movedCard);

    // Update sort_order based on new index
    const updatedCards = cards.map((c, i) => ({ ...c, sort_order: i }));
    
    // Optimistic UI Update
    set({ cards: updatedCards });

    // Sync to Supabase in parallel
    try {
      await Promise.all(
        updatedCards.map(c => 
          supabase.from('cards').update({ sort_order: c.sort_order }).eq('id', c.id)
        )
      );
    } catch (error) {
      console.error('Error reordering cards:', error);
      get().fetchCards();
    }
  },

  clearVault: async () => {
    set({ cards: [] });
    // Note: For safety, this deletes everything. In a real app we might soft-delete or disable this.
    // We will leave the DB call out or just clear local state for now to prevent accidental total data loss.
  },
}));
