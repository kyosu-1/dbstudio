import { useEffect } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { MainPanel } from "./components/layout/MainPanel";
import { StatusBar } from "./components/layout/StatusBar";
import { ConnectionDialog } from "./components/connection/ConnectionDialog";
import { useAppStore } from "./store/appStore";
import { api } from "./lib/tauri";

export default function App() {
  const { showConnectionDialog, setSavedConnections } = useAppStore();

  useEffect(() => {
    api.listSavedConnections().then(setSavedConnections);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainPanel />
      </div>
      <StatusBar />
      {showConnectionDialog && <ConnectionDialog />}
    </div>
  );
}
