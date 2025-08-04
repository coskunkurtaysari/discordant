"use client";

import { QuickSwitcherResultItem } from "./quick-switcher-result-item";

export interface SearchResult {
  id: string;
  type: "server" | "channel" | "dm" | "voice";
  name: string;
  description?: string;
  icon?: string;
  url: string;
  tag?: string;
}

interface QuickSwitcherResultListProps {
  results: SearchResult[];
  selectedIndex: number;
  onSelect: (result: SearchResult) => void;
}

export const QuickSwitcherResultList = ({ 
  results, 
  selectedIndex, 
  onSelect 
}: QuickSwitcherResultListProps) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        Sonuç bulunamadı
      </div>
    );
  }

  // Sonuçları türlerine göre grupla
  const groupedResults = results.reduce((acc, result) => {
    const group = result.type;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const groupLabels = {
    server: "SUNUCULAR",
    channel: "KANALLAR",
    dm: "DİREKT MESAJLAR",
    voice: "SESLİ KANALLAR"
  };

  return (
    <div className="max-h-96 overflow-y-auto">
      {Object.entries(groupedResults).map(([group, groupResults]) => (
        <div key={group} className="mb-4">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 px-2">
            {groupLabels[group as keyof typeof groupLabels]}
          </h3>
          <div className="space-y-1">
            {groupResults.map((result, index) => {
              const globalIndex = results.findIndex(r => r.id === result.id);
              return (
                <QuickSwitcherResultItem
                  key={result.id}
                  result={result}
                  isSelected={globalIndex === selectedIndex}
                  onClick={() => onSelect(result)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}; 