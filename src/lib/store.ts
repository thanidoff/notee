import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { KnowledgeCard } from './types';

// Create a custom storage object that uses localforage (IndexedDB)
const localforageStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await localforage.getItem<string>(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};

interface VaultState {
  cards: KnowledgeCard[];
  addCard: (card: KnowledgeCard) => void;
  updateCard: (id: string, updates: Partial<KnowledgeCard>) => void;
  removeCard: (id: string) => void;
  reorderCards: (oldIndex: number, newIndex: number) => void;
  importCards: (cards: KnowledgeCard[]) => void;
  clearVault: () => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      cards: [],
      addCard: (card) => set((state) => ({ cards: [card, ...state.cards] })),
      updateCard: (id, updates) =>
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c)),
        })),
      removeCard: (id) => set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),
      reorderCards: (oldIndex, newIndex) => set((state) => {
        const newCards = [...state.cards];
        const [movedCard] = newCards.splice(oldIndex, 1);
        newCards.splice(newIndex, 0, movedCard);
        return { cards: newCards };
      }),
      importCards: (cards) => set({ cards }),
      clearVault: () => set({ cards: [] }),
    }),
    {
      name: 'use-it-later-vault', // unique name for the storage
      storage: createJSONStorage(() => localforageStorage),
    }
  )
);
