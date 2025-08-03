"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPlus, Clock, Users, MessageCircle, MoreVertical, Search, Phone, Video, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActionTooltip } from "@/components/action-tooltip";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFriends } from "@/hooks/use-friends";
import { useToast } from "@/hooks/use-toast";

type FriendsTabType = "online" | "all" | "pending" | "add";

export const FriendsSection = () => {
  const [activeTab, setActiveTab] = useState<FriendsTabType>("online");
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendQuery, setAddFriendQuery] = useState("");
  
  const { friends, pendingRequests, isLoading, error, addFriend, acceptFriendRequest, rejectFriendRequest, removeFriend } = useFriends();
  const { toast } = useToast();
  const router = useRouter();

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
        description: result.message || `${addFriendQuery} kullanıcısına arkadaş isteği gönderildi.`,
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

  // Friend Action Functions
  const handleMessageFriend = async (friendId: string, friendName: string) => {
    try {
      toast({
        title: "Mesaj",
        description: `${friendName} ile sohbet açılıyor...`,
      });
      
      // DM sistemi ile entegre et
      // Önce conversation'ı başlat veya var olanı bul
      const response = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberTwoId: friendId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const conversation = await response.json();
      
      // DM chat ekranını aç
      router.push(`/direct-messages/${conversation.id}`);
      
      toast({
        title: "Başarılı",
        description: `${friendName} ile sohbet açıldı`,
      });
      
    } catch (error) {
      console.error("Error opening chat:", error);
      toast({
        title: "Hata",
        description: "Sohbet açılırken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleStartVideoCall = async (friendId: string, friendName: string) => {
    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendId: friendId,
          callType: 'video'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start video call');
      }

      const data = await response.json();
      
      if (data.success) {
        // TODO: Open video call interface with LiveKit
        toast({
          title: "Görüntülü Arama",
          description: `${friendName} ile görüntülü arama başlatılıyor...`,
        });
        
        // Redirect to call interface or open modal
        // window.open(`/call/${data.call.roomName}`, '_blank');
      } else {
        throw new Error('Failed to start call');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Görüntülü arama başlatılamadı",
        variant: "destructive",
      });
    }
  };

  const handleStartVoiceCall = async (friendId: string, friendName: string) => {
    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendId: friendId,
          callType: 'audio'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start voice call');
      }

      const data = await response.json();
      
      if (data.success) {
        // TODO: Open voice call interface with LiveKit
        toast({
          title: "Sesli Arama",
          description: `${friendName} ile sesli arama başlatılıyor...`,
        });
        
        // Redirect to call interface or open modal
        // window.open(`/call/${data.call.roomName}`, '_blank');
      } else {
        throw new Error('Failed to start call');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sesli arama başlatılamadı",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    try {
      const result = await removeFriend(friendId);
      if (result.success) {
        toast({
          title: "Arkadaş Çıkarıldı",
          description: `${friendName} arkadaş listenizden çıkarıldı.`,
        });
      } else {
        toast({
          title: "Hata",
          description: result.error || "Arkadaş çıkarılırken hata oluştu",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Arkadaş çıkarılırken hata oluştu",
        variant: "destructive",
      });
    }
  };

  const renderFriendsList = () => (
    <div className="space-y-1">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-2 text-muted-foreground">Arkadaşlar yükleniyor...</span>
        </div>
      ) : filteredFriends.length > 0 ? (
        filteredFriends.map((friend) => (
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
                  onClick={() => handleMessageFriend(friend.id, friend.name)}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </ActionTooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-message-hover"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 z-[9999] bg-[#2a2a2a] border border-zinc-700" align="end">
                  <DropdownMenuItem 
                    onClick={() => handleStartVideoCall(friend.id, friend.name)}
                    className="cursor-pointer hover:bg-zinc-700 text-white"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Görüntülü Arama Başlat
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStartVoiceCall(friend.id, friend.name)}
                    className="cursor-pointer hover:bg-zinc-700 text-white"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Sesli Arama Başlat
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-600" />
                  <DropdownMenuItem 
                    onClick={() => handleRemoveFriend(friend.id, friend.name)}
                    className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Arkadaşı Çıkar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Henüz arkadaşınız yok</p>
        </div>
      )}
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
    <div className="flex flex-col h-full bg-[#18191b]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Arkadaş Ekle</h2>
                  <p className="text-zinc-400 text-sm">
          Arkadaşlarını e-posta veya isim ile ekleyebilirsin
        </p>
        </div>
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
          <UserPlus className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="space-y-4">
            <Input
              placeholder="E-posta veya isim giriniz..."
              value={addFriendQuery}
              onChange={(e) => setAddFriendQuery(e.target.value)}
              className="h-14 bg-[#222224] border-zinc-700 text-white placeholder-zinc-500 rounded-xl text-lg px-4 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
              onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}
            />
            
            <Button 
              className={`w-full h-14 rounded-xl text-lg font-semibold transition-all duration-200 ${
                addFriendQuery.trim() 
                  ? 'bg-[#1DB954] hover:bg-[#1ed760] text-white shadow-lg hover:shadow-xl' 
                  : 'bg-[#1DB95480] text-white/60 cursor-not-allowed'
              }`}
              disabled={!addFriendQuery.trim()}
              onClick={handleAddFriend}
            >
              <UserPlus className="h-5 w-5 mr-3" />
              Arkadaşlık İsteği Gönder
            </Button>
          </div>

          {/* Status Message */}
          <div className="text-center">
            <p className="text-zinc-500 text-sm">
              Arkadaşlık isteği gönderildikten sonra kullanıcı direkt arkadaş olarak eklenecek
            </p>
          </div>
        </div>
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
            className={`px-3 py-1 text-base font-medium rounded-lg transition-all duration-200 ${
              activeTab === "add" 
                ? "bg-[#1DB954] hover:bg-[#1ed760] text-white shadow-lg" 
                : "text-muted-foreground hover:text-foreground hover:bg-message-hover"
            }`}
          >
            Arkadaş Ekle
          </Button>
        </div>
      </div>

      {/* Search Bar - Sadece arkadaş listesi görüntülenirken göster */}
      {(activeTab === "online" || activeTab === "all") && (
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
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeTab === "online" && (
          <div className="p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Çevrim İçi — {onlineFriends.length}
            </h2>
            {onlineFriends.length > 0 ? renderFriendsList() : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Çevrimiçi arkadaş bulunamadı</p>
              </div>
            )}
          </div>
        )}
        {activeTab === "all" && (
          <div className="p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Tüm Arkadaşlar — {filteredFriends.length}
            </h2>
            {filteredFriends.length > 0 ? renderFriendsList() : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Henüz arkadaşınız yok</p>
              </div>
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