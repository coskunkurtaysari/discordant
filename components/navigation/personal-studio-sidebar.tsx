"use client";

import { useState } from "react";
import { Users, Store, MessageCircle, Search, ChevronDown, ChevronRight, Disc3, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FriendRequestBadge } from "./friend-request-badge";
import { useFriends } from "@/hooks/use-friends";
import { useDMs } from "@/hooks/use-dms";
import { useQuickSwitcher } from "@/hooks/use-quick-switcher";
import { ActionTooltip } from "@/components/action-tooltip";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { QuickSwitcherModal } from "./quick-switcher-modal";
import { QuickSwitcherInput } from "./quick-switcher-input";
import { QuickSwitcherResultList } from "./quick-switcher-result-list";
import { QuickSwitcherKeyboardHints } from "./quick-switcher-keyboard-hints";

type SectionType = "studio" | "friends" | "store" | "dm";

interface PersonalStudioSidebarProps {
  profile?: any;
  activeSection?: SectionType;
  onSectionChange?: (section: SectionType) => void;
  onClose?: () => void;
}

export const PersonalStudioSidebar = ({ 
  profile, 
  activeSection = "dm", 
  onSectionChange = () => {}, 
  onClose = () => {} 
}: PersonalStudioSidebarProps) => {
  const { pendingRequests } = useFriends();
  const { conversations, isLoading } = useDMs();
  const [isDmListOpen, setIsDmListOpen] = useState(true);
  const router = useRouter();
  const { userId } = useAuth();
  const {
    isOpen: isQuickSwitcherOpen,
    query,
    setQuery,
    selectedIndex,
    results,
    handleKeyDown,
    handleSelect,
    handleClose: handleQuickSwitcherClose,
    handleOpen: handleQuickSwitcherOpen
  } = useQuickSwitcher();

  // Karşı tarafın ismini al
  const getOtherMemberName = (conversation: any) => {
    if (!userId || !profile) return 'Unknown User';
    
    // Mevcut kullanıcının profile ID'si
    const currentProfileId = profile.id;
    
    // Karşı tarafı bul
    if (conversation.memberOne?.profile?.id === currentProfileId) {
      return conversation.memberTwo?.profile?.name || 'Unknown User';
    } else if (conversation.memberTwo?.profile?.id === currentProfileId) {
      return conversation.memberOne?.profile?.name || 'Unknown User';
    }
    
    return 'Unknown User';
  };

  // Karşı tarafın avatar harfini al
  const getOtherMemberAvatar = (conversation: any) => {
    if (!userId || !profile) return 'U';
    
    const currentProfileId = profile.id;
    
    if (conversation.memberOne?.profile?.id === currentProfileId) {
      return conversation.memberTwo?.profile?.name?.charAt(0)?.toUpperCase() || 'U';
    } else if (conversation.memberTwo?.profile?.id === currentProfileId) {
      return conversation.memberOne?.profile?.name?.charAt(0)?.toUpperCase() || 'U';
    }
    
    return 'U';
  };

  return (
    <div className="w-64 bg-[#121212] flex flex-col h-full">
      {/* Top Section: Personal Studio Header */}
      <div className="p-3 border-b border-zinc-700">
        <h2 className="text-lg font-semibold text-white">Personal Studio</h2>
      </div>

      {/* Search Box */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <button
            onClick={handleQuickSwitcherOpen}
            className="w-full pl-10 pr-3 py-2 rounded-md bg-zinc-800 text-sm text-white placeholder-zinc-400 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-green-500 text-left"
          >
            Sohbet bul ya da başlat
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="px-2 space-y-1">
        {/* Studio Channel - Server navigation'daki ile tam aynı */}
        <button
          onClick={() => onSectionChange("studio")}
          className="group px-2 py-2 rounded-md flex items-center w-full gap-x-2 bg-[#8B4513] hover:bg-[#A0522D] border-l-4 border-orange-400 transition mb-1"
        >
          <Disc3 className="flex-shrink-0 w-5 h-5 text-orange-500" />
          <p className="line-clamp-1 font-bold text-base text-orange-600">
            STUDIO
          </p>
          <div className="ml-auto flex items-center gap-x-2">
            <ActionTooltip label="Settings">
              <Edit
                className="hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
              />
            </ActionTooltip>
            <ActionTooltip label="Delete">
              <Trash
                className="hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
              />
            </ActionTooltip>
          </div>
        </button>

        <Button
          variant={activeSection === "friends" ? "default" : "ghost"}
          className={`w-full justify-start h-10 px-3 text-sm font-medium ${
            activeSection === "friends" 
              ? "bg-green-600 text-white hover:bg-green-700" 
              : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
          }`}
          onClick={() => onSectionChange("friends")}
        >
          <Users className="h-4 w-4 mr-3" />
          <span>Arkadaşlar</span>
          {pendingRequests.length > 0 && (
            <div className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {pendingRequests.length}
            </div>
          )}
        </Button>
        
        <Button
          variant={activeSection === "store" ? "default" : "ghost"}
          className={`w-full justify-start h-10 px-3 text-sm font-medium ${
            activeSection === "store" 
              ? "bg-green-600 text-white hover:bg-green-700" 
              : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
          }`}
          onClick={() => onSectionChange("store")}
        >
          <Store className="h-4 w-4 mr-3" />
          <span>Mağaza</span>
        </Button>
      </div>

      {/* Separator */}
      <Separator className="mx-2 my-2 bg-zinc-700" />

      {/* Direct Messages Header - Toggleable */}
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          className="w-full justify-between h-8 px-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide hover:text-white hover:bg-zinc-800"
          onClick={() => setIsDmListOpen(!isDmListOpen)}
        >
          <span>Direkt Mesajlar</span>
          {isDmListOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* DM List - Toggleable */}
      {isDmListOpen && (
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {isLoading ? (
            <div className="text-zinc-400 text-sm px-2 py-1">Yükleniyor...</div>
          ) : conversations.length === 0 ? (
            <div className="text-zinc-400 text-sm px-2 py-1">Henüz DM yok</div>
          ) : (
            conversations.map((conversation: any) => (
              <div
                key={conversation.id}
                className="flex items-center px-2 py-1.5 rounded-md hover:bg-zinc-800 cursor-pointer group"
                onClick={() => router.push(`/direct-messages/${conversation.id}`)}
              >
                {/* Avatar with Status */}
                <div className="relative mr-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm text-zinc-300">
                    {getOtherMemberAvatar(conversation)}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#121212] ${
                    conversation.memberOne?.profile?.status === 'online' || conversation.memberTwo?.profile?.status === 'online' ? 'bg-green-500' :
                    conversation.memberOne?.profile?.status === 'idle' || conversation.memberTwo?.profile?.status === 'idle' ? 'bg-yellow-500' :
                    conversation.memberOne?.profile?.status === 'dnd' || conversation.memberTwo?.profile?.status === 'dnd' ? 'bg-red-500' :
                    'bg-zinc-500'
                  }`} />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-white truncate">
                      {getOtherMemberName(conversation)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Bottom Section */}
      <div className="p-4 border-t border-zinc-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {profile?.name?.charAt(0)?.toUpperCase() || 'P'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{profile?.name || 'User'}</p>
            <p className="text-xs text-zinc-400">Çevrimiçi</p>
          </div>
        </div>
      </div>

      {/* Quick Switcher Modal */}
      <QuickSwitcherModal open={isQuickSwitcherOpen} onClose={handleQuickSwitcherClose}>
        <QuickSwitcherInput
          value={query}
          onChange={setQuery}
          onKeyDown={handleKeyDown}
        />
        <QuickSwitcherResultList
          results={results}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
        />
        <QuickSwitcherKeyboardHints />
      </QuickSwitcherModal>
    </div>
  );
}; 