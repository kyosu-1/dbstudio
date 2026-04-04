import { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronLeft } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import {
  getCommands,
  isSublistCommand,
  type CommandEntry,
  type SublistItem,
} from "../../lib/commands";
import { fuzzyMatch } from "../../lib/fuzzy-match";
import { CommandItem } from "./CommandItem";

export function CommandPalette() {
  const { setShowCommandPalette } = useAppStore();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [sublist, setSublist] = useState<{
    parentName: string;
    items: SublistItem[];
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commands = useMemo(() => getCommands(), []);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    return commands
      .map((cmd) => {
        const result = fuzzyMatch(query, cmd.name);
        return result ? { cmd, score: result.score, matches: result.matches } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .map((r) => r!);
  }, [commands, query]);

  const filteredSublist = useMemo(() => {
    if (!sublist) return [];
    if (!query.trim()) return sublist.items.map((item) => ({ item, matches: [] as number[] }));
    return sublist.items
      .map((item) => {
        const result = fuzzyMatch(query, item.name);
        return result ? { item, score: result.score, matches: result.matches } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .map((r) => r!);
  }, [sublist, query]);

  const currentItems = sublist ? filteredSublist : filteredCommands;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, sublist]);

  const close = () => setShowCommandPalette(false);

  const handleSelect = (index: number) => {
    if (sublist) {
      const entry = filteredSublist[index];
      if (entry) {
        entry.item.action();
        close();
      }
      return;
    }

    const entry = filteredCommands[index];
    if (!entry) return;
    const cmd = "cmd" in entry ? entry.cmd : entry;

    if (isSublistCommand(cmd)) {
      setSublist({ parentName: cmd.name, items: cmd.sublist() });
      setQuery("");
      return;
    }

    if (cmd.enabled && !cmd.enabled()) return;
    cmd.action();
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, currentItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(activeIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Backspace" && query === "" && sublist) {
      e.preventDefault();
      setSublist(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center pt-[15%]" onClick={close}>
      <div
        className="w-[500px] max-h-[400px] bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)]">
          {sublist ? (
            <button
              onClick={() => {
                setSublist(null);
                setQuery("");
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <ChevronLeft size={16} />
            </button>
          ) : (
            <Search size={16} className="text-[var(--text-muted)] shrink-0" />
          )}
          {sublist && (
            <span className="text-xs text-[var(--text-muted)]">
              {sublist.parentName} &rsaquo;
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={sublist ? "Filter..." : "Type a command..."}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {sublist
            ? filteredSublist.map((entry, idx) => (
                <CommandItem
                  key={entry.item.id}
                  icon={Search}
                  name={entry.item.name}
                  detail={entry.item.detail}
                  isActive={idx === activeIndex}
                  matchIndices={entry.matches}
                  onClick={() => handleSelect(idx)}
                />
              ))
            : filteredCommands.map((entry, idx) => {
                const cmd = "cmd" in entry ? entry.cmd : entry;
                const matches = "matches" in entry ? entry.matches : [];
                const disabled = "enabled" in cmd && cmd.enabled ? !cmd.enabled() : false;
                return (
                  <CommandItem
                    key={cmd.id}
                    icon={cmd.icon}
                    name={cmd.name}
                    shortcut={cmd.shortcut}
                    isActive={idx === activeIndex}
                    disabled={disabled}
                    matchIndices={matches as number[]}
                    onClick={() => handleSelect(idx)}
                  />
                );
              })}
          {currentItems.length === 0 && (
            <div className="text-center py-6 text-sm text-[var(--text-muted)]">
              No matching commands
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
