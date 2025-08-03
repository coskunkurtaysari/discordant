import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { AccessToken } from "livekit-server-sdk";

// POST /api/calls - Arama başlat
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const { friendId, callType } = await req.json();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!friendId || !callType) {
      return new NextResponse("Friend ID and call type are required", { status: 400 });
    }

    // Arkadaşlık kontrolü
    const friendship = await db.friend.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    if (!friendship) {
      return new NextResponse("Not friends with this user", { status: 403 });
    }

    // Arama odası oluştur
    const roomName = `call_${userId}_${friendId}_${Date.now()}`;
    
    // LiveKit token oluştur
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return new NextResponse("LiveKit not configured", { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: `User ${userId}`
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const token = at.toJwt();

    // Arama kaydını veritabanına kaydet
    const call = await db.call.create({
      data: {
        roomName: roomName,
        callerId: userId,
        receiverId: friendId,
        type: callType, // 'video' veya 'audio'
        status: 'initiating'
      }
    });

    return NextResponse.json({
      success: true,
      call: {
        id: call.id,
        roomName: roomName,
        token: token,
        type: callType
      }
    });
  } catch (error) {
    console.error("[CALLS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// GET /api/calls - Aktif aramaları getir
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Kullanıcının aktif aramalarını getir
    const calls = await db.call.findMany({
      where: {
        OR: [
          { callerId: userId },
          { receiverId: userId }
        ],
        status: {
          in: ['initiating', 'active']
        }
      },
      include: {
        caller: {
          include: {
            profile: true
          }
        },
        receiver: {
          include: {
            profile: true
          }
        }
      }
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error("[CALLS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 