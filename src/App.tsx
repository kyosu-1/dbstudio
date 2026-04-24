import { useEffect, useCallback } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { MainPanel } from "./components/layout/MainPanel";
import { StatusBar } from "./components/layout/StatusBar";
import { ConnectionDialog } from "./components/connection/ConnectionDialog";
import { CommandPalette } from "./components/command-palette/CommandPalette";
import { DemoBanner } from "./components/DemoBanner";
import { useAppStore } from "./store/appStore";
import { api, setDemoMode } from "./lib/tauri";
import { DEMO_CONNECTION, DEMO_CONNECTION_ID } from "./lib/demo-data";
import { DEMO_SAMPLE_QUERIES } from "./lib/demo-data";

export default function App() {
  const {
    showConnectionDialog,
    showCommandPalette,
    setShowCommandPalette,
    setSavedConnections,
    isDemoMode,
    setDemoMode: setStoreDemoMode,
    setActiveConnectionId,
    setConnectionStatus,
    setCompletionMetadata,
    addTab,
  } = useAppStore();

  useEffect(() => {
    if (!isDemoMode) {
      api.listSavedConnections().then(setSavedConnections).catch(() => {});
    }
  }, [isDemoMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(!showCommandPalette);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCommandPalette, setShowCommandPalette]);

  const startDemo = useCallback(async () => {
    setDemoMode(true);
    setStoreDemoMode(true);

    setSavedConnections([DEMO_CONNECTION]);
    setConnectionStatus(DEMO_CONNECTION_ID, "connected");
    setActiveConnectionId(DEMO_CONNECTION_ID);

    const metadata = await api.getCompletionMetadata(DEMO_CONNECTION_ID);
    setCompletionMetadata(DEMO_CONNECTION_ID, metadata);

    const sample = DEMO_SAMPLE_QUERIES[0];
    addTab({
      id: `query-demo-${Date.now()}`,
      type: "query",
      title: "Sample Query",
      sql: sample.sql,
    });
  }, []);

  const exitDemo = useCallback(() => {
    setDemoMode(false);
    setStoreDemoMode(false);

    setSavedConnections([]);
    setActiveConnectionId(null);
    setConnectionStatus(DEMO_CONNECTION_ID, "disconnected");

    api.listSavedConnections().then(setSavedConnections).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {isDemoMode && <DemoBanner onExit={exitDemo} />}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainPanel onStartDemo={startDemo} />
      </div>
      <StatusBar />
      {showConnectionDialog && <ConnectionDialog />}
      {showCommandPalette && <CommandPalette />}
    </div>
  );
}
