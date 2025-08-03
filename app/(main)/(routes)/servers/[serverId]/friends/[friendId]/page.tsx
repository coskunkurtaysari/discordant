// /app/(main)/(routes)/servers/[serverId]/friends/[friendId]/page.tsx

import { ChatHeader } from "@/components/chat/chat-header";
import { MediaRoom } from "@/components/media-room";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { FriendChatWrapper } from "@/components/chat/friend-chat-wrapper";

interface FriendIdPageProps {
  params: Promise<{
    friendId: string;
    serverId: string;
  }>;
  searchParams: Promise<{
    video?: boolean;
  }>;
}

// Generate metadata
export async function generateMetadata({ params }: FriendIdPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { friendId, serverId } = resolvedParams;
  
  const friendProfile = await db.profile.findUnique({
    where: { userId: friendId }
  });

  return {
    title: friendProfile ? `@${friendProfile.name} - Direct Message` : "Direct Message",
  };
}

const FriendIdPage = async ({ params, searchParams }: FriendIdPageProps) => {
  const { friendId, serverId } = await params;
  const { video } = await searchParams;
  const profile = await currentProfile();
  
  if (!profile) {
    const authInstance = await auth();
    return authInstance.redirectToSignIn();
  }

  // Arkadaşlık kontrolü
  const friendship = await db.friend.findFirst({
    where: {
      OR: [
        { userId: profile.userId, friendId: friendId },
        { userId: friendId, friendId: profile.userId }
      ]
    }
  });

  if (!friendship) {
    return redirect("/");
  }

  // Arkadaş profilini al
  const friendProfile = await db.profile.findUnique({
    where: { userId: friendId }
  });

  if (!friendProfile) {
    return redirect("/");
  }

  // Server bilgisini al (opsiyonel)
  const server = await db.server.findUnique({
    where: { id: serverId }
  });

  // Conversation ID oluştur (arkadaşlar arası unique)
  const conversationId = `friend-${profile.userId}-${friendId}`;

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <ChatHeader
          imageUrl={friendProfile.imageUrl || undefined}
          name={friendProfile.name}
          serverId={serverId}
          type="conversation"
          conversationId={conversationId}
          serverImageUrl={server?.imageUrl}
          serverName={server?.name}
        />
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0">
        {video && (
          <MediaRoom chatId={conversationId} video={true} audio={true} />
        )}
        {!video && (
          <FriendChatWrapper
            currentProfile={profile}
            friendProfile={friendProfile}
            conversationId={conversationId}
            serverId={serverId}
          />
        )}
      </div>
    </div>
  );
};

export default FriendIdPage; 