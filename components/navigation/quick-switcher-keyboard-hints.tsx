"use client";

import { ArrowUp, ArrowDown, RotateCcw, X } from "lucide-react";

export const QuickSwitcherKeyboardHints = () => {
  return (
    <div className="mt-4 pt-4 border-t border-zinc-700">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <ArrowUp className="h-3 w-3" />
            <ArrowDown className="h-3 w-3" />
            <span>Navigasyon</span>
          </div>
          <div className="flex items-center space-x-1">
            <RotateCcw className="h-3 w-3" />
            <span>Seç</span>
          </div>
          <div className="flex items-center space-x-1">
            <X className="h-3 w-3" />
            <span>Kapat</span>
          </div>
        </div>
        
        <div className="text-zinc-500">
          <span className="font-medium">TÜYO:</span> Sonuçları daraltmak için aramanı @ # ! * ile başlat
        </div>
      </div>
    </div>
  );
}; 