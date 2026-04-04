import type { LucideIcon } from "lucide-react";
import {
  Plug,
  Unplug,
  Plus,
  Terminal,
  RefreshCw,
  Table2,
} from "lucide-react";
import { useAppStore } from "../store/appStore";
import { api } from "./tauri";

export interface Command {
  id: string;
  name: string;
  icon: LucideIcon;
  shortcut?: string;
  category: "connection" | "editor" | "table" | "general";
  action: () => void | Promise<void>;
  enabled?: () => boolean;
}

export interface SublistItem {
  id: string;
  name: string;
  detail?: string;
  action: () => void | Promise<void>;
}

export interface CommandWithSublist extends Omit<Command, "action"> {
  sublist: () => SublistItem[];
}

export type CommandEntry = Command | CommandWithSublist;

export function isSublistCommand(cmd: CommandEntry): cmd is CommandWithSublist {
  return "sublist" in cmd;
}

export function getCommands(): CommandEntry[] {
  const store = useAppStore.getState();

  return [
    // Connection
    {
      id: "connect-to",
      name: "Connect to...",
      icon: Plug,
      category: "connection" as const,
      sublist: (): SublistItem[] =>
        store.savedConnections.map((conn) => ({
          id: conn.id,
          name: conn.name,
          detail: `${conn.host}:${conn.port}/${conn.database}`,
          action: async () => {
            try {
              await api.connect(conn.id);
              store.setActiveConnectionId(conn.id);
              store.setConnectionStatus(conn.id, "connected");
              api.getCompletionMetadata(conn.id).then((metadata) => {
                store.setCompletionMetadata(conn.id, metadata);
              }).catch(console.error);
            } catch (e) {
              console.error(e);
            }
          },
        })),
    },
    {
      id: "disconnect",
      name: "Disconnect",
      icon: Unplug,
      category: "connection" as const,
      action: async () => {
        if (!store.activeConnectionId) return;
        await api.disconnect(store.activeConnectionId);
        store.setConnectionStatus(store.activeConnectionId, "disconnected");
        store.setActiveConnectionId(null);
      },
      enabled: () => store.activeConnectionId !== null,
    },
    {
      id: "new-connection",
      name: "New Connection",
      icon: Plus,
      category: "connection" as const,
      action: () => {
        store.setEditingConnection(null);
        store.setShowConnectionDialog(true);
      },
    },

    // Editor
    {
      id: "new-query",
      name: "New Query",
      icon: Terminal,
      category: "editor" as const,
      action: () => {
        store.addTab({
          id: crypto.randomUUID(),
          type: "query",
          title: "Query",
          sql: "",
        });
      },
    },
    {
      id: "refresh-metadata",
      name: "Refresh Metadata",
      icon: RefreshCw,
      category: "editor" as const,
      action: async () => {
        if (!store.activeConnectionId) return;
        const metadata = await api.getCompletionMetadata(store.activeConnectionId);
        store.setCompletionMetadata(store.activeConnectionId, metadata);
      },
      enabled: () => store.activeConnectionId !== null,
    },

    // Table
    {
      id: "open-table",
      name: "Open Table...",
      icon: Table2,
      category: "table" as const,
      sublist: (): SublistItem[] => {
        const connId = store.activeConnectionId;
        const metadata = connId ? store.completionMetadata[connId] : null;
        if (!metadata) return [];
        return metadata.tables.map((t) => ({
          id: `${t.schema}.${t.name}`,
          name: t.name,
          detail: `${t.schema} (${t.table_type})`,
          action: () => {
            store.addTab({
              id: crypto.randomUUID(),
              type: "table",
              title: t.name,
              schema: t.schema,
              tableName: t.name,
            });
          },
        }));
      },
      enabled: () => store.activeConnectionId !== null,
    },
  ];
}
