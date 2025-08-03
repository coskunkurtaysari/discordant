import { ChatHeader } from "@/components/chat/chat-header";
import { MediaRoom } from "@/components/media-room";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { ConversationChatWrapper } from "@/components/chat/conversation-chat-wrapper";

interface DirectMessagePageProps {
  params: Promise<{
    conversationId: string;
  }>;
  searchParams: Promise<{
    video?: boolean;
  }>;
}

// Generate metadata
export async function generateMetadata({ params }: DirectMessagePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { conversationId } = resolvedParams;
  
  try {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        memberOne: {
          include: { profile: true }
        },
        memberTwo: {
          include: { profile: true }
        }
      }
    });

    if (!conversation) {
      return {
        title: "Direct Message",
      };
    }

    // Get the other member's name (simplified)
    const otherMember = conversation.memberOne.profile || conversation.memberTwo.profile;

    return {
      title: `@${otherMember.name} - Direct Message`,
    };
  } catch (error) {
    return {
      title: "Direct Message",
    };
  }
}

const DirectMessagePage = async ({ params, searchParams }: DirectMessagePageProps) => {
  const { conversationId } = await params;
  const { video } = await searchParams;
  const profile = await currentProfile();
  
  if (!profile) {
    const authInstance = await auth();
    return authInstance.redirectToSignIn();
  }

  // Conversation kontrolü
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      memberOne: {
        include: { profile: true }
      },
      memberTwo: {
        include: { profile: true }
      }
    }
  });

  if (!conversation) {
    return redirect("/");
  }

  // Kullanıcının bu conversation'a erişim yetkisi var mı kontrol et
  if (conversation.memberOne.profile.id !== profile.id && 
      conversation.memberTwo.profile.id !== profile.id) {
    return redirect("/");
  }

  // Diğer üyenin bilgilerini al
  const otherMember = conversation.memberOne.profile.id === profile.id 
    ? conversation.memberTwo 
    : conversation.memberOne;

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <ChatHeader
          imageUrl={otherMember.profile.imageUrl || undefined}
          name={otherMember.profile.name}
          serverId=""
          type="conversation"
          conversationId={conversationId}
        />
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0">
        {video && (
          <MediaRoom chatId={conversationId} video={true} audio={true} />
        )}
        {!video && (
          <ConversationChatWrapper
            currentProfile={profile}
            conversation={conversation}
            conversationId={conversationId}
          />
        )}
      </div>
    </div>
  );
};

export default DirectMessagePage; 