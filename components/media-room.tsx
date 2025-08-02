"use client";
import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference, RoomOptions } from "@livekit/components-react";
import "@livekit/components-styles";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

interface MediaRoomProps {
  chatId: string;
  video: boolean;
  audio: boolean;
  studioMode?: boolean; // New prop for studio mode
}

export const MediaRoom = ({ chatId, video, audio, studioMode = false }: MediaRoomProps) => {
  const { user } = useUser();
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!user) return;

    // Get user display name with fallbacks
    const displayName =
      user.fullName || // Try fullName first
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || // Then first+last
      user.primaryEmailAddress?.emailAddress?.split('@')[0] || // Then email username
      user.id; // Finally, use ID as last resort

    (async () => {
      try {
        const response = await fetch(
          `/api/livekit?room=${chatId}&username=${encodeURIComponent(displayName)}&studio=${studioMode}`
        );
        const data = await response.json();
        setToken(data.token);
      } catch (error) {
        console.error("LiveKit token error:", error);
      }
    })();
  }, [user, chatId, studioMode]);

  // Studio mode optimizations
  const roomOptions: RoomOptions = studioMode ? {
    adaptiveStream: true,
    dynacast: true,
    stopLocalTrackOnUnpublish: true,
    // Low latency settings for studio
    videoCaptureDefaults: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      facingMode: 'user'
    },
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 2
    },
    publishDefaults: {
      videoSimulcastLayers: [
        { width: 1920, height: 1080, fps: 30, quality: 100 },
        { width: 1280, height: 720, fps: 30, quality: 80 },
        { width: 640, height: 480, fps: 15, quality: 60 }
      ],
      videoCodec: 'h264',
      audioCodec: 'opus',
      dtx: true,
      red: true
    }
  } : {};

  if (token === "") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {studioMode ? "Loading Studio..." : "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      data-lk-theme="default"
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
      video={video}
      audio={audio}
      options={roomOptions}
    >
      <VideoConference />
    </LiveKitRoom>
  );
};
