"use client";

import { useState } from "react";
import { Plus, UserPlus, Clock, Users, MessageCircle, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActionTooltip } from "@/components/action-tooltip";
import { useFriends } from "@/hooks/use-friends";
import { useToast } from "@/hooks/use-toast";

type FriendsTabType = "online" | "all" | "pending" | "add";

export const FriendsSection = () => {
  const [activeTab, setActiveTab] = useState<FriendsTabType>("online");
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendQuery, setAddFriendQuery] = useState("");
  
  const { friends, pendingRequests, isLoading, error, addFriend, acceptFriendRequest, rejectFriendRequest } = useFriends();
  const { toast } = useToast();

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineFriends = filteredFriends.filter(friend => friend.status === "online");

  const handleAddFriend = async () => {
    if (!addFriendQuery.trim()) return;

    const result = await addFriend(addFriendQuery.trim());
    if (result.success) {
      toast({
        title: "Arkadaş isteği gönderildi",
        description: `${addFriendQuery} kullanıcısına arkadaş isteği gönderildi.`,
      });
      setAddFriendQuery("");
    } else {
      toast({
        title: "Hata",
        description: result.error || "Arkadaş eklenirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    const result = await acceptFriendRequest(requestId);
    if (result.success) {
      toast({
        title: "Arkadaş isteği kabul edildi",
        description: "Artık bu kişi ile mesajlaşabilirsin.",
      });
    } else {
      toast({
        title: "Hata",
        description: result.error || "İstek kabul edilirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const result = await rejectFriendRequest(requestId);
    if (result.success) {
      toast({
        title: "Arkadaş isteği reddedildi",
        description: "İstek başarıyla reddedildi.",
      });
    } else {
      toast({
        title: "Hata",
        description: result.error || "İstek reddedilirken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const renderFriendsList = () => (
    <div className="space-y-1">
      {filteredFriends.map((friend) => (
        <div
          key={friend.id}
          className="flex items-center justify-between p-3 rounded-md hover:bg-message-hover transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <span className="text-muted-foreground font-semibold">
                  {friend.name.charAt(0)}
                </span>
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#161616] ${
                friend.status === 'online' ? 'bg-green-500' :
                friend.status === 'idle' ? 'bg-yellow-500' :
                friend.status === 'dnd' ? 'bg-red-500' :
                'bg-muted-foreground'
              }`} />
            </div>
            <div>
              <p className="text-foreground font-medium">{friend.name}</p>
              <p className="text-sm text-muted-foreground">
                {friend.status === "online" ? "Çevrimiçi" : 
                 friend.status === "idle" ? "Boşta" :
                 friend.status === "dnd" ? "Rahatsız Etmeyin" : "Çevrimdışı"}
              </p>
            </div>
          </div>
                     <div className="flex items-center space-x-2">
             <ActionTooltip label="Mesaj Gönder">
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-message-hover"
               >
                 <MessageCircle className="h-4 w-4" />
               </Button>
             </ActionTooltip>
             <ActionTooltip label="Daha Fazla">
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-message-hover"
               >
                 <MoreVertical className="h-4 w-4" />
               </Button>
             </ActionTooltip>
           </div>
        </div>
      ))}
    </div>
  );

  const renderPendingRequests = () => (
    <div className="space-y-1">
      {pendingRequests.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-3 rounded-md hover:bg-message-hover transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <span className="text-muted-foreground font-semibold">
                {request.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-foreground font-medium">{request.name}</p>
              <p className="text-sm text-muted-foreground">{request.sentAt}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleAcceptRequest(request.id)}
            >
              Kabul Et
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleRejectRequest(request.id)}
            >
              Reddet
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAddFriend = () => (
    <div className="space-y-4 p-4">
      <div className="text-center">
        <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Arkadaş Ekle</h3>
        <p className="text-muted-foreground mb-4">
          Kullanıcı adı veya e-posta ile arkadaş ekleyebilirsin
        </p>
      </div>
      
      <div className="space-y-3">
        <Input
          placeholder="Kullanıcı adı veya e-posta"
          value={addFriendQuery}
          onChange={(e) => setAddFriendQuery(e.target.value)}
          className="bg-card border-border text-foreground placeholder-muted-foreground"
          onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}
        />
        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white" 
          disabled={!addFriendQuery.trim()}
          onClick={handleAddFriend}
        >
          <Plus className="h-4 w-4 mr-2" />
          Arkadaş Ekle
        </Button>
      </div>
    </div>
  );

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
      <div className="flex items-center p-4 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground mr-6">Arkadaşlar</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant={activeTab === "online" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("online")}
            className={`px-3 py-1 text-base font-medium ${
              activeTab === "online" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-message-hover"
            }`}
          >
            Çevrim İçi
          </Button>
          <Button
            variant={activeTab === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 text-base font-medium ${
              activeTab === "all" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-message-hover"
            }`}
          >
            Tümü
          </Button>
          <Button
            variant={activeTab === "pending" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1 text-base font-medium ${
              activeTab === "pending" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-message-hover"
            }`}
          >
            Bekleyen
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "add" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("add")}
            className={`px-3 py-1 text-base font-medium ${
              activeTab === "add" 
                ? "bg-green-600 text-white" 
                : "text-muted-foreground hover:text-foreground hover:bg-message-hover"
            }`}
          >
            Arkadaş Ekle
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-border bg-[#161616]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-400" />
          <Input
            placeholder="Arkadaşlar arasında ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 h-12 bg-[#2a2a2a] border-2 border-green-500/30 text-foreground placeholder-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 text-base font-medium"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeTab === "online" && (
          <div className="p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Çevrim İçi — {onlineFriends.length}
            </h2>
            {onlineFriends.length > 0 ? renderFriendsList() : (
              <p className="text-muted-foreground text-center py-8">Çevrimiçi arkadaş bulunamadı</p>
            )}
          </div>
        )}
        {activeTab === "all" && (
          <div className="p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Tüm Arkadaşlar — {filteredFriends.length}
            </h2>
            {filteredFriends.length > 0 ? renderFriendsList() : (
              <p className="text-muted-foreground text-center py-8">Arkadaş bulunamadı</p>
            )}
          </div>
        )}
        {activeTab === "pending" && (
          <div className="p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Bekleyen İstekler — {pendingRequests.length}
            </h2>
            {pendingRequests.length > 0 ? renderPendingRequests() : (
              <p className="text-muted-foreground text-center py-8">Bekleyen istek bulunamadı</p>
            )}
          </div>
        )}
        {activeTab === "add" && renderAddFriend()}
      </ScrollArea>
    </div>
  );
}; 