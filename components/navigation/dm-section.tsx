"use client";

import { useState } from "react";
import { Search, MessageCircle, MoreVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDMs } from "@/hooks/use-dms";

export const DMSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { conversations, isLoading, error } = useDMs();

  const filteredConversations = conversations.filter(conversation => {
    const name = getConversationName(conversation);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Helper functions to extract data from conversation structure
  const getConversationName = (conversation: any) => {
    return conversation.memberOne?.profile?.name || 
           conversation.memberTwo?.profile?.name || 
           'Unknown User';
  };

  const getConversationStatus = (conversation: any) => {
    return conversation.memberOne?.profile?.status || 
           conversation.memberTwo?.profile?.status || 
           'offline';
  };

  const getLastMessage = (conversation: any) => {
    const messages = conversation.directMessages || [];
    return messages.length > 0 ? messages[messages.length - 1] : null;
  };

  const getUnreadCount = (conversation: any) => {
    // Mock unread count - in real app this would come from API
    return Math.floor(Math.random() * 5);
  };

  const getTimestamp = (conversation: any) => {
    const lastMessage = getLastMessage(conversation);
    if (!lastMessage) return '';
    
    const date = new Date(lastMessage.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} saat önce`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-2"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Hata</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#161616]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Direkt Mesajlar</h1>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Mesajlarda ara"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredConversations.length > 0 ? (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => {
                const name = getConversationName(conversation);
                const status = getConversationStatus(conversation);
                const lastMessage = getLastMessage(conversation);
                const unreadCount = getUnreadCount(conversation);
                const timestamp = getTimestamp(conversation);

                return (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-message-hover transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar with Status */}
                      <div className="relative">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-muted-foreground font-semibold">
                            {name.charAt(0)}
                          </span>
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#161616] ${
                          status === 'online' ? 'bg-green-500' :
                          status === 'idle' ? 'bg-yellow-500' :
                          status === 'dnd' ? 'bg-red-500' :
                          'bg-muted-foreground'
                        }`} />
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-foreground font-medium truncate">{name}</p>
                          {timestamp && (
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {timestamp}
                            </span>
                          )}
                        </div>
                        {lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Henüz Mesaj Yok</h3>
              <p className="text-muted-foreground">
                Arkadaşlarınla konuşmaya başlamak için birine mesaj gönder
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}; 