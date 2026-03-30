import { ConnectionList } from "../connection/ConnectionList";
import { TableTree } from "../explorer/TableTree";

export function Sidebar() {
  return (
    <div className="w-64 min-w-[200px] h-full bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col overflow-hidden">
      <ConnectionList />
      <div className="flex-1 overflow-auto">
        <TableTree />
      </div>
    </div>
  );
}
