import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET /api/friend-messages - Arkadaşlar arası mesajları getir
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const currentUserId = searchParams.get("currentUserId");
    const friendId = searchParams.get("friendId");
    const cursor = searchParams.get("cursor");
    const limit = 10;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!conversationId || !currentUserId || !friendId) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    // Arkadaşlık kontrolü
    const friendship = await db.friend.findFirst({
      where: {
        OR: [
          { userId: currentUserId, friendId: friendId },
          { userId: friendId, friendId: currentUserId }
        ]
      }
    });

    if (!friendship) {
      return new NextResponse("Friendship not found", { status: 404 });
    }

    // Mesajları getir (şimdilik mock data)
    const messages = [
      {
        id: "1",
        content: "Merhaba! Nasılsın?",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        senderId: friendId,
        receiverId: currentUserId,
        conversationId: conversationId
      },
      {
        id: "2", 
        content: "İyiyim, teşekkürler! Sen nasılsın?",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        senderId: currentUserId,
        receiverId: friendId,
        conversationId: conversationId
      }
    ];

    let nextCursor = undefined;
    if (messages.length === limit) {
      nextCursor = messages[messages.length - 1].id;
    }

    return NextResponse.json({
      items: messages,
      nextCursor
    });

  } catch (error) {
    console.error("[FRIEND_MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/friend-messages - Arkadaşlar arası mesaj gönder
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const { content, conversationId, senderId, receiverId, fileUrl } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!content || !conversationId || !senderId || !receiverId) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    // Arkadaşlık kontrolü
    const friendship = await db.friend.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId }
        ]
      }
    });

    if (!friendship) {
      return new NextResponse("Friendship not found", { status: 404 });
    }

    // Mesajı kaydet (şimdilik mock)
    const message = {
      id: Date.now().toString(),
      content,
      fileUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      senderId,
      receiverId,
      conversationId
    };

    return NextResponse.json(message);

  } catch (error) {
    console.error("[FRIEND_MESSAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 