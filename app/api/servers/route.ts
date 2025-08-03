// /app/api/servers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const profile = await db.profile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return new NextResponse("Profile not found", { status: 404 });
    }

    const servers = await db.server.findMany({
      where: {
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
    });

    return NextResponse.json(servers);
  } catch (error) {
    console.error("[SERVERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
