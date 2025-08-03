// /app/api/direct-messages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET /api/direct-messages - Kullanıcının conversation'larını getir
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const memberId = searchParams.get("memberId");
    const cursor = searchParams.get("cursor");
    const limit = 10;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Eğer conversationId verilmişse, o conversation'ın mesajlarını getir
    if (conversationId) {
      // Conversation'ın var olduğunu ve kullanıcının erişim yetkisi olduğunu kontrol et
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          memberOne: { include: { profile: true } },
          memberTwo: { include: { profile: true } }
        }
      });

      if (!conversation) {
        return new NextResponse("Conversation not found", { status: 404 });
      }

      // Kullanıcının bu conversation'a erişim yetkisi var mı kontrol et
      const currentProfile = await db.profile.findUnique({
        where: { userId }
      });

      if (!currentProfile) {
        return new NextResponse("Profile not found", { status: 404 });
      }

      if (conversation.memberOne.profile.id !== currentProfile.id && 
          conversation.memberTwo.profile.id !== currentProfile.id) {
        return new NextResponse("Access denied", { status: 403 });
      }

      // Mesajları getir
      const messages = await db.directMessage.findMany({
        where: { conversationId },
        include: {
          member: {
            include: { profile: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1
        })
      });

      console.log("[DIRECT_MESSAGES_GET] Found messages:", messages.length);
      console.log("[DIRECT_MESSAGES_GET] Messages:", messages.map(m => ({
        id: m.id,
        content: m.content,
        memberName: m.member.profile.name,
        createdAt: m.createdAt
      })));

      let nextCursor = undefined;
      if (messages.length === limit) {
        nextCursor = messages[messages.length - 1].id;
      }

      return NextResponse.json({
        items: messages,
        nextCursor
      });
    }

          // ConversationId verilmemişse, kullanıcının tüm conversation'larını getir
      const conversations = await db.conversation.findMany({
        where: {
          OR: [
            { memberOne: { profile: { userId } } },
            { memberTwo: { profile: { userId } } }
          ]
        },
        include: {
          memberOne: {
            include: { profile: true }
            },
          memberTwo: {
            include: { profile: true }
          },
          directMessages: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        },
        orderBy: {
          id: "desc"
        }
      });

    return NextResponse.json(conversations);

  } catch (error) {
    console.error("[DIRECT_MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/direct-messages - Yeni conversation başlat veya mesaj gönder
export async function POST(req: NextRequest) {
  try {
    console.log("[DIRECT_MESSAGES_POST] Starting...");
    const { userId } = await auth();
    const { memberTwoId, conversationId, content, fileUrl } = await req.json();
    
    console.log("[DIRECT_MESSAGES_POST] Request data:", {
      userId,
      memberTwoId,
      conversationId,
      hasContent: !!content
    });

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Kullanıcının profilini al
    const currentProfile = await db.profile.findUnique({
      where: { userId }
    });

    if (!currentProfile) {
      return new NextResponse("Profile not found", { status: 404 });
    }

        // Eğer conversationId verilmişse, mesaj gönder
    if (conversationId) {
      console.log("[DIRECT_MESSAGES_POST] Sending message to conversation:", conversationId);
      
      if (!content) {
        return new NextResponse("Content is required", { status: 400 });
      }

      // Conversation'ın var olduğunu kontrol et
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
        console.log("[DIRECT_MESSAGES_POST] Conversation not found:", conversationId);
        return new NextResponse("Conversation not found", { status: 404 });
      }

      // Kullanıcının bu conversation'a erişim yetkisi var mı kontrol et
      if (conversation.memberOne.profile.id !== currentProfile.id && 
          conversation.memberTwo.profile.id !== currentProfile.id) {
        console.log("[DIRECT_MESSAGES_POST] Access denied for conversation:", conversationId);
        return new NextResponse("Access denied", { status: 403 });
      }

      // Member ID'yi bul
      const member = await db.member.findFirst({
        where: {
          profileId: currentProfile.id,
          OR: [
            { id: conversation.memberOne.id },
            { id: conversation.memberTwo.id }
          ]
        }
      });

      if (!member) {
        console.log("[DIRECT_MESSAGES_POST] Member not found for profile:", currentProfile.id);
        return new NextResponse("Member not found", { status: 404 });
      }

      console.log("[DIRECT_MESSAGES_POST] Creating message with member:", member.id);
      console.log("[DIRECT_MESSAGES_POST] Message content:", content);
      console.log("[DIRECT_MESSAGES_POST] From user:", currentProfile.name);

      // Mesajı kaydet
      const message = await db.directMessage.create({
        data: {
          id: require('crypto').randomUUID(),
          content,
          fileUrl,
          conversationId,
          memberId: member.id,
          updatedAt: new Date()
        },
        include: {
          member: {
            include: { profile: true }
          }
        }
      });

      console.log("[DIRECT_MESSAGES_POST] Message saved successfully:", {
        id: message.id,
        content: message.content,
        memberName: message.member.profile.name,
        conversationId: message.conversationId,
        createdAt: message.createdAt
      });
      return NextResponse.json(message);
    }

    // Eğer memberTwoId verilmişse, yeni conversation başlat
    if (memberTwoId) {
      console.log("[DIRECT_MESSAGES_POST] Creating conversation with memberTwoId:", memberTwoId);
      
      // Hedef kullanıcının profilini al
      const targetProfile = await db.profile.findUnique({
        where: { id: memberTwoId }
      });

      if (!targetProfile) {
        console.log("[DIRECT_MESSAGES_POST] Target profile not found for id:", memberTwoId);
        return new NextResponse("Target user not found", { status: 404 });
      }
      
      console.log("[DIRECT_MESSAGES_POST] Found target profile:", targetProfile.name);

      // Var olan conversation var mı kontrol et
      const existingConversation = await db.conversation.findFirst({
        where: {
          OR: [
            {
              memberOne: { profile: { id: currentProfile.id } },
              memberTwo: { profile: { id: targetProfile.id } }
            },
            {
              memberOne: { profile: { id: targetProfile.id } },
              memberTwo: { profile: { id: currentProfile.id } }
            }
          ]
        },
        include: {
          memberOne: { 
            include: { profile: true }
          },
          memberTwo: { 
            include: { profile: true }
          }
        }
      });
      
      if (existingConversation) {
        return NextResponse.json(existingConversation);
      }

      // Yeni conversation oluştur - gerçek versiyon
      console.log("[DIRECT_MESSAGES_POST] Creating real conversation");
      
      // Member'ları oluştur (server olmadan)
      const memberOne = await db.member.create({
        data: {
          id: require('crypto').randomUUID(),
          profileId: currentProfile.id,
          role: "GUEST"
        }
      });

      const memberTwo = await db.member.create({
        data: {
          id: require('crypto').randomUUID(),
          profileId: targetProfile.id,
          role: "GUEST"
        }
      });

      // Conversation oluştur
      const conversation = await db.conversation.create({
        data: {
          id: require('crypto').randomUUID(),
          memberOneId: memberOne.id,
          memberTwoId: memberTwo.id
        },
        include: {
          memberOne: {
            include: { profile: true }
          },
          memberTwo: {
            include: { profile: true }
          }
        }
      });

      console.log("[DIRECT_MESSAGES_POST] Conversation created:", conversation.id);
      return NextResponse.json(conversation);
    }

    return new NextResponse("Invalid request", { status: 400 });

  } catch (error) {
    console.error("[DIRECT_MESSAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
