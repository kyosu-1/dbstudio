import { create } from "zustand";
import type { SavedConnection, Tab } from "../lib/types";

interface AppState {
  // Connections
  savedConnections: SavedConnection[];
  activeConnectionId: string | null;
  connectionStatus: Record<string, "connected" | "disconnected">;
  setSavedConnections: (connections: SavedConnection[]) => void;
  setActiveConnectionId: (id: string | null) => void;
  setConnectionStatus: (id: string, status: "connected" | "disconnected") => void;

  // Tabs
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (tab: Tab) => void;
  removeTab: (id: string) => void;
  setActiveTabId: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;

  // UI
  showConnectionDialog: boolean;
  editingConnection: SavedConnection | null;
  setShowConnectionDialog: (show: boolean) => void;
  setEditingConnection: (conn: SavedConnection | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  savedConnections: [],
  activeConnectionId: null,
  connectionStatus: {},
  setSavedConnections: (connections) => set({ savedConnections: connections }),
  setActiveConnectionId: (id) => set({ activeConnectionId: id }),
  setConnectionStatus: (id, status) =>
    set((state) => ({
      connectionStatus: { ...state.connectionStatus, [id]: status },
    })),

  tabs: [],
  activeTabId: null,
  addTab: (tab) =>
    set((state) => {
      const existing = state.tabs.find(
        (t) =>
          t.type === tab.type &&
          t.schema === tab.schema &&
          t.tableName === tab.tableName &&
          tab.type === "table"
      );
      if (existing) {
        return { activeTabId: existing.id };
      }
      return { tabs: [...state.tabs, tab], activeTabId: tab.id };
    }),
  removeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      const newActiveId =
        state.activeTabId === id
          ? newTabs[newTabs.length - 1]?.id ?? null
          : state.activeTabId;
      return { tabs: newTabs, activeTabId: newActiveId };
    }),
  setActiveTabId: (id) => set({ activeTabId: id }),
  updateTab: (id, updates) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  showConnectionDialog: false,
  editingConnection: null,
  setShowConnectionDialog: (show) => set({ showConnectionDialog: show }),
  setEditingConnection: (conn) => set({ editingConnection: conn }),
}));
