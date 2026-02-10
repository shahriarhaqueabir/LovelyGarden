import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GardenPreferences {
  accentColor: string;
  theme: 'forest' | 'midnight' | 'desert';
  gridSize: { width: number; height: number };
}

interface UserPreferences {
  language: 'en' | 'de';
  notifications: boolean;
  city: string;
  hemisphere: 'North' | 'South';
}

interface AppState {
  // Garden preferences
  gardenPrefs: GardenPreferences;
  setGardenPrefs: (prefs: Partial<GardenPreferences>) => void;
  
  // User preferences
  userPrefs: UserPreferences;
  setUserPrefs: (prefs: Partial<UserPreferences>) => void;
  
  // UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Active modals/drawers
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  
  // Reset functions
  resetGardenPrefs: () => void;
  resetUserPrefs: () => void;
  resetAll: () => void;
}

const defaultGardenPrefs: GardenPreferences = {
  accentColor: '#22c55e',
  theme: 'forest',
  gridSize: { width: 4, height: 4 },
};

const defaultUserPrefs: UserPreferences = {
  language: 'en',
  notifications: true,
  city: 'Dresden',
  hemisphere: 'North',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      gardenPrefs: defaultGardenPrefs,
      userPrefs: defaultUserPrefs,
      sidebarCollapsed: false,
      activeModal: null,
      
      // Actions
      setGardenPrefs: (prefs) =>
        set((state) => ({
          gardenPrefs: { ...state.gardenPrefs, ...prefs },
        })),
      
      setUserPrefs: (prefs) =>
        set((state) => ({
          userPrefs: { ...state.userPrefs, ...prefs },
        })),
      
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),
      
      setActiveModal: (modal) =>
        set({ activeModal: modal }),
      
      // Reset functions
      resetGardenPrefs: () =>
        set({ gardenPrefs: defaultGardenPrefs }),
      
      resetUserPrefs: () =>
        set({ userPrefs: defaultUserPrefs }),
      
      resetAll: () =>
        set({
          gardenPrefs: defaultGardenPrefs,
          userPrefs: defaultUserPrefs,
          sidebarCollapsed: false,
          activeModal: null,
        }),
    }),
    {
      name: 'garden-app-storage',
      partialize: (state) => ({
        gardenPrefs: state.gardenPrefs,
        userPrefs: state.userPrefs,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Selector hooks for better performance
export const useGardenPrefs = () => useAppStore((state) => state.gardenPrefs);
export const useUserPrefs = () => useAppStore((state) => state.userPrefs);
export const useSidebarCollapsed = () => useAppStore((state) => state.sidebarCollapsed);
export const useActiveModal = () => useAppStore((state) => state.activeModal);

export default useAppStore;
