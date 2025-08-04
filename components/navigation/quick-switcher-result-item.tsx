"use client";

import { Hash, MessageCircle, Users, Volume2 } from "lucide-react";
import { SearchResult } from "./quick-switcher-result-list";

interface QuickSwitcherResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}

export const QuickSwitcherResultItem = ({ 
  result, 
  isSelected, 
  onClick 
}: QuickSwitcherResultItemProps) => {
  const getIcon = () => {
    switch (result.type) {
      case "channel":
        return <Hash className="h-4 w-4" />;
      case "dm":
        return <MessageCircle className="h-4 w-4" />;
      case "server":
        return <Users className="h-4 w-4" />;
      case "voice":
        return <Volume2 className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
        isSelected 
          ? "bg-green-600 text-white" 
          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
      }`}
      onClick={onClick}
    >
      {/* Icon */}
      <div className="mr-3 text-zinc-400">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <span className="text-sm font-medium truncate">
            {result.name}
          </span>
          {result.tag && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-zinc-700 text-zinc-300 rounded">
              {result.tag}
            </span>
          )}
        </div>
        {result.description && (
          <p className="text-xs text-zinc-400 truncate">
            {result.description}
          </p>
        )}
      </div>
    </div>
  );
}; 