import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/current-profile";
import { UltraLowLatencyRoom } from "@/components/ultra-low-latency-room";

interface UltraLatencyPageProps {
  params: {
    roomId: string;
  };
}

export default async function UltraLatencyPage({ params }: UltraLatencyPageProps) {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/");
  }

  return (
    <div className="h-full">
      <UltraLowLatencyRoom 
        chatId={params.roomId}
        title={`Ultra-Low Latency Test: ${params.roomId}`}
      />
    </div>
  );
} 