"use client";

import { useRef, useEffect } from "react";
import { Search } from "lucide-react";

interface QuickSwitcherInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
}

export const QuickSwitcherInput = ({ 
  value, 
  onChange, 
  onKeyDown, 
  placeholder = "Sohbet bul ya da başlat" 
}: QuickSwitcherInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full pl-10 pr-4 py-3 bg-zinc-800 text-white placeholder-zinc-400 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        placeholder={placeholder}
      />
    </div>
  );
}; 