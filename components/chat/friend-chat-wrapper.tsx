"use client";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatWelcome } from "@/components/chat/chat-welcome";
import { Profile } from "@prisma/client";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";

interface FriendChatWrapperProps {
  currentProfile: Profile;
  friendProfile: Profile;
  conversationId: string;
  serverId: string;
}

export const FriendChatWrapper = ({
  currentProfile,
  friendProfile,
  conversationId,
  serverId
}: FriendChatWrapperProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const socket = useSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      setIsConnected(true);
      // Friend conversation room'una join ol
      socket.emit("join-friend-conversation", {
        conversationId,
        userId: currentProfile.userId,
        friendId: friendProfile.userId
      });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, conversationId, currentProfile.userId, friendProfile.userId]);

  const handleSendMessage = async (content: string, fileUrl?: string) => {
    if (!socket || !isConnected) {
      toast({
        title: "Bağlantı Hatası",
        description: "Sunucuya bağlanılamıyor",
        variant: "destructive",
      });
      return;
    }

    try {
      socket.emit("send-friend-message", {
        conversationId,
        content,
        fileUrl,
        senderId: currentProfile.userId,
        receiverId: friendProfile.userId
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <ChatWelcome
          type="conversation"
          name={friendProfile.name}
        />
        <ChatMessages
          member={{
            id: currentProfile.id,
            role: "USER",
            profile: currentProfile,
            serverId: serverId,
            profileId: currentProfile.id,
            createdAt: currentProfile.createdAt,
            updatedAt: currentProfile.updatedAt
          }}
          name={friendProfile.name}
          chatId={conversationId}
          type="conversation"
          apiUrl="/api/friend-messages"
          socketUrl="/api/socket/friend-messages"
          socketQuery={{
            conversationId,
            currentUserId: currentProfile.userId,
            friendId: friendProfile.userId
          }}
          paramKey="conversationId"
          paramValue={conversationId}
          isConnected={isConnected}
        />
      </div>

      {/* Chat Input */}
      <div className="flex-shrink-0">
        <ChatInput
          name={friendProfile.name}
          type="conversation"
          apiUrl="/api/friend-messages"
          query={{
            conversationId,
            currentUserId: currentProfile.userId,
            friendId: friendProfile.userId
          }}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}; 