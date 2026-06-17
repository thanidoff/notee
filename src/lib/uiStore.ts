import { create } from 'zustand';

interface UIState {
  isQuickSaveOpen: boolean;
  clipboardData: { text?: string, images?: string[] } | null;
  pasteTrigger: number;
  openQuickSave: (data: { text?: string, images?: string[] }) => void;
  closeQuickSave: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isQuickSaveOpen: false,
  clipboardData: null,
  pasteTrigger: 0,
  openQuickSave: (data) => set((state) => {
    if (state.isQuickSaveOpen) {
      const existingImages = state.clipboardData?.images || [];
      const newImages = data.images || [];
      
      return {
        clipboardData: {
          text: data.text,
          images: [...existingImages, ...newImages]
        },
        pasteTrigger: state.pasteTrigger + 1
      };
    }
    return { isQuickSaveOpen: true, clipboardData: data, pasteTrigger: state.pasteTrigger + 1 };
  }),
  closeQuickSave: () => set({ isQuickSaveOpen: false, clipboardData: null }),
}));
