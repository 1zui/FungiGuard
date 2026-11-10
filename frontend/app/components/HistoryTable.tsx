"use client";

import { useSyncExternalStore, useState } from "react";

export interface HistoryEntry {
  id: number;
  time: string;
  inputs: Record<string, string>;
  inputLabels: Record<string, string>;
  result: string;
  confidence: string;
}

const STORAGE_KEY = "fungiguard_history";

let cachedEntries: HistoryEntry[] | null = null;
let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

const EMPTY_ENTRIES: HistoryEntry[] = [];
function getServerSnapshot(): HistoryEntry[] {
  return EMPTY_ENTRIES;
}

export const historyStore = {
  add(entry: HistoryEntry) {
    const current = historyStore.getEntries();
    const updated = [entry, ...current];
    cachedEntries = updated;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    emitChange();
  },
  clear() {
    cachedEntries = EMPTY_ENTRIES;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    emitChange();
  },
  getEntries(): HistoryEntry[] {
    if (typeof window === "undefined") return EMPTY_ENTRIES;
    if (cachedEntries !== null) return cachedEntries;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      cachedEntries = raw ? JSON.parse(raw) : EMPTY_ENTRIES;
      return cachedEntries ?? EMPTY_ENTRIES;
    } catch {
      cachedEntries = EMPTY_ENTRIES;
      return cachedEntries;
    }
  },
  subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

interface Props {
  featureKeys: string[];
  featureLabels: Record<string, string>;
}

export function HistoryTable({ featureKeys, featureLabels }: Props) {
  const entries = useSyncExternalStore(
    historyStore.subscribe,
    historyStore.getEntries,
    getServerSnapshot
  );
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = () => {
    setIsClearing(true);
    setTimeout(() => {
      historyStore.clear();
      setIsClearing(false);
    }, 200);
  };

  if (entries.length === 0 && !isClearing) {
    return null;
  }

  return (
    <div
      className={`mt-8 w-full min-w-0 max-w-full overflow-hidden animate-page transition-opacity duration-200 ${
        isClearing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">Riwayat analisis</h3>
          <span className="text-[11px] text-accent font-medium bg-[#F4EFFC] border border-[#E1D4F0] px-2 py-0.5 rounded-[2px]">
            {entries.length} data
          </span>
        </div>
        <button
          onClick={handleClear}
          className="text-xs text-ink/50 hover:text-accent font-medium transition-colors duration-150 cursor-pointer"
        >
          Hapus semua
        </button>
      </div>

      <p className="text-[11px] text-ink/40 mb-2 sm:hidden">
        Geser tabel ke samping untuk melihat seluruh kolom fitur →
      </p>

      <div className="overflow-x-auto w-full max-w-full border border-warm-border rounded-[3px] bg-white shadow-2xs">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="bg-warm-panel border-b border-warm-border">
              <th className="px-3 py-2 text-left font-semibold text-ink/70 whitespace-nowrap">
                No
              </th>
              <th className="px-3 py-2 text-left font-semibold text-ink/70 whitespace-nowrap">
                Waktu
              </th>
              {featureKeys.map((key) => (
                <th
                  key={key}
                  className="px-3 py-2 text-left font-semibold text-ink/70 whitespace-nowrap"
                >
                  {featureLabels[key] || key}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-semibold text-ink/70 whitespace-nowrap">
                Hasil
              </th>
              <th className="px-3 py-2 text-left font-semibold text-ink/70 whitespace-nowrap">
                Keyakinan
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const isEdible = entry.result === "Dapat dimakan";
              return (
                <tr
                  key={entry.id}
                  className={`transition-colors duration-150 hover:bg-[#FAF7FD] ${
                    idx === 0 ? "animate-row-enter" : ""
                  } ${idx % 2 === 0 ? "bg-white" : "bg-warm-panel/40"}`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-ink/60">
                    {entries.length - idx}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-ink/60">
                    {entry.time}
                  </td>
                  {featureKeys.map((key) => (
                    <td key={key} className="px-3 py-2 whitespace-nowrap text-ink/80">
                      {entry.inputLabels[key] || entry.inputs[key]}
                    </td>
                  ))}
                  <td className="px-3 py-2 whitespace-nowrap font-semibold">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded-[2px] ${
                        isEdible
                          ? "bg-accent/15 text-accent"
                          : "bg-result-danger/15 text-result-danger"
                      }`}
                    >
                      {entry.result}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-ink/80 tabular-nums">
                    {entry.confidence}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
