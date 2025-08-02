// /app/api/livekit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");
  const studioMode = req.nextUrl.searchParams.get("studio") === "true";
  
  if (!room) {
    return NextResponse.json(
      { error: 'Missing "room" query parameter' },
      { status: 400 }
    );
  } else if (!username) {
    return NextResponse.json(
      { error: 'Missing "username" query parameter' },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const at = new AccessToken(apiKey, apiSecret, { identity: username });

  // Enhanced permissions for studio mode
  if (studioMode) {
    at.addGrant({ 
      room, 
      roomJoin: true, 
      canPublish: true, 
      canSubscribe: true,
      canPublishData: true,
      canUpdateMetadata: true,
      // Studio-specific permissions
      canPublishAudio: true,
      canPublishVideo: true,
      canPublishScreen: true,
      canPublishScreenAudio: true
    });
  } else {
    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });
  }

  // Studio mode: longer token expiry for extended sessions
  const ttl = studioMode ? 3600 * 24 : 3600; // 24 hours for studio, 1 hour for regular
  at.ttl = ttl;

  return NextResponse.json({ 
    token: await at.toJwt(),
    studioMode,
    ttl
  });
}
