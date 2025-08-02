import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { StudioRoom } from "@/components/studio-room";

interface StudioPageProps {
  params: {
    roomId: string;
  };
}

export default async function StudioPage({ params }: StudioPageProps) {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/");
  }

  // Get or create studio room
  let studioRoom = await db.server.findFirst({
    where: {
      id: params.roomId,
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
    include: {
      channels: {
        where: {
          name: "studio",
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      members: {
        include: {
          profile: true,
        },
        orderBy: {
          role: "asc",
        },
      },
    },
  });

  if (!studioRoom) {
    return redirect("/");
  }

  const studioChannel = studioRoom.channels[0];

  if (!studioChannel) {
    return redirect("/");
  }

  return (
    <div className="h-full">
      <StudioRoom 
        chatId={studioChannel.id}
        title={`${studioRoom.name} Studio`}
        description="Low latency live streaming session"
      />
    </div>
  );
} 