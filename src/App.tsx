import { useEffect } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { MainPanel } from "./components/layout/MainPanel";
import { StatusBar } from "./components/layout/StatusBar";
import { ConnectionDialog } from "./components/connection/ConnectionDialog";
import { CommandPalette } from "./components/command-palette/CommandPalette";
import { useAppStore } from "./store/appStore";
import { api } from "./lib/tauri";

export default function App() {
  const { showConnectionDialog, showCommandPalette, setShowCommandPalette, setSavedConnections } = useAppStore();

  useEffect(() => {
    api.listSavedConnections().then(setSavedConnections);
  }, []);

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

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainPanel />
      </div>
      <StatusBar />
      {showConnectionDialog && <ConnectionDialog />}
      {showCommandPalette && <CommandPalette />}
    </div>
  );
}
