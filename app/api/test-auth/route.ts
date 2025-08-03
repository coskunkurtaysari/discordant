import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized - No userId" 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      userId: userId,
      message: "Authentication successful" 
    });
  } catch (error) {
    console.error("[TEST_AUTH]", error);
    return NextResponse.json({ 
      success: false, 
      message: "Authentication error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 