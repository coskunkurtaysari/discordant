import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Tüm profilleri getir (kullanıcılar)
    const profiles = await db.profile.findMany({
      where: {
        NOT: {
          id: userId // Kendimizi hariç tut
        }
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        email: true
      }
    });

    console.log('All users found:', profiles.length); // Debug için

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("[USERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 