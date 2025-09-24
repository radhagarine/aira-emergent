// stores/businessStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BusinessState {
  selectedBusinessId: string;
  setSelectedBusinessId: (id: string) => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      selectedBusinessId: '',
      setSelectedBusinessId: (id) => set({ selectedBusinessId: id }),
    }),
    { 
      name: 'business-storage',
      // Storage defaults to localStorage
    }
  )
);