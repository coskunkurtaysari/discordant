import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET /api/friends - Arkadaş listesini getir
export async function GET() {
  try {
    console.log("[FRIENDS_GET] Starting...");
    
    const { userId } = await auth();
    console.log("[FRIENDS_GET] Auth result:", { userId });
    
    if (!userId) {
      console.log("[FRIENDS_GET] No userId, returning 401");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Test database connection
    console.log("[FRIENDS_GET] Testing database connection...");
    try {
      await db.$connect();
      console.log("[FRIENDS_GET] Database connected successfully");
    } catch (dbError) {
      console.error("[FRIENDS_GET] Database connection failed:", dbError);
      return NextResponse.json({ 
        success: false, 
        message: "Veritabanı bağlantısı başarısız",
        error: dbError instanceof Error ? dbError.message : "Unknown database error"
      }, { status: 500 });
    }

    // Önce kullanıcının kendi profilinin var olduğunu kontrol et
    console.log("[FRIENDS_GET] Looking for user profile...");
    const currentUser = await db.profile.findUnique({
      where: { userId: userId }
    });

    console.log("[FRIENDS_GET] Current user:", currentUser);

    if (!currentUser) {
      console.log("[FRIENDS_GET] User profile not found");
      return NextResponse.json({ 
        success: false, 
        message: "Kullanıcı profili bulunamadı" 
      }, { status: 404 });
    }

    // Kullanıcının arkadaşlarını getir
    console.log("[FRIENDS_GET] Fetching friends...");
    const friends = await db.friend.findMany({
      where: {
        OR: [
          { userId: userId },
          { friendId: userId }
        ]
      }
    });

    console.log("[FRIENDS_GET] Found friends:", friends);

    // Arkadaş profillerini getir
    const friendUserIds = friends.map((friendship: any) => 
      friendship.userId === userId ? friendship.friendId : friendship.userId
    );

    console.log("[FRIENDS_GET] Friend user IDs:", friendUserIds);

    const friendProfiles = await db.profile.findMany({
      where: {
        userId: {
          in: friendUserIds
        }
      }
    });

    console.log("[FRIENDS_GET] Friend profiles:", friendProfiles);

    // Arkadaş listesini düzenle
    const formattedFriends = friends.map((friendship: any) => {
      const friendUserId = friendship.userId === userId ? friendship.friendId : friendship.userId;
      const friendProfile = friendProfiles.find(profile => profile.userId === friendUserId);
      
      return {
        id: friendUserId,
        name: friendProfile?.name || "Unknown User",
        status: "online", // TODO: Gerçek status implement edilecek
        avatar: friendProfile?.imageUrl,
        email: friendProfile?.email,
        createdAt: friendship.createdAt
      };
    });

    console.log("[FRIENDS_GET] Returning formatted friends:", formattedFriends);
    return NextResponse.json(formattedFriends);
    
  } catch (error) {
    console.error("[FRIENDS_GET] Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Sunucu hatası oluştu",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// POST /api/friends - Arkadaş ekle (Direkt arkadaş olarak ekler, onay beklemez)
export async function POST(req: NextRequest) {
  try {
    console.log("[FRIENDS_POST] Starting...");
    
    const { userId } = await auth();
    const { username } = await req.json();
    
    console.log("[FRIENDS_POST] Auth result:", { userId });
    console.log("[FRIENDS_POST] Request data:", { username });
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!username || username.trim() === "") {
      return NextResponse.json({ 
        success: false, 
        message: "E-posta veya isim gerekli" 
      }, { status: 400 });
    }

    // Email format kontrolü (eğer email girilmişse)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (username.includes('@') && !emailRegex.test(username.trim())) {
      return NextResponse.json({ 
        success: false, 
        message: "Geçerli bir e-posta adresi giriniz" 
      }, { status: 400 });
    }

    // Kendini arkadaş olarak eklemeye çalışıyorsa engelle
    const currentUser = await db.profile.findUnique({
      where: { userId: userId }
    });

    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        message: "Kullanıcı bulunamadı" 
      }, { status: 404 });
    }

    if (currentUser.email === username.trim() || currentUser.name === username.trim()) {
      return NextResponse.json({ 
        success: false, 
        message: "Kendinizi arkadaş olarak ekleyemezsiniz" 
      }, { status: 400 });
    }

    // Hedef kullanıcıyı bul (email veya name ile)
    const targetUser = await db.profile.findFirst({
      where: { 
        OR: [
          { email: username.trim() },
          { name: username.trim() }
        ]
      }
    });

    if (!targetUser) {
      return NextResponse.json({ 
        success: false, 
        message: `${username} kullanıcısı bulunamadı` 
      }, { status: 404 });
    }

    // Zaten arkadaş mı kontrol et
    const existingFriendship = await db.friend.findFirst({
      where: {
        OR: [
          { userId: userId, friendId: targetUser.userId },
          { userId: targetUser.userId, friendId: userId }
        ]
      }
    });

    if (existingFriendship) {
      return NextResponse.json({ 
        success: false, 
        message: `${targetUser.name} zaten arkadaşınız` 
      }, { status: 400 });
    }

    // Direkt arkadaşlık oluştur (onay beklemez)
    const friendship = await db.friend.create({
      data: {
        userId: userId,
        friendId: targetUser.userId
      }
    });

    console.log("[FRIENDS_POST] Success - friend added directly:", targetUser.name);
    return NextResponse.json({ 
      success: true, 
      message: `${targetUser.name} arkadaş listenize eklendi`,
      friendship 
    });
    
  } catch (error) {
    console.error("[FRIENDS_POST] Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Sunucu hatası oluştu",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// DELETE /api/friends - Arkadaş çıkar
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);
    const friendId = searchParams.get("friendId");
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!friendId) {
      return NextResponse.json({ 
        success: false, 
        message: "Arkadaş ID'si gerekli" 
      }, { status: 400 });
    }

    // Kullanıcının kendi profilinin var olduğunu kontrol et
    const currentUser = await db.profile.findUnique({
      where: { userId: userId }
    });

    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        message: "Kullanıcı profili bulunamadı" 
      }, { status: 404 });
    }

    // Arkadaşlığı sil
    const deletedFriendship = await db.friend.deleteMany({
      where: {
        OR: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Arkadaş başarıyla çıkarıldı",
      deleted: deletedFriendship.count > 0 
    });
    
  } catch (error) {
    console.error("[FRIENDS_DELETE] Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Sunucu hatası oluştu" 
    }, { status: 500 });
  }
} 